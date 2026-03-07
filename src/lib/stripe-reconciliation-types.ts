/**
 * Stripe Reconciliation Types
 */

/**
 * Stripe usage record from API
 */
export interface StripeUsageRecord {
  id: string
  object: 'usage_record'
  quantity: number
  subscription_item: string
  timestamp: number
  action: 'set' | 'increment' | 'clear'
}

/**
 * Local aggregation record
 */
export interface LocalAggregationRecord {
  id: string
  license_id: string
  feature: string
  total_quantity: number
  period_start: string
  period_end: string
  is_synced_to_stripe: boolean
}

/**
 * Reconciliation result
 */
export interface ReconciliationResult {
  match: boolean
  localQuantity: number
  stripeQuantity: number
  difference: number
  needsAdjustment: boolean
}

/**
 * Billing period report
 */
export interface BillingPeriodReport {
  subscriptionItemId: string
  periodStart: string
  periodEnd: string
  totalLocalUsage: number
  totalStripeUsage: number
  reconciledRecords: ReconciliationResult[]
  unreconciledRecords: LocalAggregationRecord[]
  adjustmentsNeeded: number
}

/**
 * Adjustment options
 */
export interface AdjustmentOptions {
  subscriptionItemId: string
  quantity: number
  reason: string
  idempotencyKey: string
}
