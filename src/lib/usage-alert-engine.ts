/**
 * Usage Alert Engine - Phase 6 Real-time Alerts
 *
 * Monitors usage thresholds and triggers webhook alerts to AgencyOS dashboard.
 * Integrates with UsageMeter for real-time quota monitoring.
 *
 * @example
 * ```typescript
 * const alertEngine = new UsageAlertEngine(supabase, { userId, licenseId });
 *
 * // Check and emit alerts after tracking usage
 * await alertEngine.checkAndEmitAlerts();
 *
 * // Or manually trigger alert
 * await alertEngine.emitAlert({
 *   metricType: 'api_calls',
 *   thresholdPercentage: 80,
 * });
 * ```
 */

// Deno runtime type declaration for edge compatibility
declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
} | undefined

import type { SupabaseClient } from '@supabase/supabase-js'
import type { UsageStatus, TierLimits } from './usage-metering'
import { analyticsLogger } from '@/utils/logger'

export type AlertMetricType = 'api_calls' | 'tokens' | 'compute_minutes' | 'model_inferences' | 'agent_executions'
export type AlertThreshold = 80 | 90 | 100

export interface UsageAlertConfig {
  userId: string
  licenseId?: string
  orgId?: string
  tier?: string
  webhookUrl?: string // Override default AgencyOS webhook URL
}

export interface AlertOptions {
  metricType: AlertMetricType
  thresholdPercentage: AlertThreshold
  currentUsage?: number
  quotaLimit?: number
}

export interface AlertDeliveryResult {
  success: boolean
  eventId: string
  metricType: AlertMetricType
  thresholdPercentage: AlertThreshold
  webhookStatus: 'sent' | 'failed' | 'pending'
  error?: string
}

/**
 * Default alert thresholds configuration
 */
const DEFAULT_THRESHOLDS: AlertThreshold[] = [80, 90, 100]

/**
 * Cooldown period between alerts (1 hour)
 */
const ALERT_COOLDOWN_MS = 60 * 60 * 1000

/**
 * AgencyOS webhook endpoint
 * Configured via environment variable with fallback for development
 */
const DEFAULT_AGENCYOS_WEBHOOK_URL = typeof Deno !== 'undefined'
  ? Deno.env.get('AGENCYOS_WEBHOOK_URL') || 'https://agencyos.network/api/webhooks/usage-alerts'
  : process.env.AGENCYOS_WEBHOOK_URL || 'https://agencyos.network/api/webhooks/usage-alerts'

export class UsageAlertEngine {
  private supabase: SupabaseClient
  private userId: string
  private licenseId?: string
  private orgId?: string
   
  private tier: string
  private webhookUrl: string
  private lastAlertCache: Map<string, number> = new Map()

  constructor(supabase: SupabaseClient, config: UsageAlertConfig) {
    this.supabase = supabase
    this.userId = config.userId
    this.licenseId = config.licenseId
    this.orgId = config.orgId
    this.tier = config.tier || 'free'
    this.webhookUrl = config.webhookUrl || DEFAULT_AGENCYOS_WEBHOOK_URL
  }

  /**
   * Check current usage against thresholds and emit alerts if needed
   */
  async checkAndEmitAlerts(_usageStatus?: UsageStatus): Promise<AlertDeliveryResult[]> {
    const results: AlertDeliveryResult[] = []

    // Get current usage status
    const usageStatus = await this.getCurrentUsageStatus()

    // Check each metric type (exclude isLimited and resetAt which are not metrics)
    const metricKeys: Array<Exclude<keyof UsageStatus, 'isLimited' | 'resetAt'>> = [
      'api_calls',
      'tokens',
      'compute',
      'model_inferences',
      'agent_executions',
    ]

    for (const metric of metricKeys) {
      const metricStatus = usageStatus[metric as keyof typeof usageStatus]
      if (!metricStatus || typeof metricStatus !== 'object' || metricStatus.limit === 0 || metricStatus.limit === -1) {
        continue // Skip if no limit or unlimited
      }

      const percentage = metricStatus.percentage

      // Check against each threshold
      for (const threshold of DEFAULT_THRESHOLDS) {
        if (percentage >= threshold) {
          const canAlert = await this.canSendAlert(metric as AlertMetricType, threshold)
          if (canAlert) {
            const result = await this.emitAlert({
              metricType: metric as AlertMetricType,
              thresholdPercentage: threshold,
              currentUsage: (metricStatus as { used: number }).used,
              quotaLimit: metricStatus.limit,
            })
            results.push(result)

            // Update cache to prevent duplicate alerts
            this.lastAlertCache.set(this.getCacheKey(metric as AlertMetricType, threshold), Date.now())
          }
        }
      }
    }

    return results
  }

  /**
   * Manually emit an alert
   */
  async emitAlert(options: AlertOptions): Promise<AlertDeliveryResult> {
    const { metricType, thresholdPercentage, currentUsage, quotaLimit } = options

    try {
      // Get current usage and limits if not provided
      let usage = currentUsage
      let limit = quotaLimit

      if (usage === undefined || limit === undefined) {
        const status = await this.getCurrentUsageStatus()
        const metricStatus = status[metricType as keyof UsageStatus]
        if (metricStatus && typeof metricStatus === 'object' && 'used' in metricStatus) {
          usage = usage ?? (metricStatus as { used: number }).used ?? 0
          limit = limit ?? (metricStatus as { used: number; limit: number }).limit ?? 0
        } else {
          usage = usage ?? 0
          limit = limit ?? 0
        }
      }

      // Get customer ID from license
      const customerId = await this.getCustomerId()

      // Call edge function to emit webhook
      const { data, error } = await this.supabase.functions.invoke('usage-alert-webhook', {
        body: {
          user_id: this.userId,
          license_id: this.licenseId,
          metric_type: metricType,
          threshold_percentage: thresholdPercentage,
          current_usage: usage,
          quota_limit: limit,
          webhook_url: this.webhookUrl,
          customer_id: customerId,
        },
      })

      if (error) {
        return {
          success: false,
          eventId: '',
          metricType,
          thresholdPercentage,
          webhookStatus: 'failed',
          error: error.message,
        }
      }

      return {
        success: data.success,
        eventId: data.event_id,
        metricType,
        thresholdPercentage,
        webhookStatus: data.webhook_status,
        error: data.error,
      }
    } catch (error) {
      analyticsLogger.error('[UsageAlertEngine] emitAlert error:', error)
      return {
        success: false,
        eventId: '',
        metricType,
        thresholdPercentage,
        webhookStatus: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Check if alert can be sent (idempotency check)
   */
  async canSendAlert(metricType: AlertMetricType, threshold: AlertThreshold): Promise<boolean> {
    // Check in-memory cache first
    const cacheKey = this.getCacheKey(metricType, threshold)
    const lastAlertTime = this.lastAlertCache.get(cacheKey)
    if (lastAlertTime && Date.now() - lastAlertTime < ALERT_COOLDOWN_MS) {
      return false
    }

    // Check in database
    try {
      const { data } = await this.supabase
        .rpc('check_alert_idempotency', {
          p_user_id: this.userId,
          p_metric_type: metricType,
          p_threshold_percentage: threshold,
        })

      return Boolean(data === true)
    } catch (error) {
      analyticsLogger.error('[UsageAlertEngine] canSendAlert error:', error)
      return true // Allow if check fails (fail-open)
    }
  }

  /**
   * Get current usage status
   */
  private async getCurrentUsageStatus(): Promise<UsageStatus> {
    try {
      const { data, error } = await this.supabase
        .from('usage_records')
        .select('feature, quantity, recorded_at')
        .eq('user_id', this.userId)
        .gte('recorded_at', this.getTodayStart())

      if (error) {
        throw error
      }

      const limits = await this.getLimits()
      const today = this.getTodayStart()

      const sumMetric = (feature: string) =>
        data
          ?.filter(r => r.feature === feature && new Date(r.recorded_at) >= today)
          .reduce((sum, r) => sum + r.quantity, 0) || 0

      const makeStatus = (used: number, limit: number) => ({
        used,
        limit,
        remaining: limit === -1 ? Infinity : Math.max(0, limit - used),
        percentage: limit === -1 ? 0 : Math.min(100, Math.round((used / limit) * 100)),
      })

      const apiCalls = sumMetric('api_call')
      const tokens = sumMetric('tokens')
      const computeMs = sumMetric('compute_ms')
      const computeMinutes = Math.floor(computeMs / 60000)
      const modelInferences = sumMetric('model_inference')
      const agentExecutions = sumMetric('agent_execution')

      return {
        api_calls: makeStatus(apiCalls, limits.api_calls_per_day),
        tokens: makeStatus(tokens, limits.tokens_per_day),
        compute: makeStatus(computeMinutes, limits.compute_minutes_per_day),
        model_inferences: makeStatus(modelInferences, limits.model_inferences_per_day || -1),
        agent_executions: makeStatus(agentExecutions, limits.agent_executions_per_day || -1),
        isLimited: this.isLimited(apiCalls, tokens, computeMinutes, modelInferences, agentExecutions, limits),
        resetAt: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      }
    } catch (error) {
      analyticsLogger.error('[UsageAlertEngine] getCurrentUsageStatus error:', error)
      return this.getEmptyUsageStatus()
    }
  }

  /**
   * Get tier limits
   */
  private async getLimits(): Promise<TierLimits> {
    // Try to get limits from database first
    if (this.licenseId) {
      try {
        const { data } = await this.supabase
          .from('usage_limits')
          .select('metric_type, limit_value, limit_period')
          .eq('license_id', this.licenseId)

        if (data && data.length > 0) {
          const limits: Partial<TierLimits> = {}
          data.forEach(limit => {
            const key = `${limit.metric_type}_per_${limit.limit_period}` as keyof TierLimits
            limits[key] = limit.limit_value
          })

          // Merge with tier defaults
          const tierDefaults = this.getTierLimits()
          return { ...tierDefaults, ...limits } as TierLimits
        }
      } catch (error) {
        analyticsLogger.error('[UsageAlertEngine] getLimits error:', error)
      }
    }

    return this.getTierLimits()
  }

  /**
   * Get tier limits from hardcoded config
   */
  private getTierLimits(): TierLimits {
    const limits: Record<string, TierLimits> = {
      free: {
        api_calls_per_minute: 5,
        api_calls_per_day: 100,
        tokens_per_day: 10_000,
        compute_minutes_per_day: 10,
        storage_mb: 100,
        bandwidth_mb_per_day: 50,
        model_inferences_per_day: 10,
        agent_executions_per_day: 5,
      },
      basic: {
        api_calls_per_minute: 20,
        api_calls_per_day: 1_000,
        tokens_per_day: 100_000,
        compute_minutes_per_day: 60,
        storage_mb: 1_000,
        bandwidth_mb_per_day: 500,
        model_inferences_per_day: 100,
        agent_executions_per_day: 50,
      },
      premium: {
        api_calls_per_minute: 60,
        api_calls_per_day: 10_000,
        tokens_per_day: 1_000_000,
        compute_minutes_per_day: 300,
        storage_mb: 10_000,
        bandwidth_mb_per_day: 5_000,
        model_inferences_per_day: 1_000,
        agent_executions_per_day: 500,
      },
      enterprise: {
        api_calls_per_minute: 200,
        api_calls_per_day: 100_000,
        tokens_per_day: 10_000_000,
        compute_minutes_per_day: 1_440,
        storage_mb: 100_000,
        bandwidth_mb_per_day: 50_000,
        model_inferences_per_day: 10_000,
        agent_executions_per_day: 5_000,
      },
      master: {
        api_calls_per_minute: 1000,
        api_calls_per_day: -1,
        tokens_per_day: -1,
        compute_minutes_per_day: -1,
        storage_mb: 1_000_000,
        bandwidth_mb_per_day: -1,
        model_inferences_per_day: -1,
        agent_executions_per_day: -1,
      },
    }

    return limits[this.tier] || limits.free
  }

  /**
   * Get customer ID from license
   */
  private async getCustomerId(): Promise<string | null> {
    if (!this.licenseId) return null

    try {
      const { data } = await this.supabase
        .from('raas_licenses')
        .select('metadata')
        .eq('id', this.licenseId)
        .single()

      if (data?.metadata) {
        return (data.metadata as Record<string, unknown>).stripe_customer_id as string ||
          (data.metadata as Record<string, unknown>).polar_customer_id as string || null
      }
    } catch (error) {
      analyticsLogger.error('[UsageAlertEngine] getCustomerId error:', error)
    }

    return null
  }

  /**
   * Check if usage is limited
   */
  private isLimited(
    apiCalls: number,
    tokens: number,
    computeMinutes: number,
    modelInferences: number,
    agentExecutions: number,
    limits: TierLimits
  ): boolean {
    const modelInferencesLimit = limits.model_inferences_per_day ?? -1
    const agentExecutionsLimit = limits.agent_executions_per_day ?? -1

    return (
      apiCalls > limits.api_calls_per_day ||
      tokens > limits.tokens_per_day ||
      computeMinutes > limits.compute_minutes_per_day ||
      (modelInferencesLimit !== -1 && modelInferences > modelInferencesLimit) ||
      (agentExecutionsLimit !== -1 && agentExecutions > agentExecutionsLimit)
    )
  }

  /**
   * Get empty usage status
   */
  private getEmptyUsageStatus(): UsageStatus {
    return {
      api_calls: { used: 0, limit: 0, remaining: 0, percentage: 0 },
      tokens: { used: 0, limit: 0, remaining: 0, percentage: 0 },
      compute: { used: 0, limit: 0, remaining: 0, percentage: 0 },
      model_inferences: { used: 0, limit: 0, remaining: 0, percentage: 0 },
      agent_executions: { used: 0, limit: 0, remaining: 0, percentage: 0 },
      isLimited: false,
      resetAt: undefined,
    }
  }

  /**
   * Get cache key for alert
   */
  private getCacheKey(metricType: AlertMetricType, threshold: AlertThreshold): string {
    return `${this.userId}_${metricType}_${threshold}`
  }

  /**
   * Get today's start (UTC midnight)
   */
  private getTodayStart(): Date {
    const now = new Date()
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  }
}

export default UsageAlertEngine
