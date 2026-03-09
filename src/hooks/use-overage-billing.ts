/**
 * useOverageBilling Hook - Phase 6
 *
 * React hook for overage billing state management.
 * Provides overage events, total costs, forecasts, and payment actions.
 *
 * Usage:
 *   const {
 *     overageEvents,
 *     totalOverageCost,
 *     isLoading,
 *     error,
 *     forecast,
 *     refresh,
 *     payOverage
 *   } = useOverageBilling(orgId);
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { OverageEvent, UsageForecast } from '@/lib/overage-billing-engine'
import { OverageBillingEngine } from '@/lib/overage-billing-engine'
import { UsageForecastService } from '@/services/usage-forecast-service'

export interface UseOverageBillingResult {
  overageEvents: OverageEvent[]
  totalOverageCost: number
  isLoading: boolean
  error: Error | null
  forecast: Record<string, UsageForecast> | null
  refresh: () => Promise<void>
  payOverage: () => Promise<{ success: boolean; url?: string; error?: string }>
}

export function useOverageBilling(orgId: string): UseOverageBillingResult {
  const [overageEvents, setOverageEvents] = useState<OverageEvent[]>([])
  const [totalOverageCost, setTotalOverageCost] = useState<number>(0)
  const [forecast, setForecast] = useState<Record<string, UsageForecast> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadData = useCallback(async () => {
    if (!orgId) {
      setOverageEvents([])
      setTotalOverageCost(0)
      setForecast(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const engine = new OverageBillingEngine(supabase, orgId)
      const forecastService = new UsageForecastService(supabase, orgId)

      // Load overage events
      const events = await engine.getOverageEvents({ limit: 50 })
      setOverageEvents(events)

      // Calculate total cost
      const totalCost = await engine.getTotalOverageCost()
      setTotalOverageCost(totalCost)

      // Load forecasts
      const forecasts = await forecastService.getAllForecasts()
      setForecast(forecasts)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Unknown error')
      setError(errorObj)
      console.error('[useOverageBilling] Error loading data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const refresh = useCallback(async () => {
    await loadData()
  }, [loadData])

  const payOverage = useCallback(async (): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
      // Open Stripe Customer Portal for payment
      const { data, error } = await supabase.functions.invoke('stripe-customer-portal', {
        body: { org_id: orgId },
      })

      if (error) {
        throw error
      }

      if (data?.url) {
        window.open(data.url, '_blank')
        return { success: true, url: data.url }
      }

      return { success: false, error: 'No portal URL returned' }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to open payment portal',
      }
    }
  }, [orgId])

  return {
    overageEvents,
    totalOverageCost,
    isLoading,
    error,
    forecast,
    refresh,
    payOverage,
  }
}

export default useOverageBilling
