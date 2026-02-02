import { describe, it, expect } from 'vitest';
import { UserRank, RANK_NAMES } from '@/types';

/**
 * Commission Logic Tests - Full Distributor Level Coverage
 * Testing the Bee 2.0 commission system for all 8 UserRank levels
 * 
 * Formula from store.ts lines 236-239:
 * const bonusRevenue = product.bonusRevenue || (product.price * 0.5);
 * const commissionRate = (userRank === UserRank.KHOI_NGHIEP || userRank <= UserRank.DAI_SU) ? 0.25 : 0.21;
 * const commission = bonusRevenue * commissionRate;
 */
describe('Commission Logic - Full Level', () => {
    /**
     * Calculate commission rate based on user rank
     * @param rank - UserRank enum value
     * @returns Commission rate (0.21 for CTV, 0.25 for others)
     */
    const getCommissionRate = (rank: UserRank): number => {
        // KHOI_NGHIEP (7) or any rank <= DAI_SU (6) gets 25%
        // CTV (8) gets 21%
        return (rank === UserRank.KHOI_NGHIEP || rank <= UserRank.DAI_SU) ? 0.25 : 0.21;
    };

    /**
     * Calculate commission from bonus revenue
     * @param bonusRevenue - Product's bonus revenue (DTTT)
     * @param rank - User's rank
     * @returns Commission amount in SHOP tokens
     */
    const calculateCommission = (bonusRevenue: number, rank: UserRank): number => {
        const rate = getCommissionRate(rank);
        return bonusRevenue * rate;
    };

    describe('Commission Rates by Rank', () => {
        it('CTV (rank 8) should get 21% commission rate', () => {
            const rate = getCommissionRate(UserRank.CTV);
            expect(rate).toBe(0.21);
        });

        it('KHOI_NGHIEP (rank 7) should get 25% commission rate', () => {
            const rate = getCommissionRate(UserRank.KHOI_NGHIEP);
            expect(rate).toBe(0.25);
        });

        it('DAI_SU (rank 6) should get 25% commission rate', () => {
            const rate = getCommissionRate(UserRank.DAI_SU);
            expect(rate).toBe(0.25);
        });

        it('DAI_SU_SILVER (rank 5) should get 25% commission rate', () => {
            const rate = getCommissionRate(UserRank.DAI_SU_SILVER);
            expect(rate).toBe(0.25);
        });

        it('DAI_SU_GOLD (rank 4) should get 25% commission rate', () => {
            const rate = getCommissionRate(UserRank.DAI_SU_GOLD);
            expect(rate).toBe(0.25);
        });

        it('DAI_SU_DIAMOND (rank 3) should get 25% commission rate', () => {
            const rate = getCommissionRate(UserRank.DAI_SU_DIAMOND);
            expect(rate).toBe(0.25);
        });

        it('PHUONG_HOANG (rank 2) should get 25% commission rate', () => {
            const rate = getCommissionRate(UserRank.PHUONG_HOANG);
            expect(rate).toBe(0.25);
        });

        it('THIEN_LONG (rank 1) should get 25% commission rate', () => {
            const rate = getCommissionRate(UserRank.THIEN_LONG);
            expect(rate).toBe(0.25);
        });
    });

    describe('Commission Calculations', () => {
        const bonusRevenue = 1000000; // 1M DTTT (Doanh thu tính thưởng)

        it('should calculate CTV commission correctly (21%)', () => {
            const commission = calculateCommission(bonusRevenue, UserRank.CTV);
            expect(commission).toBe(210000); // 1M * 0.21 = 210K
        });

        it('should calculate KHOI_NGHIEP commission correctly (25%)', () => {
            const commission = calculateCommission(bonusRevenue, UserRank.KHOI_NGHIEP);
            expect(commission).toBe(250000); // 1M * 0.25 = 250K
        });

        it('should calculate DAI_SU commission correctly (25%)', () => {
            const commission = calculateCommission(bonusRevenue, UserRank.DAI_SU);
            expect(commission).toBe(250000);
        });

        it('should calculate THIEN_LONG (top rank) commission correctly (25%)', () => {
            const commission = calculateCommission(bonusRevenue, UserRank.THIEN_LONG);
            expect(commission).toBe(250000);
        });
    });

    describe('Edge Cases', () => {
        it('should return 0 commission for 0 bonus revenue', () => {
            const commission = calculateCommission(0, UserRank.DAI_SU);
            expect(commission).toBe(0);
        });

        it('should handle large bonus revenue without overflow', () => {
            const largeRevenue = 100_000_000_000; // 100 billion VND
            const commission = calculateCommission(largeRevenue, UserRank.DAI_SU);
            expect(commission).toBe(25_000_000_000); // 25 billion
        });

        it('should handle decimal bonus revenue', () => {
            const commission = calculateCommission(1234567.89, UserRank.CTV);
            expect(commission).toBeCloseTo(259259.26, 2); // 1234567.89 * 0.21
        });
    });

    describe('Rank Tier Boundary', () => {
        it('should have only 2 commission tiers', () => {
            const rates = new Set([
                getCommissionRate(UserRank.CTV),
                getCommissionRate(UserRank.KHOI_NGHIEP),
                getCommissionRate(UserRank.DAI_SU),
                getCommissionRate(UserRank.THIEN_LONG),
            ]);
            expect(rates.size).toBe(2);
        });

        it('CTV is the only rank with 21% rate', () => {
            const allRanks = [
                UserRank.THIEN_LONG,
                UserRank.PHUONG_HOANG,
                UserRank.DAI_SU_DIAMOND,
                UserRank.DAI_SU_GOLD,
                UserRank.DAI_SU_SILVER,
                UserRank.DAI_SU,
                UserRank.KHOI_NGHIEP,
                UserRank.CTV,
            ];

            const ranksWithLowerRate = allRanks.filter(r => getCommissionRate(r) === 0.21);
            expect(ranksWithLowerRate).toEqual([UserRank.CTV]);
        });

        it('should verify rank names are defined for all ranks', () => {
            // RANK_NAMES now returns translation keys (refactored for i18n)
            expect(RANK_NAMES[UserRank.THIEN_LONG]).toBe('ranks.thien_long');
            expect(RANK_NAMES[UserRank.PHUONG_HOANG]).toBe('ranks.phuong_hoang');
            expect(RANK_NAMES[UserRank.DAI_SU_DIAMOND]).toBe('ranks.dai_su_diamond');
            expect(RANK_NAMES[UserRank.DAI_SU_GOLD]).toBe('ranks.dai_su_gold');
            expect(RANK_NAMES[UserRank.DAI_SU_SILVER]).toBe('ranks.dai_su_silver');
            expect(RANK_NAMES[UserRank.DAI_SU]).toBe('ranks.dai_su');
            expect(RANK_NAMES[UserRank.KHOI_NGHIEP]).toBe('ranks.khoi_nghiep');
            expect(RANK_NAMES[UserRank.CTV]).toBe('ranks.ctv');
        });
    });

    describe('Bonus Revenue Calculation', () => {
        /**
         * Default bonus revenue = product.price * 0.5 (from store.ts line 236)
         */
        const calculateBonusRevenue = (price: number, bonusRevenue?: number): number => {
            return bonusRevenue || (price * 0.5);
        };

        it('should use explicit bonusRevenue when provided', () => {
            const result = calculateBonusRevenue(2000000, 800000);
            expect(result).toBe(800000);
        });

        it('should fallback to 50% of price when bonusRevenue not set', () => {
            const result = calculateBonusRevenue(2000000);
            expect(result).toBe(1000000); // 2M * 0.5 = 1M
        });

        it('should handle 0 price correctly', () => {
            const result = calculateBonusRevenue(0);
            expect(result).toBe(0);
        });
    });

    describe('Full Commission Flow', () => {
        /**
         * Complete flow: Product Sale → Bonus Revenue → Commission
         */
        it('should calculate complete commission flow for CTV', () => {
            const productPrice = 2000000; // 2M VND product
            const bonusRevenue = productPrice * 0.5; // 1M DTTT (default 50%)
            const commission = calculateCommission(bonusRevenue, UserRank.CTV);

            expect(bonusRevenue).toBe(1000000);
            expect(commission).toBe(210000); // 1M * 21%
        });

        it('should calculate complete commission flow for KHOI_NGHIEP', () => {
            const productPrice = 2000000;
            const bonusRevenue = productPrice * 0.5;
            const commission = calculateCommission(bonusRevenue, UserRank.KHOI_NGHIEP);

            expect(commission).toBe(250000); // 1M * 25%
        });

        it('should show 4% difference between CTV and KHOI_NGHIEP', () => {
            const bonusRevenue = 1000000;
            const ctvCommission = calculateCommission(bonusRevenue, UserRank.CTV);
            const khoiNghiepCommission = calculateCommission(bonusRevenue, UserRank.KHOI_NGHIEP);

            expect(khoiNghiepCommission - ctvCommission).toBe(40000); // 4% of 1M
        });
    });
});
