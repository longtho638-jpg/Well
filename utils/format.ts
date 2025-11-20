
/**
 * Formats a number into Vietnamese Dong currency string.
 * Example: 15.000.000 ₫
 */
export const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount).replace('₫', 'đ'); 
};

/**
 * Formats large numbers into compact strings.
 * Example: 15M, 1.5K
 */
export const formatCompact = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(amount);
};

/**
 * RULE: VN_PIT_10
 * Description: Personal Income Tax Withholding
 * Condition: transaction_amount >= 2,000,000 VND
 * Action: Deduct 10%
 */
export const calculateTax = (amount: number) => {
  const TAX_THRESHOLD = 2000000;
  const TAX_RATE = 0.10;

  const isTaxable = amount >= TAX_THRESHOLD;
  const taxAmount = isTaxable ? amount * TAX_RATE : 0;
  const netAmount = amount - taxAmount;

  return {
    gross: amount,
    tax: taxAmount,
    net: netAmount,
    isTaxable
  };
};
