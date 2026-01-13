import { useState, useCallback, useMemo } from 'react';

export interface Notification {
    id: string;
    type: 'success' | 'warning' | 'info' | 'error';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    action?: {
        label: string;
        href: string;
    };
}

const DEMO_NOTIFICATIONS: Notification[] = [
    {
        id: 'n1',
        type: 'success',
        title: 'New Partner Joined',
        message: 'Nguyễn Văn A has joined your network',
        timestamp: '5 phút trước',
        read: false,
    },
    {
        id: 'n2',
        type: 'warning',
        title: 'Low Stock Alert',
        message: 'ANIMA 119 only has 5 units remaining',
        timestamp: '15 phút trước',
        read: false,
        action: { label: 'View Products', href: '/admin/products' },
    },
    {
        id: 'n3',
        type: 'info',
        title: 'Pending Order',
        message: '3 orders waiting for approval',
        timestamp: '1 giờ trước',
        read: true,
        action: { label: 'Review Orders', href: '/admin/orders' },
    },
    {
        id: 'n4',
        type: 'error',
        title: 'Payment Failed',
        message: 'Withdrawal request W-001 was rejected by bank',
        timestamp: '2 giờ trước',
        read: true,
    },
];

export function useNotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS);

    const unreadCount = useMemo(() =>
        notifications.filter(n => !n.read).length,
        [notifications]);

    const toggleOpen = useCallback(() => setIsOpen(prev => !prev), []);
    const close = useCallback(() => setIsOpen(false), []);

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const deleteNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
        setIsOpen(false);
    }, []);

    return {
        isOpen,
        notifications,
        unreadCount,
        toggleOpen,
        close,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll
    };
}
