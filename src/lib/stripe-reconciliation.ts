/**
 * Stripe Reconciliation Service
 *
 * Reconciles local usage aggregations with Stripe billing records.
 * Handles disputes, adjustments, and periodic sync verification.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  StripeUsageRecord,
  LocalAggregationRecord,
  ReconciliationResult,
  BillingPeriodReport,
  AdjustmentOptions,
} from './stripe-reconciliation-types'

/**
 * Reconciliation configuration
 */
export interface ReconciliationConfig {
  /** Enable debug logging */
  debug?: boolean
}

/**
 * Stripe Reconciliation Service
 */
export class StripeReconciliation {
  private supabase: SupabaseClient
   
  private config: ReconciliationConfig

  constructor(supabase: SupabaseClient, config: ReconciliationConfig = {}) {
    this.supabase = supabase
    this.config = config
  }

  /**
   * Reconcile billing period
   */
  async reconcileBillingPeriod(params: {
    subscriptionItemId: string
    periodStart: string
    periodEnd: string
  }): Promise<BillingPeriodReport> {
    const { subscriptionItemId, periodStart, periodEnd } = params

    // Fetch local aggregations
    const localRecords = await this.fetchLocalAggregations(periodStart, periodEnd)

    // Fetch Stripe records
    const stripeRecords = await this.fetchStripeRecords(subscriptionItemId, periodStart, periodEnd)

    // Reconcile
    const reconciled = this.reconcileRecords(localRecords, stripeRecords)

    const totalLocal = localRecords.reduce((sum, r) => sum + r.total_quantity, 0)
    const totalStripe = stripeRecords.reduce((sum, r) => sum + r.quantity, 0)

    return {
      subscriptionItemId,
      periodStart,
      periodEnd,
      totalLocalUsage: totalLocal,
      totalStripeUsage: totalStripe,
      reconciledRecords: reconciled,
      unreconciledRecords: localRecords.filter(r => !r.is_synced_to_stripe),
      adjustmentsNeeded: reconciled.filter(r => r.needsAdjustment).length,
    }
  }

  /**
   * Fetch local aggregations from database
   */
  private async fetchLocalAggregations(
    periodStart: string,
    periodEnd: string
  ): Promise<LocalAggregationRecord[]> {
    const { data, error } = await this.supabase
      .from('usage_aggregations')
      .select('*')
      .gte('period_start', periodStart)
      .lt('period_end', periodEnd)

    if (error) {
      console.error('[StripeReconciliation] Fetch local error:', error)
      return []
    }

    return (data as LocalAggregationRecord[]) || []
  }

  /**
   * Fetch Stripe usage records
   */
  private async fetchStripeRecords(
    subscriptionItemId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<StripeUsageRecord[]> {
    // Call Stripe API via edge function
    const { data, error } = await this.supabase.functions.invoke('stripe-get-usage', {
      body: {
        subscription_item_id: subscriptionItemId,
        period_start: periodStart,
        period_end: periodEnd,
      },
    })

    if (error) {
      console.error('[StripeReconciliation] Fetch Stripe error:', error)
      return []
    }

    return (data?.records as StripeUsageRecord[]) || []
  }

  /**
   * Reconcile local vs Stripe records
   */
  private reconcileRecords(
    local: LocalAggregationRecord[],
    stripe: StripeUsageRecord[]
  ): ReconciliationResult[] {
    return local.map(localRecord => {
      const matchingStripe = stripe.find(s =>
        Math.abs(s.timestamp - new Date(localRecord.period_start).getTime() / 1000) < 86400
      )

      const stripeQty = matchingStripe?.quantity || 0
      const difference = localRecord.total_quantity - stripeQty

      return {
        match: Math.abs(difference) < 0.01,
        localQuantity: localRecord.total_quantity,
        stripeQuantity: stripeQty,
        difference,
        needsAdjustment: Math.abs(difference) > 0.01 && !localRecord.is_synced_to_stripe,
      }
    })
  }

  /**
   * Create adjustment record
   */
  async createAdjustment(options: AdjustmentOptions): Promise<boolean> {
    const { subscriptionItemId, quantity, reason, idempotencyKey } = options

    try {
      const { error } = await this.supabase.functions.invoke('stripe-create-adjustment', {
        body: {
          subscription_item_id: subscriptionItemId,
          quantity,
          reason,
          idempotency_key: idempotencyKey,
        },
      })

      return !error
    } catch {
      return false
    }
  }

  /**
   * Get reconciliation status for license
   */
  async getReconciliationStatus(licenseId: string): Promise<{
    lastSyncedAt: string | null
    pendingSync: number
    totalSynced: number
  }> {
    const { data, error } = await this.supabase
      .from('usage_aggregations')
      .select('synced_at, is_synced_to_stripe')
      .eq('license_id', licenseId)

    if (error) {
      console.error('[StripeReconciliation] Status error:', error)
      return { lastSyncedAt: null, pendingSync: 0, totalSynced: 0 }
    }

    const synced = data?.filter(r => r.is_synced_to_stripe) || []
    const pending = data?.filter(r => !r.is_synced_to_stripe) || []
    const lastSynced = synced.sort((a, b) =>
      new Date(b.synced_at || 0).getTime() - new Date(a.synced_at || 0).getTime()
    )[0]?.synced_at || null

    return {
      lastSyncedAt: lastSynced,
      pendingSync: pending.length,
      totalSynced: synced.length,
    }
  }
}
