/**
 * Model Quota Guard - Cloudflare Worker Middleware
 *
 * Cloudflare Worker middleware for enforcing AI model usage quotas.
 * Integrates with RaaS Gateway Worker to validate requests at the edge.
 *
 * Features:
 * - Endpoint pattern matching for AI providers
 * - KV-backed license tier caching
 * - Quota enforcement with rate limiting
 * - 403 response with Vietnamese localization
 *
 * Usage in Worker:
 *   import { modelQuotaGuard } from './middleware/model-quota-guard'
 *
 *   export default {
 *     async fetch(request, env, ctx) {
 *       const guardResult = await modelQuotaGuard(request, env)
 *       if (!guardResult.allowed) {
 *         return guardResult.response
 *       }
 *       // Continue with normal handling...
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

interface LicenseTier {
  tier: 'free' | 'basic' | 'pro' | 'enterprise' | 'master'
  allowedCategories: ('basic' | 'premium' | 'enterprise')[]
  rateLimit: number
  monthlyTokenQuota: number
  overageAllowed: boolean
}

interface ProtectedEndpoint {
  id: string
  provider: 'openai' | 'anthropic' | 'google' | 'local' | 'custom'
  pattern: string
  regex: RegExp
  category: 'basic' | 'premium' | 'enterprise'
  rateLimitMultiplier: number
  countTokens: boolean
}

interface ModelQuotaGuardResult {
  allowed: boolean
  endpoint?: ProtectedEndpoint | null
  tier?: string
  error?: string
  code?: string
  response?: Response
  retryAfter?: number
  cached?: boolean
}

interface LicenseCacheEntry {
  tier: string
  status: 'active' | 'revoked' | 'expired' | 'suspended'
  features: Record<string, boolean>
  expiresAt?: string
  daysRemaining?: number
  cachedAt: number
  ttl: number
}

interface QuotaStatus {
  currentUsage: number
  quota: number
  remaining: number
  percentageUsed: number
  isOverLimit: boolean
  overageUnits: number
  retryAfter?: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PROTECTED_ENDPOINTS: ProtectedEndpoint[] = [
  // OpenAI
  {
    id: 'openai-chat-completions',
    provider: 'openai',
    pattern: '/v1/chat/completions',
    regex: /^\/v1\/chat\/completions$/,
    category: 'basic',
    rateLimitMultiplier: 1,
    countTokens: true,
  },
  {
    id: 'openai-completions',
    provider: 'openai',
    pattern: '/v1/completions',
    regex: /^\/v1\/completions$/,
    category: 'basic',
    rateLimitMultiplier: 1,
    countTokens: true,
  },
  {
    id: 'openai-embeddings',
    provider: 'openai',
    pattern: '/v1/embeddings',
    regex: /^\/v1\/embeddings$/,
    category: 'basic',
    rateLimitMultiplier: 0.5,
    countTokens: true,
  },
  {
    id: 'openai-images',
    provider: 'openai',
    pattern: '/v1/images/generations',
    regex: /^\/v1\/images\/generations$/,
    category: 'premium',
    rateLimitMultiplier: 2,
    countTokens: false,
  },

  // Anthropic
  {
    id: 'anthropic-messages',
    provider: 'anthropic',
    pattern: '/v1/messages',
    regex: /^\/v1\/messages$/,
    category: 'basic',
    rateLimitMultiplier: 1,
    countTokens: true,
  },
  {
    id: 'anthropic-completions',
    provider: 'anthropic',
    pattern: '/v1/complete',
    regex: /^\/v1\/complete$/,
    category: 'basic',
    rateLimitMultiplier: 1,
    countTokens: true,
  },

  // Google AI
  {
    id: 'google-generate-content',
    provider: 'google',
    pattern: '/v1beta/models/*/generateContent',
    regex: /^\/v1beta\/models\/[^/]+\/generateContent$/,
    category: 'basic',
    rateLimitMultiplier: 1,
    countTokens: true,
  },

  // Local AI
  {
    id: 'local-inference',
    provider: 'local',
    pattern: '/api/inference/*',
    regex: /^\/api\/inference\/.*$/,
    category: 'basic',
    rateLimitMultiplier: 0.5,
    countTokens: true,
  },
]

const TIER_ACCESS_RULES: Record<string, LicenseTier> = {
  free: {
    tier: 'free',
    allowedCategories: ['basic'],
    rateLimit: 10,
    monthlyTokenQuota: 10_000,
    overageAllowed: false,
  },
  basic: {
    tier: 'basic',
    allowedCategories: ['basic'],
    rateLimit: 60,
    monthlyTokenQuota: 100_000,
    overageAllowed: false,
  },
  pro: {
    tier: 'pro',
    allowedCategories: ['basic', 'premium'],
    rateLimit: 300,
    monthlyTokenQuota: 1_000_000,
    overageAllowed: true,
  },
  enterprise: {
    tier: 'enterprise',
    allowedCategories: ['basic', 'premium', 'enterprise'],
    rateLimit: 1000,
    monthlyTokenQuota: 10_000_000,
    overageAllowed: true,
  },
  master: {
    tier: 'master',
    allowedCategories: ['basic', 'premium', 'enterprise'],
    rateLimit: 5000,
    monthlyTokenQuota: 100_000_000,
    overageAllowed: true,
  },
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Match URL path to protected endpoint
 */
function matchProtectedEndpoint(pathname: string): ProtectedEndpoint | null {
  for (const endpoint of PROTECTED_ENDPOINTS) {
    if (endpoint.regex.test(pathname)) {
      return endpoint
    }
  }
  return null
}

/**
 * Extract auth token from request headers
 */
function extractAuthToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  const apiKeyHeader = request.headers.get('X-API-Key')
  if (apiKeyHeader) {
    return apiKeyHeader
  }

  for (const [key, value] of request.headers.entries()) {
    if (value?.startsWith('mk_')) {
      return value
    }
  }

  return null
}

/**
 * Get license from KV cache or upstream
 */
async function getLicenseFromCache(
  licenseKey: string,
  env: Env
): Promise<LicenseCacheEntry | null> {
  const cacheKey = `license:${licenseKey}`

  try {
    // Check KV cache
    const cached = await env.LICENSE_CACHE.get<LicenseCacheEntry>(cacheKey)
    if (cached) {
      // Check if still valid
      const age = Date.now() - cached.cachedAt
      if (age < cached.ttl * 1000) {
        return cached
      }
    }

    // Cache miss - fetch from upstream
    const license = await fetchLicenseFromUpstream(licenseKey, env)

    // Cache the result
    if (license) {
      await env.LICENSE_CACHE.put(cacheKey, JSON.stringify(license), {
        expirationTtl: 300, // 5 minutes
      })
    }

    return license
  } catch (error) {
    console.error('[ModelQuotaGuard] License cache error:', error)
    return null
  }
}

/**
 * Fetch license from upstream RaaS API
 */
async function fetchLicenseFromUpstream(
  licenseKey: string,
  env: Env
): Promise<LicenseCacheEntry | null> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'RaaSGateway-Worker/1.0.0',
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

    const data = await response.json()

    return {
      tier: data.tier || 'basic',
      status: data.isValid ? 'active' : 'revoked',
      features: data.features || {},
      expiresAt: data.expiresAt,
      daysRemaining: data.daysRemaining,
      cachedAt: Date.now(),
      ttl: 300,
    }
  } catch (error) {
    console.error('[ModelQuotaGuard] Upstream license fetch error:', error)
    return null
  }
}

/**
 * Check quota from KV cache
 *
 * In production, this would query Supabase via RaaS API.
 * For Worker edge, we use KV for quota tracking.
 */
async function checkQuotaFromCache(
  orgId: string,
  env: Env
): Promise<QuotaStatus | null> {
  const cacheKey = `quota:${orgId}:tokens`

  try {
    const cached = await env.MODEL_QUOTA_CACHE?.get<{
      currentUsage: number
      quota: number
      resetAt: number
    }>(cacheKey)

    if (cached) {
      const remaining = Math.max(0, cached.quota - cached.currentUsage)
      const percentageUsed = (cached.currentUsage / cached.quota) * 100
      const isOverLimit = cached.currentUsage >= cached.quota

      return {
        currentUsage: cached.currentUsage,
        quota: cached.quota,
        remaining,
        percentageUsed,
        isOverLimit,
        overageUnits: isOverLimit ? cached.currentUsage - cached.quota : 0,
        retryAfter: isOverLimit ? Math.ceil((cached.resetAt - Date.now()) / 1000) : undefined,
      }
    }

    // No quota data - fetch from upstream
    return await fetchQuotaFromUpstream(orgId, env)
  } catch (error) {
    console.error('[ModelQuotaGuard] Quota cache error:', error)
    return null
  }
}

/**
 * Fetch quota from upstream RaaS API
 */
async function fetchQuotaFromUpstream(
  orgId: string,
  env: Env
): Promise<QuotaStatus | null> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'RaaSGateway-Worker/1.0.0',
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
      // Return default quota status (allow)
      return {
        currentUsage: 0,
        quota: 1_000_000,
        remaining: 1_000_000,
        percentageUsed: 0,
        isOverLimit: false,
        overageUnits: 0,
      }
    }

    const data = await response.json()

    // Cache the result
    const cacheKey = `quota:${orgId}:tokens`
    await env.MODEL_QUOTA_CACHE?.put(
      cacheKey,
      JSON.stringify({
        currentUsage: data.currentUsage,
        quota: data.quota,
        resetAt: data.resetAt || Date.now() + 30 * 24 * 60 * 60 * 1000,
      }),
      { expirationTtl: 3600 }
    )

    return {
      currentUsage: data.currentUsage,
      quota: data.quota,
      remaining: data.remaining,
      percentageUsed: data.percentageUsed,
      isOverLimit: data.isOverLimit,
      overageUnits: data.overageUnits,
      retryAfter: data.retryAfter,
    }
  } catch (error) {
    console.error('[ModelQuotaGuard] Quota fetch error:', error)
    return null
  }
}

/**
 * Build 403 response for model quota exceeded
 */
function build403Response(
  endpoint: ProtectedEndpoint,
  code: string,
  message: string,
  retryAfter?: number
): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-RaaS-Error': 'model_quota',
    'X-RaaS-Code': code.toUpperCase(),
    'X-RaaS-Provider': endpoint.provider,
  }

  if (retryAfter) {
    headers['Retry-After'] = String(retryAfter)
  }

  return new Response(
    JSON.stringify({
      error: code,
      message,
      code: code.toUpperCase(),
      endpoint: endpoint.id,
      provider: endpoint.provider,
      category: endpoint.category,
    }),
    { status: 403, headers }
  )
}

// ============================================================================
// MAIN MIDDLEWARE
// ============================================================================

/**
 * Model Quota Guard middleware
 *
 * Flow:
 * 1. Check if request matches protected endpoint
 * 2. Extract auth token
 * 3. Get license from KV cache
 * 4. Validate tier access
 * 5. Check quota from KV cache
 * 6. Allow or deny
 *
 * @param request - HTTP request
 * @param env - Worker environment
 * @returns ModelQuotaGuardResult
 */
export async function modelQuotaGuard(
  request: Request,
  env: Env
): Promise<ModelQuotaGuardResult> {
  const url = new URL(request.url)

  // Step 1: Check if request matches protected endpoint
  const endpoint = matchProtectedEndpoint(url.pathname)
  if (!endpoint) {
    return { allowed: true, endpoint: null }
  }

  // Step 2: Extract auth token
  const authToken = extractAuthToken(request)
  if (!authToken) {
    return {
      allowed: false,
      endpoint,
      error: 'Thiếu token xác thực',
      code: 'missing_auth_token',
      response: build403Response(
        endpoint,
        'missing_auth_token',
        'Thiếu token xác thực. Vui lòng cung cấp Authorization header hoặc X-API-Key.',
        undefined
      ),
    }
  }

  // Step 3: Get license from cache
  // Try to extract license key from token
  let licenseKey = authToken
  if (authToken.includes('.')) {
    // JWT - try to decode
    try {
      const parts = authToken.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
        if (payload.license_key) {
          licenseKey = payload.license_key
        }
      }
    } catch {
      // Invalid JWT
    }
  }

  const license = await getLicenseFromCache(licenseKey, env)
  if (!license) {
    return {
      allowed: false,
      endpoint,
      error: 'License không hợp lệ',
      code: 'invalid_license',
      response: build403Response(
        endpoint,
        'invalid_license',
        'License không hợp lệ hoặc đã hết hạn.',
        undefined
      ),
    }
  }

  // Step 4: Validate tier access
  const tierRules = TIER_ACCESS_RULES[license.tier]
  if (!tierRules) {
    return {
      allowed: false,
      endpoint,
      error: 'Gói license không hợp lệ',
      code: 'invalid_tier',
      response: build403Response(
        endpoint,
        'invalid_tier',
        `Gói ${license.tier} không hợp lệ.`,
        undefined
      ),
    }
  }

  // Check if tier can access this model category
  if (!tierRules.allowedCategories.includes(endpoint.category)) {
    return {
      allowed: false,
      endpoint,
      tier: license.tier,
      error: `Gói ${license.tier} không được truy cập model ${endpoint.category}`,
      code: 'tier_not_allowed',
      response: build403Response(
        endpoint,
        'tier_not_allowed',
        `Gói ${license.tier} không được truy cập model ${endpoint.category}. Vui lòng nâng cấp.`,
        undefined
      ),
    }
  }

  // Step 5: Check quota
  // Extract orgId from token or license
  let orgId: string | null = null
  if (authToken.includes('.')) {
    try {
      const parts = authToken.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
        if (payload.org_id) {
          orgId = payload.org_id
        }
      }
    } catch {
      // Invalid JWT
    }
  }

  if (orgId) {
    const quotaStatus = await checkQuotaFromCache(orgId, env)

    if (quotaStatus && quotaStatus.isOverLimit) {
      // Check if overage is allowed
      if (tierRules.overageAllowed) {
        // Allow with overage
        return {
          allowed: true,
          endpoint,
          tier: license.tier,
          cached: true,
        }
      }

      // Quota exceeded - deny
      return {
        allowed: false,
        endpoint,
        tier: license.tier,
        error: 'Đã vượt quota tháng này',
        code: 'model_quota_exceeded',
        response: build403Response(
          endpoint,
          'model_quota_exceeded',
          'Lỗi API model: Đã vượt quota tháng này. Vui lòng nâng cấp gói hoặc chờ reset.',
          quotaStatus.retryAfter
        ),
        retryAfter: quotaStatus.retryAfter,
        cached: true,
      }
    }
  }

  // Step 6: All checks passed
  return {
    allowed: true,
    endpoint,
    tier: license.tier,
    cached: true,
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const modelQuotaGuardMiddleware = {
  guard: modelQuotaGuard,
  matchEndpoint: matchProtectedEndpoint,
  extractToken: extractAuthToken,
}

export default modelQuotaGuardMiddleware
