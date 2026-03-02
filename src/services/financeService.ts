import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { adminLogger } from '@/utils/logger';
import { fromSupabaseError } from '@/utils/errors';

export interface FinanceTransaction {
    id: string;
    type: 'revenue' | 'payout';
    partnerId: string;
    partnerName: string;
    amount: number;
    gross?: number;
    tax?: number;
    net?: number;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
    fraudScore: number;
    timestamp: string;
    reason?: string;
}

/** Row shape returned by Supabase transactions query */
type TransactionRow = { id: string; user_id: string; amount: number; status: string; type: string; created_at: string; tax_amount: number | null; net_amount: number | null };

const DEV_MOCK_TRANSACTIONS: FinanceTransaction[] = import.meta.env.DEV ? [
    { id: 'R001', type: 'revenue', partnerId: 'P001', partnerName: 'Demo User', amount: 15900000, status: 'Completed', fraudScore: 0, timestamp: '2024-11-20 14:30', reason: 'Product Sale' },
    { id: 'W001', type: 'payout', partnerId: 'P001', partnerName: 'Demo User', gross: 5000000, tax: 500000, net: 4500000, amount: 5000000, status: 'Pending', fraudScore: 0, timestamp: '2024-11-20 10:00', reason: 'Commission Withdrawal' },
] : [];

export const financeService = {
    async getTransactions(): Promise<FinanceTransaction[]> {
        if (!isSupabaseConfigured()) {
            return DEV_MOCK_TRANSACTIONS;
        }

        try {
            const { data, error } = await supabase
                .from('transactions')
                .select(`
                    id,
                    user_id,
                    amount,
                    status,
                    type,
                    created_at,
                    tax_amount,
                    net_amount
                `)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            const rows = (data || []) as TransactionRow[];
            const formattedTransactions: FinanceTransaction[] = await Promise.all(
                rows.map(async (tx): Promise<FinanceTransaction> => {
                    let partnerName = 'Unknown';
                    try {
                        const { data: userData, error: userError } = await supabase
                            .from('users')
                            .select('name')
                            .eq('id', tx.user_id)
                            .single();

                        if (!userError && userData) {
                            partnerName = userData.name;
                        }
                    } catch (err) {
                        // User might not exist or other error, fallback to 'Unknown'
                        adminLogger.warn(`Failed to fetch user name for transaction ${tx.id}`, err);
                    }

                    return {
                        id: tx.id,
                        type: tx.type === 'sale' ? 'revenue' : 'payout',
                        partnerId: tx.user_id,
                        partnerName: partnerName,
                        amount: tx.amount,
                        gross: tx.amount,
                        tax: tx.tax_amount || tx.amount * 0.1,
                        net: tx.net_amount || tx.amount * 0.9,
                        status: (tx.status === 'pending' ? 'Pending'
                            : tx.status === 'completed' ? 'Completed'
                                : tx.status === 'approved' ? 'Approved'
                                    : 'Rejected') as FinanceTransaction['status'],
                        fraudScore: 0, // Fraud scoring handled server-side; not available client-side
                        timestamp: new Date(tx.created_at).toLocaleString('vi-VN'),
                        reason: tx.type === 'sale' ? 'Product Sale' : 'Commission Withdrawal',
                    };
                })
            );

            return formattedTransactions;
        } catch (error) {
            adminLogger.error('Failed to fetch transactions', error);
            return [];
        }
    },

    async updateTransactionStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
        if (!isSupabaseConfigured()) return;

        const { error } = await supabase
            .from('transactions')
            .update({ status })
            .eq('id', id);

        if (error) throw fromSupabaseError(error);
    }
};
