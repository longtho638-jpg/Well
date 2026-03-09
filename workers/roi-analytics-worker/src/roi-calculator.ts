/**
 * ROI Calculator - Compute ROI metrics per organization
 *
 * ROI = (Value - Cost) / Cost * 100
 *
 * Status thresholds:
 * - positive: ROI > 0% (value > cost)
 * - neutral: ROI = 0% (break-even)
 * - negative: ROI < 0% (cost > value)
 */

import type { ROIInput, typeROIDigest } from './types'

export function calculateROI(input: ROIInput): typeROIDigest {
  const { orgId, stripeData, polarData, date } = input

  // Calculate total cost (what customer paid)
  const stripeSubscription = stripeData.subscriptionRevenue[orgId] || 0
  const stripeUsage = stripeData.usageRevenue[orgId] || 0
  const polarCheckout = polarData.checkoutRevenue[orgId] || 0
  const polarOverage = polarData.overageRevenue[orgId] || 0

  const totalCost = stripeSubscription + stripeUsage + polarCheckout + polarOverage

  // Calculate total value (business value delivered)
  // For now, use revenue as proxy for value
  // TODO: Implement actual value metrics based on customer outcomes
  const totalValue = totalCost * 1.2 // Assume 20% average ROI for now

  // Calculate ROI percentage
  const roiPercentage = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0

  // Determine status
  let status: 'positive' | 'negative' | 'neutral' = 'neutral'
  if (roiPercentage > 0) status = 'positive'
  else if (roiPercentage < 0) status = 'negative'

  // Determine tier based on spend
  let tier = 'free'
  if (totalCost >= 1000) tier = 'enterprise'
  else if (totalCost >= 500) tier = 'pro'
  else if (totalCost >= 100) tier = 'basic'

  return {
    orgId,
    date,
    totalCost,
    totalValue,
    roiPercentage,
    stripe: {
      subscription: stripeSubscription,
      usage: stripeUsage,
      mrr: stripeData.mrr[orgId] || 0,
    },
    polar: {
      checkout: polarCheckout,
      overage: polarOverage,
      active: polarData.activeSubscriptions[orgId] || 0,
    },
    tier,
    status,
  }
}
