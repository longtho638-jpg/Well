import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xwymzrxtxbrhfljvdxcw.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3eW16cnh0eGJyaGZsanZkeGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyNzI3ODgsImV4cCI6MjA1NDg0ODc4OH0.o1RzE9Y6dQyKxJ8y0YbQnMwVUqL7Rr4o1xZ0Yz1xJ8c'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface FunnelStep {
  step: number
  name: string
  count: number
  drop_off_rate: number
}

export interface ConversionFunnel {
  steps: FunnelStep[]
  overall_conversion_rate: number
  period_days: number
}

export function useConversionFunnel(options?: { days?: number }) {
  const [data, setData] = useState<ConversionFunnel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const days = options?.days || 30

  useEffect(() => {
    async function fetchFunnel() {
      try {
        setLoading(true)
        const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

        const { count: totalLicenses } = await supabase.from('raas_licenses').select('*', { count: 'exact', head: true }).gte('created_at', sinceDate)
        const { count: activatedLicenses } = await supabase.from('raas_licenses').select('*', { count: 'exact', head: true }).eq('status', 'active').gte('created_at', sinceDate)
        const { data: usageLicenses } = await supabase.from('license_usage_aggregations').select('license_id').gte('aggregation_date', sinceDate).gt('api_calls', 0)
        const { data: sustainedUsage } = await supabase.from('license_usage_aggregations').select('license_id, api_calls').gte('aggregation_date', sinceDate).gt('api_calls', 4)
        const { data: payingData } = await supabase.from('polar_webhook_events').select('subscription_id').gte('received_at', sinceDate).eq('event_type', 'subscription.active')

        const uniqueUsageLicenses = new Set(usageLicenses?.map(l => l.license_id) || [])
        const uniqueSustainedLicenses = new Set(sustainedUsage?.map(l => l.license_id) || [])
        const payingCustomers = new Set(payingData?.map(p => p.subscription_id) || [])

        const steps: FunnelStep[] = [
          { step: 1, name: 'License Created', count: totalLicenses || 0, drop_off_rate: 0 },
          { step: 2, name: 'Activated', count: activatedLicenses || 0, drop_off_rate: totalLicenses ? Math.round((1 - (activatedLicenses || 0) / totalLicenses) * 100) : 0 },
          { step: 3, name: 'First API Call', count: uniqueUsageLicenses.size, drop_off_rate: activatedLicenses ? Math.round((1 - uniqueUsageLicenses.size / (activatedLicenses || 1)) * 100) : 0 },
          { step: 4, name: 'Sustained Usage', count: uniqueSustainedLicenses.size, drop_off_rate: uniqueUsageLicenses.size ? Math.round((1 - uniqueSustainedLicenses.size / (uniqueUsageLicenses.size || 1)) * 100) : 0 },
          { step: 5, name: 'Paying Customer', count: payingCustomers.size, drop_off_rate: uniqueSustainedLicenses.size ? Math.round((1 - payingCustomers.size / (uniqueSustainedLicenses.size || 1)) * 100) : 0 }
        ]

        const overallConversionRate = totalLicenses ? Math.round((payingCustomers.size / totalLicenses) * 100 * 100) / 100 : 0

        setData({ steps, overall_conversion_rate: overallConversionRate, period_days: days })
        setError(null)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchFunnel()
  }, [days])

  return { data, loading, error }
}
