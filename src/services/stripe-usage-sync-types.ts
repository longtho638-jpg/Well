/**
 * Stripe Usage Sync - Type Definitions
 *
 * Type definitions for Stripe overage usage sync service.
 */

export interface StripeUsageSyncResult {
  success: boolean
  syncedCount: number
  failedCount: number
  errors?: Array<{ transactionId: string; error: string }>
}

export interface PendingOverage {
  id: string
  org_id: string
  metric_type: string
  billing_period: string
  overage_units: number
  rate_per_unit: number
  total_cost: number
  stripe_subscription_item_id: string | null
}

export interface SyncLogOptions {
  usageRecordId?: string
  errorMessage?: string
  retryCount?: number
  nextRetryAt?: Date
  stripeResponse?: Record<string, unknown>
}

export interface TransactionSyncOptions {
  stripeUsageRecordId?: string
  stripeSyncedAt?: Date
  errorMessage?: string
}
