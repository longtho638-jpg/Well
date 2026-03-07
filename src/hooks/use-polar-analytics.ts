import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xwymzrxtxbrhfljvdxcw.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3eW16cnh0eGJyaGZsanZkeGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyNzI3ODgsImV4cCI6MjA1NDg0ODc4OH0.o1RzE9Y6dQyKxJ8y0YbQnMwVUqL7Rr4o1xZ0Yz1xJ8c'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface RevenueMetrics { mrr_cents: number; arr_cents: number; gmv_cents: number; active_subscriptions: number; churn_rate: number; growth_rate: number; trend: Array<{ date: string; mrr: number; revenue: number }> }
export interface CohortRetention { cohort_month: string; cohort_size: number; periods: Array<{ day: number; active_users: number; retained_percentage: number; revenue: number }> }
export interface LicenseUsage { license_id: string; tier: string; usage: Array<{ date: string; api_calls: number; tokens: number; agent_executions: number }>; roi: { revenue: number; cost: number; roi_percentage: number } }
export interface CustomerSegment { segment: string; count: number; revenue: number; avg_mrr: number }

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
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }, [days])
  useEffect(() => { fetchRevenue(); if (autoRefresh) { const interval = setInterval(fetchRevenue, 30000); return () => clearInterval(interval) } return undefined }, [fetchRevenue, autoRefresh])
  return { data, loading, error, refresh: fetchRevenue }
}

export function useCohortRetention(options?: { months?: number }) {
  const [data, setData] = useState<CohortRetention[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const months = options?.months || 6
  useEffect(() => {
    async function fetchCohorts() {
      try {
        setLoading(true)
        const { data: metrics } = await supabase.from('cohort_metrics').select('*').order('cohort_month', { ascending: false }).limit(months * 4)
        if (!metrics) { setData([]); return }
        const cohortMap = new Map<string, CohortRetention>()
        metrics.forEach((m: any) => {
          const existing = cohortMap.get(m.cohort_month)
          if (!existing) cohortMap.set(m.cohort_month, { cohort_month: m.cohort_month, cohort_size: m.cohort_size, periods: [] })
          cohortMap.get(m.cohort_month)?.periods.push({ day: m.period_day, active_users: m.active_users, retained_percentage: Number(m.retained_percentage) || 0, revenue: Number(m.revenue_cumulative_cents) || 0 })
        })
        const cohorts = Array.from(cohortMap.values()).map(c => ({ ...c, periods: c.periods.sort((a, b) => a.day - b.day) })).sort((a, b) => b.cohort_month.localeCompare(a.cohort_month))
        setData(cohorts)
        setError(null)
      } catch (err: any) { setError(err.message) }
      finally { setLoading(false) }
    }
    fetchCohorts()
  }, [months])
  return { data, loading, error }
}

export function useLicenseUsage(options?: { licenseId?: string; days?: number }) {
  const [data, setData] = useState<LicenseUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const licenseId = options?.licenseId
  const days = options?.days || 30
  useEffect(() => {
    async function fetchUsage() {
      try {
        setLoading(true)
        let query = supabase.from('license_usage_aggregations').select('*').gte('aggregation_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()).order('aggregation_date', { ascending: false })
        if (licenseId) query = query.eq('license_id', licenseId)
        const { data: usageData } = await query
        if (!usageData) { setData([]); return }
        const licenseMap = new Map<string, LicenseUsage>()
        usageData.forEach((u: any) => {
          const existing = licenseMap.get(u.license_id)
          if (!existing) licenseMap.set(u.license_id, { license_id: u.license_id, tier: 'premium', usage: [], roi: { revenue: 0, cost: 0, roi_percentage: 0 } })
          licenseMap.get(u.license_id)?.usage.push({ date: u.aggregation_date, api_calls: u.api_calls, tokens: u.tokens, agent_executions: u.agent_executions })
        })
        setData(Array.from(licenseMap.values()))
        setError(null)
      } catch (err: any) { setError(err.message) }
      finally { setLoading(false) }
    }
    fetchUsage()
  }, [licenseId, days])
  return { data, loading, error }
}

export function useCustomerSegments() {
  const [data, setData] = useState<CustomerSegment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    async function fetchSegments() {
      try {
        setLoading(true)
        const { data: segmentData } = await supabase.from('customer_cohorts').select('segment, current_mrr_cents')
        if (!segmentData) { setData([]); return }
        const segmentMap = new Map<string, CustomerSegment>()
        segmentData.forEach((s: any) => {
          const segment = s.segment || 'unknown'
          const existing = segmentMap.get(segment)
          if (!existing) segmentMap.set(segment, { segment, count: 0, revenue: 0, avg_mrr: 0 })
          const seg = segmentMap.get(segment); if (seg) { seg.count++; seg.revenue += s.current_mrr_cents || 0 }
          if (seg) { seg.count++; seg.revenue += s.current_mrr_cents || 0 }
        })
        const segments = Array.from(segmentMap.values()).map(s => ({ ...s, avg_mrr: s.count > 0 ? s.revenue / s.count : 0 })).sort((a, b) => b.count - a.count)
        setData(segments)
        setError(null)
      } catch (err: any) { setError(err.message) }
      finally { setLoading(false) }
    }
    fetchSegments()
  }, [])
  return { data, loading, error }
}
