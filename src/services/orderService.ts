/**
 * WellNexus Order Service (Admin)
 * Handles all Supabase interactions for order management and commission triggering.
 */

import { supabase } from '@/lib/supabase';
import { adminLogger } from '@/utils/logger';
import { OrderPayload } from '@/types/checkout';

interface OrderMetadata {
    source?: string;
    campaign?: string;
    notes?: string;
    [key: string]: string | number | boolean | undefined;
}

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
    metadata?: OrderMetadata;
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
                is_guest: !customer.userId,
                order_code: payload.orderCode
            }
        };

        const { data, error } = await supabase
            .from('transactions')
            .insert(transactionData)
            .select()
            .single();

        if (error) {
            adminLogger.error('Create order failed', error);
            // Fallback for demo/dev if DB restriction prevents insert
            // Throwing to let UI handle it
            throw error;
        }

        return data.id;
    },

    /**
     * Fetch all pending 'sale' transactions with user details
     * Uses Supabase foreign key join to avoid N+1 query pattern
     */
    async getPendingOrders(): Promise<PendingOrder[]> {
        const { data, error } = await supabase
            .from('transactions')
            .select('id, user_id, amount, created_at, payment_proof_url, currency, status, type, user:users(name, email)')
            .eq('status', 'pending')
            .eq('type', 'sale')
            .order('created_at', { ascending: false });

        if (error) {
            adminLogger.error('Failed to fetch pending orders', error);
            throw error;
        }

        return (data || []).map((order) => {
            const userRaw = order.user;
            const user = Array.isArray(userRaw)
                ? (userRaw[0] as { name: string; email: string } | undefined) ?? { name: 'Unknown', email: '' }
                : (userRaw as unknown as { name: string; email: string } | null) ?? { name: 'Unknown', email: '' };
            return { ...order, user };
        });
    },

    /**
     * Update order status (Approve/Reject)
     * State machine: only 'pending' orders can transition to 'completed' or 'cancelled'
     */
    async updateOrderStatus(orderId: string, status: 'completed' | 'cancelled'): Promise<void> {
        // Atomic state machine guard: only update if currently 'pending'
        // Prevents completed→cancelled or cancelled→completed invalid transitions
        const { error, data } = await supabase
            .from('transactions')
            .update({ status })
            .eq('id', orderId)
            .eq('status', 'pending') // Guard: reject transition from any non-pending state
            .select('id')
            .maybeSingle();

        if (error) {
            adminLogger.error(`Failed to update order ${orderId} status to ${status}`, error);
            throw error;
        }

        if (!data) {
            throw new Error(`Order ${orderId} is not in pending state and cannot be transitioned to ${status}`);
        }
    }
};
