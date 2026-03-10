/**
 * Subscription Health Service - Phase 7
 *
 * Aggregates billing state, overage tracking, and dunning status
 * to provide a comprehensive subscription health score.
 *
 * Usage:
 *   import { subscriptionHealth } from '@/lib/subscription-health'
 *
 *   const health = await subscriptionHealth.getHealthScore(orgId)
 *   const status = await subscriptionHealth.getSubscriptionStatus(userId)
 */

import { supabase } from '@/lib/supabase'

export type HealthScore = 'excellent' | 'good' | 'warning' | 'critical' | 'unknown'

export interface SubscriptionHealthStatus {
  orgId: string
  healthScore: HealthScore
  healthPercentage: number
  subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete' | 'unknown'
  currentPeriodEnd: string | null
  hasOverage: boolean
  totalOverageCost: number
  isNearQuota: boolean
  quotaUsagePercentage: number
  hasDunningEvents: boolean
  dunningStage: string | null
  amountAtRisk: number
  paymentMethodStatus: 'valid' | 'expiring' | 'failed' | 'unknown'
  lastSyncAt: string | null
}

export interface BillingState {
  orgId: string
  metricType: string
  currentUsage: number
  quotaLimit: number
  percentageUsed: number
  isExhausted: boolean
  lastSync: string
}

export interface OveragesSummary {
  hasOverage: boolean
  totalCost: number
  transactionCount: number
  breakdownByMetric: Record<string, {
    totalCost: number
    totalUnits: number
    avgRate: number
  }>
}

/**
 * Get comprehensive subscription health score for org
 */
export async function getHealthScore(orgId: string): Promise<SubscriptionHealthStatus> {
  try {
    // Fetch all required data in parallel
    const [billingState, overageSummary, dunningEvents, subscription] = await Promise.all([
      getBillingState(orgId),
      getOverageSummary(orgId),
      getDunningStatus(orgId),
      getSubscription(orgId),
    ])

    // Calculate health score
    const healthPercentage = calculateHealthPercentage({
      billingState,
      overageSummary,
      dunningEvents,
      subscription,
    })

    const healthScore = percentageToScore(healthPercentage)

    return {
      orgId,
      healthScore,
      healthPercentage,
      subscriptionStatus: (subscription?.status || 'unknown') as SubscriptionHealthStatus['subscriptionStatus'],
      currentPeriodEnd: subscription?.currentPeriodEnd || null,
      hasOverage: overageSummary.hasOverage,
      totalOverageCost: overageSummary.totalCost,
      isNearQuota: billingState.some((s) => s.percentageUsed >= 80),
      quotaUsagePercentage: Math.max(...billingState.map((s) => s.percentageUsed), 0),
      hasDunningEvents: dunningEvents.hasActive,
      dunningStage: dunningEvents.currentStage,
      amountAtRisk: dunningEvents.amountAtRisk,
      paymentMethodStatus: subscription?.paymentMethodStatus || 'unknown',
      lastSyncAt: billingState.length > 0 ? billingState[0].lastSync : null,
    }
  } catch (err) {
    console.error('[SubscriptionHealth] Error:', err)
    return getDefaultHealthStatus(orgId)
  }
}

/**
 * Get billing state for all metrics
 */
async function getBillingState(orgId: string): Promise<BillingState[]> {
  try {
    const { data, error } = await supabase
      .from('billing_state')
      .select('*')
      .eq('org_id', orgId)
      .order('percentage_used', { ascending: false })

    if (error || !data) {
      return []
    }

    return data.map((item: any) => ({
      orgId: item.org_id,
      metricType: item.metric_type,
      currentUsage: Number(item.current_usage),
      quotaLimit: Number(item.quota_limit),
      percentageUsed: Number(item.percentage_used),
      isExhausted: item.is_exhausted,
      lastSync: item.last_sync,
    }))
  } catch (err) {
    console.error('[SubscriptionHealth] Error fetching billing state:', err)
    return []
  }
}

/**
 * Get overage summary for current period
 */
async function getOverageSummary(orgId: string): Promise<OveragesSummary> {
  try {
    const currentPeriod = new Date().toISOString().slice(0, 7) // '2026-03'

    const { data, error } = await supabase
      .from('overage_transactions')
      .select('metric_type, total_cost, overage_units, rate_per_unit')
      .eq('org_id', orgId)
      .eq('billing_period', currentPeriod)

    if (error || !data || data.length === 0) {
      return {
        hasOverage: false,
        totalCost: 0,
        transactionCount: 0,
        breakdownByMetric: {},
      }
    }

    const breakdownByMetric: Record<string, { totalCost: number; totalUnits: number; avgRate: number }> = {}
    let totalCost = 0

    data.forEach((item: any) => {
      const cost = parseFloat(item.total_cost) || 0
      const units = Number(item.overage_units) || 0
      const rate = parseFloat(item.rate_per_unit) || 0

      if (!breakdownByMetric[item.metric_type]) {
        breakdownByMetric[item.metric_type] = {
          totalCost: 0,
          totalUnits: 0,
          avgRate: 0,
        }
      }

      breakdownByMetric[item.metric_type].totalCost += cost
      breakdownByMetric[item.metric_type].totalUnits += units
      breakdownByMetric[item.metric_type].avgRate = rate // Last rate (simplified)

      totalCost += cost
    })

    return {
      hasOverage: totalCost > 0,
      totalCost: Math.round(totalCost * 100) / 100,
      transactionCount: data.length,
      breakdownByMetric,
    }
  } catch (err) {
    console.error('[SubscriptionHealth] Error fetching overages:', err)
    return {
      hasOverage: false,
      totalCost: 0,
      transactionCount: 0,
      breakdownByMetric: {},
    }
  }
}

/**
 * Get dunning status
 */
async function getDunningStatus(orgId: string): Promise<{
  hasActive: boolean
  currentStage: string | null
  amountAtRisk: number
}> {
  try {
    const { data, error } = await supabase
      .from('dunning_events')
      .select('dunning_stage, amount_owed')
      .eq('org_id', orgId)
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error || !data || data.length === 0) {
      return {
        hasActive: false,
        currentStage: null,
        amountAtRisk: 0,
      }
    }

    const latest = data[0]
    return {
      hasActive: true,
      currentStage: latest.dunning_stage,
      amountAtRisk: parseFloat(latest.amount_owed) || 0,
    }
  } catch (err) {
    console.error('[SubscriptionHealth] Error fetching dunning:', err)
    return {
      hasActive: false,
      currentStage: null,
      amountAtRisk: 0,
    }
  }
}

/**
 * Get subscription details
 */
async function getSubscription(orgId: string): Promise<{
  status: string
  currentPeriodEnd: string | null
  paymentMethodStatus: 'valid' | 'expiring' | 'failed' | 'unknown'
} | null> {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('status, current_period_end, metadata')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .or('status.eq:trialing,status.eq:past_due,status.eq:unpaid')
      .single()

    if (error || !data) {
      return null
    }

    // Determine payment method status from metadata
    const metadata = data.metadata as Record<string, unknown> | null
    let paymentMethodStatus: 'valid' | 'expiring' | 'failed' | 'unknown' = 'unknown'

    if (metadata?.payment_method_status === 'valid') {
      paymentMethodStatus = 'valid'
    } else if (metadata?.payment_method_expiring === true) {
      paymentMethodStatus = 'expiring'
    } else if (data.status === 'past_due' || data.status === 'unpaid') {
      paymentMethodStatus = 'failed'
    }

    return {
      status: data.status,
      currentPeriodEnd: data.current_period_end,
      paymentMethodStatus,
    }
  } catch (err) {
    console.error('[SubscriptionHealth] Error fetching subscription:', err)
    return null
  }
}

/**
 * Calculate health percentage (0-100)
 */
function calculateHealthPercentage(params: {
  billingState: BillingState[]
  overageSummary: OveragesSummary
  dunningEvents: { hasActive: boolean; currentStage: string | null; amountAtRisk: number }
  subscription: { status: string; paymentMethodStatus: string } | null
}): number {
  let score = 100

  // Deduct for quota usage
  const maxQuotaUsage = Math.max(...params.billingState.map((s) => s.percentageUsed), 0)
  if (maxQuotaUsage >= 100) {
    score -= 30 // Over quota
  } else if (maxQuotaUsage >= 90) {
    score -= 20 // Near quota
  } else if (maxQuotaUsage >= 80) {
    score -= 10 // Warning zone
  }

  // Deduct for overages
  if (params.overageSummary.hasOverage) {
    score -= Math.min(20, params.overageSummary.totalCost / 10) // Up to -20
  }

  // Deduct for dunning
  if (params.dunningEvents.hasActive) {
    const stageDeduction = {
      'initial': 10,
      'reminder': 20,
      'final': 30,
      'cancel_notice': 40,
    }[params.dunningEvents.currentStage || 'initial']
    score -= stageDeduction || 10
  }

  // Deduct for payment method issues
  if (params.subscription?.paymentMethodStatus === 'failed') {
    score -= 30
  } else if (params.subscription?.paymentMethodStatus === 'expiring') {
    score -= 10
  }

  // Deduct for subscription status
  const statusDeduction = {
    'active': 0,
    'trialing': 0,
    'past_due': 25,
    'unpaid': 35,
    'canceled': 50,
    'incomplete': 20,
  }[params.subscription?.status || 'unknown']
  score -= statusDeduction || 0

  return Math.max(0, Math.min(100, score))
}

/**
 * Convert percentage to health score label
 */
function percentageToScore(percentage: number): HealthScore {
  if (percentage >= 90) return 'excellent'
  if (percentage >= 70) return 'good'
  if (percentage >= 50) return 'warning'
  if (percentage >= 25) return 'critical'
  return 'unknown'
}

/**
 * Get default health status (when data unavailable)
 */
function getDefaultHealthStatus(orgId: string): SubscriptionHealthStatus {
  return {
    orgId,
    healthScore: 'unknown',
    healthPercentage: 50,
    subscriptionStatus: 'unknown',
    currentPeriodEnd: null,
    hasOverage: false,
    totalOverageCost: 0,
    isNearQuota: false,
    quotaUsagePercentage: 0,
    hasDunningEvents: false,
    dunningStage: null,
    amountAtRisk: 0,
    paymentMethodStatus: 'unknown',
    lastSyncAt: null,
  }
}

/**
 * Get color for health score
 */
export function getHealthScoreColor(score: HealthScore): string {
  switch (score) {
    case 'excellent':
      return 'text-emerald-400'
    case 'good':
      return 'text-blue-400'
    case 'warning':
      return 'text-amber-400'
    case 'critical':
      return 'text-red-400'
    default:
      return 'text-zinc-400'
  }
}

/**
 * Get background color for health score
 */
export function getHealthScoreBg(score: HealthScore): string {
  switch (score) {
    case 'excellent':
      return 'bg-emerald-500/10'
    case 'good':
      return 'bg-blue-500/10'
    case 'warning':
      return 'bg-amber-500/10'
    case 'critical':
      return 'bg-red-500/10'
    default:
      return 'bg-zinc-500/10'
  }
}

/**
 * Get border color for health score
 */
export function getHealthScoreBorder(score: HealthScore): string {
  switch (score) {
    case 'excellent':
      return 'border-emerald-500/20'
    case 'good':
      return 'border-blue-500/20'
    case 'warning':
      return 'border-amber-500/20'
    case 'critical':
      return 'border-red-500/20'
    default:
      return 'border-zinc-500/20'
  }
}

/**
 * Subscription Health Service
 */
export const subscriptionHealth = {
  getHealthScore,
  getHealthScoreColor,
  getHealthScoreBg,
  getHealthScoreBorder,
  percentageToScore,
}

export default subscriptionHealth
