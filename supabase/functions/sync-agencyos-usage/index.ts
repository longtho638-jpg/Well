/**
 * Sync AgencyOS Usage - Supabase Edge Function
 *
 * Syncs usage data from RaaS Gateway (Cloudflare KV) to Supabase usage_metrics table.
 * Can be triggered manually or via cron schedule.
 *
 * Request: { org_id: string, period: string, api_key?: string }
 * Response: { success: boolean, syncedCount: number, metrics: string[] }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AgencyOSSyncRequest {
  org_id: string
  period?: string
  api_key?: string
}

interface AgencyOSSyncResult {
  success: boolean
  syncedCount: number
  metrics: string[]
  error?: string
}

interface GatewayUsageMetric {
  metric_type: string
  metric_value: number
  period_start: string
  period_end: string
  timestamp: string
  metadata?: Record<string, unknown>
}

interface GatewayUsageResponse {
  success: boolean
  org_id: string
  period: string
  metrics: GatewayUsageMetric[]
  error?: string
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const raasGatewayUrl = Deno.env.get('RAAS_GATEWAY_URL') ?? 'https://raas.agencyos.network'
    const raasGatewayApiKey = Deno.env.get('RAAS_GATEWAY_API_KEY') ?? ''

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase credentials not configured')
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Parse request body
    const body: AgencyOSSyncRequest = await req.json()
    const { org_id, period, api_key } = body

    if (!org_id) {
      throw new Error('org_id is required')
    }

    console.log(`[SyncAgencyOSUsage] Starting sync for org: ${org_id}, period: ${period || 'current'}`)

    // Determine API key to use
    const apiKey = api_key || raasGatewayApiKey
    if (!apiKey) {
      throw new Error('RAAS_GATEWAY_API_KEY not configured and no api_key provided')
    }

    // Step 1: Fetch usage from RaaS Gateway
    const periodParam = period || new Date().toISOString().slice(0, 7) // YYYY-MM
    const gatewayEndpoint = `${raasGatewayUrl}/api/v1/usage/${org_id}?period=${periodParam}`

    console.log(`[SyncAgencyOSUsage] Fetching from gateway: ${gatewayEndpoint}`)

    const gatewayResponse = await fetch(gatewayEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!gatewayResponse.ok) {
      const errorData = await gatewayResponse.json().catch(() => ({}))
      console.error('[SyncAgencyOSUsage] Gateway API error:', errorData)
      throw new Error(errorData.error?.message || `Gateway API error: ${gatewayResponse.status}`)
    }

    const gatewayData: GatewayUsageResponse = await gatewayResponse.json()

    if (!gatewayData.success) {
      throw new Error(gatewayData.error || 'Gateway returned success: false')
    }

    const metrics = gatewayData.metrics
    console.log(`[SyncAgencyOSUsage] Fetched ${metrics.length} metrics from gateway`)

    if (metrics.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        syncedCount: 0,
        metrics: [],
        message: 'No metrics to sync',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Step 2: Get or create user for this org
    // We need a user_id to insert usage_metrics
    const { data: orgUser } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('org_id', org_id)
      .eq('role', 'owner')
      .limit(1)
      .single()

    let userId = orgUser?.user_id

    // If no owner found, get any member
    if (!userId) {
      const { data: anyMember } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('org_id', org_id)
        .limit(1)
        .single()

      userId = anyMember?.user_id
    }

    // If still no user, create a placeholder sync log and return
    if (!userId) {
      console.warn(`[SyncAgencyOSUsage] No user found for org ${org_id}, skipping sync`)

      // Log the attempt
      await supabase
        .from('agencyos_sync_log')
        .insert({
          org_id,
          period: periodParam,
          sync_status: 'failed',
          error_message: 'No user found for organization',
          synced_count: 0,
        })

      return new Response(JSON.stringify({
        success: false,
        syncedCount: 0,
        metrics: [],
        error: 'No user found for organization',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Step 3: Upsert each metric to usage_metrics table
    let syncedCount = 0
    const syncedMetrics: string[] = []

    for (const metric of metrics) {
      try {
        const { error } = await supabase
          .from('usage_metrics')
          .upsert({
            user_id: userId,
            org_id,
            metric_type: metric.metric_type,
            metric_value: metric.metric_value,
            period_start: metric.period_start,
            period_end: metric.period_end,
          }, {
            onConflict: 'user_id,metric_type,period_start,period_end',
          })

        if (error) {
          console.error('[SyncAgencyOSUsage] Error upserting metric:', error)
        } else {
          syncedCount++
          syncedMetrics.push(metric.metric_type)
        }
      } catch (err) {
        console.error('[SyncAgencyOSUsage] Error:', err)
      }
    }

    // Step 4: Log successful sync
    await supabase
      .from('agencyos_sync_log')
      .insert({
        org_id,
        period: periodParam,
        sync_status: 'success',
        synced_count: syncedCount,
        metrics_synced: syncedMetrics,
      })

    console.log(`[SyncAgencyOSUsage] Completed: ${syncedCount} metrics synced`)

    return new Response(JSON.stringify({
      success: true,
      syncedCount,
      metrics: syncedMetrics,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[SyncAgencyOSUsage] Error:', error)

    // Log failed sync attempt
    try {
      const body = await req.json().catch(() => ({}))
      await supabase
        .from('agencyos_sync_log')
        .insert({
          org_id: body.org_id || 'unknown',
          period: body.period || new Date().toISOString().slice(0, 7),
          sync_status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          synced_count: 0,
        })
    } catch (logError) {
      console.error('[SyncAgencyOSUsage] Failed to log error:', logError)
    }

    return new Response(JSON.stringify({
      success: false,
      syncedCount: 0,
      metrics: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
