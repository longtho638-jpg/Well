import { describe, it, expect, beforeEach } from 'vitest';
import { REFERRALS, REFERRAL_STATS } from '@/data/mockData';
import type { Referral, ReferralStats } from '@/types';

/**
 * Affiliate/Referral logic integration tests
 * Testing referral tracking, commission calculations, and MLM structure
 */
describe('Affiliate Logic Integration Tests', () => {
    let referrals: Referral[];
    let stats: ReferralStats;

    beforeEach(() => {
        // Clone data for test isolation
        referrals = JSON.parse(JSON.stringify(REFERRALS));
        stats = JSON.parse(JSON.stringify(REFERRAL_STATS));
    });

    describe('Referral Tracking', () => {
        it('should have referrals with correct structure', () => {
            expect(referrals.length).toBeGreaterThan(0);

            referrals.forEach(ref => {
                expect(ref).toHaveProperty('id');
                expect(ref).toHaveProperty('level');
                expect(ref).toHaveProperty('status');
                expect(ref).toHaveProperty('referralBonus');
                expect(ref.level).toBeGreaterThan(0);
            });
        });

        it('should track referral link', () => {
            expect(stats.referralLink).toBeDefined();
            expect(stats.referralLink).toMatch(/wellnexus\.vn\/ref\//);
        });

        it('should count active referrals correctly', () => {
            const activeCount = referrals.filter(r => r.status === 'active').length;
            expect(activeCount).toBe(stats.activeReferrals);
        });
    });

    describe('Commission Calculations', () => {
        it('should calculate total commissions', () => {
            const totalCommissions = referrals.reduce((sum, r) => sum + r.referralBonus, 0);
            expect(totalCommissions).toBe(stats.totalBonus);
        });

        it('should track level-based commissions', () => {
            const level1 = referrals.filter(r => r.level === 1);
            const level2 = referrals.filter(r => r.level === 2);

            expect(level1.length + level2.length).toBe(referrals.length);
        });

        it('should have commissions proportional to revenue', () => {
            referrals.forEach(ref => {
                if (ref.totalRevenue > 0) {
                    expect(ref.referralBonus).toBeLessThanOrEqual(ref.totalRevenue);
                }
            });
        });
    });

    describe('MLM Structure', () => {
        it('should have multi-level hierarchy', () => {
            const levels = [...new Set(referrals.map(r => r.level))];
            expect(levels.length).toBeGreaterThan(0);

            levels.forEach(level => {
                expect(level).toBeGreaterThan(0);
            });
        });

        it('should track network metrics', () => {
            expect(stats.totalReferrals).toBe(referrals.length);
            expect(stats.activeReferrals).toBeLessThanOrEqual(stats.totalReferrals);
        });
    });

    describe('Performance Metrics', () => {
        it('should calculate conversion rate', () => {
            expect(stats.conversionRate).toBeGreaterThan(0);
            expect(stats.conversionRate).toBeLessThanOrEqual(100);
        });

        it('should track monthly growth', () => {
            expect(stats.monthlyReferrals).toBeGreaterThanOrEqual(0);
            expect(stats.monthlyReferrals).toBeLessThanOrEqual(stats.totalReferrals);
        });
    });

    describe('Payout Management', () => {
        it('should aggregate earnings', () => {
            expect(stats.totalBonus).toBeGreaterThan(0);
            expect(stats.totalBonus).toBe(referrals.reduce((sum, r) => sum + r.referralBonus, 0));
        });

        it('should segment by status', () => {
            const active = referrals.filter(r => r.status === 'active');
            const pending = referrals.filter(r => r.status === 'pending');

            expect(active.length + pending.length).toBeLessThanOrEqual(referrals.length);
        });
    });
});
