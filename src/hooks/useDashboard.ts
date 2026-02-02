/**
 * WellNexus Dashboard State Orchestration Hook
 * Manages live telemetry, financial stats, and activity streams.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '@/store';
import { useTranslation } from '@/hooks';
import { TranslationKey } from './useTranslation';
import {
    Coins,
    ShoppingBag,
    Award,
    TrendingDown,
    Gift,
    CheckCircle2,
    Users,
    Package,
    Crown,
    Target,
    Star,
    Zap,
    type LucideIcon
} from 'lucide-react';
import { formatVND, formatNumber } from '@/utils/format';

export interface LiveActivity {
    id: string;
    type: 'reward' | 'order' | 'rank_up' | 'withdrawal' | 'referral';
    userName: string;
    message: string;
    timestamp: Date;
    icon: LucideIcon;
    color: string;
    bgColor: string;
    amount?: number;
    // Aligning types for consistency across components
    user?: string;
    detail?: string;
    location?: string;
}

const vietnameseNames = [
    'Nguyễn Văn Minh', 'Trần Thị Hương', 'Lê Quang Hải', 'Phạm Thu Hà',
    'Hoàng Minh Tuấn', 'Đỗ Thị Lan', 'Vũ Công Phượng', 'Ngô Thị Mai',
    'Bùi Văn Toàn', 'Đinh Thị Ngọc', 'Phan Văn Đức', 'Lý Thị Kim',
    'Trịnh Văn Quyết', 'Võ Thị Sáu', 'Mai Văn Thành', 'Cao Thị Loan',
    'Đặng Văn Lâm', 'Huỳnh Thị Ngân', 'Tô Văn Hùng', 'Lưu Thị Phương'
];

export function useDashboard() {
    const { t } = useTranslation();
    const { user, revenueData, products, transactions } = useStore();
    const [activities, setActivities] = useState<LiveActivity[]>([]);

    const generateActivity = useCallback((): LiveActivity => {
        const randomName = vietnameseNames[Math.floor(Math.random() * vietnameseNames.length)];
        const activityTypes: Array<LiveActivity['type']> = ['reward', 'order', 'rank_up', 'withdrawal', 'referral'];
        const randomType = activityTypes[Math.floor(Math.random() * activityTypes.length)];

        const activityTemplates = {
            reward: {
                icon: Coins,
                color: 'text-yellow-600',
                bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
                messages: [
                    { key: 'dashboard.liveActivities.activities.earnedGrow', amount: Math.floor(Math.random() * 900) + 100 },
                    { key: 'dashboard.liveActivities.activities.rewardedGrow', amount: Math.floor(Math.random() * 1500) + 500 },
                    { key: 'dashboard.liveActivities.activities.teamBonusGrow', amount: Math.floor(Math.random() * 2000) + 800 }
                ] as { key: TranslationKey; amount?: number }[]
            },
            order: {
                icon: ShoppingBag,
                color: 'text-green-600',
                bgColor: 'bg-green-50 dark:bg-green-900/20',
                messages: [
                    { key: 'dashboard.liveActivities.activities.completedOrder', amount: Math.floor(Math.random() * 8000000) + 2000000 },
                    { key: 'dashboard.liveActivities.activities.soldSuccess', amount: Math.floor(Math.random() * 15000000) + 5000000 },
                    { key: 'dashboard.liveActivities.activities.finishedOrder', amount: Math.floor(Math.random() * 20000000) + 10000000 }
                ] as { key: TranslationKey; amount?: number }[]
            },
            rank_up: {
                icon: Award,
                color: 'text-purple-600',
                bgColor: 'bg-purple-50 dark:bg-purple-900/20',
                messages: [
                    { key: 'dashboard.liveActivities.activities.rankedUpGold' },
                    { key: 'dashboard.liveActivities.activities.rankedUpPartner' },
                    { key: 'dashboard.liveActivities.activities.rankedUpFounder' },
                    { key: 'dashboard.liveActivities.activities.rankedUpSilver' }
                ] as { key: TranslationKey; amount?: number }[]
            },
            withdrawal: {
                icon: TrendingDown,
                color: 'text-blue-600',
                bgColor: 'bg-blue-50 dark:bg-blue-900/20',
                messages: [
                    { key: 'dashboard.liveActivities.activities.withdrew', amount: Math.floor(Math.random() * 30000000) + 10000000 },
                    { key: 'dashboard.liveActivities.activities.transferredSuccess', amount: Math.floor(Math.random() * 50000000) + 20000000 }
                ] as { key: TranslationKey; amount?: number }[]
            },
            referral: {
                icon: Gift,
                color: 'text-pink-600',
                bgColor: 'bg-pink-50 dark:bg-pink-900/20',
                messages: [
                    { key: 'dashboard.liveActivities.activities.referredPartner' },
                    { key: 'dashboard.liveActivities.activities.referralBonus', amount: Math.floor(Math.random() * 5000000) + 1000000 },
                    { key: 'dashboard.liveActivities.activities.teamExpanded' }
                ] as { key: TranslationKey; amount?: number }[]
            }
        };

        const template = activityTemplates[randomType];
        const randomMessage = template.messages[Math.floor(Math.random() * template.messages.length)];
        let messageText = t(randomMessage.key);
        const amount = 'amount' in randomMessage ? randomMessage.amount : undefined;

        if (amount !== undefined) {
            const formattedAmount = randomType === 'reward' ? formatNumber(amount) : formatVND(amount);
            messageText = t(randomMessage.key, { amount: formattedAmount });
        }

        return {
            id: `activity-${Date.now()}-${Math.random()}`,
            type: randomType,
            userName: randomName,
            user: randomName, // Alias for compatibility
            message: messageText,
            detail: messageText, // Alias for compatibility
            timestamp: new Date(),
            icon: template.icon,
            color: template.color,
            bgColor: template.bgColor,
            amount,
            location: 'HCM' // Default location
        };
    }, [t]);

    useEffect(() => {
        setActivities(Array.from({ length: 5 }, () => generateActivity()));
        const interval = setInterval(() => {
            setActivities(prev => [generateActivity(), ...prev].slice(0, 10));
        }, Math.random() * 2000 + 3000);
        return () => clearInterval(interval);
    }, [generateActivity]);

    const walletStats = useMemo(() => ({
        total: user.shopBalance + (user.estimatedBonus || 0),
        available: user.shopBalance,
        pending: user.estimatedBonus || 0,
        teamVolume: user.teamVolume || 0
    }), [user]);

    const revenueBreakdown = useMemo(() => [
        { name: t('dashboard.revenueBreakdown.directSales'), value: user.totalSales * 0.7, color: '#00575A' },
        { name: t('dashboard.revenueBreakdown.teamBonus'), value: user.totalSales * 0.25, color: '#FFBF00' },
        { name: t('dashboard.revenueBreakdown.referral'), value: user.totalSales * 0.05, color: '#22c55e' }
    ], [user.totalSales, t]);

    const recentActivities = useMemo(() => [
        {
            icon: CheckCircle2,
            label: t('dashboard.recentActivity.completedQuest'),
            time: t('dashboard.recentActivity.hoursAgo', { hours: 2 }),
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10'
        },
        {
            icon: Users,
            label: t('dashboard.recentActivity.newTeamMember'),
            time: t('dashboard.recentActivity.hoursAgo', { hours: 5 }),
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            icon: Package,
            label: t('dashboard.recentActivity.productShipped'),
            time: t('dashboard.recentActivity.daysAgo', { days: 1 }),
            color: 'text-purple-500',
            bg: 'bg-purple-500/10'
        },
        {
            icon: Award,
            label: t('dashboard.recentActivity.reachedRank'),
            time: t('dashboard.recentActivity.daysAgo', { days: 3 }),
            color: 'text-amber-500',
            bg: 'bg-amber-500/10'
        }
    ], [t]);

    const achievements = useMemo(() => [
        {
            icon: Crown,
            label: t('dashboard.achievements.topSeller'),
            unlocked: true,
            color: 'from-yellow-400 to-amber-600'
        },
        {
            icon: Target,
            label: t('dashboard.achievements.goalCrusher'),
            unlocked: true,
            color: 'from-blue-400 to-cyan-600'
        },
        {
            icon: Star,
            label: t('dashboard.achievements.teamLeader'),
            unlocked: false,
            color: 'from-zinc-500 to-zinc-700'
        },
        {
            icon: Zap,
            label: t('dashboard.achievements.speedDemon'),
            unlocked: false,
            color: 'from-zinc-500 to-zinc-700'
        }
    ], [t]);

    return {
        user,
        revenueData,
        products,
        transactions,
        activities,
        walletStats,
        revenueBreakdown,
        recentActivities,
        achievements,
        t
    };
}