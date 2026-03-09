/**
 * RaaS Proxy Middleware - Phase 6 License Enforcement
 *
 * Cloudflare Worker middleware for intercepting and validating all API requests
 * to protected AgencyOS microservices. Enforces license validity in real-time.
 *
 * Features:
 * - Request interception for all protected API routes
 * - JWT and mk_ API key extraction from Authorization header
 * - Real-time license validation against Cloudflare KV
 * - Request enrichment with plan metadata (tier, features, quota limits)
 * - Response headers injection (X-License-Status, X-Quota-Remaining, X-Rate-Limit)
 * - Token caching for sub-50ms latency
 *
 * Flow:
 * 1. Intercept incoming request to raas.agencyos.network
 * 2. Extract JWT or mk_ API key from Authorization header
 * 3. Validate license status (expired, revoked, over quota)
 * 4. Enrich request context with plan metadata
 * 5. Proxy to upstream agencyos.network services
 * 6. Inject response headers
 *
 * Usage in Worker:
 *   import { raasProxyMiddleware } from './middleware/raas-proxy'
 *
 *   export default {
 *     async fetch(request, env, ctx) {
 *       const proxyResult = await raasProxyMiddleware(request, env)
 *       if (!proxyResult.allowed && proxyResult.response) {
 *         return proxyResult.response
 *       }
 *       // Continue with enriched request
 *       return proxyResult.enrichedRequest
 *         ? fetch(proxyResult.enrichedRequest)
 *         : fetch(request)
 *     }
 *   }
 */

import type { KVNamespace } from '@cloudflare/workers-types'

// ============================================================================
// TYPES
// ============================================================================

interface Env {
  RAAS_API_URL: string
  RAAS_API_KEY?: string
  CACHE_TTL_SECONDS: number
  LICENSE_CACHE: KVNamespace
  SUSPENSION_LOG: KVNamespace
  MODEL_QUOTA_CACHE?: KVNamespace
}

interface LicenseValidationResult {
  isValid: boolean
  tier: string
  status: 'active' | 'revoked' | 'expired' | 'suspended'
  features: Record<string, boolean>
  expiresAt?: string
  daysRemaining?: number
  message?: string
  cached?: boolean
}

interface TierLimits {
  rateLimitPerMinute: number
  monthlyTokenQuota: number
  overageAllowed: boolean
  overageRatePerUnit: number
  allowedFeatures: string[]
}

interface UsageStatus {
  currentUsage: number
  quotaLimit: number
  remaining: number
  percentageUsed: number
  isOverLimit: boolean
  overageUnits: number
  overageCost: number
}

interface ValidationResult {
  allowed: boolean
  license?: LicenseValidationResult
  tierLimits?: TierLimits
  usageStatus?: UsageStatus
  error?: string
  code?: string
  response?: Response
  retryAfter?: number
  cached?: boolean
}

interface EnrichedHeaders {
  'X-License-Status': string
  'X-Quota-Remaining': string
  'X-Rate-Limit': string
  'X-Tier': string
  'X-Features': string
}

interface RequestContext {
  orgId: string
  licenseId: string
  tier: string
  features: string[]
  quotaLimits: TierLimits
  usageStatus: UsageStatus
  rateLimitPerMinute: number
}

interface RaasProxyResult {
  allowed: boolean
  license?: LicenseValidationResult
  usageStatus?: UsageStatus
  enrichedRequest?: Request
  enrichedContext?: RequestContext
  responseHeaders?: EnrichedHeaders
  error?: string
  code?: string
  response?: Response
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TIER_LIMITS: Record<string, TierLimits> = {
  free: {
    rateLimitPerMinute: 10,
    monthlyTokenQuota: 10_000,
    overageAllowed: false,
    overageRatePerUnit: 0,
    allowedFeatures: ['basic_agents', 'community_support'],
  },
  basic: {
    rateLimitPerMinute: 60,
    monthlyTokenQuota: 100_000,
    overageAllowed: false,
    overageRatePerUnit: 0,
    allowedFeatures: ['basic_agents', 'premium_agents', 'email_support'],
  },
  pro: {
    rateLimitPerMinute: 300,
    monthlyTokenQuota: 1_000_000,
    overageAllowed: true,
    overageRatePerUnit: 0.0005,
    allowedFeatures: ['basic_agents', 'premium_agents', 'advanced_analytics', 'priority_support'],
  },
  enterprise: {
    rateLimitPerMinute: 1000,
    monthlyTokenQuota: 10_000_000,
    overageAllowed: true,
    overageRatePerUnit: 0.0003,
    allowedFeatures: ['basic_agents', 'premium_agents', 'advanced_analytics', 'custom_integrations', 'dedicated_support'],
  },
  master: {
    rateLimitPerMinute: 5000,
    monthlyTokenQuota: 100_000_000,
    overageAllowed: true,
    overageRatePerUnit: 0.0001,
    allowedFeatures: ['all'],
  },
}

const PROTECTED_PATHS = [
  '/api/',
  '/v1/',
  '/agents/',
  '/workflows/',
  '/metrics/',
  '/billing/',
  '/usage/',
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if request path matches protected routes
 */
function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(path => pathname.startsWith(path))
}

/**
 * Extract JWT or mk_ API key from Authorization header
 */
function extractAuthTokens(request: Request): { jwt?: string; apiKey?: string } {
  const authHeader = request.headers.get('Authorization')
  const apiKeyHeader = request.headers.get('X-API-Key')

  const result: { jwt?: string; apiKey?: string } = {}

  // Extract Bearer token (JWT)
  if (authHeader?.startsWith('Bearer ')) {
    result.jwt = authHeader.substring(7)
  }

  // Extract mk_ API key
  if (apiKeyHeader?.startsWith('mk_')) {
    result.apiKey = apiKeyHeader
  } else if (authHeader?.startsWith('mk_')) {
    result.apiKey = authHeader
  }

  // Also check for mk_ in any header value
  if (!result.apiKey) {
    for (const [key, value] of request.headers.entries()) {
      if (value?.startsWith('mk_')) {
        result.apiKey = value
        break
      }
    }
  }

  return result
}

/**
 * Decode JWT payload (without verification - for extraction only)
 */
function decodeJWTPayload(jwt: string): Record<string, any> | null {
  try {
    const parts = jwt.split('.')
    if (parts.length !== 3) return null

    // Base64URL decode payload
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const decoded = atob(payload)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

/**
 * Extract orgId and licenseId from JWT or API key
 */
function extractLicenseContext(
  jwt?: string,
  apiKey?: string
): { orgId?: string; licenseId?: string } {
  const result: { orgId?: string; licenseId?: string } = {}

  // Try JWT first
  if (jwt) {
    const payload = decodeJWTPayload(jwt)
    if (payload) {
      result.orgId = payload.org_id || payload.sub
      result.licenseId = payload.license_key || payload.license_id
    }
  }

  // Fallback to API key format
  if (apiKey && !result.orgId) {
    // API key format: mk_{orgId}_{random}
    const parts = apiKey.split('_')
    if (parts.length >= 3) {
      result.orgId = parts[1]
    }
  }

  return result
}

/**
 * Get license from KV cache or upstream
 */
async function getLicenseFromCache(
  licenseKey: string,
  env: Env
): Promise<LicenseValidationResult | null> {
  const cacheKey = `license:${licenseKey.toLowerCase()}`

  try {
    // Check KV cache
    const cached = await env.LICENSE_CACHE.get<LicenseValidationResult>(cacheKey)
    if (cached) {
      return { ...cached, cached: true }
    }

    // Cache miss - fetch from upstream
    return await fetchLicenseFromUpstream(licenseKey, env)
  } catch (error) {
    console.error('[RaasProxy] License cache error:', error)
    return null
  }
}

/**
 * Fetch license from upstream RaaS API
 */
async function fetchLicenseFromUpstream(
  licenseKey: string,
  env: Env
): Promise<LicenseValidationResult | null> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'RaaSGateway-Proxy/1.0.0',
    }

    if (env.RAAS_API_KEY) {
      headers['Authorization'] = `Bearer ${env.RAAS_API_KEY}`
    }

    const response = await fetch(`${env.RAAS_API_URL}/v1/validate-license`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ licenseKey }),
    })

    if (!response.ok) {
      return null
    }

    const data: any = await response.json()

    const result: LicenseValidationResult = {
      isValid: data.isValid,
      tier: data.tier || 'basic',
      status: data.isValid ? 'active' : 'revoked',
      features: data.features || {},
      expiresAt: data.expiresAt,
      daysRemaining: data.daysRemaining,
      message: data.message,
      cached: false,
    }

    // Cache the result
    const cacheKey = `license:${licenseKey.toLowerCase()}`
    await env.LICENSE_CACHE.put(cacheKey, JSON.stringify(result), {
      expirationTtl: Number(env.CACHE_TTL_SECONDS) || 300,
    })

    return result
  } catch (error) {
    console.error('[RaasProxy] Upstream license fetch error:', error)
    return null
  }
}

/**
 * Get usage status from KV cache
 */
async function getUsageStatus(
  orgId: string,
  tier: string,
  env: Env
): Promise<UsageStatus | null> {
  const cacheKey = `usage:${orgId}:tokens`

  try {
    const cached = await env.MODEL_QUOTA_CACHE?.get<{
      currentUsage: number
      quotaLimit: number
      resetAt: number
    }>(cacheKey)

    if (cached) {
      const remaining = Math.max(0, cached.quotaLimit - cached.currentUsage)
      const percentageUsed = (cached.currentUsage / cached.quotaLimit) * 100
      const isOverLimit = cached.currentUsage >= cached.quotaLimit
      const overageUnits = isOverLimit ? cached.currentUsage - cached.quotaLimit : 0
      const tierLimits = TIER_LIMITS[tier]
      const overageCost = overageUnits * (tierLimits?.overageRatePerUnit || 0)

      return {
        currentUsage: cached.currentUsage,
        quotaLimit: cached.quotaLimit,
        remaining,
        percentageUsed,
        isOverLimit,
        overageUnits,
        overageCost,
      }
    }

    // Fetch from upstream
    return await fetchUsageFromUpstream(orgId, tier, env)
  } catch (error) {
    console.error('[RaasProxy] Usage status error:', error)
    return null
  }
}

/**
 * Fetch usage from upstream RaaS API
 */
async function fetchUsageFromUpstream(
  orgId: string,
  tier: string,
  env: Env
): Promise<UsageStatus | null> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'RaaSGateway-Proxy/1.0.0',
    }

    if (env.RAAS_API_KEY) {
      headers['Authorization'] = `Bearer ${env.RAAS_API_KEY}`
    }

    const response = await fetch(`${env.RAAS_API_URL}/v1/quota/status`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ orgId, metricType: 'tokens' }),
    })

    if (!response.ok) {
      // Return default (no usage data)
      return {
        currentUsage: 0,
        quotaLimit: TIER_LIMITS[tier]?.monthlyTokenQuota || 100_000,
        remaining: TIER_LIMITS[tier]?.monthlyTokenQuota || 100_000,
        percentageUsed: 0,
        isOverLimit: false,
        overageUnits: 0,
        overageCost: 0,
      }
    }

    const data: any = await response.json()
    const tierLimits = TIER_LIMITS[tier]

    const usageStatus: UsageStatus = {
      currentUsage: data.currentUsage || 0,
      quotaLimit: data.quota || tierLimits?.monthlyTokenQuota || 100_000,
      remaining: data.remaining || 0,
      percentageUsed: data.percentageUsed || 0,
      isOverLimit: data.isOverLimit || false,
      overageUnits: data.overageUnits || 0,
      overageCost: data.overageCost || 0,
    }

    // Cache the result
    const cacheKey = `usage:${orgId}:tokens`
    await env.MODEL_QUOTA_CACHE?.put(
      cacheKey,
      JSON.stringify({
        currentUsage: usageStatus.currentUsage,
        quotaLimit: usageStatus.quotaLimit,
        resetAt: data.resetAt || Date.now() + 30 * 24 * 60 * 60 * 1000,
      }),
      { expirationTtl: 3600 }
    )

    return usageStatus
  } catch (error) {
    console.error('[RaasProxy] Usage fetch error:', error)
    return null
  }
}

/**
 * Build error response
 */
function buildErrorResponse(
  code: string,
  message: string,
  retryAfter?: number
): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-RaaS-Error-Code': code.toUpperCase(),
  }

  if (retryAfter) {
    headers['Retry-After'] = String(retryAfter)
  }

  return new Response(
    JSON.stringify({
      error: code,
      message,
      code: code.toUpperCase(),
    }),
    { status: 403, headers }
  )
}

/**
 * Inject response headers
 */
function injectResponseHeaders(
  response: Response,
  context: RequestContext
): Response {
  const newHeaders = new Headers(response.headers)

  newHeaders.set('X-License-Status', context.usageStatus.isOverLimit ? 'over_limit' : 'active')
  newHeaders.set('X-Quota-Remaining', String(context.usageStatus.remaining))
  newHeaders.set('X-Rate-Limit', String(context.rateLimitPerMinute))
  newHeaders.set('X-Tier', context.tier)
  newHeaders.set(
    'X-Features',
    context.features.filter(f => !f.startsWith('_')).join(',')
  )

  return new Response(response.body, {
    status: response.status,
    headers: newHeaders,
  })
}

// ============================================================================
// MAIN MIDDLEWARE
// ============================================================================

/**
 * RaaS Proxy middleware
 *
 * Flow:
 * 1. Check if request path is protected
 * 2. Extract JWT or mk_ API key
 * 3. Get license from cache
 * 4. Validate license status
 * 5. Get usage status
 * 6. Check quota limits
 * 7. Enrich request context
 * 8. Return enriched request or error response
 *
 * @param request - HTTP request
 * @param env - Worker environment
 * @returns RaasProxyResult
 */
export async function raasProxyMiddleware(
  request: Request,
  env: Env
): Promise<RaasProxyResult> {
  const url = new URL(request.url)

  // Step 1: Check if request path is protected
  if (!isProtectedPath(url.pathname)) {
    return { allowed: true }
  }

  // Step 2: Extract auth tokens
  const { jwt, apiKey } = extractAuthTokens(request)

  if (!jwt && !apiKey) {
    return {
      allowed: false,
      error: 'Thiếu token xác thực',
      code: 'missing_auth_token',
      response: buildErrorResponse(
        'missing_auth_token',
        'Thiếu token xác thực. Vui lòng cung cấp Authorization header (Bearer {JWT}) hoặc X-API-Key (mk_*).'
      ),
    }
  }

  // Step 3: Extract license context
  const { orgId, licenseId } = extractLicenseContext(jwt, apiKey)

  if (!orgId && !licenseId) {
    return {
      allowed: false,
      error: 'Không thể xác định tổ chức hoặc license',
      code: 'invalid_auth_context',
      response: buildErrorResponse(
        'invalid_auth_context',
        'Không thể xác định tổ chức hoặc license từ token. Vui lòng kiểm tra JWT payload hoặc API key format.'
      ),
    }
  }

  // Use licenseId or apiKey as license key
  const licenseKey = licenseId || apiKey || ''

  // Step 4: Get license from cache
  const license = await getLicenseFromCache(licenseKey, env)

  if (!license) {
    return {
      allowed: false,
      error: 'License không hợp lệ hoặc không tồn tại',
      code: 'invalid_license',
      response: buildErrorResponse(
        'invalid_license',
        'License không hợp lệ hoặc không tồn tại. Vui lòng kiểm tra lại license key.'
      ),
    }
  }

  // Step 5: Validate license status
  if (!license.isValid) {
    return {
      allowed: false,
      license,
      error: 'License đã hết hạn hoặc bị thu hồi',
      code: 'license_expired',
      response: buildErrorResponse(
        'license_expired',
        `License đã hết hạn hoặc bị thu hồi. Trạng thái: ${license.status}. ${license.message || ''}`
      ),
    }
  }

  if (license.status === 'revoked' || license.status === 'suspended') {
    return {
      allowed: false,
      license,
      error: 'License đã bị thu hồi',
      code: 'license_revoked',
      response: buildErrorResponse(
        'license_revoked',
        `License đã bị thu hồi. ${license.message || 'Vui lòng liên hệ hỗ trợ.'}`
      ),
    }
  }

  if (license.status === 'expired') {
    return {
      allowed: false,
      license,
      error: 'License đã hết hạn',
      code: 'license_expired',
      response: buildErrorResponse(
        'license_expired',
        `License đã hết hạn vào ${license.expiresAt || 'không xác định'}. Vui lòng gia hạn.`
      ),
    }
  }

  // Step 6: Get usage status
  const tier = license.tier || 'basic'
  const usageStatus = await getUsageStatus(orgId || 'unknown', tier, env)

  // Step 7: Check quota limits
  const tierLimits = TIER_LIMITS[tier]

  if (usageStatus && usageStatus.isOverLimit) {
    // Check if overage is allowed
    if (!tierLimits?.overageAllowed) {
      const retryAfter = usageStatus.percentageUsed >= 100 ? 2592000 : undefined // 30 days
      return {
        allowed: false,
        license,
        usageStatus,
        error: 'Đã vượt quota sử dụng tháng này',
        code: 'quota_exceeded',
        response: buildErrorResponse(
          'quota_exceeded',
          `Đã vượt quota sử dụng tháng này (${usageStatus.percentageUsed.toFixed(1)}%). ` +
          `Vui lòng nâng cấp gói ${tier === 'free' ? 'lên Basic hoặc cao hơn' : tier === 'basic' ? 'lên Pro hoặc cao hơn' : 'của bạn'}.`,
          retryAfter
        ),
        retryAfter,
      }
    }
  }

  // Step 8: Enrich request context
  const context: RequestContext = {
    orgId: orgId || 'unknown',
    licenseId: licenseId || 'unknown',
    tier,
    features: Object.keys(license.features).filter(f => license.features[f]),
    quotaLimits: tierLimits,
    usageStatus: usageStatus || {
      currentUsage: 0,
      quotaLimit: tierLimits.monthlyTokenQuota,
      remaining: tierLimits.monthlyTokenQuota,
      percentageUsed: 0,
      isOverLimit: false,
      overageUnits: 0,
      overageCost: 0,
    },
    rateLimitPerMinute: tierLimits.rateLimitPerMinute,
  }

  // Build enriched request
  const enrichedHeaders = new Headers(request.headers)
  enrichedHeaders.set('X-RaaS-Org-Id', context.orgId)
  enrichedHeaders.set('X-RaaS-License-Id', context.licenseId)
  enrichedHeaders.set('X-RaaS-Tier', context.tier)
  enrichedHeaders.set('X-RaaS-Features', context.features.join(','))
  enrichedHeaders.set('X-RaaS-Quota-Remaining', String(context.usageStatus.remaining))
  enrichedHeaders.set('X-RaaS-Rate-Limit', String(context.rateLimitPerMinute))

  const enrichedRequest = new Request(request, {
    headers: enrichedHeaders,
  })

  // Build response headers to inject
  const responseHeaders: EnrichedHeaders = {
    'X-License-Status': context.usageStatus.isOverLimit ? 'over_limit' : 'active',
    'X-Quota-Remaining': String(context.usageStatus.remaining),
    'X-Rate-Limit': String(context.rateLimitPerMinute),
    'X-Tier': context.tier,
    'X-Features': context.features.join(','),
  }

  return {
    allowed: true,
    enrichedRequest,
    enrichedContext: context,
    responseHeaders,
  }
}

/**
 * Proxy request to upstream AgencyOS services
 */
export async function proxyToUpstream(
  request: Request,
  env: Env,
  context?: RequestContext
): Promise<Response> {
  const url = new URL(request.url)

  // Rewrite URL to upstream
  const upstreamUrl = new URL(url.pathname + url.search, env.RAAS_API_URL)

  try {
    const response = await fetch(upstreamUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
    })

    // Inject response headers if context provided
    if (context) {
      return injectResponseHeaders(response, context)
    }

    return response
  } catch (error) {
    console.error('[RaasProxy] Upstream proxy error:', error)
    return new Response(
      JSON.stringify({
        error: 'upstream_error',
        message: 'Không thể kết nối đến máy chủ upstream',
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'X-RaaS-Error': 'upstream_unavailable',
        },
      }
    )
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const raasProxy = {
  middleware: raasProxyMiddleware,
  proxy: proxyToUpstream,
}

export default raasProxy
