/**
 * Overage Billing Types - Phase 7
 * Tracks usage exceeding quotas and calculates costs
 */

export type LicenseTier = 'free' | 'basic' | 'pro' | 'enterprise' | 'master'

export type MetricType =
  | 'api_calls'
  | 'ai_calls'
  | 'tokens'
  | 'compute_minutes'
  | 'storage_gb'
  | 'emails'
  | 'model_inferences'
  | 'agent_executions'

/**
 * Overage calculation for a single metric
 */
export interface OverageCalculation {
  metricType: MetricType
  totalUsage: number
  includedQuota: number
  overageUnits: number
  ratePerUnit: number
  totalCost: number
  isOverQuota: boolean
  percentageUsed: number
}

/**
 * Complete overage result for an organization
 */
export interface OverageResult {
  orgId: string
  billingPeriod: string
  calculations: OverageCalculation[]
  totalOverageCost: number
  hasOverage: boolean
  calculatedAt: string
}

/**
 * Overage transaction record for database
 */
export interface OverageTransaction {
  id?: string
  orgId: string
  tenantId?: string
  userId?: string
  licenseId?: string
  metricType: MetricType
  billingPeriod: string
  totalUsage: number
  includedQuota: number
  overageUnits: number
  ratePerUnit: number
  totalCost: number
  currency?: string
  stripeSubscriptionItemId?: string
  stripeUsageRecordId?: string
  stripeSyncedAt?: string
  stripeSyncStatus?: 'pending' | 'synced' | 'failed'
  metadata?: Record<string, unknown>
  idempotencyKey?: string
  createdAt?: string
  updatedAt?: string
}

/**
 * Rate configuration for a metric type
 */
export interface OverageRate {
  id?: string
  metricType: MetricType
  freeRate: number
  basicRate: number
  proRate: number
  enterpriseRate: number
  masterRate: number
  customRates?: Array<{ tenantId: string; rate: number }>
  description?: string
  unitName?: string
}

/**
 * Stripe usage sync request
 */
export interface StripeUsageSyncRequest {
  syncBatch: true
  orgId: string
  billingPeriod: string
  transactions: Array<{
    overageTransactionId: string
    subscriptionItemId: string
    quantity: number
    metricType: string
    ratePerUnit: number
    totalCost: number
  }>
}

/**
 * Stripe usage sync result
 */
export interface StripeUsageSyncResult {
  success: boolean
  syncedCount: number
  failedCount: number
  errors?: Array<{
    transactionId: string
    error: string
  }>
}
