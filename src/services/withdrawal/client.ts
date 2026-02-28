import { supabase } from '@/lib/supabase';
import { uiLogger } from '@/utils/logger';
import { PaymentError, ValidationError, fromSupabaseError } from '@/utils/errors';
import { emailService } from '../email-service';
import { BankInfo, SupabaseWithdrawalRow, WithdrawalRequest } from './types';

export async function createWithdrawalRequest(
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

    const requestId = data as string;

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
      uiLogger.error('Failed to send pending email', emailError);
    }

    return requestId;
  } catch (error) {
    const err = error instanceof Error ? error : fromSupabaseError(error as { message: string; code?: string });
    uiLogger.error('Withdrawal request error', err);
    throw err;
  }
}

export async function getUserWithdrawals(): Promise<WithdrawalRequest[]> {
  try {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .returns<SupabaseWithdrawalRow[]>();

    if (error) throw error;

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
    }));
  } catch (error) {
    uiLogger.error('Fetch withdrawals failed', error);
    throw error;
  }
}

export async function getWithdrawalById(id: string): Promise<WithdrawalRequest | null> {
  try {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', id)
      .single<SupabaseWithdrawalRow>();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      user_id: data.user_id,
      amount: data.amount,
      status: data.status as WithdrawalRequest['status'],
      bank_name: data.bank_name,
      bank_account_number: data.bank_account_number,
      bank_account_name: data.bank_account_name,
      requested_at: data.created_at,
      created_at: data.created_at,
      notes: data.notes || undefined,
    };
  } catch (error) {
    uiLogger.error('Fetch withdrawal failed', error);
    return null;
  }
}

export async function cancelWithdrawal(id: string): Promise<void> {
  try {
    const withdrawal = await getWithdrawalById(id);
    if (!withdrawal) throw new ValidationError('Withdrawal request not found');
    if (withdrawal.status !== 'pending') throw new ValidationError(`Cannot cancel withdrawal with status: ${withdrawal.status}`);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new ValidationError('User not authenticated');

    const { error: cancelError } = await supabase.rpc('cancel_withdrawal_request', {
      p_request_id: id,
      p_user_id: user.id,
    });

    if (cancelError) {
      uiLogger.error('cancel_withdrawal_request RPC failed, using fallback', cancelError);
      const { error: updateError } = await supabase
        .from('withdrawal_requests')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .eq('status', 'pending');

      if (updateError) throw fromSupabaseError(updateError);

      const { error: refundError } = await supabase.rpc('increment_pending_balance', {
        x_user_id: user.id,
        x_amount: withdrawal.amount,
      });

      if (refundError) throw fromSupabaseError(refundError);
    }
  } catch (error) {
    uiLogger.error('Cancel withdrawal failed', error);
    throw error;
  }
}
