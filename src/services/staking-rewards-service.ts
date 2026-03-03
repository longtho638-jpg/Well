import { supabase } from '@/lib/supabase';
import { fromSupabaseError } from '@/utils/errors';
import { createLogger } from '@/utils/logger';

const stakingLogger = createLogger('StakingService');

export interface StakingPosition {
  id: string;
  userId: string;
  amount: number;
  token: 'GROW';
  lockPeriod: 30 | 90 | 180 | 365;
  apy: number;
  stakedAt: string;
  unlocksAt: string;
  earnedRewards: number;
  status: 'active' | 'completed' | 'cancelled';
}

export interface RewardsLedgerEntry {
  id: string;
  userId: string;
  type: 'staking_reward' | 'commission_bonus' | 'rank_bonus' | 'referral_bonus';
  amount: number;
  token: 'SHOP' | 'GROW';
  status: 'pending' | 'claimed' | 'expired';
  earnedAt: string;
  claimedAt: string | null;
  sourceId: string | null;
}

export interface StakingTier {
  lockPeriod: 30 | 90 | 180 | 365;
  apy: number;
  minAmount: number;
  label: string;
}

export const STAKING_TIERS: StakingTier[] = [
  { lockPeriod: 30, apy: 8, minAmount: 100, label: 'Flexible (30 ngay)' },
  { lockPeriod: 90, apy: 12, minAmount: 500, label: 'Standard (90 ngay)' },
  { lockPeriod: 180, apy: 18, minAmount: 1000, label: 'Premium (180 ngay)' },
  { lockPeriod: 365, apy: 25, minAmount: 5000, label: 'Diamond (365 ngay)' },
];

function calcRewards(amount: number, apy: number, days: number): number {
  return Math.floor(amount * (apy / 100) * (days / 365));
}
function unlockDate(lockPeriod: number): string {
  const d = new Date();
  d.setDate(d.getDate() + lockPeriod);
  return d.toISOString();
}
function daysElapsed(stakedAt: string): number {
  return Math.floor((Date.now() - new Date(stakedAt).getTime()) / 86400000);
}

export const stakingService = {
  async getPositions(userId: string): Promise<StakingPosition[]> {
    try {
      const { data, error } = await supabase
        .from('staking_positions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw fromSupabaseError(error);
      return (data ?? []).map(row => ({
        id: row.id as string,
        userId: row.user_id as string,
        amount: row.amount as number,
        token: 'GROW' as const,
        lockPeriod: row.lock_period as StakingPosition['lockPeriod'],
        apy: row.apy as number,
        stakedAt: row.created_at as string,
        unlocksAt: row.unlocks_at as string,
        earnedRewards: calcRewards(
          row.amount as number,
          row.apy as number,
          Math.min(row.lock_period as number, daysElapsed(row.created_at as string)),
        ),
        status: row.status as StakingPosition['status'],
      }));
    } catch {
      const stored = localStorage.getItem(`wellnexus_staking_${userId}`);
      return stored ? (JSON.parse(stored) as StakingPosition[]) : [];
    }
  },

  async createPosition(
    userId: string,
    amount: number,
    lockPeriod: 30 | 90 | 180 | 365,
  ): Promise<StakingPosition> {
    const tier = STAKING_TIERS.find(t => t.lockPeriod === lockPeriod);
    if (!tier) throw new Error('Invalid lock period');
    if (amount < tier.minAmount) throw new Error(`Minimum stake: ${tier.minAmount} GROW`);
    const position: StakingPosition = {
      id: crypto.randomUUID(),
      userId,
      amount,
      token: 'GROW',
      lockPeriod,
      apy: tier.apy,
      stakedAt: new Date().toISOString(),
      unlocksAt: unlockDate(lockPeriod),
      earnedRewards: 0,
      status: 'active',
    };
    try {
      const { error } = await supabase.from('staking_positions').insert({
        id: position.id,
        user_id: userId,
        amount,
        lock_period: lockPeriod,
        apy: tier.apy,
        unlocks_at: position.unlocksAt,
        status: 'active',
      });
      if (error) throw fromSupabaseError(error);
    } catch {
      const positions = await this.getPositions(userId);
      positions.unshift(position);
      localStorage.setItem(`wellnexus_staking_${userId}`, JSON.stringify(positions));
    }
    stakingLogger.info(`Staking position created: ${amount} GROW for ${lockPeriod} days`);
    return position;
  },

  async getRewardsLedger(userId: string): Promise<RewardsLedgerEntry[]> {
    try {
      const { data, error } = await supabase
        .from('rewards_ledger')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });
      if (error) throw fromSupabaseError(error);
      return (data ?? []).map(row => ({
        id: row.id as string,
        userId: row.user_id as string,
        type: row.type as RewardsLedgerEntry['type'],
        amount: row.amount as number,
        token: row.token as RewardsLedgerEntry['token'],
        status: row.status as RewardsLedgerEntry['status'],
        earnedAt: row.earned_at as string,
        claimedAt: (row.claimed_at as string | null) ?? null,
        sourceId: (row.source_id as string | null) ?? null,
      }));
    } catch {
      const stored = localStorage.getItem(`wellnexus_rewards_${userId}`);
      return stored ? (JSON.parse(stored) as RewardsLedgerEntry[]) : [];
    }
  },

  async claimRewards(userId: string, rewardIds: string[]): Promise<number> {
    let totalClaimed = 0;
    try {
      const { data, error } = await supabase
        .from('rewards_ledger')
        .update({ status: 'claimed', claimed_at: new Date().toISOString() })
        .in('id', rewardIds)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .select('amount');
      if (error) throw fromSupabaseError(error);
      totalClaimed = (data ?? []).reduce((sum, r) => sum + (r.amount as number), 0);
    } catch {
      const ledger = await this.getRewardsLedger(userId);
      const updated = ledger.map(entry => {
        if (rewardIds.includes(entry.id) && entry.status === 'pending') {
          totalClaimed += entry.amount;
          return { ...entry, status: 'claimed' as const, claimedAt: new Date().toISOString() };
        }
        return entry;
      });
      localStorage.setItem(`wellnexus_rewards_${userId}`, JSON.stringify(updated));
    }
    stakingLogger.info(`Claimed ${totalClaimed} rewards for user ${userId}`);
    return totalClaimed;
  },

  getEstimatedRewards(amount: number, lockPeriod: 30 | 90 | 180 | 365): number {
    const tier = STAKING_TIERS.find(t => t.lockPeriod === lockPeriod);
    return tier ? calcRewards(amount, tier.apy, lockPeriod) : 0;
  },

  getTotalStaked(positions: StakingPosition[]): number {
    return positions.filter(p => p.status === 'active').reduce((s, p) => s + p.amount, 0);
  },

  getTotalEarnedRewards(positions: StakingPosition[]): number {
    return positions.reduce((s, p) => s + p.earnedRewards, 0);
  },

  getPendingRewards(ledger: RewardsLedgerEntry[]): number {
    return ledger.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0);
  },
};
