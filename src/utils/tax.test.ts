import { describe, it, expect } from 'vitest';
import { calculatePIT } from './tax';

describe('calculatePIT (Personal Income Tax)', () => {
  it('should not apply tax for amounts below threshold (2,000,000 VND)', () => {
    const result = calculatePIT(1500000);
    expect(result.taxAmount).toBe(0);
    expect(result.isTaxable).toBe(false);
    expect(result.net).toBe(1500000);
    expect(result.gross).toBe(1500000);
  });

  it('should apply tax at threshold (2,000,000 VND)', () => {
    const result = calculatePIT(2000000);
    // Tax = 2,000,000 * 0.1 = 200,000
    expect(result.taxAmount).toBe(200000);
    expect(result.isTaxable).toBe(true);
    expect(result.net).toBe(1800000);
  });

  it('should apply 10% tax for amounts at or above threshold', () => {
    const result = calculatePIT(3000000);
    // Tax = 3,000,000 * 0.1 = 300,000
    expect(result.taxAmount).toBe(300000);
    expect(result.isTaxable).toBe(true);
    expect(result.net).toBe(2700000);
  });

  it('should handle large amounts correctly', () => {
    const result = calculatePIT(10000000);
    // Tax = 10,000,000 * 0.1 = 1,000,000
    expect(result.taxAmount).toBe(1000000);
    expect(result.isTaxable).toBe(true);
    expect(result.net).toBe(9000000);
  });

  it('should handle zero amount', () => {
    const result = calculatePIT(0);
    expect(result.taxAmount).toBe(0);
    expect(result.isTaxable).toBe(false);
    expect(result.net).toBe(0);
    expect(result.gross).toBe(0);
  });

  it('should return correct tax rate', () => {
    const result = calculatePIT(5000000);
    expect(result.taxRate).toBe(0.1);
  });
});
