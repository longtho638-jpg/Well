/**
 * Overage Computation
 *
 * Handles overage calculation logic including quota resolution and cost computation.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { OverageMetricType, OverageCalculation } from './overage-calculator-types'
import { OverageRateFetcher } from './overage-rate-fetcher'

export class OverageComputation {
  private supabase: SupabaseClient
  private orgId: string
  private rateFetcher: OverageRateFetcher

  constructor(supabase: SupabaseClient, orgId: string) {
    this.supabase = supabase
    this.orgId = orgId
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
    const { metricType, currentUsage, includedQuota, tier, tenantId } = params

    if (includedQuota === -1) {
      return this.createUnlimitedResult(metricType, currentUsage, tier)
    }

    const effectiveQuota = await this.getEffectiveQuota({
      baseQuota: includedQuota,
      tenantId,
      metricType,
    })

    const overageUnits = Math.max(0, currentUsage - effectiveQuota)
    const ratePerUnit = await this.rateFetcher.getRatePerUnit(metricType, tier)
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
      const { data: override } = await this.supabase
        .from('tenant_quota_overrides')
        .select('quota_limit')
        .eq('tenant_id', tenantId)
        .eq('metric_type', this.mapMetricToColumnType(metricType))
        .eq('active', true)
        .single()

      if (override?.quota_limit) {
        return override.quota_limit
      }

      return baseQuota
    } catch {
      return baseQuota
    }
  }

  /**
   * Calculate cost from units and rate
   */
  calculateCost(units: number, ratePerUnit: number): number {
    return Math.round(units * ratePerUnit * 100) / 100
  }

  /**
   * Map metric type to database column name
   */
  private mapMetricToColumnType(metricType: string): string {
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
   * Create result for unlimited quota
   */
  private createUnlimitedResult(
    metricType: OverageMetricType,
    currentUsage: number,
    tier: string
  ): OverageCalculation {
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
}
