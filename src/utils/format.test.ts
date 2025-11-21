import { describe, it, expect } from 'vitest';
import { formatVND, formatCompact, formatPercent } from './format';

describe('formatVND', () => {
  it('should format VND currency correctly', () => {
    const result = formatVND(1500000);
    expect(result).toContain('1.500.000');
    expect(result).toContain('đ');
  });

  it('should handle zero', () => {
    const result = formatVND(0);
    expect(result).toContain('0');
    expect(result).toContain('đ');
  });

  it('should handle large numbers', () => {
    const result = formatVND(100000000);
    expect(result).toContain('100.000.000');
    expect(result).toContain('đ');
  });

  it('should handle decimal values by rounding', () => {
    const result = formatVND(1500000.99);
    expect(result).toContain('1.500.00');
    expect(result).toContain('đ');
  });
});

describe('formatCompact', () => {
  it('should format numbers in compact notation', () => {
    expect(formatCompact(1500)).toBe('1.5K');
  });

  it('should handle millions', () => {
    expect(formatCompact(1500000)).toBe('1.5M');
  });

  it('should handle billions', () => {
    expect(formatCompact(1500000000)).toBe('1.5B');
  });

  it('should handle small numbers', () => {
    expect(formatCompact(100)).toBe('100');
  });
});

describe('formatPercent', () => {
  it('should format positive percentages with plus sign', () => {
    expect(formatPercent(12.5)).toBe('+12.5%');
  });

  it('should format negative percentages without extra sign', () => {
    expect(formatPercent(-5.2)).toBe('-5.2%');
  });

  it('should format zero without sign', () => {
    expect(formatPercent(0)).toBe('0.0%');
  });

  it('should round to one decimal place', () => {
    expect(formatPercent(12.567)).toBe('+12.6%');
  });
});
