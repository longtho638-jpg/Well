// eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { corsHeaders } from '../_shared/cors.ts'

/**
 * Usage Analytics Edge Function
 *
 * Real-time usage analytics for dashboard.
 * Requires authentication via Bearer token.
 *
 * **GET Endpoints:**
 *   GET /functions/v1/usage-analytics?query=current&user_id=xxx&license_id=xxx
 *   GET /functions/v1/usage-analytics?query=quotas&user_id=xxx
 *   GET /functions/v1/usage-analytics?query=breakdown&period=week
 *
 * **POST Endpoint (Usage Ingestion):**
 *   POST /functions/v1/usage-analytics
 *   Body: {
 *     event_id: string (required, unique for idempotency)
 *     user_id: string (required)
 *     license_id: string (required)
 *     events: [{
 *       feature: 'api_call' | 'tokens' | 'compute_ms' | 'model_inference' | 'agent_execution'
 *       quantity: number
 *       metadata?: { model?, provider?, prompt_tokens?, completion_tokens?, agent_type? }
 *       timestamp?: string
 *     }]
 *   }
 *
 * Response:
 *   GET: Analytics data based on query type
 *   POST: { processed: number, duplicates: number, warnings: string[] }
 */

interface _AnalyticsQueryParams {
  org_id: string
  period?: 'day' | 'week' | 'month'
  feature?: string
  start_date?: string
  end_date?: string
}

interface UsageIngestionEvent {
  feature: 'api_call' | 'tokens' | 'compute_ms' | 'model_inference' | 'agent_execution'
  quantity: number
  metadata?: Record<string, unknown>
  timestamp?: string
}

interface UsageIngestionRequest {
  event_id: string
  user_id: string
  license_id: string
  events: UsageIngestionEvent[]
}

interface UsageIngestionResponse {
  processed: number
  duplicates: number
  warnings: string[]
  event_id: string
}

interface WebhookPayload {
  event_id: string
  customer_id: string
  license_id?: string
  user_id?: string
  feature: string
  quantity?: number
  metadata?: Record<string, unknown>
  timestamp?: string
  raw_payload?: Record<string, unknown>
}

interface WebhookIngestionResponse {
  success: boolean
  event_id: string
  is_duplicate: boolean
  message?: string
}

/**
 * Enhanced Usage Analytics with AI Metrics
 *
 * New endpoints:
 *   GET /functions/v1/usage-analytics?query=current&user_id=xxx&license_id=xxx
 *   GET /functions/v1/usage-analytics?query=quotas&user_id=xxx
 *   GET /functions/v1/usage-analytics?query=breakdown&period=week
 */

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Handle POST request for usage/webhook ingestion
    if (req.method === 'POST') {
      const url = new URL(req.url)
      const ingestType = url.searchParams.get('type') || 'direct'

      if (ingestType === 'webhook') {
        return handleWebhookIngestion(supabase, req)
      }
      return handleUsageIngestion(supabase, req)
    }

    // Handle GET request for analytics queries
    // Parse query params
    const url = new URL(req.url)
    const queryType = url.searchParams.get('query') || 'summary'
    const userId = url.searchParams.get('user_id')
    const licenseId = url.searchParams.get('license_id')
    const orgId = url.searchParams.get('org_id')
    const period = (url.searchParams.get('period') as 'day' | 'week' | 'month') || 'day'
    const feature = url.searchParams.get('feature') || undefined

    // New query types for AI metrics
    if (queryType === 'current') {
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Missing user_id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      return handleCurrentUsage(supabase, userId, licenseId)
    }

    if (queryType === 'quotas') {
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Missing user_id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      return handleQuotas(supabase, userId, licenseId)
    }

    if (queryType === 'breakdown') {
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Missing user_id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      return handleBreakdown(supabase, userId, period)
    }

    // Legacy: summary query (org-level analytics)
    if (!orgId) {
      return new Response(JSON.stringify({ error: 'Missing required parameter: org_id or query type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Calculate date range based on period
    const now = new Date()
    let startDate: string
    let endDate: string

    if (period === 'day') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      startDate = today.toISOString()
      endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()
    } else if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      startDate = weekAgo.toISOString()
      endDate = now.toISOString()
    } else {
      // month
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      startDate = monthAgo.toISOString()
      endDate = now.toISOString()
    }

    // Build query with optional feature filter
    let query = supabase
      .from('usage_records')
      .select('feature, quantity, user_id, recorded_at')
      .eq('org_id', orgId)
      .gte('recorded_at', startDate)
      .lt('recorded_at', endDate)

    if (feature) {
      query = query.eq('feature', feature)
    }

    const { data: summaryData, error: summaryError } = await query

    if (summaryError) {
      console.error('[USAGE-ANALYTICS] Summary error:', summaryError)
      throw summaryError
    }

    // Aggregate by feature
    const featureMap = new Map<string, { feature: string; total: number; count: number }>()
    const userMap = new Map<string, number>()
    const hourMap = new Map<number, number>()
    const dateMap = new Map<string, number>()

    let totalUsage = 0
    let totalEvents = 0

    summaryData?.forEach(record => {
      // By feature
      const featureData = featureMap.get(record.feature) || { feature: record.feature, total: 0, count: 0 }
      featureData.total += record.quantity
      featureData.count += 1
      featureMap.set(record.feature, featureData)

      // By user
      const userUsage = userMap.get(record.user_id) || 0
      userMap.set(record.user_id, userUsage + record.quantity)

      // By hour
      const hour = new Date(record.recorded_at).getHours()
      hourMap.set(hour, (hourMap.get(hour) || 0) + record.quantity)

      // By date
      const date = record.recorded_at.split('T')[0]
      dateMap.set(date, (dateMap.get(date) || 0) + record.quantity)

      totalUsage += record.quantity
      totalEvents += 1
    })

    // Format results
    const byFeature = Array.from(featureMap.values()).sort((a, b) => b.total - a.total)
    const topUsers = Array.from(userMap.entries())
      .map(([user_id, total_usage]) => ({ user_id, total_usage }))
      .sort((a, b) => b.total_usage - a.total_usage)
      .slice(0, 10)
    const byHour = Array.from(hourMap.entries())
      .map(([hour, usage]) => ({ hour, usage }))
      .sort((a, b) => a.hour - b.hour)
    const trend = Array.from(dateMap.entries())
      .map(([date, usage]) => ({ date, usage }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const response = {
      summary: {
        total_usage: totalUsage,
        total_events: totalEvents,
        unique_users: userMap.size,
        period: { start: startDate, end: endDate },
      },
      by_feature: byFeature,
      by_hour: byHour,
      top_users: topUsers,
      trend,
      metadata: {
        org_id: orgId,
        feature_filter: feature,
        generated_at: new Date().toISOString(),
      },
    }

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('[USAGE-ANALYTICS] Error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// ──────────────────────────────────────────────────────────────────────────
// Helper: Usage Event Ingestion (POST)
// ──────────────────────────────────────────────────────────────────────────

async function handleUsageIngestion(
  supabase: any,
  req: Request
): Promise<Response> {
  const now = Date.now()
  const logs: string[] = []
  const _warnings: string[] = []

  try {
    // Parse request body
    const body: UsageIngestionRequest = await req.json()
    const { event_id, user_id, license_id, events } = body

    // Validate required fields
    if (!event_id || !user_id || !license_id) {
      logs.push(`[INGESTION] Missing required fields: event_id=${!!event_id}, user_id=${!!user_id}, license_id=${!!license_id}`)
      return new Response(JSON.stringify({ error: 'Missing required fields: event_id, user_id, license_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!Array.isArray(events) || events.length === 0) {
      logs.push(`[INGESTION] Invalid events array for event_id=${event_id}`)
      return new Response(JSON.stringify({ error: 'Events array is required and must not be empty' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    logs.push(`[INGESTION] Received event_id=${event_id}, user_id=${user_id}, license_id=${license_id}, event_count=${events.length}`)

    // Step 1: Check idempotency
    const { data: idempotencyCheck, error: idempotencyError } = await supabase
      .rpc('check_usage_event_idempotency', {
        p_event_id: event_id,
        p_user_id: user_id,
        p_license_id: license_id,
        p_metadata: { event_count: events.length, received_at: new Date().toISOString() }
      })

    if (idempotencyError) {
      logs.push(`[INGESTION] Idempotency check error: ${idempotencyError.message}`)
      // Continue processing - unique constraint will handle duplicates
    }

    // Check if this is a duplicate
    const isDuplicate = idempotencyCheck?.[0]?.is_duplicate ?? false
    if (isDuplicate) {
      logs.push(`[INGESTION] DUPLICATE detected event_id=${event_id}`)
      return new Response(JSON.stringify({
        processed: 0,
        duplicates: 1,
        warnings: ['Duplicate event_id - already processed'],
        event_id,
      } as UsageIngestionResponse), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Step 2: Validate license exists and is active
    const { data: license, error: licenseError } = await supabase
      .from('raas_licenses')
      .select('id, tier, status, user_id')
      .eq('id', license_id)
      .single()

    if (licenseError || !license) {
      logs.push(`[INGESTION] Invalid license_id=${license_id}: ${licenseError?.message || 'not found'}`)
      // Mark idempotency record as processed but with warning
      warnings.push(`License not found: ${license_id}`)
      // Continue processing anyway for backward compatibility
    } else if (license.status !== 'active') {
      logs.push(`[INGESTION] License not active: license_id=${license_id}, status=${license.status}`)
      warnings.push(`License status is ${license.status}, not active`)
      // Continue processing - don't block on license status
    }

    // Step 3: Validate and prepare events
    const validFeatures = ['api_call', 'tokens', 'compute_ms', 'model_inference', 'agent_execution']
    const recordsToInsert = []

    for (const event of events) {
      if (!validFeatures.includes(event.feature)) {
        logs.push(`[INGESTION] Invalid feature '${event.feature}' in event_id=${event_id}`)
        warnings.push(`Invalid feature: ${event.feature}`)
        continue
      }

      if (typeof event.quantity !== 'number' || event.quantity < 0) {
        logs.push(`[INGESTION] Invalid quantity for feature=${event.feature} in event_id=${event_id}`)
        warnings.push(`Invalid quantity for ${event.feature}`)
        continue
      }

      recordsToInsert.push({
        user_id,
        license_id,
        org_id: license?.user_id || null,
        feature: event.feature,
        quantity: event.quantity,
        metadata: event.metadata || {},
        recorded_at: event.timestamp || new Date().toISOString(),
      })
    }

    if (recordsToInsert.length === 0) {
      logs.push(`[INGESTION] No valid events to process for event_id=${event_id}`)
      return new Response(JSON.stringify({
        processed: 0,
        duplicates: 0,
        warnings: [...warnings, 'No valid events to process'],
        event_id,
      } as UsageIngestionResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Step 4: Batch insert usage records
    const { _count, error: insertError } = await supabase
      .from('usage_records')
      .insert(recordsToInsert, { count: 'exact' })

    if (insertError) {
      logs.push(`[INGESTION] Failed to insert records: ${insertError.message}`)

      // Rollback idempotency record (delete it so it can be retried)
      await supabase
        .from('usage_event_idempotency')
        .delete()
        .eq('event_id', event_id)

      return new Response(JSON.stringify({ error: `Failed to insert usage records: ${insertError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    logs.push(`[INGESTION] SUCCESS event_id=${event_id}, processed=${recordsToInsert.length}, duration_ms=${Date.now() - now}`)

    // Return success response
    return new Response(JSON.stringify({
      processed: recordsToInsert.length,
      duplicates: 0,
      warnings,
      event_id,
    } as UsageIngestionResponse), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    logs.push(`[INGESTION] ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Helper: Webhook Event Ingestion (POST?type=webhook)
// ──────────────────────────────────────────────────────────────────────────

async function handleWebhookIngestion(
  supabase: any,
  req: Request
): Promise<Response> {
  const now = Date.now()
  const logs: string[] = []
  const _warnings: string[] = []

  try {
    // Parse webhook payload
    const body: WebhookPayload = await req.json()
    const {
      event_id,
      customer_id,
      license_id,
      user_id,
      feature,
      quantity = 1,
      metadata,
      timestamp,
      raw_payload
    } = body

    // Validate required fields
    if (!event_id || !customer_id || !feature) {
      logs.push(`[WEBHOOK] Missing required fields: event_id=${!!event_id}, customer_id=${!!customer_id}, feature=${!!feature}`)
      return new Response(JSON.stringify({ error: 'Missing required fields: event_id, customer_id, feature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate feature against allowlist
    const validFeatures = ['api_call', 'tokens', 'compute_ms', 'storage_mb', 'bandwidth_mb', 'model_inference', 'agent_execution']
    if (!validFeatures.includes(feature)) {
      logs.push(`[WEBHOOK] Invalid feature '${feature}' - must be one of: ${validFeatures.join(', ')}`)
      return new Response(JSON.stringify({
        error: `Invalid feature '${feature}'. Allowed: ${validFeatures.join(', ')}`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    logs.push(`[WEBHOOK] Received event_id=${event_id}, customer_id=${customer_id}, feature=${feature}, quantity=${quantity}`)

    // Extract metadata from raw_payload if provided
    const extractedMetadata = raw_payload ? {
      model: (raw_payload as any).model,
      provider: (raw_payload as any).provider,
      prompt_tokens: (raw_payload as any).prompt_tokens,
      completion_tokens: (raw_payload as any).completion_tokens,
      total_tokens: (raw_payload as any).total_tokens,
      agent_type: (raw_payload as any).agent_type,
      inference_time_ms: (raw_payload as any).inference_time_ms,
      ...metadata,
    } : metadata

    // Remove undefined values from metadata
    const cleanMetadata: Record<string, unknown> = {}
    Object.entries(extractedMetadata || {}).forEach(([key, value]) => {
      if (value !== undefined) cleanMetadata[key] = value
    })

    // Step 1: Check idempotency using database function
    const { data: idempotencyResult, error: idempotencyError } = await supabase
      .rpc('check_usage_event_idempotency_v2', {
        p_event_id: event_id,
        p_customer_id: customer_id,
        p_feature: feature,
        p_quantity: quantity,
        p_license_id: license_id || null,
        p_user_id: user_id || null,
        p_raw_payload: raw_payload || null,
        p_metadata: Object.keys(cleanMetadata).length > 0 ? cleanMetadata : null,
      })

    if (idempotencyError) {
      logs.push(`[WEBHOOK] Idempotency check error: ${idempotencyError.message}`)
      return new Response(JSON.stringify({ error: `Idempotency check failed: ${idempotencyError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const isDuplicate = idempotencyResult?.[0]?.is_duplicate ?? false
    const _eventUuid = idempotencyResult?.[0]?.event_uuid
    const message = idempotencyResult?.[0]?.message

    if (isDuplicate) {
      logs.push(`[WEBHOOK] DUPLICATE detected event_id=${event_id}`)
      return new Response(JSON.stringify({
        success: true,
        event_id,
        is_duplicate: true,
        message: 'Event already processed (idempotent)',
      } as WebhookIngestionResponse), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Step 2: If this is a model_inference event, also insert into usage_records for backward compatibility
    if (feature === 'model_inference' || feature === 'agent_execution') {
      const timestampToUse = timestamp || new Date().toISOString()

      // Insert into usage_records as well
      await supabase.from('usage_records').insert({
        user_id: user_id || null,
        license_id: license_id || null,
        org_id: null,
        feature: feature,
        quantity: quantity,
        metadata: cleanMetadata,
        recorded_at: timestampToUse,
      })
    }

    logs.push(`[WEBHOOK] SUCCESS event_id=${event_id}, duration_ms=${Date.now() - now}`)

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      event_id,
      is_duplicate: false,
      message: message || 'Event processed successfully',
    } as WebhookIngestionResponse), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    logs.push(`[WEBHOOK] ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Helper: Current Usage (per user)
// ──────────────────────────────────────────────────────────────────────────

async function handleCurrentUsage(supabase: any, userId: string, licenseId?: string) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const periodStart = today.toISOString()
  const periodEnd = new Date(today.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()

  const { data: records } = await supabase
    .from('usage_records')
    .select('feature, quantity, metadata')
    .eq('user_id', userId)
    .gte('recorded_at', periodStart)
    .lt('recorded_at', periodEnd)

  const totals: Record<string, number> = {
    api_calls: records?.filter(r => r.feature === 'api_call').reduce((s, r) => s + r.quantity, 0) ?? 0,
    tokens: records?.filter(r => r.feature === 'tokens').reduce((s, r) => s + r.quantity, 0) ?? 0,
    compute_ms: records?.filter(r => r.feature === 'compute_ms').reduce((s, r) => s + r.quantity, 0) ?? 0,
    model_inferences: records?.filter(r => r.feature === 'model_inference').reduce((s, r) => s + r.quantity, 0) ?? 0,
    agent_executions: records?.filter(r => r.feature === 'agent_execution').reduce((s, r) => s + r.quantity, 0) ?? 0,
  }

  // Get tier
  let tier = 'free'
  if (licenseId) {
    const { data: license } = await supabase
      .from('raas_licenses')
      .select('tier')
      .eq('id', licenseId)
      .single()
    tier = license?.tier || 'free'
  }

  const tierLimits: Record<string, Record<string, number>> = {
    free: { api_call: 100, tokens: 10_000, model_inference: 10, agent_execution: 5 },
    basic: { api_call: 1_000, tokens: 100_000, model_inference: 100, agent_execution: 50 },
    premium: { api_call: 10_000, tokens: 1_000_000, model_inference: 1_000, agent_execution: 500 },
    enterprise: { api_call: 100_000, tokens: 10_000_000, model_inference: 10_000, agent_execution: 5_000 },
    master: { api_call: -1, tokens: -1, model_inference: -1, agent_execution: -1 },
  }

  const limits = tierLimits[tier] || tierLimits.free

  const makeQuota = (feature: string, used: number) => {
    const limit = limits[feature] ?? -1
    const isUnlimited = limit === -1
    return {
      used,
      limit,
      remaining: isUnlimited ? -1 : Math.max(0, limit - used),
      percentage: isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100)),
      reset_at: periodEnd,
    }
  }

  const _warnings: string[] = []
  const quotas = {
    api_calls: makeQuota('api_call', totals.api_calls),
    tokens: makeQuota('tokens', totals.tokens),
    model_inferences: makeQuota('model_inference', totals.model_inferences),
    agent_executions: makeQuota('agent_execution', totals.agent_executions),
  }

  Object.entries(quotas).forEach(([feat, quota]) => {
    if (quota.percentage >= 90) warnings.push(`CRITICAL: ${feat} at ${quota.percentage}%`)
    else if (quota.percentage >= 80) warnings.push(`WARNING: ${feat} at ${quota.percentage}%`)
  })

  return new Response(JSON.stringify({
    user_id: userId,
    period: { start: periodStart, end: periodEnd },
    totals,
    quotas,
    warnings,
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// ──────────────────────────────────────────────────────────────────────────
// Helper: Quotas (per user)
// ──────────────────────────────────────────────────────────────────────────

async function handleQuotas(supabase: any, userId: string, licenseId?: string) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const periodStart = today.toISOString()
  const periodEnd = new Date(today.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()

  const { data: records } = await supabase
    .from('usage_records')
    .select('feature, quantity')
    .eq('user_id', userId)
    .gte('recorded_at', periodStart)
    .lt('recorded_at', periodEnd)

  const totals: Record<string, number> = {}
  records?.forEach(r => {
    totals[r.feature] = (totals[r.feature] || 0) + r.quantity
  })

  let tier = 'free'
  if (licenseId) {
    const { data: license } = await supabase
      .from('raas_licenses')
      .select('tier')
      .eq('id', licenseId)
      .single()
    tier = license?.tier || 'free'
  }

  const tierLimits: Record<string, Record<string, number>> = {
    free: { api_call: 100, tokens: 10_000, model_inference: 10, agent_execution: 5 },
    basic: { api_call: 1_000, tokens: 100_000, model_inference: 100, agent_execution: 50 },
    premium: { api_call: 10_000, tokens: 1_000_000, model_inference: 1_000, agent_execution: 500 },
    enterprise: { api_call: 100_000, tokens: 10_000_000, model_inference: 10_000, agent_execution: 5_000 },
    master: { api_call: -1, tokens: -1, model_inference: -1, agent_execution: -1 },
  }

  const limits = tierLimits[tier] || tierLimits.free

  const quotas = Object.entries(limits).map(([feature, limit]) => {
    const used = totals[feature] || 0
    const isUnlimited = limit === -1
    return {
      feature,
      used,
      limit,
      remaining: isUnlimited ? -1 : Math.max(0, limit - used),
      percentage: isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100)),
      reset_at: periodEnd,
    }
  })

  return new Response(JSON.stringify({ quotas }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// ──────────────────────────────────────────────────────────────────────────
// Helper: Breakdown (per user)
// ──────────────────────────────────────────────────────────────────────────

async function handleBreakdown(supabase: any, userId: string, period: 'day' | 'week' | 'month') {
  const now = new Date()
  const daysBack = period === 'day' ? 1 : period === 'week' ? 7 : 30
  const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000).toISOString()
  const endDate = now.toISOString()

  const { data: records } = await supabase
    .from('usage_records')
    .select('feature, quantity, metadata, recorded_at')
    .eq('user_id', userId)
    .gte('recorded_at', startDate)
    .lt('recorded_at', endDate)

  const featureMap = new Map()
  const modelMap = new Map()
  const agentMap = new Map()
  const dateMap = new Map()

  records?.forEach(r => {
    const f = featureMap.get(r.feature) || { feature: r.feature, total: 0, count: 0 }
    f.total += r.quantity
    f.count += 1
    featureMap.set(r.feature, f)

    const model = (r.metadata as any)?.model
    if (model && r.feature === 'model_inference') {
      const m = modelMap.get(model) || { model, total_inferences: 0, total_tokens: 0 }
      m.total_inferences += r.quantity
      m.total_tokens += (r.metadata as any)?.total_tokens || 0
      modelMap.set(model, m)
    }

    const agentType = (r.metadata as any)?.agent_type
    if (agentType && r.feature === 'agent_execution') {
      const a = agentMap.get(agentType) || { agent_type: agentType, executions: 0 }
      a.executions += r.quantity
      agentMap.set(agentType, a)
    }

    const date = r.recorded_at.split('T')[0]
    dateMap.set(date, (dateMap.get(date) || 0) + r.quantity)
  })

  const breakdown = {
    by_feature: Array.from(featureMap.values()).sort((a, b) => b.total - a.total),
    by_model: Array.from(modelMap.values()).sort((a, b) => b.total_inferences - a.total_inferences),
    by_agent: Array.from(agentMap.values()).sort((a, b) => b.executions - a.executions),
    trend: Array.from(dateMap.entries())
      .map(([date, usage]) => ({ date, usage }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  }

  return new Response(JSON.stringify(breakdown), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
