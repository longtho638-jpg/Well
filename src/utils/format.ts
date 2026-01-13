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

export const formatVND = (amount: number): string => {
  return vndFormatter.format(amount).replace('₫', 'đ');
};

export const formatCompact = (amount: number): string => {
  return compactFormatter.format(amount);
};

export const formatPercent = (value: number): string => {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

export const formatNumber = (num: number): string => {
  return numberFormatter.format(num);
};