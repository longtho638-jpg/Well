import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xwymzrxtxbrhfljvdxcw.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3eW16cnh0eGJyaGZsanZkeGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyNzI3ODgsImV4cCI6MjA1NDg0ODc4OH0.o1RzE9Y6dQyKxJ8y0YbQnMwVUqL7Rr4o1xZ0Yz1xJ8c'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface CustomerSegment {
  segment: string
  count: number
  revenue: number
  avg_mrr: number
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
          let seg = segmentMap.get(segment)
          if (!seg) { seg = { segment, count: 0, revenue: 0, avg_mrr: 0 }; segmentMap.set(segment, seg) }
          seg.count++; seg.revenue += s.current_mrr_cents || 0
        })
        const segments = Array.from(segmentMap.values()).map(s => ({ ...s, avg_mrr: s.count > 0 ? s.revenue / s.count : 0 })).sort((a, b) => b.count - a.count)
        setData(segments)
        setError(null)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchSegments()
  }, [])

  return { data, loading, error }
}
