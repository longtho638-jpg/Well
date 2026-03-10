/**
 * AgencyOS Usage Sync - Type Definitions
 *
 * Type definitions for AgencyOS usage sync service.
 */

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
