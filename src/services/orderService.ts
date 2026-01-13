/**
 * WellNexus Order Service (Admin)
 * Handles all Supabase interactions for order management and commission triggering.
 */

import { supabase } from '@/lib/supabase';
import { adminLogger } from '@/utils/logger';

export interface PendingOrder {
    id: string;
    user_id: string;
    amount: number;
    created_at: string;
    payment_proof_url?: string;
    currency: string;
    status: string;
    type: string;
    user: {
        name: string;
        email: string;
    };
}

export const orderService = {
    /**
     * Fetch all pending 'sale' transactions with user details
     */
    async getPendingOrders(): Promise<PendingOrder[]> {
        const { data, error } = await supabase
            .from('transactions')
            .select('id, user_id, amount, created_at, payment_proof_url, currency, status, type')
            .eq('status', 'pending')
            .eq('type', 'sale')
            .order('created_at', { ascending: false });

        if (error) {
            adminLogger.error('Failed to fetch pending orders', error);
            throw error;
        }

        // Fetch user details for each order sequentially to avoid heavy joins on client
        // In a high-traffic production env, this would be a single RPC or View
        const ordersWithUsers = await Promise.all(
            (data || []).map(async (order) => {
                const { data: userData } = await supabase
                    .from('users')
                    .select('name, email')
                    .eq('id', order.user_id)
                    .single();

                return {
                    ...order,
                    user: userData || { name: 'Unknown', email: '' }
                };
            })
        );

        return ordersWithUsers;
    },

    /**
     * Update order status (Approve/Reject)
     */
    async updateOrderStatus(orderId: string, status: 'completed' | 'cancelled'): Promise<void> {
        const { error } = await supabase
            .from('transactions')
            .update({ status })
            .eq('id', orderId);

        if (error) {
            adminLogger.error(`Failed to update order ${orderId} status to ${status}`, error);
            throw error;
        }
    }
};
