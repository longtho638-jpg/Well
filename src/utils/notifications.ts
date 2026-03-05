/**
 * Browser Notifications Utilities
 * Phase 16: Keyboard and Gestures
 */

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// PERMISSION CHECK
// ============================================================================

export type NotificationPermission = 'default' | 'granted' | 'denied';

export function getNotificationPermission(): NotificationPermission {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
}

export function isNotificationSupported(): boolean {
    return 'Notification' in window;
}

// ============================================================================
// REQUEST PERMISSION
// ============================================================================

export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!isNotificationSupported()) return 'denied';

    try {
        const permission = await Notification.requestPermission();
        return permission;
    } catch {
        return 'denied';
    }
}

// ============================================================================
// SEND NOTIFICATION
// ============================================================================

export interface NotificationOptions {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    requireInteraction?: boolean;
    silent?: boolean;
    data?: unknown;
    onClick?: () => void;
    onClose?: () => void;
    onError?: () => void;
}

export function sendNotification(
    title: string,
    options: NotificationOptions = {}
): Notification | null {
    if (!isNotificationSupported() || getNotificationPermission() !== 'granted') {
        return null;
    }

    const { onClick, onClose, onError, ...notificationOptions } = options;

    try {
        const notification = new Notification(title, {
            ...notificationOptions,
            icon: notificationOptions.icon || '/icon-192.webp',
        });

        if (onClick) {
            notification.onclick = () => {
                window.focus();
                notification.close();
                onClick();
            };
        }

        if (onClose) notification.onclose = onClose;
        if (onError) notification.onerror = onError;

        return notification;
    } catch {
        return null;
    }
}

// ============================================================================
// NOTIFICATION HOOK
// ============================================================================

interface UseNotificationsReturn {
    permission: NotificationPermission;
    isSupported: boolean;
    requestPermission: () => Promise<NotificationPermission>;
    notify: (title: string, options?: NotificationOptions) => Notification | null;
}

export function useNotifications(): UseNotificationsReturn {
    const [permission, setPermission] = useState<NotificationPermission>(
        getNotificationPermission()
    );

    useEffect(() => {
        // Update permission if it changes
        const checkPermission = () => {
            setPermission(getNotificationPermission());
        };

        // Check periodically (permissions can change)
        const interval = setInterval(checkPermission, 10000);
        return () => clearInterval(interval);
    }, []);

    const requestPermissionAndUpdate = useCallback(async () => {
        const result = await requestNotificationPermission();
        setPermission(result);
        return result;
    }, []);

    const notify = useCallback((title: string, options?: NotificationOptions) => {
        return sendNotification(title, options);
    }, []);

    return {
        permission,
        isSupported: isNotificationSupported(),
        requestPermission: requestPermissionAndUpdate,
        notify,
    };
}

// ============================================================================
// WELLNEXUS NOTIFICATION HELPERS
// ============================================================================

export const appNotifications = {
    order: (orderId: string, amount: string) => sendNotification(
        'Đơn hàng mới! 🎉',
        {
            body: `Đơn hàng #${orderId} - ${amount}`,
            tag: 'order',
            onClick: () => window.location.href = `/orders/${orderId}`,
        }
    ),

    commission: (amount: string) => sendNotification(
        'Hoa hồng mới! 💰',
        {
            body: `Bạn vừa nhận được ${amount} hoa hồng`,
            tag: 'commission',
            onClick: () => window.location.href = '/wallet',
        }
    ),

    teamMember: (name: string) => sendNotification(
        'Thành viên mới! 👥',
        {
            body: `${name} vừa gia nhập đội ngũ của bạn`,
            tag: 'team',
            onClick: () => window.location.href = '/network',
        }
    ),

    rankUp: (rankName: string) => sendNotification(
        'Thăng hạng! 🏆',
        {
            body: `Chúc mừng bạn đã đạt cấp ${rankName}!`,
            tag: 'rank',
            requireInteraction: true,
            onClick: () => window.location.href = '/dashboard',
        }
    ),
};
