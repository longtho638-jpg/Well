/**
 * Vibe Tenant SDK — Subdomain Route Matcher
 *
 * Maps resolved tenant slugs to route configurations.
 * Determines tenant-specific routing behavior: branding, redirects, access control.
 *
 * Usage:
 *   import { matchTenantRoute, createRouteConfig } from '@/lib/vibe-tenant';
 *   const route = matchTenantRoute('acme', routes);
 */

import type { TenantInfo, TenantResolverConfig } from './tenant-resolver';
import { resolveTenantSlug } from './tenant-resolver';

// ─── Types ──────────────────────────────────────────────────────

/** Route-level config per tenant */
export interface TenantRouteConfig {
  /** Tenant slug (e.g. 'acme') */
  slug: string;
  /** Landing page path override (default: '/') */
  landingPath?: string;
  /** Dashboard redirect path after login */
  dashboardPath?: string;
  /** Whether this tenant has public access (vs invite-only) */
  isPublic?: boolean;
  /** Custom theme/branding key */
  themeKey?: string;
  /** Feature flags specific to this tenant route */
  features?: string[];
}

/** Result of subdomain route resolution */
export interface SubdomainRouteResult {
  tenant: TenantInfo | null;
  route: TenantRouteConfig | null;
  isMainApp: boolean;
}

// ─── Route Matching ─────────────────────────────────────────────

/**
 * Match a tenant slug to its route config.
 * Returns null if no matching route found (tenant exists but no custom routing).
 */
export function matchTenantRoute(
  slug: string,
  routes: TenantRouteConfig[],
): TenantRouteConfig | null {
  return routes.find((r) => r.slug === slug) ?? null;
}

/**
 * Full subdomain route resolution pipeline:
 * 1. Resolve tenant slug from hostname/storage
 * 2. Match to route config
 * 3. Return combined result
 */
export function resolveSubdomainRoute(
  config: TenantResolverConfig,
  routes: TenantRouteConfig[],
  defaultOrgSlug?: string,
): SubdomainRouteResult {
  const resolved = resolveTenantSlug(config, defaultOrgSlug);

  if (!resolved) {
    return { tenant: null, route: null, isMainApp: true };
  }

  const route = matchTenantRoute(resolved.slug, routes);

  return {
    tenant: {
      orgId: '', // filled by caller after DB lookup
      orgSlug: resolved.slug,
      orgName: '', // filled by caller after DB lookup
      source: resolved.source,
    },
    route,
    isMainApp: false,
  };
}

/**
 * Convenience factory to create a route config with defaults.
 */
export function createRouteConfig(
  slug: string,
  overrides: Partial<Omit<TenantRouteConfig, 'slug'>> = {},
): TenantRouteConfig {
  return {
    slug,
    landingPath: '/',
    dashboardPath: '/dashboard',
    isPublic: true,
    ...overrides,
  };
}
