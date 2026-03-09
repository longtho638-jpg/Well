/**
 * Polar API Client - Aggregate checkout + overage data
 */

import type { Env, PolarData } from './env'

export async function aggregatePolarData(env: Env): Promise<PolarData> {
  try {
    const response = await fetch('https://api.polar.sh/checkout/', {
      headers: {
        'Authorization': `Bearer ${env.POLAR_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.warn('[Polar] API error:', response.status)
      return { orgs: [], checkoutRevenue: {}, overageRevenue: {}, activeSubscriptions: {} }
    }

    const data = await response.json()
    
    const orgs: string[] = []
    const checkoutRevenue: Record<string, number> = {}
    const overageRevenue: Record<string, number> = {}
    const activeSubscriptions: Record<string, number> = {}

    // Process Polar checkout data
    for (const item of data.items || []) {
      const orgId = item.metadata?.org_id || `polar_${item.id}`
      orgs.push(orgId)
      checkoutRevenue[orgId] = item.total_amount || 0
      overageRevenue[orgId] = item.metadata?.overage || 0
      activeSubscriptions[orgId] = item.status === 'active' ? 1 : 0
    }

    return { orgs, checkoutRevenue, overageRevenue, activeSubscriptions }
  } catch (error) {
    console.error('[Polar] Aggregation error:', error)
    return { orgs: [], checkoutRevenue: {}, overageRevenue: {}, activeSubscriptions: {} }
  }
}
