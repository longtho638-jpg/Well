/**
 * TypeScript Types and Interfaces - Phase 6 ROI Digest Worker
 *
 * Shared types for anomaly detection, ROI calculation, and alert delivery.
 */

// ============================================================================
// Anomaly Detection Types
// ============================================================================

export interface AnomalyAlert {
  id: string
  org_id: string
  alert_type: AlertType
  alert_level: AlertLevel
  metric_name: string
  metric_value: number
  threshold_value: number
  description: string
  z_score?: number
  acknowledged: boolean
  acknowledged_by?: string
  acknowledged_at?: string
  created_at: string
}

export type AlertType =
  | 'usage_spike'
  | 'usage_drop'
  | 'negative_roi'
  | 'quota_breach'
  | 'cost_spike'
  | 'error_rate_spike'

export type AlertLevel = 'info' | 'warning' | 'critical'

export interface AnomalyDetectionResult {
  isAnomaly: boolean
  metricType: string
  orgId: string
  currentValue: number
  expectedValue: number
  deviation: number
  zScore?: number
  severity: AlertLevel
  window: '1h' | '24h' | '7d'
  timestamp: string
}

export interface RollingWindowStats {
  mean: number
  stddev: number
  q1: number
  q3: number
  iqr: number
  min: number
  max: number
  count: number
}

// ============================================================================
// ROI Digest Types
// ============================================================================

export interface ROIDigest {
  id: string
  org_id: string
  digest_date: string
  roi_percentage: number
  cost_per_api_call: number
  revenue_per_user: number
  utilization_rate: number
  anomaly_score: number
  total_api_calls: number
  total_ai_calls: number
  total_cost: number
  total_revenue: number
  email_sent: boolean
  webhook_sent: boolean
  created_at: string
}

export interface ROIMetrics {
  roi_percentage: number
  cost_per_api_call: number
  revenue_per_user: number
  utilization_rate: number
  anomaly_score: number
  trend: 'up' | 'down' | 'stable'
}

export interface UsageData {
  org_id: string
  date: string
  api_calls: number
  ai_calls: number
  tokens: number
  compute_minutes: number
  storage_gb: number
  emails: number
  model_inferences: number
  agent_executions: number
}

// ============================================================================
// Alert Delivery Types
// ============================================================================

export interface AlertWebhookPayload {
  event_type: 'anomaly_detected' | 'roi_digest' | 'quota_warning'
  timestamp: string
  org_id: string
  project_id: string
  metric_type: string
  deviation_severity: AlertLevel
  raw_value: number
  expected_value: number
  z_score?: number
  description: string
  metadata?: {
    tier?: string
    subscription_status?: string
    days_until_reset?: number
  }
}

export interface AlertEmailData {
  org_name: string
  admin_email: string
  alert_level: AlertLevel
  alert_type: AlertType
  metric_name: string
  current_value: number
  expected_value: number
  deviation_percentage: number
  timestamp: string
  description: string
  dashboard_url: string
}

// ============================================================================
// RaaS Gateway Types
// ============================================================================

export interface RaaSLicense {
  license_key: string
  org_id: string
  user_id: string
  tier: 'free' | 'basic' | 'pro' | 'enterprise' | 'master'
  status: 'active' | 'inactive' | 'suspended'
  features: Record<string, boolean>
  rate_limits: Record<string, number>
  created_at: string
  expires_at?: string
}

export interface KVUsageCache {
  current_usage: number
  period_start: string
  period_end: string
  last_updated: string
}

// ============================================================================
// Worker Environment Types
// ============================================================================

export interface WorkerEnv {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  RESEND_API_KEY: string
  WEBHOOK_URL: string
  JWT_SECRET: string
  USAGE_KV: KVNamespace
  ALERTS_R2: R2Bucket
  ENFORCEMENT_MODE: 'soft' | 'hard' | 'hybrid'
}

// ============================================================================
// Database Schema Types
// ============================================================================

export interface AnomalyAlertsTable {
  id: string
  org_id: string
  alert_type: AlertType
  alert_level: AlertLevel
  metric_name: string
  metric_value: number
  threshold_value: number
  description: string
  acknowledged: boolean
  acknowledged_by: string | null
  acknowledged_at: string | null
  created_at: string
}

export interface RoiDigestsTable {
  id: string
  org_id: string
  digest_date: string
  roi_percentage: number
  cost_per_api_call: number
  revenue_per_user: number
  utilization_rate: number
  anomaly_score: number
  total_api_calls: number
  total_ai_calls: number
  total_cost: number
  total_revenue: number
  email_sent: boolean
  webhook_sent: boolean
  created_at: string
}
