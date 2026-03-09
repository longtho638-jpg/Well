/**
 * Quota Middleware - Cloudflare Worker v2.0.0
 *
 * Intercepts API requests and enforces quota limits before routing to Supabase Edge Functions.
 *
 * Features:
 * - Real-time quota checking via Supabase
 * - KV-backed caching for sub-50ms latency
 * - Hard/soft/hybrid enforcement modes
 * - Quota headers on all responses
 *
 * Routes:
 * - POST /functions/check-quota → Quota check endpoint
 * - POST /functions/usage-track → Usage tracking (bypasses quota check)
 * - API requests → Quota check + forward
 */

interface Env {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  KV_STORE: KVNamespace
  ENFORCEMENT_MODE: 'soft' | 'hard' | 'hybrid'
  BYPASS_ROUTES: string
}

interface QuotaCheckResult {
  allowed: boolean
  currentUsage: number
  effectiveQuota: number
  remaining: number
  percentageUsed: number
  isOverLimit: boolean
  retryAfter?: number
  orgId?: string
  metricType?: string
}

interface QuotaCheckParams {
  orgId: string
  tenantId?: string
  apiKey?: string
  metricType: string
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)

    // CORS preflight handling
    if (request.method === 'OPTIONS') {
      return handleCORS()
    }

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Skip quota check for bypass routes
    const bypassRoutes = (env.BYPASS_ROUTES || '/health,/functions/usage-track,/functions/usage-analytics').split(',')
    if (bypassRoutes.some(route => url.pathname.includes(route))) {
      console.log('[QuotaMiddleware] Bypassing quota check for:', url.pathname)
      return fetch(request)
    }

    // Extract auth context from headers
    const apiKey = request.headers.get('X-API-Key')
    const orgId = request.headers.get('X-Org-ID')
    const tenantId = request.headers.get('X-Tenant-ID')

    // Require authentication
    if (!apiKey && !orgId) {
      return new Response(JSON.stringify({
        error: 'missing_authentication',
        message: 'X-API-Key or X-Org-ID header required',
      }), {
        status: 401,
        headers: {
          ...corsHeaders(),
          'Content-Type': 'application/json',
        },
      })
    }

    // Check quota for primary metric (api_calls)
    const result = await checkQuota({
      orgId: orgId || '',
      tenantId: tenantId || undefined,
      apiKey: apiKey || undefined,
      metricType: 'api_calls',
    }, env)

    // Build quota headers
    const quotaHeaders = new Headers({
      'X-Quota-Remaining': String(result.remaining),
      'X-Quota-Percentage': String(result.percentageUsed),
      'X-Quota-Limit': String(result.effectiveQuota === -1 ? 'unlimited' : result.effectiveQuota),
      'X-Quota-Metric': result.metricType || 'api_calls',
    })

    // Enforce based on mode
    if (!result.allowed && result.isOverLimit) {
      if (env.ENFORCEMENT_MODE === 'hard') {
        return new Response(JSON.stringify({
          error: 'quota_exceeded',
          message: 'Quota exceeded. Upgrade plan or wait for reset.',
          details: {
            currentUsage: result.currentUsage,
            effectiveQuota: result.effectiveQuota,
            percentageUsed: result.percentageUsed,
          },
          retry_after: result.retryAfter || 3600,
        }), {
          status: 429,
          headers: {
            ...corsHeaders(),
            ...Object.fromEntries(quotaHeaders),
            'Content-Type': 'application/json',
            'Retry-After': String(result.retryAfter || 3600),
          },
        })
      }

      // Soft/hybrid: allow with warning header
      quotaHeaders.set('X-Quota-Warning', 'overage_billing_applies')
      quotaHeaders.set('X-Quota-Overage-Units', String(Math.max(0, result.currentUsage - result.effectiveQuota)))
    }

    // Forward request to Supabase Edge Function
    const edgeFunctionUrl = `${env.SUPABASE_URL}/functions/v1${url.pathname}${url.search}`
    const forwardRequest = new Request(edgeFunctionUrl, {
      method: request.method,
      headers: new Headers(request.headers),
      body: request.body,
    })

    // Add auth headers
    forwardRequest.headers.set('apikey', env.SUPABASE_SERVICE_ROLE_KEY)
    forwardRequest.headers.set('Authorization', `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`)

    // Add quota context headers
    if (orgId) forwardRequest.headers.set('X-Org-ID', orgId)
    if (tenantId) forwardRequest.headers.set('X-Tenant-ID', tenantId)
    quotaHeaders.forEach((value, key) => {
      forwardRequest.headers.set(key, value)
    })

    // Execute edge function
    const response = await fetch(forwardRequest)

    // Merge quota headers into response
    const responseHeaders = new Headers(response.headers)
    quotaHeaders.forEach((value, key) => {
      responseHeaders.set(key, value)
    })

    // Return response with CORS
    return new Response(response.body, {
      status: response.status,
      headers: {
        ...corsHeaders(),
        ...Object.fromEntries(responseHeaders),
      },
    })
  },
}

/**
 * Check quota via Supabase
 */
async function checkQuota(
  params: QuotaCheckParams,
  env: Env
): Promise<QuotaCheckResult> {
  const { orgId, tenantId, apiKey, metricType } = params

  try {
    // Step 1: Check KV cache (TTL: 2 minutes)
    const cacheKey = `quota:${orgId}:${metricType}`
    const cached = await env.KV_STORE.get<QuotaCheckResult>(cacheKey, 'json')

    if (cached && !isStale(cached)) {
      return { ...cached, orgId, metricType }
    }

    // Step 2: Fetch from Supabase billing_state
    const billingStateUrl = `${env.SUPABASE_URL}/rest/v1/billing_state?org_id=eq.${orgId}&metric_type=eq.${metricType}&select=*`

    const billingResponse = await fetch(billingStateUrl, {
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation',
      },
    })

    let currentUsage = 0
    let effectiveQuota = 0
    let enforcementMode = env.ENFORCEMENT_MODE

    if (billingResponse.ok) {
      const billingData = await billingResponse.json() as any[]
      if (billingData.length > 0) {
        const state = billingData[0]
        currentUsage = state.current_usage || 0
        effectiveQuota = state.quota_limit || 0
        // Could store enforcement_mode in billing_state if needed
      }
    }

    // Fallback: Query usage_records for current usage
    if (currentUsage === 0) {
      const now = new Date()
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()

      const usageUrl = `${env.SUPABASE_URL}/rest/v1/usage_records?select=quantity&org_id=eq.${orgId}&feature=eq.${metricType}&recorded_at=gte.${periodStart}&recorded_at=lt.${periodEnd}`

      const usageResponse = await fetch(usageUrl, {
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Prefer': 'sum(quantity)',
        },
      })

      if (usageResponse.ok) {
        currentUsage = (await usageResponse.json()) as number || 0
      }
    }

    // Fallback: Get quota from subscription tier
    if (effectiveQuota === 0 && apiKey) {
      const licenseUrl = `${env.SUPABASE_URL}/rest/v1/raas_licenses?api_key=eq.${apiKey}&select=tier`
      const licenseResponse = await fetch(licenseUrl, {
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      })

      if (licenseResponse.ok) {
        const licenseData = await licenseResponse.json() as any[]
        if (licenseData.length > 0) {
          const tier = licenseData[0].tier || 'free'
          effectiveQuota = getTierQuota(tier, metricType)
        }
      }
    }

    // Calculate quota status
    const remaining = effectiveQuota === -1 ? Infinity : Math.max(0, effectiveQuota - currentUsage)
    const percentageUsed = effectiveQuota === -1 ? 0 : Math.round((currentUsage / Math.max(1, effectiveQuota)) * 100)
    const isOverLimit = effectiveQuota !== -1 && currentUsage > effectiveQuota

    // Determine if allowed based on enforcement mode
    const allowed = !isOverLimit || enforcementMode === 'soft'

    // Calculate retry after (seconds until period reset)
    const retryAfter = isOverLimit
      ? Math.floor((new Date(periodEnd).getTime() - Date.now()) / 1000)
      : undefined

    // Cache result
    const result: QuotaCheckResult = {
      allowed,
      currentUsage,
      effectiveQuota,
      remaining: remaining === Infinity ? -1 : remaining,
      percentageUsed,
      isOverLimit,
      retryAfter,
      orgId,
      metricType,
    }

    await env.KV_STORE.put(cacheKey, JSON.stringify(result), { expirationTtl: 120 })

    return result
  } catch (error) {
    console.error('[QuotaMiddleware] Quota check error:', error)
    // Fail open - allow request but log error
    return {
      allowed: true,
      currentUsage: 0,
      effectiveQuota: -1,
      remaining: -1,
      percentageUsed: 0,
      isOverLimit: false,
      orgId,
      metricType,
    }
  }
}

/**
 * Get tier-based default quota
 */
function getTierQuota(tier: string, metricType: string): number {
  const quotas: Record<string, Record<string, number>> = {
    free: { api_calls: 1000, ai_calls: 10, tokens: 100000 },
    basic: { api_calls: 10000, ai_calls: 100, tokens: 1000000 },
    premium: { api_calls: 50000, ai_calls: 500, tokens: 5000000 },
    enterprise: { api_calls: 200000, ai_calls: 2000, tokens: 20000000 },
    master: { api_calls: -1, ai_calls: -1, tokens: -1 },
  }

  return quotas[tier]?.[metricType] || 1000
}

/**
 * Check if cached result is stale (older than 2 minutes)
 */
function isStale(result: QuotaCheckResult): boolean {
  // Simple implementation - in production, store timestamp in cache
  return false
}

/**
 * CORS headers helper
 */
function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, X-Org-ID, X-Tenant-ID',
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
