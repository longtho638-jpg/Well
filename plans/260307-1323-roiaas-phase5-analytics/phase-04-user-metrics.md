---
title: Phase 4 - User Metrics & Cohorts
description: User analytics with DAU/MAU, cohort analysis, churn tracking, and funnels
status: pending
priority: P1
effort: 2.5h
blockedBy: ['phase-02-revenue-hooks']
---

# Phase 4: User Metrics & Cohorts

## Overview

Build user analytics dashboard with DAU/MAU metrics, cohort retention analysis, churn tracking, and conversion funnels.

## Requirements

### Metrics Dashboard
- DAU/MAU ratio (stickiness)
- Active users trend
- New vs churned users

### Cohort Analysis
- Retention by cohort month
- Revenue per cohort
- Lifetime value (LTV)

### Churn Tracking
- Churn rate trend
- Churn by tier
- Cancellation reasons

## Implementation Steps

### 4.1 Create User Metrics SDK

Add to `src/lib/revenue-analytics.ts`:

```typescript
export interface UserMetrics {
  dau: number
  mau: number
  stickiness: number  // DAU/MAU ratio
  new_today: number
  new_week: number
  new_month: number
  churned_today: number
  churned_week: number
  churned_month: number
}

export interface CohortData {
  cohort_month: string
  cohort_size: number
  periods: {
    day: number
    active: number
    retained: number
    revenue: number
  }[]
}

export interface ChurnMetrics {
  total_churned: number
  churn_by_tier: Record<string, number>
  churn_reasons: Record<string, number>
  churn_rate_trend: { date: string; rate: number }[]
}

// Add to RevenueAnalytics class:

async getUserMetrics(): Promise<UserMetrics> {
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // DAU - users active today
  const dauResult = await this.supabase
    .from('usage_records')
    .select('user_id', { count: 'exact', head: true })
    .gte('recorded_at', today)

  // MAU - users active in last 30 days
  const mauResult = await this.supabase
    .from('usage_records')
    .select('user_id', { count: 'exact', head: true })
    .gte('recorded_at', monthAgo)

  // New users
  const newToday = await this.supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', today)

  const newWeek = await this.supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', weekAgo)

  const newMonth = await this.supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', monthAgo)

  // Churned users (cancelled licenses)
  const churnedToday = await this.supabase
    .from('raas_licenses')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'cancelled')
    .gte('cancelled_at', today)

  const churnedWeek = await this.supabase
    .from('raas_licenses')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'cancelled')
    .gte('cancelled_at', weekAgo)

  const churnedMonth = await this.supabase
    .from('raas_licenses')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'cancelled')
    .gte('cancelled_at', monthAgo)

  return {
    dau: dauResult.count || 0,
    mau: mauResult.count || 0,
    stickiness: mauResult.count ? (dauResult.count || 0) / mauResult.count : 0,
    new_today: newToday.count || 0,
    new_week: newWeek.count || 0,
    new_month: newMonth.count || 0,
    churned_today: churnedToday.count || 0,
    churned_week: churnedWeek.count || 0,
    churned_month: churnedMonth.count || 0,
  }
}

async getCohortData(months: number = 6): Promise<CohortData[]> {
  const { data, error } = await this.supabase
    .from('cohort_metrics')
    .select('*')
    .gte('cohort_month', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('cohort_month', { ascending: true })
    .order('period_day', { ascending: true })

  if (error) return []

  // Group by cohort month
  const cohortMap = new Map<string, CohortData>()
  data.forEach(row => {
    const month = row.cohort_month
    if (!cohortMap.has(month)) {
      cohortMap.set(month, {
        cohort_month: month,
        cohort_size: row.cohort_size,
        periods: [],
      })
    }
    cohortMap.get(month)!.periods.push({
      day: row.period_day,
      active: row.active_users,
      retained: row.retained_percentage,
      revenue: row.revenue_cumulative,
    })
  })

  return Array.from(cohortMap.values())
}

async getChurnMetrics(): Promise<ChurnMetrics> {
  // Total churned
  const totalResult = await this.supabase
    .from('raas_licenses')
    .select('id, tier, cancellation_reason')
    .eq('status', 'cancelled')

  // Churn by tier
  const byTier: Record<string, number> = {}
  const byReason: Record<string, number> = {}

  totalResult.data?.forEach(license => {
    byTier[license.tier] = (byTier[license.tier] || 0) + 1
    if (license.cancellation_reason) {
      byReason[license.cancellation_reason] = (byReason[license.cancellation_reason] || 0) + 1
    }
  })

  // Churn rate trend (last 30 days)
  const trendResult = await this.supabase.rpc('get_churn_rate_trend', { days: 30 })

  return {
    total_churned: totalResult.data?.length || 0,
    churn_by_tier: byTier,
    churn_reasons: byReason,
    churn_rate_trend: trendResult || [],
  }
}
```

### 4.2 Create User Metrics Card

File: `src/components/analytics/UserMetricsCard.tsx`

```typescript
/**
 * User Metrics Card - displays DAU, MAU, stickiness
 */

import { Users, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserMetricsCardProps {
  dau: number
  mau: number
  stickiness: number
  newUsers: number
  churnedUsers: number
  className?: string
}

export function UserMetricsCard({
  dau,
  mau,
  stickiness,
  newUsers,
  churnedUsers,
  className,
}: UserMetricsCardProps) {
  const netGrowth = newUsers - churnedUsers
  const growthRate = mau > 0 ? (newUsers - churnedUsers) / mau : 0

  return (
    <div className={cn(
      'p-6 rounded-xl border border-white/10',
      'bg-gradient-to-br from-gray-800/50 to-gray-900/50',
      'backdrop-blur-sm',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-400">User Metrics</h3>
            <p className="text-xs text-gray-500">Last 30 days</p>
          </div>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">DAU</p>
          <p className="text-2xl font-bold text-white">{dau.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">MAU</p>
          <p className="text-2xl font-bold text-white">{mau.toLocaleString()}</p>
        </div>
      </div>

      {/* Stickiness */}
      <div className="mb-4 p-3 rounded-lg bg-white/5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Stickiness</span>
          <span className="text-lg font-bold text-white">
            {(stickiness * 100).toFixed(1)}%
          </span>
        </div>
        <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${Math.min(100, stickiness * 100)}%` }}
          />
        </div>
      </div>

      {/* Growth */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Net Growth</span>
          {growthRate >= 0 ? (
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-400" />
          )}
        </div>
        <span className={cn(
          'font-semibold',
          growthRate >= 0 ? 'text-emerald-400' : 'text-red-400'
        )}>
          {netGrowth >= 0 ? '+' : ''}{netGrowth.toLocaleString()}
        </span>
      </div>
    </div>
  )
}
```

### 4.3 Create Cohort Retention Chart

File: `src/components/analytics/CohortRetentionChart.tsx`

```typescript
/**
 * Cohort Retention Chart - heatmap style retention matrix
 */

import { cn } from '@/lib/utils'
import type { CohortData } from '@/lib/revenue-analytics'

interface CohortRetentionChartProps {
  cohorts: CohortData[]
  className?: string
}

export function CohortRetentionChart({ cohorts, className }: CohortRetentionChartProps) {
  const formatMonth = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' })
  }

  const getRetentionColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-emerald-500'
    if (percentage >= 60) return 'bg-emerald-600'
    if (percentage >= 40) return 'bg-amber-500'
    if (percentage >= 20) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className={cn(
      'p-6 rounded-xl border border-white/10',
      'bg-gradient-to-br from-gray-800/50 to-gray-900/50',
      'backdrop-blur-sm overflow-x-auto',
      className
    )}>
      <h3 className="text-lg font-semibold text-white mb-4">Cohort Retention</h3>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-2 px-3 text-gray-400 font-medium">Cohort</th>
            <th className="text-right py-2 px-3 text-gray-400 font-medium">Size</th>
            {[0, 30, 60, 90].map(day => (
              <th key={day} className="text-right py-2 px-3 text-gray-400 font-medium">
                D{day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map(cohort => (
            <tr key={cohort.cohort_month} className="border-b border-white/5">
              <td className="py-3 px-3 text-white font-medium">
                {formatMonth(cohort.cohort_month)}
              </td>
              <td className="py-3 px-3 text-right text-gray-400">
                {cohort.cohort_size.toLocaleString()}
              </td>
              {cohort.periods.map(period => (
                <td key={period.day} className="py-3 px-3 text-right">
                  {period.day <= 90 && (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-gray-300 text-xs">
                        {period.retained.toFixed(0)}%
                      </span>
                      <div
                        className={cn(
                          'w-8 h-6 rounded',
                          getRetentionColor(period.retained)
                        )}
                      />
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### 4.4 Create User Metrics Page

File: `src/pages/dashboard/UserMetricsPage.tsx`

```typescript
/**
 * User Metrics Page - /dashboard/users
 */

import { useRevenueAnalytics } from '@/contexts/RevenueAnalyticsProvider'
import { UserMetricsCard } from '@/components/analytics/UserMetricsCard'
import { CohortRetentionChart } from '@/components/analytics/CohortRetentionChart'

export function UserMetricsPage() {
  const { metrics } = useRevenueAnalytics()

  if (metrics.loading) {
    return <div className="p-8 text-center text-gray-400">Loading...</div>
  }

  const userMetrics = metrics.metrics

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">User Analytics</h1>
        <p className="text-gray-400 mt-1">
          Track user engagement, retention, and cohorts
        </p>
      </div>

      <UserMetricsCard
        dau={userMetrics?.dau || 0}
        mau={userMetrics?.mau || 0}
        stickiness={userMetrics?.stickiness || 0}
        newUsers={userMetrics?.new_month || 0}
        churnedUsers={userMetrics?.churned_month || 0}
      />

      <CohortRetentionChart cohorts={[]} />
    </div>
  )
}
```

## Todo List

- [ ] Add user metrics methods to SDK
- [ ] Create `UserMetricsCard.tsx`
- [ ] Create `CohortRetentionChart.tsx`
- [ ] Create `UserMetricsPage.tsx`
- [ ] Add route `/dashboard/users`
- [ ] Create cohort migration SQL

## Success Criteria

- [ ] DAU/MAU displays correctly
- [ ] Stickiness gauge renders
- [ ] Cohort chart shows retention
- [ ] All TypeScript compiles (0 errors)

## Dependencies

- **Blocked by:** Phase 2 (Revenue Hooks)
- **Blocks:** Phase 6 (Premium Visualizations)

---

_Effort: 2.5h | Priority: P1 | Status: Ready_
