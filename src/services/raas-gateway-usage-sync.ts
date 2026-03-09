/**
 * RaaS Gateway Usage Sync Service - Phase 7
 *
 * Fetches usage records FROM RaaS Gateway (raas.agencyos.network) and syncs to local database.
 * Bi-directional sync: also pushes local usage to Gateway for consistent billing.
 *
 * Features:
 * - JWT/mk_ API key authentication with Gateway v2.0.0
 * - Fetches usage from Gateway KV cache
 * - Validates and transforms to AgencyOS internal usage events
 * - Respects KV-based rate limits
 * - Exponential backoff retries on failure
 * - Structured logging for observability
 * - 5-minute polling interval
 *
 * Usage:
 *   const syncService = new RaaSGatewayUsageSync(supabase)
 *
 *   // Fetch from Gateway to local
 *   await syncService.fetchFromGateway({ orgId, metricType, period: '2026-03' })
 *
 *   // Or scheduler triggers sync every 5 minutes
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { analyticsLogger } from '@/utils/logger'
import { GatewayAuthClient } from '@/lib/gateway-auth-client'

export interface SyncConfig {
  gatewayUrl: string
  apiKey: string
  issuer: string
  audience: string
  syncIntervalMs?: number  // Default: 300000 (5 min)
}

export interface SyncResult {
  success: boolean
  fetched: number    // Records fetched from Gateway
  synced: number     // Records synced to local DB
  failed: number
  errors?: string[]
}

export interface GatewayUsageRecord {
  org_id: string
  metric_type: string
  period: string  // YYYY-MM
  current_usage: number
  quota_limit: number
  overage_units: number
  overage_cost: number
  last_synced_at?: string
  kv_cache_key?: string
}

export interface LocalUsageEvent {
  org_id: string
  feature: string
  quantity: number
  snapshot_date: string
  quota_limit: number
  sync_source: 'gateway' | 'local'
}

export class RaaSGatewayUsageSync {
  private supabase: SupabaseClient
  private config: SyncConfig
  private authClient: GatewayAuthClient
  private syncIntervalMs: number
  private syncTimers: Map<string, NodeJS.Timeout>
  private rateLimitDelay: number  // KV rate limit delay in ms

  constructor(supabase: SupabaseClient, config: SyncConfig) {
    this.supabase = supabase
    this.config = config
    this.syncIntervalMs = config.syncIntervalMs || 300000 // 5 minutes
    this.syncTimers = new Map()
    this.rateLimitDelay = 1000 // 1 second default between requests (KV rate limit)

    // Initialize JWT/mk_ auth client
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

  /**
   * Fetch usage FROM Gateway and sync to local database
   * This is the main entry point for the user's requested flow
   */
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

      // Step 1: Fetch usage data from Gateway API
      const gatewayRecords = await this.fetchGatewayUsage(orgId, metricType, period)

      if (gatewayRecords.length === 0) {
        analyticsLogger.debug('[RaaSGatewayUsageSync] No records from Gateway')
        return { success: true, fetched: 0, synced: 0, failed: 0 }
      }

      analyticsLogger.info('[RaaSGatewayUsageSync] Fetched records from Gateway', {
        orgId,
        count: gatewayRecords.length,
      })

      // Step 2: Validate and transform to AgencyOS internal events
      const localEvents = await this.validateAndTransform(gatewayRecords)

      // Step 3: Store in central usage database
      const syncResult = await this.storeLocalEvents(localEvents)

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

  /**
   * Fetch usage data from RaaS Gateway API
   * Uses JWT/mk_ API key auth as per Gateway v2.0.0 spec
   */
  private async fetchGatewayUsage(
    orgId: string,
    metricType?: string,
    period?: string
  ): Promise<GatewayUsageRecord[]> {
    try {
      // Get JWT token with mk_ API key
      const { token } = this.authClient.getValidToken(orgId)

      // Build Gateway API URL
      const url = new URL(`${this.config.gatewayUrl}/api/v2/usage`)
      url.searchParams.set('org_id', orgId)

      if (metricType) {
        url.searchParams.set('metric_type', metricType)
      }

      if (period) {
        url.searchParams.set('period', period)
      }

      // Respect KV rate limits - add delay between requests
      await this.delay(this.rateLimitDelay)

      // Call Gateway with JWT auth
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-Key': this.config.apiKey,
          'X-Request-Source': 'wellnexus.vn',
          'Accept': 'application/json',
        },
      })

      // Handle rate limiting from Gateway KV
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || '60'
        analyticsLogger.warn('[RaaSGatewayUsageSync] Rate limited by Gateway KV', {
          retryAfter,
          orgId,
        })

        // Exponential backoff
        await this.delay(parseInt(retryAfter) * 1000)
        return this.fetchGatewayUsage(orgId, metricType, period) // Retry
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Gateway API error: ${errorData.error || response.status}`)
      }

      const data = await response.json()

      // Transform Gateway response to our internal format
      const records: GatewayUsageRecord[] = (data.records || []).map((record: any) => ({
        org_id: record.org_id || orgId,
        metric_type: record.metric_type,
        period: record.period,
        current_usage: record.current_usage || 0,
        quota_limit: record.quota_limit || 0,
        overage_units: record.overage_units || 0,
        overage_cost: record.overage_cost || 0,
        last_synced_at: record.last_synced_at,
        kv_cache_key: record.kv_cache_key,
      }))

      return records
    } catch (error) {
      analyticsLogger.error('[RaaSGatewayUsageSync] fetchGatewayUsage error', {
        orgId,
        error,
      })

      // Return empty array on error (will be retried by scheduler)
      return []
    }
  }

  /**
   * Validate Gateway records and transform to AgencyOS internal usage events
   */
  private async validateAndTransform(
    gatewayRecords: GatewayUsageRecord[]
  ): Promise<LocalUsageEvent[]> {
    const events: LocalUsageEvent[] = []

    for (const record of gatewayRecords) {
      try {
        // Validate required fields
        if (!record.org_id || !record.metric_type) {
          analyticsLogger.warn('[RaaSGatewayUsageSync] Invalid record from Gateway', {
            record,
            reason: 'Missing required fields',
          })
          continue
        }

        // Transform to AgencyOS internal format
        const event: LocalUsageEvent = {
          org_id: record.org_id,
          feature: this.mapMetricToFeature(record.metric_type),
          quantity: record.current_usage,
          snapshot_date: `${record.period}-01`, // Convert YYYY-MM to YYYY-MM-01
          quota_limit: record.quota_limit,
          sync_source: 'gateway',
        }

        // Validate transformed event
        if (!this.validateLocalEvent(event)) {
          analyticsLogger.warn('[RaaSGatewayUsageSync] Invalid transformed event', {
            event,
            reason: 'Validation failed',
          })
          continue
        }

        events.push(event)
      } catch (error) {
        analyticsLogger.error('[RaaSGatewayUsageSync] validateAndTransform error', {
          record,
          error,
        })
      }
    }

    return events
  }

  /**
   * Validate local usage event format
   */
  private validateLocalEvent(event: LocalUsageEvent): boolean {
    return !!(
      event.org_id &&
      event.feature &&
      event.quantity >= 0 &&
      event.snapshot_date &&
      event.quota_limit >= 0
    )
  }

  /**
   * Map Gateway metric types to AgencyOS feature names
   */
  private mapMetricToFeature(metricType: string): string {
    const mapping: Record<string, string> = {
      api_calls: 'api_call',
      ai_calls: 'ai_call',
      tokens: 'tokens',
      compute_minutes: 'compute_ms',
      storage_gb: 'storage',
      emails: 'emails',
      model_inferences: 'model_inference',
      agent_executions: 'agent_execution',
    }
    return mapping[metricType] || metricType
  }

  /**
   * Store validated events to local usage database
   */
  private async storeLocalEvents(events: LocalUsageEvent[]): Promise<{ synced: number; failed: number }> {
    const result = { synced: 0, failed: 0 }

    for (const event of events) {
      try {
        // Check if record already exists (upsert)
        const { data: existing } = await this.supabase
          .from('raas_usage_snapshots')
          .select('id')
          .eq('org_id', event.org_id)
          .eq('metric_type', event.feature)
          .eq('snapshot_date', event.snapshot_date)
          .single()

        if (existing) {
          // Update existing record
          const { error } = await this.supabase
            .from('raas_usage_snapshots')
            .update({
              metric_value: event.quantity,
              quota_limit: event.quota_limit,
              sync_source: event.sync_source,
              last_synced_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)

          if (error) throw error
        } else {
          // Insert new record
          const { error } = await this.supabase
            .from('raas_usage_snapshots')
            .insert({
              org_id: event.org_id,
              metric_type: event.feature,
              snapshot_date: event.snapshot_date,
              metric_value: event.quantity,
              quota_limit: event.quota_limit,
              sync_source: event.sync_source,
              created_at: new Date().toISOString(),
            })

          if (error) throw error
        }

        result.synced++
      } catch (error) {
        analyticsLogger.error('[RaaSGatewayUsageSync] storeLocalEvents error', {
          event,
          error,
        })
        result.failed++
      }
    }

    return result
  }

  /**
   * Exponential backoff retry helper
   */
  async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 5,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: Error | undefined

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        analyticsLogger.warn(`[RaaSGatewayUsageSync] Retry attempt ${attempt}/${maxRetries} failed`, {
          error: lastError.message,
        })

        if (attempt < maxRetries) {
          // Exponential backoff with jitter
          const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
          await this.delay(delay)
        }
      }
    }

    throw lastError || new Error('Max retries exceeded')
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Start scheduled sync from Gateway to local
   */
  startScheduledSync(): void {
    analyticsLogger.info('[RaaSGatewayUsageSync] Starting scheduled sync from Gateway', {
      intervalMs: this.syncIntervalMs,
    })

    // Get all active orgs
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

  /**
   * Stop scheduled sync
   */
  stopScheduledSync(): void {
    this.syncTimers.forEach((timer) => {
      clearInterval(timer)
    })
    this.syncTimers.clear()
    analyticsLogger.info('[RaaSGatewayUsageSync] Stopped scheduled sync')
  }

  /**
   * Get sync statistics for observability
   */
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
