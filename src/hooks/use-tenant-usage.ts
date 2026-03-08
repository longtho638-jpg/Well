/**
 * Tenant Usage Hook - Phase 6.5
 *
 * React hook for monitoring tenant usage statistics.
 * Provides real-time usage tracking, quota monitoring, and overage alerts.
 *
 * @example
 * ```typescript
 * const { usage, overages, percentages, refresh } = useTenantUsage(tenantId);
 * ```
 */

import { useEffect, useState, useCallback } from 'react'
import { tenantLicenseClient, type TenantUsageSummary } from '@/lib/tenant-license-client'

interface MetricData {
  used: number
  limit: number
  percentage: number
  formatted: string
}

interface UseTenantUsageReturn {
  // Usage summary
  summary: TenantUsageSummary | null

  // Formatted metrics
  metrics: Record<string, MetricData>

  // Overage alerts
  overages: Array<{
    metricType: string
    used: number
    limit: number
    overageAmount: number
    overageCost?: number
  }>

  // Status
  hasOverages: boolean
  isNearLimit: boolean
  totalPercentage: number

  // Actions
  refresh: () => Promise<void>
  loading: boolean
  error: string | null
}

/**
 * Format large numbers with K/M/B suffixes
 */
function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + 'B'
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M'
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K'
  }
  return num.toString()
}

/**
 * Get metric display label
 */
function getMetricLabel(metricType: string): string {
  const labels: Record<string, string> = {
    api_calls: 'API Calls',
    tokens: 'Tokens',
    compute_minutes: 'Compute Time',
    model_inferences: 'AI Inferences',
    agent_executions: 'Agent Executions',
  }
  return labels[metricType] || metricType
}

export function useTenantUsage(tenantId: string | undefined): UseTenantUsageReturn {
  const [summary, setSummary] = useState<TenantUsageSummary | null>(null)
  const [metrics, setMetrics] = useState<Record<string, MetricData>>({})
  const [overages, setOverages] = useState<UseTenantUsageReturn['overages']>([])
  const [hasOverages, setHasOverages] = useState(false)
  const [isNearLimit, setIsNearLimit] = useState(false)
  const [totalPercentage, setTotalPercentage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch usage summary
   */
  const fetchUsage = useCallback(async () => {
    if (!tenantId) {
      setSummary(null)
      setMetrics({})
      setOverages([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const data = await tenantLicenseClient.getUsageSummary(tenantId)
      setSummary(data)

      if (data) {
        // Build formatted metrics
        const formattedMetrics: Record<string, MetricData> = {}
        let totalPct = 0
        let metricCount = 0

        for (const [key, value] of Object.entries(data.metrics)) {
          formattedMetrics[key] = {
            used: value.used,
            limit: value.limit,
            percentage: value.percentage,
            formatted: `${formatNumber(value.used)} / ${formatNumber(value.limit)} (${value.percentage}%)`,
          }
          totalPct += value.percentage
          metricCount++
        }

        setMetrics(formattedMetrics)
        setTotalPercentage(metricCount > 0 ? Math.round(totalPct / metricCount) : 0)

        // Set overages
        const overageList = data.overages.map(o => ({
          metricType: getMetricLabel(o.metricType),
          used: o.used,
          limit: o.limit,
          overageAmount: o.overageAmount,
          overageCost: o.overageCost,
        }))
        setOverages(overageList)
        setHasOverages(overageList.length > 0)

        // Check if near limit (any metric >= 80%)
        const nearLimit = Object.values(data.metrics).some(m => m.percentage >= 80)
        setIsNearLimit(nearLimit)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch usage')
      setSummary(null)
      setMetrics({})
      setOverages([])
      setHasOverages(false)
      setIsNearLimit(false)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    fetchUsage()
  }, [fetchUsage])

  return {
    summary,
    metrics,
    overages,
    hasOverages,
    isNearLimit,
    totalPercentage,
    refresh: fetchUsage,
    loading,
    error,
  }
}

export default useTenantUsage
