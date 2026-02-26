/**
 * Business Utilities - Tokenomics, Tax, Commission
 * Consolidated utility module for business logic
 */

export * from './commission';

// ============================================================================
// TOKENOMICS
// ============================================================================

/**
 * Generate a pseudo-random transaction hash
 */
export function generateTxHash(): string {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 64; i++) {
        hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
}

/**
 * Calculate staking reward based on APY and duration
 * @param principal - Amount staked
 * @param apy - Annual Percentage Yield (e.g., 0.12 for 12%)
 * @param days - Staking duration in days
 */
export function calculateStakingReward(principal: number, apy: number, days: number): number {
    // Simple interest calculation for demonstration
    const dailyRate = apy / 365;
    return principal * dailyRate * days;
}

/**
 * Convert GROW tokens to VND equivalent
 * Rate: 1 GROW = 10,000 VND
 */
export function growToVND(growAmount: number): number {
    const GROW_TO_VND_RATE = 10000;
    return growAmount * GROW_TO_VND_RATE;
}

/**
 * Convert VND to GROW tokens
 * Rate: 1 GROW = 10,000 VND
 */
export function vndToGrow(vndAmount: number): number {
    const GROW_TO_VND_RATE = 10000;
    return vndAmount / GROW_TO_VND_RATE;
}

// ============================================================================
// TAX CALCULATIONS
// ============================================================================

export interface PITResult {
    grossAmount: number;
    taxAmount: number;
    netAmount: number;
    taxRate: number;
    isExempt: boolean;
}

/**
 * Calculate Personal Income Tax (PIT) for Vietnam
 * Current rule: 10% tax for amounts >= 2,000,000 VND
 */
export function calculatePIT(amount: number): PITResult {
    const TAX_THRESHOLD = 2000000; // 2M VND
    const TAX_RATE = 0.10; // 10%

    const isExempt = amount < TAX_THRESHOLD;
    const taxAmount = isExempt ? 0 : amount * TAX_RATE;
    const netAmount = amount - taxAmount;

    return {
        grossAmount: amount,
        taxAmount,
        netAmount,
        taxRate: isExempt ? 0 : TAX_RATE,
        isExempt
    };
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate withdrawal amount
 */
export function validateWithdrawalAmount(
    amount: number,
    balance: number
): { valid: boolean; error?: string } {
    if (amount <= 0) {
        return { valid: false, error: 'Số tiền phải lớn hơn 0' };
    }
    if (amount > balance) {
        return { valid: false, error: 'Số dư không đủ' };
    }
    return { valid: true };
}

/**
 * Validate staking amount
 */
export function validateStakingAmount(
    amount: number,
    balance: number,
    minStake: number = 100
): { valid: boolean; error?: string } {
    if (amount <= 0) {
        return { valid: false, error: 'Số lượng phải lớn hơn 0' };
    }
    if (amount < minStake) {
        return { valid: false, error: `Số lượng tối thiểu là ${minStake} GROW` };
    }
    if (amount > balance) {
        return { valid: false, error: 'Số dư GROW không đủ' };
    }
    return { valid: true };
}
