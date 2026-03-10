/**
 * AgencyOS Usage Sync - Helper Functions
 *
 * Database operations and utility functions for usage sync.
 */

import { supabase } from '@/lib/supabase'
import { analyticsLogger } from '@/utils/logger'
import type { GatewayUsageMetric, GatewayUsageResponse } from './agencyos-usage-sync-types'

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
 */
export async function getUsageFromKV(
  orgId: string,
  period?: string
): Promise<GatewayUsageResponse | null> {
  try {
    const gatewayUrl = getGatewayUrl()
    const apiKey = getGatewayApiKey()

    if (!apiKey) {
      analyticsLogger.error('[AgencyOSSync] RAAS_GATEWAY_API_KEY not configured')
      return null
    }

    const periodParam = period || new Date().toISOString().slice(0, 7)
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
      analyticsLogger.error('[AgencyOSSync] Gateway API error:', errorData)
      return null
    }

    const data = await response.json()
    return data as GatewayUsageResponse
  } catch (_err) {
    return null
  }
}

/**
 * Upsert usage metrics to Supabase
 */
export async function upsertUsageMetrics(
  orgId: string,
  metrics: GatewayUsageMetric[]
): Promise<number> {
  if (metrics.length === 0) return 0

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id

  if (!userId) {
    analyticsLogger.error('[AgencyOSSync] No authenticated user found')
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
        analyticsLogger.error('[AgencyOSSync] Error upserting metric:', error)
      } else {
        syncedCount++
      }
    } catch (_err) {
      // Continue to next metric
    }
  }

  return syncedCount
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
      analyticsLogger.error('[AgencyOSSync] Error logging sync:', error)
      return null
    }

    return data.id
  } catch (_err) {
    return null
  }
}

/**
 * Get pending sync requests from queue
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
      analyticsLogger.error('[AgencyOSSync] Error getting pending syncs:', error)
      return []
    }

    return data || []
  } catch (_err) {
    return []
  }
}
