/**
 * Overage Calculator Service - Phase 7
 *
 * Calculates usage exceeding quotas and determines overage costs.
 * Uses overage_rates table for rate lookup and calculates total costs.
 */

import { supabase } from '@/lib/supabase'
import { analyticsLogger } from '@/utils/logger'
import type {
  OverageCalculation,
  OverageResult,
  OverageTransaction,
  LicenseTier,
  MetricType,
} from './overage-calculator-types'
import {
  calculateOverageUnits,
  calculateOverageCost,
  calculatePercentageUsed,
  getOverageRate,
  getLicenseTier,
  getUsageVsQuota,
  generateOverageIdempotencyKey,
} from './overage-calculator-helpers'

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
    let tier: LicenseTier = 'basic'
    if (licenseId) {
      tier = await getLicenseTier(licenseId)
    }

    const usageData = await getUsageVsQuota(orgId, billingPeriod)

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
  } catch (error) {
    analyticsLogger.error('[OverageCalculator] Failed to calculate overage', error)
    throw error
  }
}

/**
 * Calculate overage for a single metric
 */
export async function calculateMetricOverage(
  _orgId: string,
  metricType: MetricType,
  totalUsage: number,
  quotaLimit: number,
  licenseId?: string,
  tenantId?: string
): Promise<OverageCalculation> {
  const tier: LicenseTier = licenseId ? await getLicenseTier(licenseId) : 'basic'
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
  } catch (error) {
    analyticsLogger.error('[OverageCalculator] Transaction error', error)
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
      analyticsLogger.error('[OverageCalculator] Error getting pending transactions', error)
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
  } catch (error) {
    analyticsLogger.error('[OverageCalculator] Error', error)
    return []
  }
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
