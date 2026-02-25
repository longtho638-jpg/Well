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

// Raw transaction row shape returned from Supabase/store
interface RawTransaction {
    id?: string;
    type?: string;
    status?: string;
    amount?: number;
    description?: string;
    created_at?: string;
    metadata?: {
        buyer_name?: string;
        [key: string]: string | number | boolean | undefined;
    };
}

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

    useEffect(() => {
        if (!transactions) return;

        // Map actual transactions to LiveActivity format
        const recentTxs = transactions.slice(0, 10).map((tx: RawTransaction) => {
            let icon = Coins;
            let color = 'text-gray-600';
            let bgColor = 'bg-gray-50 dark:bg-gray-900/20';
            let type: LiveActivity['type'] = 'order';

            if (tx.type === 'direct_commission' || tx.type === 'team_commission') {
                type = 'reward';
                icon = Award;
                color = 'text-yellow-600';
                bgColor = 'bg-yellow-50 dark:bg-yellow-900/20';
            } else if (tx.type === 'withdrawal') {
                type = 'withdrawal';
                icon = TrendingDown;
                color = 'text-blue-600';
                bgColor = 'bg-blue-50 dark:bg-blue-900/20';
            }

            return {
                id: tx.id || `activity-${Date.now()}-${Math.random()}`,
                type,
                userName: tx.metadata?.buyer_name || user.name || 'User',
                user: tx.metadata?.buyer_name || user.name || 'User',
                message: tx.description || t('dashboard.recentActivity.completedQuest'),
                detail: tx.description || t('dashboard.recentActivity.completedQuest'),
                timestamp: new Date(tx.created_at || Date.now()),
                icon,
                color,
                bgColor,
                amount: tx.amount,
                location: 'VN'
            };
        });

        setActivities(recentTxs);
    }, [transactions, t, user.name]);

    const walletStats = useMemo(() => ({
        total: user.shopBalance + (user.estimatedBonus || 0),
        available: user.shopBalance,
        pending: user.estimatedBonus || 0,
        teamVolume: user.teamVolume || 0
    }), [user]);

    const revenueBreakdown = useMemo(() => {
        if (!transactions || transactions.length === 0) {
            return [
                { name: t('dashboard.revenueBreakdown.directSales'), value: 0, color: '#00575A' },
                { name: t('dashboard.revenueBreakdown.teamBonus'), value: 0, color: '#FFBF00' },
                { name: t('dashboard.revenueBreakdown.referral'), value: 0, color: '#22c55e' }
            ];
        }

        // Calculate actual sums from transactions
        let directSum = 0;
        let teamSum = 0;

        transactions.forEach((tx: RawTransaction) => {
            if (tx.status === 'completed') {
                if (tx.type === 'direct_commission') directSum += Number(tx.amount) || 0;
                if (tx.type === 'team_commission') teamSum += Number(tx.amount) || 0;
            }
        });

        return [
            { name: t('dashboard.revenueBreakdown.directSales'), value: directSum, color: '#00575A' },
            { name: t('dashboard.revenueBreakdown.teamBonus'), value: teamSum, color: '#FFBF00' },
            { name: t('dashboard.revenueBreakdown.referral'), value: 0, color: '#22c55e' } // Future spec
        ];
    }, [transactions, t]);

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