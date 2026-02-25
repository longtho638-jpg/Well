import { describe, it, expect } from 'vitest';
import {
  calculateBusinessValuation,
  calculateEquityValue,
  calculateAssetGrowthRate,
  enrichUserWithWealthMetrics,
} from './wealthEngine';
import { User, UserRank } from '@/types';

describe('wealthEngine', () => {
  const mockUser: User = {
    id: 'test-user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    roleId: 1,
    rank: UserRank.CTV,
    totalSales: 100_000_000,
    teamVolume: 60_000_000,
    shopBalance: 50_000_000,
    growBalance: 2000,
    stakedGrowBalance: 1000,
    avatarUrl: '',
    joinedAt: new Date().toISOString(),
    kycStatus: false,
  };

  describe('calculateBusinessValuation', () => {
    it('should calculate valuation with 20% profit margin and 5x PE ratio', () => {
      const valuation = calculateBusinessValuation(mockUser);
      expect(valuation).toBe(1_200_000_000);
    });

    it('should handle zero sales', () => {
      const userWithZeroSales = { ...mockUser, totalSales: 0 };
      const valuation = calculateBusinessValuation(userWithZeroSales);
      expect(valuation).toBe(0);
    });
  });

  describe('calculateEquityValue', () => {
    it('should calculate equity value at 10,000 VND per GROW', () => {
      const equityValue = calculateEquityValue(3000);
      expect(equityValue).toBe(30_000_000);
    });

    it('should handle zero GROW balance', () => {
      const equityValue = calculateEquityValue(0);
      expect(equityValue).toBe(0);
    });
  });

  describe('calculateAssetGrowthRate', () => {
    it('should return 15% for team volume > 100M', () => {
      const userHighVolume = { ...mockUser, teamVolume: 150_000_000 };
      const growthRate = calculateAssetGrowthRate(userHighVolume);
      expect(growthRate).toBe(15);
    });

    it('should return 10% for team volume > 50M', () => {
      const userMidVolume = { ...mockUser, teamVolume: 60_000_000 };
      const growthRate = calculateAssetGrowthRate(userMidVolume);
      expect(growthRate).toBe(10);
    });

    it('should return 5% baseline for team volume <= 20M', () => {
      const userBaselineVolume = { ...mockUser, teamVolume: 10_000_000 };
      const growthRate = calculateAssetGrowthRate(userBaselineVolume);
      expect(growthRate).toBe(5);
    });
  });

  describe('enrichUserWithWealthMetrics', () => {
    it('should enrich user with all wealth metrics', () => {
      const enrichedUser = enrichUserWithWealthMetrics(mockUser);

      expect(enrichedUser.id).toBe(mockUser.id);
      expect(enrichedUser.monthlyProfit).toBe(20_000_000);
      expect(enrichedUser.businessValuation).toBe(1_200_000_000);
      expect(enrichedUser.equityValue).toBe(30_000_000);
      expect(enrichedUser.assetGrowthRate).toBe(10);
    });
  });
});
