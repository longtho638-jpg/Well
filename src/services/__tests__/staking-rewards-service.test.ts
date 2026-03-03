import { describe, it, expect } from 'vitest';
import {
  stakingService,
  STAKING_TIERS,
} from '../staking-rewards-service';
import type { StakingPosition, RewardsLedgerEntry } from '../staking-rewards-service';

describe('staking-rewards-service', () => {
  describe('STAKING_TIERS', () => {
    it('has 4 tiers', () => {
      expect(STAKING_TIERS).toHaveLength(4);
    });

    it('tiers have correct lock periods', () => {
      const periods = STAKING_TIERS.map(t => t.lockPeriod);
      expect(periods).toEqual([30, 90, 180, 365]);
    });

    it('APY increases with lock period', () => {
      for (let i = 1; i < STAKING_TIERS.length; i++) {
        expect(STAKING_TIERS[i].apy).toBeGreaterThan(STAKING_TIERS[i - 1].apy);
      }
    });

    it('minAmount increases with lock period', () => {
      for (let i = 1; i < STAKING_TIERS.length; i++) {
        expect(STAKING_TIERS[i].minAmount).toBeGreaterThan(STAKING_TIERS[i - 1].minAmount);
      }
    });
  });

  describe('getEstimatedRewards', () => {
    it('calculates rewards for 30-day tier', () => {
      const reward = stakingService.getEstimatedRewards(1000, 30);
      // 1000 * 0.08 * (30/365) = 6.57 → floor = 6
      expect(reward).toBe(6);
    });

    it('calculates rewards for 365-day tier', () => {
      const reward = stakingService.getEstimatedRewards(5000, 365);
      // 5000 * 0.25 * (365/365) = 1250
      expect(reward).toBe(1250);
    });

    it('returns 0 for invalid lock period', () => {
      const reward = stakingService.getEstimatedRewards(1000, 60 as never);
      expect(reward).toBe(0);
    });
  });

  describe('getTotalStaked', () => {
    it('sums only active positions', () => {
      const positions: StakingPosition[] = [
        { id: '1', userId: 'u1', amount: 500, token: 'GROW', lockPeriod: 30, apy: 8, stakedAt: '', unlocksAt: '', earnedRewards: 0, status: 'active' },
        { id: '2', userId: 'u1', amount: 1000, token: 'GROW', lockPeriod: 90, apy: 12, stakedAt: '', unlocksAt: '', earnedRewards: 0, status: 'completed' },
        { id: '3', userId: 'u1', amount: 2000, token: 'GROW', lockPeriod: 180, apy: 18, stakedAt: '', unlocksAt: '', earnedRewards: 0, status: 'active' },
      ];
      expect(stakingService.getTotalStaked(positions)).toBe(2500);
    });

    it('returns 0 for empty array', () => {
      expect(stakingService.getTotalStaked([])).toBe(0);
    });
  });

  describe('getTotalEarnedRewards', () => {
    it('sums all earned rewards', () => {
      const positions: StakingPosition[] = [
        { id: '1', userId: 'u1', amount: 500, token: 'GROW', lockPeriod: 30, apy: 8, stakedAt: '', unlocksAt: '', earnedRewards: 10, status: 'active' },
        { id: '2', userId: 'u1', amount: 1000, token: 'GROW', lockPeriod: 90, apy: 12, stakedAt: '', unlocksAt: '', earnedRewards: 50, status: 'completed' },
      ];
      expect(stakingService.getTotalEarnedRewards(positions)).toBe(60);
    });
  });

  describe('getPendingRewards', () => {
    it('sums only pending rewards', () => {
      const ledger: RewardsLedgerEntry[] = [
        { id: '1', userId: 'u1', type: 'staking_reward', amount: 100, token: 'GROW', status: 'pending', earnedAt: '', claimedAt: null, sourceId: null },
        { id: '2', userId: 'u1', type: 'commission_bonus', amount: 200, token: 'SHOP', status: 'claimed', earnedAt: '', claimedAt: '', sourceId: null },
        { id: '3', userId: 'u1', type: 'rank_bonus', amount: 50, token: 'GROW', status: 'pending', earnedAt: '', claimedAt: null, sourceId: null },
      ];
      expect(stakingService.getPendingRewards(ledger)).toBe(150);
    });

    it('returns 0 when no pending', () => {
      expect(stakingService.getPendingRewards([])).toBe(0);
    });
  });
});
