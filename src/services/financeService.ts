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

interface SupabaseTransactionRow {
    id: string;
    user_id: string;
    amount: number;
    status: string;
    type: string;
    created_at: string;
    tax_amount: number | null;
    net_amount: number | null;
}

const mockTransactions: FinanceTransaction[] = [
    {
        id: 'R001',
        type: 'revenue',
        partnerId: 'P001',
        partnerName: 'Lan Nguyen',
        amount: 15900000,
        status: 'Completed',
        fraudScore: 12,
        timestamp: '2024-11-20 14:30',
        reason: 'ANIMA 119 Sale',
    },
    {
        id: 'W001',
        type: 'payout',
        partnerId: 'P001',
        partnerName: 'Lan Nguyen',
        gross: 5000000,
        tax: 500000,
        net: 4500000,
        amount: 5000000,
        status: 'Pending',
        fraudScore: 15,
        timestamp: '2024-11-20 10:00',
        reason: 'Commission Withdrawal',
    },
    {
        id: 'W002',
        type: 'payout',
        partnerId: 'P002',
        partnerName: 'Minh Tran',
        gross: 3200000,
        tax: 320000,
        net: 2880000,
        amount: 3200000,
        status: 'Pending',
        fraudScore: 8,
        timestamp: '2024-11-20 09:30',
        reason: 'Commission Withdrawal',
    },
];

export const financeService = {
    async getTransactions(): Promise<FinanceTransaction[]> {
        if (!isSupabaseConfigured()) {
            return mockTransactions;
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
                .limit(50)
                .returns<SupabaseTransactionRow[]>();

            if (error) throw error;

            const formattedTransactions: FinanceTransaction[] = await Promise.all(
                (data || []).map(async (tx): Promise<FinanceTransaction> => {
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

            return formattedTransactions.length > 0 ? formattedTransactions : mockTransactions;
        } catch (error) {
            adminLogger.error('Failed to fetch transactions', error);
            return mockTransactions;
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
