/**
 * Stripe API Client - Aggregate billing data
 */

import type { Env, StripeData } from './env'

export async function aggregateStripeData(env: Env): Promise<StripeData> {
  try {
    const response = await fetch('https://api.stripe.com/v1/subscription_schedules', {
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    if (!response.ok) {
      console.warn('[Stripe] API error:', response.status)
      return { orgs: [], subscriptionRevenue: {}, usageRevenue: {}, mrr: {} }
    }

    const data = await response.json()
    
    // Aggregate by customer/org
    const orgs: string[] = []
    const subscriptionRevenue: Record<string, number> = {}
    const usageRevenue: Record<string, number> = {}
    const mrr: Record<string, number> = {}

    // Process Stripe data (simplified - actual impl needs full Stripe API)
    for (const item of data.data || []) {
      const orgId = item.metadata?.org_id || `stripe_${item.id}`
      orgs.push(orgId)
      subscriptionRevenue[orgId] = (item.plan?.amount || 0) / 100
      mrr[orgId] = (item.plan?.amount || 0) / 100
      usageRevenue[orgId] = 0 // Usage-based billing aggregation
    }

    return { orgs, subscriptionRevenue, usageRevenue, mrr }
  } catch (error) {
    console.error('[Stripe] Aggregation error:', error)
    return { orgs: [], subscriptionRevenue: {}, usageRevenue: {}, mrr: {} }
  }
}
