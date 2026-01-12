/**
 * Admin Notification Center
 * Phase 4: WOW Features
 * 
 * Bell icon with dropdown notification list:
 * - Unread count badge
 * - Mark as read
 * - Filter by type
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    CheckCircle,
    AlertTriangle,
    Info,
    X,
    Eye,
    Settings,
    Trash2,
    CheckCheck,
} from 'lucide-react';

interface Notification {
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

// Demo notifications
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

const NotificationIcon: React.FC<{ type: Notification['type'] }> = ({ type }) => {
    const config = {
        success: { icon: CheckCircle, className: 'text-emerald-400' },
        warning: { icon: AlertTriangle, className: 'text-amber-400' },
        info: { icon: Info, className: 'text-blue-400' },
        error: { icon: AlertTriangle, className: 'text-red-400' },
    };

    const { icon: Icon, className } = config[type];
    return <Icon className={`w-5 h-5 ${className}`} />;
};

export function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAll = () => {
        setNotifications([]);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-zinc-800 transition-colors"
            >
                <Bell className="w-5 h-5 text-zinc-400" />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
                    >
                        {unreadCount}
                    </motion.span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-80 sm:w-96 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-zinc-100">Notifications</h3>
                                    <p className="text-xs text-zinc-500">
                                        {unreadCount} unread
                                    </p>
                                </div>
                                <div className="flex items-center gap-1">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
                                            title="Mark all as read"
                                        >
                                            <CheckCheck className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Notifications List */}
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Bell className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                                        <p className="text-zinc-500">No notifications</p>
                                    </div>
                                ) : (
                                    notifications.map((notification) => (
                                        <motion.div
                                            key={notification.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className={`p-4 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors ${!notification.read ? 'bg-zinc-800/30' : ''
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <NotificationIcon type={notification.type} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-medium text-zinc-100 text-sm">
                                                            {notification.title}
                                                        </h4>
                                                        {!notification.read && (
                                                            <span className="w-2 h-2 bg-blue-500 rounded-full" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-zinc-400 mt-0.5">
                                                        {notification.message}
                                                    </p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-xs text-zinc-500">
                                                            {notification.timestamp}
                                                        </span>
                                                        {notification.action && (
                                                            <a
                                                                href={notification.action.href}
                                                                className="text-xs text-emerald-400 hover:underline"
                                                            >
                                                                {notification.action.label}
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {!notification.read && (
                                                        <button
                                                            onClick={() => markAsRead(notification.id)}
                                                            className="p-1 text-zinc-500 hover:text-zinc-100 rounded transition-colors"
                                                            title="Mark as read"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => deleteNotification(notification.id)}
                                                        className="p-1 text-zinc-500 hover:text-red-400 rounded transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <div className="p-3 border-t border-zinc-800 flex items-center justify-between">
                                    <button
                                        onClick={clearAll}
                                        className="text-xs text-zinc-500 hover:text-zinc-100 transition-colors"
                                    >
                                        Clear all
                                    </button>
                                    <a
                                        href="/admin/audit-log"
                                        className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                                    >
                                        <Settings className="w-3 h-3" />
                                        View all activity
                                    </a>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export default NotificationCenter;
