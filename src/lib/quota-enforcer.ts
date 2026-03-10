/**
 * Quota Enforcer - Phase 7.2
 *
 * Enforces hard and soft quota limits with configurable enforcement modes.
 * Returns 429 Too Many Requests when quotas exceeded in hard mode.
 *
 * Usage:
 *   const enforcer = new QuotaEnforcer(supabase, { orgId, tenantId });
 *   const result = await enforcer.checkQuota('api_calls');
 *   if (!result.allowed) {
 *     return new Response('Quota exceeded', { status: 429 });
 *   }
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { OverageMetricType } from './overage-calculator'

export type EnforcementMode = 'soft' | 'hard' | 'hybrid'

export interface QuotaCheckResult {
  allowed: boolean
  currentUsage: number
  effectiveQuota: number
  remaining: number
  percentageUsed: number
  isOverLimit: boolean
  overageUnits: number
  enforcementMode: EnforcementMode
  retryAfter?: number // Seconds until quota resets
  metadata?: {
    baseQuota: number
    tenantOverride?: number
    gracePeriodBoost?: number
  }
}

export interface QuotaEnforcerOptions {
  orgId: string
  tenantId?: string
  userId?: string
  licenseId?: string
  enforcementMode?: EnforcementMode
  gracePeriodSeconds?: number
}

export interface QuotaConfig {
  metricType: OverageMetricType
  baseQuota: number
  tenantOverride?: number
  gracePeriodBoost?: number
  effectiveQuota: number
}

/**
 * Default quotas by tier (fallback if database not available)
 */
const DEFAULT_TIER_QUOTAS: Record<string, Record<OverageMetricType, number>> = {
  free: {
    api_calls: 1000,
    ai_calls: 10,
    tokens: 100_000,
    compute_minutes: 60,
    storage_gb: 1,
    emails: 100,
    model_inferences: 10,
    agent_executions: 5,
  },
  basic: {
    api_calls: 10_000,
    ai_calls: 100,
    tokens: 1_000_000,
    compute_minutes: 600,
    storage_gb: 10,
    emails: 1_000,
    model_inferences: 100,
    agent_executions: 50,
  },
  pro: {
    api_calls: 50_000,
    ai_calls: 500,
    tokens: 5_000_000,
    compute_minutes: 3_000,
    storage_gb: 50,
    emails: 5_000,
    model_inferences: 500,
    agent_executions: 250,
  },
  enterprise: {
    api_calls: 200_000,
    ai_calls: 2_000,
    tokens: 20_000_000,
    compute_minutes: 12_000,
    storage_gb: 200,
    emails: 20_000,
    model_inferences: 2_000,
    agent_executions: 1_000,
  },
  master: {
    api_calls: -1, // Unlimited
    ai_calls: -1,
    tokens: -1,
    compute_minutes: -1,
    storage_gb: 1000,
    emails: -1,
    model_inferences: -1,
    agent_executions: -1,
  },
}

export class QuotaEnforcer {
  private supabase: SupabaseClient
  private orgId: string
  private tenantId?: string
  private userId?: string
  private licenseId?: string
  private enforcementMode: EnforcementMode
  private gracePeriodSeconds: number
  private quotaCache: Map<string, { quota: number; expiry: number }> = new Map()
  private readonly CACHE_TTL_MS = 2 * 60 * 1000 // 2 minutes

  constructor(
    supabase: SupabaseClient,
    options: QuotaEnforcerOptions
  ) {
    this.supabase = supabase
    this.orgId = options.orgId
    this.tenantId = options.tenantId
    this.userId = options.userId
    this.licenseId = options.licenseId
    this.enforcementMode = options.enforcementMode || 'hard'
    this.gracePeriodSeconds = options.gracePeriodSeconds || 300 // 5 minutes
  }

  /**
   * Check quota for a metric type
   */
  async checkQuota(metricType: OverageMetricType): Promise<QuotaCheckResult> {
    try {
      // Get current usage
      const currentUsage = await this.getCurrentUsage(metricType)

      // Get effective quota
      const effectiveQuota = await this.getEffectiveQuota(metricType)

      // Calculate remaining
      const remaining = effectiveQuota === -1 ? Infinity : Math.max(0, effectiveQuota - currentUsage)
      const percentageUsed = effectiveQuota === -1 ? 0 : Math.round((currentUsage / effectiveQuota) * 100)
      const isOverLimit = effectiveQuota !== -1 && currentUsage > effectiveQuota
      const overageUnits = Math.max(0, currentUsage - effectiveQuota)

      // Check if allowed based on enforcement mode
      const allowed = await this.isAllowed(isOverLimit, metricType)

      // Get retry after time (when quota resets)
      const retryAfter = isOverLimit ? await this.getRetryAfterSeconds() : undefined

      // Get quota breakdown
      const quotaBreakdown = await this.getQuotaBreakdown(metricType)

      return {
        allowed,
        currentUsage,
        effectiveQuota,
        remaining: remaining === Infinity ? -1 : remaining,
        percentageUsed,
        isOverLimit,
        overageUnits,
        enforcementMode: this.enforcementMode,
        retryAfter,
        metadata: quotaBreakdown,
      }
    } catch (err) {
      console.error('[QuotaEnforcer] Error:', err)
      // Fail open - allow request but log error
      return {
        allowed: true,
        currentUsage: 0,
        effectiveQuota: -1,
        remaining: -1,
        percentageUsed: 0,
        isOverLimit: false,
        overageUnits: 0,
        enforcementMode: this.enforcementMode,
      }
    }
  }

  /**
   * Check if request is allowed based on enforcement mode
   */
  private async isAllowed(isOverLimit: boolean, metricType: OverageMetricType): Promise<boolean> {
    if (!isOverLimit) {
      return true
    }

    switch (this.enforcementMode) {
      case 'soft':
        // Always allow, just track overage
        return true

      case 'hard':
        // Block immediately when over limit
        return false

      case 'hybrid':
        // Allow with grace period, then block
        return await this.isWithinGracePeriod(metricType)

      default:
        return !isOverLimit
    }
  }

  /**
   * Check if within grace period for hybrid mode
   */
  private async isWithinGracePeriod(metricType: OverageMetricType): Promise<boolean> {
    try {
      // Check if there's an active grace period
      if (this.tenantId) {
        const { data } = await this.supabase
          .from('tenant_grace_periods')
          .select('expires_at')
          .eq('tenant_id', this.tenantId)
          .eq('metric_type', this.mapMetricToColumnType(metricType))
          .eq('active', true)
          .gte('expires_at', new Date().toISOString())
          .single()

        if (data) {
          return true
        }
      }

      // No active grace period - block
      return false
    } catch (err) {
      // No grace period configured - block
      return false
    }
  }

  /**
   * Get current usage for metric type in current billing period
   */
  private async getCurrentUsage(metricType: OverageMetricType): Promise<number> {
    try {
      const periodStart = this.getBillingPeriodStart()
      const periodEnd = this.getBillingPeriodEnd()

      let query = this.supabase
        .from('usage_records')
        .select('quantity')
        .eq('org_id', this.orgId)
        .eq('feature', metricType)
        .gte('recorded_at', periodStart)
        .lt('recorded_at', periodEnd)

      if (this.tenantId) {
        query = query.eq('tenant_id', this.tenantId)
      }

      const { data, error } = await query

      if (error) {
        console.error('[QuotaEnforcer] Usage fetch error:', error)
        return 0
      }

      return data?.reduce((sum, r) => sum + (r.quantity || 0), 0) || 0
    } catch (err) {
      console.error('[QuotaEnforcer] Usage fetch error:', err)
      return 0
    }
  }

  /**
   * Get effective quota with Phase 6 integration
   * Effective Quota = Base + Tenant Override + Grace Period Boost
   */
  async getEffectiveQuota(metricType: OverageMetricType): Promise<number> {
    const cacheKey = `${this.orgId}_${metricType}`

    // Check cache first
    const cached = this.quotaCache.get(cacheKey)
    if (cached && Date.now() < cached.expiry) {
      return cached.quota
    }

    try {
      // Step 1: Get base quota from tier
      const tier = await this.getOrgTier()
      const tierQuotas = DEFAULT_TIER_QUOTAS[tier] || DEFAULT_TIER_QUOTAS.basic
      const baseQuota = tierQuotas[metricType] || 0

      // Step 2: Get tenant override (Phase 6)
      let tenantOverride: number | undefined
      if (this.tenantId) {
        const { data: overrideData } = await this.supabase
          .from('tenant_quota_overrides')
          .select('quota_limit')
          .eq('tenant_id', this.tenantId)
          .eq('metric_type', this.mapMetricToColumnType(metricType))
          .eq('active', true)
          .single()

        if (overrideData?.quota_limit) {
          tenantOverride = overrideData.quota_limit
        }
      }

      // Step 3: Get grace period boost (Phase 6)
      let gracePeriodBoost: number | undefined
      if (this.tenantId) {
        const { data: graceData } = await this.supabase
          .from('tenant_grace_periods')
          .select('boost_amount')
          .eq('tenant_id', this.tenantId)
          .eq('metric_type', this.mapMetricToColumnType(metricType))
          .eq('active', true)
          .gte('expires_at', new Date().toISOString())
          .single()

        if (graceData?.boost_amount) {
          gracePeriodBoost = graceData.boost_amount
        }
      }

      // Calculate effective quota
      const effectiveQuota = tenantOverride || (baseQuota + (gracePeriodBoost || 0))

      // Cache the result
      this.quotaCache.set(cacheKey, {
        quota: effectiveQuota,
        expiry: Date.now() + this.CACHE_TTL_MS,
      })

      return effectiveQuota
    } catch (err) {
      console.error('[QuotaEnforcer] Quota fetch error:', err)
      // Fallback to tier default
      const tier = await this.getOrgTier()
      return DEFAULT_TIER_QUOTAS[tier]?.[metricType] || 0
    }
  }

  /**
   * Get quota breakdown for debugging
   */
  private async getQuotaBreakdown(metricType: OverageMetricType): Promise<{
    baseQuota: number
    tenantOverride?: number
    gracePeriodBoost?: number
  }> {
    const tier = await this.getOrgTier()
    const tierQuotas = DEFAULT_TIER_QUOTAS[tier] || DEFAULT_TIER_QUOTAS.basic
    const baseQuota = tierQuotas[metricType] || 0

    let tenantOverride: number | undefined
    let gracePeriodBoost: number | undefined

    if (this.tenantId) {
      const { data: overrideData } = await this.supabase
        .from('tenant_quota_overrides')
        .select('quota_limit')
        .eq('tenant_id', this.tenantId)
        .eq('metric_type', this.mapMetricToColumnType(metricType))
        .eq('active', true)
        .single()

      tenantOverride = overrideData?.quota_limit

      const { data: graceData } = await this.supabase
        .from('tenant_grace_periods')
        .select('boost_amount')
        .eq('tenant_id', this.tenantId)
        .eq('metric_type', this.mapMetricToColumnType(metricType))
        .eq('active', true)
        .single()

      gracePeriodBoost = graceData?.boost_amount
    }

    return { baseQuota, tenantOverride, gracePeriodBoost }
  }

  /**
   * Get seconds until quota resets
   */
  private async getRetryAfterSeconds(): Promise<number | undefined> {
    try {
      // Get billing period end
      const periodEnd = this.getBillingPeriodEnd()
      const now = new Date()
      const end = new Date(periodEnd)
      const diffMs = end.getTime() - now.getTime()
      return Math.max(0, Math.floor(diffMs / 1000))
    } catch (err) {
      return undefined
    }
  }

  /**
   * Get org tier from subscription
   */
  private async getOrgTier(): Promise<string> {
    try {
      const { data } = await this.supabase
        .from('user_subscriptions')
        .select('plan_slug')
        .eq('org_id', this.orgId)
        .eq('status', 'active')
        .single()

      return data?.plan_slug || 'basic'
    } catch (err) {
      return 'basic'
    }
  }

  /**
   * Get billing period start (ISO string)
   */
  private getBillingPeriodStart(): string {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  }

  /**
   * Get billing period end (ISO string)
   */
  private getBillingPeriodEnd(): string {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
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
   * Set enforcement mode dynamically
   */
  setEnforcementMode(mode: EnforcementMode): void {
    this.enforcementMode = mode
  }

  /**
   * Get current enforcement mode
   */
  getEnforcementMode(): EnforcementMode {
    return this.enforcementMode
  }

  /**
   * Create 429 response for quota exceeded
   */
  static createQuotaExceededResponse(result: QuotaCheckResult): Response {
    return new Response(
      JSON.stringify({
        error: 'Quota Exceeded',
        message: `You have exceeded your ${result.enforcementMode} quota limit.`,
        details: {
          metricType: 'usage',
          currentUsage: result.currentUsage,
          effectiveQuota: result.effectiveQuota,
          overageUnits: result.overageUnits,
          percentageUsed: result.percentageUsed,
          enforcementMode: result.enforcementMode,
          retryAfter: result.retryAfter,
        },
        suggestion: result.enforcementMode === 'soft'
          ? 'Consider upgrading your plan to avoid overage charges.'
          : 'Upgrade your plan or wait until quota resets.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(result.retryAfter || 3600),
          'X-RateLimit-Limit': String(result.effectiveQuota),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(result.retryAfter || 3600),
        },
      }
    )
  }
}

export default QuotaEnforcer
