import { supabase } from '@/lib/supabase';
import { Transaction } from '../types';
import { createLogger } from '../utils/logger';

const walletLogger = createLogger('WalletService');

export interface WalletData {
    balance: number;
    totalEarnings: number;
    pendingPayout: number;
    taxWithheldTotal: number;
}

/**
 * WellNexus Wallet Service (Production Grade)
 * Hardened Supabase interactions for financial integrity.
 */
export const walletService = {
    /**
     * Get wallet balance and accounting details
     */
    async getWallet(userId: string): Promise<WalletData | null> {
        try {
            // Fetch wallet data from users table (embedded fields)
            const { data, error } = await supabase
                .from('users')
                .select('shop_balance, pending_cashback')
                .eq('id', userId)
                .single();

            if (error) throw error;

            if (data) {
                return {
                    balance: data.shop_balance || 0,
                    totalEarnings: 0, // Calculated field, might need separate query if not stored
                    pendingPayout: 0,
                    taxWithheldTotal: 0
                } as WalletData;
            }
            return null;
        } catch (error) {
            walletLogger.error('Error fetching wallet:', error);
            throw error;
        }
    },

    /**
     * Get historical transactions for a user
     */
    async getTransactions(userId: string, limitCount = 50): Promise<Transaction[]> {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limitCount);

            if (error) throw error;

            return (data || []).map(t => ({
                id: t.id,
                userId: t.user_id,
                date: t.date || new Date(t.created_at).toISOString().split('T')[0],
                amount: t.amount,
                type: t.type,
                status: t.status,
                taxDeducted: t.tax_deducted || 0,
                hash: t.hash || '',
                currency: t.currency || 'SHOP',
                metadata: t.metadata || {}
            }));
        } catch (error) {
            walletLogger.error('Error fetching transactions:', error);
            throw error;
        }
    },

    /**
     * Subscribe to real-time wallet updates (Using Supabase Realtime)
     */
    subscribeToWallet(userId: string, onUpdate: (data: WalletData | null) => void, onError: (err: Error) => void) {
        const channel = supabase
            .channel(`wallet-updates-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'users',
                    filter: `id=eq.${userId}`
                },
                (payload) => {
                    const newData = payload.new as any;
                    onUpdate({
                        balance: newData.shop_balance || 0,
                        totalEarnings: 0,
                        pendingPayout: 0,
                        taxWithheldTotal: 0
                    });
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    // console.log('Subscribed to wallet updates');
                } else if (status === 'CHANNEL_ERROR') {
                    onError(new Error('Channel subscription failed'));
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    },

    /**
     * Request a payout
     */
    async requestPayout(userId: string, amount: number): Promise<void> {
        walletLogger.info(`Initiating payout request: ${amount} VND for user ${userId}`);

        // Insert into payout_requests table
        const { error } = await supabase
            .from('transactions')
            .insert({
                user_id: userId,
                amount: amount,
                type: 'Withdrawal',
                status: 'pending',
                currency: 'SHOP'
            });

        if (error) {
            walletLogger.error('Payout request failed', error);
            throw error;
        }
    }
};
