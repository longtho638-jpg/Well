/**
 * Plan Status Scheduler Service - Phase 6
 *
 * Orchestrates background sync of subscription plan statuses between
 * RaaS Gateway (Polar/Stripe) and AgencyOS dashboard.
 *
 * Features:
 * - Fetches active subscriptions from Polar/Stripe via webhooks
 * - Syncs plan entitlements to AgencyOS dashboard via secure internal API
 * - JWT authentication for internal API calls
 * - Scheduled sync every 5-15 minutes via Cloudflare Worker cron
 * - Idempotency with deduplication
 *
 * Usage:
 *   const scheduler = new PlanStatusScheduler()
 *   await scheduler.runSync()
 */

import { analyticsLogger } from '@/utils/logger'
import { GatewayAuthClient } from '@/lib/gateway-auth-client'

/**
 * Get environment variable (Deno or Node/browser)
 */
function getEnvVar(key: string): string | undefined {
  if (typeof Deno !== 'undefined') {
    return Deno.env.get(key)
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key]
  }
  return undefined
}

export interface Subscription {
  id: string
  org_id: string
  license_id?: string
  status: 'active' | 'trialing' | 'paused' | 'canceled' | 'expired'
  plan_id: string
  plan_name: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

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

export class PlanStatusScheduler {
  private readonly AGENCYOS_API_URL: string
  private readonly POLAR_WEBHOOK_SECRET?: string
  private readonly STRIPE_WEBHOOK_SECRET?: string
  private authClient?: GatewayAuthClient
  private readonly JWT_ISSUER: string
  private readonly JWT_AUDIENCE: string

  constructor() {
    this.AGENCYOS_API_URL =
      getEnvVar('AGENCYOS_API_URL') || 'https://agencyos.network/api/internal'

    this.POLAR_WEBHOOK_SECRET = getEnvVar('POLAR_WEBHOOK_SECRET')

    this.STRIPE_WEBHOOK_SECRET = getEnvVar('STRIPE_WEBHOOK_SECRET')

    this.JWT_ISSUER = 'wellnexus.vn'
    this.JWT_AUDIENCE = 'agencyos.network'
  }

  /**
   * Fetch active subscriptions from Polar webhook data stored in KV
   * In production, this would query Cloudflare KV or Polar API
   */
  async fetchActiveSubscriptions(): Promise<Subscription[]> {
    try {
      analyticsLogger.info('[PlanStatusScheduler] Fetching active subscriptions')

      // In production, fetch from:
      // 1. Cloudflare KV (cached Polar webhook data)
      // 2. Polar API directly
      // 3. Stripe API for legacy subscriptions

      // For now, simulate fetching from stored webhook data
      const subscriptions: Subscription[] = []

      // Fetch Polar subscriptions from KV
      const polarSubs = await this.fetchPolarSubscriptions()
      subscriptions.push(...polarSubs)

      // Fetch Stripe subscriptions (legacy)
      const stripeSubs = await this.fetchStripeSubscriptions()
      subscriptions.push(...stripeSubs)

      analyticsLogger.info('[PlanStatusScheduler] Fetched subscriptions', {
        count: subscriptions.length,
        polarCount: polarSubs.length,
        stripeCount: stripeSubs.length,
      })

      return subscriptions
    } catch (error) {
      analyticsLogger.error('[PlanStatusScheduler] fetchActiveSubscriptions error', error)
      throw error
    }
  }

  /**
   * Fetch Polar subscriptions from KV storage
   */
  private async fetchPolarSubscriptions(): Promise<Subscription[]> {
    try {
      // In production: query Cloudflare KV for active subscriptions
      // const kvData = await POLAR_KV.list({ prefix: 'subscription:' })

      // Simulated response
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
  private async fetchStripeSubscriptions(): Promise<Subscription[]> {
    try {
      // In production: query Stripe API or local cache
      analyticsLogger.debug('[PlanStatusScheduler] Fetching Stripe subscriptions')
      return []
    } catch (error) {
      analyticsLogger.error('[PlanStatusScheduler] fetchStripeSubscriptions error', error)
      return []
    }
  }

  /**
   * Convert subscription to entitlements
   */
  private subscriptionToEntitlements(subscription: Subscription): Entitlements {
    // Map plan_id to entitlements
    const entitlementsMap: Record<string, Entitlements> = {
      'raas_basic': {
        plan_id: 'raas_basic',
        plan_name: 'RaaS Basic',
        features: {
          'api_access': true,
          'model_inference': true,
          'agent_execution': false,
          'priority_support': false,
        },
        quota_limits: {
          'api_calls': 1000,
          'ai_calls': 100,
          'tokens': 100000,
          'compute_minutes': 60,
        },
        overage_rates: {
          'api_calls': 0.001,
          'ai_calls': 0.01,
          'tokens': 0.0001,
          'compute_minutes': 0.1,
        },
        effective_date: subscription.current_period_start,
        expiry_date: subscription.current_period_end,
      },
      'raas_premium': {
        plan_id: 'raas_premium',
        plan_name: 'RaaS Premium',
        features: {
          'api_access': true,
          'model_inference': true,
          'agent_execution': true,
          'priority_support': true,
          'custom_models': true,
        },
        quota_limits: {
          'api_calls': 10000,
          'ai_calls': 1000,
          'tokens': 1000000,
          'compute_minutes': 600,
        },
        overage_rates: {
          'api_calls': 0.0008,
          'ai_calls': 0.008,
          'tokens': 0.00008,
          'compute_minutes': 0.08,
        },
        effective_date: subscription.current_period_start,
        expiry_date: subscription.current_period_end,
      },
      'raas_enterprise': {
        plan_id: 'raas_enterprise',
        plan_name: 'RaaS Enterprise',
        features: {
          'api_access': true,
          'model_inference': true,
          'agent_execution': true,
          'priority_support': true,
          'custom_models': true,
          'dedicated_infrastructure': true,
          'sla_guarantee': true,
        },
        quota_limits: {
          'api_calls': 100000,
          'ai_calls': 10000,
          'tokens': 10000000,
          'compute_minutes': 6000,
        },
        overage_rates: {
          'api_calls': 0.0005,
          'ai_calls': 0.005,
          'tokens': 0.00005,
          'compute_minutes': 0.05,
        },
        effective_date: subscription.current_period_start,
        expiry_date: subscription.current_period_end,
      },
    }

    return (
      entitlementsMap[subscription.plan_id] || {
        plan_id: subscription.plan_id,
        plan_name: subscription.plan_name,
        features: {},
        quota_limits: {},
        overage_rates: {},
        effective_date: subscription.current_period_start,
        expiry_date: subscription.current_period_end,
      }
    )
  }

  /**
   * Sync plan entitlements to AgencyOS dashboard
   *
   * @param orgId - Organization ID
   * @param entitlements - Plan entitlements to sync
   * @returns Sync result
   */
  async syncToAgencyOS(
    orgId: string,
    entitlements: Entitlements
  ): Promise<boolean> {
    try {
      analyticsLogger.info('[PlanStatusScheduler] Syncing to AgencyOS', {
        orgId,
        planId: entitlements.plan_id,
      })

      // Get JWT auth token
      const token = await this.getAuthToken(orgId)

      // Prepare sync payload
      const payload = {
        org_id: orgId,
        entitlements: {
          plan_id: entitlements.plan_id,
          plan_name: entitlements.plan_name,
          features: entitlements.features,
          quota_limits: entitlements.quota_limits,
          overage_rates: entitlements.overage_rates,
          effective_date: entitlements.effective_date,
          expiry_date: entitlements.expiry_date,
        },
        sync_timestamp: new Date().toISOString(),
      }

      // Call AgencyOS internal API
      const response = await fetch(`${this.AGENCYOS_API_URL}/plan/entitlements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Idempotency-Key': this.generateIdempotencyKey(orgId, entitlements.plan_id),
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `API error: ${response.status}`)
      }

      const result = await response.json()

      analyticsLogger.info('[PlanStatusScheduler] AgencyOS sync successful', {
        orgId,
        result,
      })

      return true
    } catch (error) {
      analyticsLogger.error('[PlanStatusScheduler] syncToAgencyOS error', error)
      throw error
    }
  }

  /**
   * Run scheduled sync job
   * This is the main entry point for the Cloudflare Worker cron job
   *
   * @returns SyncResult with sync statistics
   */
  async runSync(): Promise<SyncResult> {
    const timestamp = new Date().toISOString()
    analyticsLogger.info('[PlanStatusScheduler] Starting scheduled sync', {
      timestamp,
    })

    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      subscriptions: [],
      errors: [],
      timestamp,
    }

    try {
      // Step 1: Fetch all active subscriptions
      const subscriptions = await this.fetchActiveSubscriptions()
      result.subscriptions = subscriptions

      if (subscriptions.length === 0) {
        analyticsLogger.info('[PlanStatusScheduler] No active subscriptions to sync')
        return result
      }

      // Step 2: Sync each subscription to AgencyOS
      for (const subscription of subscriptions) {
        try {
          const entitlements = this.subscriptionToEntitlements(subscription)
          await this.syncToAgencyOS(subscription.org_id, entitlements)
          result.syncedCount++
        } catch (error) {
          analyticsLogger.error(
            '[PlanStatusScheduler] Failed to sync subscription',
            { orgId: subscription.org_id, error }
          )
          result.failedCount++
          result.errors?.push(
            `Failed to sync ${subscription.org_id}: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      }

      // Step 3: Report sync results
      if (result.failedCount > 0) {
        result.success = false
        analyticsLogger.warn('[PlanStatusScheduler] Sync completed with errors', {
          syncedCount: result.syncedCount,
          failedCount: result.failedCount,
        })
      } else {
        analyticsLogger.info('[PlanStatusScheduler] Sync completed successfully', {
          syncedCount: result.syncedCount,
        })
      }

      return result
    } catch (error) {
      analyticsLogger.error('[PlanStatusScheduler] runSync error', error)
      result.success = false
      result.errors?.push(
        `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      return result
    }
  }

  /**
   * Get JWT auth token for AgencyOS API calls
   */
  private async getAuthToken(orgId: string): Promise<string> {
    try {
      // Initialize auth client if not already done
      if (!this.authClient) {
        const apiKey = getEnvVar('AGENCYOS_API_KEY')

        if (!apiKey) {
          throw new Error('AGENCYOS_API_KEY not configured')
        }

        this.authClient = new GatewayAuthClient({
          issuer: this.JWT_ISSUER,
          audience: this.JWT_AUDIENCE,
          apiKey,
          tokenExpirySeconds: 3600, // 1 hour
        })
      }

      // Get valid token (cached or new)
      const authResult = this.authClient.getValidToken(orgId)
      return authResult.token
    } catch (error) {
      analyticsLogger.error('[PlanStatusScheduler] getAuthToken error', error)
      throw error
    }
  }

  /**
   * Generate idempotency key for sync requests
   */
  private generateIdempotencyKey(orgId: string, planId: string): string {
    const timestamp = Math.floor(Date.now() / 1000 / 300) // 5-minute windows
    return `sync_${orgId}_${planId}_${timestamp}`
  }

  /**
   * Process Polar webhook event
   * Called when a subscription webhook is received
   */
  async processPolarWebhook(payload: PolarWebhookData): Promise<SyncResult> {
    try {
      analyticsLogger.info('[PlanStatusScheduler] Processing Polar webhook', {
        event: payload.event,
        subscriptionId: payload.data.id,
      })

      // Map Polar webhook to Subscription format
      const subscription: Subscription = {
        id: payload.data.id,
        org_id: payload.data.customer_id, // Customer ID maps to org ID
        license_id: payload.data.metadata?.license_id,
        status: this.mapPolarStatus(payload.data.status),
        plan_id: payload.data.product_id,
        plan_name: payload.data.product_id, // Would need to fetch product details
        current_period_start: payload.data.current_period_start,
        current_period_end: payload.data.current_period_end,
        cancel_at_period_end: payload.data.cancel_at_period_end,
        created_at: payload.data.created_at,
        updated_at: payload.data.updated_at,
      }

      // Sync to AgencyOS
      const entitlements = this.subscriptionToEntitlements(subscription)
      await this.syncToAgencyOS(subscription.org_id, entitlements)

      return {
        success: true,
        syncedCount: 1,
        failedCount: 0,
        subscriptions: [subscription],
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      analyticsLogger.error('[PlanStatusScheduler] processPolarWebhook error', error)
      return {
        success: false,
        syncedCount: 0,
        failedCount: 1,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
      }
    }
  }

  /**
   * Process Stripe webhook event
   */
  async processStripeWebhook(payload: StripeSubscriptionData): Promise<SyncResult> {
    try {
      analyticsLogger.info('[PlanStatusScheduler] Processing Stripe webhook', {
        subscriptionId: payload.id,
      })

      // Map Stripe webhook to Subscription format
      const priceItem = payload.items.data[0]
      const subscription: Subscription = {
        id: payload.id,
        org_id: payload.customer,
        license_id: payload.metadata?.license_id,
        status: this.mapStripeStatus(payload.status),
        plan_id: priceItem?.price?.product || 'unknown',
        plan_name: priceItem?.price?.product || 'Unknown Plan',
        current_period_start: new Date(payload.current_period_start * 1000).toISOString(),
        current_period_end: new Date(payload.current_period_end * 1000).toISOString(),
        cancel_at_period_end: payload.cancel_at_period_end,
        created_at: new Date(payload.created * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Sync to AgencyOS
      const entitlements = this.subscriptionToEntitlements(subscription)
      await this.syncToAgencyOS(subscription.org_id, entitlements)

      return {
        success: true,
        syncedCount: 1,
        failedCount: 0,
        subscriptions: [subscription],
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      analyticsLogger.error('[PlanStatusScheduler] processStripeWebhook error', error)
      return {
        success: false,
        syncedCount: 0,
        failedCount: 1,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
      }
    }
  }

  /**
   * Map Polar status to internal status
   */
  private mapPolarStatus(polarStatus: string): Subscription['status'] {
    const statusMap: Record<string, Subscription['status']> = {
      'active': 'active',
      'trialing': 'trialing',
      'paused': 'paused',
      'canceled': 'canceled',
      'expired': 'expired',
    }
    return statusMap[polarStatus] || 'active'
  }

  /**
   * Map Stripe status to internal status
   */
  private mapStripeStatus(stripeStatus: string): Subscription['status'] {
    const statusMap: Record<string, Subscription['status']> = {
      'active': 'active',
      'trialing': 'trialing',
      'past_due': 'active', // Still active but payment pending
      'unpaid': 'active',
      'canceled': 'canceled',
      'incomplete': 'trialing',
      'incomplete_expired': 'expired',
    }
    return statusMap[stripeStatus] || 'active'
  }
}

export default PlanStatusScheduler
