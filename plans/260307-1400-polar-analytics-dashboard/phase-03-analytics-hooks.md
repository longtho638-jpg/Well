---
title: "Phase 3 - Analytics React Hooks"
description: "Create React hooks for fetching cohort retention, revenue trends, and usage analytics"
status: pending
priority: P2
effort: 2h
---

# Phase 3: Analytics React Hooks

## Overview

Create React hooks to fetch analytics data from Supabase for dashboard UI components.

## Context Links

- Existing hooks: `src/hooks/use-revenue-analytics.ts`, `src/hooks/use-usage-analytics.ts`
- Schema: `phase-01-analytics-schema.md`
- Types: `src/types/revenue-analytics.ts`

## Key Insights

Current hooks use MOCK DATA (see `use-revenue-analytics.ts` lines 30-51).

**Need to replace with real Supabase queries:**
- `useRevenue()` - Fetch from `revenue_snapshots`
- `useCohortRetention()` - NEW: Fetch from `cohort_retention_metrics`
- `useLicenseUsage()` - NEW: Fetch from `usage_records` aggregated by tier

## Requirements

### Functional

1. `useRevenue()` - Fetch revenue snapshots with trend calculation
2. `useCohortRetention()` - Fetch cohort retention curves (D0/D30/D60/D90)
3. `useLicenseUsage()` - Fetch usage trends by license tier
4. `useTopConsumers()` - Fetch top customers by usage
5. Support date range filters (7d/30d/90d/custom)
6. Support tier filters (free/basic/premium/enterprise/master)

### Non-Functional

1. TypeScript strict types (no `any`)
2. Error handling with retry
3. Loading states
4. Cache invalidation on refresh

## Architecture

```
┌─────────────────────────────────┐
│  Dashboard UI Components        │
│  - RevenueChart                 │
│  - CohortRetentionMatrix        │
│  - UsageTrendsChart             │
└─────────────┬───────────────────┘
              │ use hook methods
              ▼
┌─────────────────────────────────┐
│  Analytics Hooks                │
│  - useRevenue()                 │
│  - useCohortRetention()         │
│  - useLicenseUsage()            │
│  - useTopConsumers()            │
└─────────────┬───────────────────┘
              │ RPC calls / table queries
              ▼
┌─────────────────────────────────┐
│  Supabase Tables                │
│  - revenue_snapshots            │
│  - cohort_retention_metrics     │
│  - usage_records                │
│  - customer_cohorts             │
└─────────────────────────────────┘
```

## Related Code Files

### To Create

- `src/hooks/use-cohort-retention.ts` - Cohort retention hook
- `src/hooks/use-license-usage.ts` - License usage trends hook
- `src/types/cohort-analytics.ts` - Cohort types

### To Modify

- `src/hooks/use-revenue-analytics.ts` - Replace mock data with real queries
- `src/types/revenue-analytics.ts` - Add missing types

## Implementation Steps

### Step 1: Create Cohort Types

Create `src/types/cohort-analytics.ts`:

```typescript
export interface CohortRetentionData {
  cohort_month: string
  cohort_size: number
  periods: Array<{
    period_day: number
    active_users: number
    retained_percentage: number
    cumulative_revenue: number
    arpu: number
  }>
}

export interface CohortFilters {
  cohortMonths?: string[]  // ['2026-01', '2026-02']
  tier?: string            // 'basic', 'premium'
}
```

### Step 2: Create useCohortRetention Hook

Create `src/hooks/use-cohort-retention.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { CohortRetentionData, CohortFilters } from '@/types/cohort-analytics'

export function useCohortRetention(filters?: CohortFilters) {
  const [data, setData] = useState<CohortRetentionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )

  const fetchCohorts = useCallback(async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('cohort_retention_metrics')
        .select('*')
        .order('cohort_month', { ascending: false })
        .order('period_day', { ascending: true })

      if (filters?.cohortMonths) {
        query = query.in('cohort_month', filters.cohortMonths)
      }

      const { data, error } = await query

      if (error) throw error

      // Transform flat rows into nested structure
      const transformed = transformCohortData(data)
      setData(transformed)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters, supabase])

  useEffect(() => {
    fetchCohorts()
  }, [fetchCohorts])

  return { data, loading, error, refresh: fetchCohorts }
}

function transformCohortData(rows: any[]): CohortRetentionData[] {
  // Group by cohort_month, nest periods
  const map = new Map<string, CohortRetentionData>()

  rows.forEach(row => {
    const cohort = map.get(row.cohort_month) || {
      cohort_month: row.cohort_month,
      cohort_size: row.cohort_size,
      periods: [],
    }

    cohort.periods.push({
      period_day: row.period_day,
      active_users: row.active_users,
      retained_percentage: row.retained_percentage,
      cumulative_revenue: row.cumulative_revenue_cents,
      arpu: row.arpu_cents,
    })

    map.set(row.cohort_month, cohort)
  })

  return Array.from(map.values())
}
```

### Step 3: Create useLicenseUsage Hook

Create `src/hooks/use-license-usage.ts`:

```typescript
export function useLicenseUsage(options: {
  startDate?: string
  endDate?: string
  tiers?: string[]
  granularity?: 'day' | 'week' | 'month'
}) {
  const [data, setData] = useState<UsageTrendData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsage = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_usage_trends', {
        p_start_date: options.startDate,
        p_end_date: options.endDate,
        p_granularity: options.granularity || 'day',
      })

      if (error) throw error

      // Filter by tiers if needed (join with customer_cohorts)
      let filtered = data

      if (options.tiers) {
        const { data: tierMap } = await supabase
          .from('customer_cohorts')
          .select('customer_id, current_tier')
          .in('current_tier', options.tiers)

        const tierCustomerIds = tierMap?.map(c => c.customer_id)
        filtered = data.filter(d => tierCustomerIds?.includes(d.customer_id))
      }

      setData(filtered)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [options, supabase])

  useEffect(() => {
    fetchUsage()
  }, [fetchUsage])

  return { data, loading, error, refresh: fetchUsage }
}
```

### Step 4: Update useRevenue Hook

Modify `src/hooks/use-revenue-analytics.ts`:

```typescript
// Replace mock data (lines 30-51) with real query:

const fetchRevenue = useCallback(async (): Promise<void> => {
  try {
    setLoading(true)

    // Fetch current snapshot (today)
    const { data: current } = await supabase
      .from('revenue_snapshots')
      .select('*')
      .eq('snapshot_date', new Date().toISOString().split('T')[0])
      .single()

    // Fetch previous snapshot (7 days ago)
    const prevDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    const { data: previous } = await supabase
      .from('revenue_snapshots')
      .select('*')
      .eq('snapshot_date', prevDate)
      .single()

    if (!current) {
      setData(null)
      return
    }

    // Calculate trends
    const trend = {
      gmv: previous
        ? ((current.gmv_total - previous.gmv_total) / previous.gmv_total) * 100
        : 0,
      mrr: previous
        ? ((current.mrr_total - previous.mrr_total) / previous.mrr_total) * 100
        : 0,
      arr: previous
        ? ((current.arr_total - previous.arr_total) / previous.arr_total) * 100
        : 0,
      customers: previous
        ? ((current.total_customers - previous.total_customers) / previous.total_customers) * 100
        : 0,
    }

    setData({
      currentSnapshot: transformSnapshot(current),
      previousSnapshot: previous ? transformSnapshot(previous) : null,
      trend,
    })
    setError(null)
  } catch (err: any) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}, [days, supabase])
```

## Todo List

- [ ] Create `src/types/cohort-analytics.ts`
- [ ] Create `src/hooks/use-cohort-retention.ts`
- [ ] Create `src/hooks/use-license-usage.ts`
- [ ] Update `src/hooks/use-revenue-analytics.ts` with real queries
- [ ] Update `src/hooks/use-usage-analytics.ts` with tier filters
- [ ] Add error handling with retry logic
- [ ] Add loading states
- [ ] Test all hooks with real data
- [ ] Update i18n keys if needed

## Success Criteria

- [ ] `useRevenue()` returns real data from `revenue_snapshots`
- [ ] `useCohortRetention()` returns nested cohort data
- [ ] `useLicenseUsage()` returns usage trends filtered by tier
- [ ] All hooks have proper TypeScript types (no `any`)
- [ ] Loading states work correctly
- [ ] Error handling shows user-friendly messages

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Slow queries on large tables | Add indexes, use RPC functions |
| RLS blocks admin queries | Use service role in hooks if needed |
| Type mismatches from DB | Use zod validation on response |

## Next Steps

After hooks are complete:
1. Build dashboard UI components using hooks
2. Add date range picker and tier filter controls
3. Create chart components (Recharts library)
