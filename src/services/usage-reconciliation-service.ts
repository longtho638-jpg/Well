/**
 * Usage Reconciliation Service
 *
 * Automated daily reconciliation between RaaS Gateway and Stripe/Polar billing events.
 * Detects discrepancies, auto-heals minor mismatches (<5%), and alerts on major differences.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { analyticsLogger } from '@/utils/logger'
import type { ReconciliationConfig, ReconciliationResult } from './usage-reconciliation-types'
import {
  fetchGatewayUsage,
  fetchStripeUsage,
  fetchPolarUsage,
  autoHealDiscrepancy,
  sendReconciliationAlert,
  logReconciliation,
  getReconciliationHistory,
  getReconciliationStats,
} from './usage-reconciliation-helpers'

export class UsageReconciliationService {
  private supabase: SupabaseClient
  private readonly DEFAULT_TOLERANCE = 0.05
  private readonly AUTO_HEAL_THRESHOLD = 0.10

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async reconcile(config: ReconciliationConfig): Promise<ReconciliationResult> {
    const { orgId, period, tolerance = this.DEFAULT_TOLERANCE, autoHeal = true } = config

    try {
      analyticsLogger.info(`[Reconciliation] Starting for org=${orgId} period=${period}`)

      const gatewayUsage = await fetchGatewayUsage(this.supabase, orgId, period)
      const stripeUsage = await fetchStripeUsage(this.supabase, orgId, period)
      const polarUsage = await fetchPolarUsage(this.supabase, orgId, period)

      const billingUsage = stripeUsage > 0 ? stripeUsage : polarUsage
      const discrepancyAmount = Math.abs(gatewayUsage - billingUsage)
      const discrepancy = gatewayUsage > 0 ? discrepancyAmount / gatewayUsage : 0

      analyticsLogger.info(`[Reconciliation] gateway=${gatewayUsage}, billing=${billingUsage}, discrepancy=${(discrepancy * 100).toFixed(2)}%`)

      let autoHealed = false
      let alertSent = false
      let status: 'matched' | 'auto_healed' | 'alerted' = 'matched'

      if (discrepancy <= tolerance) {
        status = 'matched'
      } else if (discrepancy <= this.AUTO_HEAL_THRESHOLD && autoHeal) {
        await autoHealDiscrepancy(this.supabase, { orgId, period, gatewayUsage, billingUsage })
        autoHealed = true
        status = 'auto_healed'
        analyticsLogger.info(`[Reconciliation] Auto-healed discrepancy for org=${orgId}`)
      } else {
        await sendReconciliationAlert(this.supabase, { orgId, gatewayUsage, billingUsage, discrepancy })
        alertSent = true
        status = 'alerted'
        analyticsLogger.warn(`[Reconciliation] Major discrepancy for org=${orgId}: ${(discrepancy * 100).toFixed(2)}%`)
      }

      await logReconciliation(this.supabase, {
        orgId, period, gatewayUsage, stripeUsage, polarUsage,
        discrepancy, autoHealed, alertSent, status,
      })

      return {
        success: true,
        orgId, period,
        gatewayUsage, stripeUsage, polarUsage,
        discrepancy, discrepancyAmount,
        autoHealed, alertSent,
        reconciledAt: new Date().toISOString(),
      }
    } catch (error) {
      analyticsLogger.error(`[Reconciliation] Error for org=${orgId}:`, error)
      return {
        success: false,
        orgId, period,
        gatewayUsage: 0, stripeUsage: 0, polarUsage: 0,
        discrepancy: 0, discrepancyAmount: 0,
        autoHealed: false, alertSent: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        reconciledAt: new Date().toISOString(),
      }
    }
  }

  async getReconciliationHistory(orgId: string, days: number = 30) {
    return getReconciliationHistory(this.supabase, orgId, days)
  }

  async getReconciliationStats(days: number = 30) {
    return getReconciliationStats(this.supabase, days)
  }
}

export default UsageReconciliationService
