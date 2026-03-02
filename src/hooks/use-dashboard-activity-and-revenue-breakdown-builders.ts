/**
 * Dashboard Activity and Revenue Breakdown Builders — maps raw transactions to LiveActivity, computes revenue breakdown, and builds static recent-activity and achievement lists
 */

import {
    Coins,
    Award,
    TrendingDown,
    CheckCircle2,
    Users,
    Package,
    Crown,
    Target,
    Star,
    Zap,
    type LucideIcon,
} from 'lucide-react';

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
    user?: string;
    detail?: string;
    location?: string;
}

export function buildActivitiesFromTransactions(
    transactions: RawTransaction[],
    userName: string,
    fallbackMessage: string
): LiveActivity[] {
    return transactions.slice(0, 10).map((tx) => {
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

        const displayName = tx.metadata?.buyer_name || userName || 'User';
        const message = tx.description || fallbackMessage;

        return {
            id: tx.id || `activity-${Date.now()}-${Math.random()}`,
            type,
            userName: displayName,
            user: displayName,
            message,
            detail: message,
            timestamp: new Date(tx.created_at || Date.now()),
            icon,
            color,
            bgColor,
            amount: tx.amount,
            location: 'VN',
        };
    });
}

interface RevenueBreakdownItem {
    name: string;
    value: number;
    color: string;
}

export function buildRevenueBreakdown(
    transactions: RawTransaction[],
    labels: { directSales: string; teamBonus: string; referral: string }
): RevenueBreakdownItem[] {
    let directSum = 0;
    let teamSum = 0;

    transactions.forEach((tx) => {
        if (tx.status === 'completed') {
            if (tx.type === 'direct_commission') directSum += Number(tx.amount) || 0;
            if (tx.type === 'team_commission') teamSum += Number(tx.amount) || 0;
        }
    });

    return [
        { name: labels.directSales, value: directSum, color: '#00575A' },
        { name: labels.teamBonus, value: teamSum, color: '#FFBF00' },
        { name: labels.referral, value: 0, color: '#22c55e' },
    ];
}

interface RecentActivityItem {
    icon: LucideIcon;
    label: string;
    time: string;
    color: string;
    bg: string;
}

export function buildRecentActivities(t: (key: string, opts?: Record<string, unknown>) => string): RecentActivityItem[] {
    return [
        { icon: CheckCircle2, label: t('dashboard.recentActivity.completedQuest'), time: t('dashboard.recentActivity.hoursAgo', { hours: 2 }), color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { icon: Users, label: t('dashboard.recentActivity.newTeamMember'), time: t('dashboard.recentActivity.hoursAgo', { hours: 5 }), color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { icon: Package, label: t('dashboard.recentActivity.productShipped'), time: t('dashboard.recentActivity.daysAgo', { days: 1 }), color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { icon: Award, label: t('dashboard.recentActivity.reachedRank'), time: t('dashboard.recentActivity.daysAgo', { days: 3 }), color: 'text-amber-500', bg: 'bg-amber-500/10' },
    ];
}

interface AchievementItem {
    icon: LucideIcon;
    label: string;
    unlocked: boolean;
    color: string;
}

export function buildAchievements(t: (key: string) => string): AchievementItem[] {
    return [
        { icon: Crown, label: t('dashboard.achievements.topSeller'), unlocked: true, color: 'from-yellow-400 to-amber-600' },
        { icon: Target, label: t('dashboard.achievements.goalCrusher'), unlocked: true, color: 'from-blue-400 to-cyan-600' },
        { icon: Star, label: t('dashboard.achievements.teamLeader'), unlocked: false, color: 'from-zinc-500 to-zinc-700' },
        { icon: Zap, label: t('dashboard.achievements.speedDemon'), unlocked: false, color: 'from-zinc-500 to-zinc-700' },
    ];
}
