/**
 * Plan Status Scheduler - Sync subscriptions to AgencyOS
 */

// Declare Deno global for type checking
declare const Deno: { env: { get: (key: string) => string | undefined } } | undefined

import { analyticsLogger } from '@/utils/logger'
import { GatewayAuthClient } from '@/lib/gateway-auth-client'
import type { Subscription, SyncResult, PolarWebhookData, StripeSubscriptionData } from './plan-status-types'
import {
  subscriptionToEntitlements,
  generateIdempotencyKey,
  polarWebhookToSubscription,
  stripeWebhookToSubscription,
  fetchPolarSubscriptions,
  fetchStripeSubscriptions,
} from './plan-status-helpers'

function getEnvVar(key: string): string | undefined {
  // eslint-disable-next-line no-undef
  const hasDeno = typeof Deno !== 'undefined'
  // eslint-disable-next-line no-undef
  if (hasDeno) return (Deno as any).env.get(key)
  if (typeof process !== 'undefined' && process.env) return process.env[key]
  return undefined
}

export class PlanStatusScheduler {
  private readonly AGENCYOS_API_URL: string
  private authClient?: GatewayAuthClient
  private readonly JWT_ISSUER = 'wellnexus.vn'
  private readonly JWT_AUDIENCE = 'agencyos.network'

  constructor() {
    this.AGENCYOS_API_URL =
      getEnvVar('AGENCYOS_API_URL') || 'https://agencyos.network/api/internal'
  }

  async fetchActiveSubscriptions(): Promise<Subscription[]> {
    analyticsLogger.info('[PlanStatusScheduler] Fetching active subscriptions')

    const polarSubs = await fetchPolarSubscriptions()
    const stripeSubs = await fetchStripeSubscriptions()
    const subscriptions = [...polarSubs, ...stripeSubs]

    analyticsLogger.info('[PlanStatusScheduler] Fetched subscriptions', {
      count: subscriptions.length,
      polarCount: polarSubs.length,
      stripeCount: stripeSubs.length,
    })

    return subscriptions
  }

  async syncToAgencyOS(orgId: string, _subscription: Subscription): Promise<boolean> {
    try {
      analyticsLogger.info('[PlanStatusScheduler] Syncing to AgencyOS', {
        orgId,
        planId: _subscription.plan_id,
      })

      const token = await this.getAuthToken(orgId)
      const payload = {
        org_id: orgId,
        entitlements: subscriptionToEntitlements(_subscription),
        sync_timestamp: new Date().toISOString(),
      }

      const response = await fetch(`${this.AGENCYOS_API_URL}/plan/entitlements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Idempotency-Key': generateIdempotencyKey(orgId, _subscription.plan_id),
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `API error: ${response.status}`)
      }

      analyticsLogger.info('[PlanStatusScheduler] AgencyOS sync successful', { orgId })
      return true
    } catch (error) {
      analyticsLogger.error('[PlanStatusScheduler] syncToAgencyOS error', error)
      throw error
    }
  }

  async runSync(): Promise<SyncResult> {
    const timestamp = new Date().toISOString()
    analyticsLogger.info('[PlanStatusScheduler] Starting scheduled sync', { timestamp })

    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      subscriptions: [],
      errors: [],
      timestamp,
    }

    const subscriptions = await this.fetchActiveSubscriptions()
    result.subscriptions = subscriptions

    if (subscriptions.length === 0) {
      analyticsLogger.info('[PlanStatusScheduler] No active subscriptions to sync')
      return result
    }

    for (const subscription of subscriptions) {
      try {
        await this.syncToAgencyOS(subscription.org_id, subscription)
        result.syncedCount++
      } catch (error) {
        analyticsLogger.error('[PlanStatusScheduler] Failed to sync subscription', {
          orgId: subscription.org_id,
          error,
        })
        result.failedCount++
        result.errors?.push(
          `Failed to sync ${subscription.org_id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

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
  }

  async processPolarWebhook(payload: PolarWebhookData): Promise<SyncResult> {
    try {
      analyticsLogger.info('[PlanStatusScheduler] Processing Polar webhook', {
        event: payload.event,
        subscriptionId: payload.data.id,
      })
      const subscription = polarWebhookToSubscription(payload)
      await this.syncToAgencyOS(subscription.org_id, subscription)
      return { success: true, syncedCount: 1, failedCount: 0, subscriptions: [subscription], timestamp: new Date().toISOString() }
    } catch (error) {
      analyticsLogger.error('[PlanStatusScheduler] processPolarWebhook error', error)
      return { success: false, syncedCount: 0, failedCount: 1, errors: [error instanceof Error ? error.message : 'Unknown error'], timestamp: new Date().toISOString() }
    }
  }

  async processStripeWebhook(payload: StripeSubscriptionData): Promise<SyncResult> {
    try {
      analyticsLogger.info('[PlanStatusScheduler] Processing Stripe webhook', { subscriptionId: payload.id })
      const subscription = stripeWebhookToSubscription(payload)
      await this.syncToAgencyOS(subscription.org_id, subscription)
      return { success: true, syncedCount: 1, failedCount: 0, subscriptions: [subscription], timestamp: new Date().toISOString() }
    } catch (error) {
      analyticsLogger.error('[PlanStatusScheduler] processStripeWebhook error', error)
      return { success: false, syncedCount: 0, failedCount: 1, errors: [error instanceof Error ? error.message : 'Unknown error'], timestamp: new Date().toISOString() }
    }
  }

  private async getAuthToken(orgId: string): Promise<string> {
    if (!this.authClient) {
      const apiKey = getEnvVar('AGENCYOS_API_KEY')
      if (!apiKey) throw new Error('AGENCYOS_API_KEY not configured')

      this.authClient = new GatewayAuthClient({
        issuer: this.JWT_ISSUER,
        audience: this.JWT_AUDIENCE,
        apiKey,
        tokenExpirySeconds: 3600,
      })
    }

    const result = await this.authClient.getValidToken(orgId)
    return result.token
  }
}

export default PlanStatusScheduler
