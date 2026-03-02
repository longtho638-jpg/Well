/**
 * notification-center-notification-item-card
 * Single notification row card sub-component with icon, content, and action buttons
 * used inside the NotificationCenter dropdown panel
 */

import { FC } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, Eye, Trash2 } from 'lucide-react';
import { Notification } from '../../hooks/useNotificationCenter';

const NotificationIcon: FC<{ type: Notification['type'] }> = ({ type }) => {
    const config = {
        success: { icon: CheckCircle, className: 'text-emerald-400' },
        warning: { icon: AlertTriangle, className: 'text-amber-400' },
        info: { icon: Info, className: 'text-blue-400' },
        error: { icon: AlertTriangle, className: 'text-red-400' },
    };
    const { icon: Icon, className } = config[type];
    return <Icon className={`w-5 h-5 ${className}`} />;
};

interface NotificationItemCardProps {
    notification: Notification;
    onRead: (id: string) => void;
    onDelete: (id: string) => void;
}

export const NotificationItemCard: FC<NotificationItemCardProps> = ({
    notification,
    onRead,
    onDelete,
}) => (
    <motion.div
        layout
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`p-4 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors group ${!notification.read ? 'bg-zinc-800/30' : ''}`}
    >
        <div className="flex items-start gap-4">
            <div className="mt-1">
                <NotificationIcon type={notification.type} />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-zinc-100 text-sm truncate">{notification.title}</h4>
                    {!notification.read && (
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    )}
                </div>

                <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed font-medium">
                    {notification.message}
                </p>

                <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                        {notification.timestamp}
                    </span>
                    {notification.action && (
                        <a
                            href={notification.action.href}
                            className="text-[10px] font-black text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest flex items-center gap-1 group/link"
                        >
                            {notification.action.label}
                            <span className="group-hover/link:translate-x-1 transition-transform">→</span>
                        </a>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {!notification.read && (
                    <button
                        onClick={() => onRead(notification.id)}
                        className="p-1.5 text-zinc-600 hover:text-zinc-100 bg-zinc-800/50 rounded-lg transition-all"
                        title="Mark as read"
                    >
                        <Eye className="w-3.5 h-3.5" />
                    </button>
                )}
                <button
                    onClick={() => onDelete(notification.id)}
                    className="p-1.5 text-zinc-600 hover:text-red-400 bg-zinc-800/50 rounded-lg transition-all"
                    title="Delete"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    </motion.div>
);
