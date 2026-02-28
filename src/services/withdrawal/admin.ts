import { supabase } from '@/lib/supabase';
import { uiLogger } from '@/utils/logger';
import { PaymentError, ValidationError, fromSupabaseError } from '@/utils/errors';
import { emailService } from '../email-service';
import { logWithdrawalApproval, logWithdrawalRejection } from '../audit-log-service';
import { SupabaseWithdrawalRow, WithdrawalRequest } from './types';
import { getWithdrawalById } from './client';

export async function getAllWithdrawals(status?: string): Promise<WithdrawalRequest[]> {
  try {
    let query = supabase
      .from('withdrawal_requests')
      .select('*, user:users(name, email)');

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .returns<SupabaseWithdrawalRow[]>();

    if (error) throw fromSupabaseError(error);

    return (data || []).map(row => ({
      id: row.id,
      user_id: row.user_id,
      amount: row.amount,
      status: row.status as WithdrawalRequest['status'],
      bank_name: row.bank_name,
      bank_account_number: row.bank_account_number,
      bank_account_name: row.bank_account_name,
      requested_at: row.created_at,
      created_at: row.created_at,
      notes: row.notes || undefined,
      user: row.user || undefined,
    }));
  } catch (error) {
    uiLogger.error('Fetch all withdrawals failed', error);
    throw error;
  }
}

export async function processWithdrawal(
  requestId: string,
  action: 'approve' | 'reject',
  notes?: string
): Promise<void> {
  try {
    const withdrawal = await getWithdrawalById(requestId);
    if (!withdrawal) throw new ValidationError('Withdrawal request not found');

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('name, email, pending_cashback')
      .eq('id', withdrawal.user_id)
      .single();

    if (userError) uiLogger.error('Failed to fetch user data', userError);

    const { error } = await supabase.rpc('process_withdrawal_request', {
      p_request_id: requestId,
      p_action: action,
      p_notes: notes || null,
    });

    if (error) {
      uiLogger.error('Process withdrawal failed', error);
      throw new PaymentError(error.message || 'Failed to process withdrawal', { requestId, action });
    }

    if (userData?.email) {
      const userName = userData.name || 'User';
      const userEmail = userData.email;

      if (action === 'approve') {
        await logWithdrawalApproval(requestId, withdrawal.amount, withdrawal.user_id);
        await emailService.sendWithdrawalApprovedEmail(
          userEmail,
          userName,
          withdrawal.amount,
          requestId,
          withdrawal.bank_name,
          withdrawal.bank_account_number
        );
      } else if (action === 'reject') {
        await logWithdrawalRejection(requestId, withdrawal.amount, withdrawal.user_id, notes || 'Không đủ điều kiện rút tiền tại thời điểm này');
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
}

export async function completeWithdrawal(requestId: string, notes?: string): Promise<void> {
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
}
