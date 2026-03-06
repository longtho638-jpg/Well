/**
 * Check Quota Edge Function - Real-time quota enforcement
 *
 * Usage:
 *   POST /functions/v1/check-quota
 *   Body: { user_id, license_id, feature, requested_quantity? }
 *
 * Returns 200 if allowed, 429 if quota exceeded
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface QuotaCheckRequest {
  user_id: string
  license_id?: string
  feature: string
  requested_quantity?: number
}

interface QuotaCheckResponse {
  allowed: boolean
  current_usage: number
  limit: number
  remaining: number
  percentage: number
  warnings: string[]
  reset_at: string
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const payload: QuotaCheckRequest = await req.json()
    const { user_id, license_id, feature, requested_quantity = 1 } = payload

    if (!user_id || !feature) {
      return new Response(JSON.stringify({ error: 'Missing user_id or feature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Get current usage for today (UTC midnight)
    const now = new Date()
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const periodStart = today.toISOString()
    const periodEnd = new Date(today.getTime() + 86400000).toISOString() // +24 hours

    const { data: usage, error: usageError } = await supabase
      .from('usage_records')
      .select('feature, quantity')
      .eq('user_id', user_id)
      .eq('license_id', license_id || null)
      .gte('recorded_at', periodStart)
      .lt('recorded_at', periodEnd)

    if (usageError) {
      console.error('[CheckQuota] Failed to fetch usage:', usageError)
      throw usageError
    }

    const currentUsage = usage
      ?.filter(u => u.feature === feature)
      .reduce((sum, u) => sum + u.quantity, 0) ?? 0

    // Get limit from license tier
    let limit = -1
    let tier = 'free'

    if (license_id) {
      const { data: license } = await supabase
        .from('raas_licenses')
        .select('tier, metadata')
        .eq('id', license_id)
        .single()

      tier = license?.tier || 'free'
    }

    // Tier limits with AI metrics
    const tierLimits: Record<string, Record<string, number>> = {
      free: { api_call: 100, tokens: 10_000, model_inference: 10, agent_execution: 5, compute_ms: 600_000 },
      basic: { api_call: 1_000, tokens: 100_000, model_inference: 100, agent_execution: 50, compute_ms: 3_600_000 },
      premium: { api_call: 10_000, tokens: 1_000_000, model_inference: 1_000, agent_execution: 500, compute_ms: 18_000_000 },
      enterprise: { api_call: 100_000, tokens: 10_000_000, model_inference: 10_000, agent_execution: 5_000, compute_ms: 86_400_000 },
      master: { api_call: -1, tokens: -1, model_inference: -1, agent_execution: -1, compute_ms: -1 },
    }

    limit = tierLimits[tier]?.[feature] ?? 100

    // Check quota
    const isUnlimited = limit === -1
    const willExceed = !isUnlimited && (currentUsage + requested_quantity) > limit
    const remaining = isUnlimited ? Infinity : Math.max(0, limit - currentUsage)
    const percentage = isUnlimited ? 0 : Math.round((currentUsage / limit) * 100)

    // Generate warnings at 80%, 90%
    const warnings: string[] = []
    if (percentage >= 90) warnings.push(`CRITICAL: ${feature} quota at 90%`)
    else if (percentage >= 80) warnings.push(`WARNING: ${feature} quota at 80%`)

    const response: QuotaCheckResponse = {
      allowed: !willExceed,
      current_usage: currentUsage,
      limit,
      remaining: remaining === Infinity ? -1 : remaining,
      percentage,
      warnings,
      reset_at: periodEnd,
    }

    return new Response(JSON.stringify(response), {
      status: willExceed ? 429 : 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[CheckQuota] Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
