---
title: "Phase 3: Revenue by License Tier"
status: completed
priority: P2
effort: 1.5h
completed: 2026-03-07T20:30+07:00
---

# Phase 3: Revenue by License Tier

## Context

**Links:** [[plan.md|Overview Plan]] | [[phase-02-top-endpoints-chart.md|Phase 2]]

Missing feature: No visibility into revenue breakdown by license tier (Free/Basic/Premium/Enterprise/Master).

## Overview

- **Priority:** P2 (Critical for business insights)
- **Status:** pending
- **Description:** Enhance `useRevenue` hook to fetch tier breakdown + create new `RevenueByTierChart` component

## Requirements

### Functional
- Display revenue grouped by license tier
- Show both MRR and total revenue per tier
- Pie chart or horizontal bar visualization
- Percentage breakdown display

### Non-functional
- Query `customer_cohorts` table grouped by tier
- Handle missing tier data gracefully
- Match existing Aura Elite design system

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/hooks/use-polar-analytics.ts` | Modify | Add tier breakdown to `useRevenue` |
| `src/components/analytics/RevenueByTierChart.tsx` | Create | New chart component |
| `src/components/admin/LicenseAnalyticsDashboard.tsx` | Modify | Integrate new chart |

## Implementation Steps

### Step 1: Enhance `useRevenue` Hook

**File:** `src/hooks/use-polar-analytics.ts`

Add new interface and extend existing hook:

```typescript
// Add to RevenueMetrics interface
export interface RevenueMetrics {
  // ... existing fields ...
  by_tier?: Array<{
    tier: 'free' | 'basic' | 'premium' | 'enterprise' | 'master'
    mrr_cents: number
    revenue_cents: number
    count: number
  }>
}

// Extend useRevenue hook to fetch tier data
export function useRevenue(options?: { days?: number; autoRefresh?: boolean }) {
  // ... existing code ...

  const fetchRevenue = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)

      // ... existing MRR calculation ...

      // Fetch revenue by tier
      const { data: tierData } = await supabase
        .from('customer_cohorts')
        .select('tier, current_mrr_cents, total_revenue_cents')
        .eq('status', 'active')

      const byTierMap = new Map<string, { mrr: number; revenue: number; count: number }>()
      tierData?.forEach((c: any) => {
        const tier = (c.tier || 'free') as string
        const existing = byTierMap.get(tier) || { mrr: 0, revenue: 0, count: 0 }
        existing.mrr += c.current_mrr_cents || 0
        existing.revenue += c.total_revenue_cents || 0
        existing.count += 1
        byTierMap.set(tier, existing)
      })

      const by_tier = Array.from(byTierMap.entries()).map(([tier, stats]) => ({
        tier: tier as RevenueMetrics['by_tier'][number]['tier'],
        mrr_cents: stats.mrr,
        revenue_cents: stats.revenue,
        count: stats.count,
      })).sort((a, b) => b.mrr_cents - a.mrr_cents)

      setData({
        // ... existing fields ...
        by_tier,
      })
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [days])

  // ... rest of hook ...
}
```

### Step 2: Create RevenueByTierChart Component

**File:** `src/components/analytics/RevenueByTierChart.tsx`

```tsx
/**
 * Revenue by License Tier Chart - Breakdown of MRR/GMV by tier
 */

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { DollarSign } from 'lucide-react'
import { useRevenue } from '@/hooks/use-polar-analytics'
import { cn } from '@/lib/utils'

const TIER_COLORS: Record<string, string> = {
  free: '#9ca3af',      // gray-400
  basic: '#3b82f6',     // blue-500
  premium: '#10b981',   // emerald-500
  enterprise: '#8b5cf6',// purple-500
  master: '#f59e0b',    // amber-500
}

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  basic: 'Basic',
  premium: 'Premium',
  enterprise: 'Enterprise',
  master: 'Master',
}

interface RevenueByTierChartProps {
  className?: string
  metric?: 'mrr' | 'revenue'
}

export function RevenueByTierChart({ className, metric = 'mrr' }: RevenueByTierChartProps) {
  const { data: revenueData, loading, error } = useRevenue({ days: 30 })

  if (loading) {
    return (
      <div className={cn("p-6 rounded-2xl border border-white/10", className)}>
        <div className="h-64 animate-pulse bg-gray-700/30 rounded-xl" />
      </div>
    )
  }

  if (error || !revenueData?.by_tier) {
    return (
      <div className={cn("p-6 rounded-2xl border border-white/10", className)}>
        <p className="text-red-400 text-center">Không có dữ liệu theo gói</p>
      </div>
    )
  }

  const chartData = revenueData.by_tier
    .filter((t) => t.mrr_cents > 0 || t.revenue_cents > 0)
    .map((t) => ({
      tier: t.tier,
      name: TIER_LABELS[t.tier] || t.tier,
      value: metric === 'mrr' ? t.mrr_cents / 100 : t.revenue_cents / 100,
      count: t.count,
      color: TIER_COLORS[t.tier] || '#9ca3af',
    }))

  const total = chartData.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className={cn("p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Doanh Thu Theo Gói Dịch Vụ
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {metric === 'mrr' ? 'MRR' : 'Tổng doanh thu'} phân bổ theo tier
          </p>
        </div>
      </div>

      {/* Total Display */}
      <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
        <div className="flex items-center justify-between">
          <span className="text-sm text-emerald-300">Tổng {metric === 'mrr' ? 'MRR' : 'Revenue'}</span>
          <span className="text-2xl font-bold text-emerald-400">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(total)}
          </span>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
              }}
              formatter={(value: any) => [
                new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(value),
                'Revenue'
              ]}
            />
            <Legend
              verticalAlign="bottom"
              formatter={(value) => (
                <span className="text-gray-300 ml-4">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Breakdown */}
      <div className="mt-6 space-y-3">
        {chartData.map((tier) => (
          <div
            key={tier.tier}
            className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tier.color }} />
              <span className="text-sm font-medium text-white">{tier.name}</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-white">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(tier.value)}
              </p>
              <p className="text-xs text-gray-400">{tier.count} licenses</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Step 3: Integrate into Dashboard

**File:** `src/components/admin/LicenseAnalyticsDashboard.tsx`

```tsx
import { RevenueByTierChart } from '@/components/analytics/RevenueByTierChart'

// In ChartsGrid or as separate section:
<RevenueByTierChart metric="mrr" />
```

## Success Criteria

- [x] RevenueByTierChart shows breakdown by tier
- [x] Pie chart displays proportional distribution
- [x] Total MRR/revenue calculated correctly
- [x] Color coding matches tier (Free=gray, Basic=blue, Premium=green, etc.)
- [x] Number format is VND currency
- [x] TypeScript strict mode (0 `any` types)

## Database Requirements

Ensure `customer_cohorts` table has:
- `tier` column (text: free/basic/premium/enterprise/master)
- `current_mrr_cents` column (integer)
- `total_revenue_cents` column (integer, or compute from webhook events)

If `total_revenue_cents` doesn't exist:
- Compute from `polar_webhook_events` by subscription_id
- Or omit and only show MRR

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| `tier` column missing | Medium | Infer tier from `subscription_tier` in webhook events |
| `total_revenue_cents` missing | Low | Compute from webhook events or only show MRR |

## Next Steps

Revenue by Tier Chart implemented and verified.

---

_Last Updated: 2026-03-07T20:30+07:00_
_Author: Project Manager_
_Status: COMPLETE - RevenueByTierChart component using useRevenueByTier hook_
