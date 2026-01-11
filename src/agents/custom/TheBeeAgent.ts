import { BaseAgent } from '../core/BaseAgent';
import { AgentDefinition } from '@/types/agentic';
import { UserRank } from '@/types';

/** Transaction input for TheBeeAgent */
interface BeeTransactionInput {
  amount: number;
  type: string;
}

/** Result from TheBeeAgent execution */
interface BeeRewardResult {
  success?: boolean;
  error?: string;
  originalAmount?: number;
  appliedRate?: number;
  rewardAmount?: number;
  currency?: string;
  message?: string;
}

/**
 * The Bee - Reward Engine Agent.
 * Handles point calculations, distribution, and gamification triggers.
 * "Float like a butterfly, sting like a bee" - Ali.
 */
export class TheBeeAgent extends BaseAgent {
  constructor() {
    const definition: AgentDefinition = {
      agent_name: 'The Bee',
      business_function: 'Finance & FP&A', // Fits best for reward/financial logic
      primary_objectives: [
        'Calculate and distribute Nexus Points/GROW tokens for transactions',
        'Ensure accurate reward allocation based on user rank',
        'Trigger gamification events (notifications, streaks)',
      ],
      inputs: [
        { source: 'orders_table', dataType: 'events' }, // Webhook trigger in prod
        { source: 'transaction_details', dataType: 'API' },
      ],
      tools_and_systems: [
        'Supabase Database (Wallets, Transactions)',
        'Notification Service',
      ],
      core_actions: [
        'calculateReward',
        'distributePoints',
        'notifyUser',
      ],
      outputs: [
        'transaction_record',
        'wallet_update',
        'notification_payload',
      ],
      success_kpis: [
        { name: 'Reward Accuracy', target: 100, current: 100, unit: '%' },
        { name: 'Processing Latency', target: 200, current: 50, unit: 'ms' },
        { name: 'Points Distributed', target: 1000000, current: 0, unit: 'pts' },
      ],
      risk_and_failure_modes: [
        'Double spending/crediting',
        'Incorrect percentage calculation',
        'Database lock contention',
      ],
      human_in_the_loop_points: [
        'Unusual high-value point distributions (> 1M points)',
        'Suspicious activity patterns',
      ],
      policy_and_constraints: [
        { rule: 'Never modify user balance without audit log', enforcement: 'hard' },
        { rule: 'Double check transaction hash uniqueness', enforcement: 'hard' },
        {
          rule: 'Standard reward rate is 5% of total VND value',
          enforcement: 'hard',
        },
        {
          rule: 'Rewards strictly for "completed" orders only',
          enforcement: 'hard',
        },
      ],
      visibility: 'all'
    };

    super(definition);
  }

  /**
   * Execute reward logic.
   */
  async execute(input: { action: string; transaction?: BeeTransactionInput; userRank?: UserRank | string }): Promise<BeeRewardResult> {
    const { action, transaction, userRank } = input;

    const canProceed = await this.checkPolicies(action, input);
    if (!canProceed) {
      return { error: 'Action blocked by policy' };
    }

    try {
      let output;

      switch (action) {
        case 'processReward':
          if (!transaction) throw new Error('Transaction required for processing');
          output = this.processReward(transaction, userRank ?? UserRank.CTV);
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      this.log(action, input, output);

      // Update KPI: Points Distributed
      const pointsKpi = this.definition.success_kpis.find(k => k.name === 'Points Distributed');
      if (pointsKpi && output.rewardAmount) {
        pointsKpi.current = (pointsKpi.current || 0) + output.rewardAmount;
      }

      return output;
    } catch (error) {
      const errorOutput = { error: error instanceof Error ? error.message : 'Unknown error' };
      this.log(action, input, errorOutput);
      return errorOutput;
    }
  }

  /**
   * Calculate and return reward details.
   * FIX: Now uses UserRank enum for proper rank matching.
   * 
   * Reward tiers:
   * - Base (CTV): 5%
   * - Mid (DAI_SU - DAI_SU_DIAMOND): 6%
   * - Top (PHUONG_HOANG - THIEN_LONG): 8%
   */
  private processReward(transaction: { amount: number; type: string }, rank: UserRank | string) {
    // Base rate: 5%
    let rate = 0.05;

    // Convert string to number if needed (for backward compatibility)
    const rankNum = typeof rank === 'number' ? rank : UserRank.CTV;

    // Rank multipliers (Gamification) - Using UserRank enum
    // DAI_SU (6) to DAI_SU_DIAMOND (3) get 6%
    if (rankNum <= UserRank.DAI_SU && rankNum >= UserRank.DAI_SU_DIAMOND) {
      rate = 0.06; // +1%
    }
    // PHUONG_HOANG (2) and THIEN_LONG (1) get 8%
    if (rankNum <= UserRank.PHUONG_HOANG) {
      rate = 0.08; // +3%
    }

    const rewardAmount = Math.floor(transaction.amount * rate);

    return {
      success: true,
      originalAmount: transaction.amount,
      appliedRate: rate,
      rewardAmount: rewardAmount,
      currency: 'GROW', // or Nexus Points
      message: `Ting ting! Bạn vừa nhận được ${rewardAmount.toLocaleString()} Points từ đơn hàng này.`
    };
  }
}

