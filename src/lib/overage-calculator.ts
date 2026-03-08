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

export type OverageMetricType =
  | 'api_calls'
  | 'ai_calls'
  | 'tokens'
  | 'compute_minutes'
  | 'storage_gb'
  | 'emails'
  | 'model_inferences'
  | 'agent_executions'

export interface OverageCalculation {
  metricType: OverageMetricType
  totalUsage: number
  includedQuota: number
  overageUnits: number
  ratePerUnit: number
  totalCost: number
  currency: string
  tier: string
  calculationDate: string
}

export interface OverageTransaction {
  id?: string
  orgId: string
  tenantId?: string
  userId?: string
  licenseId?: string
  metricType: OverageMetricType
  billingPeriod: string
  totalUsage: number
  includedQuota: number
  overageUnits: number
  ratePerUnit: number
  totalCost: number
  currency?: string
  stripeSubscriptionItemId?: string
  idempotencyKey?: string
  metadata?: Record<string, unknown>
}

export interface OverageRates {
  free: number
  basic: number
  pro: number
  enterprise: number
  master: number
}

export interface QuotaContext {
  baseQuota: number
  tenantOverride?: number
  gracePeriodBoost?: number
  effectiveQuota: number
}

/**
 * Default overage rates (fallback if database not available)
 * Rates in USD per unit
 */
const DEFAULT_OVERAGE_RATES: Record<OverageMetricType, OverageRates> = {
  api_calls: { free: 0.001, basic: 0.0008, pro: 0.0005, enterprise: 0.0003, master: 0.0001 },
  ai_calls: { free: 0.05, basic: 0.04, pro: 0.03, enterprise: 0.02, master: 0.01 },
  tokens: { free: 0.000004, basic: 0.000003, pro: 0.000002, enterprise: 0.000001, master: 0.0000005 },
  compute_minutes: { free: 0.01, basic: 0.008, pro: 0.005, enterprise: 0.003, master: 0.001 },
  storage_gb: { free: 0.5, basic: 0.4, pro: 0.3, enterprise: 0.2, master: 0.1 },
  emails: { free: 0.002, basic: 0.0015, pro: 0.001, enterprise: 0.0005, master: 0.0002 },
  model_inferences: { free: 0.02, basic: 0.015, pro: 0.01, enterprise: 0.005, master: 0.0025 },
  agent_executions: { free: 0.1, basic: 0.08, pro: 0.05, enterprise: 0.03, master: 0.015 },
}

export class OverageCalculator {
  private supabase: SupabaseClient
  private orgId: string
  private rateCache: Map<string, number> = new Map()
  private rateCacheExpiry: Map<string, number> = new Map()
  private readonly CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

  constructor(supabase: SupabaseClient, orgId: string) {
    this.supabase = supabase
    this.orgId = orgId
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
    const { metricType, currentUsage, includedQuota, tier, tenantId } = params

    // Handle unlimited quota (-1 means unlimited)
    if (includedQuota === -1) {
      return {
        metricType,
        totalUsage: currentUsage,
        includedQuota: -1,
        overageUnits: 0,
        ratePerUnit: 0,
        totalCost: 0,
        currency: 'USD',
        tier,
        calculationDate: new Date().toISOString(),
      }
    }

    // Calculate effective quota (Phase 6 integration)
    const effectiveQuota = await this.getEffectiveQuota({
      baseQuota: includedQuota,
      tenantId,
      metricType,
    })

    // Calculate overage units
    const overageUnits = Math.max(0, currentUsage - effectiveQuota)

    // Get rate per unit
    const ratePerUnit = await this.getRatePerUnit(metricType, tier)

    // Calculate total cost
    const totalCost = this.calculateCost(overageUnits, ratePerUnit)

    return {
      metricType,
      totalUsage: currentUsage,
      includedQuota: effectiveQuota,
      overageUnits,
      ratePerUnit,
      totalCost,
      currency: 'USD',
      tier,
      calculationDate: new Date().toISOString(),
    }
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

      // Generate idempotency key
      const period = billingPeriod || this.getCurrentBillingPeriod()
      const idempotencyKey = this.generateIdempotencyKey(metricType, period)

      // Check if already recorded (idempotency)
      const existing = await this.findExistingTransaction(idempotencyKey)
      if (existing) {
        console.log('[OverageCalculator] Transaction already exists:', existing.id)
        return { success: true, transactionId: existing.id }
      }

      // Get rate per unit
      const tier = await this.getOrgTier()
      const ratePerUnit = await this.getRatePerUnit(metricType, tier)

      // Create transaction
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
        ratePerUnit,
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
          rate_per_unit: transaction.ratePerUnit,
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
        console.error('[OverageCalculator] Insert error:', error)
        return { success: false, error: error.message }
      }

      console.log('[OverageCalculator] Transaction created:', data.id)
      return { success: true, transactionId: data.id }
    } catch (err) {
      console.error('[OverageCalculator] Error:', err)
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
  }): Promise<Array<{
    id: string
    metricType: OverageMetricType
    overageUnits: number
    totalCost: number
    billingPeriod: string
    createdAt: string
  }>> {
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
        console.error('[OverageCalculator] Fetch error:', error)
        return []
      }

      return (data || []).map((item: any) => ({
        id: item.id,
        metricType: item.metric_type,
        overageUnits: item.overage_units,
        totalCost: parseFloat(item.total_cost),
        billingPeriod: item.billing_period,
        createdAt: item.created_at,
      }))
    } catch (err) {
      console.error('[OverageCalculator] Error:', err)
      return []
    }
  }

  /**
   * Get total overage cost for billing period
   */
  async getTotalOverageCost(billingPeriod?: string): Promise<{
    totalCost: number
    totalTransactions: number
    breakdownByMetric: Record<string, number>
  }> {
    try {
      let query = this.supabase
        .from('overage_transactions')
        .select('metric_type, total_cost')
        .eq('org_id', this.orgId)

      const period = billingPeriod || this.getCurrentBillingPeriod()
      query = query.eq('billing_period', period)

      const { data, error } = await query

      if (error) {
        console.error('[OverageCalculator] Fetch error:', error)
        return { totalCost: 0, totalTransactions: 0, breakdownByMetric: {} }
      }

      const breakdownByMetric: Record<string, number> = {}
      let totalCost = 0

      data?.forEach((item: any) => {
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
      console.error('[OverageCalculator] Error:', err)
      return { totalCost: 0, totalTransactions: 0, breakdownByMetric: {} }
    }
  }

  /**
   * Get effective quota with Phase 6 integration
   * Effective Quota = Base + Tenant Override + Grace Period Boost
   */
  private async getEffectiveQuota(params: {
    baseQuota: number
    tenantId?: string
    metricType: string
  }): Promise<number> {
    const { baseQuota, tenantId, metricType } = params

    if (!tenantId) {
      return baseQuota
    }

    try {
      // Get tenant quota override (Phase 6)
      const { data: override } = await this.supabase
        .from('tenant_quota_overrides')
        .select('quota_limit')
        .eq('tenant_id', tenantId)
        .eq('metric_type', this.mapMetricToColumnType(metricType))
        .eq('active', true)
        .single()

      if (override?.quota_limit) {
        console.log('[OverageCalculator] Tenant override applied:', override.quota_limit)
        return override.quota_limit
      }

      // TODO: Add grace period boost from Phase 6
      // const graceBoost = await this.getGracePeriodBoost(tenantId, metricType);
      // return baseQuota + graceBoost;

      return baseQuota
    } catch (err) {
      // No override found, return base quota
      return baseQuota
    }
  }

  /**
   * Get rate per unit from database or cache
   */
  private async getRatePerUnit(metricType: OverageMetricType, tier: string): Promise<number> {
    const cacheKey = `${metricType}_${tier}`

    // Check cache first
    const cached = this.rateCache.get(cacheKey)
    const cacheExpiry = this.rateCacheExpiry.get(cacheKey)

    if (cached && cacheExpiry && Date.now() < cacheExpiry) {
      return cached
    }

    try {
      // Fetch from database
      const { data, error } = await this.supabase
        .from('overage_rates')
        .select('*')
        .eq('metric_type', metricType)
        .single()

      if (error || !data) {
        // Fallback to default rates
        const rate = this.getFallbackRate(metricType, tier)
        this.setCache(cacheKey, rate)
        return rate
      }

      // Extract rate based on tier
      const rateField = `${tier}_rate`
      const rate = parseFloat((data as any)[rateField] || '0')
      this.setCache(cacheKey, rate)
      return rate
    } catch (err) {
      // Fallback to default rates
      const rate = this.getFallbackRate(metricType, tier)
      this.setCache(cacheKey, rate)
      return rate
    }
  }

  /**
   * Get fallback rate from hardcoded defaults
   */
  private getFallbackRate(metricType: OverageMetricType, tier: string): number {
    const rates = DEFAULT_OVERAGE_RATES[metricType]
    if (!rates) {
      return 0
    }

    const tierKey = tier.toLowerCase() as keyof OverageRates
    return rates[tierKey] || rates.basic
  }

  /**
   * Calculate cost from units and rate
   */
  private calculateCost(units: number, ratePerUnit: number): number {
    return Math.round(units * ratePerUnit * 100) / 100
  }

  /**
   * Generate idempotency key
   */
  private generateIdempotencyKey(metricType: string, billingPeriod: string): string {
    return `ovg_${this.orgId}_${metricType}_${billingPeriod}`
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
    } catch (err) {
      return null
    }
  }

  /**
   * Get current billing period (YYYY-MM format)
   */
  private getCurrentBillingPeriod(): string {
    return new Date().toISOString().slice(0, 7) // '2026-03'
  }

  /**
   * Get org tier from subscription
   */
  private async getOrgTier(): Promise<string> {
    try {
      const { data } = await this.supabase
        .from('user_subscriptions')
        .select('plan_slug')
        .eq('org_id', this.orgId)
        .eq('status', 'active')
        .single()

      return data?.plan_slug || 'basic'
    } catch (err) {
      return 'basic'
    }
  }

  /**
   * Set rate cache with expiry
   */
  private setCache(key: string, value: number): void {
    this.rateCache.set(key, value)
    this.rateCacheExpiry.set(key, Date.now() + this.CACHE_TTL_MS)
  }

  /**
   * Map metric type to database column name
   */
  private mapMetricToColumnType(metricType: string): string {
    // Map from snake_case to the format used in tenant_quota_overrides
    const mapping: Record<string, string> = {
      api_calls: 'api_calls_per_day',
      ai_calls: 'ai_calls_per_day',
      tokens: 'tokens_per_day',
      compute_minutes: 'compute_minutes_per_day',
      storage_gb: 'storage_gb',
      emails: 'emails_per_day',
      model_inferences: 'model_inferences_per_day',
      agent_executions: 'agent_executions_per_day',
    }
    return mapping[metricType] || metricType
  }

  /**
   * Sync overage to Stripe (trigger Stripe Usage Record creation)
   */
  async syncToStripe(transactionId: string): Promise<{
    success: boolean
    stripeUsageRecordId?: string
    error?: string
  }> {
    try {
      // Get transaction details
      const { data: transaction, error: fetchError } = await this.supabase
        .from('overage_transactions')
        .select('*')
        .eq('id', transactionId)
        .single()

      if (fetchError || !transaction) {
        return { success: false, error: 'Transaction not found' }
      }

      if (!transaction.stripe_subscription_item_id) {
        return { success: false, error: 'No Stripe subscription item ID' }
      }

      // Call Stripe Edge Function
      const { data, error } = await this.supabase.functions.invoke('stripe-usage-record', {
        body: {
          subscription_item_id: transaction.stripe_subscription_item_id,
          usage_records: [
            {
              subscription_item: transaction.stripe_subscription_item_id,
              quantity: transaction.overage_units,
              timestamp: Math.floor(new Date(transaction.created_at).getTime() / 1000),
              action: 'increment',
            },
          ],
          feature: transaction.metric_type,
          idempotency_key: transaction.idempotency_key,
        },
      })

      if (error) {
        return { success: false, error: error.message }
      }

      // Update transaction with Stripe sync status
      await this.supabase
        .from('overage_transactions')
        .update({
          stripe_sync_status: 'synced',
          stripe_synced_at: new Date().toISOString(),
        })
        .eq('id', transactionId)

      return {
        success: true,
        stripeUsageRecordId: data?.id,
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }
    }
  }
}

export default OverageCalculator
