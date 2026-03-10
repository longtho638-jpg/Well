/**
 * Overage Billing Engine - Phase 6
 *
 * Orchestrates overage detection, invoice creation, and state updates.
 * Integrates OverageCalculator with Stripe invoicing and real-time billing_state sync.
 *
 * Features:
 * - Idempotent overage processing (prevents duplicate invoices)
 * - Real-time billing_state KV store updates
 * - Stripe invoice creation via Edge Function
 * - Complete audit trail in overage_events table
 * - Usage forecasting integration
 *
 * Usage:
 *   const engine = new OverageBillingEngine(supabase, orgId);
 *
 *   // Process usage and detect overage
 *   const result = await engine.processUsage({
 *     metricType: 'tokens',
 *     currentUsage: 125000,
 *     quotaLimit: 100000,
 *     tier: 'pro',
 *   });
 *
 *   // Create invoice for detected overage
 *   if (result.hasOverage) {
 *     await engine.createInvoice(result.overageEvent);
 *   }
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { analyticsLogger } from '@/utils/logger'
import { OverageCalculator, type OverageCalculation, type OverageMetricType } from './overage-calculator'

export interface OverageEvent {
  id?: string
  orgId: string
  userId?: string
  licenseId?: string
  metricType: OverageMetricType
  overageUnits: number
  overageCost: number
  stripeInvoiceId?: string
  stripeInvoiceItemId?: string
  status: 'pending' | 'invoiced' | 'paid' | 'failed' | 'refunded'
  createdAt: Date
  metadata?: Record<string, unknown>
}

export interface BillingState {
  orgId: string
  metricType: string
  currentUsage: number
  quotaLimit: number
  percentageUsed: number
  isExhausted: boolean
  projectedEndOfMonth?: number
  projectedOverageUnits?: number
  projectedOverageCost?: number
  forecastConfidence?: number
  trend?: 'up' | 'down' | 'stable'
}

export interface OverageResult {
  hasOverage: boolean
  calculation?: OverageCalculation
  overageEvent?: OverageEvent
  billingState?: BillingState
  invoiceCreated: boolean
  invoiceId?: string
  error?: string
}

export interface UsageRecord {
  metricType: OverageMetricType
  currentUsage: number
  quotaLimit: number
  tier: string
  userId?: string
  licenseId?: string
}

export interface UsageForecast {
  metricType: string
  currentUsage: number
  projectedEndOfMonth: number
  quotaLimit: number
  projectedOverageUnits: number
  projectedOverageCost: number
  confidence: number
  trend: 'up' | 'down' | 'stable'
  dailyRunRate: number
}

export class OverageBillingEngine {
  private supabase: SupabaseClient
  private calculator: OverageCalculator
  private orgId: string

  constructor(supabase: SupabaseClient, orgId: string) {
    this.supabase = supabase
    this.orgId = orgId
    this.calculator = new OverageCalculator(supabase, orgId)
  }

  /**
   * Process usage record and detect overage
   * Creates invoice automatically if overage detected
   */
  async processUsage(usage: UsageRecord): Promise<OverageResult> {
    const { metricType, currentUsage, quotaLimit, tier, userId, licenseId } = usage

    try {
      // Calculate overage
      const calculation = await this.calculator.calculateOverage({
        metricType,
        currentUsage,
        includedQuota: quotaLimit,
        tier,
      })

      // Check if overage detected
      if (calculation.overageUnits <= 0) {
        // No overage, just update billing state
        await this.updateBillingState({
          orgId: this.orgId,
          metricType,
          currentUsage,
          quotaLimit,
        })

        return {
          hasOverage: false,
          calculation,
          invoiceCreated: false,
        }
      }

      // Overage detected - create event record
      const overageEvent: OverageEvent = {
        orgId: this.orgId,
        userId,
        licenseId,
        metricType,
        overageUnits: calculation.overageUnits,
        overageCost: calculation.totalCost,
        status: 'pending',
        createdAt: new Date(),
      }

      // Save overage event to database
      const savedEvent = await this.saveOverageEvent(overageEvent)
      if (!savedEvent) {
        return {
          hasOverage: true,
          calculation,
          invoiceCreated: false,
          error: 'Failed to save overage event',
        }
      }

      // Create Stripe invoice
      const invoiceResult = await this.createInvoice(savedEvent)

      // Update billing state
      await this.updateBillingState({
        orgId: this.orgId,
        metricType,
        currentUsage,
        quotaLimit,
      })

      return {
        hasOverage: true,
        calculation,
        overageEvent: savedEvent,
        invoiceCreated: invoiceResult.success,
        invoiceId: invoiceResult.invoiceId,
      }
    } catch (error) {
      analyticsLogger.error('[OverageBillingEngine] processUsage error', error)
      return {
        hasOverage: false,
        invoiceCreated: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Create Stripe invoice for overage event
   */
  async createInvoice(event: OverageEvent): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
    try {
      // Check idempotency - ensure we don't create duplicate invoices
      const existingInvoice = await this.findExistingInvoice(event.orgId, event.metricType)
      if (existingInvoice?.stripeInvoiceId) {
        analyticsLogger.info('[OverageBillingEngine] Invoice already exists', {
          orgId: event.orgId,
          metricType: event.metricType,
          invoiceId: existingInvoice.stripeInvoiceId,
        })
        return { success: true, invoiceId: existingInvoice.stripeInvoiceId }
      }

      // Get Stripe customer ID from org
      const stripeCustomerId = await this.getStripeCustomerId(event.orgId)
      if (!stripeCustomerId) {
        return { success: false, error: 'No Stripe customer ID found' }
      }

      // Call Edge Function to create invoice
      const { data, error } = await this.supabase.functions.invoke('stripe-overage-invoice', {
        body: {
          org_id: event.orgId,
          user_id: event.userId,
          metric_type: event.metricType,
          overage_units: event.overageUnits,
          overage_cost: event.overageCost,
          stripe_customer_id: stripeCustomerId,
          idempotency_key: this.generateIdempotencyKey(event.orgId, event.metricType),
        },
      })

      if (error) {
        throw error
      }

      if (!data?.success) {
        return { success: false, error: data?.error || 'Invoice creation failed' }
      }

      // Update overage event with invoice ID
      await this.supabase
        .from('overage_events')
        .update({
          stripe_invoice_id: data.invoice_id,
          stripe_invoice_item_id: data.invoice_item_id,
          status: 'invoiced',
          invoiced_at: new Date().toISOString(),
        })
        .eq('id', event.id)

      analyticsLogger.info('[OverageBillingEngine] Invoice created', {
        orgId: event.orgId,
        invoiceId: data.invoice_id,
        amount: event.overageCost,
      })

      return { success: true, invoiceId: data.invoice_id }
    } catch (error) {
      analyticsLogger.error('[OverageBillingEngine] createInvoice error', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Update billing_state KV store
   */
  async updateBillingState(state: Omit<BillingState, 'percentageUsed' | 'isExhausted'>): Promise<void> {
    try {
      const percentageUsed = state.quotaLimit > 0
        ? Math.round((state.currentUsage / state.quotaLimit) * 100)
        : 0

      const isExhausted = state.currentUsage >= state.quotaLimit && state.quotaLimit > 0

      const { error } = await this.supabase
        .from('billing_state')
        .upsert({
          org_id: state.orgId,
          metric_type: state.metricType,
          current_usage: state.currentUsage,
          quota_limit: state.quotaLimit,
          percentage_used: percentageUsed,
          is_exhausted: isExhausted,
          projected_end_of_month: state.projectedEndOfMonth,
          projected_overage_units: state.projectedOverageUnits,
          projected_overage_cost_cents: state.projectedOverageCost ? Math.round(state.projectedOverageCost * 100) : null,
          forecast_confidence: state.forecastConfidence,
          trend: state.trend,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'org_id,metric_type',
        })

      if (error) {
        throw error
      }

      analyticsLogger.debug('[OverageBillingEngine] Billing state updated', {
        orgId: state.orgId,
        metricType: state.metricType,
        percentageUsed,
        isExhausted,
      })
    } catch (error) {
      analyticsLogger.error('[OverageBillingEngine] updateBillingState error', error)
      // Don't throw - billing state update is non-critical
    }
  }

  /**
   * Get usage forecast for org
   */
  async getForecast(metricType: string, period?: string): Promise<UsageForecast | null> {
    try {
      // Get historical usage data
      const { data: usageHistory } = await this.supabase
        .from('usage_records')
        .select('feature, quantity, recorded_at')
        .eq('org_id', this.orgId)
        .gte('recorded_at', this.getPeriodStart(period))
        .order('recorded_at', { ascending: true })

      if (!usageHistory || usageHistory.length === 0) {
        return null
      }

      // Calculate daily run rate
      const dailyData = this.aggregateByDay(usageHistory, metricType)
      const dailyRunRate = this.calculateDailyRunRate(dailyData)

      // Calculate days remaining in period
      const daysRemaining = this.getDaysRemainingInPeriod(period)

      // Project end of month usage
      const currentUsage = dailyData[dailyData.length - 1]?.value || 0
      const projectedEndOfMonth = currentUsage + (dailyRunRate * daysRemaining)

      // Get quota limit
      const quotaLimit = await this.getQuotaLimit(metricType)

      // Calculate projected overage
      const projectedOverageUnits = Math.max(0, projectedEndOfMonth - quotaLimit)
      const projectedOverageCost = projectedOverageUnits * (await this.getRatePerUnit(metricType))

      // Calculate trend
      const trend = this.calculateTrend(dailyData)

      // Calculate confidence (based on data consistency)
      const confidence = this.calculateConfidence(dailyData)

      return {
        metricType,
        currentUsage,
        projectedEndOfMonth: Math.round(projectedEndOfMonth),
        quotaLimit,
        projectedOverageUnits: Math.round(projectedOverageUnits),
        projectedOverageCost: Math.round(projectedOverageCost * 100) / 100,
        confidence: Math.round(confidence * 100) / 100,
        trend,
        dailyRunRate: Math.round(dailyRunRate),
      }
    } catch (error) {
      analyticsLogger.error('[OverageBillingEngine] getForecast error', error)
      return null
    }
  }

  /**
   * Get overage events for dashboard
   */
  async getOverageEvents(options?: {
    limit?: number
    status?: string
    metricType?: string
  }): Promise<OverageEvent[]> {
    try {
      let query = this.supabase
        .from('overage_events')
        .select('*')
        .eq('org_id', this.orgId)
        .order('created_at', { ascending: false })

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      if (options?.status) {
        query = query.eq('status', options.status)
      }

      if (options?.metricType) {
        query = query.eq('metric_type', options.metricType)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return (data || []).map((item: any) => ({
        id: item.id,
        orgId: item.org_id,
        userId: item.user_id,
        licenseId: item.license_id,
        metricType: item.metric_type,
        overageUnits: item.overage_units,
        overageCost: parseFloat(item.overage_cost),
        stripeInvoiceId: item.stripe_invoice_id,
        stripeInvoiceItemId: item.stripe_invoice_item_id,
        status: item.status,
        createdAt: new Date(item.created_at),
        metadata: item.metadata,
      }))
    } catch (error) {
      analyticsLogger.error('[OverageBillingEngine] getOverageEvents error', error)
      return []
    }
  }

  /**
   * Get total overage cost for billing period
   */
  async getTotalOverageCost(period?: string): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('overage_events')
        .select('overage_cost')
        .eq('org_id', this.orgId)
        .eq('status', 'invoiced')

      if (error) {
        throw error
      }

      return (data || []).reduce((sum, item) => sum + parseFloat(item.overage_cost), 0)
    } catch (error) {
      analyticsLogger.error('[OverageBillingEngine] getTotalOverageCost error', error)
      return 0
    }
  }

  /**
   * Save overage event to database
   */
  private async saveOverageEvent(event: OverageEvent): Promise<OverageEvent | null> {
    try {
      const { data, error } = await this.supabase
        .from('overage_events')
        .insert({
          org_id: event.orgId,
          user_id: event.userId,
          license_id: event.licenseId,
          metric_type: event.metricType,
          overage_units: event.overageUnits,
          overage_cost: event.overageCost,
          status: event.status,
          metadata: event.metadata,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return {
        ...event,
        id: data.id,
        createdAt: new Date(data.created_at),
      }
    } catch (error) {
      analyticsLogger.error('[OverageBillingEngine] saveOverageEvent error', error)
      return null
    }
  }

  /**
   * Find existing invoice for org/metric combination
   */
  private async findExistingInvoice(
    orgId: string,
    metricType: string
  ): Promise<{ stripeInvoiceId?: string } | null> {
    try {
      const { data } = await this.supabase
        .from('overage_events')
        .select('stripe_invoice_id')
        .eq('org_id', orgId)
        .eq('metric_type', metricType)
        .eq('status', 'invoiced')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!data) {
        return null
      }

      return { stripeInvoiceId: data.stripe_invoice_id }
    } catch {
      return null
    }
  }

  /**
   * Get Stripe customer ID from organization
   */
  private async getStripeCustomerId(orgId: string): Promise<string | null> {
    try {
      const { data } = await this.supabase
        .from('organizations')
        .select('stripe_customer_id')
        .eq('id', orgId)
        .single()

      return data?.stripe_customer_id || null
    } catch (error) {
      analyticsLogger.error('[OverageBillingEngine] getStripeCustomerId error', error)
      return null
    }
  }

  /**
   * Generate idempotency key for invoice
   */
  private generateIdempotencyKey(orgId: string, metricType: string): string {
    const period = new Date().toISOString().slice(0, 7) // YYYY-MM
    return `overage_${orgId}_${metricType}_${period}`
  }

  /**
   * Get period start date
   */
  private getPeriodStart(period?: string): string {
    if (period) {
      return `${period}-01`
    }
    return new Date().toISOString().slice(0, 7) + '-01'
  }

  /**
   * Get days remaining in billing period
   */
  private getDaysRemainingInPeriod(period?: string): number {
    const now = new Date()
    const year = period ? parseInt(period.slice(0, 4)) : now.getFullYear()
    const month = period ? parseInt(period.slice(5, 7)) - 1 : now.getMonth()

    const lastDay = new Date(year, month + 1, 0)
    const today = new Date(year, month, now.getDate())

    return Math.max(0, lastDay.getDate() - today.getDate())
  }

  /**
   * Aggregate usage records by day
   */
  private aggregateByDay(
    records: Array<{ feature: string; quantity: number; recorded_at: string }>,
    metricType: string
  ): Array<{ date: string; value: number }> {
    const byDay = new Map<string, number>()

    records.forEach((record) => {
      if (record.feature !== this.mapMetricToFeature(metricType)) {
        return
      }

      const date = record.recorded_at.slice(0, 10) // YYYY-MM-DD
      const current = byDay.get(date) || 0
      byDay.set(date, current + record.quantity)
    })

    return Array.from(byDay.entries()).map(([date, value]) => ({ date, value }))
  }

  /**
   * Calculate daily run rate from historical data
   */
  private calculateDailyRunRate(dailyData: Array<{ date: string; value: number }>): number {
    if (dailyData.length === 0) return 0

    const totalValue = dailyData.reduce((sum, d) => sum + d.value, 0)
    return totalValue / dailyData.length
  }

  /**
   * Calculate trend from daily data
   */
  private calculateTrend(dailyData: Array<{ date: string; value: number }>): 'up' | 'down' | 'stable' {
    if (dailyData.length < 2) return 'stable'

    // Simple linear regression slope
    const n = dailyData.length
    const mid = Math.floor(n / 2)

    const firstHalf = dailyData.slice(0, mid).reduce((s, d) => s + d.value, 0) / mid
    const secondHalf = dailyData.slice(mid).reduce((s, d) => s + d.value, 0) / (n - mid)

    const change = (secondHalf - firstHalf) / firstHalf

    if (change > 0.1) return 'up'
    if (change < -0.1) return 'down'
    return 'stable'
  }

  /**
   * Calculate forecast confidence based on data consistency
   */
  private calculateConfidence(dailyData: Array<{ date: string; value: number }>): number {
    if (dailyData.length < 3) return 0.5

    const mean = dailyData.reduce((s, d) => s + d.value, 0) / dailyData.length
    const variance = dailyData.reduce((s, d) => s + Math.pow(d.value - mean, 2), 0) / dailyData.length
    const stdDev = Math.sqrt(variance)

    // Coefficient of variation (lower = more consistent)
    const cv = stdDev / mean

    // Map CV to confidence (0-1)
    if (cv < 0.1) return 0.95
    if (cv < 0.2) return 0.85
    if (cv < 0.3) return 0.75
    if (cv < 0.5) return 0.65
    return 0.5
  }

  /**
   * Get quota limit for metric type
   */
  private async getQuotaLimit(metricType: string): Promise<number> {
    try {
      const { data } = await this.supabase
        .from('billing_state')
        .select('quota_limit')
        .eq('org_id', this.orgId)
        .eq('metric_type', metricType)
        .single()

      return data?.quota_limit || 0
    } catch {
      return 0
    }
  }

  /**
   * Get rate per unit for metric
   */
  private async getRatePerUnit(metricType: string): Promise<number> {
    try {
      const tier = await this.getOrgTier()
      return await this.calculator.getRatePerUnit(metricType as OverageMetricType, tier)
    } catch {
      return 0
    }
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
    } catch {
      return 'basic'
    }
  }

  /**
   * Map metric type to usage_records feature name
   */
  private mapMetricToFeature(metricType: string): string {
    const mapping: Record<string, string> = {
      api_calls: 'api_call',
      tokens: 'tokens',
      compute_minutes: 'compute_ms',
      model_inferences: 'model_inference',
      agent_executions: 'agent_execution',
    }
    return mapping[metricType] || metricType
  }
}

export default OverageBillingEngine
