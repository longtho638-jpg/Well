/**
 * Team Slice - Team Members, Downline, Network Management
 * Part of Store Decomposition (Phase 2 Refactoring)
 */

import { StateCreator } from 'zustand';
import { TeamMember, TeamMetrics, TeamInsights, UserRank, RANK_NAMES } from '../../types';
import { supabase } from '../../lib/supabase';

// ============================================================================
// TREE NODE TYPE
// ============================================================================

export interface TreeNode {
    id: string;
    name: string;
    rank: string;
    roleId: number;
    sales: number;
    teamVolume: number;
    avatarUrl?: string;
    joinDate?: string;
    children: TreeNode[];
}

// ============================================================================
// SLICE TYPES
// ============================================================================

export interface TeamState {
    teamMembers: TeamMember[];
    teamMetrics: TeamMetrics;
    teamInsights: TeamInsights;
}

export interface TeamActions {
    fetchTeamData: () => Promise<void>;
    fetchDownlineTree: (userId: string) => Promise<TreeNode[]>;
    sendReminder: (memberId: string) => Promise<void>;
    sendGift: (memberId: string, voucherAmount: number) => Promise<void>;
}

export type TeamSlice = TeamState & TeamActions;

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const defaultTeamMetrics: TeamMetrics = {
    totalMembers: 0,
    activeMembers: 0,
    totalTeamVolume: 0,
    monthlyGrowth: 0,
    averageSalesPerMember: 0,
    topPerformers: [],
};

export const defaultTeamInsights: TeamInsights = {
    atRiskMembers: [],
    totalAtRisk: 0,
    highRiskCount: 0,
    mediumRiskCount: 0,
    retentionRate: 0,
};

// ============================================================================
// SLICE CREATOR
// ============================================================================

export const createTeamSlice: StateCreator<
    TeamSlice,
    [],
    [],
    TeamSlice
> = (set, get) => ({
    teamMembers: [],
    teamMetrics: defaultTeamMetrics,
    teamInsights: defaultTeamInsights,

    fetchTeamData: async () => {
        // Placeholder - implement actual Supabase fetch
        console.log('[TeamSlice] Fetching team data...');
    },

    fetchDownlineTree: async (userId: string): Promise<TreeNode[]> => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, name, role_id, total_sales, team_volume, avatar_url, created_at')
                .eq('sponsor_id', userId);

            if (error) {
                console.error('fetchDownlineTree error:', error);
                return [];
            }

            if (!data || data.length === 0) return [];

            const nodes = await Promise.all(
                data.map(async (user) => ({
                    id: user.id,
                    name: user.name || 'Unknown',
                    rank: RANK_NAMES[user.role_id as UserRank] || 'CTV',
                    roleId: user.role_id || 8,
                    sales: user.total_sales || 0,
                    teamVolume: user.team_volume || 0,
                    avatarUrl: user.avatar_url,
                    joinDate: user.created_at,
                    children: await get().fetchDownlineTree(user.id)
                }))
            );

            return nodes;
        } catch (error) {
            console.error('fetchDownlineTree exception:', error);
            return [];
        }
    },

    sendReminder: async (memberId: string) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`[TeamSlice] Reminder sent to member ${memberId}`);
    },

    sendGift: async (memberId: string, voucherAmount: number) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`[TeamSlice] Gift voucher of ${voucherAmount} VND sent to member ${memberId}`);
    },
});
