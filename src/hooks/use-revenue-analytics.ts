/**
 * Revenue Hooks - ROIaaS Phase 5
 *
 * React hooks for fetching revenue, ROI, and user metrics data
 */

import { useState, useEffect, useCallback } from 'react'
import type { RevenueSnapshot, ROICalculation, UserMetrics, RevenueDashboardData, CostConfig } from '@/types/revenue-analytics'
import { DEFAULT_COST_CONFIG, TIER_PRICING } from '@/types/revenue-analytics'

/**
 * Hook: Fetch revenue analytics data
 */
export function useRevenue(options?: {
  days?: number
  autoRefresh?: boolean
  refreshInterval?: number
}) {
  const [data, setData] = useState<RevenueDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const days = options?.days || 30
  const autoRefresh = options?.autoRefresh || false
  const refreshInterval = options?.refreshInterval || 30000

  const fetchRevenue = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      // Mock data for Phase 5 - real implementation needs Supabase client
      setData({
        currentSnapshot: {
          id: '1',
          snapshot_date: new Date().toISOString().split('T')[0],
          gmv: { total: 150000000, subscription: 120000000, usage_based: 30000000 },
          mrr: { total: 150000000, new: 20000000, expansion: 10000000, contraction: 5000000, churn: 3000000 },
          arr: { total: 1800000000 },
          customers: { total: 250, new: 25, churned: 5 },
          tier_breakdown: { free: 100, basic: 80, premium: 50, enterprise: 15, master: 5 },
        },
        previousSnapshot: {
          id: '2',
          snapshot_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          gmv: { total: 130000000, subscription: 100000000, usage_based: 30000000 },
          mrr: { total: 130000000, new: 15000000, expansion: 8000000, contraction: 4000000, churn: 2500000 },
          arr: { total: 1500000000 },
          customers: { total: 230, new: 20, churned: 3 },
          tier_breakdown: { free: 100, basic: 75, premium: 45, enterprise: 10, master: 5 },
        },
        trend: { gmv: 15.5, mrr: 12.3, arr: 18.7, customers: 8.5 },
      })
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    const loadData = async () => {
      await fetchRevenue()
    }
    loadData()

    if (autoRefresh) {
      const interval = setInterval(loadData, refreshInterval)
      return () => clearInterval(interval)
    }
    return undefined
  }, [fetchRevenue, autoRefresh, refreshInterval])

  return { data, loading, error, refresh: fetchRevenue }
}

/**
 * Hook: Fetch ROI calculations
 */
export function useROI(options?: {
  licenseId?: string
  userId?: string
  days?: number
}) {
  const [data, setData] = useState<ROICalculation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const licenseId = options?.licenseId
  const userId = options?.userId
  const days = options?.days || 30

  useEffect(() => {
    async function fetchROI() {
      try {
        setLoading(true)
        // Mock data for Phase 5 - real implementation needs Supabase client
        const mockROI: ROICalculation[] = [
          {
            id: '1',
            license_id: 'lic_123',
            user_id: 'user_456',
            calculation_date: new Date().toISOString(),
            revenue: { subscription: 1000000, usage_based: 500000, total: 1500000 },
            costs: { api_calls: 200000, tokens: 300000, compute: 100000, total: 600000 },
            metrics: { roi_absolute: 900000, roi_percentage: 150, margin_percentage: 60 },
            usage: { api_calls: 500000, tokens: 1000000, agent_executions: 100 },
          },
        ]
        setData(mockROI)
        setError(null)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchROI()
  }, [licenseId, userId, days])

  return { data, loading, error }
}

/**
 * Hook: Fetch user metrics (DAU/MAU, conversion, churn)
 */
export function useUserMetrics(options?: {
  days?: number
}) {
  const [data, setData] = useState<UserMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const days = options?.days || 30

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true)
        // Mock data for Phase 5 - real implementation needs Supabase client
        setData({
          dau: 1250,
          mau: 4500,
          dau_mau_ratio: 0.28,
          conversion_rate: 10.5,
          churn_rate: 2.1,
          retention_rate: 72.5,
        })
        setError(null)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [days])

  return { data, loading, error }
}

/**
 * Hook: Calculate ROI with custom cost configuration
 */
export function useROICalculator(
  revenue: number,
  usage: {
    api_calls: number
    tokens: number
    compute_ms: number
    agent_executions: number
  },
  costConfig: CostConfig = DEFAULT_COST_CONFIG
) {
  const [roi, setRoi] = useState<{
    absolute: number
    percentage: number
    margin: number
    costs: number
    breakdown: Record<string, number>
  } | null>(null)

  useEffect(() => {
    const costs = {
      api_calls: (usage.api_calls / 1000) * costConfig.cost_per_1k_api_calls,
      tokens: (usage.tokens / 1000) * costConfig.cost_per_1k_tokens,
      compute: (usage.compute_ms / 60000) * costConfig.cost_per_minute_compute,
      agent_executions: usage.agent_executions * costConfig.cost_per_agent_execution,
    }

    const totalCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0)
    const absoluteROI = revenue - totalCost
    const roiPercentage = totalCost > 0 ? (absoluteROI / totalCost) * 100 : 0
    const marginPercentage = revenue > 0 ? (absoluteROI / revenue) * 100 : 0

    setRoi({
      absolute: absoluteROI,
      percentage: roiPercentage,
      margin: marginPercentage,
      costs: totalCost,
      breakdown: costs,
    })
  }, [revenue, usage, costConfig])

  return roi
}

// ============================================================================
// TRANSFORM HELPERS
// ============================================================================

function transformSnapshot(row: any): RevenueSnapshot {
  return {
    id: row.id,
    snapshot_date: row.snapshot_date,
    gmv: {
      total: Number(row.gmv_total),
      subscription: Number(row.gmv_subscription),
      usage_based: Number(row.gmv_usage_based),
    },
    mrr: {
      total: Number(row.mrr_total),
      new: Number(row.mrr_new),
      expansion: Number(row.mrr_expansion),
      contraction: Number(row.mrr_contraction),
      churn: Number(row.mrr_churn),
    },
    arr: {
      total: Number(row.arr_total),
    },
    customers: {
      total: row.total_customers,
      new: row.new_customers,
      churned: row.churned_customers,
    },
    tier_breakdown: row.tier_breakdown,
  }
}

function transformROICalculation(row: any): ROICalculation {
  return {
    id: row.id,
    license_id: row.license_id,
    user_id: row.user_id,
    calculation_date: row.calculation_date,
    revenue: {
      subscription: Number(row.revenue_subscription),
      usage_based: Number(row.revenue_usage_based),
      total: Number(row.revenue_total),
    },
    costs: {
      api_calls: Number(row.cost_api_calls),
      tokens: Number(row.cost_tokens),
      compute: Number(row.cost_compute),
      total: Number(row.cost_total),
    },
    metrics: {
      roi_absolute: Number(row.roi_absolute),
      roi_percentage: Number(row.roi_percentage),
      margin_percentage: Number(row.margin_percentage),
    },
    usage: {
      api_calls: row.api_calls,
      tokens: row.tokens,
      agent_executions: row.agent_executions,
    },
  }
}
