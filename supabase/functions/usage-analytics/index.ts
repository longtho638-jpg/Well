/* eslint-disable max-lines */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { corsHeaders } from '../_shared/cors.ts'

/**
 * Usage Analytics Edge Function
 *
 * Real-time usage analytics for dashboard.
 * Requires authentication via Bearer token.
 *
 * Query Params:
 *   - org_id: string (required)
 *   - period: 'day' | 'week' | 'month' (default: 'day')
 *   - feature?: string (filter by feature)
 *
 * Response:
 *   {
 *     summary: { total_usage, total_events, unique_users },
 *     by_feature: [{ feature, total, count }],
 *     by_hour: [{ hour, usage }],
 *     top_users: [{ user_id, total_usage }],
 *     trend: [{ date, usage }]
 *   }
 */

interface AnalyticsQueryParams {
  org_id: string
  period?: 'day' | 'week' | 'month'
  feature?: string
  start_date?: string
  end_date?: string
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

  const warnings: string[] = []
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
