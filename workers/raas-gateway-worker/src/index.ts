/**
 * RaaS Gateway Worker - Cloudflare Worker v1.0.1
 *
 * Edge proxy for RaaS Gateway API with KV-backed license validation caching.
 * Provides sub-50ms response times for license validation requests.
 *
 * Features:
 * - License validation endpoint with KV caching (5-min TTL)
 * - Health check endpoint
 * - Suspension logging to KV (30-day TTL)
 * - Model quota guard middleware (Phase 6)
 * - CORS headers for cross-origin requests
 *
 * Endpoints:
 * - GET  /health - Health check
 * - POST /v1/validate-license - License validation
 * - POST /v1/log-suspension - Log suspension event
 * - POST /v1/check-model-quota - Model quota check (Phase 6)
 */

interface Env {
  RAAS_API_URL: string
  RAAS_API_KEY?: string
  CACHE_TTL_SECONDS: number
  SUSPENSION_LOG_TTL_SECONDS: number
  LICENSE_CACHE: KVNamespace
  SUSPENSION_LOG: KVNamespace
  MODEL_QUOTA_CACHE?: KVNamespace
}

import { modelQuotaGuard } from './middleware/model-quota-guard'

interface LicenseValidationRequest {
  licenseKey: string
  mkApiKey?: string
  orgId?: string
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

interface SuspensionLogEntry {
  licenseKey: string
  orgId?: string
  reason: string
  timestamp: string
  ip?: string
  userAgent?: string
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)

    // CORS preflight handling
    if (request.method === 'OPTIONS') {
      return handleCORS()
    }

    // Route requests
    try {
      if (url.pathname === '/health') {
        return handleHealthCheck()
      }

      if (url.pathname === '/v1/validate-license' && request.method === 'POST') {
        return handleValidateLicense(request, env)
      }

      if (url.pathname === '/v1/log-suspension' && request.method === 'POST') {
        return handleLogSuspension(request, env)
      }

      // Phase 6: Model quota check endpoint
      if (url.pathname === '/v1/check-model-quota' && request.method === 'POST') {
        return handleCheckModelQuota(request, env)
      }

      // Phase 6: Model quota guard middleware for all requests
      // Run guard before processing any request to AI endpoints
      const guardResult = await modelQuotaGuard(request, env)
      if (!guardResult.allowed && guardResult.response) {
        return guardResult.response
      }

      // 404 for unknown routes
      return new Response(JSON.stringify({ error: 'not_found', message: 'Endpoint not found' }), {
        status: 404,
        headers: {
          ...corsHeaders(),
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      console.error('[RaaSGateway] Unhandled error:', error)
      return new Response(JSON.stringify({
        error: 'internal_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }), {
        status: 500,
        headers: {
          ...corsHeaders(),
          'Content-Type': 'application/json',
        },
      })
    }
  },
}

/**
 * Health check endpoint
 */
function handleHealthCheck(): Response {
  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'raas-gateway-worker',
    version: '1.0.0',
  }), {
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json',
    },
  })
}

/**
 * License validation handler
 *
 * Flow:
 * 1. Parse request body
 * 2. Check KV cache for existing validation
 * 3. If cache miss, call upstream RaaS API
 * 4. Cache result with TTL
 * 5. Return validation result
 */
async function handleValidateLicense(request: Request, env: Env): Promise<Response> {
  let body: LicenseValidationRequest

  try {
    body = await request.json()
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'invalid_request',
      message: 'Request body must be valid JSON',
    }), {
      status: 400,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
      },
    })
  }

  const { licenseKey, mkApiKey, orgId } = body

  // Validate required fields
  if (!licenseKey) {
    return new Response(JSON.stringify({
      error: 'missing_license_key',
      message: 'licenseKey is required',
    }), {
      status: 400,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
      },
    })
  }

  const cacheKey = `license:${licenseKey}`

  try {
    // Step 1: Check KV cache
    const cached = await env.LICENSE_CACHE.get<LicenseValidationResult>(cacheKey)

    if (cached) {
      console.log('[RaaSGateway] Cache hit for license:', licenseKey)
      return new Response(JSON.stringify({
        ...cached,
        cached: true,
      }), {
        headers: {
          ...corsHeaders(),
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
        },
      })
    }

    console.log('[RaaSGateway] Cache miss for license:', licenseKey)

    // Step 2: Cache miss - call upstream RaaS API
    const validationResult = await validateWithUpstream(body, env)

    // Step 3: Cache result
    await env.LICENSE_CACHE.put(cacheKey, JSON.stringify(validationResult), {
      expirationTtl: Number(env.CACHE_TTL_SECONDS) || 300,
    })

    // Step 4: Return result
    return new Response(JSON.stringify({
      ...validationResult,
      cached: false,
    }), {
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
      },
    })
  } catch (error) {
    console.error('[RaaSGateway] Validation error:', error)

    // Fail closed - return invalid license on error
    const errorResult: LicenseValidationResult = {
      isValid: false,
      tier: 'basic',
      status: 'revoked',
      features: {
        adminDashboard: false,
        payosAutomation: false,
        premiumAgents: false,
        advancedAnalytics: false,
      },
      message: error instanceof Error ? error.message : 'Validation service unavailable',
    }

    return new Response(JSON.stringify(errorResult), {
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
        'X-Cache': 'ERROR',
      },
    })
  }
}

/**
 * Call upstream RaaS API for validation
 */
async function validateWithUpstream(
  request: LicenseValidationRequest,
  env: Env
): Promise<LicenseValidationResult> {
  const { licenseKey } = request

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'RaaSGateway-Worker/1.0.0',
  }

  // Add API key authentication
  if (env.RAAS_API_KEY) {
    headers['Authorization'] = `Bearer ${env.RAAS_API_KEY}`
  }

  // Add org context
  if (orgId) {
    headers['X-Org-ID'] = orgId
  }

  const response = await fetch(`${env.RAAS_API_URL}/v1/validate-license`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ licenseKey }),
  })

  if (!response.ok) {
    const errorData: any = await response.json().catch(() => ({}))
    return {
      isValid: false,
      tier: 'basic',
      status: 'revoked',
      features: {
        adminDashboard: false,
        payosAutomation: false,
        premiumAgents: false,
        advancedAnalytics: false,
      },
      message: errorData.error || `Upstream API error: ${response.status}`,
    }
  }

  const data: any = await response.json()

  return {
    isValid: data.isValid,
    tier: data.tier || 'basic',
    status: data.isValid ? 'active' : 'revoked',
    features: data.features || {},
    expiresAt: data.expiresAt,
    daysRemaining: data.daysRemaining,
    message: data.message,
  }
}

/**
 * Suspension logging handler
 *
 * Logs suspension events to KV for audit trail
 */
async function handleLogSuspension(request: Request, env: Env): Promise<Response> {
  let body: SuspensionLogEntry

  try {
    body = await request.json()
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'invalid_request',
      message: 'Request body must be valid JSON',
    }), {
      status: 400,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
      },
    })
  }

  const { licenseKey, orgId, reason } = body

  if (!licenseKey || !reason) {
    return new Response(JSON.stringify({
      error: 'missing_fields',
      message: 'licenseKey and reason are required',
    }), {
      status: 400,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
      },
    })
  }

  try {
    const entry: SuspensionLogEntry = {
      licenseKey,
      orgId,
      reason,
      timestamp: new Date().toISOString(),
    }

    // Store with license key as prefix for easy lookup
    const logKey = `suspension:${licenseKey}:${Date.now()}`

    await env.SUSPENSION_LOG.put(logKey, JSON.stringify(entry), {
      expirationTtl: Number(env.SUSPENSION_LOG_TTL_SECONDS) || 2592000, // 30 days
    })

    return new Response(JSON.stringify({
      success: true,
      message: 'Suspension logged',
    }), {
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('[RaaSGateway] Suspension log error:', error)
    return new Response(JSON.stringify({
      error: 'log_failed',
      message: 'Failed to log suspension',
    }), {
      status: 500,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
      },
    })
  }
}

/**
 * CORS headers helper
 */
function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Org-ID',
    'Access-Control-Max-Age': '86400',
  }
}

/**
 * Handle CORS preflight
 */
function handleCORS(): Response {
  return new Response(null, {
    headers: corsHeaders(),
  })
}

/**
 * Model quota check endpoint (Phase 6)
 *
 * Request body:
 * - licenseKey: string
 * - orgId?: string
 * - model?: string (optional model name)
 *
 * Response:
 * - allowed: boolean
 * - tier: string
 * - quotaStatus: { currentUsage, quota, remaining, percentageUsed }
 */
async function handleCheckModelQuota(request: Request, env: Env): Promise<Response> {
  let body: { licenseKey: string; orgId?: string; model?: string }

  try {
    body = await request.json()
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'invalid_request',
      message: 'Request body must be valid JSON',
    }), {
      status: 400,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
      },
    })
  }

  const { licenseKey, orgId, model } = body

  if (!licenseKey) {
    return new Response(JSON.stringify({
      error: 'missing_license_key',
      message: 'licenseKey is required',
    }), {
      status: 400,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
      },
    })
  }

  try {
    // Get license from cache
    const license = await getLicenseForQuotaCheck(licenseKey, env)

    if (!license) {
      return new Response(JSON.stringify({
        error: 'invalid_license',
        message: 'License không hợp lệ hoặc đã hết hạn',
      }), {
        status: 400,
        headers: {
          ...corsHeaders(),
          'Content-Type': 'application/json',
        },
      })
    }

    // Check quota if orgId provided
    let quotaStatus = null
    if (orgId) {
      quotaStatus = await getQuotaStatus(orgId, env)
    }

    return new Response(JSON.stringify({
      allowed: true,
      tier: license.tier,
      status: license.status,
      quotaStatus,
      model,
    }), {
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('[RaaSGateway] Model quota check error:', error)
    return new Response(JSON.stringify({
      error: 'check_failed',
      message: 'Failed to check model quota',
    }), {
      status: 500,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
      },
    })
  }
}

/**
 * Get license for quota check
 */
async function getLicenseForQuotaCheck(
  licenseKey: string,
  env: Env
): Promise<{ tier: string; status: string } | null> {
  const cacheKey = `license:${licenseKey}`

  try {
    const cached = await env.LICENSE_CACHE.get(cacheKey)
    if (cached) {
      const parsed = JSON.parse(cached)
      return { tier: parsed.tier, status: parsed.status }
    }

    // Fetch from upstream
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

    // Cache result
    await env.LICENSE_CACHE.put(cacheKey, JSON.stringify({
      tier: data.tier || 'basic',
      status: data.isValid ? 'active' : 'revoked',
      cachedAt: Date.now(),
      ttl: 300,
    }), {
      expirationTtl: 300,
    })

    return { tier: data.tier || 'basic', status: data.isValid ? 'active' : 'revoked' }
  } catch (error) {
    console.error('[RaaSGateway] License fetch error:', error)
    return null
  }
}

/**
 * Get quota status for org
 */
async function getQuotaStatus(
  orgId: string,
  env: Env
): Promise<{
  currentUsage: number
  quota: number
  remaining: number
  percentageUsed: number
  isOverLimit: boolean
} | null> {
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

      return {
        currentUsage: cached.currentUsage,
        quota: cached.quota,
        remaining,
        percentageUsed,
        isOverLimit: cached.currentUsage >= cached.quota,
      }
    }

    // Fetch from upstream
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
      return null
    }

    const data = await response.json()

    // Cache result
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
    }
  } catch (error) {
    console.error('[RaaSGateway] Quota fetch error:', error)
    return null
  }
}
