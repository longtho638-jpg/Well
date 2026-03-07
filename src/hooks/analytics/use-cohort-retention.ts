import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xwymzrxtxbrhfljvdxcw.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3eW16cnh0eGJyaGZsanZkeGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyNzI3ODgsImV4cCI6MjA1NDg0ODc4OH0.o1RzE9Y6dQyKxJ8y0YbQnMwVUqL7Rr4o1xZ0Yz1xJ8c'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface CohortRetention {
  cohort_month: string
  cohort_size: number
  periods: Array<{ day: number; active_users: number; retained_percentage: number; revenue: number }>
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
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchCohorts()
  }, [months])

  return { data, loading, error }
}
