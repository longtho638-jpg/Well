/**
 * Overage Rate Fetcher
 *
 * Handles retrieval of overage rates from database or cache.
 * Manages rate caching with TTL for performance.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { OverageMetricType, OverageRates } from './overage-calculator-types'

/**
 * Default overage rates (fallback if database not available)
 * Rates in USD per unit
 */
export const DEFAULT_OVERAGE_RATES: Record<OverageMetricType, OverageRates> = {
  api_calls: { free: 0.001, basic: 0.0008, pro: 0.0005, enterprise: 0.0003, master: 0.0001 },
  ai_calls: { free: 0.05, basic: 0.04, pro: 0.03, enterprise: 0.02, master: 0.01 },
  tokens: { free: 0.000004, basic: 0.000003, pro: 0.000002, enterprise: 0.000001, master: 0.0000005 },
  compute_minutes: { free: 0.01, basic: 0.008, pro: 0.005, enterprise: 0.003, master: 0.001 },
  storage_gb: { free: 0.5, basic: 0.4, pro: 0.3, enterprise: 0.2, master: 0.1 },
  emails: { free: 0.002, basic: 0.0015, pro: 0.001, enterprise: 0.0005, master: 0.0002 },
  model_inferences: { free: 0.02, basic: 0.015, pro: 0.01, enterprise: 0.005, master: 0.0025 },
  agent_executions: { free: 0.1, basic: 0.08, pro: 0.05, enterprise: 0.03, master: 0.015 },
}

export class OverageRateFetcher {
  private supabase: SupabaseClient
  private orgId: string
  private rateCache: Map<string, number> = new Map()
  private rateCacheExpiry: Map<string, number> = new Map()
  private readonly CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

  constructor(supabase: SupabaseClient, orgId: string) {
    this.supabase = supabase
    this.orgId = orgId
  }

  /**
   * Get rate per unit from database or cache
   */
  async getRatePerUnit(metricType: OverageMetricType, tier: string): Promise<number> {
    const cacheKey = `${metricType}_${tier}`

    const cached = this.rateCache.get(cacheKey)
    const cacheExpiry = this.rateCacheExpiry.get(cacheKey)

    if (cached && cacheExpiry && Date.now() < cacheExpiry) {
      return cached
    }

    try {
      const { data, error } = await this.supabase
        .from('overage_rates')
        .select('*')
        .eq('metric_type', metricType)
        .single()

      if (error || !data) {
        const rate = this.getFallbackRate(metricType, tier)
        this.setCache(cacheKey, rate)
        return rate
      }

      const rateField = `${tier}_rate`
      const rate = parseFloat((data as any)[rateField] || '0')
      this.setCache(cacheKey, rate)
      return rate
    } catch {
      const rate = this.getFallbackRate(metricType, tier)
      this.setCache(cacheKey, rate)
      return rate
    }
  }

  /**
   * Get org tier from subscription
   */
  async getOrgTier(): Promise<string> {
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
   * Get fallback rate from hardcoded defaults
   */
  getFallbackRate(metricType: OverageMetricType, tier: string): number {
    const rates = DEFAULT_OVERAGE_RATES[metricType]
    if (!rates) {
      return 0
    }

    const tierKey = tier.toLowerCase() as keyof OverageRates
    return rates[tierKey] || rates.basic
  }

  /**
   * Set rate cache with expiry
   */
  private setCache(key: string, value: number): void {
    this.rateCache.set(key, value)
    this.rateCacheExpiry.set(key, Date.now() + this.CACHE_TTL_MS)
  }
}
