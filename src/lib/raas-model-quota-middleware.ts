/**
 * RaaS Model Quota Middleware - Phase 6
 *
 * Middleware for enforcing AI model usage quotas and license tier validation.
 * Intercepts requests to AI model endpoints and validates:
 * - License tier access (Free/Pro/Enterprise)
 * - Monthly token quota
 * - Rate limiting
 *
 * Features:
 * - Endpoint pattern matching for OpenAI, Anthropic, Google, Local AI
 * - Tier-based model access control
 * - Quota enforcement with overage support
 * - 403 response with Vietnamese localization
 * - Analytics event emission on denied requests
 *
 * Usage:
 *   import { modelQuotaMiddleware } from '@/lib/raas-model-quota-middleware'
 *
 *   // In route guard or API middleware
 *   const result = await modelQuotaMiddleware(request, { supabase, env })
 *   if (!result.allowed) {
 *     return result.response
 *   }
 */

import { supabase } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ProtectedEndpoint,
  LicenseTier,
  ModelCategory,
} from '@/lib/model-endpoint-registry'
import {
  modelEndpointRegistry,
  matchProtectedEndpoint,
  canAccessModelCategory,
  getTokenQuotaForTier,
  isOverageAllowed,
} from '@/lib/model-endpoint-registry'
import { raas403Response } from '@/lib/raas-403-response'
import { raasAnalyticsEvents } from '@/lib/raas-analytics-events'
import { QuotaEnforcer } from '@/lib/quota-enforcer'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Result of model quota validation
 */
export interface ModelQuotaResult {
  /** Whether the request is allowed to proceed */
  allowed: boolean
  /** Matched protected endpoint */
  endpoint?: ProtectedEndpoint | null
  /** License tier */
  tier?: LicenseTier
  /** Quota status */
  quotaStatus?: {
    currentUsage: number
    quota: number
    remaining: number
    percentageUsed: number
    isOverLimit: boolean
    overageUnits: number
  }
  /** Error message if not allowed */
  error?: string
  /** Error code */
  code?: string
  /** HTTP response if not allowed */
  response?: Response
  /** Retry-After header value (seconds) */
  retryAfter?: number
}

/**
 * Options for model quota middleware
 */
export interface ModelQuotaOptions {
  /** Supabase client instance */
  supabase: SupabaseClient
  /** Environment variables */
  env?: Record<string, string>
  /** Require a specific model category (optional) */
  requireCategory?: ModelCategory
  /** Enable quota enforcement (default: true) */
  enableQuota?: boolean
  /** Enable tier validation (default: true) */
  enableTierValidation?: boolean
  /** Fail open on errors (default: true) */
  failOpen?: boolean
}

/**
 * JWT/mk_ auth token payload
 */
interface AuthTokenPayload {
  orgId?: string
  userId?: string
  licenseKey?: string
  tier?: LicenseTier
  features?: Record<string, boolean>
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Extract auth token from request headers
 *
 * @param request - HTTP request
 * @returns Auth token string or null
 */
function extractAuthToken(request: Request): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Check X-API-Key header
  const apiKeyHeader = request.headers.get('X-API-Key')
  if (apiKeyHeader) {
    return apiKeyHeader
  }

  // Check mk_ prefix in any header
  for (const [key, value] of request.headers.entries()) {
    if (value?.startsWith('mk_')) {
      return value
    }
  }

  return null
}

/**
 * Decode and validate auth token
 *
 * @param token - Auth token (JWT or mk_ key)
 * @param supabaseClient - Supabase client
 * @returns Decoded payload or null
 */
async function decodeAuthToken(
  token: string,
  supabaseClient: SupabaseClient
): Promise<AuthTokenPayload | null> {
  try {
    // Handle mk_ API key format
    if (token.startsWith('mk_')) {
      // Query Supabase for API key
      const { data, error } = await supabaseClient
        .from('raas_api_keys')
        .select('org_id, user_id, license_key, tier, features')
        .eq('key_hash', token)
        .eq('status', 'active')
        .single()

      if (error || !data) {
        return null
      }

      return {
        orgId: data.org_id,
        userId: data.user_id,
        licenseKey: data.license_key,
        tier: data.tier as LicenseTier,
        features: data.features as Record<string, boolean>,
      }
    }

    // Handle JWT format (base64url encoded)
    if (token.includes('.')) {
      // Try to decode as JWT (without verification - done by upstream)
      const parts = token.split('.')
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
          return {
            orgId: payload.org_id,
            userId: payload.user_id,
            licenseKey: payload.license_key,
            tier: payload.tier as LicenseTier,
            features: payload.features as Record<string, boolean>,
          }
        } catch {
          // Invalid JWT format
          return null
        }
      }
    }

    // Unknown token format
    return null
  } catch (error) {
    console.error('[ModelQuota] Token decode error:', error)
    return null
  }
}

/**
 * Get user/org ID from auth payload or fallback options
 */
function getTargetIds(
  payload: AuthTokenPayload | null,
  options: ModelQuotaOptions
): { orgId?: string; userId?: string; licenseKey?: string } {
  return {
    orgId: payload?.orgId,
    userId: payload?.userId,
    licenseKey: payload?.licenseKey,
  }
}

/**
 * Main model quota middleware function
 *
 * Flow:
 * 1. Check if request path matches protected endpoint
 * 2. Extract and validate auth token
 * 3. Validate license tier can access model category
 * 4. Check monthly token quota
 * 5. Return allowed/denied result
 *
 * @param request - HTTP request
 * @param options - Middleware options
 * @returns ModelQuotaResult
 */
export async function modelQuotaMiddleware(
  request: Request,
  options: ModelQuotaOptions
): Promise<ModelQuotaResult> {
  const { supabase: sb, enableQuota = true, enableTierValidation = true, failOpen = true } = options
  const url = new URL(request.url)

  // Step 1: Check if request matches protected endpoint
  const endpoint = matchProtectedEndpoint(url.pathname)
  if (!endpoint) {
    // Not a protected endpoint - allow
    return { allowed: true, endpoint: null }
  }

  // Step 2: Extract and decode auth token
  const authToken = extractAuthToken(request)
  if (!authToken) {
    // No auth token - deny
    return buildDeniedResult(
      endpoint,
      'missing_auth_token',
      'Thiếu token xác thực. Vui lòng cung cấp Authorization header hoặc X-API-Key.',
      401
    )
  }

  const authPayload = await decodeAuthToken(authToken, sb)
  if (!authPayload) {
    // Invalid auth token - deny
    return buildDeniedResult(
      endpoint,
      'invalid_auth_token',
      'Token xác thực không hợp lệ hoặc đã hết hạn.',
      401
    )
  }

  // Step 3: Validate tier access (if enabled)
  if (enableTierValidation) {
    const tierAccessResult = validateTierAccess(endpoint, authPayload.tier)
    if (!tierAccessResult.allowed) {
      return buildDeniedResult(
        endpoint,
        'tier_not_allowed',
        tierAccessResult.message ||
          `Gói ${authPayload.tier} không được truy cập model ${endpoint.category}. Vui lòng nâng cấp.`,
        403
      )
    }
  }

  // Step 4: Check quota (if enabled)
  if (enableQuota) {
    const ids = getTargetIds(authPayload, options)

    if (!ids.orgId && !ids.userId) {
      // No quota tracking for this context
      if (failOpen) {
        return { allowed: true, endpoint, tier: authPayload.tier }
      } else {
        return buildDeniedResult(
          endpoint,
          'missing_quota_context',
          'Không thể xác minh quota do thiếu thông tin org/user.',
          500
        )
      }
    }

    // Initialize quota enforcer
    const enforcer = new QuotaEnforcer(sb, {
      orgId: ids.orgId || '',
      userId: ids.userId,
      enforcementMode: 'hybrid',
    })

    // Check quota for token usage
    const quotaStatus = await enforcer.checkQuota('tokens')

    if (!quotaStatus.allowed) {
      // Emit analytics event
      if (ids.orgId) {
        await raasAnalyticsEvents.emitSubscriptionWarning({
          org_id: ids.orgId,
          user_id: ids.userId || undefined,
          warning_type: 'approaching_limit',
          quota_percentage: quotaStatus.percentageUsed,
          path: url.pathname,
        })
      }

      const overageAllowed = authPayload.tier ? isOverageAllowed(authPayload.tier) : false

      if (overageAllowed) {
        // Allow but warn - overage billing applies
        return {
          allowed: true,
          endpoint,
          tier: authPayload.tier,
          quotaStatus: {
            currentUsage: quotaStatus.currentUsage,
            quota: quotaStatus.effectiveQuota,
            remaining: 0,
            percentageUsed: quotaStatus.percentageUsed,
            isOverLimit: true,
            overageUnits: quotaStatus.overageUnits,
          },
        }
      }

      // Quota exceeded - deny
      return buildDeniedResult(
        endpoint,
        'model_quota_exceeded',
        'Lỗi API model: Đã vượt quota tháng này. Vui lòng nâng cấp gói hoặc chờ reset.',
        403,
        quotaStatus.retryAfter
      )
    }

    // Quota OK
    return {
      allowed: true,
      endpoint,
      tier: authPayload.tier,
      quotaStatus: {
        currentUsage: quotaStatus.currentUsage,
        quota: quotaStatus.effectiveQuota,
        remaining: quotaStatus.remaining,
        percentageUsed: quotaStatus.percentageUsed,
        isOverLimit: quotaStatus.isOverLimit,
        overageUnits: quotaStatus.overageUnits,
      },
    }
  }

  // All checks passed
  return { allowed: true, endpoint, tier: authPayload.tier }
}

/**
 * Validate tier can access model category
 */
function validateTierAccess(
  endpoint: ProtectedEndpoint,
  tier?: LicenseTier
): { allowed: boolean; message?: string } {
  if (!tier) {
    return { allowed: false, message: 'Không xác định được gói license.' }
  }

  if (!canAccessModelCategory(tier, endpoint.category)) {
    return {
      allowed: false,
      message: `Gói ${tier} không được truy cập model ${endpoint.category}.`,
    }
  }

  return { allowed: true }
}

/**
 * Build denied result with Vietnamese message
 */
function buildDeniedResult(
  endpoint: ProtectedEndpoint,
  code: string,
  message: string,
  statusCode: number = 403,
  retryAfter?: number
): ModelQuotaResult {
  const response = new Response(JSON.stringify({
    error: code,
    message,
    code: code.toUpperCase(),
    endpoint: endpoint.id,
    provider: endpoint.provider,
    category: endpoint.category,
  }), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'X-RaaS-Error': 'model_quota',
      'X-RaaS-Code': code.toUpperCase(),
      'X-RaaS-Provider': endpoint.provider,
      ...(retryAfter ? { 'Retry-After': String(retryAfter) } : {}),
    },
  })

  return {
    allowed: false,
    endpoint,
    error: message,
    code,
    response,
    retryAfter,
  }
}

/**
 * Build 403 response for model quota exceeded
 *
 * @param endpoint - Protected endpoint
 * @param quotaStatus - Current quota status
 * @param locale - Locale for i18n ('vi' | 'en')
 * @returns HTTP Response
 */
export function buildModelQuota403Response(
  endpoint: ProtectedEndpoint,
  quotaStatus: {
    currentUsage: number
    quota: number
    remaining: number
    percentageUsed: number
  },
  locale: 'vi' | 'en' = 'vi'
): Response {
  const messages = {
    vi: {
      title: 'Vượt quota model AI',
      message: `Lỗi API model: Đã vượt quota tháng này (${quotaStatus.percentageUsed.toFixed(0)}% sử dụng).`,
      upgradeUrl: '/dashboard/subscription',
      retryAfter: 'Vui lòng nâng cấp gói hoặc chờ reset vào kỳ sau.',
    },
    en: {
      title: 'Model quota exceeded',
      message: `Model API error: Monthly quota exceeded (${quotaStatus.percentageUsed.toFixed(0)}% used).`,
      upgradeUrl: '/dashboard/subscription',
      retryAfter: 'Please upgrade plan or wait for reset next period.',
    },
  }

  const lang = messages[locale]

  return new Response(JSON.stringify({
    error: 'model_quota_exceeded',
    message: lang.message,
    code: 'MODEL_QUOTA_EXCEEDED',
    details: {
      endpoint: endpoint.id,
      provider: endpoint.provider,
      category: endpoint.category,
      currentUsage: quotaStatus.currentUsage,
      quota: quotaStatus.quota,
      percentageUsed: quotaStatus.percentageUsed,
    },
    upgrade_url: lang.upgradeUrl,
  }), {
    status: 403,
    headers: {
      'Content-Type': 'application/json',
      'X-RaaS-Error': 'model_quota_exceeded',
      'X-RaaS-Provider': endpoint.provider,
      'Accept-Language': locale,
    },
  })
}

/**
 * Extract model info from request body (for token counting)
 *
 * @param request - HTTP request
 * @returns Model name if found
 */
export async function extractModelFromRequest(
  request: Request
): Promise<string | null> {
  try {
    // Clone request to read body
    const clone = request.clone()
    const body = await clone.json()

    if (body?.model) {
      return body.model
    }

    return null
  } catch {
    return null
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const raasModelQuotaMiddleware = {
  middleware: modelQuotaMiddleware,
  build403Response: buildModelQuota403Response,
  extractModel: extractModelFromRequest,
}

export default raasModelQuotaMiddleware
