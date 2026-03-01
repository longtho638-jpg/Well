/**
 * Commission lookup tool for agents
 * Queries distributor commission data from Supabase by time period
 */
import { z } from 'zod';
import type { AgentTool } from './agent-tool-types';
import { supabase } from '@/lib/supabase';

const CommissionParamsSchema = z.object({
  period: z.enum(['today', '7d', '30d', 'all']),
  userId: z.string(),
});

type CommissionParams = z.infer<typeof CommissionParamsSchema>;

interface CommissionResult {
  totalEarned: number;
  directSales: number;
  teamBonus: number;
  transactionCount: number;
}

export const commissionTool: AgentTool<CommissionParams, CommissionResult> = {
  name: 'getCommissions',
  description: 'Lấy dữ liệu hoa hồng của nhà phân phối theo kỳ (period: today|7d|30d|all)',
  parameters: CommissionParamsSchema,
  execute: async ({ period, userId }) => {
    const now = new Date();
    let startDate: string;

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'all':
        startDate = '2020-01-01T00:00:00Z';
        break;
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', userId)
      .gte('created_at', startDate);

    if (error) throw new Error(`Commission query failed: ${error.message}`);

    const transactions = data ?? [];
    return {
      totalEarned: transactions.reduce((sum, t) => sum + (t.amount ?? 0), 0),
      directSales: transactions
        .filter(t => t.type === 'Direct Sale')
        .reduce((sum, t) => sum + (t.amount ?? 0), 0),
      teamBonus: transactions
        .filter(t => t.type === 'Team Volume Bonus')
        .reduce((sum, t) => sum + (t.amount ?? 0), 0),
      transactionCount: transactions.length,
    };
  },
};
