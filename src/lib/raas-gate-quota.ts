/**
 * RaaS Gateway - Quota Enforcement Middleware (Phase 6)
 *
 * Integrates quota enforcement into RaaS license gate.
 * Checks both license validity AND quota availability before allowing requests.
 *
 * Features:
 * - License validation (existing)
 * - Quota enforcement (Phase 6)
 * - Overage tracking (Phase 6)
 * - Hard/soft blocking modes
 *
 * Usage:
 *   import { checkLicenseAndQuota } from '@/lib/raas-gate-quota'
 *
 *   // In route guard
 *   const result = await checkLicenseAndQuota(apiKey, requiredFeature)
 *   if (!result.allowed) {
 *     return redirect('/dashboard/quota-exceeded')
 *   }
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { QuotaEnforcer } from '@/lib/quota-enforcer'
import type { LicenseValidationResult } from '@/lib/raas-gate'
import type {
  LicenseEnforcementResult,
  LicenseMiddlewareResult,
} from '@/types/license-enforcement'

export interface QuotaGateResult {
  allowed: boolean
  license?: LicenseValidationResult | LicenseEnforcementResult
  quotaStatus?: {
    metricType: string
    currentUsage: number
    effectiveQuota: number
    remaining: number
    percentageUsed: number
    isOverLimit: boolean
    overageUnits: number
  }
  error?: string
  statusCode?: number
  retryAfter?: number
}

export interface QuotaGateOptions {
  apiKey: string
  requiredFeature?: string
  orgId?: string
  userId?: string
  enforcementMode?: 'soft' | 'hard' | 'hybrid'
}

/**
 * Check both license validity and quota availability
 *
 * Flow:
 * 1. Validate RaaS license
 * 2. Get org/user from license
 * 3. Check quota via QuotaEnforcer
 * 4. Apply enforcement mode
 * 5. Return result
 */
export async function checkLicenseAndQuota(
  supabase: SupabaseClient,
  options: QuotaGateOptions
): Promise<QuotaGateResult> {
  const { apiKey, requiredFeature, orgId, userId, enforcementMode = 'hard' } = options

  // Step 1: Validate RaaS license (from raas-gate.ts)
  const { validateRaaSLicense } = await import('@/lib/raas-gate')
  const license = validateRaaSLicense(apiKey)

  if (!license.isValid) {
    return {
      allowed: false,
      license,
      error: 'Invalid or inactive RaaS license',
    }
  }

  // Step 2: Check feature access if required
  if (requiredFeature && !license.features[requiredFeature]) {
    return {
      allowed: false,
      license,
      error: `Feature '${requiredFeature}' not available in ${license.tier} tier`,
    }
  }

  // Step 3: Get org/user ID from license metadata or options
  let targetOrgId = orgId
  let targetUserId = userId

  if (!targetOrgId && !targetUserId) {
    // Try to fetch from license metadata
    const { data: licenseData } = await supabase
      .from('raas_licenses')
      .select('org_id, user_id')
      .eq('license_key', apiKey)
      .eq('status', 'active')
      .single()

    targetOrgId = licenseData?.org_id
    targetUserId = licenseData?.user_id
  }

  // Step 4: Check quota if we have context
  if (!targetOrgId && !targetUserId) {
    // No quota tracking for this context
    return {
      allowed: true,
      license,
    }
  }

  // Step 5: Initialize quota enforcer
  const enforcer = new QuotaEnforcer(supabase, {
    orgId: targetOrgId || '',
    tenantId: undefined, // Can be extended for multi-tenant
    userId: targetUserId,
    licenseId: undefined, // Can be extended
    enforcementMode,
  })

  // Step 6: Check quota for primary metric (api_calls)
  // Extended to check multiple metrics if needed
  const quotaStatus = await enforcer.checkQuota('api_calls')

  if (!quotaStatus.allowed) {
    return {
      allowed: false,
      license,
      quotaStatus: {
        metricType: 'api_calls',
        currentUsage: quotaStatus.currentUsage,
        effectiveQuota: quotaStatus.effectiveQuota,
        remaining: quotaStatus.remaining,
        percentageUsed: quotaStatus.percentageUsed,
        isOverLimit: quotaStatus.isOverLimit,
        overageUnits: quotaStatus.overageUnits,
      },
      error: quotaStatus.isOverLimit
        ? 'Quota exceeded - upgrade plan or wait for reset'
        : 'Quota check failed',
      retryAfter: quotaStatus.retryAfter,
    }
  }

  // Step 7: All checks passed
  return {
    allowed: true,
    license,
    quotaStatus: {
      metricType: 'api_calls',
      currentUsage: quotaStatus.currentUsage,
      effectiveQuota: quotaStatus.effectiveQuota,
      remaining: quotaStatus.remaining,
      percentageUsed: quotaStatus.percentageUsed,
      isOverLimit: quotaStatus.isOverLimit,
      overageUnits: quotaStatus.overageUnits,
    },
  }
}

/**
 * Create HTTP response for quota exceeded
 *
 * Usage:
 *   const result = await checkLicenseAndQuota(...)
 *   if (!result.allowed) {
 *     return quotaExceededResponse(result)
 *   }
 */
export function quotaExceededResponse(result: QuotaGateResult): Response {
  return new Response(
    JSON.stringify({
      error: 'quota_exceeded',
      message: result.error || 'Quota exceeded',
      details: {
        license: result.license ? {
          tier: result.license.tier,
          status: result.license.status,
        } : null,
        quota: result.quotaStatus,
      },
      upgrade_url: '/dashboard/subscription',
      retry_after: result.retryAfter,
    }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfter || 3600),
        'X-Quota-Limit': String(result.quotaStatus?.effectiveQuota || 0),
        'X-Quota-Remaining': '0',
        'X-Quota-Percentage': String(result.quotaStatus?.percentageUsed || 100),
      },
    }
  )
}

/**
 * Middleware helper for API routes
 *
 * Usage in API route:
 *   export async function GET(req: Request) {
 *     const apiKey = req.headers.get('X-API-Key')
 *     const result = await checkLicenseAndQuotaMiddleware(supabase, { apiKey })
 *     if (!result.allowed) {
 *       return quotaExceededResponse(result)
 *     }
 *     // Continue with request...
 *   }
 */
export async function checkLicenseAndQuotaMiddleware(
  supabase: SupabaseClient,
  request: Request
): Promise<QuotaGateResult> {
  const apiKey = request.headers.get('X-API-Key') || ''
  const url = new URL(request.url)

  return checkLicenseAndQuota(supabase, {
    apiKey,
    enforcementMode: 'hybrid', // Use hybrid mode for API routes
  })
}

export const raasGateQuota = {
  checkLicenseAndQuota,
  quotaExceededResponse,
  checkLicenseAndQuotaMiddleware,
}

export default raasGateQuota

/**
 * Enhanced middleware combining license validation + quota check
 * Uses new RaaS Gateway Client for license validation (Phase 6.2)
 *
 * Usage:
 *   import { enhancedLicenseQuotaMiddleware } from '@/lib/raas-gate-quota'
 *
 *   export async function GET(req: Request) {
 *     const result = await enhancedLicenseQuotaMiddleware(supabase, req)
 *     if (!result.allowed) {
 *       return licenseDeniedResponse(result)
 *     }
 *   }
 */
export async function enhancedLicenseQuotaMiddleware(
  supabase: SupabaseClient,
  request: Request,
  options?: {
    enforcementMode?: 'soft' | 'hard' | 'hybrid'
    requireFeature?: string
  }
): Promise<QuotaGateResult> {
  const apiKey = request.headers.get('X-API-Key') || ''

  // Use new license validation middleware (Phase 6.2)
  const { licenseValidationMiddleware } = await import(
    '@/lib/raas-license-middleware'
  )

  const licenseResult = await licenseValidationMiddleware(request, {
    requireFeature: options?.requireFeature,
    enableGracePeriod: true,
    failOpen: true,
  })

  if (!licenseResult.allowed) {
    return {
      allowed: false,
      license: licenseResult.license,
      error: licenseResult.error,
      statusCode: licenseResult.statusCode,
      retryAfter: licenseResult.retryAfter,
    }
  }

  // License valid - now check quota
  return checkLicenseAndQuotaMiddleware(supabase, request)
}
