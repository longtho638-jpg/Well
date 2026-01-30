/**
 * WellNexus Order Service (Admin)
 * Handles all Supabase interactions for order management and commission triggering.
 */

import { supabase } from '@/lib/supabase';
import { adminLogger } from '@/utils/logger';
import { OrderPayload } from '@/types/checkout';

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
    metadata?: any;
}

export const orderService = {
    /**
     * Create a new order (guest or authenticated)
     */
    async createOrder(payload: OrderPayload): Promise<string> {
        const { items, customer, paymentMethod, totalAmount } = payload;

        // Prepare transaction data
        // Note: user_id is null for guests. Ensure DB 'transactions.user_id' is nullable
        // or RLS policies allow public insert with metadata.
        const transactionData = {
            user_id: customer.userId || null,
            amount: totalAmount,
            type: 'sale', // standard sale type
            status: 'pending',
            currency: 'VND',
            created_at: new Date().toISOString(),
            metadata: {
                guest_profile: customer.guestProfile,
                items: items,
                payment_method: paymentMethod,
                is_guest: !customer.userId
            }
        };

        const { data, error } = await supabase
            .from('transactions')
            .insert(transactionData)
            .select()
            .single();

        if (error) {
            console.error('Create order failed', error);
            // Fallback for demo/dev if DB restriction prevents insert
            // Throwing to let UI handle it
            throw error;
        }

        return data.id;
    },

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
