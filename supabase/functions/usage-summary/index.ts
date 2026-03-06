import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createHmac } from 'node:crypto'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { corsHeaders } from '../_shared/cors.ts'

interface UsagePullRequest {
  org_id: string
  license_id: string
  period_start: string
  period_end: string
}

interface UsageSummary {
  org_id: string
  license_id: string
  period_start: string
  period_end: string
  metrics: {
    api_calls: number
    tokens: number
    compute_ms: number
    storage_mb: number
    bandwidth_mb: number
  }
  tier: string
  overage: {
    api_calls: number
    tokens: number
    compute_minutes: number
  }
  calculated_cost: number
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify HMAC signature for service-to-service auth
    const signature = req.headers.get('x-signature')
    const timestamp = req.headers.get('x-timestamp')

    // Check timestamp freshness (5 minutes window)
    if (timestamp) {
      const now = Date.now()
      const reqTime = new Date(timestamp).getTime()
      if (Math.abs(now - reqTime) > 5 * 60 * 1000) {
        return new Response(
          JSON.stringify({ error: 'Request timestamp expired' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    const body = await req.text()
    const webhookSecret = Deno.env.get('USAGE_WEBHOOK_SECRET')

    if (!webhookSecret) {
      console.error('[USAGE-API] Missing USAGE_WEBHOOK_SECRET')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const expectedSignature = createHmac('sha256', webhookSecret)
      .update(body)
      .update(timestamp || '')
      .digest('hex')

    if (!signature || signature !== expectedSignature) {
      console.warn('[USAGE-API] Invalid signature attempt')
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid signature' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse and validate request
    const payload: UsagePullRequest = JSON.parse(body)
    const { org_id, license_id, period_start, period_end } = payload

    if (!org_id || !license_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: org_id, license_id' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Query usage records for the period
    const { data: records, error: recordsError } = await supabase
      .from('usage_records')
      .select('feature, quantity, metadata')
      .eq('org_id', org_id)
      .gte('recorded_at', period_start)
      .lt('recorded_at', period_end)

    if (recordsError) {
      console.error('[USAGE-API] Failed to fetch records:', recordsError)
      throw recordsError
    }

    // Aggregate metrics
    const metrics = {
      api_calls: records?.filter(r => r.feature === 'api_call').reduce((sum, r) => sum + (r.quantity || 0), 0) || 0,
      tokens: records?.filter(r => r.feature === 'tokens').reduce((sum, r) => sum + (r.quantity || 0), 0) || 0,
      compute_ms: records?.filter(r => r.feature === 'compute_ms').reduce((sum, r) => sum + (r.quantity || 0), 0) || 0,
      storage_mb: records?.filter(r => r.feature === 'storage_mb').reduce((sum, r) => sum + (r.quantity || 0), 0) || 0,
      bandwidth_mb: records?.filter(r => r.feature === 'bandwidth_mb').reduce((sum, r) => sum + (r.quantity || 0), 0) || 0,
    }

    // Get license tier and limits
    const { data: license } = await supabase
      .from('raas_licenses')
      .select('tier, status')
      .eq('id', license_id)
      .single()

    if (!license) {
      return new Response(
        JSON.stringify({ error: 'License not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (license.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'License is not active' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get usage limits for this license
    _ = await supabase
      .from('usage_limits')
      .select('metric_type, limit_value, limit_period')
      .eq('license_id', license_id)

    const tierLimits: Record<string, number> = {
      api_calls_per_day: license.tier === 'free' ? 100 :
                         license.tier === 'basic' ? 1000 :
                         license.tier === 'premium' ? 10000 :
                         license.tier === 'enterprise' ? 100000 : -1,
      tokens_per_day: license.tier === 'free' ? 10000 :
                      license.tier === 'basic' ? 100000 :
                      license.tier === 'premium' ? 1000000 :
                      license.tier === 'enterprise' ? 10000000 : -1,
      compute_minutes_per_day: license.tier === 'free' ? 10 :
                               license.tier === 'basic' ? 60 :
                               license.tier === 'premium' ? 300 :
                               license.tier === 'enterprise' ? 1440 : -1,
    }

    // Calculate overage
    const overage = {
      api_calls: tierLimits.api_calls_per_day > 0 ? Math.max(0, metrics.api_calls - tierLimits.api_calls_per_day) : 0,
      tokens: tierLimits.tokens_per_day > 0 ? Math.max(0, metrics.tokens - tierLimits.tokens_per_day) : 0,
      compute_minutes: tierLimits.compute_minutes_per_day > 0 ? Math.max(0, Math.floor(metrics.compute_ms / 60000) - tierLimits.compute_minutes_per_day) : 0,
    }

    // Calculate cost (example: $0.0001 per API call, $0.001 per 1K tokens, $0.01 per compute minute)
    const calculatedCost =
      (overage.api_calls * 0.0001) +
      (overage.tokens * 0.000001) +
      (overage.compute_minutes * 0.01)

    const summary: UsageSummary = {
      org_id,
      license_id,
      period_start,
      period_end,
      metrics,
      tier: license.tier,
      overage,
      calculated_cost: Math.round(calculatedCost * 100) / 100, // Round to 2 decimals
    }

    return new Response(
      JSON.stringify(summary),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('[USAGE-API] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
