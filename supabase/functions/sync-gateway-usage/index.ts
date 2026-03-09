/**
 * Edge Function: Sync Gateway Usage
 *
 * Syncs usage data from local Supabase to RaaS Gateway (raas.agencyos.network).
 * Called by cron job every 5 minutes or triggered manually after usage update.
 *
 * **Endpoint:**
 *   POST /functions/v1/sync-gateway-usage
 *
 * **Request:**
 *   {
 *     "org_id": "uuid",
 *     "metric_type": "api_calls" | "tokens" | "compute_minutes" | ...,
 *     "period": "YYYY-MM",
 *     "force_sync": false  // Optional: bypass cooldown
 *   }
 *
 * **Response:**
 *   {
 *     "success": true,
 *     "synced": 5,
 *     "failed": 0,
 *     "errors": []
 *   }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const GATEWAY_URL = Deno.env.get('RAAS_GATEWAY_URL') || 'https://raas.agencyos.network'
const GATEWAY_API_KEY = Deno.env.get('RAAS_GATEWAY_API_KEY')
const JWT_SECRET = Deno.env.get('RAAS_JWT_SECRET')
const ISSUER = 'wellnexus.vn'
const AUDIENCE = 'raas.agencyos.network'

interface SyncRequest {
  org_id: string
  metric_type?: string
  period?: string
  force_sync?: boolean
}

interface SyncResponse {
  success: boolean
  synced: number
  failed: number
  errors?: string[]
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Parse request
    const payload: SyncRequest = await req.json()
    const { org_id, metric_type, period, force_sync = false } = payload

    // Validate org_id
    if (!org_id) {
      return new Response(JSON.stringify({
        error: 'org_id is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('[sync-gateway-usage] Starting sync', {
      org_id,
      metric_type,
      period,
      force_sync,
    })

    // Check if sync is needed (skip if recently synced)
    if (!force_sync) {
      const { data: lastSync } = await supabase
        .from('raas_usage_snapshots')
        .select('last_synced_at')
        .eq('org_id', org_id)
        .order('last_synced_at', { ascending: false })
        .limit(1)
        .single()

      const lastSyncedAt = lastSync?.last_synced_at
      if (lastSyncedAt) {
        const timeSinceSync = Date.now() - new Date(lastSyncedAt).getTime()
        if (timeSinceSync < 300000) { // 5 minutes
          console.log('[sync-gateway-usage] Recently synced, skipping', {
            lastSyncedAt,
            timeSinceSync,
          })
          return new Response(JSON.stringify({
            success: true,
            synced: 0,
            failed: 0,
            message: 'Recently synced, skipping',
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }
    }

    // Fetch usage data to sync
    let query = supabase
      .from('raas_usage_snapshots')
      .select('*')
      .eq('org_id', org_id)
      .order('snapshot_date', { ascending: false })
      .limit(100)

    if (metric_type) {
      query = query.eq('metric_type', metric_type)
    }

    if (period) {
      const [year, month] = period.split('-')
      const startDate = `${year}-${month}-01`
      const endDate = `${year}-${month}-31`
      query = query.gte('snapshot_date', startDate).lte('snapshot_date', endDate)
    }

    const { data: usageRecords, error: fetchError } = await query

    if (fetchError) {
      throw new Error(`Failed to fetch usage records: ${fetchError.message}`)
    }

    if (!usageRecords || usageRecords.length === 0) {
      console.log('[sync-gateway-usage] No records to sync')
      return new Response(JSON.stringify({
        success: true,
        synced: 0,
        failed: 0,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate JWT token
    const jwtToken = await generateJWT(org_id, GATEWAY_API_KEY)

    // Sync each record
    const result: SyncResponse = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
    }

    for (const record of usageRecords) {
      const syncSuccess = await syncRecordToGateway(
        supabase,
        record,
        jwtToken,
        GATEWAY_URL,
        GATEWAY_API_KEY
      )

      if (syncSuccess) {
        result.synced++
        // Update last_synced_at
        await supabase
          .from('raas_usage_snapshots')
          .update({
            last_synced_at: new Date().toISOString(),
            sync_status: 'synced',
          })
          .eq('id', record.id)
      } else {
        result.failed++
        // Queue for retry
        await queueForRetry(supabase, record)
      }
    }

    console.log('[sync-gateway-usage] Sync complete', result)

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[sync-gateway-usage] Error:', error)
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

/**
 * Sync a single record to Gateway
 */
async function syncRecordToGateway(
  supabase: any,
  record: any,
  jwtToken: string,
  gatewayUrl: string,
  apiKey?: string
): Promise<boolean> {
  try {
    const idempotencyKey = `sync_${record.org_id}_${record.metric_type}_${record.snapshot_date}_${Date.now()}`

    const payload = {
      org_id: record.org_id,
      metric_type: record.metric_type,
      period: record.snapshot_date?.slice(0, 7) || new Date().toISOString().slice(0, 7),
      current_usage: record.metric_value || 0,
      quota_limit: record.quota_limit || 0,
      overage_units: Math.max(0, (record.metric_value || 0) - (record.quota_limit || 0)),
      overage_cost: calculateOverageCost(
        Math.max(0, (record.metric_value || 0) - (record.quota_limit || 0)),
        record.metric_type
      ),
      idempotency_key: idempotencyKey,
      timestamp: new Date().toISOString(),
    }

    const response = await fetch(`${gatewayUrl}/api/v1/usage/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
        'X-API-Key': apiKey || '',
        'X-Idempotency-Key': payload.idempotency_key,
        'X-Request-Source': 'wellnexus.vn',
      },
      body: JSON.stringify(payload),
    })

    if (response.ok) {
      console.log('[sync-gateway-usage] Record synced:', record.org_id, record.metric_type)
      return true
    }

    // Idempotency conflict = already synced
    if (response.status === 409) {
      console.log('[sync-gateway-usage] Duplicate detected (idempotency)')
      return true
    }

    const errorData = await response.json().catch(() => ({}))
    console.error('[sync-gateway-usage] Gateway error:', errorData)
    return false

  } catch (error) {
    console.error('[sync-gateway-usage] syncRecordToGateway error:', error)
    return false
  }
}

/**
 * Queue failed sync for retry
 */
async function queueForRetry(supabase: any, record: any): Promise<void> {
  try {
    await supabase
      .from('gateway_sync_queue')
      .insert({
        org_id: record.org_id,
        metric_type: record.metric_type,
        period: record.snapshot_date?.slice(0, 7),
        current_usage: record.metric_value || 0,
        quota_limit: record.quota_limit || 0,
        overage_units: Math.max(0, (record.metric_value || 0) - (record.quota_limit || 0)),
        overage_cost: calculateOverageCost(
          Math.max(0, (record.metric_value || 0) - (record.quota_limit || 0)),
          record.metric_type
        ),
        status: 'pending',
        retry_count: 0,
        next_retry_at: new Date(Date.now() + 60000).toISOString(),
      })
  } catch (error) {
    console.error('[sync-gateway-usage] queueForRetry error:', error)
  }
}

/**
 * Calculate overage cost
 */
function calculateOverageCost(units: number, metricType: string): number {
  const rates: Record<string, number> = {
    api_calls: 0.001,
    ai_calls: 0.05,
    tokens: 0.000004,
    compute_minutes: 0.01,
    storage_gb: 0.5,
    emails: 0.002,
    model_inferences: 0.02,
    agent_executions: 0.1,
  }

  const rate = rates[metricType] || 0.01
  return Math.round(units * rate * 100) // Convert to cents
}

/**
 * Generate JWT token for Gateway auth
 */
async function generateJWT(orgId: string, apiKey?: string): Promise<string> {
  const secret = JWT_SECRET || 'default-secret-change-me'
  const encoder = new TextEncoder()

  const header = {
    alg: 'HS256',
    typ: 'JWT',
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: ISSUER,
    aud: AUDIENCE,
    sub: orgId,
    mk_key: apiKey?.slice(0, 8) || '',
    iat: now,
    exp: now + 3600, // 1 hour
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))

  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(`${encodedHeader}.${encodedPayload}`)

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, messageData)
  const encodedSignature = base64UrlEncode(signature)

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`
}

/**
 * Base64URL encode
 */
function base64UrlEncode(data: string | ArrayBuffer): string {
  const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
