---
title: Phase 2 - Revenue Hooks & SDK
description: React hooks for revenue data, ROI calculations, and metrics fetching
status: pending
priority: P1
effort: 2.5h
blockedBy: ['phase-01-revenue-schema']
---

# Phase 2: Revenue Hooks & SDK

## Overview

Create React hooks and SDK for fetching revenue analytics data.

## Requirements

### Hooks
- `useRevenue` - Fetch revenue snapshots, GMV/MRR/ARR
- `useMetrics` - Fetch user metrics (DAU/MAU, churn)
- `useROI` - Fetch ROI calculations per license

### SDK
- `RevenueAnalytics` class for server-side calculations
- Cost calculation utilities

## Implementation Steps

### 2.1 Create Revenue Analytics SDK

File: `src/lib/revenue-analytics.ts`

```typescript
/**
 * Revenue Analytics SDK - ROIaaS Phase 5
 * Fetch and calculate revenue metrics, ROI, and cohort data
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  RevenueSnapshot,
  ROICalculation,
  CohortMetric,
  CostConfig,
} from '@/types/revenue-analytics'
import { DEFAULT_COST_CONFIG } from '@/types/revenue-analytics'

export interface RevenueAnalyticsOptions {
  userId?: string
  orgId?: string
  licenseId?: string
  costConfig?: CostConfig
}

export interface RevenueTrend {
  date: string
  gmv: number
  mrr: number
  arr: number
}

export interface CustomerMetrics {
  dau: number
  mau: number
  conversion_rate: number
  churn_rate: number
  retention_rate: number
}

export class RevenueAnalytics {
  private supabase: SupabaseClient
  private options: RevenueAnalyticsOptions
  private costConfig: CostConfig

  constructor(
    supabase: SupabaseClient,
    options: RevenueAnalyticsOptions = {}
  ) {
    this.supabase = supabase
    this.options = options
    this.costConfig = options.costConfig || DEFAULT_COST_CONFIG
  }

  async getCurrentSnapshot(): Promise<RevenueSnapshot | null> {
    const { data, error } = await this.supabase
      .from('revenue_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) return null

    return this.mapSnapshot(data)
  }

  async getPreviousSnapshot(): Promise<RevenueSnapshot | null> {
    const { data, error } = await this.supabase
      .from('revenue_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .offset(1)
      .single()

    if (error || !data) return null

    return this.mapSnapshot(data)
  }

  async getTrend(days: number = 30): Promise<RevenueTrend[]> {
    const { data, error } = await this.supabase
      .from('revenue_snapshots')
      .select('*')
      .gte('snapshot_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('snapshot_date', { ascending: true })

    if (error) return []

    return data.map(d => ({
      date: d.snapshot_date,
      gmv: Number(d.gmv_total) || 0,
      mrr: Number(d.mrr_total) || 0,
      arr: Number(d.arr_total) || 0,
    }))
  }

  async getROICalculation(licenseId: string): Promise<ROICalculation | null> {
    const { data, error } = await this.supabase
      .from('roi_calculations')
      .select('*')
      .eq('license_id', licenseId)
      .order('calculation_date', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) return null

    return this.mapROI(data)
  }

  async calculateROI(
    licenseId: string,
    period: { start: string; end: string }
  ): Promise<ROICalculation> {
    // Fetch usage for period
    const usageData = await this.fetchUsageForPeriod(licenseId, period)

    // Calculate costs
    const costs = this.calculateCosts(usageData)

    // Calculate revenue (from subscription + usage)
    const revenue = await this.fetchRevenueForLicense(licenseId, period)

    const roiAbsolute = revenue.total - costs.total
    const roiPercentage = costs.total > 0
      ? ((revenue.total - costs.total) / costs.total) * 100
      : 0
    const marginPercentage = revenue.total > 0
      ? ((revenue.total - costs.total) / revenue.total) * 100
      : 0

    // Upsert ROI calculation
    const calculation: ROICalculation = {
      id: crypto.randomUUID(),
      license_id: licenseId,
      user_id: this.options.userId || '',
      calculation_date: new Date().toISOString().split('T')[0],
      revenue,
      costs,
      metrics: {
        roi_absolute: roiAbsolute,
        roi_percentage: roiPercentage,
        margin_percentage: marginPercentage,
      },
      usage: usageData,
    }

    await this.supabase
      .from('roi_calculations')
      .upsert({
        license_id: calculation.license_id,
        calculation_date: calculation.calculation_date,
        revenue_subscription: calculation.revenue.subscription,
        revenue_usage_based: calculation.revenue.usage_based,
        revenue_total: calculation.revenue.total,
        cost_api_calls: calculation.costs.api_calls,
        cost_tokens: calculation.costs.tokens,
        cost_compute: calculation.costs.compute,
        cost_total: calculation.costs.total,
        roi_absolute: calculation.metrics.roi_absolute,
        roi_percentage: calculation.metrics.roi_percentage,
        margin_percentage: calculation.metrics.margin_percentage,
        api_calls: calculation.usage.api_calls,
        tokens: calculation.usage.tokens,
        agent_executions: calculation.usage.agent_executions,
      })
      .eq('license_id', licenseId)
      .eq('calculation_date', calculation.calculation_date)

    return calculation
  }

  async getCustomerMetrics(): Promise<CustomerMetrics> {
    const today = new Date().toISOString().split('T')[0]
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // DAU - users with usage today
    const dauResult = await this.supabase
      .from('usage_records')
      .select('user_id', { count: 'exact', head: true })
      .gte('recorded_at', today)
      .lt('recorded_at', new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString())

    // MAU - users with usage in last 30 days
    const mauResult = await this.supabase
      .from('usage_records')
      .select('user_id', { count: 'exact', head: true })
      .gte('recorded_at', thirtyDaysAgo)

    // Conversion rate - active licenses / total users
    const conversionResult = await this.supabase.rpc('get_conversion_rate')

    // Churn rate - cancelled licenses / total licenses
    const churnResult = await this.supabase.rpc('get_churn_rate')

    return {
      dau: dauResult.count || 0,
      mau: mauResult.count || 0,
      conversion_rate: Number(conversionResult) || 0,
      churn_rate: Number(churnResult) || 0,
      retention_rate: 1 - (Number(churnResult) || 0),
    }
  }

  async getCohortMetrics(months: number = 6): Promise<CohortMetric[]> {
    const { data, error } = await this.supabase
      .from('cohort_metrics')
      .select('*')
      .gte('cohort_month', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('cohort_month', { ascending: false })
      .order('period_day', { ascending: true })

    if (error) return []

    return data.map(d => ({
      id: d.id,
      cohort_month: d.cohort_month,
      cohort_size: d.cohort_size,
      period_day: d.period_day,
      active_users: d.active_users,
      retained_percentage: Number(d.retained_percentage) || 0,
      revenue_cumulative: Number(d.revenue_cumulative) || 0,
      arpu: Number(d.arpu) || 0,
    }))
  }

  private mapSnapshot(data: any): RevenueSnapshot {
    return {
      id: data.id,
      snapshot_date: data.snapshot_date,
      gmv: {
        total: Number(data.gmv_total) || 0,
        subscription: Number(data.gmv_subscription) || 0,
        usage_based: Number(data.gmv_usage_based) || 0,
      },
      mrr: {
        total: Number(data.mrr_total) || 0,
        new: Number(data.mrr_new) || 0,
        expansion: Number(data.mrr_expansion) || 0,
        contraction: Number(data.mrr_contraction) || 0,
        churn: Number(data.mrr_churn) || 0,
      },
      arr: {
        total: Number(data.arr_total) || 0,
      },
      customers: {
        total: data.total_customers || 0,
        new: data.new_customers || 0,
        churned: data.churned_customers || 0,
      },
      tier_breakdown: data.tier_breakdown || {},
    }
  }

  private mapROI(data: any): ROICalculation {
    return {
      id: data.id,
      license_id: data.license_id,
      user_id: data.user_id,
      calculation_date: data.calculation_date,
      revenue: {
        subscription: Number(data.revenue_subscription) || 0,
        usage_based: Number(data.revenue_usage_based) || 0,
        total: Number(data.revenue_total) || 0,
      },
      costs: {
        api_calls: Number(data.cost_api_calls) || 0,
        tokens: Number(data.cost_tokens) || 0,
        compute: Number(data.cost_compute) || 0,
        total: Number(data.cost_total) || 0,
      },
      metrics: {
        roi_absolute: Number(data.roi_absolute) || 0,
        roi_percentage: Number(data.roi_percentage) || 0,
        margin_percentage: Number(data.margin_percentage) || 0,
      },
      usage: {
        api_calls: data.api_calls || 0,
        tokens: data.tokens || 0,
        agent_executions: data.agent_executions || 0,
      },
    }
  }

  private async fetchUsageForPeriod(
    licenseId: string,
    period: { start: string; end: string }
  ): Promise<{ api_calls: number; tokens: number; agent_executions: number }> {
    // Fetch from usage_records based on license_id
    const { data } = await this.supabase
      .from('usage_records')
      .select('feature, quantity')
      .eq('license_id', licenseId)
      .gte('recorded_at', period.start)
      .lt('recorded_at', period.end)

    return {
      api_calls: data?.filter(r => r.feature === 'api_call').reduce((s, r) => s + r.quantity, 0) || 0,
      tokens: data?.filter(r => r.feature === 'tokens').reduce((s, r) => s + r.quantity, 0) || 0,
      agent_executions: data?.filter(r => r.feature === 'agent_execution').reduce((s, r) => s + r.quantity, 0) || 0,
    }
  }

  private calculateCosts(usage: { api_calls: number; tokens: number; agent_executions: number }) {
    return {
      api_calls: (usage.api_calls / 1000) * this.costConfig.cost_per_1k_api_calls,
      tokens: (usage.tokens / 1000) * this.costConfig.cost_per_1k_tokens,
      compute: 0,  // Would need compute time data
      total:
        (usage.api_calls / 1000) * this.costConfig.cost_per_1k_api_calls +
        (usage.tokens / 1000) * this.costConfig.cost_per_1k_tokens,
    }
  }

  private async fetchRevenueForLicense(
    licenseId: string,
    period: { start: string; end: string }
  ): Promise<{ subscription: number; usage_based: number; total: number }> {
    // Fetch from payment_intents or subscription tables
    const { data } = await this.supabase
      .from('payment_intents')
      .select('amount, type')
      .eq('license_id', licenseId)
      .gte('created_at', period.start)
      .lt('created_at', period.end)

    return {
      subscription: data?.filter(r => r.type === 'subscription').reduce((s, r) => s + (r.amount / 100), 0) || 0,
      usage_based: data?.filter(r => r.type === 'usage').reduce((s, r) => s + (r.amount / 100), 0) || 0,
      total: data?.reduce((s, r) => s + (r.amount / 100), 0) || 0,
    }
  }
}
```

### 2.2 Create React Hooks

File: `src/hooks/use-revenue-analytics.ts`

```typescript
/**
 * Revenue Analytics Hooks - ROIaaS Phase 5
 */

import { useState, useEffect, useCallback } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { RevenueAnalytics } from '@/lib/revenue-analytics'
import type {
  RevenueSnapshot,
  ROICalculation,
  CustomerMetrics,
  CohortMetric,
} from '@/types/revenue-analytics'

export function useRevenue() {
  const supabase = useSupabaseClient()
  const [currentSnapshot, setCurrentSnapshot] = useState<RevenueSnapshot | null>(null)
  const [previousSnapshot, setPreviousSnapshot] = useState<RevenueSnapshot | null>(null)
  const [trend, setTrend] = useState<{ date: string; gmv: number; mrr: number; arr: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRevenue = useCallback(async () => {
    try {
      setLoading(true)
      const analytics = new RevenueAnalytics(supabase)

      const [current, previous, trendData] = await Promise.all([
        analytics.getCurrentSnapshot(),
        analytics.getPreviousSnapshot(),
        analytics.getTrend(30),
      ])

      setCurrentSnapshot(current)
      setPreviousSnapshot(previous)
      setTrend(trendData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch revenue data')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchRevenue()
  }, [fetchRevenue])

  return {
    currentSnapshot,
    previousSnapshot,
    trend,
    loading,
    error,
    refresh: fetchRevenue,
  }
}

export function useROI(licenseId?: string) {
  const supabase = useSupabaseClient()
  const [roi, setRoi] = useState<ROICalculation | null>(null)
  const [loading, setLoading] = useState(!licenseId)
  const [error, setError] = useState<string | null>(null)

  const fetchROI = useCallback(async () => {
    if (!licenseId) return

    try {
      setLoading(true)
      const analytics = new RevenueAnalytics(supabase)
      const data = await analytics.getROICalculation(licenseId)
      setRoi(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ROI data')
    } finally {
      setLoading(false)
    }
  }, [supabase, licenseId])

  const calculateROI = useCallback(async (
    period: { start: string; end: string }
  ) => {
    if (!licenseId) return

    try {
      setLoading(true)
      const analytics = new RevenueAnalytics(supabase, { licenseId })
      const data = await analytics.calculateROI(licenseId, period)
      setRoi(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate ROI')
    } finally {
      setLoading(false)
    }
  }, [supabase, licenseId])

  useEffect(() => {
    if (licenseId) {
      fetchROI()
    }
  }, [licenseId, fetchROI])

  return {
    roi,
    loading,
    error,
    refresh: fetchROI,
    calculate: calculateROI,
  }
}

export function useCustomerMetrics() {
  const supabase = useSupabaseClient()
  const [metrics, setMetrics] = useState<CustomerMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true)
      const analytics = new RevenueAnalytics(supabase)
      const data = await analytics.getCustomerMetrics()
      setMetrics(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customer metrics')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  return {
    metrics,
    loading,
    error,
    refresh: fetchMetrics,
  }
}
```

### 2.3 Create Context Provider

File: `src/contexts/RevenueAnalyticsProvider.tsx`

```typescript
/**
 * Revenue Analytics Context Provider
 */

import { createContext, useContext, ReactNode } from 'react'
import { useRevenue, useROI, useCustomerMetrics } from '@/hooks/use-revenue-analytics'

interface RevenueAnalyticsContext {
  revenue: ReturnType<typeof useRevenue>
  roi: ReturnType<typeof useROI>
  metrics: ReturnType<typeof useCustomerMetrics>
}

const Context = createContext<RevenueAnalyticsContext | null>(null)

interface Props {
  children: ReactNode
}

export function RevenueAnalyticsProvider({ children }: Props) {
  const revenue = useRevenue()
  const roi = useROI()
  const metrics = useCustomerMetrics()

  return (
    <Context.Provider value={{ revenue, roi, metrics }}>
      {children}
    </Context.Provider>
  )
}

export function useRevenueAnalytics() {
  const context = useContext(Context)
  if (!context) {
    throw new Error('useRevenueAnalytics must be used within RevenueAnalyticsProvider')
  }
  return context
}
```

## Todo List

- [ ] Create `src/lib/revenue-analytics.ts` SDK
- [ ] Create `src/hooks/use-revenue-analytics.ts`
- [ ] Create `src/contexts/RevenueAnalyticsProvider.tsx`
- [ ] Export hooks from `src/hooks/index.ts`
- [ ] Add provider to `src/main.tsx`
- [ ] Test hooks with mock data

## Success Criteria

- [ ] All hooks return data correctly
- [ ] TypeScript compiles with 0 errors
- [ ] ROI calculations match expected formulas
- [ ] Context provider works in app

## Dependencies

- **Blocked by:** Phase 1 (Revenue Schema)
- **Blocks:** Phase 3 (Revenue Dashboard UI)

---

_Effort: 2.5h | Priority: P1 | Status: Ready_
