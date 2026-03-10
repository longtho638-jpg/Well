/**
 * Usage Anomaly Detector - Type Definitions
 *
 * Type definitions for usage anomaly detection service.
 */

export type AnomalyType =
  | 'spike'
  | 'drop'
  | 'license_mismatch'
  | 'jwt_failure'
  | 'rate_limit_breach'
  | 'pattern_deviation'

export type AlertLevel = 'warning' | 'critical' | 'emergency'

export interface AnomalyConfig {
  orgId: string
  metricType?: string
  windowHours?: number  // Default: 24
  baselineDays?: number  // Default: 7
  spikeThreshold?: number  // Default: 3.0
  dropThreshold?: number  // Default: 0.3
}

export interface AnomalyResult {
  detected: boolean
  anomalies: Anomaly[]
  checkedAt: string
}

export interface Anomaly {
  id?: string
  type: AnomalyType
  level: AlertLevel
  orgId: string
  metricType?: string
  currentValue: number
  baselineValue: number
  deviationPercent: number
  description: string
  metadata?: Record<string, unknown>
  detectedAt: string
}

export interface UsageDataPoint {
  timestamp: string
  value: number
  metricType: string
}
