import { uiLogger } from '@/utils/logger';
import { getUserWithdrawals } from './client';

export async function getWithdrawalStats(): Promise<{
  totalRequested: number;
  totalApproved: number;
  totalCompleted: number;
  totalPending: number;
  totalRejected: number;
}> {
  try {
    const withdrawals = await getUserWithdrawals();

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
}
