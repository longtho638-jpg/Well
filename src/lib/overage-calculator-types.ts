/**
 * Overage Calculator Types
 *
 * Shared type definitions for overage calculation and tracking.
 */

export type OverageMetricType =
  | 'api_calls'
  | 'ai_calls'
  | 'tokens'
  | 'compute_minutes'
  | 'storage_gb'
  | 'emails'
  | 'model_inferences'
  | 'agent_executions'

export interface OverageCalculation {
  metricType: OverageMetricType
  totalUsage: number
  includedQuota: number
  overageUnits: number
  ratePerUnit: number
  totalCost: number
  currency: string
  tier: string
  calculationDate: string
}

export interface OverageTransaction {
  id?: string
  orgId: string
  tenantId?: string
  userId?: string
  licenseId?: string
  metricType: OverageMetricType
  billingPeriod: string
  totalUsage: number
  includedQuota: number
  overageUnits: number
  ratePerUnit: number
  totalCost: number
  currency?: string
  stripeSubscriptionItemId?: string
  idempotencyKey?: string
  metadata?: Record<string, unknown>
}

export interface OverageRates {
  free: number
  basic: number
  pro: number
  enterprise: number
  master: number
}

export interface QuotaContext {
  baseQuota: number
  tenantOverride?: number
  gracePeriodBoost?: number
  effectiveQuota: number
}

export interface OverageHistoryEntry {
  id: string
  metricType: OverageMetricType
  overageUnits: number
  totalCost: number
  billingPeriod: string
  createdAt: string
}

export interface OverageSummary {
  totalCost: number
  totalTransactions: number
  breakdownByMetric: Record<string, number>
}

export interface StripeSyncResult {
  success: boolean
  stripeUsageRecordId?: string
  error?: string
}
