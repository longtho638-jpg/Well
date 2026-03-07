import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xwymzrxtxbrhfljvdxcw.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3eW16cnh0eGJyaGZsanZkeGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyNzI3ODgsImV4cCI6MjA1NDg0ODc4OH0.o1RzE9Y6dQyKxJ8y0YbQnMwVUqL7Rr4o1xZ0Yz1xJ8c'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface RevenueByTier {
  tier: string
  mrr_cents: number
  arr_cents: number
  license_count: number
  avg_revenue_per_license: number
  percentage_of_total: number
}

export function useRevenueByTier(options?: { days?: number }) {
  const [data, setData] = useState<RevenueByTier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const days = options?.days || 30

  useEffect(() => {
    async function fetchRevenueByTier() {
      try {
        setLoading(true)

        const { data: licenses, error: licenseError } = await supabase.from('raas_licenses').select('license_id, tier, status, created_at').eq('status', 'active')

        if (licenseError) throw licenseError
        if (!licenses || licenses.length === 0) {
          setData([])
          return
        }

        const tierMap = new Map<string, { tier: string; license_count: number; license_ids: string[] }>()
        licenses.forEach((lic: any) => {
          const tier = lic.tier || 'free'
          const existing = tierMap.get(tier) || { tier, license_count: 0, license_ids: [] as string[] }
          existing.license_count++
          existing.license_ids.push(lic.license_id)
          tierMap.set(tier, existing)
        })

        const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
        const { data: webhookEvents } = await supabase.from('polar_webhook_events').select('amount_cents, subscription_id, received_at').gte('received_at', sinceDate).eq('event_type', 'subscription.active')

        const totalRevenue = webhookEvents?.reduce((sum: number, e: any) => sum + (e.amount_cents || 0), 0) || 0

        const results: RevenueByTier[] = Array.from(tierMap.values()).map((tierData) => {
          const licenseRatio = tierData.license_count / licenses.length
          const tierRevenue = Math.round(totalRevenue * licenseRatio)
          const mrrCents = Math.round(tierRevenue / days * 30)

          return {
            tier: tierData.tier,
            mrr_cents: mrrCents,
            arr_cents: mrrCents * 12,
            license_count: tierData.license_count,
            avg_revenue_per_license: tierData.license_count > 0 ? Math.round(tierRevenue / tierData.license_count) : 0,
            percentage_of_total: totalRevenue > 0 ? Math.round((tierRevenue / totalRevenue) * 10000) / 100 : 0,
          }
        }).sort((a, b) => b.mrr_cents - a.mrr_cents)

        setData(results)
        setError(null)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchRevenueByTier()
  }, [days])

  return { data, loading, error }
}
