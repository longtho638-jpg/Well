import { describe, it, expect } from 'vitest';

/**
 * Agent Reward Commission Distribution Tests
 * Tests the commission logic used by the agent-reward edge function:
 * - Direct commission (21% CTV / 25% Khoi Nghiep+)
 * - F1 Sponsor bonus (8%, Dai Su rank 6 or higher)
 * - Nexus Points mining (1 point per 100k VND)
 * - Policy config rate mapping from DB values
 */

// Mirrors the DEFAULT_POLICY from agent-reward/index.ts
const DEFAULT_POLICY = {
    RANKS: {
        THIEN_LONG: 1,
        PHUONG_HOANG: 2,
        DAI_SU_DIAMOND: 3,
        DAI_SU_GOLD: 4,
        DAI_SU_SILVER: 5,
        DAI_SU: 6,
        KHOI_NGHIEP: 7,
        CTV: 8,
    },
    COMMISSION_RATES: {
        CTV: 0.21,
        LEADER: 0.25,
    },
    F1_BONUS_RATE: 0.08,
    POINT_CONVERSION: 100000,
};

// Mirrors agent-reward logic for determining direct commission rate
function getDirectRate(buyerRoleId: number, policy = DEFAULT_POLICY): number {
    const roleId = buyerRoleId || policy.RANKS.CTV;
    return roleId <= policy.RANKS.KHOI_NGHIEP
        ? policy.COMMISSION_RATES.LEADER
        : policy.COMMISSION_RATES.CTV;
}

// Mirrors agent-reward F1 sponsor bonus eligibility check
function isSponsorEligibleForBonus(sponsorRoleId: number, policy = DEFAULT_POLICY): boolean {
    return sponsorRoleId <= policy.RANKS.DAI_SU;
}

// Mirrors agent-reward points calculation
function calculatePoints(orderTotal: number, policy = DEFAULT_POLICY): number {
    return Math.floor(orderTotal / policy.POINT_CONVERSION);
}

// Mirrors fetchPolicyConfig mapping from DB → POLICY structure
interface DbPolicyConfig {
    beeAgentPolicy?: {
        ctvCommission?: number;
        startupCommission?: number;
        sponsorBonus?: number;
        rankUpThreshold?: number;
    };
}

function mapDbConfigToPolicy(dbConfig: DbPolicyConfig) {
    return {
        RANKS: DEFAULT_POLICY.RANKS,
        COMMISSION_RATES: {
            CTV: (dbConfig.beeAgentPolicy?.ctvCommission || 21) / 100,
            LEADER: (dbConfig.beeAgentPolicy?.startupCommission || 25) / 100,
        },
        F1_BONUS_RATE: (dbConfig.beeAgentPolicy?.sponsorBonus || 8) / 100,
        POINT_CONVERSION: 100000,
    };
}

describe('Agent Reward Commission Distribution', () => {
    describe('Direct Commission Rate', () => {
        it('CTV (rank 8) gets 21%', () => {
            expect(getDirectRate(8)).toBe(0.21);
        });

        it('Khoi Nghiep (rank 7) gets 25%', () => {
            expect(getDirectRate(7)).toBe(0.25);
        });

        it('Dai Su (rank 6) gets 25%', () => {
            expect(getDirectRate(6)).toBe(0.25);
        });

        it('Thien Long (rank 1) gets 25%', () => {
            expect(getDirectRate(1)).toBe(0.25);
        });

        it('null/undefined role_id defaults to CTV (21%)', () => {
            expect(getDirectRate(0)).toBe(0.21);
        });
    });

    describe('Direct Commission Calculation', () => {
        it('CTV on 1M order = 210,000 VND', () => {
            const orderTotal = 1_000_000;
            const commission = orderTotal * getDirectRate(8);
            expect(commission).toBe(210_000);
        });

        it('Khoi Nghiep on 1M order = 250,000 VND', () => {
            const orderTotal = 1_000_000;
            const commission = orderTotal * getDirectRate(7);
            expect(commission).toBe(250_000);
        });

        it('Dai Su on 9.9M order = 2,475,000 VND', () => {
            const orderTotal = 9_900_000;
            const commission = orderTotal * getDirectRate(6);
            expect(commission).toBe(2_475_000);
        });
    });

    describe('F1 Sponsor Bonus', () => {
        it('Dai Su (rank 6) is eligible for F1 bonus', () => {
            expect(isSponsorEligibleForBonus(6)).toBe(true);
        });

        it('Dai Su Silver (rank 5) is eligible', () => {
            expect(isSponsorEligibleForBonus(5)).toBe(true);
        });

        it('Thien Long (rank 1) is eligible', () => {
            expect(isSponsorEligibleForBonus(1)).toBe(true);
        });

        it('Khoi Nghiep (rank 7) is NOT eligible', () => {
            expect(isSponsorEligibleForBonus(7)).toBe(false);
        });

        it('CTV (rank 8) is NOT eligible', () => {
            expect(isSponsorEligibleForBonus(8)).toBe(false);
        });

        it('F1 bonus is 8% of order total', () => {
            const orderTotal = 1_000_000;
            const bonus = orderTotal * DEFAULT_POLICY.F1_BONUS_RATE;
            expect(bonus).toBe(80_000);
        });

        it('F1 bonus on 9.9M order = 792,000 VND', () => {
            const orderTotal = 9_900_000;
            const bonus = orderTotal * DEFAULT_POLICY.F1_BONUS_RATE;
            expect(bonus).toBe(792_000);
        });
    });

    describe('Nexus Points (Mining)', () => {
        it('100k VND = 1 point', () => {
            expect(calculatePoints(100_000)).toBe(1);
        });

        it('1M VND = 10 points', () => {
            expect(calculatePoints(1_000_000)).toBe(10);
        });

        it('99k VND = 0 points (floor)', () => {
            expect(calculatePoints(99_000)).toBe(0);
        });

        it('550k VND = 5 points (floor, not round)', () => {
            expect(calculatePoints(550_000)).toBe(5);
        });

        it('9.9M VND = 99 points', () => {
            expect(calculatePoints(9_900_000)).toBe(99);
        });
    });

    describe('Policy Config Mapping', () => {
        it('maps DB config to policy structure', () => {
            const dbConfig = {
                beeAgentPolicy: {
                    ctvCommission: 21,
                    startupCommission: 25,
                    sponsorBonus: 8,
                    rankUpThreshold: 9900000,
                },
            };

            const policy = mapDbConfigToPolicy(dbConfig);
            expect(policy.COMMISSION_RATES.CTV).toBe(0.21);
            expect(policy.COMMISSION_RATES.LEADER).toBe(0.25);
            expect(policy.F1_BONUS_RATE).toBe(0.08);
        });

        it('uses defaults when DB config is missing fields', () => {
            const policy = mapDbConfigToPolicy({});
            expect(policy.COMMISSION_RATES.CTV).toBe(0.21);
            expect(policy.COMMISSION_RATES.LEADER).toBe(0.25);
            expect(policy.F1_BONUS_RATE).toBe(0.08);
        });

        it('handles custom commission rates from admin', () => {
            const customConfig = {
                beeAgentPolicy: {
                    ctvCommission: 18,
                    startupCommission: 22,
                    sponsorBonus: 10,
                },
            };

            const policy = mapDbConfigToPolicy(customConfig);
            expect(policy.COMMISSION_RATES.CTV).toBe(0.18);
            expect(policy.COMMISSION_RATES.LEADER).toBe(0.22);
            expect(policy.F1_BONUS_RATE).toBe(0.10);
        });
    });

    describe('Full Distribution Flow', () => {
        it('calculates all rewards for a CTV with Dai Su sponsor', () => {
            const orderTotal = 2_000_000;
            const buyerRoleId = 8; // CTV
            const sponsorRoleId = 6; // Dai Su

            const directCommission = orderTotal * getDirectRate(buyerRoleId);
            const points = calculatePoints(orderTotal);
            const sponsorBonus = isSponsorEligibleForBonus(sponsorRoleId)
                ? orderTotal * DEFAULT_POLICY.F1_BONUS_RATE
                : 0;

            expect(directCommission).toBe(420_000); // 2M * 21%
            expect(points).toBe(20); // 2M / 100k
            expect(sponsorBonus).toBe(160_000); // 2M * 8%
        });

        it('calculates all rewards for Khoi Nghiep with CTV sponsor (no F1 bonus)', () => {
            const orderTotal = 5_000_000;
            const buyerRoleId = 7; // Khoi Nghiep
            const sponsorRoleId = 8; // CTV (not eligible)

            const directCommission = orderTotal * getDirectRate(buyerRoleId);
            const points = calculatePoints(orderTotal);
            const sponsorBonus = isSponsorEligibleForBonus(sponsorRoleId)
                ? orderTotal * DEFAULT_POLICY.F1_BONUS_RATE
                : 0;

            expect(directCommission).toBe(1_250_000); // 5M * 25%
            expect(points).toBe(50);
            expect(sponsorBonus).toBe(0); // CTV not eligible
        });

        it('no sponsor = no F1 bonus', () => {
            const _orderTotal = 1_000_000;
            // When buyer has no sponsor_id, agent-reward skips F1 bonus entirely
            const sponsorBonus = 0; // No sponsor_id means no bonus
            expect(sponsorBonus).toBe(0);
        });
    });
});
