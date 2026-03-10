/**
 * Overage Calculator Types
 *
 * Type definitions for overage calculation service.
 */

export interface OverageCalculation {
  metricType: string
  totalUsage: number
  includedQuota: number
  overageUnits: number
  ratePerUnit: number
  totalCost: number
  isOverQuota: boolean
  percentageUsed: number
}

export interface OverageResult {
  orgId: string
  billingPeriod: string
  calculations: OverageCalculation[]
  totalOverageCost: number
  hasOverage: boolean
  calculatedAt: string
}

export interface OverageTransaction {
  id?: string
  orgId: string
  tenantId?: string
  userId?: string
  licenseId?: string
  metricType: string
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
  metadata?: Record<string, any>
  idempotencyKey?: string
  createdAt?: string
  updatedAt?: string
}

export type LicenseTier = 'basic' | 'pro' | 'enterprise' | 'unlimited'

export type MetricType = 'api_calls' | 'ai_calls' | 'tokens' | 'compute_minutes'
