/**
 * Vibe i18n SDK — Tenant-Aware Locale Resolution
 *
 * Bridges vibe-tenant + vibe-i18n: resolves locale with tenant override.
 * Priority: tenant config → user preference → browser detection → fallback.
 *
 * Usage:
 *   import { resolveTenantLocale } from '@/lib/vibe-i18n';
 *   const locale = await resolveTenantLocale(deps);
 */

import type { Locale } from './types';
import { LOCALES } from './types';
import { detectLocale, setLocale } from './format-utils';

// ─── Types ──────────────────────────────────────────────────────

/** Tenant locale configuration — stored per org */
export interface TenantLocaleConfig {
  /** Force a specific locale for all users in this tenant */
  forcedLocale?: Locale;
  /** Default locale for new users (overridable by user) */
  defaultLocale?: Locale;
  /** Allowed locales for this tenant (empty = all) */
  allowedLocales?: Locale[];
  /** Tenant-specific currency override (e.g. VND for VN-only tenants) */
  currencyOverride?: string;
}

/** Deps injected for tenant-locale resolution */
export interface TenantLocaleDeps {
  /** Get locale config for current tenant */
  getTenantLocaleConfig: (tenantSlug: string) => Promise<TenantLocaleConfig | null>;
}

/** Result of tenant-aware locale resolution */
export interface TenantLocaleResult {
  locale: Locale;
  source: 'tenant-forced' | 'user-preference' | 'tenant-default' | 'browser' | 'fallback';
  tenantSlug: string | null;
  isLockedByTenant: boolean;
  allowedLocales: Locale[];
  currencyOverride: string | null;
}

// ─── Validation ─────────────────────────────────────────────────

/** Check if a string is a valid Locale */
function isValidLocale(value: string): value is Locale {
  return value in LOCALES;
}

// ─── Resolver ───────────────────────────────────────────────────

/**
 * Resolve locale with tenant awareness.
 * Priority:
 * 1. Tenant forced locale (org-wide, users can't change)
 * 2. User stored preference (if allowed by tenant)
 * 3. Tenant default locale
 * 4. Browser detection
 * 5. Fallback 'vi'
 */
export async function resolveTenantLocale(
  tenantSlug: string | null,
  deps: TenantLocaleDeps,
): Promise<TenantLocaleResult> {
  const allLocales = Object.keys(LOCALES) as Locale[];

  // No tenant — fall back to standard detection
  if (!tenantSlug) {
    const locale = detectLocale();
    return {
      locale,
      source: 'browser',
      tenantSlug: null,
      isLockedByTenant: false,
      allowedLocales: allLocales,
      currencyOverride: null,
    };
  }

  const config = await deps.getTenantLocaleConfig(tenantSlug);

  // No config found — standard detection
  if (!config) {
    const locale = detectLocale();
    return {
      locale,
      source: 'browser',
      tenantSlug,
      isLockedByTenant: false,
      allowedLocales: allLocales,
      currencyOverride: null,
    };
  }

  const allowed = config.allowedLocales?.length
    ? config.allowedLocales.filter(isValidLocale)
    : allLocales;

  const currencyOverride = config.currencyOverride ?? null;

  // 1. Tenant forced locale — no user override
  if (config.forcedLocale && isValidLocale(config.forcedLocale)) {
    setLocale(config.forcedLocale);
    return {
      locale: config.forcedLocale,
      source: 'tenant-forced',
      tenantSlug,
      isLockedByTenant: true,
      allowedLocales: [config.forcedLocale],
      currencyOverride,
    };
  }

  // 2. User preference (if within allowed locales)
  const userLocale = detectLocale();
  if (allowed.includes(userLocale)) {
    return {
      locale: userLocale,
      source: 'user-preference',
      tenantSlug,
      isLockedByTenant: false,
      allowedLocales: allowed,
      currencyOverride,
    };
  }

  // 3. Tenant default locale
  if (config.defaultLocale && isValidLocale(config.defaultLocale)) {
    setLocale(config.defaultLocale);
    return {
      locale: config.defaultLocale,
      source: 'tenant-default',
      tenantSlug,
      isLockedByTenant: false,
      allowedLocales: allowed,
      currencyOverride,
    };
  }

  // 4. First allowed locale or fallback
  const fallback = allowed[0] ?? 'vi';
  setLocale(fallback);
  return {
    locale: fallback,
    source: 'fallback',
    tenantSlug,
    isLockedByTenant: false,
    allowedLocales: allowed,
    currencyOverride,
  };
}

/**
 * Check if user can switch locale within tenant constraints.
 */
export function canSwitchLocale(result: TenantLocaleResult): boolean {
  return !result.isLockedByTenant && result.allowedLocales.length > 1;
}

/**
 * Get allowed locale options for UI language picker.
 * Returns empty array if tenant locks locale.
 */
export function getLocaleOptions(result: TenantLocaleResult) {
  if (result.isLockedByTenant) return [];
  return result.allowedLocales.map((code) => ({
    code,
    name: LOCALES[code].name,
    nativeName: LOCALES[code].nativeName,
  }));
}
