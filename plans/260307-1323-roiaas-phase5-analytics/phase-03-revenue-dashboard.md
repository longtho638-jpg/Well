---
title: Phase 3 - Revenue Dashboard UI
description: Revenue dashboard with GMV/MRR/ARR cards and revenue trends
status: pending
priority: P1
effort: 3h
blockedBy: ['phase-02-revenue-hooks']
---

# Phase 3: Revenue Dashboard UI

## Overview

Build revenue dashboard UI components displaying GMV, MRR, ARR metrics with Aura Elite design.

## Requirements

### Dashboard Page
- Route: `/dashboard/revenue`
- Tabs: Overview | Revenue | ROI | Metrics

### Components
- `RevenueSummaryCard` - GMV/MRR/ARR cards
- `RevenueTrendChart` - Revenue over time
- `TierBreakdownPie` - Revenue by tier
- `MetricGrid` - Customer metrics grid

## Implementation Steps

### 3.1 Create Revenue Summary Card

File: `src/components/analytics/RevenueSummaryCard.tsx`

```typescript
/**
 * Revenue Summary Card - displays GMV, MRR, ARR metrics
 */

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

interface RevenueSummaryCardProps {
  title: string
  value: number
  previousValue?: number
  subtitle?: string
  icon?: 'gmv' | 'mrr' | 'arr'
  className?: string
}

const ICONS = {
  gmv: DollarSign,
  mrr: DollarSign,
  arr: DollarSign,
}

export function RevenueSummaryCard({
  title,
  value,
  previousValue,
  subtitle,
  icon = 'gmv',
  className,
}: RevenueSummaryCardProps) {
  const Icon = ICONS[icon]
  const change = previousValue
    ? ((value - previousValue) / previousValue) * 100
    : 0
  const isPositive = change >= 0

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`
    return `$${val.toFixed(0)}`
  }

  return (
    <div className={cn(
      'relative p-6 rounded-xl border border-white/10',
      'bg-gradient-to-br from-gray-800/50 to-gray-900/50',
      'backdrop-blur-sm hover:border-white/20 transition-all',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-400 uppercase tracking-wide">
          {title}
        </span>
        <div className="p-2 rounded-lg bg-white/5">
          <Icon className="w-5 h-5 text-emerald-400" />
        </div>
      </div>

      {/* Value */}
      <div className="mb-2">
        <p className="text-3xl font-bold text-white">
          {formatCurrency(value)}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>

      {/* Change */}
      {previousValue !== undefined && (
        <div className={cn(
          'flex items-center gap-1 text-sm',
          isPositive ? 'text-emerald-400' : 'text-red-400'
        )}>
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span className="font-medium">
            {isPositive ? '+' : ''}{change.toFixed(1)}%
          </span>
          <span className="text-gray-500">vs last period</span>
        </div>
      )}
    </div>
  )
}
```

### 3.2 Create Revenue Trend Chart

File: `src/components/analytics/RevenueTrendChart.tsx`

```typescript
/**
 * Revenue Trend Chart - line chart showing revenue over time
 */

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { cn } from '@/lib/utils'

interface RevenueTrendChartProps {
  data: { date: string; gmv: number; mrr: number; arr: number }[]
  metric?: 'gmv' | 'mrr' | 'arr'
  className?: string
}

export function RevenueTrendChart({
  data,
  metric = 'mrr',
  className,
}: RevenueTrendChartProps) {
  const formatY = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(0)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  const formatX = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  }

  const METRIC_COLORS = {
    gmv: '#10b981',    // emerald-500
    mrr: '#3b82f6',    // blue-500
    arr: '#8b5cf6',    // purple-500
  }

  return (
    <div className={cn(
      'p-6 rounded-xl border border-white/10',
      'bg-gradient-to-br from-gray-800/50 to-gray-900/50',
      'backdrop-blur-sm',
      className
    )}>
      <h3 className="text-lg font-semibold text-white mb-4">
        {metric.toUpperCase()} Trend
      </h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              dataKey="date"
              tickFormatter={formatX}
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={formatY}
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#fff' }}
              formatter={(value: number) => [formatY(value), metric.toUpperCase()]}
            />
            <Line
              type="monotone"
              dataKey={metric}
              stroke={METRIC_COLORS[metric]}
              strokeWidth={2}
              dot={{ fill: METRIC_COLORS[metric], r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

### 3.3 Create Tier Breakdown Pie Chart

File: `src/components/analytics/TierBreakdownPie.tsx`

```typescript
/**
 * Tier Breakdown Pie Chart - revenue by license tier
 */

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'

interface TierBreakdownPieProps {
  tierBreakdown: Record<string, number>
  className?: string
}

const TIER_COLORS: Record<string, string> = {
  free: '#6b7280',      // gray-500
  basic: '#3b82f6',     // blue-500
  premium: '#8b5cf6',   // purple-500
  enterprise: '#f59e0b',// amber-500
  master: '#10b981',    // emerald-500
}

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  basic: 'Basic',
  premium: 'Premium',
  enterprise: 'Enterprise',
  master: 'Master',
}

export function TierBreakdownPie({ tierBreakdown, className }: TierBreakdownPieProps) {
  const data = Object.entries(tierBreakdown)
    .filter(([_, count]) => count > 0)
    .map(([tier, count]) => ({
      name: TIER_LABELS[tier] || tier,
      value: count,
      fill: TIER_COLORS[tier] || '#6b7280',
    }))

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className={cn(
      'p-6 rounded-xl border border-white/10',
      'bg-gradient-to-br from-gray-800/50 to-gray-900/50',
      'backdrop-blur-sm',
      className
    )}>
      <h3 className="text-lg font-semibold text-white mb-4">
        Revenue by Tier
      </h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [value, 'Customers']}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-gray-300">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{total.toLocaleString()}</p>
          <p className="text-xs text-gray-400">Total Customers</p>
        </div>
      </div>
    </div>
  )
}
```

### 3.4 Create Revenue Dashboard Page

File: `src/pages/dashboard/RevenueDashboard.tsx`

```typescript
/**
 * Revenue Dashboard Page - /dashboard/revenue
 */

import { useRevenueAnalytics } from '@/contexts/RevenueAnalyticsProvider'
import { RevenueSummaryCard } from '@/components/analytics/RevenueSummaryCard'
import { RevenueTrendChart } from '@/components/analytics/RevenueTrendChart'
import { TierBreakdownPie } from '@/components/analytics/TierBreakdownPie'
import { useCustomerMetrics } from '@/hooks/use-revenue-analytics'

export function RevenueDashboard() {
  const { revenue } = useRevenueAnalytics()
  const { metrics } = useCustomerMetrics()

  if (revenue.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading revenue data...</div>
      </div>
    )
  }

  const current = revenue.currentSnapshot
  const previous = revenue.previousSnapshot

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Revenue Analytics</h1>
        <p className="text-gray-400 mt-1">
          Track GMV, MRR, ARR and customer metrics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RevenueSummaryCard
          title="GMV"
          value={current?.gmv.total || 0}
          previousValue={previous?.gmv.total}
          subtitle="Gross Merchandise Value"
          icon="gmv"
        />
        <RevenueSummaryCard
          title="MRR"
          value={current?.mrr.total || 0}
          previousValue={previous?.mrr.total}
          subtitle="Monthly Recurring Revenue"
          icon="mrr"
        />
        <RevenueSummaryCard
          title="ARR"
          value={current?.arr.total || 0}
          previousValue={previous?.arr.total}
          subtitle="Annual Recurring Revenue"
          icon="arr"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueTrendChart
          data={revenue.trend}
          metric="mrr"
        />
        {current && (
          <TierBreakdownPie
            tierBreakdown={current.tier_breakdown}
          />
        )}
      </div>

      {/* Customer Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-gray-800/50 border border-white/10">
            <p className="text-sm text-gray-400">DAU</p>
            <p className="text-2xl font-bold text-white">{metrics.dau}</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-800/50 border border-white/10">
            <p className="text-sm text-gray-400">MAU</p>
            <p className="text-2xl font-bold text-white">{metrics.mau}</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-800/50 border border-white/10">
            <p className="text-sm text-gray-400">Churn Rate</p>
            <p className="text-2xl font-bold text-white">
              {(metrics.churn_rate * 100).toFixed(1)}%
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gray-800/50 border border-white/10">
            <p className="text-sm text-gray-400">Retention</p>
            <p className="text-2xl font-bold text-white">
              {(metrics.retention_rate * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 3.5 Add Route

File: `src/App.tsx` (or routes file)

```typescript
// Add route for revenue dashboard
<Route
  path="/dashboard/revenue"
  element={<RevenueDashboard />}
/>
```

## Todo List

- [ ] Create `RevenueSummaryCard.tsx`
- [ ] Create `RevenueTrendChart.tsx`
- [ ] Create `TierBreakdownPie.tsx`
- [ ] Create `RevenueDashboard.tsx` page
- [ ] Add route to App.tsx
- [ ] Test with live data
- [ ] Verify Aura Elite styling

## Success Criteria

- [ ] Dashboard renders at `/dashboard/revenue`
- [ ] All cards display correct values
- [ ] Charts render with real data
- [ ] Responsive on mobile
- [ ] Aura Elite glassmorphism applied

## Dependencies

- **Blocked by:** Phase 2 (Revenue Hooks)
- **Blocks:** Phase 5 (ROI Calculator UI)

---

_Effort: 3h | Priority: P1 | Status: Ready_
