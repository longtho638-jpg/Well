/**
 * Withdrawal Service
 * Handles commission withdrawal requests and processing
 */

import { supabase } from '@/lib/supabase';
import { uiLogger } from '@/utils/logger';
import { PaymentError, ValidationError, fromSupabaseError, getErrorMessage } from '@/utils/errors';
import { emailService } from './email-service';
import { logWithdrawalApproval, logWithdrawalRejection } from './audit-log-service';

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
}

export const withdrawalService = {
  /**
   * Create a new withdrawal request
   */
  async createWithdrawalRequest(
    amount: number,
    bankInfo: BankInfo
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('create_withdrawal_request', {
        p_amount: amount,
        p_bank_name: bankInfo.bankName,
        p_bank_account_number: bankInfo.accountNumber,
        p_bank_account_name: bankInfo.accountName,
      });

      if (error) {
        uiLogger.error('Create withdrawal request failed', error);
        throw new PaymentError(error.message || 'Failed to create withdrawal request', { operation: 'createWithdrawal' });
      }

      const requestId = data; // Returns request ID

      // Send pending email notification
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const { data: userData } = await supabase
            .from('users')
            .select('name')
            .eq('id', user.id)
            .single();

          const userName = userData?.name || 'User';

          await emailService.sendWithdrawalPendingEmail(
            user.email,
            userName,
            amount,
            requestId,
            bankInfo.bankName,
            bankInfo.accountNumber
          );
        }
      } catch (emailError) {
        // Don't fail the whole operation if email fails
        uiLogger.error('Failed to send pending email', emailError);
      }

      return requestId;
    } catch (error) {
      const err = error instanceof Error ? error : fromSupabaseError(error as { message: string; code?: string });
      uiLogger.error('Withdrawal request error', err);
      throw err;
    }
  },

  /**
   * Get user's withdrawal requests
   */
  async getUserWithdrawals(): Promise<WithdrawalRequest[]> {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      uiLogger.error('Fetch withdrawals failed', error);
      throw error;
    }
  },

  /**
   * Get single withdrawal request details
   */
  async getWithdrawalById(id: string): Promise<WithdrawalRequest | null> {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      uiLogger.error('Fetch withdrawal failed', error);
      return null;
    }
  },

  /**
   * Cancel a pending withdrawal request
   */
  async cancelWithdrawal(id: string): Promise<void> {
    try {
      // Get the withdrawal request
      const withdrawal = await this.getWithdrawalById(id);

      if (!withdrawal) {
        throw new ValidationError('Withdrawal request not found');
      }

      if (withdrawal.status !== 'pending') {
        throw new ValidationError(`Cannot cancel withdrawal with status: ${withdrawal.status}`);
      }

      // Update status to cancelled
      const { error: updateError } = await supabase
        .from('withdrawal_requests')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (updateError) throw fromSupabaseError(updateError);

      // Refund amount to user's pending_cashback
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new ValidationError('User not authenticated');

      const { error: refundError } = await supabase.rpc('sql', {
        query: `
          UPDATE users
          SET pending_cashback = COALESCE(pending_cashback, 0) + $1
          WHERE id = $2
        `,
        params: [withdrawal.amount, user.id]
      });

      if (refundError) throw fromSupabaseError(refundError);

    } catch (error) {
      uiLogger.error('Cancel withdrawal failed', error);
      throw error;
    }
  },

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

      if (error) throw fromSupabaseError(error);

      return data || [];
    } catch (error) {
      uiLogger.error('Fetch all withdrawals failed', error);
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
      // Get withdrawal details before processing
      const withdrawal = await this.getWithdrawalById(requestId);
      if (!withdrawal) {
        throw new ValidationError('Withdrawal request not found');
      }

      // Get user details for email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name, email, pending_cashback')
        .eq('id', withdrawal.user_id)
        .single();

      if (userError) {
        uiLogger.error('Failed to fetch user data', userError);
      }

      // Process withdrawal via database function
      const { error } = await supabase.rpc('process_withdrawal_request', {
        p_request_id: requestId,
        p_action: action,
        p_notes: notes || null,
      });

      if (error) {
        uiLogger.error('Process withdrawal failed', error);
        throw new PaymentError(error.message || 'Failed to process withdrawal', { requestId, action });
      }

      // Send email notification if user data is available
      if (userData?.email) {
        const userName = userData.name || 'User';
        const userEmail = userData.email;

        if (action === 'approve') {
          // Log approval to audit trail
          await logWithdrawalApproval(requestId, withdrawal.amount, withdrawal.user_id);

          // Send approval email
          await emailService.sendWithdrawalApprovedEmail(
            userEmail,
            userName,
            withdrawal.amount,
            requestId,
            withdrawal.bank_name,
            withdrawal.bank_account_number
          );
        } else if (action === 'reject') {
          // Log rejection to audit trail
          await logWithdrawalRejection(
            requestId,
            withdrawal.amount,
            withdrawal.user_id,
            notes || 'Không đủ điều kiện rút tiền tại thời điểm này'
          );

          // Send rejection email
          const currentBalance = userData.pending_cashback || 0;
          await emailService.sendWithdrawalRejectedEmail(
            userEmail,
            userName,
            withdrawal.amount,
            requestId,
            notes || 'Không đủ điều kiện rút tiền tại thời điểm này',
            currentBalance
          );
        }
      }
    } catch (error) {
      uiLogger.error('Withdrawal processing error', error);
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

      if (error) throw fromSupabaseError(error);
    } catch (error) {
      uiLogger.error('Complete withdrawal failed', error);
      throw error;
    }
  },

  /**
   * Get withdrawal statistics for user
   */
  async getWithdrawalStats(): Promise<{
    totalRequested: number;
    totalApproved: number;
    totalCompleted: number;
    totalPending: number;
    totalRejected: number;
  }> {
    try {
      const withdrawals = await this.getUserWithdrawals();

      return {
        totalRequested: withdrawals.reduce((sum, w) => sum + w.amount, 0),
        totalApproved: withdrawals
          .filter((w) => w.status === 'approved')
          .reduce((sum, w) => sum + w.amount, 0),
        totalCompleted: withdrawals
          .filter((w) => w.status === 'completed')
          .reduce((sum, w) => sum + w.amount, 0),
        totalPending: withdrawals
          .filter((w) => w.status === 'pending')
          .reduce((sum, w) => sum + w.amount, 0),
        totalRejected: withdrawals
          .filter((w) => w.status === 'rejected')
          .reduce((sum, w) => sum + w.amount, 0),
      };
    } catch (error) {
      uiLogger.error('Fetch withdrawal stats failed', error);
      throw error;
    }
  },
};

export default withdrawalService;
