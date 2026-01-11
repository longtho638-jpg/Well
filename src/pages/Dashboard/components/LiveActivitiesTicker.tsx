/**
 * Live Activities Ticker Component
 * Extracted from Dashboard.tsx for modularity
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Gift,
    ShoppingCart,
    TrendingUp,
    Wallet,
    UserPlus,
    ArrowRight
} from 'lucide-react';
import { useTranslation } from '@/hooks';
import { formatVND } from '@/utils/format';

// Activity types
interface LiveActivity {
    id: string;
    type: 'reward' | 'order' | 'rank_up' | 'withdrawal' | 'referral';
    userName: string;
    message: string;
    timestamp: Date;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    amount?: number;
}

// Vietnamese names for simulation
const vietnameseNames = [
    'Nguyễn Văn Minh', 'Trần Thị Hương', 'Lê Quang Hải', 'Phạm Thu Hà',
    'Hoàng Minh Tuấn', 'Đỗ Thị Lan', 'Vũ Công Phượng', 'Ngô Thị Mai',
    'Bùi Văn Toàn', 'Đinh Thị Ngọc', 'Phan Văn Đức', 'Lý Thị Kim',
    'Trịnh Văn Quyết', 'Võ Thị Sáu', 'Mai Văn Thành', 'Cao Thị Loan',
    'Đặng Văn Lâm', 'Huỳnh Thị Ngân', 'Tô Văn Hùng', 'Lưu Thị Phương'
];

// Generate random activity
function generateRandomActivity(t: (key: string, vars?: Record<string, unknown>) => string): LiveActivity {
    const types: LiveActivity['type'][] = ['reward', 'order', 'rank_up', 'withdrawal', 'referral'];
    const type = types[Math.floor(Math.random() * types.length)];
    const userName = vietnameseNames[Math.floor(Math.random() * vietnameseNames.length)];
    const amount = Math.floor(Math.random() * 5000000) + 100000;

    const configs: Record<LiveActivity['type'], Omit<LiveActivity, 'id' | 'timestamp' | 'userName'>> = {
        reward: {
            type: 'reward',
            message: t('dashboard.activities.reward', { userName, amount: formatVND(amount) }),
            icon: Gift,
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-500/20',
            amount
        },
        order: {
            type: 'order',
            message: t('dashboard.activities.order', { userName, amount: formatVND(amount) }),
            icon: ShoppingCart,
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/20',
            amount
        },
        rank_up: {
            type: 'rank_up',
            message: t('dashboard.activities.rankUp', { userName }),
            icon: TrendingUp,
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/20'
        },
        withdrawal: {
            type: 'withdrawal',
            message: t('dashboard.activities.withdrawal', { userName, amount: formatVND(amount) }),
            icon: Wallet,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/20',
            amount
        },
        referral: {
            type: 'referral',
            message: t('dashboard.activities.referral', { userName }),
            icon: UserPlus,
            color: 'text-pink-400',
            bgColor: 'bg-pink-500/20'
        }
    };

    return {
        id: `activity-${Date.now()}-${Math.random()}`,
        userName,
        timestamp: new Date(),
        ...configs[type]
    };
}

export function LiveActivitiesTicker() {
    const { t } = useTranslation();
    const [activities, setActivities] = useState<LiveActivity[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);

    // Initialize with some activities
    useEffect(() => {
        const initial = Array.from({ length: 5 }, () => generateRandomActivity(t));
        setActivities(initial);
    }, [t]);

    // Add new activity periodically
    useEffect(() => {
        const interval = setInterval(() => {
            setActivities(prev => {
                const newActivity = generateRandomActivity(t);
                return [newActivity, ...prev.slice(0, 9)];
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [t]);

    const displayedActivities = isExpanded ? activities : activities.slice(0, 3);

    return (
        <motion.div
            layout
            className="relative bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800 overflow-hidden"
        >
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <h3 className="font-bold text-white text-sm">{t('dashboard.liveActivities')}</h3>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                    {isExpanded ? 'Thu gọn' : 'Xem thêm'}
                    <ArrowRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>
            </div>

            {/* Activities List */}
            <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                <AnimatePresence mode="popLayout">
                    {displayedActivities.map((activity) => (
                        <motion.div
                            key={activity.id}
                            layout
                            initial={{ opacity: 0, x: -20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors group"
                        >
                            <div className={`p-2 rounded-lg ${activity.bgColor}`}>
                                <activity.icon className={`w-4 h-4 ${activity.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-zinc-300 truncate">{activity.message}</p>
                                <p className="text-xs text-zinc-500">
                                    {new Date(activity.timestamp).toLocaleTimeString('vi-VN')}
                                </p>
                            </div>
                            {activity.amount && (
                                <span className={`text-sm font-bold ${activity.color}`}>
                                    {formatVND(activity.amount)}
                                </span>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
