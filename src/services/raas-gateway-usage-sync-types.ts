/**
 * RaaS Gateway Usage Sync - Type Definitions
 *
 * Type definitions for RaaS Gateway usage sync service.
 */

// ============================================================
// Core Interfaces
// ============================================================

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

// ============================================================
// Metric Type Mappings
// ============================================================

export const METRIC_TO_FEATURE_MAP: Record<string, string> = {
  api_calls: 'api_call',
  ai_calls: 'ai_call',
  tokens: 'tokens',
  compute_minutes: 'compute_ms',
  storage_gb: 'storage',
  emails: 'emails',
  model_inferences: 'model_inference',
  agent_executions: 'agent_execution',
}
