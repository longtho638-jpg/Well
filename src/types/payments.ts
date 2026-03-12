/**
 * Payment Gateway Types - Phase 2 Revenue Infrastructure
 * Main export file - re-exports from modular type files
 */

// Core payment types (Stripe, VNPay, MoMo)
export * from './payments-core'

// Stripe usage metering and billing types
export interface StripeMeteredPrice {
  id: string
  object: 'price'
  active: boolean
  billing_scheme: 'per_unit' | 'tiered'
  created: number
  currency: string
  livemode: boolean
  product: string
  recurring?: {
    aggregate_usage?: 'sum' | 'max' | 'last' | 'first'
    interval: 'day' | 'week' | 'month' | 'year'
    interval_count: number
    usage_type: 'licensed' | 'metered'
  }
  type: 'recurring'
  unit_amount?: number
  unit_amount_decimal?: string
}

export interface StripeSubscriptionItem {
  id: string
  object: 'subscription_item'
  created: number
  metadata: Record<string, string>
  price: StripeMeteredPrice
  quantity?: number
  subscription: string
}

export interface StripeUsageRecord {
  id: string
  object: 'usage_record'
  deleted?: boolean
  idempotency_key?: string
  livemode: boolean
  quantity: number
  subscription_item: string
  timestamp: number
}

export interface StripeUsageRecordCreate {
  subscription_item: string
  quantity: number
  timestamp: number
  action?: 'increment' | 'set'
}

// Stripe invoice and payment intent
export interface StripeInvoice {
  id: string
  object: 'invoice'
  amount_due: number
  amount_paid: number
  amount_remaining: number
  billing_reason: 'subscription_cycle' | 'subscription_create' | 'subscription_update' | 'subscription' | 'manual' | 'upcoming'
  created: number
  currency: string
  customer: string
  customer_email?: string
  due_date?: number
  hosted_invoice_url?: string
  invoice_pdf?: string
  lines: {
    object: 'list'
    data: Array<{
      id?: string
      type: 'subscription' | 'invoiceitem'
      amount?: number
      description?: string
      period?: { start: number; end: number }
      price?: StripeMeteredPrice
    }>
  }
  livemode: boolean
  paid: boolean
  payment_intent?: string
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'
  subscription?: string
  total: number
}

export interface StripePaymentIntent {
  id: string
  object: 'payment_intent'
  amount: number
  amount_capturable: number
  amount_received: number
  client_secret: string
  created: number
  currency: string
  customer?: string
  description?: string
  invoice?: string
  livemode: boolean
  metadata: Record<string, string>
  payment_method?: string
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded'
}

// Overage and usage sync types
export interface StripeUsageSyncRequest {
  subscription_item_id: string
  usage_records: StripeUsageRecordCreate[]
  is_overage?: boolean
  overage_transaction_id?: string
}

export interface StripeUsageSyncResult {
  success: boolean
  syncedCount: number
  failedCount: number
  errors?: Array<{ transactionId: string; error: string }>
  stripe_response?: {
    id: string
    object: 'usage_record'
    livemode: boolean
    quantity: number
  }
  records_created?: number
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

// Withdrawal processing types
export interface WithdrawalRequest {
  userId: string
  amount: number
  currency: 'SHOP' | 'VND'
  bankAccount: BankAccountInfo
  notes?: string
}

export interface BankAccountInfo {
  bankCode: string
  accountNumber: string
  accountName: string
  branch?: string
}

export interface WithdrawalResult {
  success: boolean
  withdrawalId: string
  amount: number
  taxDeducted: number
  netAmount: number
  estimatedArrival: string
  status: WithdrawalStatus
}

export type WithdrawalStatus =
  | 'pending_approval'
  | 'processing'
  | 'completed'
  | 'rejected'
  | 'cancelled'

// GMV tracking types
export interface GMVMetrics {
  dailyGMV: number
  weeklyGMV: number
  monthlyGMV: number
  yearlyGMV: number
  ordersCount: number
  avgOrderValue: number
  conversionRate: number
}

export interface RevenueTarget {
  targetAmount: number
  currentAmount: number
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  progressPercent: number
  projectedCompletion: string
}

// Stripe usage reconciliation types
export interface UsageReconciliationResult {
  period: {
    start: string
    end: string
  }
  supabase_total: number
  stripe_total: number
  difference: number
  difference_percent: number
  status: 'matched' | 'discrepancy'
  discrepancies: Array<{
    date: string
    supabase_usage: number
    stripe_usage: number
    difference: number
  }>
  recommendations: string[]
}
