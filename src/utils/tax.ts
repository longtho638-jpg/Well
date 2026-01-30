/**
 * BUSINESS LOGIC RULE: VN_PIT_10
 * 
 * According to Vietnam Circular 111/2013/TT-BTC:
 * Income from commissions/bonuses exceeding 2,000,000 VND per payment
 * is subject to a provisional 10% Personal Income Tax (PIT) deduction.
 */

export interface TaxResult {
  gross: number;
  taxAmount: number;
  net: number;
  isTaxable: boolean;
  taxRate: number;
}

export const TAX_CONSTANTS = {
  THRESHOLD: 2000000, // 2.000.000 VND
  RATE: 0.10,         // 10%
};

/**
 * Calculate Personal Income Tax (PIT) for Vietnam
 * Applies 10% tax if amount >= 2,000,000 VND
 *
 * @param amount - Gross income amount in VND
 * @returns TaxResult object with gross, net, and tax details
 */
export const calculatePIT = (amount: number): TaxResult => {
  const isTaxable = amount >= TAX_CONSTANTS.THRESHOLD;
  const taxAmount = isTaxable ? amount * TAX_CONSTANTS.RATE : 0;
  const net = amount - taxAmount;

  return {
    gross: amount,
    taxAmount,
    net,
    isTaxable,
    taxRate: isTaxable ? TAX_CONSTANTS.RATE : 0
  };
};