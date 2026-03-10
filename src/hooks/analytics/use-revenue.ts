import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xwymzrxtxbrhfljvdxcw.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3eW16cnh0eGJyaGZsanZkeGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyNzI3ODgsImV4cCI6MjA1NDg0ODc4OH0.o1RzE9Y6dQyKxJ8y0YbQnMwVUqL7Rr4o1xZ0Yz1xJ8c'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface RevenueMetrics {
  mrr_cents: number
  arr_cents: number
  gmv_cents: number
  active_subscriptions: number
  churn_rate: number
  growth_rate: number
  trend: Array<{ date: string; mrr: number; revenue: number }>
}

// Alias for backward compatibility with LicenseAnalyticsDashboard
export type RevenueData = RevenueMetrics

export interface UseRevenueReturn {
  data: RevenueMetrics | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useRevenue(options?: { days?: number; autoRefresh?: boolean }) {
  const [data, setData] = useState<RevenueMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const days = options?.days || 30
  const autoRefresh = options?.autoRefresh || false

  const fetchRevenue = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      const { data: mrrData } = await supabase.from('customer_cohorts').select('current_mrr_cents').eq('status', 'active')
      const mrrCents = mrrData?.reduce((sum: number, c: any) => sum + (c.current_mrr_cents || 0), 0) || 0
      const { data: trendData } = await supabase.from('polar_webhook_events').select('received_at, amount_cents').gte('received_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()).order('received_at', { ascending: true })
      const trendByDay = new Map<string, number>()
      trendData?.forEach((event: any) => {
        const date = event.received_at?.split('T')[0] || ''
        if (date) trendByDay.set(date, (trendByDay.get(date) || 0) + (event.amount_cents || 0))
      })
      const trend = Array.from(trendByDay.entries()).map(([date, revenue]) => ({ date, mrr: mrrCents, revenue })).slice(-30)
      const { count: activeCount } = await supabase.from('customer_cohorts').select('*', { count: 'exact', head: true }).eq('status', 'active')
      const { count: totalCustomers } = await supabase.from('customer_cohorts').select('*', { count: 'exact', head: true })
      const { count: churnedCount } = await supabase.from('customer_cohorts').select('*', { count: 'exact', head: true }).eq('status', 'churned')
      const churnRate = totalCustomers && totalCustomers > 0 ? ((churnedCount || 0) / totalCustomers) * 100 : 0
      setData({ mrr_cents: mrrCents, arr_cents: mrrCents * 12, gmv_cents: trendData?.reduce((sum: number, e: any) => sum + (e.amount_cents || 0), 0) || 0, active_subscriptions: activeCount || 0, churn_rate: churnRate, growth_rate: 0, trend })
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    fetchRevenue()
    if (autoRefresh) {
      const interval = setInterval(fetchRevenue, 30000)
      return () => clearInterval(interval)
    }
    return undefined
  }, [fetchRevenue, autoRefresh])

  return { data, loading, error, refresh: fetchRevenue }
}
