import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createHmac } from 'node:crypto'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { corsHeaders } from '../_shared/cors.ts'

/**
 * Usage Tracking Edge Function
 *
 * Secure endpoint for tracking usage events from client applications.
 * Requires HMAC signature for authentication.
 *
 * Usage:
 *   POST /functions/v1/usage-track
 *   Headers:
 *     - x-signature: HMAC-SHA256 signature
 *     - x-timestamp: ISO timestamp
 *   Body:
 *     {
 *       "org_id": "org_123",
 *       "user_id": "user_456",
 *       "license_id": "lic_789",
 *       "feature": "api_call",
 *       "quantity": 1,
 *       "metadata": { "endpoint": "/api/products" }
 *     }
 */

interface UsageTrackRequest {
  org_id: string
  user_id: string
  license_id?: string
  feature: string
  quantity: number
  metadata?: Record<string, unknown>
  recorded_at?: string
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
      console.error('[USAGE-TRACK] Missing USAGE_WEBHOOK_SECRET')
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
      console.warn('[USAGE-TRACK] Invalid signature attempt')
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid signature' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse and validate request
    const payload: UsageTrackRequest = JSON.parse(body)
    const { org_id, user_id, license_id, feature, quantity, metadata, recorded_at } = payload

    if (!org_id || !user_id || !feature) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: org_id, user_id, feature' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client with service role (admin privileges)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Insert usage record
    const { data: record, error: insertError } = await supabase
      .from('usage_records')
      .insert({
        org_id,
        user_id,
        license_id,
        feature,
        quantity,
        metadata: metadata || {},
        recorded_at: recorded_at || new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('[USAGE-TRACK] Failed to insert record:', insertError)
      throw insertError
    }

    // Check rate limit after tracking
    const { data: limits } = await supabase
      .from('usage_limits')
      .select('limit_value, limit_period')
      .eq('license_id', license_id)
      .eq('metric_type', feature)
      .maybeSingle()

    const isLimited = limits && limits.limit_value > 0 && quantity > limits.limit_value

    return new Response(
      JSON.stringify({
        success: true,
        record,
        is_limited: isLimited,
        limit: limits?.limit_value,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('[USAGE-TRACK] Error:', error)
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
