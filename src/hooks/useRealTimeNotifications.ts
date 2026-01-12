/**
 * useRealTimeNotifications - Real-time notification hook
 * Simulates WebSocket for admin notifications
 */

import { useState, useEffect, useCallback } from 'react';

interface RealTimeNotification {
    id: string;
    type: 'order' | 'partner' | 'alert' | 'system';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    actionUrl?: string;
}

interface UseRealTimeNotificationsReturn {
    notifications: RealTimeNotification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
    isConnected: boolean;
}

// Simulated real-time events
const EVENTS = [
    { type: 'order', title: 'Đơn hàng mới', message: 'Khách hàng vừa đặt đơn #', actionUrl: '/admin/orders' },
    { type: 'partner', title: 'Partner mới', message: 'Đã có người đăng ký qua link của bạn', actionUrl: '/admin/partners' },
    { type: 'alert', title: 'Cảnh báo tồn kho', message: 'Sản phẩm sắp hết hàng', actionUrl: '/admin/products' },
    { type: 'system', title: 'Hệ thống', message: 'Cập nhật mới đã sẵn sàng', actionUrl: '/admin' },
];

/**
 * Hook for real-time notifications
 * Uses simulated WebSocket for demo purposes
 */
export function useRealTimeNotifications(): UseRealTimeNotificationsReturn {
    const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    // Simulate WebSocket connection
    useEffect(() => {
        // Connect after mount
        const connectTimeout = setTimeout(() => {
            setIsConnected(true);
        }, 1000);

        // Simulate incoming notifications
        const interval = setInterval(() => {
            const random = Math.random();
            // 20% chance of new notification every 30 seconds
            if (random < 0.2) {
                const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
                const newNotification: RealTimeNotification = {
                    id: `rt_${Date.now()}`,
                    type: event.type as RealTimeNotification['type'],
                    title: event.title,
                    message: event.message + Math.floor(Math.random() * 1000),
                    timestamp: new Date(),
                    read: false,
                    actionUrl: event.actionUrl,
                };

                setNotifications(prev => [newNotification, ...prev].slice(0, 20));
            }
        }, 30000); // Check every 30 seconds

        return () => {
            clearTimeout(connectTimeout);
            clearInterval(interval);
            setIsConnected(false);
        };
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
        isConnected,
    };
}

export default useRealTimeNotifications;
