/**
 * Referral Service
 * Handles MLM network tree and referral data
 */

import { supabase } from '@/lib/supabase';
import { uiLogger } from '@/utils/logger';
import { AuthError, fromSupabaseError } from '@/utils/errors';

export interface NetworkNode {
  id: string;
  name: string;
  rank: 'member' | 'silver' | 'gold' | 'diamond';
  level: number; // F1, F2, etc.
  totalSales: number;
  personalSales: number;
  children?: NetworkNode[];
  attributes?: {
    avatar?: string;
    joinedDate?: string;
    activeDownlines?: number;
  };
}

export interface ReferralTreeData {
  name: string;
  attributes?: {
    rank?: string;
    totalSales?: number;
    avatar?: string;
  };
  children?: ReferralTreeData[];
}

interface SupabaseDownlineRow {
  id?: string;
  user_id?: string;
  name?: string;
  rank?: string;
  level?: number;
  total_sales?: number;
  personal_sales?: number;
  avatar_url?: string;
  created_at?: string;
  active_downlines?: number;
  parent_id?: string | null;
}

export const referralService = {
  /**
   * Get user's downline tree (F1-F7)
   * Calls RPC: get_downline_tree
   */
  async getDownlineTree(userId?: string): Promise<NetworkNode | null> {
    try {
      // If no userId provided, use current user
      let targetUserId = userId;
      if (!targetUserId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new AuthError('User not authenticated');
        targetUserId = user.id;
      }

      const { data, error } = await supabase.rpc('get_downline_tree', {
        p_user_id: targetUserId,
      });

      if (error) {
        uiLogger.error('Get downline tree failed', error);
        throw fromSupabaseError(error);
      }

      // Transform flat RPC response to hierarchical structure
      if (!data || data.length === 0) {
        return null;
      }

      return this.transformToHierarchy(data);
    } catch (error) {
      uiLogger.error('Downline tree error', error);
      throw error;
    }
  },

  /**
   * Transform flat array to hierarchical tree structure
   */
  transformToHierarchy(flatData: SupabaseDownlineRow[]): NetworkNode | null {
    if (!flatData || flatData.length === 0) return null;

    const nodeMap = new Map<string, NetworkNode>();
    let root: NetworkNode | null = null;

    // First pass: create all nodes
    flatData.forEach((item) => {
      const node: NetworkNode = {
        id: item.id || item.user_id || '',
        name: item.name || 'Unknown',
        rank: (item.rank as NetworkNode['rank']) || 'member',
        level: item.level || 1,
        totalSales: item.total_sales || 0,
        personalSales: item.personal_sales || 0,
        children: [],
        attributes: {
          avatar: item.avatar_url,
          joinedDate: item.created_at,
          activeDownlines: item.active_downlines || 0,
        },
      };

      nodeMap.set(node.id, node);

      if (item.level === 1 || !item.parent_id) {
        root = node;
      }
    });

    // Second pass: build parent-child relationships
    flatData.forEach((item) => {
      if (item.parent_id) {
        const parent = nodeMap.get(item.parent_id);
        const child = nodeMap.get(item.id || item.user_id || '');
        if (parent && child) {
          parent.children?.push(child);
        }
      }
    });

    return root;
  },

  /**
   * Transform to react-d3-tree format
   */
  transformToD3Tree(node: NetworkNode | null): ReferralTreeData | null {
    if (!node) return null;

    const d3Node: ReferralTreeData = {
      name: node.name,
      attributes: {
        rank: node.rank,
        totalSales: node.totalSales,
        avatar: node.attributes?.avatar,
      },
    };

    if (node.children && node.children.length > 0) {
      d3Node.children = node.children.map((child) =>
        this.transformToD3Tree(child)
      ).filter((n): n is ReferralTreeData => n !== null);
    }

    return d3Node;
  },

  /**
   * Get referral statistics for user
   */
  async getReferralStats(userId?: string): Promise<{
    totalDownlines: number;
    f1Count: number;
    f2Count: number;
    totalTeamSales: number;
    activeMembers: number;
  }> {
    try {
      let targetUserId = userId;
      if (!targetUserId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new AuthError('User not authenticated');
        targetUserId = user.id;
      }

      const { data, error } = await supabase.rpc('get_referral_stats', {
        p_user_id: targetUserId,
      });

      if (error) {
        uiLogger.error('Get referral stats failed', error);
        // Return default values if stats function doesn't exist yet
        return {
          totalDownlines: 0,
          f1Count: 0,
          f2Count: 0,
          totalTeamSales: 0,
          activeMembers: 0,
        };
      }

      return data || {
        totalDownlines: 0,
        f1Count: 0,
        f2Count: 0,
        totalTeamSales: 0,
        activeMembers: 0,
      };
    } catch (error) {
      uiLogger.error('Referral stats error', error);
      return {
        totalDownlines: 0,
        f1Count: 0,
        f2Count: 0,
        totalTeamSales: 0,
        activeMembers: 0,
      };
    }
  },

  /**
   * Get direct F1 referrals
   */
  async getDirectReferrals(): Promise<NetworkNode[]> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new AuthError('User not authenticated');

      const { data, error } = await supabase
        .from('users')
        .select('id, name, rank, created_at, total_sales, personal_sales')
        .eq('referred_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item) => ({
        id: item.id,
        name: item.name || 'Unknown',
        rank: item.rank || 'member',
        level: 1,
        totalSales: item.total_sales || 0,
        personalSales: item.personal_sales || 0,
        children: [],
        attributes: {
          joinedDate: item.created_at,
        },
      }));
    } catch (error) {
      uiLogger.error('Get direct referrals failed', error);
      throw error;
    }
  },
};

export default referralService;
