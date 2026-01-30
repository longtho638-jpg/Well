// Reusable formatters (Singleton pattern for performance)
const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: "compact",
  maximumFractionDigits: 1
});

const numberFormatter = new Intl.NumberFormat('vi-VN');

/**
 * Format currency to VND (e.g., 100.000 đ)
 */
export const formatVND = (amount: number): string => {
  return vndFormatter.format(amount).replace('₫', 'đ');
};

/**
 * Format large numbers compactly (e.g., 1.5K, 2M)
 */
export const formatCompact = (amount: number): string => {
  return compactFormatter.format(amount);
};

/**
 * Format decimal as percentage (e.g., +12.5%)
 */
export const formatPercent = (value: number): string => {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

/**
 * Format number with thousand separators
 */
export const formatNumber = (num: number): string => {
  return numberFormatter.format(num);
};