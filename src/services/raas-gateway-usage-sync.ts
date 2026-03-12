/**
 * RaaS Gateway Usage Sync Service - Phase 7
 *
 * Fetches usage records FROM RaaS Gateway and syncs to local database.
 * Bi-directional sync: also pushes local usage to Gateway for consistent billing.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { analyticsLogger } from '@/utils/logger'
import { GatewayAuthClient } from '@/lib/gateway-auth-client'
import type { SyncConfig, SyncResult } from './raas-gateway-usage-sync-types'
import {
  validateAndTransformRecords,
  storeLocalEvents,
  fetchGatewayUsage,
  retryWithBackoff,
} from './raas-gateway-usage-helpers'

export class RaaSGatewayUsageSync {
  private supabase: SupabaseClient
  private config: SyncConfig
  private authClient: GatewayAuthClient
  private syncIntervalMs: number
  private syncTimers: Map<string, NodeJS.Timeout>
  private rateLimitDelay: number

  constructor(supabase: SupabaseClient, config: SyncConfig) {
    this.supabase = supabase
    this.config = config
    this.syncIntervalMs = config.syncIntervalMs || 300000
    this.syncTimers = new Map()
    this.rateLimitDelay = 1000

    this.authClient = new GatewayAuthClient({
      issuer: config.issuer,
      audience: config.audience,
      apiKey: config.apiKey,
      tokenExpirySeconds: 3600,
      refreshBufferMs: 300000,
    })

    analyticsLogger.info('[RaaSGatewayUsageSync] Initialized', {
      gatewayUrl: config.gatewayUrl,
      syncIntervalMs: this.syncIntervalMs,
      rateLimitDelay: this.rateLimitDelay,
    })
  }

  async fetchFromGateway(params: {
    orgId: string
    metricType?: string
    period?: string
  }): Promise<SyncResult> {
    const { orgId, metricType, period } = params

    try {
      analyticsLogger.info('[RaaSGatewayUsageSync] Fetching from Gateway', {
        orgId,
        metricType,
        period,
      })

      const gatewayRecords = await fetchGatewayUsage(
        this.supabase,
        this.authClient,
        this.config,
        orgId,
        metricType,
        period,
        this.rateLimitDelay
      )

      if (gatewayRecords.length === 0) {
        analyticsLogger.debug('[RaaSGatewayUsageSync] No records from Gateway')
        return { success: true, fetched: 0, synced: 0, failed: 0 }
      }

      analyticsLogger.info('[RaaSGatewayUsageSync] Fetched records from Gateway', {
        orgId,
        count: gatewayRecords.length,
      })

      const localEvents = validateAndTransformRecords(gatewayRecords)
      const syncResult = await storeLocalEvents(this.supabase, localEvents)

      analyticsLogger.info('[RaaSGatewayUsageSync] Sync from Gateway complete', {
        orgId,
        fetched: gatewayRecords.length,
        synced: syncResult.synced,
        failed: syncResult.failed,
      })

      return {
        success: true,
        fetched: gatewayRecords.length,
        synced: syncResult.synced,
        failed: syncResult.failed,
      }
    } catch (error) {
      analyticsLogger.error('[RaaSGatewayUsageSync] fetchFromGateway error', error)
      return {
        success: false,
        fetched: 0,
        synced: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      }
    }
  }

  async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 5,
    baseDelay = 1000
  ): Promise<T> {
    return retryWithBackoff(fn, maxRetries, baseDelay)
  }

  startScheduledSync(): void {
    analyticsLogger.info('[RaaSGatewayUsageSync] Starting scheduled sync from Gateway', {
      intervalMs: this.syncIntervalMs,
    })

    this.supabase
      .from('organizations')
      .select('id')
      .eq('status', 'active')
      .then(({ data }) => {
        if (!data) return

        data.forEach((org) => {
          const orgId = org.id
          if (!this.syncTimers.has(orgId)) {
            const timer = setInterval(() => {
              this.fetchFromGateway({ orgId })
            }, this.syncIntervalMs)
            this.syncTimers.set(orgId, timer)
          }
        })
      })
  }

  stopScheduledSync(): void {
    this.syncTimers.forEach((timer) => {
      clearInterval(timer)
    })
    this.syncTimers.clear()
    analyticsLogger.info('[RaaSGatewayUsageSync] Stopped scheduled sync')
  }

  async getSyncStats(orgId?: string): Promise<{
    totalRecords: number
    lastSyncAt?: string
    syncSource: string
  } | null> {
    try {
      let query = this.supabase
        .from('raas_usage_snapshots')
        .select('metric_value, snapshot_date, sync_source')
        .order('snapshot_date', { ascending: false })
        .limit(1)

      if (orgId) {
        query = query.eq('org_id', orgId)
      }

      const { data, error } = await query.single()

      if (error || !data) return null

      return {
        totalRecords: data.metric_value || 0,
        lastSyncAt: data.snapshot_date,
        syncSource: data.sync_source || 'unknown',
      }
    } catch (error) {
      analyticsLogger.error('[RaaSGatewayUsageSync] getSyncStats error', error)
      return null
    }
  }
}

export default RaaSGatewayUsageSync
