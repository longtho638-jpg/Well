/**
 * Plan Status Scheduler - Type Definitions
 *
 * Type definitions for subscription plan status sync between
 * RaaS Gateway (Polar/Stripe) and AgencyOS dashboard.
 */

// ============================================================
// Core Interfaces
// ============================================================

export interface Subscription {
  id: string
  org_id: string
  license_id?: string
  status: SubscriptionStatus
  plan_id: string
  plan_name: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export type SubscriptionStatus = 'active' | 'trialing' | 'paused' | 'canceled' | 'expired'

export interface Entitlements {
  plan_id: string
  plan_name: string
  features: Record<string, unknown>
  quota_limits: Record<string, number>
  overage_rates: Record<string, number>
  effective_date: string
  expiry_date?: string
}

export interface SyncResult {
  success: boolean
  syncedCount: number
  failedCount: number
  subscriptions?: Subscription[]
  errors?: string[]
  timestamp: string
}

export interface PolarWebhookData {
  event: string
  data: {
    id: string
    status: string
    customer_id: string
    product_id: string
    product_price_id: string
    current_period_start: string
    current_period_end: string
    cancel_at_period_end: boolean
    created_at: string
    updated_at: string
    metadata?: Record<string, string>
  }
}

export interface StripeSubscriptionData {
  id: string
  customer: string
  status: string
  items: {
    data: Array<{
      price: {
        id: string
        product: string
      }
    }>
  }
  current_period_start: number
  current_period_end: number
  cancel_at_period_end: boolean
  created: number
  metadata?: Record<string, string>
}

// ============================================================
// Plan Entitlements Configuration
// ============================================================

export interface PlanEntitlementConfig {
  features: Record<string, boolean>
  quota_limits: Record<string, number>
  overage_rates: Record<string, number>
}

export const PLAN_ENTITLEMENTS: Record<string, PlanEntitlementConfig> = {
  raas_basic: {
    features: {
      api_access: true,
      model_inference: true,
      agent_execution: false,
      priority_support: false,
    },
    quota_limits: {
      api_calls: 1000,
      ai_calls: 100,
      tokens: 100000,
      compute_minutes: 60,
    },
    overage_rates: {
      api_calls: 0.001,
      ai_calls: 0.01,
      tokens: 0.0001,
      compute_minutes: 0.1,
    },
  },
  raas_premium: {
    features: {
      api_access: true,
      model_inference: true,
      agent_execution: true,
      priority_support: true,
      custom_models: true,
    },
    quota_limits: {
      api_calls: 10000,
      ai_calls: 1000,
      tokens: 1000000,
      compute_minutes: 600,
    },
    overage_rates: {
      api_calls: 0.0008,
      ai_calls: 0.008,
      tokens: 0.00008,
      compute_minutes: 0.08,
    },
  },
  raas_enterprise: {
    features: {
      api_access: true,
      model_inference: true,
      agent_execution: true,
      priority_support: true,
      custom_models: true,
      dedicated_infrastructure: true,
      sla_guarantee: true,
    },
    quota_limits: {
      api_calls: 100000,
      ai_calls: 10000,
      tokens: 10000000,
      compute_minutes: 6000,
    },
    overage_rates: {
      api_calls: 0.0005,
      ai_calls: 0.005,
      tokens: 0.00005,
      compute_minutes: 0.05,
    },
  },
}

// ============================================================
// Status Mappings
// ============================================================

export const POLAR_STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: 'active',
  trialing: 'trialing',
  paused: 'paused',
  canceled: 'canceled',
  expired: 'expired',
}

export const STRIPE_STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: 'active',
  trialing: 'trialing',
  past_due: 'active',
  unpaid: 'active',
  canceled: 'canceled',
  incomplete: 'trialing',
  incomplete_expired: 'expired',
}
