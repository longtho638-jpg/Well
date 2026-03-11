/**
 * Tenant Context Middleware - Phase 6.3
 *
 * Extracts and validates tenant context from incoming requests.
 * Supports multi-tenant license enforcement with:
 * - JWT-based tenant extraction
 * - X-Tenant-ID header fallback
 * - Tenant validation against database
 * - Request context injection
 *
 * @see {@link ../lib/rbac-engine.ts} RBAC engine with tenant claims
 */

import { supabase } from '@/lib/supabase'
import type { RaasJwtClaims } from '@/lib/rbac-engine'
import { createLogger } from '@/utils/logger'

const logger = createLogger('TenantMiddleware')

/**
 * Tenant context extracted from request
 */
export interface TenantContext {
  tenantId: string
  tenantPolicyId?: string
  tenantName?: string
  tenantStatus: 'active' | 'suspended' | 'inactive'
  customerId: string
  isValid: boolean
  error?: string
}

/**
 * Request interface with tenant context injection
 */
export interface TenantRequest {
  headers?: Headers
  jwtClaims?: Partial<RaasJwtClaims>
  tenantContext?: TenantContext
}

/**
 * Extract tenant from JWT claims
 */
export function extractTenantFromJwt(claims: RaasJwtClaims): string | undefined {
  return claims.tenant_id
}

/**
 * Extract tenant from X-Tenant-ID header
 */
export function extractTenantFromHeader(headers: Headers): string | undefined {
  return headers.get('X-Tenant-ID') || undefined
}

/**
 * Validate tenant exists and is active
 */
export async function validateTenant(tenantId: string): Promise<{
  valid: boolean
  tenant?: {
    id: string
    name: string
    status: 'active' | 'suspended' | 'inactive'
    customer_id: string
    policy_id?: string
  }
  error?: string
}> {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('id, name, status, customer_id, policy_id')
      .eq('id', tenantId)
      .single()

    if (error || !data) {
      return {
        valid: false,
        error: error?.message || 'Tenant not found',
      }
    }

    if (data.status !== 'active') {
      return {
        valid: false,
        tenant: data,
        error: `Tenant is ${data.status}`,
      }
    }

    return {
      valid: true,
      tenant: data,
    }
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Build tenant context from request
 */
export async function buildTenantContext(
  request: TenantRequest
): Promise<TenantContext> {
  // Priority 1: JWT claims
  let tenantId = request.jwtClaims?.tenant_id

  // Priority 2: X-Tenant-ID header
  if (!tenantId && request.headers) {
    tenantId = extractTenantFromHeader(request.headers)
  }

  // No tenant found
  if (!tenantId) {
    return {
      tenantId: '',
      tenantStatus: 'inactive',
      customerId: '',
      isValid: false,
      error: 'No tenant context found',
    }
  }

  // Validate tenant
  const validation = await validateTenant(tenantId)

  if (!validation.valid) {
    return {
      tenantId,
      tenantStatus: 'inactive',
      customerId: validation.tenant?.customer_id || '',
      isValid: false,
      error: validation.error,
    }
  }

  // Build successful context
  return {
    tenantId: validation.tenant!.id,
    tenantPolicyId: validation.tenant!.policy_id,
    tenantName: validation.tenant!.name,
    tenantStatus: validation.tenant!.status,
    customerId: validation.tenant!.customer_id,
    isValid: true,
  }
}

/**
 * Inject tenant context into request
 */
export function injectTenantContext(
  request: TenantRequest,
  context: TenantContext
): TenantRequest {
  return {
    ...request,
    tenantContext: context,
  }
}

/**
 * Express/Cloudflare Workers middleware factory
 */
export function createTenantMiddleware() {
  return async (req: TenantRequest, res: {
    status?: (code: number) => { json?: (data: any) => void }
    setHeader?: (key: string, value: string) => void
  }, next: () => void) => {
    try {
      const context = await buildTenantContext(req)

      // Add tenant context to request
      req.tenantContext = context

      // Add headers for downstream
      if (res.setHeader) {
        res.setHeader('X-Tenant-ID', context.tenantId)
        res.setHeader('X-Tenant-Status', context.tenantStatus)
      }

      // If tenant is invalid, return 403
      if (!context.isValid) {
        res.status?.(403)?.json?.({
          error: 'Tenant validation failed',
          message: context.error,
          tenant_id: context.tenantId,
        })
        return
      }

      next()
    } catch (err) {
      logger.error('Middleware error', { error: err })
      next() // Fail open on error (development mode)
    }
  }
}

/**
 * Get tenant rate limit policy
 */
export async function getTenantRateLimitPolicy(
  tenantPolicyId: string
): Promise<{
  requestsPerSecond?: number
  requestsPerMinute?: number
  requestsPerHour?: number
  requestsPerDay?: number
  burstLimit?: number
  concurrentRequests?: number
} | null> {
  try {
    const { data, error } = await supabase
      .from('tenant_license_policies')
      .select('rate_limit_config')
      .eq('id', tenantPolicyId)
      .single()

    if (error || !data) {
      return null
    }

    return data.rate_limit_config || null
  } catch (err) {
    logger.warn('Rate limit policy fetch failed', { error: err })
    return null
  }
}

/**
 * Get tenant quota override
 */
export async function getTenantQuotaOverride(
  tenantId: string,
  metricType: string
): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('tenant_quota_overrides')
      .select('quota_limit')
      .eq('tenant_id', tenantId)
      .eq('metric_type', metricType)
      .single()

    if (error || !data) {
      return null
    }

    return data.quota_limit
  } catch (err) {
    logger.warn('Quota override fetch failed', { error: err })
    return null
  }
}

/**
 * Tenant context hook for React components
 */
export { useTenantContext } from '@/hooks/use-tenant-context'
