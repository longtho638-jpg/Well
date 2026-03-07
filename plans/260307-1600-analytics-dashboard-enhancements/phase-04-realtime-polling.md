---
title: "Phase 4: Real-time Active Licenses"
status: completed
priority: P2
effort: 1h
completed: 2026-03-07T20:45+07:00
---

# Phase 4: Real-time Active Licenses Polling

## Context

**Links:** [[plan.md|Overview Plan]] | [[phase-03-revenue-by-tier.md|Phase 3]]

Missing feature: License data only loads once, doesn't reflect real-time changes in active licenses.

## Overview

- **Priority:** P2 (Important for live monitoring)
- **Status:** pending
- **Description:** Add polling mechanism to refresh active licenses data every 30 seconds

## Requirements

### Functional
- Auto-refresh license data every 30 seconds
- Show "Last updated" timestamp
- Pause polling when component unmounts
- Manual refresh button

### Non-functional
- Use `useCallback` and `useEffect` for clean polling
- Cleanup interval on unmount
- Visual indicator during refresh

## Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/hooks/use-polar-analytics.ts` | Modify | Add `autoRefresh` option to relevant hooks |
| `src/components/admin/LicenseAnalyticsDashboard.tsx` | Modify | Add polling + manual refresh UI |

## Implementation Steps

### Step 1: Extend Hooks with Auto-Refresh

**File:** `src/hooks/use-polar-analytics.ts`

The `useRevenue` hook already has `autoRefresh` option. Extend `useLicenseUsage` similarly:

```typescript
export function useLicenseUsage(options?: {
  licenseId?: string
  days?: number
  autoRefresh?: boolean
}) {
  const [data, setData] = useState<LicenseUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const licenseId = options?.licenseId
  const days = options?.days || 30
  const autoRefresh = options?.autoRefresh || false

  const fetchUsage = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('license_usage_aggregations')
        .select('*')
        .gte('aggregation_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('aggregation_date', { ascending: false })
      if (licenseId) query = query.eq('license_id', licenseId)
      const { data: usageData } = await query
      // ... rest of existing logic ...
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [licenseId, days])

  useEffect(() => {
    fetchUsage()
    if (autoRefresh) {
      const interval = setInterval(fetchUsage, 30000) // 30 seconds
      return () => clearInterval(interval)
    }
    return undefined
  }, [fetchUsage, autoRefresh])

  return { data, loading, error, refresh: fetchUsage }
}
```

### Step 2: Add Polling to Dashboard

**File:** `src/components/admin/LicenseAnalyticsDashboard.tsx`

Modify the component to enable auto-refresh and add manual refresh:

```tsx
import { RefreshCw } from 'lucide-react'

export function LicenseAnalyticsDashboard({ className }: { className?: string }) {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90

  // Enable auto-refresh for all hooks
  const { data: revenueData, loading: revenueLoading, refresh: refreshRevenue } = polarAnalytics.useRevenue({ days, autoRefresh: true })
  const { data: cohortData, loading: cohortLoading } = polarAnalytics.useCohortRetention({ months: 6 })
  const { data: usageData, loading: usageLoading, refresh: refreshUsage } = polarAnalytics.useLicenseUsage({ days, autoRefresh: true })

  // Manual refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([refreshRevenue(), refreshUsage()])
    setIsRefreshing(false)
  }

  // Last updated timestamp
  const lastUpdated = new Date().toLocaleTimeString('vi-VN')

  if (revenueLoading || cohortLoading || usageLoading) {
    return (<div className="space-y-6 animate-pulse">...</div>)
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Phân Tích Giấy Phép</h2>
          <p className="text-xs text-gray-400 mt-1">Cập nhật: {lastUpdated}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={cn(
              "p-2 rounded-lg border border-white/10 bg-gray-800/50 text-gray-400 hover:text-white transition-all",
              isRefreshing && "animate-spin"
            )}
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {(['7d', '30d', '90d'] as const).map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                dateRange === range
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-white border border-transparent'
              )}
            >
              {range === '7d' ? '7 ngày' : range === '30d' ? '30 ngày' : '90 ngày'}
            </button>
          ))}
        </div>
      </div>

      {/* Rest of dashboard... */}
    </div>
  )
}
```

### Step 3: Add Visual Refresh Indicator

Add a subtle loading overlay during refresh:

```tsx
<div className={cn('relative', isRefreshing && 'opacity-75')}>
  {/* All dashboard content */}
  <StatisticsSection revenueData={revenueData} />
  <ConversionFunnelChart />
  {/* ... */}

  {/* Refresh Overlay */}
  {isRefreshing && (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/10">
        <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
        <p className="text-sm text-gray-300 mt-2">Đang cập nhật...</p>
      </div>
    </div>
  )}
</div>
```

## Success Criteria

- [x] Data auto-refreshes every 30 seconds
- [x] Manual refresh button works
- [x] "Last updated" timestamp shows
- [x] Refresh indicator spins during update
- [x] Interval cleans up on unmount
- [x] No memory leaks

## Performance Considerations

| Concern | Mitigation |
|---------|------------|
| Frequent Supabase queries | 30s interval is reasonable for dashboard |
| Multiple simultaneous refreshes | Use `Promise.all` to batch refresh |
| Stale data during navigation | React unmount cleanup handles this |

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Polling causes rate limits | Low | 30s interval = 120 req/hour, well within limits |
| Memory leak from interval | Low | Cleanup in `useEffect` return |

## Next Steps

Real-time polling implemented with 30s auto-refresh and manual refresh button.

---

_Last Updated: 2026-03-07T20:45+07:00_
_Author: Project Manager_
_Status: COMPLETE - Auto-refresh via useCallback + useEffect with interval cleanup_
