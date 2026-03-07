import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xwymzrxtxbrhfljvdxcw.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3eW16cnh0eGJyaGZsanZkeGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyNzI3ODgsImV4cCI6MjA1NDg0ODc4OH0.o1RzE9Y6dQyKxJ8y0YbQnMwVUqL7Rr4o1xZ0Yz1xJ8c'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface WeeklyRetention {
  week: number
  cohort_size: number
  active_users: number
  retention_rate: number
  revenue: number
}

export interface FeatureAdoption {
  feature: string
  adoption_count: number
  adoption_rate: number
  weekly_active: number
}

export interface CohortAnalysis {
  cohorts: WeeklyRetention[]
  feature_adoption: FeatureAdoption[]
  period_weeks: number
}

export function useCohortAnalysis(options?: { weeks?: number }) {
  const [data, setData] = useState<CohortAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const weeks = options?.weeks || 12

  useEffect(() => {
    async function fetchCohortAnalysis() {
      try {
        setLoading(true)

        const { data: retentionData } = await supabase.from('cohort_metrics').select('*').order('cohort_week', { ascending: false }).limit(weeks * 4)

        const weekMap = new Map<string, WeeklyRetention>()
        retentionData?.forEach((m: any) => {
          const week = m.cohort_week
          if (!weekMap.has(week)) {
            weekMap.set(week, { week: parseInt(week.split('-W')[1] || '0'), cohort_size: m.cohort_size, active_users: m.active_users, retention_rate: Number(m.retained_percentage) || 0, revenue: Number(m.revenue_cumulative_cents) || 0 })
          }
        })

        const cohorts = Array.from(weekMap.values()).sort((a, b) => b.week - a.week).map((c, idx, arr) => ({
          ...c,
          retention_rate: arr[idx - 1] ? Math.round(((c.retention_rate + arr[idx - 1].retention_rate) / 2) * 100) / 100 : c.retention_rate,
        })).slice(0, weeks)

        const { data: usageData } = await supabase.from('license_usage_aggregations').select('api_calls, agent_executions, tokens').gte('aggregation_date', new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000).toISOString())

        const totalLicenses = usageData?.length || 1
        const apiCallUsers = new Set(usageData?.filter(u => u.api_calls > 0).map((_, i) => i) || [])
        const agentUsers = new Set(usageData?.filter(u => u.agent_executions > 0).map((_, i) => i) || [])
        const tokenUsers = new Set(usageData?.filter(u => u.tokens > 0).map((_, i) => i) || [])

        const feature_adoption: FeatureAdoption[] = [
          { feature: 'API Calls', adoption_count: apiCallUsers.size, adoption_rate: Math.round((apiCallUsers.size / totalLicenses) * 10000) / 100, weekly_active: apiCallUsers.size },
          { feature: 'Agent Executions', adoption_count: agentUsers.size, adoption_rate: Math.round((agentUsers.size / totalLicenses) * 10000) / 100, weekly_active: agentUsers.size },
          { feature: 'Token Usage', adoption_count: tokenUsers.size, adoption_rate: Math.round((tokenUsers.size / totalLicenses) * 10000) / 100, weekly_active: tokenUsers.size },
        ]

        setData({ cohorts, feature_adoption, period_weeks: weeks })
        setError(null)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchCohortAnalysis()
  }, [weeks])

  return { data, loading, error }
}
