/**
 * Tenant Rate Limit Hook - Phase 6.4
 *
 * React hook for monitoring tenant rate limit status.
 * Provides real-time usage tracking and limit information.
 *
 * @example
 * ```typescript
 * const { usage, limits, isLimited, checkLimit } = useTenantRateLimit(tenantId, tier);
 * ```
 */

import { useEffect, useState, useCallback } from 'react'
import { CloudflareRateLimiter } from '@/lib/rate-limiter-cloudflare'
import type { RateLimitConfig, LicenseTier } from '@/lib/rbac-engine'
import type { RateLimitResult } from '@/lib/rate-limiter-cloudflare'

interface UseTenantRateLimitReturn {
  // Current usage
  usage: {
    second: number
    minute: number
    hour: number
    day: number
  } | null

  // Limits
  limits: RateLimitConfig | null

  // Status
  isLimited: boolean
  remaining: number
  resetAt: number | null
  retryAfter: number | null

  // Actions
  checkLimit: () => Promise<void>
  refreshUsage: () => Promise<void>
  loading: boolean
  error: string | null
}

/**
 * Default rate limits per tier (client-side fallback)
 */
const DEFAULT_LIMITS: Record<LicenseTier, RateLimitConfig> = {
  basic: {
    requestsPerSecond: 1,
    requestsPerMinute: 30,
    requestsPerHour: 500,
    requestsPerDay: 5000,
    burstLimit: 3,
    concurrentRequests: 1,
  },
  premium: {
    requestsPerSecond: 10,
    requestsPerMinute: 300,
    requestsPerHour: 5000,
    requestsPerDay: 50000,
    burstLimit: 20,
    concurrentRequests: 5,
  },
  enterprise: {
    requestsPerSecond: 50,
    requestsPerMinute: 2000,
    requestsPerHour: 50000,
    requestsPerDay: 500000,
    burstLimit: 100,
    concurrentRequests: 20,
  },
  master: {
    requestsPerSecond: 200,
    requestsPerMinute: 10000,
    requestsPerHour: 200000,
    requestsPerDay: 2000000,
    burstLimit: 500,
    concurrentRequests: 100,
  },
}

export function useTenantRateLimit(
  tenantId: string | undefined,
  tier: LicenseTier,
  policyId?: string
): UseTenantRateLimitReturn {
  const [usage, setUsage] = useState<UseTenantRateLimitReturn['usage']>(null)
  const [limits, setLimits] = useState<RateLimitConfig | null>(null)
  const [isLimited, setIsLimited] = useState(false)
  const [remaining, setRemaining] = useState(0)
  const [resetAt, setResetAt] = useState<number | null>(null)
  const [retryAfter, setRetryAfter] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [rateLimiter] = useState(() => new CloudflareRateLimiter())

  /**
   * Check rate limit
   */
  const checkLimit = useCallback(async () => {
    if (!tenantId) {
      setError('No tenant ID provided')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const result = await rateLimiter.checkTenantRateLimit(
        tenantId,
        policyId,
        tier
      )

      setLimits(DEFAULT_LIMITS[tier])
      setIsLimited(!result.allowed)
      setRemaining(result.remaining)
      setResetAt(result.resetAt)
      setRetryAfter(result.retryAfter || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rate limit check failed')
      // Use default limits on error
      setLimits(DEFAULT_LIMITS[tier])
    } finally {
      setLoading(false)
    }
  }, [tenantId, tier, policyId, rateLimiter])

  /**
   * Refresh usage statistics
   */
  const refreshUsage = useCallback(async () => {
    if (!tenantId) return

    try {
      const usageData = await rateLimiter.getUsage(tenantId, tier)
      setUsage({
        second: usageData.second.used,
        minute: usageData.minute.used,
        hour: usageData.hour.used,
        day: usageData.day.used,
      })
    } catch (err) {
      console.error('[useTenantRateLimit] refreshUsage error:', err)
    }
  }, [tenantId, tier, rateLimiter])

  useEffect(() => {
    if (tenantId) {
      checkLimit()
      refreshUsage()
    }
  }, [tenantId, checkLimit, refreshUsage])

  return {
    usage,
    limits,
    isLimited,
    remaining,
    resetAt,
    retryAfter,
    checkLimit,
    refreshUsage,
    loading,
    error,
  }
}

export default useTenantRateLimit
