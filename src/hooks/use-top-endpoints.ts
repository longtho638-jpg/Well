/**
 * Top Endpoints Hook - Phase 5 Analytics Dashboard
 *
 * Fetches top API endpoints by call volume from usage_records table
 * Endpoint data is stored in metadata.jsonb->>endpoint field
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { createLogger } from '@/utils/logger'

const logger = createLogger('useTopEndpoints')

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xwymzrxtxbrhfljvdxcw.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3eW16cnh0eGJyaGZsanZkeGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyNzI3ODgsImV4cCI6MjA1NDg0ODc4OH0.o1RzE9Y6dQyKxJ8y0YbQnMwVUqL7Rr4o1xZ0Yz1xJ8c'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface EndpointStats {
  endpoint: string
  method: string
  total_calls: number
  unique_users: number
  avg_daily_calls: number
  last_called: string
}

export interface UseTopEndpointsOptions {
  limit?: number
  days?: number
  licenseId?: string
  enabled?: boolean
}

export function useTopEndpoints(options: UseTopEndpointsOptions = {}) {
  const { limit = 10, days = 30, licenseId, enabled = true } = options
  const [data, setData] = useState<EndpointStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEndpoints = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

      // Query usage_records and extract endpoint from metadata
      let query = supabase
        .from('usage_records')
        .select('feature, quantity, metadata, recorded_at, user_id, license_id')
        .eq('feature', 'api_call')
        .gte('recorded_at', sinceDate)

      if (licenseId) {
        query = query.eq('license_id', licenseId)
      }

      const { data: records, error: queryError } = await query

      if (queryError) throw queryError
      if (!records || records.length === 0) {
        setData([])
        return
      }

      // Aggregate by endpoint + method
      const endpointMap = new Map<string, EndpointStats>()
      const userSetByEndpoint = new Map<string, Set<string>>()
      const dailyCallsByEndpoint = new Map<string, Map<string, number>>()

      records.forEach((record: any) => {
        const metadata = record.metadata as Record<string, unknown> || {}
        const endpoint = (metadata.endpoint as string) || '/unknown'
        const method = (metadata.method as string) || 'GET'
        const key = `${method}:${endpoint}`

        const existing = endpointMap.get(key) || {
          endpoint,
          method,
          total_calls: 0,
          unique_users: 0,
          avg_daily_calls: 0,
          last_called: '',
        }

        existing.total_calls += record.quantity || 1
        existing.last_called = record.recorded_at > existing.last_called ? record.recorded_at : existing.last_called

        // Track unique users
        if (!userSetByEndpoint.has(key)) {
          userSetByEndpoint.set(key, new Set())
        }
        userSetByEndpoint.get(key)?.add(record.user_id)

        // Track daily calls for average
        const date = record.recorded_at.split('T')[0]
        if (!dailyCallsByEndpoint.has(key)) {
          dailyCallsByEndpoint.set(key, new Map())
        }
        const dailyMap = dailyCallsByEndpoint.get(key)
        if (!dailyMap) return
        dailyMap.set(date, (dailyMap.get(date) || 0) + (record.quantity || 1))

        endpointMap.set(key, existing)
      })

      // Finalize stats
      const results = Array.from(endpointMap.values()).map((stats) => {
        const uniqueUsers = userSetByEndpoint.get(`${stats.method}:${stats.endpoint}`)?.size || 0
        const dailyMap = dailyCallsByEndpoint.get(`${stats.method}:${stats.endpoint}`)
        const dayCount = dailyMap?.size || 1
        const totalCalls = dailyMap ? Array.from(dailyMap.values()).reduce((a, b) => a + b, 0) : stats.total_calls
        const avgDaily = Math.round(totalCalls / dayCount)

        return {
          ...stats,
          unique_users: uniqueUsers,
          avg_daily_calls: avgDaily,
        }
      }).sort((a, b) => b.total_calls - a.total_calls).slice(0, limit)

      setData(results)
      setError(null)
    } catch (err: any) {
      logger.error('Endpoints fetch failed', { error: err.message })
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [days, limit, licenseId, enabled])

  useEffect(() => {
    fetchEndpoints()
  }, [fetchEndpoints])

  return {
    data,
    loading,
    error,
    refresh: fetchEndpoints,
  }
}

export default useTopEndpoints
