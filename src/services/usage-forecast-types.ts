/**
 * Usage Forecast Service - Type Definitions
 *
 * Type definitions for usage forecasting service.
 */

export interface UsageForecast {
  metricType: string
  currentUsage: number
  projectedEndOfMonth: number
  quotaLimit: number
  projectedOverageUnits: number
  projectedOverageCost: number
  confidence: number // 0-1
  trend: 'up' | 'down' | 'stable'
  dailyRunRate: number
  daysRemaining: number
  periodEnd: string
}

export interface DailyUsage {
  date: string // YYYY-MM-DD
  value: number
}

export interface LinearRegressionResult {
  slope: number
  intercept: number
  rSquared: number // Coefficient of determination
}

export type OverageMetricType =
  | 'api_calls'
  | 'ai_calls'
  | 'tokens'
  | 'compute_minutes'
  | 'storage_gb'
  | 'emails'
  | 'model_inferences'
  | 'agent_executions'

export interface ForecastOptions {
  historyDays?: number
  period?: string // YYYY-MM format
}

// Metric type to feature name mapping
export const METRIC_TO_FEATURE: Record<string, string> = {
  api_calls: 'api_call',
  tokens: 'tokens',
  compute_minutes: 'compute_ms',
  model_inferences: 'model_inference',
  agent_executions: 'agent_execution',
}

// Default rates by tier
export const DEFAULT_RATES: Record<string, Record<string, number>> = {
  api_calls: { free: 0.001, basic: 0.0008, pro: 0.0005, enterprise: 0.0003, master: 0.0001 },
  tokens: { free: 0.000004, basic: 0.000003, pro: 0.000002, enterprise: 0.000001, master: 0.0000005 },
  compute_minutes: { free: 0.01, basic: 0.008, pro: 0.005, enterprise: 0.003, master: 0.001 },
}
