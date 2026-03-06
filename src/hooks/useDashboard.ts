/**
 * WellNexus Dashboard State Orchestration Hook — composes store data with activity, revenue breakdown, and achievement builders
 */

import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/store';
import { useTranslation } from '@/hooks';
import {
    buildActivitiesFromTransactions,
    buildRevenueBreakdown,
    buildRecentActivities,
    buildAchievements,
    type LiveActivity,
} from './use-dashboard-activity-and-revenue-breakdown-builders';

export type { LiveActivity };

export function useDashboard() {
    const { t } = useTranslation();
    const { user, revenueData, products, transactions } = useStore();
    const [activities, setActivities] = useState<LiveActivity[]>([]);

    useEffect(() => {
        if (!transactions) return;
        setActivities(
            buildActivitiesFromTransactions(
                transactions,
                user.name,
                t('dashboard.recentActivity.completedQuest')
            )
        );
    }, [transactions, t, user.name]);

    const walletStats = useMemo(() => ({
        total: user.shopBalance + (user.estimatedBonus || 0),
        available: user.shopBalance,
        pending: user.estimatedBonus || 0,
        teamVolume: user.teamVolume || 0,
    }), [user.shopBalance, user.estimatedBonus, user.teamVolume]); // Removed entire user object dep

    const revenueBreakdown = useMemo(() => {
        if (!transactions || transactions.length === 0) {
            return [
                { name: t('dashboard.revenueBreakdown.directSales'), value: 0, color: '#00575A' },
                { name: t('dashboard.revenueBreakdown.teamBonus'), value: 0, color: '#FFBF00' },
                { name: t('dashboard.revenueBreakdown.referral'), value: 0, color: '#22c55e' },
            ];
        }
        return buildRevenueBreakdown(transactions, {
            directSales: t('dashboard.revenueBreakdown.directSales'),
            teamBonus: t('dashboard.revenueBreakdown.teamBonus'),
            referral: t('dashboard.revenueBreakdown.referral'),
        });
    }, [transactions, t]);

    const recentActivities = useMemo(() => buildRecentActivities(t), [t]);
    const achievements = useMemo(() => buildAchievements(t), [t]);

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
        t,
    };
}
