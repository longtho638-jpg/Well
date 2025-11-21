/**
 * CONSTANTS.TS - Centralized Constants
 * Zero Magic Numbers Policy - All hard-coded values must be defined here
 */

// ===== TAX CONSTANTS (Vietnam Circular 111/2013/TT-BTC) =====
export const TAX_CONSTANTS = {
  /** Personal Income Tax threshold (VND) */
  THRESHOLD: 2_000_000,
  /** Personal Income Tax rate (10%) */
  RATE: 0.1,
  /** Tax display percentage for UI */
  RATE_DISPLAY: 10,
} as const;

// ===== COMMISSION CONSTANTS =====
export const COMMISSION_CONSTANTS = {
  /** Low-tier product commission (15%) */
  TIER_LOW: 0.15,
  /** Mid-tier product commission (20%) */
  TIER_MID: 0.20,
  /** High-tier product commission (25%) */
  TIER_HIGH: 0.25,
  /** Team volume bonus rate (25%) */
  TEAM_BONUS_RATE: 0.25,
} as const;

// ===== KPI & RANK THRESHOLDS =====
export const KPI_CONSTANTS = {
  /** Founder Club team volume requirement (VND) */
  FOUNDER_CLUB_VOLUME: 100_000_000,
  /** Elite rank threshold (VND) */
  ELITE_THRESHOLD: 100_000_000,
  /** Policy Engine GMV target (VND) */
  GMV_TARGET: 1_000_000_000,
} as const;

// ===== TOKENOMICS CONSTANTS =====
export const TOKENOMICS_CONSTANTS = {
  /** Annual Percentage Yield for GROW token staking (12%) */
  DEFAULT_APY: 0.12,
  /** Default profit margin for calculations (20%) */
  PROFIT_MARGIN: 0.20,
  /** Default staking period (days) */
  DEFAULT_STAKING_DAYS: 30,
  /** GROW to VND conversion rate */
  GROW_TO_VND_RATE: 10_000,
  /** Price-to-Earnings ratio for business valuation */
  PE_RATIO: 5,
  /** Months in a year for annualization */
  MONTHS_PER_YEAR: 12,
} as const;

// ===== WEALTH OS CALCULATION CONSTANTS =====
export const WEALTH_OS_CONSTANTS = {
  /** Team volume threshold for Elite rank (100M VND) */
  ELITE_VOLUME_THRESHOLD: 100_000_000,
  /** Team volume threshold for Advanced rank (50M VND) */
  ADVANCED_VOLUME_THRESHOLD: 50_000_000,
  /** Team volume threshold for Intermediate rank (20M VND) */
  INTERMEDIATE_VOLUME_THRESHOLD: 20_000_000,
  /** Growth rate for Elite tier (15% monthly) */
  GROWTH_RATE_ELITE: 15,
  /** Growth rate for Advanced tier (10% monthly) */
  GROWTH_RATE_ADVANCED: 10,
  /** Growth rate for Intermediate tier (7% monthly) */
  GROWTH_RATE_INTERMEDIATE: 7,
  /** Baseline growth rate (5% monthly) */
  GROWTH_RATE_BASELINE: 5,
} as const;

// ===== CURRENCY DISPLAY CONSTANTS =====
export const CURRENCY_CONSTANTS = {
  /** VND symbol */
  VND_SYMBOL: '₫',
  /** Divisor for million display (1M = 1,000,000) */
  MILLION_DIVISOR: 1_000_000,
  /** Decimal places for VND display */
  VND_DECIMALS: 0,
  /** Decimal places for token display */
  TOKEN_DECIMALS: 2,
} as const;

// ===== QUICK AMOUNT PRESETS =====
export const QUICK_AMOUNTS = {
  /** Quick withdrawal amount multiplier (25% of balance) */
  WITHDRAWAL_MULTIPLIER: 0.25,
} as const;

// ===== PRODUCT PRICE CONSTANTS (Mock Data References) =====
export const PRODUCT_PRICES = {
  /** ANIMA 119 flagship product (VND) */
  ANIMA_119: 15_900_000,
  /** Starter Kit product (VND) */
  STARTER_KIT: 4_500_000,
  /** Default leaderboard baseline (VND) */
  LEADERBOARD_DEFAULT: 5_000_000,
  /** Leaderboard decrement step (VND) */
  LEADERBOARD_STEP: 8_000_000,
} as const;

// ===== ADMIN & SYSTEM CONSTANTS =====
export const ADMIN_CONSTANTS = {
  /** Default gross revenue for admin panel (VND) */
  DEFAULT_GROSS_REVENUE: 5_000_000,
} as const;

// ===== THEME CONSTANTS (For Logic, Not Tailwind) =====
export const THEME_CONSTANTS = {
  /** Primary brand color (Deep Teal) */
  PRIMARY_COLOR: '#00575A',
  /** Accent brand color (Marigold) */
  ACCENT_COLOR: '#FFBF00',
} as const;

// ===== TYPE EXPORTS FOR TYPE SAFETY =====
export type TaxConstants = typeof TAX_CONSTANTS;
export type CommissionConstants = typeof COMMISSION_CONSTANTS;
export type KpiConstants = typeof KPI_CONSTANTS;
export type TokenomicsConstants = typeof TOKENOMICS_CONSTANTS;
export type CurrencyConstants = typeof CURRENCY_CONSTANTS;
