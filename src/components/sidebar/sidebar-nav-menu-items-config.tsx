/**
 * sidebar-nav-menu-items-config
 * Builds and returns the navigation menu items array for the Sidebar component,
 * including conditional admin entry based on current user role/email
 */

import {
    LayoutDashboard, ShoppingBag, Wallet, Sparkles, Bot,
    Users, Share2, Trophy, Heart, Megaphone, Activity,
    Shield, Settings,
} from 'lucide-react';
import React from 'react';
import { isAdmin as checkIsAdmin } from '@/utils/admin-check';
import { useTranslation } from '@/hooks';
import { useStore } from '@/store';

export interface MenuItem {
    path: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    matches?: string[];
    badge?: string;
}

export function useSidebarNavMenuItems(): MenuItem[] {
    const { t } = useTranslation();
    const { user } = useStore();
    const isAdmin = checkIsAdmin(user?.email) || user?.role === 'admin' || user?.isAdmin === true;

    const items: MenuItem[] = [
        { path: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
        { path: '/dashboard/marketplace', label: t('nav.marketplace'), icon: ShoppingBag, matches: ['/dashboard/product'] },
        { path: '/dashboard/wallet', label: t('nav.wallet'), icon: Wallet },
        { path: '/dashboard/leaderboard', label: t('nav.leaderboard'), icon: Trophy, badge: 'HOT' },
        { path: '/dashboard/marketing-tools', label: t('nav.marketingTools'), icon: Megaphone, badge: 'NEW' },
        { path: '/dashboard/agents', label: t('nav.agentDashboard'), icon: Activity },
        { path: '/dashboard/health-check', label: t('nav.healthCheck'), icon: Heart },
        { path: '/dashboard/health-coach', label: t('nav.healthCoach'), icon: Sparkles, badge: 'AI' },
        { path: '/dashboard/copilot', label: t('nav.copilot'), icon: Bot, badge: 'AI' },
        { path: '/dashboard/team', label: t('nav.team'), icon: Users },
        { path: '/dashboard/network', label: t('nav.network'), icon: Users },
        { path: '/dashboard/withdrawal', label: t('nav.withdrawal'), icon: Wallet },
        { path: '/dashboard/referral', label: t('nav.referral'), icon: Share2 },
        { path: '/dashboard/settings', label: t('nav.settings'), icon: Settings },
        ...(isAdmin ? [{ path: '/admin', label: t('nav.admin'), icon: Shield, badge: 'ADMIN' }] : []),
    ];

    return items;
}
