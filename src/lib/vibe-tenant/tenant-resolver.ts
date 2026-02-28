/**
 * Vibe Tenant SDK — Multi-Org Tenant Resolution
 *
 * Resolves current tenant from: subdomain → localStorage → user default org.
 * Provider-agnostic — works with any org/subscription backend.
 */

// ─── Types ──────────────────────────────────────────────────────

export interface TenantInfo {
  orgId: string;
  orgSlug: string;
  orgName: string;
  source: 'subdomain' | 'storage' | 'default';
}

export interface TenantResolverConfig {
  /** Base domain for subdomain extraction (e.g. 'wellnexus.vn') */
  baseDomain: string;
  /** localStorage key for persisted tenant selection */
  storageKey?: string;
  /** Subdomains to ignore (treated as main app, not tenant) */
  reservedSubdomains?: string[];
}

const DEFAULT_STORAGE_KEY = 'vibe_current_tenant';
const DEFAULT_RESERVED = ['www', 'app', 'api', 'admin', 'staging', 'dev'];

// ─── Subdomain Detection ────────────────────────────────────────

/** Extract subdomain from current hostname */
export function extractSubdomain(
  hostname: string,
  baseDomain: string,
  reserved: string[] = DEFAULT_RESERVED,
): string | null {
  // Remove port if present
  const host = hostname.split(':')[0];

  // localhost or IP — no subdomain
  if (host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return null;
  }

  // Must end with baseDomain
  if (!host.endsWith(baseDomain)) return null;

  // Extract prefix before baseDomain
  const prefix = host.slice(0, -(baseDomain.length + 1)); // +1 for the dot
  if (!prefix || reserved.includes(prefix)) return null;

  return prefix;
}

// ─── Storage ────────────────────────────────────────────────────

/** Get persisted tenant slug from localStorage */
export function getStoredTenant(storageKey = DEFAULT_STORAGE_KEY): string | null {
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

/** Persist tenant slug to localStorage */
export function setStoredTenant(slug: string, storageKey = DEFAULT_STORAGE_KEY): void {
  try {
    localStorage.setItem(storageKey, slug);
  } catch {
    // SSR or storage unavailable
  }
}

/** Clear persisted tenant */
export function clearStoredTenant(storageKey = DEFAULT_STORAGE_KEY): void {
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // SSR or storage unavailable
  }
}

// ─── Resolver ───────────────────────────────────────────────────

/**
 * Resolve current tenant from multiple sources (priority order):
 * 1. Subdomain (e.g. acme.wellnexus.vn → slug='acme')
 * 2. localStorage (persisted selection)
 * 3. Default org (first in user's org list)
 */
export function resolveTenantSlug(
  config: TenantResolverConfig,
  defaultOrgSlug?: string,
): { slug: string; source: TenantInfo['source'] } | null {
  const { baseDomain, storageKey, reservedSubdomains } = config;

  // 1. Subdomain
  if (typeof window !== 'undefined') {
    const subdomain = extractSubdomain(
      window.location.hostname,
      baseDomain,
      reservedSubdomains ?? DEFAULT_RESERVED,
    );
    if (subdomain) {
      setStoredTenant(subdomain, storageKey);
      return { slug: subdomain, source: 'subdomain' };
    }
  }

  // 2. localStorage
  const stored = getStoredTenant(storageKey);
  if (stored) {
    return { slug: stored, source: 'storage' };
  }

  // 3. Default org
  if (defaultOrgSlug) {
    return { slug: defaultOrgSlug, source: 'default' };
  }

  return null;
}
