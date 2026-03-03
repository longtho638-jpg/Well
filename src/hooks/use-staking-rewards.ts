import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  stakingService,
  STAKING_TIERS,
} from '@/services/staking-rewards-service';
import type {
  StakingPosition,
  RewardsLedgerEntry,
} from '@/services/staking-rewards-service';
import { createLogger } from '@/utils/logger';

const logger = createLogger('useStakingRewards');

/**
 * Staking & Rewards Hook
 * Manages GROW token staking positions and rewards claiming.
 */
export function useStakingRewards(userId: string | null) {
  const [positions, setPositions] = useState<StakingPosition[]>([]);
  const [rewards, setRewards] = useState<RewardsLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      const [posData, rewardsData] = await Promise.all([
        stakingService.getPositions(uid),
        stakingService.getRewardsLedger(uid),
      ]);
      setPositions(posData);
      setRewards(rewardsData);
    } catch (e) {
      const err = e as Error;
      logger.error('Failed to load staking data', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setPositions([]);
      setRewards([]);
      setLoading(false);
      return;
    }
    loadData(userId);
  }, [userId, loadData]);

  const stake = useCallback(async (
    amount: number,
    lockPeriod: 30 | 90 | 180 | 365
  ) => {
    if (!userId) throw new Error('User not authenticated');
    const position = await stakingService.createPosition(userId, amount, lockPeriod);
    setPositions(prev => [position, ...prev]);
    return position;
  }, [userId]);

  const claimRewards = useCallback(async (rewardIds: string[]) => {
    if (!userId) throw new Error('User not authenticated');
    const claimed = await stakingService.claimRewards(userId, rewardIds);
    if (userId) await loadData(userId);
    return claimed;
  }, [userId, loadData]);

  const claimAllPending = useCallback(async () => {
    const pendingIds = rewards
      .filter(r => r.status === 'pending')
      .map(r => r.id);
    if (pendingIds.length === 0) return 0;
    return claimRewards(pendingIds);
  }, [rewards, claimRewards]);

  const refresh = useCallback(async () => {
    if (userId) await loadData(userId);
  }, [userId, loadData]);

  const metrics = useMemo(() => ({
    totalStaked: stakingService.getTotalStaked(positions),
    totalEarned: stakingService.getTotalEarnedRewards(positions),
    pendingRewards: stakingService.getPendingRewards(rewards),
    activePositions: positions.filter(p => p.status === 'active').length,
    tiers: STAKING_TIERS,
  }), [positions, rewards]);

  const estimateRewards = useCallback((
    amount: number,
    lockPeriod: 30 | 90 | 180 | 365
  ) => stakingService.getEstimatedRewards(amount, lockPeriod), []);

  return {
    positions,
    rewards,
    loading,
    error,
    metrics,
    stake,
    claimRewards,
    claimAllPending,
    estimateRewards,
    refresh,
  } as const;
}
