import { supabase } from '@/lib/supabase';
import { withdrawalsLogger } from '@/lib/logger';

export interface BankInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  requested_at: string;
  processed_at?: string;
  processed_by?: string;
  rejection_reason?: string;
  notes?: string;
  user?: {
    name: string;
    email: string;
  };
}

export const withdrawalService = {
  /**
   * Admin: Get all withdrawal requests
   */
  async getAllWithdrawals(status?: string): Promise<WithdrawalRequest[]> {
    try {
      let query = supabase
        .from('withdrawal_requests')
        .select('*, user:users(name, email)');

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      withdrawalsLogger.error('Fetch all withdrawals failed', error);
      throw error;
    }
  },

  /**
   * Admin: Process withdrawal request (approve or reject)
   */
  async processWithdrawal(
    requestId: string,
    action: 'approve' | 'reject',
    notes?: string
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('process_withdrawal_request', {
        p_request_id: requestId,
        p_action: action,
        p_notes: notes || null,
      });

      if (error) {
        withdrawalsLogger.error('Process withdrawal failed', error);
        throw new Error(error.message || 'Failed to process withdrawal');
      }
    } catch (error) {
      withdrawalsLogger.error('Withdrawal processing error', error);
      throw error;
    }
  },

  /**
   * Admin: Mark withdrawal as completed (after bank transfer)
   */
  async completeWithdrawal(requestId: string, notes?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'completed',
          notes: notes,
        })
        .eq('id', requestId);

      if (error) throw error;
    } catch (error) {
      withdrawalsLogger.error('Complete withdrawal failed', error);
      throw error;
    }
  },

  /**
   * Get stats for admin dashboard
   */
  async getWithdrawalStats(): Promise<{
    pendingAmount: number;
    pendingCount: number;
    approvedAmount: number;
    completedAmount: number;
    rejectedAmount: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('status, amount');

      if (error) throw error;

      const stats = (data || []).reduce((acc: {
        pendingAmount: number;
        pendingCount: number;
        approvedAmount: number;
        completedAmount: number;
        rejectedAmount: number;
      }, curr: { status: string; amount: number | null }) => {
        const amount = curr.amount || 0;
        switch (curr.status) {
          case 'pending':
            acc.pendingAmount += amount;
            acc.pendingCount += 1;
            break;
          case 'approved':
            acc.approvedAmount += amount;
            break;
          case 'completed':
            acc.completedAmount += amount;
            break;
          case 'rejected':
            acc.rejectedAmount += amount;
            break;
        }
        return acc;
      }, {
        pendingAmount: 0,
        pendingCount: 0,
        approvedAmount: 0,
        completedAmount: 0,
        rejectedAmount: 0
      });

      return stats;
    } catch (error) {
      withdrawalsLogger.error('Fetch withdrawal stats failed', error);
      throw error;
    }
  }
};

export default withdrawalService;
