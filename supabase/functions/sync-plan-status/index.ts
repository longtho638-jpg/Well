/**
 * Edge Function: Sync Plan Status
 *
 * Handles plan status synchronization between RaaS Gateway (Polar/Stripe)
 * and AgencyOS dashboard. Called by Cloudflare Worker cron job or webhook events.
 *
 * Endpoints:
 * - POST /functions/v1/sync-plan-status - Sync plan status
 * - GET /functions/v1/sync-plan-status - Get sync status
 *
 * Request Body (POST):
 * {
 *   action: 'sync' | 'webhook_polar' | 'webhook_stripe',
 *   orgId?: string,
 *   licenseId?: string,
 *   planStatus?: string,
 *   entitlements?: Entitlements,
 *   webhookPayload?: PolarWebhookData | StripeSubscriptionData
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   syncedCount?: number,
 *   failedCount?: number,
 *   errors?: string[],
 *   timestamp: string
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { analyticsLogger } from '../_shared/logger.ts'

// Environment variables
const AGENCYOS_API_URL = Deno.env.get('AGENCYOS_API_URL') || 'https://agencyos.network/api/internal'
const AGENCYOS_API_KEY = Deno.env.get('AGENCYOS_API_KEY') || ''
const POLAR_WEBHOOK_SECRET = Deno.env.get('POLAR_WEBHOOK_SECRET') || ''
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'default-secret'

interface SyncRequest {
  action: 'sync' | 'webhook_polar' | 'webhook_stripe' | 'status'
  orgId?: string
  licenseId?: string
  planStatus?: string
  entitlements?: {
    plan_id: string
    plan_name: string
    features: Record<string, unknown>
    quota_limits: Record<string, number>
    overage_rates: Record<string, number>
    effective_date: string
    expiry_date?: string
  }
  webhookPayload?: PolarWebhookData | StripeSubscriptionData
}

interface PolarWebhookData {
  event: string
  data: {
    id: string
    status: string
    customer_id: string
    product_id: string
    current_period_start: string
    current_period_end: string
    cancel_at_period_end: boolean
    created_at: string
    updated_at: string
    metadata?: Record<string, string>
  }
}

interface StripeSubscriptionData {
  id: string
  customer: string
  status: string
  items: {
    data: Array<{
      price: {
        id: string
        product: string
      }
    }>
  }
  current_period_start: number
  current_period_end: number
  created: number
  metadata?: Record<string, string>
}

interface SyncResponse {
  success: boolean
  syncedCount?: number
  failedCount?: number
  errors?: string[]
  timestamp: string
  data?: unknown
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only accept POST and GET
    if (req.method !== 'POST' && req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body for POST
    let body: SyncRequest | null = null
    if (req.method === 'POST') {
      try {
        body = await req.json()
      } catch (e) {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON body' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    const action = body?.action || 'status'
    const timestamp = new Date().toISOString()

    analyticsLogger.info('[sync-plan-status] Request received', {
      action,
      method: req.method,
    })

    // Route to appropriate handler
    let result: SyncResponse

    switch (action) {
      case 'sync':
        result = await handleFullSync(body)
        break
      case 'webhook_polar':
        result = await handlePolarWebhook(body)
        break
      case 'webhook_stripe':
        result = await handleStripeWebhook(body)
        break
      case 'status':
      default:
        result = await handleStatus()
        break
    }

    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    analyticsLogger.error('[sync-plan-status] Error', error)

    return new Response(
      JSON.stringify({
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

/**
 * Handle full sync action
 */
async function handleFullSync(request: SyncRequest | null): Promise<SyncResponse> {
  analyticsLogger.info('[sync-plan-status] Running full sync')

  try {
    // Fetch active subscriptions from Supabase
    const { data: subscriptions, error } = await fetchActiveSubscriptions()

    if (error) {
      throw new Error(`Failed to fetch subscriptions: ${error}`)
    }

    if (!subscriptions || subscriptions.length === 0) {
      return {
        success: true,
        syncedCount: 0,
        failedCount: 0,
        timestamp: new Date().toISOString(),
      }
    }

    let syncedCount = 0
    let failedCount = 0
    const errors: string[] = []

    // Sync each subscription to AgencyOS
    for (const sub of subscriptions) {
      try {
        await syncToAgencyOS({
          orgId: sub.org_id,
          licenseId: sub.license_id,
          planStatus: sub.status,
          entitlements: subscriptionToEntitlements(sub),
        })
        syncedCount++
      } catch (err) {
        failedCount++
        errors.push(`Failed to sync ${sub.org_id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    analyticsLogger.info('[sync-plan-status] Full sync completed', {
      syncedCount,
      failedCount,
    })

    return {
      success: failedCount === 0,
      syncedCount,
      failedCount,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    analyticsLogger.error('[sync-plan-status] handleFullSync error', error)
    return {
      success: false,
      syncedCount: 0,
      failedCount: 1,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      timestamp: new Date().toISOString(),
    }
  }
}

/**
 * Handle Polar webhook action
 */
async function handlePolarWebhook(request: SyncRequest | null): Promise<SyncResponse> {
  if (!request?.webhookPayload) {
    return {
      success: false,
      errors: ['Missing webhook payload'],
      timestamp: new Date().toISOString(),
    }
  }

  const payload = request.webhookPayload as PolarWebhookData

  analyticsLogger.info('[sync-plan-status] Processing Polar webhook', {
    event: payload.event,
    subscriptionId: payload.data.id,
  })

  try {
    // Verify webhook signature (if secret configured)
    if (POLAR_WEBHOOK_SECRET) {
      // TODO: Implement signature verification
      // const signature = req.headers.get('x-polar-signature')
      // verifySignature(signature, rawBody, POLAR_WEBHOOK_SECRET)
    }

    // Map Polar webhook to subscription format
    const subscription = {
      org_id: payload.data.customer_id,
      license_id: payload.data.metadata?.license_id,
      status: mapPolarStatus(payload.data.status),
      plan_id: payload.data.product_id,
      plan_name: payload.data.product_id,
      current_period_start: payload.data.current_period_start,
      current_period_end: payload.data.current_period_end,
    }

    // Sync to AgencyOS
    await syncToAgencyOS({
      orgId: subscription.org_id,
      licenseId: subscription.license_id,
      planStatus: subscription.status,
      entitlements: subscriptionToEntitlements(subscription),
    })

    return {
      success: true,
      syncedCount: 1,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    analyticsLogger.error('[sync-plan-status] handlePolarWebhook error', error)
    return {
      success: false,
      syncedCount: 0,
      failedCount: 1,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      timestamp: new Date().toISOString(),
    }
  }
}

/**
 * Handle Stripe webhook action
 */
async function handleStripeWebhook(request: SyncRequest | null): Promise<SyncResponse> {
  if (!request?.webhookPayload) {
    return {
      success: false,
      errors: ['Missing webhook payload'],
      timestamp: new Date().toISOString(),
    }
  }

  const payload = request.webhookPayload as StripeSubscriptionData

  analyticsLogger.info('[sync-plan-status] Processing Stripe webhook', {
    subscriptionId: payload.id,
  })

  try {
    // Verify webhook signature (if secret configured)
    if (STRIPE_WEBHOOK_SECRET) {
      // TODO: Implement Stripe signature verification
      // const signature = req.headers.get('stripe-signature')
      // verifyStripeSignature(signature, rawBody, STRIPE_WEBHOOK_SECRET)
    }

    // Map Stripe webhook to subscription format
    const priceItem = payload.items?.data?.[0]
    const subscription = {
      org_id: payload.customer,
      license_id: payload.metadata?.license_id,
      status: mapStripeStatus(payload.status),
      plan_id: priceItem?.price?.product || 'unknown',
      plan_name: priceItem?.price?.product || 'Unknown Plan',
      current_period_start: new Date(payload.current_period_start * 1000).toISOString(),
      current_period_end: new Date(payload.current_period_end * 1000).toISOString(),
    }

    // Sync to AgencyOS
    await syncToAgencyOS({
      orgId: subscription.org_id,
      licenseId: subscription.license_id,
      planStatus: subscription.status,
      entitlements: subscriptionToEntitlements(subscription),
    })

    return {
      success: true,
      syncedCount: 1,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    analyticsLogger.error('[sync-plan-status] handleStripeWebhook error', error)
    return {
      success: false,
      syncedCount: 0,
      failedCount: 1,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      timestamp: new Date().toISOString(),
    }
  }
}

/**
 * Handle status check action
 */
async function handleStatus(): Promise<SyncResponse> {
  try {
    // Get sync statistics
    const { data: stats } = await getSyncStats()

    return {
      success: true,
      timestamp: new Date().toISOString(),
      data: stats,
    }
  } catch (error) {
    analyticsLogger.error('[sync-plan-status] handleStatus error', error)
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      timestamp: new Date().toISOString(),
    }
  }
}

/**
 * Sync plan entitlements to AgencyOS
 */
async function syncToAgencyOS(params: {
  orgId: string
  licenseId?: string
  planStatus: string
  entitlements: {
    plan_id: string
    plan_name: string
    features: Record<string, unknown>
    quota_limits: Record<string, number>
    overage_rates: Record<string, number>
    effective_date: string
    expiry_date?: string
  }
}): Promise<void> {
  const { orgId, entitlements } = params

  // Generate JWT token
  const token = await generateJWT(orgId)

  // Generate idempotency key
  const idempotencyKey = `sync_${orgId}_${entitlements.plan_id}_${Math.floor(Date.now() / 1000 / 300)}`

  // Call AgencyOS API
  const response = await fetch(`${AGENCYOS_API_URL}/plan/entitlements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      org_id: orgId,
      entitlements,
      sync_timestamp: new Date().toISOString(),
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `API error: ${response.status}`)
  }
}

/**
 * Fetch active subscriptions from Supabase
 */
async function fetchActiveSubscriptions() {
  // This would typically use the Supabase client
  // For Edge Functions, we use the RPC or direct table query
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_active_subscriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({}),
  })

  if (!response.ok) {
    return { data: null, error: `Failed to fetch: ${response.status}` }
  }

  const data = await response.json()
  return { data, error: null }
}

/**
 * Get sync statistics
 */
async function getSyncStats() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''

  // Get recent sync logs
  const response = await fetch(
    `${supabaseUrl}/rest/v1/plan_sync_log?select=sync_status,count()&group_by=sync_status&order=created_at.desc&limit=100`,
    {
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
    }
  )

  if (!response.ok) {
    return { recentSyncs: [], stats: {} }
  }

  const data = await response.json()
  return { recentSyncs: data, stats: { totalSyncs: data?.length || 0 } }
}

/**
 * Generate JWT token for AgencyOS auth
 */
async function generateJWT(orgId: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: 'wellnexus.vn',
    aud: 'agencyos.network',
    sub: orgId,
    exp: now + 3600, // 1 hour
    iat: now,
  }

  const encoder = new TextEncoder()
  const headerBase64 = base64UrlEncode(JSON.stringify(header))
  const payloadBase64 = base64UrlEncode(JSON.stringify(payload))

  // Sign with JWT secret
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${headerBase64}.${payloadBase64}`)
  )

  const signatureBase64 = arrayBufferToBase64Url(signature)

  return `${headerBase64}.${payloadBase64}.${signatureBase64}`
}

/**
 * Convert subscription to entitlements
 */
function subscriptionToEntitlements(sub: {
  plan_id: string
  plan_name: string
  status: string
  current_period_start: string
  current_period_end: string
}): {
  plan_id: string
  plan_name: string
  features: Record<string, unknown>
  quota_limits: Record<string, number>
  overage_rates: Record<string, number>
  effective_date: string
  expiry_date: string
} {
  // Map plan_id to entitlements
  const entitlementsMap: Record<string, {
    features: Record<string, unknown>
    quota_limits: Record<string, number>
    overage_rates: Record<string, number>
  }> = {
    'raas_basic': {
      features: { api_access: true, model_inference: true },
      quota_limits: { api_calls: 1000, ai_calls: 100 },
      overage_rates: { api_calls: 0.001, ai_calls: 0.01 },
    },
    'raas_premium': {
      features: { api_access: true, model_inference: true, agent_execution: true },
      quota_limits: { api_calls: 10000, ai_calls: 1000 },
      overage_rates: { api_calls: 0.0008, ai_calls: 0.008 },
    },
    'raas_enterprise': {
      features: { api_access: true, model_inference: true, agent_execution: true, priority_support: true },
      quota_limits: { api_calls: 100000, ai_calls: 10000 },
      overage_rates: { api_calls: 0.0005, ai_calls: 0.005 },
    },
  }

  const planEntitlements = entitlementsMap[sub.plan_id] || {
    features: {},
    quota_limits: {},
    overage_rates: {},
  }

  return {
    plan_id: sub.plan_id,
    plan_name: sub.plan_name,
    features: planEntitlements.features,
    quota_limits: planEntitlements.quota_limits,
    overage_rates: planEntitlements.overage_rates,
    effective_date: sub.current_period_start,
    expiry_date: sub.current_period_end,
  }
}

/**
 * Map Polar status to internal status
 */
function mapPolarStatus(polarStatus: string): string {
  const statusMap: Record<string, string> = {
    'active': 'active',
    'trialing': 'trialing',
    'paused': 'paused',
    'canceled': 'canceled',
    'expired': 'expired',
  }
  return statusMap[polarStatus] || 'active'
}

/**
 * Map Stripe status to internal status
 */
function mapStripeStatus(stripeStatus: string): string {
  const statusMap: Record<string, string> = {
    'active': 'active',
    'trialing': 'trialing',
    'past_due': 'active',
    'unpaid': 'active',
    'canceled': 'canceled',
    'incomplete': 'trialing',
    'incomplete_expired': 'expired',
  }
  return statusMap[stripeStatus] || 'active'
}

/**
 * Base64URL encode a string
 */
function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Convert ArrayBuffer to Base64URL
 */
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
