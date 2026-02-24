/**
 * Team Slice - Team Members, Downline, Network Management
 * Part of Store Decomposition (Phase 2 Refactoring)
 */

import { StateCreator } from 'zustand';
import { TeamMember, TeamMetrics, TeamInsights, UserRank, RANK_NAMES } from '../../types';
import { supabase } from '../../lib/supabase';
import { teamLogger } from '../../utils/logger';

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
    joinDate: string;
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
        teamLogger.debug('Fetching team data...');
    },

    fetchDownlineTree: async (userId: string): Promise<TreeNode[]> => {
        try {
            // Using RPC to fetch the entire tree in one query (N+1 query fix)
            const { data, error } = await supabase
                .rpc('get_full_downline_tree', { p_user_id: userId, p_max_depth: 5 });

            if (error) {
                teamLogger.error('fetchDownlineTree rpc failed', error);
                return [];
            }

            if (!data || data.length === 0) return [];

            // Convert flat data array to hierarchical tree
            const nodeMap = new Map();

            // First pass: Create all nodes
            data.forEach((user: any) => {
                nodeMap.set(user.id, {
                    id: user.id,
                    name: user.full_name || user.email || 'Unknown',
                    rank: RANK_NAMES[Number(user.rank_id) as UserRank] || 'CTV',
                    roleId: Number(user.rank_id) || 8,
                    sales: user.total_sales || 0,
                    teamVolume: user.team_volume || 0,
                    avatarUrl: user.avatar_url,
                    joinDate: user.created_at,
                    children: []
                });
            });

            // Second pass: Build hierarchy
            const roots: TreeNode[] = [];
            data.forEach((user: any) => {
                const node = nodeMap.get(user.id);
                // If this node's sponsor is the original requested user, it's a root (F1)
                if (user.sponsor_id === userId) {
                    roots.push(node);
                } else {
                    // Otherwise, attach it to its direct parent
                    const parentNode = nodeMap.get(user.sponsor_id);
                    if (parentNode) {
                        parentNode.children.push(node);
                    }
                }
            });

            return roots;
        } catch (error) {
            teamLogger.error('fetchDownlineTree exception', error);
            return [];
        }
    },

    sendReminder: async (memberId: string) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        teamLogger.info(`Reminder sent to member ${memberId}`);
    },

    sendGift: async (memberId: string, voucherAmount: number) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        teamLogger.info(`Gift voucher of ${voucherAmount} VND sent to member ${memberId}`);
    },
});
