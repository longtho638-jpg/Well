/**
 * RaaS Gateway Usage Sync - Helper Functions
 *
 * Helper functions for RaaS Gateway usage sync.
 */

import { analyticsLogger } from '@/utils/logger'
import type { GatewayUsageRecord, LocalUsageEvent } from './raas-gateway-usage-sync-types'
import { METRIC_TO_FEATURE_MAP } from './raas-gateway-usage-sync-types'

/**
 * Validate local usage event format
 */
export function validateLocalEvent(event: LocalUsageEvent): boolean {
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
export function mapMetricToFeature(metricType: string): string {
  return METRIC_TO_FEATURE_MAP[metricType] || metricType
}

/**
 * Transform Gateway record to local usage event
 */
export function transformToLocalStorage(record: GatewayUsageRecord): LocalUsageEvent {
  return {
    org_id: record.org_id,
    feature: mapMetricToFeature(record.metric_type),
    quantity: record.current_usage,
    snapshot_date: `${record.period}-01`,
    quota_limit: record.quota_limit,
    sync_source: 'gateway',
  }
}

/**
 * Validate and transform Gateway records to local events
 */
export function validateAndTransformRecords(
  gatewayRecords: GatewayUsageRecord[]
): LocalUsageEvent[] {
  const events: LocalUsageEvent[] = []

  for (const record of gatewayRecords) {
    if (!record.org_id || !record.metric_type) {
      analyticsLogger.warn('[RaaSGatewayUsageSync] Invalid record from Gateway', {
        record,
        reason: 'Missing required fields',
      })
      continue
    }

    const event = transformToLocalStorage(record)

    if (!validateLocalEvent(event)) {
      analyticsLogger.warn('[RaaSGatewayUsageSync] Invalid transformed event', {
        event,
        reason: 'Validation failed',
      })
      continue
    }

    events.push(event)
  }

  return events
}

/**
 * Store local usage events to database
 */
export async function storeLocalEvents(
  supabase: any,
  events: LocalUsageEvent[]
): Promise<{ synced: number; failed: number }> {
  const result = { synced: 0, failed: 0 }

  for (const event of events) {
    try {
      const { data: existing } = await supabase
        .from('raas_usage_snapshots')
        .select('id')
        .eq('org_id', event.org_id)
        .eq('metric_type', event.feature)
        .eq('snapshot_date', event.snapshot_date)
        .single()

      if (existing) {
        const { error } = await supabase
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
        const { error } = await supabase
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
 * Fetch usage data from Gateway API
 */
export async function fetchGatewayUsage(
  supabase: any,
  authClient: any,
  config: { gatewayUrl: string; apiKey: string },
  orgId: string,
  metricType?: string,
  period?: string,
  rateLimitDelay: number = 1000
): Promise<GatewayUsageRecord[]> {
  try {
    const { token } = authClient.getValidToken(orgId)

    const url = new URL(`${config.gatewayUrl}/api/v2/usage`)
    url.searchParams.set('org_id', orgId)
    if (metricType) url.searchParams.set('metric_type', metricType)
    if (period) url.searchParams.set('period', period)

    await delay(rateLimitDelay)

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': config.apiKey,
        'X-Request-Source': 'wellnexus.vn',
        'Accept': 'application/json',
      },
    })

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || '60'
      analyticsLogger.warn('[RaaSGatewayUsageSync] Rate limited by Gateway KV', {
        retryAfter,
        orgId,
      })
      await delay(parseInt(retryAfter) * 1000)
      return fetchGatewayUsage(supabase, authClient, config, orgId, metricType, period, rateLimitDelay)
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Gateway API error: ${errorData.error || response.status}`)
    }

    const data = await response.json()

    return (data.records || []).map((record: any) => ({
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
  } catch (error) {
    analyticsLogger.error('[RaaSGatewayUsageSync] fetchGatewayUsage error', { orgId, error })
    return []
  }
}

/**
 * Delay helper for rate limiting
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Exponential backoff retry helper
 */
export async function retryWithBackoff<T>(
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
      analyticsLogger.warn(`Retry attempt ${attempt}/${maxRetries} failed`, {
        error: lastError.message,
      })

      if (attempt < maxRetries) {
        const delayTime = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
        await delay(delayTime)
      }
    }
  }

  throw lastError || new Error('Max retries exceeded')
}
