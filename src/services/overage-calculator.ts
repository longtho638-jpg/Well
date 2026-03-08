/**
 * Overage Calculator Service - Phase 7
 *
 * Calculates usage exceeding quotas and determines overage costs.
 * Uses overage_rates table for rate lookup and calculates total costs.
 */

import { supabase } from '@/lib/supabase'
import type {
  OverageCalculation,
  OverageResult,
  OverageTransaction,
  LicenseTier,
  MetricType,
} from '@/types/overage'

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
  return Math.round(overageUnits * ratePerUnit * 100) / 100 // Round to 2 decimal places
}

/**
 * Calculate percentage used
 */
export function calculatePercentageUsed(totalUsage: number, includedQuota: number): number {
  if (includedQuota <= 0) return 100
  return Math.round((totalUsage / includedQuota) * 10000) / 100 // Round to 2 decimal places
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
    // First check for custom tenant-specific rate
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

    // Fall back to tier-based rate
    const { data, error } = await supabase
      .from('overage_rates')
      .select('*')
      .eq('metric_type', metricType)
      .single()

    if (error || !data) {
      // Silently return 0 - rate not found is not a critical error
      return 0
    }

    const rateKey = `${tier}_rate` as keyof typeof data
    const rate = data[rateKey] as number

    return rate || 0
  } catch (err) {
    // Return default tier on error
    return 'basic'
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
      return 'basic' // Default tier
    }

    return (data.tier as LicenseTier) || 'basic'
  } catch (err) {
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
      // Return empty on error - caller should handle
      return []
    }

    return (data || []).map((row: { metric_type: string; total_usage: number; quota_limit: number }) => ({
      metricType: row.metric_type as MetricType,
      totalUsage: Number(row.total_usage) || 0,
      quotaLimit: Number(row.quota_limit) || 0,
    }))
  } catch (err) {
    return []
  }
}

/**
 * Calculate overage for all metrics for an organization
 */
export async function calculateOverageForOrg(
  orgId: string,
  billingPeriod: string,
  licenseId?: string,
  tenantId?: string
): Promise<OverageResult> {
  const calculations: OverageCalculation[] = []
  let totalOverageCost = 0

  try {
    // Get tier for rate lookup
    let tier: LicenseTier = 'basic'
    if (licenseId) {
      tier = await getLicenseTier(licenseId)
    }

    // Get usage vs quota for all metrics
    const usageData = await getUsageVsQuota(orgId, billingPeriod)

    // Calculate overage for each metric
    for (const usage of usageData) {
      const overageUnits = calculateOverageUnits(usage.totalUsage, usage.quotaLimit)
      const rate = await getOverageRate(usage.metricType, tier, tenantId)
      const cost = overageUnits > 0 ? calculateOverageCost(overageUnits, rate) : 0

      const calculation: OverageCalculation = {
        metricType: usage.metricType,
        totalUsage: usage.totalUsage,
        includedQuota: usage.quotaLimit,
        overageUnits,
        ratePerUnit: rate,
        totalCost: cost,
        isOverQuota: overageUnits > 0,
        percentageUsed: calculatePercentageUsed(usage.totalUsage, usage.quotaLimit),
      }

      calculations.push(calculation)
      totalOverageCost += cost
    }

    return {
      orgId,
      billingPeriod,
      calculations,
      totalOverageCost: Math.round(totalOverageCost * 100) / 100,
      hasOverage: totalOverageCost > 0,
      calculatedAt: new Date().toISOString(),
    }
  } catch (err) {
    throw err
  }
}

/**
 * Calculate overage for a single metric
 */
export async function calculateMetricOverage(
  orgId: string,
  metricType: MetricType,
  totalUsage: number,
  quotaLimit: number,
  licenseId?: string,
  tenantId?: string
): Promise<OverageCalculation> {
  try {
    let tier: LicenseTier = 'basic'
    if (licenseId) {
      tier = await getLicenseTier(licenseId)
    }

    const overageUnits = calculateOverageUnits(totalUsage, quotaLimit)
    const rate = await getOverageRate(metricType, tier, tenantId)
    const cost = overageUnits > 0 ? calculateOverageCost(overageUnits, rate) : 0

    return {
      metricType,
      totalUsage,
      includedQuota: quotaLimit,
      overageUnits,
      ratePerUnit: rate,
      totalCost: cost,
      isOverQuota: overageUnits > 0,
      percentageUsed: calculatePercentageUsed(totalUsage, quotaLimit),
    }
  } catch (err) {
    throw err
  }
}

/**
 * Create overage transaction record in database
 */
export async function createOverageTransaction(
  transaction: OverageTransaction
): Promise<{ id: string; error?: string }> {
  try {
    const { data, error } = await supabase
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
        currency: transaction.currency || 'USD',
        stripe_subscription_item_id: transaction.stripeSubscriptionItemId,
        stripe_usage_record_id: transaction.stripeUsageRecordId,
        stripe_sync_status: transaction.stripeSyncStatus || 'pending',
        metadata: transaction.metadata,
        idempotency_key: transaction.idempotencyKey,
      })
      .select('id')
      .single()

    if (error) {
      return { id: '', error: error.message }
    }

    return { id: data.id }
  } catch (err) {
    return { id: '', error: 'Unknown error' }
  }
}

/**
 * Get pending overage transactions (not synced to Stripe)
 */
export async function getPendingOverageTransactions(
  orgId?: string,
  billingPeriod?: string
): Promise<OverageTransaction[]> {
  try {
    let query = supabase
      .from('overage_transactions')
      .select('*')
      .eq('stripe_sync_status', 'pending')
      .order('created_at', { ascending: true })

    if (orgId) {
      query = query.eq('org_id', orgId)
    }

    if (billingPeriod) {
      query = query.eq('billing_period', billingPeriod)
    }

    const { data, error } = await query

    if (error) {
      console.error('[OverageCalculator] Error getting pending transactions:', error)
      return []
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      orgId: row.org_id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      licenseId: row.license_id,
      metricType: row.metric_type,
      billingPeriod: row.billing_period,
      totalUsage: Number(row.total_usage),
      includedQuota: Number(row.included_quota),
      overageUnits: Number(row.overage_units),
      ratePerUnit: Number(row.rate_per_unit),
      totalCost: Number(row.total_cost),
      currency: row.currency,
      stripeSubscriptionItemId: row.stripe_subscription_item_id,
      stripeUsageRecordId: row.stripe_usage_record_id,
      stripeSyncedAt: row.stripe_synced_at,
      stripeSyncStatus: row.stripe_sync_status,
      metadata: row.metadata,
      idempotencyKey: row.idempotency_key,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
  } catch (err) {
    console.error('[OverageCalculator] Error:', err)
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

/**
 * Overage Calculator Service
 */
export const overageCalculator = {
  calculateOverageUnits,
  calculateOverageCost,
  calculatePercentageUsed,
  getOverageRate,
  getLicenseTier,
  getUsageVsQuota,
  calculateOverageForOrg,
  calculateMetricOverage,
  createOverageTransaction,
  getPendingOverageTransactions,
  generateOverageIdempotencyKey,
}
