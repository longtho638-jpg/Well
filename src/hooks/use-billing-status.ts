/**
 * Billing Status Hooks
 *
 * React hooks for billing, overage, and dunning state management.
 * Real-time updates via Supabase Realtime subscriptions.
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useAuth } from './useAuth'
import type { OverageResult, MetricType } from '@/types/overage'
import { createLogger } from '@/utils/logger'

const logger = createLogger('useBillingStatus')

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

/**
 * Raw database row type for usage billing history
 */
interface UsageBillingHistoryRow {
  snapshot_date: string
  metric_type: string
  metric_value: number
  quota_limit: number
}

/**
 * Billing Status State
 */
export interface BillingStatus {
  tier: string
  subscriptionStatus: string
  usage: {
    [metricType: string]: {
      used: number
      limit: number
      percentage: number
      remaining: number
      isOverLimit: boolean
      overageUnits: number
      overageCost: number
    }
  }
  overage?: {
    totalCost: number
    breakdown: {
      [metricType: string]: {
        units: number
        cost: number
        rate: number
      }
    }
  }
  dunning?: {
    isActive: boolean
    stage: 'initial' | 'reminder' | 'final' | 'cancel_notice'
    amountOwed: number
    currency: string
    dueDate: string
    attemptCount: number
    paymentUrl?: string
  }
  billingPeriodStart: string
  billingPeriodEnd: string
  daysRemaining: number
}

/**
 * Dunning Event State
 */
export interface DunningEvent {
  id: string
  orgId: string
  dunningStage: 'initial' | 'reminder' | 'final' | 'cancel_notice'
  amountOwed: number
  currency: string
  dueDate: string
  attemptCount: number
  nextRetryAt: string
  paymentUrl?: string
  invoiceId?: string
  createdAt: string
}

/**
 * Usage History Data Point
 */
export interface UsageHistoryData {
  date: string
  metricType: MetricType
  value: number
  quota: number
  isOverLimit: boolean
}

/**
 * Payment Method
 */
export interface PaymentMethod {
  id: string
  type: 'card' | 'bank_account'
  card?: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }
  isDefault: boolean
}

/**
 * useBillingStatus - Unified hook for billing state
 */
export function useBillingStatus(orgId: string) {
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    if (!orgId) {
      setStatus(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch billing status from RaaS Gateway or local DB
      const { data, error: fetchError } = await supabase
        .rpc('get_billing_status', { p_org_id: orgId })

      if (fetchError) throw fetchError

      setStatus(data as BillingStatus)
    } catch (err) {
      logger.error('Billing status fetch failed', { error: err })
      setError(err instanceof Error ? err.message : 'Failed to fetch billing status')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    fetchStatus()

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`billing:${orgId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'raas_usage_snapshots',
          filter: `org_id=eq.${orgId}`,
        },
        () => {
          fetchStatus()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orgId, fetchStatus])

  return { status, loading, error, refresh: fetchStatus }
}

/**
 * useOverageStatus - Hook for overage-specific state
 */
export function useOverageStatus(orgId: string) {
  const [overage, setOverage] = useState<OverageResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOverage = useCallback(async () => {
    if (!orgId) {
      setOverage(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .rpc('get_overage_summary', {
          p_org_id: orgId,
          p_period: new Date().toISOString().slice(0, 7), // YYYY-MM
        })

      if (fetchError) throw fetchError

      setOverage(data as OverageResult)
    } catch (err) {
      logger.error('Overage status fetch failed', { error: err })
      setError(err instanceof Error ? err.message : 'Failed to fetch overage status')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    fetchOverage()

    // Subscribe to overage transaction updates
    const channel = supabase
      .channel(`overage:${orgId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'overage_transactions',
          filter: `org_id=eq.${orgId}`,
        },
        () => {
          fetchOverage()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orgId, fetchOverage])

  return { overage, loading, error, refresh: fetchOverage }
}

/**
 * useDunningStatus - Hook for dunning state
 */
export function useDunningStatus(orgId: string) {
  const [dunningEvent, setDunningEvent] = useState<DunningEvent | null>(null)
  const [retryCountdown, setRetryCountdown] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDunning = useCallback(async () => {
    if (!orgId) {
      setDunningEvent(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('dunning_events')
        .select('*')
        .eq('org_id', orgId)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError // PGRST116 = not found

      setDunningEvent(data as DunningEvent | null)

      if (data?.nextRetryAt) {
        setRetryCountdown(new Date(data.nextRetryAt))
      }
    } catch (err) {
      logger.error('Dunning status fetch failed', { error: err })
      setError(err instanceof Error ? err.message : 'Failed to fetch dunning status')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    fetchDunning()

    // Subscribe to dunning event updates
    const channel = supabase
      .channel(`dunning:${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dunning_events',
          filter: `org_id=eq.${orgId}`,
        },
        () => {
          fetchDunning()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orgId, fetchDunning])

  return { dunningEvent, retryCountdown, loading, error, refresh: fetchDunning }
}

/**
 * useUsageHistory - Hook for usage history analytics
 */
export function useUsageHistory(
  orgId: string,
  metricType?: MetricType,
  period: string = '30d'
) {
  const [data, setData] = useState<UsageHistoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    if (!orgId) {
      setData([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Calculate date range based on period
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(period.replace('d', '')))

      let query = supabase
        .from('raas_usage_snapshots')
        .select('snapshot_date, metric_type, metric_value, quota_limit')
        .eq('org_id', orgId)
        .gte('snapshot_date', startDate.toISOString())
        .lte('snapshot_date', endDate.toISOString())
        .order('snapshot_date', { ascending: true })

      if (metricType) {
        query = query.eq('metric_type', metricType)
      }

      const { data: historyData, error: fetchError } = await query

      if (fetchError) throw fetchError

      // Transform data for chart
      const transformed = historyData.map((row: UsageBillingHistoryRow) => ({
        date: row.snapshot_date,
        metricType: row.metric_type as MetricType,
        value: row.metric_value,
        quota: row.quota_limit,
        isOverLimit: row.metric_value > row.quota_limit,
      }))

      setData(transformed)
    } catch (err) {
      logger.error('Usage history fetch failed', { error: err })
      setError(err instanceof Error ? err.message : 'Failed to fetch usage history')
    } finally {
      setLoading(false)
    }
  }, [orgId, metricType, period])

  useEffect(() => {
    fetchHistory()
  }, [orgId, metricType, period, fetchHistory])

  return { data, loading, error, refresh: fetchHistory }
}

/**
 * usePaymentMethod - Hook for payment method management
 */
export function usePaymentMethod(customerId: string) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPaymentMethod = useCallback(async () => {
    if (!customerId) {
      setPaymentMethod(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase.functions.invoke('stripe-get-payment-method', {
        body: { customer_id: customerId },
      })

      if (fetchError) throw fetchError

      if (data?.payment_method) {
        const pm = data.payment_method
        setPaymentMethod({
          id: pm.id,
          type: pm.type,
          card: pm.card ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year,
          } : undefined,
          isDefault: pm.is_default || true,
        })
      }
    } catch (err) {
      logger.error('Payment method fetch failed', { error: err })
      setError(err instanceof Error ? err.message : 'Failed to fetch payment method')
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    fetchPaymentMethod()
  }, [customerId, fetchPaymentMethod])

  return { paymentMethod, loading, error, refresh: fetchPaymentMethod }
}

export default {
  useBillingStatus,
  useOverageStatus,
  useDunningStatus,
  useUsageHistory,
  usePaymentMethod,
}
