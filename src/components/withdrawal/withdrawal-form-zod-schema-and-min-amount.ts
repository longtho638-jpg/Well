/**
 * Withdrawal form zod validation schema builder and minimum withdrawal constant.
 * Extracted from withdrawal-form.tsx to keep that component under 200 LOC.
 */

import { z } from 'zod';

export const MIN_WITHDRAWAL = 2_000_000; // 2M VND

/**
 * Builds the withdrawal zod schema with dynamic min/max based on available balance.
 * Must be called inside a React hook (useMemo) so t() runs in component context.
 */
export function buildWithdrawalSchema(
  pendingCashback: number,
  t: (key: string) => string
) {
  return z.object({
    amount: z.number()
      .min(MIN_WITHDRAWAL, t('withdrawal.minAmountError') || `Minimum withdrawal is ${new Intl.NumberFormat('vi-VN').format(MIN_WITHDRAWAL)} đ`)
      .max(pendingCashback, t('withdrawal.insufficientBalance') || 'Insufficient balance'),
    bankName: z.string().min(1, t('withdrawal.bankRequired') || 'Bank name is required'),
    accountNumber: z.string().min(5, t('withdrawal.accountNumberRequired') || 'Valid account number is required'),
    accountName: z.string().min(2, t('withdrawal.accountNameRequired') || 'Account holder name is required'),
  });
}

export type WithdrawalFormData = ReturnType<typeof buildWithdrawalSchema>['_output'];
