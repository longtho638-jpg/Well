import { describe, it, expect } from 'vitest';
import { calculatePIT, TAX_CONSTANTS } from './tax';

describe('calculatePIT', () => {
  describe('below threshold', () => {
    it('should not apply tax for amounts below 2,000,000 VND', () => {
      const result = calculatePIT(1000000);

      expect(result.gross).toBe(1000000);
      expect(result.taxAmount).toBe(0);
      expect(result.net).toBe(1000000);
      expect(result.isTaxable).toBe(false);
      expect(result.taxRate).toBe(0);
    });

    it('should not apply tax for amounts exactly at threshold minus 1', () => {
      const result = calculatePIT(1999999);

      expect(result.taxAmount).toBe(0);
      expect(result.isTaxable).toBe(false);
    });
  });

  describe('at or above threshold', () => {
    it('should apply 10% tax for amounts at exactly 2,000,000 VND', () => {
      const result = calculatePIT(2000000);

      expect(result.gross).toBe(2000000);
      expect(result.taxAmount).toBe(200000);
      expect(result.net).toBe(1800000);
      expect(result.isTaxable).toBe(true);
      expect(result.taxRate).toBe(0.10);
    });

    it('should apply 10% tax for amounts above threshold', () => {
      const result = calculatePIT(5000000);

      expect(result.gross).toBe(5000000);
      expect(result.taxAmount).toBe(500000);
      expect(result.net).toBe(4500000);
      expect(result.isTaxable).toBe(true);
      expect(result.taxRate).toBe(0.10);
    });

    it('should handle large commission amounts correctly', () => {
      const result = calculatePIT(15900000); // ANIMA 119 full commission

      expect(result.gross).toBe(15900000);
      expect(result.taxAmount).toBe(1590000);
      expect(result.net).toBe(14310000);
      expect(result.isTaxable).toBe(true);
    });
  });

  describe('tax constants', () => {
    it('should have correct threshold value', () => {
      expect(TAX_CONSTANTS.THRESHOLD).toBe(2000000);
    });

    it('should have correct tax rate', () => {
      expect(TAX_CONSTANTS.RATE).toBe(0.10);
    });
  });

  describe('edge cases', () => {
    it('should handle zero amount', () => {
      const result = calculatePIT(0);

      expect(result.gross).toBe(0);
      expect(result.taxAmount).toBe(0);
      expect(result.net).toBe(0);
      expect(result.isTaxable).toBe(false);
    });

    it('should handle decimal amounts', () => {
      const result = calculatePIT(2500000.50);

      expect(result.gross).toBe(2500000.50);
      expect(result.taxAmount).toBeCloseTo(250000.05, 2);
      expect(result.net).toBeCloseTo(2250000.45, 2);
      expect(result.isTaxable).toBe(true);
    });
  });
});
