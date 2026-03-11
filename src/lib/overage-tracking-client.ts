/**
 * Overage Tracking Client - Phase 7.1
 *
 * React hooks and client library for overage tracking.
 * Provides real-time overage status, history, and cost calculations.
 *
 * Usage:
 *   const { overages, totalCost, loading } = useOverageStatus();
 *   const { history } = useOverageHistory({ billingPeriod: '2026-03' });
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { OverageMetricType } from './overage-calculator-types'
import { createLogger } from '@/utils/logger'

// Re-export OverageMetricType for consumers
export type { OverageMetricType }

const logger = createLogger('OverageTracking')

/**
 * Raw database row type for overage transactions
 */
interface OverageTransactionRow {
  id: string
  metric_type: string
  total_usage: number
  included_quota: number
  overage_units: number
  rate_per_unit: string | number
  total_cost: string | number
  billing_period: string
  stripe_sync_status: string
  created_at: string
}

export interface OverageTransaction {
  id: string
  metricType: OverageMetricType
  totalUsage: number
  includedQuota: number
  overageUnits: number
  ratePerUnit: number
  totalCost: number
  billingPeriod: string
  stripeSyncStatus: 'pending' | 'synced' | 'failed'
  createdAt: string
}

export interface OverageSummary {
  totalCost: number
  totalTransactions: number
  breakdownByMetric: Record<OverageMetricType, number>
  isOverLimit: boolean
}

export interface UseOverageStatusOptions {
  orgId?: string
  billingPeriod?: string
  enabled?: boolean
  refreshInterval?: number
}

export interface UseOverageHistoryOptions {
  billingPeriod?: string
  metricType?: OverageMetricType
  limit?: number
}

/**
 * Get current overage status for org
 */
export function useOverageStatus(options: UseOverageStatusOptions = {}) {
  const {
    orgId,
    billingPeriod = new Date().toISOString().slice(0, 7), // '2026-03'
    enabled = true,
    refreshInterval = 30000, // 30 seconds
  } = options

  const [overages, setOverages] = useState<OverageTransaction[]>([])
  const [summary, setSummary] = useState<OverageSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOverages = async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)

      // Fetch overage transactions
      let query = supabase
        .from('overage_transactions')
        .select('*')
        .eq('billing_period', billingPeriod)
        .order('created_at', { ascending: false })

      if (orgId) {
        query = query.eq('org_id', orgId)
      }

      const { data: transactionsData, error: txError } = await query

      if (txError) throw txError

      const transactions: OverageTransaction[] = (transactionsData || []).map((item: OverageTransactionRow) => ({
        id: item.id,
        metricType: item.metric_type as OverageMetricType,
        totalUsage: Number(item.total_usage),
        includedQuota: Number(item.included_quota),
        overageUnits: Number(item.overage_units),
        ratePerUnit: Number(item.rate_per_unit),
        totalCost: Number(item.total_cost),
        billingPeriod: item.billing_period,
        stripeSyncStatus: item.stripe_sync_status as 'pending' | 'synced' | 'failed',
        createdAt: item.created_at,
      }))

      setOverages(transactions)

      // Calculate summary
      const totalCost = transactions.reduce((sum, t) => sum + t.totalCost, 0)
      const breakdownByMetric = transactions.reduce((acc, t) => {
        acc[t.metricType] = (acc[t.metricType] || 0) + t.totalCost
        return acc
      }, {} as Record<OverageMetricType, number>)

      setSummary({
        totalCost: Math.round(totalCost * 100) / 100,
        totalTransactions: transactions.length,
        breakdownByMetric: breakdownByMetric,
        isOverLimit: transactions.length > 0,
      })
    } catch (err) {
      logger.error('Failed to fetch overage status', { error: err })
      setError(err instanceof Error ? err.message : 'Failed to fetch overages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOverages()

    // Set up polling
    const intervalId = setInterval(fetchOverages, refreshInterval)
    return () => clearInterval(intervalId)
  }, [orgId, billingPeriod, enabled, refreshInterval])

  return {
    overages,
    summary,
    loading,
    error,
    refresh: fetchOverages,
  }
}

/**
 * Get overage history with filters
 */
export function useOverageHistory(options: UseOverageHistoryOptions = {}) {
  const { billingPeriod, metricType, limit = 50 } = options

  const [history, setHistory] = useState<OverageTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true)
        setError(null)

        let query = supabase
          .from('overage_transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit)

        if (billingPeriod) {
          query = query.eq('billing_period', billingPeriod)
        }

        if (metricType) {
          query = query.eq('metric_type', metricType)
        }

        const { data, error } = await query

        if (error) throw error

        const transactions: OverageTransaction[] = (data || []).map((item: OverageTransactionRow) => ({
          id: item.id,
          metricType: item.metric_type as OverageMetricType,
          totalUsage: Number(item.total_usage),
          includedQuota: Number(item.included_quota),
          overageUnits: Number(item.overage_units),
          ratePerUnit: Number(item.rate_per_unit),
          totalCost: Number(item.total_cost),
          billingPeriod: item.billing_period,
          stripeSyncStatus: item.stripe_sync_status as 'pending' | 'synced' | 'failed',
          createdAt: item.created_at,
        }))

        setHistory(transactions)
      } catch (err) {
        logger.error('Failed to fetch overage history', { error: err })
        setError(err instanceof Error ? err.message : 'Failed to fetch history')
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [billingPeriod, metricType, limit])

  return {
    history,
    loading,
    error,
  }
}

/**
 * Get overage rate for metric type and tier
 */
export async function getOverageRate(metricType: OverageMetricType, tier: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('overage_rates')
      .select('*')
      .eq('metric_type', metricType)
      .single()

    if (error || !data) {
      // Fallback to default rates
      return getDefaultOverageRate(metricType, tier)
    }

    const rateField = `${tier}_rate`
    return parseFloat((data as any)[rateField] || '0')
  } catch (err) {
    logger.error('Failed to fetch overage rate', { error: err })
    return getDefaultOverageRate(metricType, tier)
  }
}

/**
 * Default overage rates (fallback)
 */
function getDefaultOverageRate(metricType: OverageMetricType, tier: string): number {
  const rates: Record<OverageMetricType, Record<string, number>> = {
    api_calls: { free: 0.001, basic: 0.0008, pro: 0.0005, enterprise: 0.0003, master: 0.0001 },
    ai_calls: { free: 0.05, basic: 0.04, pro: 0.03, enterprise: 0.02, master: 0.01 },
    tokens: { free: 0.000004, basic: 0.000003, pro: 0.000002, enterprise: 0.000001, master: 0.0000005 },
    compute_minutes: { free: 0.01, basic: 0.008, pro: 0.005, enterprise: 0.003, master: 0.001 },
    storage_gb: { free: 0.5, basic: 0.4, pro: 0.3, enterprise: 0.2, master: 0.1 },
    emails: { free: 0.002, basic: 0.0015, pro: 0.001, enterprise: 0.0005, master: 0.0002 },
    model_inferences: { free: 0.02, basic: 0.015, pro: 0.01, enterprise: 0.005, master: 0.0025 },
    agent_executions: { free: 0.1, basic: 0.08, pro: 0.05, enterprise: 0.03, master: 0.015 },
  }

  const tierRates = rates[metricType]
  if (!tierRates) return 0

  return tierRates[tier.toLowerCase()] || tierRates['basic']
}

/**
 * Manually trigger overage sync to Stripe
 */
export async function syncOverageToStripe(transactionId: string): Promise<{
  success: boolean
  stripeUsageRecordId?: string
  error?: string
}> {
  try {
    const { data, error } = await supabase.functions.invoke('stripe-usage-record', {
      body: {
        is_overage: true,
        overage_transaction_id: transactionId,
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      stripeUsageRecordId: data?.id,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Export for easy import
 */
export const overageTrackingClient = {
  useOverageStatus,
  useOverageHistory,
  getOverageRate,
  syncOverageToStripe,
}

export default overageTrackingClient
