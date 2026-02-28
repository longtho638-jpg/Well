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
