import { supabase } from '@/lib/supabase';
import { UserRank } from '@/types';
import { adminLogger } from '@/utils/logger';

export interface Partner {
    id: string;
    name: string;
    email: string;
    rank: UserRank;
    roleId: number;
    totalSales: number;
    pendingCashback: number;
    pointBalance: number;
    joinDate: string;
    status: 'Active' | 'Banned' | 'Dormant';
    lastActivity: string;
    avatarUrl?: string;
}

interface SupabaseUserRecord {
    id: string;
    name?: string;
    email?: string;
    role_id?: number;
    total_sales?: number;
    pending_cashback?: number;
    point_balance?: number;
    created_at: string;
    updated_at?: string;
    avatar_url?: string;
}

/**
 * Partner Service
 * Handles data orchestrations for Partner CRM (Bee 3.0)
 */
export const partnerService = {
    /**
     * Fetch all partners from Supabase
     */
    async fetchPartners(): Promise<Partner[]> {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return (data || []).map((user: SupabaseUserRecord) => ({
                id: user.id,
                name: user.name || 'Unknown',
                email: user.email || '',
                rank: (user.role_id as UserRank) || UserRank.CTV,
                roleId: user.role_id || 8,
                totalSales: user.total_sales || 0,
                pendingCashback: user.pending_cashback || 0,
                pointBalance: user.point_balance || 0,
                joinDate: new Date(user.created_at).toLocaleDateString('vi-VN'),
                status: 'Active', // Default status for UI
                lastActivity: new Date(user.updated_at || user.created_at).toLocaleDateString('vi-VN'),
                avatarUrl: user.avatar_url
            }));
        } catch (error) {
            adminLogger.error('Failed to fetch partners', error);
            throw error;
        }
    },

    /**
     * Update a single partner's record
     */
    async updatePartner(id: string, updates: Partial<SupabaseUserRecord>): Promise<void> {
        try {
            const { error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            adminLogger.info(`Updated partner ${id}`, updates);
        } catch (error) {
            adminLogger.error(`Failed to update partner ${id}`, error);
            throw error;
        }
    },

    /**
     * Bulk update partner statuses (Mock implementation for now)
     */
    async bulkUpdateStatus(ids: string[], status: 'Active' | 'Banned'): Promise<void> {
        try {
            // In a real scenario, this would be a Supabase RPC or bulk update
            adminLogger.info(`Bulk updating ${ids.length} partners to ${status}`);
            // Simulating API latency
            await new Promise(resolve => setTimeout(resolve, 800));
        } catch (error) {
            adminLogger.error('Bulk update failed', error);
            throw error;
        }
    }
};
