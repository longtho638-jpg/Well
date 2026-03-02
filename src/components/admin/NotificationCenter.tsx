/**
 * Admin Notification Center (Refactored)
 * Standardized components for high-performance admin alerts.
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    X,
    Settings,
    CheckCheck,
} from 'lucide-react';
import { useTranslation } from '@/hooks';

// Hooks
import { useNotificationCenter } from '../../hooks/useNotificationCenter';
import { NotificationItemCard } from './notification-center-notification-item-card';

export function NotificationCenter() {
    const { t } = useTranslation();
    const {
        isOpen,
        notifications,
        unreadCount,
        toggleOpen,
        close,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll
    } = useNotificationCenter();

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={toggleOpen}
                className={`relative p-2.5 rounded-xl transition-all duration-300 ${isOpen ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                    }`}
            >
                <Bell className={`w-5 h-5 transition-transform duration-500 ${isOpen ? 'scale-110 rotate-12' : ''}`} />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-black rounded-lg flex items-center justify-center border-2 border-zinc-950 shadow-lg"
                    >
                        {unreadCount}
                    </motion.span>
                )}
            </button>

            {/* Dropdown Content */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={close}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    close();
                                }
                            }}
                            aria-label="Close notification panel"
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 12, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="absolute right-0 mt-4 w-96 bg-zinc-900 border border-white/5 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] z-50 overflow-hidden backdrop-blur-3xl"
                        >
                            {/* Panel Header */}
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-white tracking-tight">{t('notificationcenter.notifications')}</h3>
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">
                                        {unreadCount} {t('notificationcenter.actions_required')}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="p-2 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all"
                                            title="Mark all as read"
                                        >
                                            <CheckCheck className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={close}
                                        className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Notifications Scroll Area */}
                            <div className="max-h-[28rem] overflow-y-auto no-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="px-12 py-20 text-center">
                                        <div className="w-16 h-16 bg-zinc-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                            <Bell className="w-8 h-8 text-zinc-600" />
                                        </div>
                                        <p className="text-zinc-500 font-bold">{t('notificationcenter.no_new_activity')}</p>
                                        <p className="text-zinc-600 text-xs mt-2 font-medium">{t('notificationcenter.we_ll_notify_you_when_somethin')}</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col">
                                        {notifications.map((notification) => (
                                            <NotificationItemCard
                                                key={notification.id}
                                                notification={notification}
                                                onRead={markAsRead}
                                                onDelete={deleteNotification}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Panel Footer */}
                            {notifications.length > 0 && (
                                <div className="p-4 bg-zinc-950/30 border-t border-white/5 flex items-center justify-between">
                                    <button
                                        onClick={clearAll}
                                        className="text-[10px] font-black text-zinc-600 hover:text-red-400 transition-colors uppercase tracking-[0.2em] px-2"
                                    >
                                        {t('notificationcenter.clear_history')}</button>
                                    <a
                                        href="/admin/audit-log"
                                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
                                    >
                                        <Settings className="w-3 h-3" />
                                        {t('notificationcenter.audit_center')}</a>
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
