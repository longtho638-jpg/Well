/**
 * Overage Transaction Writer
 *
 * Handles persistence of overage transactions to database.
 * Manages idempotency and transaction history.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { analyticsLogger } from '@/utils/logger'
import type {
  OverageMetricType,
  OverageTransaction,
  OverageHistoryEntry,
  OverageSummary,
  StripeSyncResult,
} from './overage-calculator-types'
import { OverageStripeSync } from './overage-stripe-sync'

/**
 * Raw database row type for overage transactions
 */
interface OverageTransactionRow {
  id: string
  metric_type: OverageMetricType
  overage_units: number
  total_cost: string
  billing_period: string
  created_at: string
}

export class OverageTransactionWriter {
  private supabase: SupabaseClient
  private orgId: string
  private stripeSync: OverageStripeSync

  constructor(supabase: SupabaseClient, orgId: string) {
    this.supabase = supabase
    this.orgId = orgId
    this.stripeSync = new OverageStripeSync(supabase)
  }

  /**
   * Track overage transaction in database
   */
  async trackOverage(params: {
    metricType: OverageMetricType
    overageUnits: number
    totalCost: number
    totalUsage: number
    includedQuota: number
    tenantId?: string
    userId?: string
    licenseId?: string
    billingPeriod?: string
    stripeSubscriptionItemId?: string
    metadata?: Record<string, unknown>
  }): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const {
        metricType,
        overageUnits,
        totalCost,
        totalUsage,
        includedQuota,
        tenantId,
        userId,
        licenseId,
        billingPeriod,
        stripeSubscriptionItemId,
        metadata,
      } = params

      const period = billingPeriod || this.getCurrentBillingPeriod()
      const idempotencyKey = this.generateIdempotencyKey(metricType, period)

      const existing = await this.findExistingTransaction(idempotencyKey)
      if (existing) {
        return { success: true, transactionId: existing.id }
      }

      const transaction: OverageTransaction = {
        orgId: this.orgId,
        tenantId,
        userId,
        licenseId,
        metricType,
        billingPeriod: period,
        totalUsage,
        includedQuota,
        overageUnits,
        ratePerUnit: overageUnits > 0 ? totalCost / overageUnits : 0,
        totalCost,
        currency: 'USD',
        stripeSubscriptionItemId,
        idempotencyKey,
        metadata: metadata || {},
      }

      const { data, error } = await this.supabase
        .from('overage_transactions')
        .insert({
          org_id: transaction.orgId,
          tenant_id: transaction.tenantId,
          user_id: transaction.userId,
          license_id: transaction.licenseId,
          metric_type: transaction.metricType,
          billing_period: transaction.billingPeriod,
          total_usage: transaction.totalUsage,
          included_quota: transaction.includedQuota,
          overage_units: transaction.overageUnits,
          rate_per_unit: params.overageUnits > 0 ? totalCost / params.overageUnits : 0,
          total_cost: transaction.totalCost,
          currency: transaction.currency,
          stripe_subscription_item_id: transaction.stripeSubscriptionItemId,
          stripe_sync_status: 'pending',
          metadata: transaction.metadata,
          idempotency_key: transaction.idempotencyKey,
        })
        .select('id')
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, transactionId: data.id }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }
    }
  }

  /**
   * Get overage history for dashboard
   */
  async getOverageHistory(options?: {
    billingPeriod?: string
    metricType?: OverageMetricType
    limit?: number
  }): Promise<OverageHistoryEntry[]> {
    try {
      let query = this.supabase
        .from('overage_transactions')
        .select('id, metric_type, overage_units, total_cost, billing_period, created_at')
        .eq('org_id', this.orgId)
        .order('created_at', { ascending: false })

      if (options?.billingPeriod) {
        query = query.eq('billing_period', options.billingPeriod)
      }

      if (options?.metricType) {
        query = query.eq('metric_type', options.metricType)
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) {
        analyticsLogger.error('[OverageTransactionWriter] Fetch error', error)
        return []
      }

      return (data || []).map((item: OverageTransactionRow) => ({
        id: item.id,
        metricType: item.metric_type,
        overageUnits: item.overage_units,
        totalCost: parseFloat(item.total_cost),
        billingPeriod: item.billing_period,
        createdAt: item.created_at,
      }))
    } catch (err) {
      analyticsLogger.error('[OverageTransactionWriter] Error', err)
      return []
    }
  }

  /**
   * Get total overage cost for billing period
   */
  async getTotalOverageCost(billingPeriod?: string): Promise<OverageSummary> {
    try {
      let query = this.supabase
        .from('overage_transactions')
        .select('metric_type, total_cost')
        .eq('org_id', this.orgId)

      const period = billingPeriod || this.getCurrentBillingPeriod()
      query = query.eq('billing_period', period)

      const { data, error } = await query

      if (error) {
        analyticsLogger.error('[OverageTransactionWriter] Fetch error', error)
        return { totalCost: 0, totalTransactions: 0, breakdownByMetric: {} }
      }

      const breakdownByMetric: Record<string, number> = {}
      let totalCost = 0

      data?.forEach((item: { metric_type: string; total_cost: string }) => {
        const cost = parseFloat(item.total_cost)
        totalCost += cost
        breakdownByMetric[item.metric_type] = (breakdownByMetric[item.metric_type] || 0) + cost
      })

      return {
        totalCost: Math.round(totalCost * 100) / 100,
        totalTransactions: data?.length || 0,
        breakdownByMetric,
      }
    } catch (err) {
      analyticsLogger.error('[OverageTransactionWriter] Error', err)
      return { totalCost: 0, totalTransactions: 0, breakdownByMetric: {} }
    }
  }

  /**
   * Sync overage to Stripe
   */
  async syncToStripe(transactionId: string): Promise<StripeSyncResult> {
    return this.stripeSync.syncToStripe(transactionId)
  }

  /**
   * Find existing transaction by idempotency key
   */
  private async findExistingTransaction(idempotencyKey: string): Promise<{ id: string } | null> {
    try {
      const { data } = await this.supabase
        .from('overage_transactions')
        .select('id')
        .eq('idempotency_key', idempotencyKey)
        .single()

      return data || null
    } catch {
      return null
    }
  }

  /**
   * Get current billing period (YYYY-MM format)
   */
  private getCurrentBillingPeriod(): string {
    return new Date().toISOString().slice(0, 7)
  }

  /**
   * Generate idempotency key
   */
  private generateIdempotencyKey(metricType: string, billingPeriod: string): string {
    return `ovg_${this.orgId}_${metricType}_${billingPeriod}`
  }
}
