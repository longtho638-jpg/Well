/**
 * Web push VAPID key conversion, browser support checks, and permission utilities.
 * Extracted from web-push-notification-service.ts to keep that file under 200 LOC.
 */

import { uiLogger } from '@/utils/logger';
import { ValidationError } from '@/utils/errors';

export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/** Convert base64url VAPID key to Uint8Array for PushManager.subscribe */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Returns true if the browser supports push notifications via Service Worker */
export function isPushNotificationSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/** Returns current Notification.permission or 'denied' if API unavailable */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

/** Requests notification permission from the user; throws if API unavailable */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new ValidationError('This browser does not support notifications');
  }
  const permission = await Notification.requestPermission();
  uiLogger.info('Notification permission', { permission });
  return permission;
}
