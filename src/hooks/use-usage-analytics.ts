/**
 * Usage Analytics Hook - Phase 5 Analytics Dashboard
 *
 * Wraps UsageAnalytics SDK for React components
 * Provides usage trends, quota utilization, top consumers, anomaly detection
 */

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { UsageAnalytics } from '@/lib/usage-analytics'
import { UsageMeter } from '@/lib/usage-metering'

export interface UsageTrendData {
  period_start: string
  feature: string
  total_quantity: number
  event_count: number
}

export interface QuotaUtilization {
  feature: string
  total_usage: number
  usage_date: string
  days_remaining: number
}

export interface TopConsumer {
  license_id: string
  user_id: string
  feature: string
  total_usage: number
  total_events: number
  last_activity: string
  avg_daily_usage: number
}

export interface AnomalyAlert {
  usage_date: string
  feature: string
  actual_value: number
  expected_value: number
  std_dev: number
  z_score: number
  is_anomaly: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface BillingProjection {
  period_start: string
  period_end: string
  current_usage: number
  projected_usage: number
  days_elapsed: number
  days_total: number
  projection_confidence: 'low' | 'medium' | 'high'
}

export interface UseUsageAnalyticsOptions {
  userId?: string
  licenseId?: string
  orgId?: string
  enabled?: boolean
}

export function useUsageAnalytics(options: UseUsageAnalyticsOptions = {}) {
  const { userId, licenseId, orgId, enabled = true } = options
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const analytics = new UsageAnalytics(supabase, {
    userId: userId || 'anonymous',
    licenseId,
    orgId,
  })

  const meter = useMemo(() => new UsageMeter(supabase, {
    userId: userId || 'anonymous',
    licenseId,
    orgId,
  }), [supabase, userId, licenseId, orgId])

  // Get usage trends
  const getTrends = useCallback(async (params: {
    granularity: 'hour' | 'day' | 'week' | 'month'
    days: number
    features?: string[]
  }): Promise<UsageTrendData[]> => {
    try {
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - params.days * 24 * 60 * 60 * 1000)

      const { data, error } = await supabase.rpc('get_usage_trends', {
        p_user_id: userId,
        p_license_id: licenseId,
        p_start_date: startDate.toISOString().split('T')[0],
        p_end_date: endDate.toISOString().split('T')[0],
        p_granularity: params.granularity,
      })

      if (error) throw error

      let trends = data || []
      if (params.features && params.features.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        trends = trends.filter((t: any) => params.features!.includes(t.feature))
      }

      return trends
    } catch (err) {
      console.error('[useUsageAnalytics] getTrends error:', err)
      throw err
    }
  }, [userId, licenseId, supabase])

  // Get quota utilization
  const getQuotaUtilization = useCallback(async (): Promise<QuotaUtilization[]> => {
    try {
      if (!licenseId) return []

      const { data, error } = await supabase.rpc('get_quota_utilization', {
        p_license_id: licenseId,
      })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('[useUsageAnalytics] getQuotaUtilization error:', err)
      throw err
    }
  }, [licenseId, supabase])

  // Get top consumers
  const getTopConsumers = useCallback(async (params: {
    limit?: number
    feature?: string
    periodDays?: number
  }): Promise<TopConsumer[]> => {
    try {
      const { data, error } = await supabase.rpc('get_top_customers', {
        p_limit: params.limit || 10,
        p_feature: params.feature,
        p_period_days: params.periodDays || 30,
      })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('[useUsageAnalytics] getTopConsumers error:', err)
      throw err
    }
  }, [supabase])

  // Detect anomalies
  const detectAnomalies = useCallback(async (params: {
    feature?: string
    zscoreThreshold?: number
  }): Promise<AnomalyAlert[]> => {
    try {
      const { data, error } = await supabase.rpc('detect_usage_anomalies', {
        p_user_id: userId,
        p_license_id: licenseId,
        p_feature: params.feature,
        p_zscore_threshold: params.zscoreThreshold || 3.0,
      })

      if (error) throw error
      return (data || []).filter((a: AnomalyAlert) => a.is_anomaly)
    } catch (err) {
      console.error('[useUsageAnalytics] detectAnomalies error:', err)
      throw err
    }
  }, [userId, licenseId, supabase])

  // Get billing projection
  const getBillingProjection = useCallback(async (params: {
    subscriptionItemId: string
  }): Promise<BillingProjection | null> => {
    try {
      if (!licenseId) return null

      const { data, error } = await supabase.rpc('get_billing_projection', {
        p_license_id: licenseId,
        p_subscription_item_id: params.subscriptionItemId,
      })

      if (error) throw error
      return data?.[0] || null
    } catch (err) {
      console.error('[useUsageAnalytics] getBillingProjection error:', err)
      throw err
    }
  }, [licenseId, supabase])

  // Get current usage status
  const [usageStatus, setUsageStatus] = useState<any>(null)

  useEffect(() => {
    if (!enabled || !userId) {
      setLoading(false)
      return
    }

    const fetchUsageStatus = async () => {
      try {
        setLoading(true)
        const status = await meter.getUsageStatus()
        setUsageStatus(status)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch usage')
      } finally {
        setLoading(false)
      }
    }

    fetchUsageStatus()
    const interval = setInterval(fetchUsageStatus, 30000) // Poll every 30s

    return () => clearInterval(interval)
  }, [userId, licenseId, enabled, meter])

  return {
    loading,
    error,
    usageStatus,
    getTrends,
    getQuotaUtilization,
    getTopConsumers,
    detectAnomalies,
    getBillingProjection,
    refresh: () => meter.getUsageStatus().then(setUsageStatus),
  }
}

export default useUsageAnalytics
