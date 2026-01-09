import { describe, it, expect } from 'vitest';
import {
    calculateStakingReward,
    formatToken,
    generateTxHash,
} from './tokenomics';

/**
 * Tokenomics Logic Tests
 * Testing core financial calculations for SHOP/GROW token system
 */
describe('Tokenomics', () => {
    describe('calculateStakingReward', () => {
        it('should calculate basic staking reward correctly', () => {
            // 1000 GROW @ 12% APY for 90 days
            const reward = calculateStakingReward(1000, 0.12, 90);
            // Daily rate = 0.12 / 365 = 0.000328767...
            // Expected: 1000 * (0.12/365) * 90 ≈ 29.5890
            expect(reward).toBeCloseTo(29.589, 2);
        });

        it('should return 0 for zero tokens', () => {
            const reward = calculateStakingReward(0, 0.12, 90);
            expect(reward).toBe(0);
        });

        it('should return 0 for zero days', () => {
            const reward = calculateStakingReward(1000, 0.12, 0);
            expect(reward).toBe(0);
        });

        it('should calculate full year reward correctly', () => {
            // 1000 GROW @ 12% APY for 365 days = 120 GROW
            const reward = calculateStakingReward(1000, 0.12, 365);
            expect(reward).toBeCloseTo(120, 1);
        });

        it('should handle large balances without overflow', () => {
            // 1,000,000 GROW @ 12% APY for 90 days
            const reward = calculateStakingReward(1000000, 0.12, 90);
            expect(reward).toBeCloseTo(29589.04, 1);
        });

        it('should return result with 4 decimal precision', () => {
            const reward = calculateStakingReward(100, 0.12, 30);
            const decimalPlaces = reward.toString().split('.')[1]?.length || 0;
            expect(decimalPlaces).toBeLessThanOrEqual(4);
        });
    });

    describe('formatToken', () => {
        it('should format SHOP token with VND symbol', () => {
            const formatted = formatToken(1000, 'SHOP');
            expect(formatted).toContain('₫');
            expect(formatted).toContain('1,000');
        });

        it('should format GROW token with Token suffix', () => {
            const formatted = formatToken(100.5, 'GROW');
            expect(formatted).toContain('Token');
            expect(formatted).toContain('100.50');
        });

        it('should show minimum 2 decimal places', () => {
            const formatted = formatToken(100, 'SHOP');
            expect(formatted).toContain('100.00');
        });

        it('should show up to 4 decimal places for precision', () => {
            const formatted = formatToken(100.1234, 'GROW');
            expect(formatted).toContain('100.1234');
        });
    });

    describe('generateTxHash', () => {
        it('should generate hash with correct length (66 chars)', () => {
            const hash = generateTxHash();
            expect(hash.length).toBe(66);
        });

        it('should start with 0x prefix', () => {
            const hash = generateTxHash();
            expect(hash.startsWith('0x')).toBe(true);
        });

        it('should contain only valid hex characters after prefix', () => {
            const hash = generateTxHash();
            const hexPart = hash.slice(2);
            expect(hexPart).toMatch(/^[0-9a-f]+$/);
        });

        it('should generate unique hashes', () => {
            const hash1 = generateTxHash();
            const hash2 = generateTxHash();
            expect(hash1).not.toBe(hash2);
        });
    });
});
