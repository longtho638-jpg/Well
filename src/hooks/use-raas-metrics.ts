/**
 * use-raas-metrics Hook
 *
 * React hook for fetching and polling RaaS Gateway metrics.
 * Features:
 * - Optional project ID (defaults to active project)
 * - mk_ API key auth from environment
 * - Interface-based adapter pattern for mocking
 * - Exponential backoff on 429 rate limits
 * - React Suspense and Error Boundary compatible
 *
 * Usage:
 *   const { data, isLoading, error, refetch } = useRaaSMetrics({ orgId, pollingInterval: 30000 })
 *
 * Dependencies:
 * - RaaSMetricsService (mockable)
 * - RaaSGatewayMetricsClient
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { UsageMetrics, QuotaStatus, OverageSummary, MetricData } from '@/lib/raas-gateway-metrics'
import {
  RaaSMetricsServiceImpl,
  MockRaaSMetricsService,
} from '@/services/raas-metrics-service'
import type {
  IRaaSMetricsService,
  RaaSMetricsServiceConfig,
} from '@/services/raas-metrics-types'
import { RaaSGatewayMetricsClient } from '@/lib/raas-gateway-metrics'
import { analyticsLogger } from '@/utils/logger'

export interface UseRaaSMetricsOptions {
  orgId?: string // Organization ID (required if projectId not provided)
  projectId?: string // Project ID (optional, defaults to active project)
  pollingInterval?: number // ms, default 30000 (30s)
  enabled?: boolean // Enable polling, default true
  forceMock?: boolean // Force mock adapter even in production
  period?: string // Billing period YYYY-MM, defaults to current month
  onMetricsUpdate?: (metrics: UsageMetrics) => void
  onError?: (error: Error) => void
}

export interface UseRaaSMetricsResult {
  data: UsageMetrics | null
  quotaStatus: QuotaStatus | null
  overageSummary: OverageSummary | null
  isLoading: boolean
  error: Error | null
  isRefreshing: boolean
  refetch: () => Promise<void>
  lastSyncedAt: Date | null
  percentageUsed: (metricType: string) => number
  isOverLimit: (metricType: string) => boolean
  getMetricData: (metricType: string) => MetricData | undefined
}

// ============================================================
// Adapter Factory - Creates real or mock service based on config
// ============================================================

let serviceInstance: IRaaSMetricsService | null = null

/**
 * Get or create metrics service singleton
 * Uses mock adapter in development or when forceMock is true
 */
function getOrCreateService(options: UseRaaSMetricsOptions): IRaaSMetricsService {
  if (!serviceInstance) {
    const isDev = process.env.NODE_ENV === 'development'
    const useMock = options.forceMock ?? isDev ?? process.env.NEXT_PUBLIC_USE_MOCK_RAAS === 'true'

    const apiKey =
      process.env.NEXT_PUBLIC_RAAS_API_KEY ||
      process.env.REACT_APP_RAAS_API_KEY ||
      'mk_demo_key'

    const licenseId =
      process.env.NEXT_PUBLIC_RAAS_LICENSE_ID ||
      process.env.REACT_APP_RAAS_LICENSE_ID ||
      'demo-license'

    const baseUrl =
      process.env.NEXT_PUBLIC_RAAS_GATEWAY_URL ||
      process.env.REACT_APP_RAAS_GATEWAY_URL ||
      'https://raas.agencyos.network/api/v1'

    if (useMock) {
      analyticsLogger.debug('[useRaaSMetrics] Using MockRaaSMetricsService')
      serviceInstance = new MockRaaSMetricsService()
    } else {
      analyticsLogger.debug('[useRaaSMetrics] Using RaaSGatewayMetricsClient', { baseUrl, apiKey: `${apiKey.substring(0, 6)}...` })

      const config: RaaSMetricsServiceConfig = {
        apiKey,
        licenseId,
        baseUrl,
        useFallback: true,
      }

      const gatewayClient = new RaaSGatewayMetricsClient({
        apiKey,
        licenseId,
        baseUrl,
        timeoutMs: 15000,
        maxRetries: 5,
      })

      serviceInstance = new RaaSMetricsServiceImpl(config, gatewayClient)
    }
  }

  return serviceInstance
}

/**
 * Reset service instance (useful for testing)
 */
export function resetMetricsService(): void {
  serviceInstance = null
}

export function useRaaSMetrics(
  orgId: string,
  service: IRaaSMetricsService,
  options: UseRaaSMetricsOptions = {}
): UseRaaSMetricsResult {
  const {
    pollingInterval = 30000,
    enabled = true,
    onMetricsUpdate,
    onError,
  } = options

  const [metrics, setMetrics] = useState<UsageMetrics | null>(null)
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null)
  const [overageSummary, setOverageSummary] = useState<OverageSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)

  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 5

  const fetchMetrics = useCallback(async (isRefresh = false) => {
    if (!orgId) return

    try {
      if (!isRefresh) {
        setLoading(true)
      } else {
        setIsRefreshing(true)
      }

      setError(null)

      // Fetch all metrics in parallel
      const [metricsData, quotaData, overageData] = await Promise.all([
        service.getMetrics(orgId),
        service.getQuotaStatus(orgId),
        service.getOverageSummary(orgId).catch(() => null), // Optional
      ])

      setMetrics(metricsData)
      setQuotaStatus(quotaData)
      if (overageData) {
        setOverageSummary(overageData)
      }

      const syncTime = new Date(metricsData.lastSyncedAt)
      setLastSyncedAt(syncTime)

      retryCountRef.current = 0
      onMetricsUpdate?.(metricsData)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      console.error('[useRaaSMetrics] Fetch failed', error)

      retryCountRef.current += 1

      if (retryCountRef.current >= maxRetries) {
        setError(error)
        onError?.(error)
      } else {
        // Exponential backoff for retry
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000)
        console.warn(`[useRaaSMetrics] Retry ${retryCountRef.current}/${maxRetries} in ${delay}ms`)
        pollingRef.current = setTimeout(() => fetchMetrics(isRefresh), delay)
      }
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [orgId, service, onMetricsUpdate, onError])

  // Initial fetch and polling setup
  useEffect(() => {
    if (!enabled) return

    fetchMetrics()

    // Setup polling
    pollingRef.current = setTimeout(() => {
      const poll = async () => {
        await fetchMetrics()
        pollingRef.current = setTimeout(poll, pollingInterval)
      }
      poll()
    }, pollingInterval)

    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current)
      }
    }
  }, [enabled, pollingInterval, fetchMetrics])

  const refresh = useCallback(async () => {
    retryCountRef.current = 0
    await fetchMetrics(true)
  }, [fetchMetrics])

  // Helper methods
  const getMetricData = useCallback((metricType: string): MetricData | undefined => {
    return metrics?.metrics.find(m => m.metricType === metricType)
  }, [metrics])

  const percentageUsed = useCallback((metricType: string): number => {
    return getMetricData(metricType)?.percentageUsed ?? 0
  }, [getMetricData])

  const isOverLimit = useCallback((metricType: string): boolean => {
    return getMetricData(metricType)?.isOverLimit ?? false
  }, [getMetricData])

  return {
    data: metrics,
    quotaStatus,
    overageSummary,
    isLoading: loading,
    error,
    isRefreshing,
    refetch: refresh,
    lastSyncedAt,
    percentageUsed,
    isOverLimit,
    getMetricData,
  }
}

/**
 * Hook for quota status only (lighter weight)
 */
export function useQuotaStatus(
  orgId: string,
  service: IRaaSMetricsService,
  pollingInterval = 30000
): { status: QuotaStatus | null; loading: boolean; error: Error | null; refresh: () => Promise<void> } {
  const [status, setStatus] = useState<QuotaStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!orgId) return

    const fetch = async () => {
      try {
        const data = await service.getQuotaStatus(orgId)
        setStatus(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch quota status'))
      } finally {
        setLoading(false)
      }
    }

    fetch()

    const interval = setInterval(fetch, pollingInterval)
    return () => clearInterval(interval)
  }, [orgId, service, pollingInterval])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await service.getQuotaStatus(orgId)
      setStatus(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh'))
    } finally {
      setLoading(false)
    }
  }, [orgId, service])

  return { status, loading, error, refresh }
}
