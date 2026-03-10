/**
 * Overage Calculator Helpers
 *
 * Helper functions for overage calculations.
 */

import { supabase } from '@/lib/supabase'
import type { LicenseTier, MetricType } from './overage-calculator-types'

/**
 * Calculate overage units from total usage and quota
 */
export function calculateOverageUnits(totalUsage: number, includedQuota: number): number {
  return Math.max(0, totalUsage - includedQuota)
}

/**
 * Calculate overage cost from units and rate
 */
export function calculateOverageCost(overageUnits: number, ratePerUnit: number): number {
  return Math.round(overageUnits * ratePerUnit * 100) / 100
}

/**
 * Calculate percentage used
 */
export function calculatePercentageUsed(totalUsage: number, includedQuota: number): number {
  if (includedQuota <= 0) return 100
  return Math.round((totalUsage / includedQuota) * 10000) / 100
}

/**
 * Get applicable overage rate for a metric type and tier
 */
export async function getOverageRate(
  metricType: MetricType,
  tier: LicenseTier,
  tenantId?: string
): Promise<number> {
  try {
    if (tenantId) {
      const { data: rateData } = await supabase
        .from('overage_rates')
        .select('custom_rate')
        .eq('metric_type', metricType)
        .single()

      if (rateData?.custom_rate && Array.isArray(rateData.custom_rate)) {
        const customRate = rateData.custom_rate.find(
          (r: any) => r.tenant_id === tenantId
        )
        if (customRate?.rate) {
          return customRate.rate
        }
      }
    }

    const { data, error } = await supabase
      .from('overage_rates')
      .select('*')
      .eq('metric_type', metricType)
      .single()

    if (error || !data) {
      return 0
    }

    const rateKey = `${tier}_rate` as keyof typeof data
    const rate = data[rateKey] as number

    return rate || 0
  } catch {
    return 0
  }
}

/**
 * Get tier from license ID
 */
export async function getLicenseTier(licenseId: string): Promise<LicenseTier> {
  try {
    const { data, error } = await supabase
      .from('raas_licenses')
      .select('tier')
      .eq('id', licenseId)
      .single()

    if (error || !data) {
      return 'basic'
    }

    return (data.tier as LicenseTier) || 'basic'
  } catch {
    return 'basic'
  }
}

/**
 * Get current usage vs quota for all metrics
 */
export async function getUsageVsQuota(
  orgId: string,
  billingPeriod: string
): Promise<
  Array<{
    metricType: MetricType
    totalUsage: number
    quotaLimit: number
  }>
> {
  try {
    const { data, error } = await supabase.rpc('get_usage_vs_quota', {
      p_org_id: orgId,
      p_billing_period: billingPeriod,
    })

    if (error) {
      return []
    }

    return (data || []).map((row: { metric_type: string; total_usage: number; quota_limit: number }) => ({
      metricType: row.metric_type as MetricType,
      totalUsage: Number(row.total_usage) || 0,
      quotaLimit: Number(row.quota_limit) || 0,
    }))
  } catch {
    return []
  }
}

/**
 * Generate idempotency key for overage record
 */
export function generateOverageIdempotencyKey(
  orgId: string,
  metricType: string,
  billingPeriod: string
): string {
  return `ovg_${orgId}_${metricType}_${billingPeriod}`
}
