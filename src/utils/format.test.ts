import { describe, it, expect } from 'vitest';
import { formatVND, formatNumber, formatPercent } from './format';

describe('formatVND', () => {
  it('should format Vietnamese currency correctly', () => {
    expect(formatVND(1000000)).toBe('1.000.000\u00A0đ'); // \u00A0 is non-breaking space
    expect(formatVND(500000)).toBe('500.000\u00A0đ');
    expect(formatVND(0)).toBe('0\u00A0đ');
  });

  it('should handle large numbers', () => {
    expect(formatVND(100000000)).toBe('100.000.000\u00A0đ');
  });

  it('should handle negative numbers', () => {
    expect(formatVND(-500000)).toBe('-500.000\u00A0đ');
  });
});

describe('formatNumber', () => {
  it('should format numbers with thousand separators', () => {
    expect(formatNumber(1000)).toBe('1.000');
    expect(formatNumber(5000)).toBe('5.000');
    expect(formatNumber(100)).toBe('100');
  });
});

describe('formatPercent', () => {
  it('should format percentages correctly with + sign for positive', () => {
    expect(formatPercent(12.5)).toBe('+12.5%');
    expect(formatPercent(50)).toBe('+50.0%');
    expect(formatPercent(100)).toBe('+100.0%');
  });

  it('should handle zero without sign', () => {
    expect(formatPercent(0)).toBe('0.0%');
  });

  it('should handle negative percentages', () => {
    expect(formatPercent(-5.5)).toBe('-5.5%');
  });
});
