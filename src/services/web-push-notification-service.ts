/**
 * Web Push Notifications Service
 * Handles push notification subscriptions and messaging
 */

import { supabase } from '@/lib/supabase';
import { uiLogger } from '@/utils/logger';
import { ValidationError } from '@/utils/errors';

// VAPID public key - set this in production
// Generate keys with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Convert base64 VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Check if browser supports push notifications
 */
export function isPushNotificationSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new ValidationError('This browser does not support notifications');
  }

  const permission = await Notification.requestPermission();
  uiLogger.info('Notification permission', { permission });
  return permission;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(): Promise<PushSubscriptionData | null> {
  try {
    // Check browser support
    if (!isPushNotificationSupported()) {
      throw new ValidationError('Push notifications are not supported');
    }

    // Request permission
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      uiLogger.warn('Push notification permission denied');
      return null;
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      if (!VAPID_PUBLIC_KEY) {
        throw new ValidationError('VAPID public key not configured');
      }

      const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as BufferSource,
      });
    }

    // Convert subscription to JSON
    const subscriptionJSON = subscription.toJSON();
    const subscriptionData: PushSubscriptionData = {
      endpoint: subscriptionJSON.endpoint!,
      keys: {
        p256dh: subscriptionJSON.keys!.p256dh!,
        auth: subscriptionJSON.keys!.auth!,
      },
    };

    // Save subscription to database
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: subscriptionData,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      uiLogger.info('Push subscription saved', { userId: user.id });
    }

    return subscriptionData;
  } catch (error) {
    uiLogger.error('Failed to subscribe to push notifications', error);
    throw error;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    if (!isPushNotificationSupported()) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();

      // Remove from database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id);

        uiLogger.info('Push subscription removed', { userId: user.id });
      }
    }

    return true;
  } catch (error) {
    uiLogger.error('Failed to unsubscribe from push notifications', error);
    return false;
  }
}

/**
 * Check if user is currently subscribed
 */
export async function isPushSubscribed(): Promise<boolean> {
  try {
    if (!isPushNotificationSupported()) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    return subscription !== null;
  } catch (error) {
    uiLogger.error('Failed to check push subscription status', error);
    return false;
  }
}

/**
 * Show a test notification (requires permission)
 */
export async function showTestNotification(title: string, body: string): Promise<void> {
  if (!('Notification' in window)) {
    throw new ValidationError('Notifications not supported');
  }

  if (Notification.permission !== 'granted') {
    throw new ValidationError('Notification permission not granted');
  }

  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification(title, {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'test-notification',
    requireInteraction: false,
  });
}
