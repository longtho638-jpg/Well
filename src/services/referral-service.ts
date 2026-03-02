/**
 * Referral Service
 * Handles MLM network tree and referral data
 */

import { supabase } from '@/lib/supabase';
import { uiLogger } from '@/utils/logger';
import { AuthError, fromSupabaseError } from '@/utils/errors';
import { UserRank } from '@/types';
import {
  NetworkNode,
  ReferralTreeData,
  SupabaseDownlineRow,
  ReferralStats,
  transformToHierarchy,
  transformToD3Tree,
} from './referral-service-network-tree-types';

export type { NetworkNode, ReferralTreeData, ReferralStats };

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
      if (!data || (data as unknown[]).length === 0) {
        return null;
      }

      return transformToHierarchy(data as unknown as SupabaseDownlineRow[]);
    } catch (error) {
      uiLogger.error('Downline tree error', error);
      throw error;
    }
  },

  /**
   * Get referral statistics for user
   */
  async getReferralStats(userId?: string): Promise<ReferralStats> {
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

      return (data as unknown as ReferralStats) || {
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
        // Assuming user.rank is a number (UserRank enum), we cast to string or handle it
        rank: String(item.rank) || 'member',
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
  /**
   * Add a new member under a sponsor
   * Centralizes supabase.auth.signUp so components don't call it directly
   */
  async addMember(params: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    roleId?: number;
    sponsorId: string;
  }): Promise<void> {
    const { error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          name: params.name,
          role_id: params.roleId ?? UserRank.CTV, // Default to CTV (Collaborator)
          sponsor_id: params.sponsorId,
          phone: params.phone,
        },
      },
    });
    if (error) throw error;
  },

  /** Delegate to standalone transformToHierarchy (backward compatibility) */
  transformToHierarchy,
  /** Delegate to standalone transformToD3Tree (backward compatibility) */
  transformToD3Tree,
};

export default referralService;
