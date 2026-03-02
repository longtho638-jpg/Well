import { supabase } from '@/lib/supabase';
import { Transaction, TransactionType } from '../types';
import { createLogger } from '../utils/logger';
import { fromSupabaseError } from '../utils/errors';

const walletLogger = createLogger('WalletService');

export interface WalletData {
    balance: number;
    totalEarnings: number;
    pendingPayout: number;
    taxWithheldTotal: number;
}

interface SupabaseUserWallet {
    shop_balance: number | null;
    pending_cashback: number | null;
}

interface SupabaseTransaction {
    id: string;
    user_id: string;
    date?: string;
    created_at: string;
    amount: number;
    type: string;
    status: 'pending' | 'completed' | 'failed';
    tax_deducted: number | null;
    hash: string | null;
    currency: 'SHOP' | 'GROW' | null;
    metadata: Record<string, unknown> | null;
}

/**
 * WellNexus Wallet Service (Production Grade)
 * Hardened Supabase interactions for financial integrity.
 * Handles fetching balances, transactions, and requesting payouts.
 */
export const walletService = {
    /**
     * Get wallet balance and accounting details for a user
     * @param userId - The UUID of the user
     * @returns Promise<WalletData | null> Wallet details or null if not found
     */
    async getWallet(userId: string): Promise<WalletData | null> {
        try {
            // Fetch wallet data from users table (embedded fields)
            const { data, error } = await supabase
                .from('users')
                .select('shop_balance, pending_cashback')
                .eq('id', userId)
                .single<SupabaseUserWallet>();

            if (error) throw error;

            if (data) {
                return {
                    balance: data.shop_balance || 0,       // Withdrawable balance = shop_balance
                    totalEarnings: (data.shop_balance || 0) + (data.pending_cashback || 0),
                    pendingPayout: data.pending_cashback || 0, // Pending commission not yet settled
                    taxWithheldTotal: 0
                } as WalletData;
            }
            return null;
        } catch (error) {
            walletLogger.error('Error fetching wallet:', error);
            throw error instanceof Error ? error : fromSupabaseError(error as { message: string; code?: string });
        }
    },

    /**
     * Get historical transactions for a user
     * @param userId - The UUID of the user
     * @param limitCount - Max number of transactions to fetch (default: 50)
     * @returns Promise<Transaction[]> List of transactions
     */
    async getTransactions(userId: string, limitCount = 50): Promise<Transaction[]> {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limitCount)
                .returns<SupabaseTransaction[]>();

            if (error) throw error;

            return (data || []).map(t => ({
                id: t.id,
                userId: t.user_id,
                date: t.date || new Date(t.created_at).toISOString().split('T')[0],
                amount: t.amount,
                type: t.type as TransactionType, // Cast string from DB to Enum type
                status: t.status,
                taxDeducted: t.tax_deducted || 0,
                hash: t.hash || '',
                currency: t.currency || 'SHOP',
                metadata: (t.metadata as Record<string, string | number | boolean | undefined>) || {}
            }));
        } catch (error) {
            walletLogger.error('Error fetching transactions:', error);
            throw error instanceof Error ? error : fromSupabaseError(error as { message: string; code?: string });
        }
    },

    /**
     * Subscribe to real-time wallet updates (Using Supabase Realtime)
     * Listens for changes to the 'users' table for the specific user ID.
     *
     * @param userId - The UUID of the user to listen for
     * @param onUpdate - Callback function when data changes
     * @param onError - Callback function when an error occurs
     * @returns Unsubscribe function
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
                    const newData = payload.new as unknown as SupabaseUserWallet;
                    if (newData) {
                        onUpdate({
                            balance: newData.shop_balance || 0,
                            totalEarnings: (newData.shop_balance || 0) + (newData.pending_cashback || 0),
                            pendingPayout: newData.pending_cashback || 0,
                            taxWithheldTotal: 0
                        });
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    walletLogger.debug('Subscribed to wallet updates');
                } else if (status === 'CHANNEL_ERROR') {
                    onError(new Error('Channel subscription failed'));
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    },

    /**
     * Request a payout from the wallet balance
     * Creates a 'Withdrawal' transaction record with 'pending' status.
     *
     * @param userId - The UUID of the user requesting payout
     * @param amount - Amount to withdraw in VND
     * @returns Promise<void>
     */
    async requestPayout(userId: string, amount: number): Promise<void> {
        // Server-side validation: amount must be positive integer, capped at safe limit
        if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
            throw new Error('Invalid payout amount: must be a positive integer');
        }
        if (amount > 500_000_000) {
            throw new Error('Payout amount exceeds maximum limit');
        }

        walletLogger.info(`Initiating payout request: ${amount} VND for user ${userId}`);

        // Use RPC for server-side balance validation (RLS + stored proc enforce constraints)
        const { error } = await supabase.rpc('create_withdrawal_request', {
            p_amount: amount,
            p_bank_name: 'wallet_payout',
            p_bank_account_number: 'internal',
            p_bank_account_name: 'internal',
        });

        if (error) {
            walletLogger.error('Payout request failed', error);
            throw error;
        }
    }
};
