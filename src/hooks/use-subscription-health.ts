/**
 * Use Subscription Health Hook
 * React hook for fetching and displaying subscription health status
 *
 * Usage:
 *   const { health, loading, error, refresh } = useSubscriptionHealth(orgId)
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { subscriptionHealth, type SubscriptionHealthStatus } from '@/lib/subscription-health'
import { overageTrackingClient, type OverageTransaction, type OverageMetricType } from '@/lib/overage-tracking-client'
import { createLogger } from '@/utils/logger'

const logger = createLogger('useSubscriptionHealth')

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

interface UseSubscriptionHealthOptions {
  orgId?: string
  enabled?: boolean
  refreshInterval?: number
}

export function useSubscriptionHealth(options: UseSubscriptionHealthOptions = {}) {
  const {
    orgId,
    enabled = true,
    refreshInterval = 30000, // 30 seconds
  } = options

  const [health, setHealth] = useState<SubscriptionHealthStatus | null>(null)
  const [overages, setOverages] = useState<OverageTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHealth = useCallback(async () => {
    if (!orgId || !enabled) return

    try {
      setLoading(true)
      setError(null)

      // Fetch health score
      const healthStatus = await subscriptionHealth.getHealthScore(orgId)
      setHealth(healthStatus)

      // Fetch overage transactions
      const { overages: overageData } = overageTrackingClient.useOverageStatus({
        orgId,
        enabled: true,
        refreshInterval: 0, // Disable internal polling
      })

      // We need to manually fetch since useOverageStatus is a hook
      const { data: overageData2 } = await supabase
        .from('overage_transactions')
        .select('*')
        .eq('org_id', orgId)
        .eq('billing_period', new Date().toISOString().slice(0, 7))
        .order('created_at', { ascending: false })

      if (overageData2) {
        setOverages(overageData2.map((item: OverageTransactionRow) => ({
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
        })))
      }
    } catch (err) {
      logger.error('Health check failed', { error: err })
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription health')
    } finally {
      setLoading(false)
    }
  }, [orgId, enabled])

  useEffect(() => {
    fetchHealth()

    // Set up polling
    const intervalId = setInterval(fetchHealth, refreshInterval)
    return () => clearInterval(intervalId)
  }, [fetchHealth, refreshInterval])

  return {
    health,
    overages,
    loading,
    error,
    refresh: fetchHealth,
  }
}

/**
 * Use Dunning Status Hook
 * React hook for fetching dunning event status
 *
 * Usage:
 *   const { dunningEvents, statistics, loading, resolve } = useDunningStatus(orgId)
 */

import { dunningService, type DunningEvent } from '@/lib/dunning-service'

interface UseDunningStatusOptions {
  orgId?: string
  enabled?: boolean
  refreshInterval?: number
}

export function useDunningStatus(options: UseDunningStatusOptions = {}) {
  const {
    orgId,
    enabled = true,
    refreshInterval = 30000, // 30 seconds
  } = options

  const [dunningEvents, setDunningEvents] = useState<DunningEvent[]>([])
  const [statistics, setStatistics] = useState<{
    activeDunningCount: number
    resolvedCount: number
    totalAmountAtRisk: number
    paymentRecoveryCount: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDunning = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)

      const [events, stats] = await Promise.all([
        dunningService.getActiveDunningEvents(orgId),
        dunningService.getDunningStatistics(),
      ])

      setDunningEvents(events)
      setStatistics({
        activeDunningCount: stats.activeDunningCount,
        resolvedCount: stats.resolvedCount,
        totalAmountAtRisk: stats.totalAmountAtRisk,
        paymentRecoveryCount: stats.paymentRecoveryCount,
      })
    } catch (err) {
      logger.error('Dunning status fetch failed', { error: err })
      setError(err instanceof Error ? err.message : 'Failed to fetch dunning status')
    } finally {
      setLoading(false)
    }
  }, [orgId, enabled])

  useEffect(() => {
    fetchDunning()

    const intervalId = setInterval(fetchDunning, refreshInterval)
    return () => clearInterval(intervalId)
  }, [fetchDunning, refreshInterval])

  const resolveDunning = async (dunningId: string, method: 'payment_success' | 'manual_override' | 'subscription_canceled') => {
    const result = await dunningService.resolveDunning(dunningId, method)
    if (result.success) {
      await fetchDunning()
    }
    return result
  }

  return {
    dunningEvents,
    statistics,
    loading,
    error,
    refresh: fetchDunning,
    resolveDunning,
  }
}

/**
 * Use Overage Billing Hook
 * React hook for managing overage billing
 *
 * Usage:
 *   const { calculations, totalCost, syncToStripe } = useOverageBilling(orgId)
 */

interface UseOverageBillingOptions {
  orgId?: string
  billingPeriod?: string
  enabled?: boolean
}

export function useOverageBilling(options: UseOverageBillingOptions = {}) {
  const {
    orgId,
    billingPeriod = new Date().toISOString().slice(0, 7),
    enabled = true,
  } = options

  const [calculations, setCalculations] = useState<Array<{
    metricType: string
    totalUsage: number
    includedQuota: number
    overageUnits: number
    ratePerUnit: number
    totalCost: number
    percentageUsed: number
    isOverQuota: boolean
  }>>([])
  const [totalCost, setTotalCost] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOverages = useCallback(async () => {
    if (!orgId || !enabled) return

    try {
      setLoading(true)
      setError(null)

      const { data } = await supabase
        .from('overage_transactions')
        .select('*')
        .eq('org_id', orgId)
        .eq('billing_period', billingPeriod)
        .order('created_at', { ascending: false })

      if (data) {
        const calcs = data.map((item: any) => ({
          metricType: item.metric_type,
          totalUsage: Number(item.total_usage),
          includedQuota: Number(item.included_quota),
          overageUnits: Number(item.overage_units),
          ratePerUnit: parseFloat(item.rate_per_unit),
          totalCost: parseFloat(item.total_cost),
          percentageUsed: Math.round((Number(item.total_usage) / Number(item.included_quota)) * 100) || 0,
          isOverQuota: Number(item.overage_units) > 0,
        }))

        setCalculations(calcs)
        setTotalCost(calcs.reduce((sum, c) => sum + c.totalCost, 0))
      }
    } catch (err) {
      logger.error('Overages fetch failed', { error: err })
      setError(err instanceof Error ? err.message : 'Failed to fetch overages')
    } finally {
      setLoading(false)
    }
  }, [orgId, billingPeriod, enabled])

  const syncToStripe = async (transactionId: string) => {
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

      await fetchOverages()
      return { success: true, data }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }
    }
  }

  return {
    calculations,
    totalCost,
    loading,
    error,
    refresh: fetchOverages,
    syncToStripe,
  }
}
