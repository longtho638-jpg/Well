/**
 * AgencyOS Usage Sync Service - Phase 8
 *
 * Syncs usage data from RaaS Gateway (Cloudflare KV) to Supabase usage_metrics table.
 * Provides methods to fetch usage from AgencyOS API and persist to local database.
 */

import { supabase } from '@/lib/supabase'

/**
 * Usage metric from RaaS Gateway
 */
export interface GatewayUsageMetric {
  metric_type: string
  metric_value: number
  period_start: string
  period_end: string
  timestamp: string
  metadata?: Record<string, unknown>
}

/**
 * Response from RaaS Gateway API
 */
export interface GatewayUsageResponse {
  success: boolean
  org_id: string
  period: string
  metrics: GatewayUsageMetric[]
  error?: string
}

/**
 * Sync request to Edge Function
 */
export interface AgencyOSSyncRequest {
  org_id: string
  period?: string
  api_key?: string
}

/**
 * Sync result from Edge Function
 */
export interface AgencyOSSyncResult {
  success: boolean
  syncedCount: number
  metrics: string[]
  error?: string
}

/**
 * Get RaaS Gateway URL from environment
 */
function getGatewayUrl(): string {
  return (import.meta.env.VITE_RAAS_GATEWAY_URL as string) || 'https://raas.agencyos.network'
}

/**
 * Get RaaS Gateway API Key from environment
 */
function getGatewayApiKey(): string {
  return (import.meta.env.VITE_RAAS_GATEWAY_API_KEY as string) || ''
}

/**
 * Fetch usage data from RaaS Gateway API
 *
 * @param orgId - Organization ID to fetch usage for
 * @param period - Optional period in YYYY-MM format (defaults to current month)
 * @returns Usage metrics from gateway
 */
export async function getUsageFromKV(
  orgId: string,
  period?: string
): Promise<GatewayUsageResponse | null> {
  try {
    const gatewayUrl = getGatewayUrl()
    const apiKey = getGatewayApiKey()

    if (!apiKey) {
      console.error('[AgencyOSSync] RAAS_GATEWAY_API_KEY not configured')
      return null
    }

    const periodParam = period || new Date().toISOString().slice(0, 7) // YYYY-MM
    const endpoint = `${gatewayUrl}/api/v1/usage/${orgId}?period=${periodParam}`

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[AgencyOSSync] Gateway API error:', errorData)
      return null
    }

    const data = await response.json()
    return data as GatewayUsageResponse
  } catch (err) {
    console.error('[AgencyOSSync] Error fetching from gateway:', err)
    return null
  }
}

/**
 * Upsert usage metrics to Supabase usage_metrics table
 *
 * @param orgId - Organization ID
 * @param metrics - Array of usage metrics to upsert
 * @returns Number of records synced
 */
export async function upsertUsageMetrics(
  orgId: string,
  metrics: GatewayUsageMetric[]
): Promise<number> {
  if (metrics.length === 0) return 0

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id

  if (!userId) {
    console.error('[AgencyOSSync] No authenticated user found')
    return 0
  }

  let syncedCount = 0

  for (const metric of metrics) {
    try {
      const { error } = await supabase
        .from('usage_metrics')
        .upsert({
          user_id: userId,
          org_id: orgId,
          metric_type: metric.metric_type,
          metric_value: metric.metric_value,
          period_start: metric.period_start,
          period_end: metric.period_end,
        }, {
          onConflict: 'user_id,metric_type,period_start,period_end',
        })

      if (error) {
        console.error('[AgencyOSSync] Error upserting metric:', error)
      } else {
        syncedCount++
      }
    } catch (err) {
      console.error('[AgencyOSSync] Error:', err)
    }
  }

  return syncedCount
}

/**
 * Sync usage from RaaS Gateway to Supabase
 *
 * @param orgId - Organization ID to sync usage for
 * @returns Sync result with count and metrics
 */
export async function syncUsageFromGateway(orgId: string): Promise<AgencyOSSyncResult> {
  try {
    // Fetch usage from gateway
    const gatewayResponse = await getUsageFromKV(orgId)

    if (!gatewayResponse || !gatewayResponse.success) {
      return {
        success: false,
        syncedCount: 0,
        metrics: [],
        error: gatewayResponse?.error || 'Failed to fetch from gateway',
      }
    }

    // Upsert to Supabase
    const syncedCount = await upsertUsageMetrics(orgId, gatewayResponse.metrics)

    const metricTypes = gatewayResponse.metrics.map(m => m.metric_type)

    return {
      success: true,
      syncedCount,
      metrics: metricTypes,
    }
  } catch (err) {
    console.error('[AgencyOSSync] Error syncing from gateway:', err)
    return {
      success: false,
      syncedCount: 0,
      metrics: [],
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Sync AgencyOS usage data (main orchestration function)
 *
 * This is the primary method called from components to trigger usage sync.
 * It coordinates fetching from RaaS Gateway and persisting to Supabase.
 *
 * @param orgId - Organization ID
 * @param period - Optional period in YYYY-MM format
 * @returns Sync result
 */
export async function syncAgencyOSUsage(
  orgId: string,
  period?: string
): Promise<AgencyOSSyncResult> {
  try {
    // Option 1: Direct gateway sync (client-side)
    // return await syncUsageFromGateway(orgId)

    // Option 2: Edge Function sync (preferred for server-side operations)
    const { data, error } = await supabase.functions.invoke('sync-agencyos-usage', {
      body: {
        org_id: orgId,
        period: period || new Date().toISOString().slice(0, 7),
      } as AgencyOSSyncRequest,
    })

    if (error) {
      console.error('[AgencyOSSync] Edge Function error:', error)
      return {
        success: false,
        syncedCount: 0,
        metrics: [],
        error: error.message,
      }
    }

    return data as AgencyOSSyncResult
  } catch (err) {
    console.error('[AgencyOSSync] Error:', err)
    return {
      success: false,
      syncedCount: 0,
      metrics: [],
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Get pending sync requests from sync queue
 */
export async function getPendingSyncRequests(
  orgId?: string
): Promise<Array<{
  id: string
  org_id: string
  period: string
  status: 'pending' | 'syncing' | 'completed' | 'failed'
  created_at: string
}>> {
  try {
    let query = supabase
      .from('agencyos_sync_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50)

    if (orgId) {
      query = query.eq('org_id', orgId)
    }

    const { data, error } = await query

    if (error) {
      console.error('[AgencyOSSync] Error getting pending syncs:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('[AgencyOSSync] Error:', err)
    return []
  }
}

/**
 * Log sync attempt to audit table
 */
export async function logSyncAttempt(
  orgId: string,
  period: string,
  status: 'pending' | 'success' | 'failed',
  options?: {
    syncedCount?: number
    errorMessage?: string
    metrics?: string[]
  }
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('agencyos_sync_log')
      .insert({
        org_id: orgId,
        period,
        sync_status: status,
        synced_count: options?.syncedCount || 0,
        error_message: options?.errorMessage || null,
        metrics_synced: options?.metrics || null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[AgencyOSSync] Error logging sync:', error)
      return null
    }

    return data.id
  } catch (err) {
    console.error('[AgencyOSSync] Error:', err)
    return null
  }
}

/**
 * AgencyOS Usage Sync Service
 */
export const agencyOSUsageSync = {
  getUsageFromKV,
  upsertUsageMetrics,
  syncUsageFromGateway,
  syncAgencyOSUsage,
  getPendingSyncRequests,
  logSyncAttempt,
}
