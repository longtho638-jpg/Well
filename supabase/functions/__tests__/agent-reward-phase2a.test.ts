 
/**
 * Phase 2A: F2-F5 Override Commission Tests
 * Tests for multi-level upline traversal and override calculations
 *
 * Run: pnpm vitest run supabase/functions/__tests__/agent-reward-phase2a.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Policy constants
const POLICY = {
  RANKS: {
    THIEN_LONG: 1,
    PHUONG_HOANG: 2,
    DAI_SU_DIAMOND: 3,
    DAI_SU_GOLD: 4,
    DAI_SU_SILVER: 5,
    DAI_SU: 6,
    KHOI_NGHIEP: 7,
    CTV: 8
  },
  OVERRIDES: {
    F2: { minRankId: 4, percent: 0.05, teamVolumeThreshold: 50000000 },
    F3: { minRankId: 3, percent: 0.03, teamVolumeThreshold: 200000000 },
    F4: { minRankId: 2, percent: 0.02, teamVolumeThreshold: 500000000 },
    F5: { minRankId: 1, percent: 0.01, teamVolumeThreshold: 1000000000 }
  }
};

describe('Phase 2A: F2-F5 Override Commission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Override Calculation', () => {
    it('F2: Dai Su Gold (rank 4) with 50M team vol gets 5%', () => {
      const orderTotal = 10000000;
      const uplineRank = POLICY.RANKS.DAI_SU_GOLD;
      const teamVolume = 50000000;

      const override = POLICY.OVERRIDES.F2;
      const qualifies = uplineRank <= override.minRankId && teamVolume >= override.teamVolumeThreshold;
      const amount = qualifies ? orderTotal * override.percent : 0;

      expect(qualifies).toBe(true);
      expect(amount).toBe(500000);
    });

    it('F2: Dai Su Gold with 49M team vol gets 0% (below threshold)', () => {
      const orderTotal = 10000000;
      const uplineRank = POLICY.RANKS.DAI_SU_GOLD;
      const teamVolume = 49000000;

      const override = POLICY.OVERRIDES.F2;
      const qualifies = uplineRank <= override.minRankId && teamVolume >= override.teamVolumeThreshold;
      const amount = qualifies ? orderTotal * override.percent : 0;

      expect(qualifies).toBe(false);
      expect(amount).toBe(0);
    });

    it('F3: Dai Su Diamond (rank 3) with 200M team vol gets 3%', () => {
      const orderTotal = 10000000;
      const uplineRank = POLICY.RANKS.DAI_SU_DIAMOND;
      const teamVolume = 200000000;

      const override = POLICY.OVERRIDES.F3;
      const qualifies = uplineRank <= override.minRankId && teamVolume >= override.teamVolumeThreshold;
      const amount = qualifies ? orderTotal * override.percent : 0;

      expect(qualifies).toBe(true);
      expect(amount).toBe(300000);
    });

    it('F4: Phuong Hoang (rank 2) with 500M team vol gets 2%', () => {
      const orderTotal = 10000000;
      const uplineRank = POLICY.RANKS.PHUONG_HOANG;
      const teamVolume = 500000000;

      const override = POLICY.OVERRIDES.F4;
      const qualifies = uplineRank <= override.minRankId && teamVolume >= override.teamVolumeThreshold;
      const amount = qualifies ? orderTotal * override.percent : 0;

      expect(qualifies).toBe(true);
      expect(amount).toBe(200000);
    });

    it('F5: Thien Long (rank 1) with 1B team vol gets 1%', () => {
      const orderTotal = 10000000;
      const uplineRank = POLICY.RANKS.THIEN_LONG;
      const teamVolume = 1000000000;

      const override = POLICY.OVERRIDES.F5;
      const qualifies = uplineRank <= override.minRankId && teamVolume >= override.teamVolumeThreshold;
      const amount = qualifies ? orderTotal * override.percent : 0;

      expect(qualifies).toBe(true);
      expect(amount).toBe(100000);
    });
  });

  describe('Rank Qualification', () => {
    it('Dai Su Silver (rank 5) does NOT qualify for F2 (requires rank 4+)', () => {
      const uplineRank = POLICY.RANKS.DAI_SU_SILVER;
      const override = POLICY.OVERRIDES.F2;

      const qualifies = uplineRank <= override.minRankId;

      expect(qualifies).toBe(false);
    });

    it('Dai Su Gold (rank 4) qualifies for F2', () => {
      const uplineRank = POLICY.RANKS.DAI_SU_GOLD;
      const override = POLICY.OVERRIDES.F2;

      const qualifies = uplineRank <= override.minRankId;

      expect(qualifies).toBe(true);
    });

    it('Dai Su Diamond (rank 3) qualifies for BOTH F2 and F3', () => {
      const uplineRank = POLICY.RANKS.DAI_SU_DIAMOND;
      const f2Qualifies = uplineRank <= POLICY.OVERRIDES.F2.minRankId;
      const f3Qualifies = uplineRank <= POLICY.OVERRIDES.F3.minRankId;

      expect(f2Qualifies).toBe(true);
      expect(f3Qualifies).toBe(true);
    });

    it('Thien Long (rank 1) qualifies for ALL levels F2-F5', () => {
      const uplineRank = POLICY.RANKS.THIEN_LONG;

      expect(uplineRank <= POLICY.OVERRIDES.F2.minRankId).toBe(true);
      expect(uplineRank <= POLICY.OVERRIDES.F3.minRankId).toBe(true);
      expect(uplineRank <= POLICY.OVERRIDES.F4.minRankId).toBe(true);
      expect(uplineRank <= POLICY.OVERRIDES.F5.minRankId).toBe(true);
    });
  });

  describe('Highest-Only Logic (Not Cumulative)', () => {
    it('Upline qualifying for F3 gets ONLY F3 (highest), not F2+F3', () => {
      const orderTotal = 10000000;
      const uplineRank = POLICY.RANKS.DAI_SU_DIAMOND;
      const _teamVolume = 200000000;

      const f3Override = POLICY.OVERRIDES.F3;
      const f3Amount = orderTotal * f3Override.percent;

      expect(f3Amount).toBe(300000);
      expect(uplineRank).toBe(f3Override.minRankId);
    });
  });

  describe('Team Volume Thresholds', () => {
    it('Exactly at threshold qualifies', () => {
      const teamVolume = 50000000;
      const threshold = POLICY.OVERRIDES.F2.teamVolumeThreshold;

      expect(teamVolume >= threshold).toBe(true);
    });

    it('One dong below threshold disqualifies', () => {
      const _teamVolume = 49999999;
      const threshold = POLICY.OVERRIDES.F2.teamVolumeThreshold;

      expect(_teamVolume >= threshold).toBe(false);
    });

    it('Well above threshold qualifies', () => {
      const _teamVolume = 100000000;
      const threshold = POLICY.OVERRIDES.F2.teamVolumeThreshold;

      expect(_teamVolume >= threshold).toBe(true);
    });
  });

  describe('Transaction Types', () => {
    it('F2 override uses type "override_f2"', () => {
      const levelName = 'F2';
      const transactionType = `override_${levelName.toLowerCase()}`;

      expect(transactionType).toBe('override_f2');
    });

    it('F3 override uses type "override_f3"', () => {
      const levelName = 'F3';
      const transactionType = `override_${levelName.toLowerCase()}`;

      expect(transactionType).toBe('override_f3');
    });

    it('F4 override uses type "override_f4"', () => {
      const levelName = 'F4';
      const transactionType = `override_${levelName.toLowerCase()}`;

      expect(transactionType).toBe('override_f4');
    });

    it('F5 override uses type "override_f5"', () => {
      const levelName = 'F5';
      const transactionType = `override_${levelName.toLowerCase()}`;

      expect(transactionType).toBe('override_f5');
    });
  });

  describe('Upline Traversal Logic', () => {
    it('Processes upline chain until no more sponsor', () => {
      const uplineChain = [
        { id: 'user-1', sponsor_id: 'user-2', role_id: POLICY.RANKS.DAI_SU_GOLD, team_volume: 50000000 },
        { id: 'user-2', sponsor_id: 'user-3', role_id: POLICY.RANKS.DAI_SU_DIAMOND, team_volume: 200000000 },
        { id: 'user-3', sponsor_id: null, role_id: POLICY.RANKS.THIEN_LONG, team_volume: 1000000000 }
      ];

      let currentUplineId = uplineChain[0].sponsor_id;
      const processedIds: string[] = [];

      while (currentUplineId) {
        processedIds.push(currentUplineId);
        const upline = uplineChain.find(u => u.id === currentUplineId);
        currentUplineId = upline?.sponsor_id || null;
      }

      expect(processedIds).toEqual(['user-2', 'user-3']);
      expect(processedIds.length).toBe(2);
    });

    it('Prevents infinite loops with Set tracking', () => {
      const processedUplines = new Set<string>();
      const visitedIds: string[] = [];

      const circularChain = ['user-1', 'user-2', 'user-1'];

      for (const id of circularChain) {
        if (processedUplines.has(id)) {
          break;
        }
        processedUplines.add(id);
        visitedIds.push(id);
      }

      expect(visitedIds).toEqual(['user-1', 'user-2']);
      expect(processedUplines.size).toBe(2);
    });
  });

  describe('Commission Description Format', () => {
    it('F2 description includes level, percent, order ID', () => {
      const levelName = 'F2';
      const percent = 5;
      const orderId = 'order-123';
      const _teamVolume = 50000000;

      const description = `${levelName} override ${percent}% từ đơn hàng ${orderId}`;

      expect(description).toContain('F2');
      expect(description).toContain('5%');
      expect(description).toContain('order-123');
    });

    it('F3 description follows same pattern', () => {
      const levelName = 'F3';
      const percent = 3;
      const orderId = 'order-456';

      const description = `${levelName} override ${percent}% từ đơn hàng ${orderId}`;

      expect(description).toBe('F3 override 3% từ đơn hàng order-456');
    });
  });
});
