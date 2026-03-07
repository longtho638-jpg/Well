---
title: "Phase 4 - Dashboard UI"
description: "Build dashboard UI with charts, filters, and cohort retention matrix"
status: pending
priority: P2
effort: 4h
---

# Phase 4: Dashboard UI

## Overview

Build comprehensive analytics dashboard UI with interactive charts, date range filters, tier filters, and cohort retention matrix.

## Context Links

- Existing components: `src/components/analytics/` (UsageGaugeCard, UsageTrendsChart, TopConsumersTable)
- Hooks: `src/hooks/use-revenue-analytics.ts`, `src/hooks/use-cohort-retention.ts`
- i18n: `src/locales/en/analytics.ts`, `src/locales/vi/analytics.ts`

## Key Insights

Existing analytics components focus on USAGE tracking only.

**Need to add:**
- Revenue dashboard (MRR/ARR/GMV charts)
- Cohort retention matrix (heatmap style)
- Date range picker (7d/30d/90d/custom)
- Tier filter checkboxes
- Customer segment filters

## Requirements

### Functional

1. Revenue dashboard with MRR/ARR/GMV trend charts
2. Cohort retention matrix (D0/D30/D60/D90 heatmap)
3. License usage trends by tier (stacked area chart)
4. Date range picker component
5. Tier filter (checkboxes for free/basic/premium/enterprise/master)
6. Export to CSV/PDF functionality

### Non-Functional

1. Responsive design (mobile/tablet/desktop)
2. Loading skeletons during fetch
3. Empty states with helpful messages
4. Error boundaries for failed queries
5. Dark mode compatible (Aura Elite design system)

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  /dashboard/analytics (Main Page)                   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  FilterBar                                  │   │
│  │  - DateRangePicker  - TierFilter  - Export  │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │ RevenueCard │  │  MRRCard    │  │ ARRPCard   │  │
│  └─────────────┘  └─────────────┘  └────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  RevenueTrendChart (Line)                   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  CohortRetentionMatrix (Heatmap)            │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  UsageTrendsChart (Stacked Area)            │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  TopConsumersTable                          │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Related Code Files

### To Create

- `src/pages/analytics-dashboard.tsx` - Main dashboard page
- `src/components/analytics/RevenueChart.tsx` - Revenue trend chart
- `src/components/analytics/CohortRetentionMatrix.tsx` - Cohort heatmap
- `src/components/analytics/UsageTrendsByTier.tsx` - Stacked area chart
- `src/components/analytics/FilterBar.tsx` - Date/tier filters
- `src/components/analytics/MetricCard.tsx` - Reusable metric card

### To Modify

- `src/components/analytics/UsageTrendsChart.tsx` - Add tier filter support
- `src/components/analytics/TopConsumersTable.tsx` - Add polar data source
- `src/locales/en/analytics.ts` - Add new i18n keys
- `src/locales/vi/analytics.ts` - Add new i18n keys

## Implementation Steps

### Step 1: Create FilterBar Component

Create `src/components/analytics/FilterBar.tsx`:

```typescript
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface FilterBarProps {
  onDateRangeChange: (range: DateRange) => void
  onTierFilterChange: (tiers: string[]) => void
  onExport: () => void
}

type DateRange = '7d' | '30d' | '90d' | 'custom'

export function FilterBar({ onDateRangeChange, onTierFilterChange, onExport }: FilterBarProps) {
  const { t } = useTranslation('analytics')
  const [selectedTiers, setSelectedTiers] = useState<string[]>([])

  const tiers = ['free', 'basic', 'premium', 'enterprise', 'master']

  return (
    <div className="flex flex-wrap gap-4 p-4 bg-gray-800/50 rounded-lg backdrop-blur">
      {/* Date Range */}
      <div className="flex gap-2">
        {(['7d', '30d', '90d', 'custom'] as const).map(range => (
          <button
            key={range}
            onClick={() => onDateRangeChange(range)}
            className="px-3 py-1.5 text-sm rounded-md bg-gray-700 hover:bg-gray-600 transition"
          >
            {t(`periods.${range}`)}
          </button>
        ))}
      </div>

      {/* Tier Filter */}
      <div className="flex gap-3 items-center">
        <span className="text-sm text-gray-400">{t('filters.tier')}:</span>
        {tiers.map(tier => (
          <label key={tier} className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedTiers.includes(tier)}
              onChange={(e) => {
                const newTiers = e.target.checked
                  ? [...selectedTiers, tier]
                  : selectedTiers.filter(t => t !== tier)
                setSelectedTiers(newTiers)
                onTierFilterChange(newTiers)
              }}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700"
            />
            <span className="text-sm capitalize">{t(`tiers.${tier}`)}</span>
          </label>
        ))}
      </div>

      {/* Export Button */}
      <button
        onClick={onExport}
        className="ml-auto px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 rounded-md transition"
      >
        {t('actions.download_report')}
      </button>
    </div>
  )
}
```

### Step 2: Create MetricCard Component

Create `src/components/analytics/MetricCard.tsx`:

```typescript
interface MetricCardProps {
  title: string
  value: number
  trend?: number  // percentage change
  trendLabel?: string
  currency?: 'VND' | 'USD'
  format?: 'currency' | 'number' | 'percentage'
  loading?: boolean
}

export function MetricCard({
  title,
  value,
  trend,
  trendLabel,
  currency = 'VND',
  format = 'currency',
  loading = false,
}: MetricCardProps) {
  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-800 rounded-lg" />
  }

  const formattedValue = formatValue(value, format, currency)
  const trendColor = trend && trend >= 0 ? 'text-emerald-400' : 'text-red-400'
  const trendIcon = trend && trend >= 0 ? '↑' : '↓'

  return (
    <div className="p-6 bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl border border-gray-700/50 backdrop-blur">
      <h3 className="text-sm text-gray-400 mb-2">{title}</h3>
      <div className="text-3xl font-bold text-white mb-2">{formattedValue}</div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
          <span>{trendIcon}</span>
          <span>{Math.abs(trend).toFixed(1)}%</span>
          {trendLabel && <span className="text-gray-500 ml-1">{trendLabel}</span>}
        </div>
      )}
    </div>
  )
}

function formatValue(value: number, format: string, currency: string): string {
  if (format === 'currency') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }
  if (format === 'percentage') {
    return `${value.toFixed(1)}%`
  }
  return value.toLocaleString()
}
```

### Step 3: Create CohortRetentionMatrix Component

Create `src/components/analytics/CohortRetentionMatrix.tsx`:

```typescript
import { useMemo } from 'react'
import type { CohortRetentionData } from '@/types/cohort-analytics'

interface CohortRetentionMatrixProps {
  data: CohortRetentionData[]
  loading?: boolean
}

export function CohortRetentionMatrix({ data, loading }: CohortRetentionMatrixProps) {
  // Transform data into matrix format
  const matrix = useMemo(() => {
    const periods = [0, 30, 60, 90]
    return data.map(cohort => ({
      cohort_month: cohort.cohort_month,
      cohort_size: cohort.cohort_size,
      retention: periods.map(day => {
        const period = cohort.periods.find(p => p.period_day === day)
        return period?.retained_percentage ?? 0
      }),
    }))
  }, [data])

  if (loading) {
    return <div className="animate-pulse h-64 bg-gray-800 rounded-lg" />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="p-3 text-left text-gray-400">Cohort</th>
            <th className="p-3 text-center text-gray-400">Size</th>
            <th className="p-3 text-center text-gray-400">D0</th>
            <th className="p-3 text-center text-gray-400">D30</th>
            <th className="p-3 text-center text-gray-400">D60</th>
            <th className="p-3 text-center text-gray-400">D90</th>
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={row.cohort_month} className="border-b border-gray-800 hover:bg-gray-800/30">
              <td className="p-3 text-gray-300">{formatMonth(row.cohort_month)}</td>
              <td className="p-3 text-center text-gray-400">{row.cohort_size}</td>
              {row.retention.map((rate, j) => (
                <td key={j} className="p-3 text-center">
                  <span className={`px-2 py-1 rounded ${getRetentionColor(rate)}`}>
                    {rate.toFixed(0)}%
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function getRetentionColor(rate: number): string {
  if (rate >= 80) return 'bg-emerald-500/20 text-emerald-400'
  if (rate >= 60) return 'bg-blue-500/20 text-blue-400'
  if (rate >= 40) return 'bg-amber-500/20 text-amber-400'
  return 'bg-red-500/20 text-red-400'
}
```

### Step 4: Create RevenueChart Component

Create `src/components/analytics/RevenueChart.tsx`:

```typescript
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface RevenueChartProps {
  data: Array<{ date: string; mrr: number; arr: number; gmv: number }>
  loading?: boolean
}

export function RevenueChart({ data, loading }: RevenueChartProps) {
  if (loading) {
    return <div className="animate-pulse h-64 bg-gray-800 rounded-lg" />
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
          <YAxis stroke="#9CA3AF" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="mrr" stroke="#10B981" strokeWidth={2} name="MRR" />
          <Line type="monotone" dataKey="arr" stroke="#3B82F6" strokeWidth={2} name="ARR" />
          <Line type="monotone" dataKey="gmv" stroke="#8B5CF6" strokeWidth={2} name="GMV" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

### Step 5: Create Main Dashboard Page

Create `src/pages/analytics-dashboard.tsx`:

```typescript
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FilterBar } from '@/components/analytics/FilterBar'
import { MetricCard } from '@/components/analytics/MetricCard'
import { RevenueChart } from '@/components/analytics/RevenueChart'
import { CohortRetentionMatrix } from '@/components/analytics/CohortRetentionMatrix'
import { UsageTrendsByTier } from '@/components/analytics/UsageTrendsByTier'
import { TopConsumersTable } from '@/components/analytics/TopConsumersTable'
import { useRevenue } from '@/hooks/use-revenue-analytics'
import { useCohortRetention } from '@/hooks/use-cohort-retention'
import { useLicenseUsage } from '@/hooks/use-license-usage'

export function AnalyticsDashboard() {
  const { t } = useTranslation('analytics')
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [selectedTiers, setSelectedTiers] = useState<string[]>([])

  const { data: revenueData, loading: revenueLoading } = useRevenue({ days: 30 })
  const { data: cohortData, loading: cohortLoading } = useCohortRetention()
  const { data: usageData, loading: usageLoading } = useLicenseUsage({
    startDate: getDateRangeStart(dateRange),
    endDate: new Date().toISOString(),
    tiers: selectedTiers.length > 0 ? selectedTiers : undefined,
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{t('dashboard.title')}</h1>
        <p className="text-gray-400 mt-1">{t('dashboard.subtitle')}</p>
      </div>

      {/* Filters */}
      <FilterBar
        onDateRangeChange={setDateRange}
        onTierFilterChange={setSelectedTiers}
        onExport={handleExport}
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={t('revenue.mrr_full')}
          value={revenueData?.currentSnapshot.mrr.total ?? 0}
          trend={revenueData?.trend.mrr}
          loading={revenueLoading}
        />
        <MetricCard
          title={t('revenue.arr_full')}
          value={revenueData?.currentSnapshot.arr.total ?? 0}
          trend={revenueData?.trend.arr}
          loading={revenueLoading}
        />
        <MetricCard
          title={t('revenue.gmv_full')}
          value={revenueData?.currentSnapshot.gmv.total ?? 0}
          trend={revenueData?.trend.gmv}
          loading={revenueLoading}
        />
        <MetricCard
          title={t('metrics.active_licenses')}
          value={revenueData?.currentSnapshot.customers.total ?? 0}
          trend={revenueData?.trend.customers}
          format="number"
          loading={revenueLoading}
        />
      </div>

      {/* Revenue Trend Chart */}
      <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700/50">
        <h2 className="text-lg font-semibold text-white mb-4">{t('charts.revenue_trend')}</h2>
        <RevenueChart data={transformRevenueChartData(revenueData)} loading={revenueLoading} />
      </div>

      {/* Cohort Retention Matrix */}
      <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700/50">
        <h2 className="text-lg font-semibold text-white mb-4">{t('charts.cohort_retention')}</h2>
        <CohortRetentionMatrix data={cohortData} loading={cohortLoading} />
      </div>

      {/* Usage Trends by Tier */}
      <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700/50">
        <h2 className="text-lg font-semibold text-white mb-4">{t('charts.usage_trend')}</h2>
        <UsageTrendsByTier data={usageData} loading={usageLoading} />
      </div>

      {/* Top Consumers */}
      <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700/50">
        <h2 className="text-lg font-semibold text-white mb-4">{t('metrics.top_consumers')}</h2>
        <TopConsumersTable limit={10} />
      </div>
    </div>
  )
}

function getDateRangeStart(range: string): string {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

function handleExport() {
  // Implement CSV/PDF export
  console.log('Export analytics data')
}
```

## Todo List

- [ ] Create `FilterBar.tsx` component
- [ ] Create `MetricCard.tsx` component
- [ ] Create `CohortRetentionMatrix.tsx` component
- [ ] Create `RevenueChart.tsx` component
- [ ] Create `UsageTrendsByTier.tsx` component
- [ ] Create `analytics-dashboard.tsx` main page
- [ ] Update i18n files with new keys
- [ ] Add route to dashboard navigation
- [ ] Test responsive design on mobile
- [ ] Add loading skeletons
- [ ] Add error boundaries
- [ ] Implement CSV export functionality

## Success Criteria

- [ ] Dashboard renders all 6 sections correctly
- [ ] Date range filter updates all charts
- [ ] Tier filter filters usage data correctly
- [ ] Cohort matrix shows D0/D30/D60/D90 retention
- [ ] Charts are responsive on mobile
- [ ] Loading states show during fetch
- [ ] Export CSV downloads data

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Charts too slow on large data | Use data sampling, limit points |
| Cohort matrix too wide | Horizontal scroll, sticky first column |
| Mobile layout broken | Test on iPhone SE, iPad breakpoints |

## Next Steps

After dashboard UI is complete:
1. Backfill historical Stripe data to analytics tables
2. Add PDF export with react-pdf
3. Set up cron job for nightly cohort computation
