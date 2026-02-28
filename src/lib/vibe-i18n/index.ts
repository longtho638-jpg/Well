/**
 * Vibe i18n SDK — Entry Point
 *
 * Provider-agnostic internationalization for RaaS projects.
 * Memoized formatters, locale detection, pluralization.
 *
 * Usage:
 *   import { formatCurrency, detectLocale, LOCALES } from '@/lib/vibe-i18n';
 *   import type { Locale, LocaleConfig } from '@/lib/vibe-i18n';
 */

// Re-export types
export type { Locale, TextDirection, LocaleConfig, PluralForms } from './types';
export { LOCALES } from './types';

// Memoized Intl formatters
export {
  getNumberFormatter,
  getCurrencyFormatter,
  getPercentFormatter,
  getDateFormatter,
  getDateTimeFormatter,
  getRelativeTimeFormatter,
} from './memoized-intl-formatters';

// High-level format utilities
export {
  formatNumber,
  formatCurrency,
  formatPercent,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatTime,
  formatShortDate,
  pluralize,
  detectLocale,
  setLocale,
} from './format-utils';

// Tenant-aware locale resolution (vibe-tenant + vibe-i18n bridge)
export {
  resolveTenantLocale,
  canSwitchLocale,
  getLocaleOptions,
} from './tenant-locale-resolver';
export type {
  TenantLocaleConfig,
  TenantLocaleDeps,
  TenantLocaleResult,
} from './tenant-locale-resolver';
