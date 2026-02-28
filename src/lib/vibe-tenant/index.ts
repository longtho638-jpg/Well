/**
 * Vibe Tenant SDK — Entry Point
 *
 * Multi-org tenant resolution for RaaS projects.
 * Resolves tenant from subdomain → localStorage → default org.
 *
 * Usage:
 *   import { resolveTenantSlug, extractSubdomain } from '@/lib/vibe-tenant';
 *   import type { TenantInfo, TenantResolverConfig } from '@/lib/vibe-tenant';
 */

export {
  extractSubdomain,
  getStoredTenant,
  setStoredTenant,
  clearStoredTenant,
  resolveTenantSlug,
} from './tenant-resolver';

export type {
  TenantInfo,
  TenantResolverConfig,
} from './tenant-resolver';

// Subdomain route matching (tenant slug → route config)
export {
  matchTenantRoute,
  resolveSubdomainRoute,
  createRouteConfig,
} from './subdomain-route-matcher';
export type {
  TenantRouteConfig,
  SubdomainRouteResult,
} from './subdomain-route-matcher';
