/**
 * Overage Calculator - Phase 7.1
 *
 * Calculates overage units and costs when usage exceeds licensed quotas.
 * Supports multiple metric types with tiered pricing.
 *
 * Usage:
 *   const calculator = new OverageCalculator(supabase, orgId);
 *   const result = await calculator.calculateOverage({
 *     metricType: 'api_calls',
 *     currentUsage: 15000,
 *     includedQuota: 10000,
 *     tier: 'pro'
 *   });
 *
 *   await calculator.trackOverage({
 *     metricType: 'api_calls',
 *     overageUnits: 5000,
 *     totalCost: 2.50
 *   });
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  OverageMetricType,
  OverageCalculation,
  OverageHistoryEntry,
  OverageSummary,
  StripeSyncResult,
} from './overage-calculator-types'
import { OverageComputation } from './overage-computation'
import { OverageTransactionWriter } from './overage-transaction-writer'
import { OverageRateFetcher } from './overage-rate-fetcher'

// Re-export types
export type {
  OverageMetricType,
  OverageCalculation,
  OverageTransaction,
  OverageRates,
  QuotaContext,
  OverageHistoryEntry,
  OverageSummary,
  StripeSyncResult,
} from './overage-calculator-types'

// Re-export default rates
export { DEFAULT_OVERAGE_RATES } from './overage-rate-fetcher'

export class OverageCalculator {
  private computation: OverageComputation
  private transactionWriter: OverageTransactionWriter
  private rateFetcher: OverageRateFetcher

  constructor(supabase: SupabaseClient, orgId: string) {
    this.computation = new OverageComputation(supabase, orgId)
    this.transactionWriter = new OverageTransactionWriter(supabase, orgId)
    this.rateFetcher = new OverageRateFetcher(supabase, orgId)
  }

  /**
   * Calculate overage units and cost
   */
  async calculateOverage(params: {
    metricType: OverageMetricType
    currentUsage: number
    includedQuota: number
    tier: string
    tenantId?: string
  }): Promise<OverageCalculation> {
    return this.computation.calculateOverage(params)
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
    return this.transactionWriter.trackOverage(params)
  }

  /**
   * Get overage history for dashboard
   */
  async getOverageHistory(options?: {
    billingPeriod?: string
    metricType?: OverageMetricType
    limit?: number
  }): Promise<OverageHistoryEntry[]> {
    return this.transactionWriter.getOverageHistory(options)
  }

  /**
   * Get total overage cost for billing period
   */
  async getTotalOverageCost(billingPeriod?: string): Promise<OverageSummary> {
    return this.transactionWriter.getTotalOverageCost(billingPeriod)
  }

  /**
   * Get rate per unit (exposed for testing/advanced usage)
   */
  async getRatePerUnit(metricType: OverageMetricType, tier: string): Promise<number> {
    return this.rateFetcher.getRatePerUnit(metricType, tier)
  }

  /**
   * Get org tier (exposed for testing/advanced usage)
   */
  async getOrgTier(): Promise<string> {
    return this.rateFetcher.getOrgTier()
  }

  /**
   * Sync overage to Stripe
   */
  async syncToStripe(transactionId: string): Promise<StripeSyncResult> {
    return this.transactionWriter.syncToStripe(transactionId)
  }
}

export default OverageCalculator
