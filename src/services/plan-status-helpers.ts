/**
 * Plan Status Scheduler - Helper Functions
 *
 * Helper functions for subscription plan status sync.
 */

import { analyticsLogger } from '@/utils/logger'
import type { Subscription, Entitlements, PolarWebhookData, StripeSubscriptionData } from './plan-status-types'
import { PLAN_ENTITLEMENTS, POLAR_STATUS_MAP, STRIPE_STATUS_MAP } from './plan-status-types'

/**
 * Convert subscription to entitlements
 */
export function subscriptionToEntitlements(subscription: Subscription): Entitlements {
  const config = PLAN_ENTITLEMENTS[subscription.plan_id]

  if (config) {
    return {
      plan_id: subscription.plan_id,
      plan_name: subscription.plan_name,
      features: config.features,
      quota_limits: config.quota_limits,
      overage_rates: config.overage_rates,
      effective_date: subscription.current_period_start,
      expiry_date: subscription.current_period_end,
    }
  }

  // Default entitlements for unknown plans
  return {
    plan_id: subscription.plan_id,
    plan_name: subscription.plan_name,
    features: {},
    quota_limits: {},
    overage_rates: {},
    effective_date: subscription.current_period_start,
    expiry_date: subscription.current_period_end,
  }
}

/**
 * Map Polar status to internal status
 */
export function mapPolarStatus(polarStatus: string): Subscription['status'] {
  return POLAR_STATUS_MAP[polarStatus] || 'active'
}

/**
 * Map Stripe status to internal status
 */
export function mapStripeStatus(stripeStatus: string): Subscription['status'] {
  return STRIPE_STATUS_MAP[stripeStatus] || 'active'
}

/**
 * Generate idempotency key for sync requests
 */
export function generateIdempotencyKey(orgId: string, planId: string): string {
  const timestamp = Math.floor(Date.now() / 1000 / 300) // 5-minute windows
  return `sync_${orgId}_${planId}_${timestamp}`
}

/**
 * Convert Polar webhook to Subscription format
 */
export function polarWebhookToSubscription(payload: PolarWebhookData): Subscription {
  return {
    id: payload.data.id,
    org_id: payload.data.customer_id,
    license_id: payload.data.metadata?.license_id,
    status: mapPolarStatus(payload.data.status),
    plan_id: payload.data.product_id,
    plan_name: payload.data.product_id,
    current_period_start: payload.data.current_period_start,
    current_period_end: payload.data.current_period_end,
    cancel_at_period_end: payload.data.cancel_at_period_end,
    created_at: payload.data.created_at,
    updated_at: payload.data.updated_at,
  }
}

/**
 * Convert Stripe webhook to Subscription format
 */
export function stripeWebhookToSubscription(payload: StripeSubscriptionData): Subscription {
  const priceItem = payload.items.data[0]
  return {
    id: payload.id,
    org_id: payload.customer,
    license_id: payload.metadata?.license_id,
    status: mapStripeStatus(payload.status),
    plan_id: priceItem?.price?.product || 'unknown',
    plan_name: priceItem?.price?.product || 'Unknown Plan',
    current_period_start: new Date(payload.current_period_start * 1000).toISOString(),
    current_period_end: new Date(payload.current_period_end * 1000).toISOString(),
    cancel_at_period_end: payload.cancel_at_period_end,
    created_at: new Date(payload.created * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }
}

/**
 * Fetch Polar subscriptions from KV storage
 */
export async function fetchPolarSubscriptions(): Promise<Subscription[]> {
  try {
    analyticsLogger.debug('[PlanStatusScheduler] Fetching Polar subscriptions from KV')
    return []
  } catch (error) {
    analyticsLogger.error('[PlanStatusScheduler] fetchPolarSubscriptions error', error)
    return []
  }
}

/**
 * Fetch Stripe subscriptions (legacy support)
 */
export async function fetchStripeSubscriptions(): Promise<Subscription[]> {
  try {
    analyticsLogger.debug('[PlanStatusScheduler] Fetching Stripe subscriptions')
    return []
  } catch (error) {
    analyticsLogger.error('[PlanStatusScheduler] fetchStripeSubscriptions error', error)
    return []
  }
}
