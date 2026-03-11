/**
 * Usage Metering Hooks
 *
 * React hooks for usage tracking and quota management.
 * Split into multiple files to stay under 200 lines.
 */

import { useState, useEffect, useCallback, createContext, useContext, ReactNode, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { UsageMeter } from '@/lib/usage-metering'
import { useStore } from '@/store'
import { useRaasLicenses } from './use-raas-licenses'
import type { UsageStatus } from '@/lib/usage-metering'
import type { LicenseTier, UsageSummary, QuotaAlert } from '@/types/usage'
import type { UsageContextValue, QuotaCheckResponse, UseUsageReturn } from './use-usage-metering-types'
import { createLogger } from '@/utils/logger'

const logger = createLogger('useUsageMetering')

const supabase = createClient(
  (import.meta as any).env.VITE_SUPABASE_URL,
  (import.meta as any).env.VITE_SUPABASE_ANON_KEY
)

const UsageContext = createContext<UsageContextValue | null>(null)

/**
 * useUsage - Fetch and track usage metrics
 */
export function useUsage(periodStart?: string, periodEnd?: string): UseUsageReturn {
  const { user } = useStore()
  const { licenses } = useRaasLicenses()
  const [usage, setUsage] = useState<UsageStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tier, setTier] = useState<LicenseTier>('free')
  const [licenseId, setLicenseId] = useState<string | null>(null)

  useEffect(() => {
    if (licenses && user) {
      const activeLicense = licenses.find(l => l.user_id === user.id && l.status === 'active')
      if (activeLicense) {
        setLicenseId(activeLicense.id)
        const tierFromMetadata = (activeLicense.metadata?.tier as LicenseTier) || 'premium'
        setTier(tierFromMetadata)
      }
    }
  }, [licenses, user])

  const fetchUsage = useCallback(async () => {
    if (!user) {
      setUsage(null)
      setLoading(false)
      return
    }

    try {
      const meter = new UsageMeter(supabase, {
        userId: user.id,
        licenseId: licenseId || undefined,
        tier,
      })
      const status = await meter.getUsageStatus(periodStart, periodEnd)
      setUsage(status)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [user, licenseId, tier, periodStart, periodEnd])

  const trackUsage = useCallback(async (
    metric: string,
    data: { quantity?: number; tokens?: number; metadata?: Record<string, unknown> }
  ) => {
    if (!user) return
    const meter = new UsageMeter(supabase, {
      userId: user.id,
      licenseId: licenseId || undefined,
      tier,
    })
    await meter.track(metric as any, data)
    await fetchUsage()
  }, [user, licenseId, tier, fetchUsage])

  useEffect(() => {
    fetchUsage()
    const interval = setInterval(fetchUsage, 30000)
    return () => clearInterval(interval)
  }, [fetchUsage])

  return { usage, loading, error, trackUsage, refresh: fetchUsage, tier, licenseId }
}

/**
 * useQuota - Check quota status and warnings
 */
export function useQuota() {
  const { user } = useStore()
  const { tier, licenseId } = useUsage()
  const [quotas, setQuotas] = useState<Record<string, QuotaCheckResponse>>({})
  const [warnings, setWarnings] = useState<string[]>([])
  const [alerts, setAlerts] = useState<QuotaAlert[]>([])
  const [isLimited, setIsLimited] = useState(false)

  const checkQuota = useCallback(async (feature: string): Promise<QuotaCheckResponse> => {
    if (!user) {
      return { allowed: true, current_usage: 0, limit: -1, remaining: Infinity, percentage: 0, reset_at: '' }
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/check_quota`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            p_user_id: user.id,
            p_feature: feature,
          }),
        }
      )

      if (response.status === 429) {
        setIsLimited(true)
      }

      const data = await response.json()

      const newWarnings: string[] = []
      if (data.percentage >= 90) {
        newWarnings.push(`Cảnh báo: Đã sử dụng ${data.percentage}% quota ${feature}`)
      } else if (data.percentage >= 80) {
        newWarnings.push(`Lưu ý: Đã sử dụng ${data.percentage}% quota ${feature}`)
      }

      if (data.warnings) {
        setWarnings(prev => [...prev, ...data.warnings])
      }
      if (newWarnings.length > 0) {
        setWarnings(prev => [...prev, ...newWarnings])
      }

      setAlerts(prev => {
        const existing = prev.filter(a => a.metric !== feature)
        if (data.percentage >= 90) {
          return [...existing, { metric: feature as keyof UsageStatus, threshold: 90, triggered: true }]
        } else if (data.percentage >= 80) {
          return [...existing, { metric: feature as keyof UsageStatus, threshold: 80, triggered: true }]
        }
        return existing
      })

      return data
    } catch (error) {
      logger.error('Quota check failed', { error })
      return { allowed: false, current_usage: 0, limit: 0, remaining: 0, percentage: 0, reset_at: '', error: 'Failed to check quota' }
    }
  }, [user])

  useEffect(() => {
    const features = ['api_call', 'tokens', 'model_inference', 'agent_execution', 'compute_ms']
    features.forEach(feature => {
      checkQuota(feature).then(data => {
        setQuotas(prev => ({ ...prev, [feature]: data }))
      })
    })

    const interval = setInterval(() => {
      features.forEach(feature => {
        checkQuota(feature).then(data => {
          setQuotas(prev => ({ ...prev, [feature]: data }))
        })
      })
    }, 60000)

    return () => clearInterval(interval)
  }, [checkQuota])

  return { quotas, warnings, alerts, isLimited, checkQuota }
}

/**
 * useUsageMeter - Get UsageMeter SDK instance
 */
export function useUsageMeter() {
  const { user } = useStore()
  const { tier, licenseId } = useUsage()

  const meter = useMemo(() => (
    user ? new UsageMeter(supabase, {
      userId: user.id,
      licenseId: licenseId || undefined,
      tier,
    }) : null
  ), [user, tier, licenseId])

  return { meter, instance: meter }
}

export function UsageProvider({ children }: { children: ReactNode }) {
  const { user } = useStore()
  const { usage, loading: usageLoading, error: usageError, trackUsage, refresh } = useUsage()
  const { checkQuota } = useQuota()
  const { tier, licenseId } = useUsage()

  const value: UsageContextValue = {
    userId: user?.id || null,
    licenseId: licenseId || null,
    tier,
    usage,
    loading: usageLoading,
    error: usageError,
    trackUsage,
    checkQuota,
    refresh,
    meter: user ? new UsageMeter(supabase, { userId: user.id, licenseId: licenseId || undefined, tier }) : null,
  }

  return (
    <UsageContext.Provider value={value}>
      {children}
    </UsageContext.Provider>
  )
}

/**
 * useUsageContext - Get usage context value
 */
export function useUsageContext() {
  const context = useContext(UsageContext)
  if (!context) {
    throw new Error('useUsageContext must be used within UsageProvider')
  }
  return context
}

/**
 * useUsageSummary - Get formatted usage summary for dashboard cards
 */
export function useUsageSummary(): UsageSummary | null {
  const { usage, tier } = useUsageContext()

  if (!usage) return null

  return {
    apiCalls: {
      used: usage.api_calls.used,
      limit: usage.api_calls.limit,
      percentage: usage.api_calls.percentage,
    },
    tokens: {
      used: usage.tokens.used,
      limit: usage.tokens.limit,
      percentage: usage.tokens.percentage,
    },
    computeMinutes: {
      used: usage.compute.used,
      limit: usage.compute.limit,
      percentage: usage.compute.percentage,
    },
    modelInferences: {
      used: usage.model_inferences.used,
      limit: usage.model_inferences.limit,
      percentage: usage.model_inferences.percentage,
    },
    agentExecutions: {
      used: usage.agent_executions.used,
      limit: usage.agent_executions.limit,
      percentage: usage.agent_executions.percentage,
    },
    isLimited: usage.isLimited,
    resetAt: usage.resetAt,
    tier,
  }
}

/**
 * QuotaGuard - Component to protect features based on quota
 */
export function QuotaGuard({
  feature,
  children,
  fallback
}: {
  feature: string
  children: ReactNode
  fallback?: ReactNode
}) {
  const { checkQuota, isLimited } = useQuota()
  const [allowed, setAllowed] = useState(true)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    checkQuota(feature).then(data => {
      setAllowed(data.allowed)
      setChecking(false)
    })
  }, [feature, checkQuota])

  if (checking) {
    return <div className="text-sm text-gray-400">Checking quota...</div>
  }

  if (!allowed || isLimited) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}

export default {
  useUsage,
  useQuota,
  useUsageMeter,
  UsageProvider,
  useUsageContext,
  useUsageSummary,
  QuotaGuard,
}
