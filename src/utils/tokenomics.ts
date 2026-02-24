import type { TokenType } from '@/types';

/**
 * Calculate staking rewards based on amount, APY, and days staked
 * @param amount - Amount of tokens staked
 * @param apy - Annual Percentage Yield (as decimal, e.g., 0.12 for 12%)
 * @param days - Number of days staked
 * @returns Total rewards earned
 */
export function calculateStakingReward(
  amount: number,
  apy: number,
  days: number
): number {
  if (amount < 0 || apy < 0 || days < 0) return 0;
  if (isNaN(amount) || isNaN(apy) || isNaN(days)) return 0;

  const dailyRate = apy / 365;
  const reward = amount * dailyRate * days;
  return Number(reward.toFixed(4));
}

/**
 * Format token amount with appropriate currency symbol
 * @param amount - Token amount to format
 * @param type - Token type (SHOP or GROW)
 * @returns Formatted string with currency symbol
 */
export function formatToken(amount: number, type: TokenType): string {
  if (isNaN(amount) || !isFinite(amount)) {
    return type === 'SHOP' ? '0 ₫' : '0 Token';
  }

  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });

  if (type === 'SHOP') {
    return `${formatted} ₫`;
  } else {
    return `${formatted} Token`;
  }
}

/**
 * Generate a mock blockchain transaction hash
 * @returns Hex string starting with 0x (66 characters total)
 */
export function generateTxHash(): string {
  const characters = '0123456789abcdef';
  let hash = '0x';

  // Generate 64 random hex characters (standard Ethereum tx hash length)
  for (let i = 0; i < 64; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    hash += characters[randomIndex];
  }

  return hash;
}
