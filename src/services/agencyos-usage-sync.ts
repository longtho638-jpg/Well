/**
 * AgencyOS Usage Sync Service - Phase 8
 *
 * Syncs usage data from RaaS Gateway (Cloudflare KV) to Supabase usage_metrics table.
 * Provides methods to fetch usage from AgencyOS API and persist to local database.
 */

import { supabase } from '@/lib/supabase'
import { analyticsLogger } from '@/utils/logger'
import type {
  AgencyOSSyncRequest,
  AgencyOSSyncResult,
} from './agencyos-usage-sync-types'
import {
  getUsageFromKV,
  upsertUsageMetrics,
  getPendingSyncRequests,
  logSyncAttempt,
} from './agencyos-usage-sync-helpers'

/**
 * Sync usage from RaaS Gateway to Supabase
 */
export async function syncUsageFromGateway(orgId: string): Promise<AgencyOSSyncResult> {
  try {
    const gatewayResponse = await getUsageFromKV(orgId)

    if (!gatewayResponse || !gatewayResponse.success) {
      return {
        success: false,
        syncedCount: 0,
        metrics: [],
        error: gatewayResponse?.error || 'Failed to fetch from gateway',
      }
    }

    const syncedCount = await upsertUsageMetrics(orgId, gatewayResponse.metrics)
    const metricTypes = gatewayResponse.metrics.map(m => m.metric_type)

    return {
      success: true,
      syncedCount,
      metrics: metricTypes,
    }
  } catch (error) {
    analyticsLogger.error('[AgencyOSSync] Error syncing from gateway', error)
    return {
      success: false,
      syncedCount: 0,
      metrics: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Sync AgencyOS usage data (main orchestration function)
 */
export async function syncAgencyOSUsage(
  orgId: string,
  period?: string
): Promise<AgencyOSSyncResult> {
  try {
    const { data, error } = await supabase.functions.invoke('sync-agencyos-usage', {
      body: {
        org_id: orgId,
        period: period || new Date().toISOString().slice(0, 7),
      } as AgencyOSSyncRequest,
    })

    if (error) {
      analyticsLogger.error('[AgencyOSSync] Edge Function error:', error)
      return {
        success: false,
        syncedCount: 0,
        metrics: [],
        error: error.message,
      }
    }

    return data as AgencyOSSyncResult
  } catch (error) {
    analyticsLogger.error('[AgencyOSSync] Error', error)
    return {
      success: false,
      syncedCount: 0,
      metrics: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
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
