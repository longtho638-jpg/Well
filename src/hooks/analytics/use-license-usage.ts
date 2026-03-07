import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xwymzrxtxbrhfljvdxcw.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3eW16cnh0eGJyaGZsanZkeGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyNzI3ODgsImV4cCI6MjA1NDg0ODc4OH0.o1RzE9Y6dQyKxJ8y0YbQnMwVUqL7Rr4o1xZ0Yz1xJ8c'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface LicenseUsage {
  license_id: string
  tier: string
  usage: Array<{ date: string; api_calls: number; tokens: number; agent_executions: number }>
  roi: { revenue: number; cost: number; roi_percentage: number }
}

export function useLicenseUsage(options?: { licenseId?: string; days?: number }) {
  const [data, setData] = useState<LicenseUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const licenseId = options?.licenseId
  const days = options?.days || 30

  const fetchUsage = useCallback(async () => {
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
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [licenseId, days])

  useEffect(() => {
    fetchUsage()
  }, [fetchUsage])

  return { data, loading, error, refresh: fetchUsage }
}
