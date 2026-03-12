/**
 * License Analytics Hook - Phase 2.3 Usage Stats + Revenue Dashboard
 *
 * Features:
 * - Usage by license (API calls per tier)
 * - Quota utilization metrics
 * - Model usage breakdown
 * - Revenue tracking (MRR/ARR by tier)
 * - Export to CSV functionality
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { analyticsLogger } from '@/utils/logger'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xwymzrxtxbrhfljvdxcw.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================================================
// TYPES
// ============================================================================

export interface UsageByLicense {
  license_id: string
  tier: string
  period_start: string
  period_end: string
  total_api_calls: number
  total_tokens: number
  agent_executions: number
  avg_daily_usage: number
  peak_usage_date: string
  peak_usage_value: number
}

export interface QuotaUtilization {
  license_id: string
  tier: string
  feature: string
  current_usage: number
  quota_limit: number
  utilization_percentage: number
  tier_category: 'low' | 'medium' | 'high' // <50%, 50-80%, >80%
  days_remaining: number
}

export interface ModelUsage {
  model_name: string
  total_tokens: number
  total_requests: number
  avg_tokens_per_request: number
  percentage_of_total: number
}

export interface RevenueByTierMetrics {
  tier: string
  licenses: number
  mrr_cents: number
  arr_cents: number
  mom_growth: number
  churn_rate: number
  avg_revenue_per_license: number
}

export interface SummaryMetrics {
  total_mrr_cents: number
  total_licenses: number
  avg_utilization: number
  total_api_calls: number
  active_licenses: number
  expiring_soon: number
}

export interface UseLicenseAnalyticsOptions {
  orgId?: string
  days?: number
  enabled?: boolean
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useLicenseAnalytics(options: UseLicenseAnalyticsOptions = {}) {
  const { orgId: _orgId, days = 30, enabled = true } = options
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Data states
  const [usageByLicense, setUsageByLicense] = useState<UsageByLicense[]>([])
  const [quotaUtilization, setQuotaUtilization] = useState<QuotaUtilization[]>([])
  const [modelUsage, setModelUsage] = useState<ModelUsage[]>([])
  const [revenueByTier, setRevenueByTier] = useState<RevenueByTierMetrics[]>([])
  const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetrics | null>(null)

  // ============================================================================
  // FETCH FUNCTIONS
  // ============================================================================

  const fetchUsageByLicense = useCallback(async () => {
    try {
      const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

      const { data, error } = await supabase
        .from('license_usage_aggregations')
        .select('license_id, tier, aggregation_date, api_calls, tokens, agent_executions')
        .gte('aggregation_date', sinceDate)
        .order('aggregation_date', { ascending: false })

      if (error) throw error
      if (!data || data.length === 0) {
        setUsageByLicense([])
        return
      }

      // Aggregate by license
      const licenseMap = new Map<string, UsageByLicense>()
      data.forEach((row: any) => {
        const existing = licenseMap.get(row.license_id) || {
          license_id: row.license_id,
          tier: row.tier || 'premium',
          period_start: sinceDate,
          period_end: new Date().toISOString(),
          total_api_calls: 0,
          total_tokens: 0,
          agent_executions: 0,
          avg_daily_usage: 0,
          peak_usage_date: row.aggregation_date,
          peak_usage_value: 0,
        }

        existing.total_api_calls += row.api_calls || 0
        existing.total_tokens += row.tokens || 0
        existing.agent_executions += row.agent_executions || 0

        if ((row.api_calls || 0) > existing.peak_usage_value) {
          existing.peak_usage_value = row.api_calls
          existing.peak_usage_date = row.aggregation_date
        }

        licenseMap.set(row.license_id, existing)
      })

      // Calculate averages
      const results = Array.from(licenseMap.values()).map((lic) => ({
        ...lic,
        avg_daily_usage: Math.round(lic.total_api_calls / days),
      }))

      setUsageByLicense(results)
    } catch (err: any) {
      analyticsLogger.error('[useLicenseAnalytics] Usage fetch failed', { error: err })
      setUsageByLicense([])
    }
  }, [days])

  const fetchQuotaUtilization = useCallback(async () => {
    try {
      // Get active licenses
      const { data: licenses } = await supabase
        .from('raas_licenses')
        .select('license_id, tier, status')
        .eq('status', 'active')

      if (!licenses || licenses.length === 0) {
        setQuotaUtilization([])
        return
      }

      // Get quota limits by tier (from config or default)
      const tierLimits: Record<string, number> = {
        free: 1000,
        basic: 10000,
        premium: 50000,
        enterprise: 200000,
        master: 1000000,
      }

      // Calculate utilization per license
      const utilizationData: QuotaUtilization[] = licenses.map((lic: any) => {
        const licenseUsage = usageByLicense.find((u) => u.license_id === lic.license_id)
        const quotaLimit = tierLimits[lic.tier] || tierLimits.premium
        const currentUsage = licenseUsage?.total_api_calls || 0
        const utilizationPercentage = Math.round((currentUsage / quotaLimit) * 10000) / 100

        let tierCategory: 'low' | 'medium' | 'high' = 'low'
        if (utilizationPercentage >= 80) tierCategory = 'high'
        else if (utilizationPercentage >= 50) tierCategory = 'medium'

        return {
          license_id: lic.license_id,
          tier: lic.tier,
          feature: 'api_calls',
          current_usage: currentUsage,
          quota_limit: quotaLimit,
          utilization_percentage: utilizationPercentage,
          tier_category: tierCategory,
          days_remaining: 30 - (new Date().getDate() % 30),
        }
      })

      setQuotaUtilization(utilizationData)
    } catch (err: any) {
      analyticsLogger.error('[useLicenseAnalytics] Quota utilization fetch failed', { error: err })
      setQuotaUtilization([])
    }
  }, [usageByLicense])

  const fetchModelUsage = useCallback(async () => {
    try {
      const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

      // Try to get model-specific data if available
      const { data, error } = await supabase
        .from('usage_records')
        .select('model_name, tokens, created_at')
        .gte('created_at', sinceDate)
        .not('model_name', 'is', null)

      if (error || !data || data.length === 0) {
        // Fallback: return aggregate data
        setModelUsage([
          {
            model_name: 'Aggregate',
            total_tokens: usageByLicense.reduce((sum, u) => sum + u.total_tokens, 0),
            total_requests: usageByLicense.reduce((sum, u) => sum + u.total_api_calls, 0),
            avg_tokens_per_request: 0,
            percentage_of_total: 100,
          },
        ])
        return
      }

      // Aggregate by model
      const modelMap = new Map<string, ModelUsage>()
      let grandTotalTokens = 0

      data.forEach((row: any) => {
        const existing = modelMap.get(row.model_name) || {
          model_name: row.model_name,
          total_tokens: 0,
          total_requests: 0,
          avg_tokens_per_request: 0,
          percentage_of_total: 0,
        }

        existing.total_tokens += row.tokens || 0
        existing.total_requests += 1
        grandTotalTokens += row.tokens || 0

        modelMap.set(row.model_name, existing)
      })

      const results = Array.from(modelMap.values()).map((model) => ({
        ...model,
        avg_tokens_per_request: Math.round(model.total_tokens / model.total_requests),
        percentage_of_total: grandTotalTokens > 0 ? Math.round((model.total_tokens / grandTotalTokens) * 10000) / 100 : 0,
      }))

      setModelUsage(results)
    } catch (err: any) {
      analyticsLogger.error('[useLicenseAnalytics] Model usage fetch failed', { error: err })
      // Return empty on error
      setModelUsage([])
    }
  }, [days, usageByLicense])

  const fetchRevenueByTier = useCallback(async () => {
    try {
      // Get licenses by tier
      const { data: licenses } = await supabase
        .from('raas_licenses')
        .select('license_id, tier, status, created_at')
        .eq('status', 'active')

      if (!licenses || licenses.length === 0) {
        setRevenueByTier([])
        return
      }

      // Group by tier
      const tierMap = new Map<string, { tier: string; count: number; ids: string[] }>()
      licenses.forEach((lic: any) => {
        const existing = tierMap.get(lic.tier) || { tier: lic.tier, count: 0, ids: [] as string[] }
        existing.count++
        existing.ids.push(lic.license_id)
        tierMap.set(lic.tier, existing)
      })

      // Get revenue from Polar webhooks
      const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      const prevPeriodStart = new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000).toISOString()

      const { data: webhookEvents } = await supabase
        .from('polar_webhook_events')
        .select('amount_cents, subscription_id, received_at')
        .gte('received_at', sinceDate)
        .eq('event_type', 'subscription.active')

      const { data: prevWebhookEvents } = await supabase
        .from('polar_webhook_events')
        .select('amount_cents, subscription_id, received_at')
        .gte('received_at', prevPeriodStart)
        .lt('received_at', sinceDate)
        .eq('event_type', 'subscription.active')

      const totalRevenue = webhookEvents?.reduce((sum: number, e: any) => sum + (e.amount_cents || 0), 0) || 0
      const prevTotalRevenue = prevWebhookEvents?.reduce((sum: number, e: any) => sum + (e.amount_cents || 0), 0) || 0

      const results: RevenueByTierMetrics[] = Array.from(tierMap.values()).map((tierData) => {
        const licenseRatio = tierData.count / licenses.length
        const tierRevenue = Math.round(totalRevenue * licenseRatio)
        const prevTierRevenue = Math.round(prevTotalRevenue * licenseRatio)
        const mrrCents = Math.round(tierRevenue / days * 30)
        const prevMrrCents = Math.round(prevTierRevenue / days * 30)

        const momGrowth = prevMrrCents > 0 ? Math.round(((mrrCents - prevMrrCents) / prevMrrCents) * 10000) / 100 : 0
        const churnRate = Math.max(0, 5 - momGrowth / 10) // Simplified churn estimation

        return {
          tier: tierData.tier,
          licenses: tierData.count,
          mrr_cents: mrrCents,
          arr_cents: mrrCents * 12,
          mom_growth: momGrowth,
          churn_rate: Math.round(churnRate * 100) / 100,
          avg_revenue_per_license: tierData.count > 0 ? Math.round(mrrCents / tierData.count) : 0,
        }
      }).sort((a, b) => b.mrr_cents - a.mrr_cents)

      setRevenueByTier(results)
    } catch (err: any) {
      analyticsLogger.error('[useLicenseAnalytics] Revenue by tier fetch failed', { error: err })
      setRevenueByTier([])
    }
  }, [days])

  const fetchSummaryMetrics = useCallback(async () => {
    try {
      const { data: licenses } = await supabase
        .from('raas_licenses')
        .select('license_id, tier, status, expires_at')
        .eq('status', 'active')

      if (!licenses || licenses.length === 0) {
        setSummaryMetrics(null)
        return
      }

      const totalMrr = revenueByTier.reduce((sum, t) => sum + t.mrr_cents, 0)
      const totalApiCalls = usageByLicense.reduce((sum, u) => sum + u.total_api_calls, 0)
      const avgUtil = quotaUtilization.length > 0
        ? Math.round(quotaUtilization.reduce((sum, q) => sum + q.utilization_percentage, 0) / quotaUtilization.length)
        : 0

      // Count expiring soon (within 7 days)
      const now = new Date()
      const expiringSoon = licenses.filter((lic: any) => {
        if (!lic.expires_at) return false
        const expires = new Date(lic.expires_at)
        const diffDays = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return diffDays <= 7 && diffDays >= 0
      }).length

      setSummaryMetrics({
        total_mrr_cents: totalMrr,
        total_licenses: licenses.length,
        avg_utilization: avgUtil,
        total_api_calls: totalApiCalls,
        active_licenses: licenses.length,
        expiring_soon: expiringSoon,
      })
    } catch (err: any) {
      analyticsLogger.error('[useLicenseAnalytics] Summary metrics fetch failed', { error: err })
      setSummaryMetrics(null)
    }
  }, [usageByLicense, quotaUtilization, revenueByTier])

  // ============================================================================
  // EXPORT FUNCTION
  // ============================================================================

  const exportToCsv = useCallback(() => {
    const headers = ['License ID', 'Tier', 'API Calls', 'Tokens', 'Utilization %', 'MRR (VND)']
    const rows = usageByLicense.map((usage) => {
      const quota = quotaUtilization.find((q) => q.license_id === usage.license_id)
      const revenue = revenueByTier.find((r) => r.tier === usage.tier)
      return [
        usage.license_id,
        usage.tier,
        usage.total_api_calls.toString(),
        usage.total_tokens.toString(),
        quota?.utilization_percentage.toString() || '0',
        (revenue?.avg_revenue_per_license || 0).toString(),
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `license-analytics-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)

    analyticsLogger.info('[useLicenseAnalytics] CSV exported')
  }, [usageByLicense, quotaUtilization, revenueByTier])

  // ============================================================================
  // REFRESH FUNCTION
  // ============================================================================

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([
        fetchUsageByLicense(),
        fetchRevenueByTier(),
      ])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [fetchUsageByLicense, fetchRevenueByTier])

  // ============================================================================
  // EFFECT: INITIAL LOAD + DEPENDENCY REFRESH
  // ============================================================================

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    const loadAll = async () => {
      try {
        setLoading(true)
        await fetchUsageByLicense()
        await fetchRevenueByTier()
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadAll()
  }, [enabled, fetchUsageByLicense, fetchRevenueByTier])

  useEffect(() => {
    if (usageByLicense.length > 0) {
      fetchQuotaUtilization()
      fetchModelUsage()
    }
  }, [usageByLicense, fetchQuotaUtilization, fetchModelUsage])

  useEffect(() => {
    if (usageByLicense.length > 0 && quotaUtilization.length > 0 && revenueByTier.length > 0) {
      fetchSummaryMetrics()
    }
  }, [usageByLicense, quotaUtilization, revenueByTier, fetchSummaryMetrics])

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    loading,
    error,
    usageByLicense,
    quotaUtilization,
    modelUsage,
    revenueByTier,
    summaryMetrics,
    exportToCsv,
    refresh,
  }
}

export default useLicenseAnalytics
