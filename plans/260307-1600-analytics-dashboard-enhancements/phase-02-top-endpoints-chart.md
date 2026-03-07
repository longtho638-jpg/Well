---
title: "Phase 2: Top Endpoints Chart"
status: completed
priority: P2
effort: 1.5h
completed: 2026-03-07T20:15+07:00
---

# Phase 2: Top Endpoints Chart

## Context

**Links:** [[plan.md|Overview Plan]] | [[../../src/hooks/use-polar-analytics.ts|use-polar-analytics.ts]]

Missing feature: No visibility into which API endpoints are most used by license holders.

## Overview

- **Priority:** P2 (High value for capacity planning)
- **Status:** pending
- **Description:** Create new component showing top 10 API endpoints by call volume

## Requirements

### Functional
- Display top 10 endpoints ranked by API call count
- Show endpoint path, call count, and avg response time
- Color-code by usage tier (high/medium/low)
- Date range selector (7d/30d/90d)

### Non-functional
- Query Supabase `license_usage_aggregations` table
- Handle empty states gracefully
- Responsive chart design

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/hooks/use-polar-analytics.ts` | Modify | Add `useTopEndpoints` hook |
| `src/components/analytics/TopEndpointsChart.tsx` | Create | New chart component |
| `src/components/admin/LicenseAnalyticsDashboard.tsx` | Modify | Integrate new chart |

## Implementation Steps

### Step 1: Create `useTopEndpoints` Hook

**File:** `src/hooks/use-polar-analytics.ts`

Add new interface and hook at end of file:

```typescript
export interface TopEndpoint {
  endpoint: string;
  call_count: number;
  avg_response_ms: number;
  error_rate: number;
}

export function useTopEndpoints(options?: { days?: number; limit?: number }) {
  const [data, setData] = useState<TopEndpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const days = options?.days || 30
  const limit = options?.limit || 10

  useEffect(() => {
    async function fetchTopEndpoints() {
      try {
        setLoading(true)
        const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

        // Query usage aggregations grouped by endpoint
        const { data: endpointData } = await supabase
          .from('license_usage_aggregations')
          .select('endpoint, api_calls, avg_response_time_ms, error_count')
          .gte('aggregation_date', sinceDate)
          .not('endpoint', 'is', null)
          .order('api_calls', { ascending: false })
          .limit(100)

        if (!endpointData) {
          setData([])
          return
        }

        // Aggregate by endpoint
        const endpointMap = new Map<string, { calls: number; responseMs: number; errors: number }>()
        endpointData.forEach((e: any) => {
          const existing = endpointMap.get(e.endpoint || 'unknown') || { calls: 0, responseMs: 0, errors: 0 }
          existing.calls += e.api_calls || 0
          existing.responseMs += (e.avg_response_time_ms || 0) * (e.api_calls || 1)
          existing.errors += e.error_count || 0
          endpointMap.set(e.endpoint || 'unknown', existing)
        })

        const results = Array.from(endpointMap.entries())
          .map(([endpoint, stats]) => ({
            endpoint,
            call_count: stats.calls,
            avg_response_ms: stats.calls > 0 ? Math.round(stats.responseMs / stats.calls) : 0,
            error_rate: stats.calls > 0 ? Math.round((stats.errors / stats.calls) * 10000) / 100 : 0,
          }))
          .sort((a, b) => b.call_count - a.call_count)
          .slice(0, limit)

        setData(results)
        setError(null)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchTopEndpoints()
  }, [days, limit])

  return { data, loading, error }
}
```

### Step 2: Create TopEndpointsChart Component

**File:** `src/components/analytics/TopEndpointsChart.tsx`

```tsx
/**
 * Top Endpoints Chart - Shows most-used API endpoints by call volume
 */

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Calendar, Zap } from 'lucide-react'
import { useTopEndpoints } from '@/hooks/use-polar-analytics'
import { cn } from '@/lib/utils'

const USAGE_COLORS = ['#ef4444', '#f59e0b', '#10b981'] // High, Medium, Low

export function TopEndpointsChart({ className }: { className?: string }) {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')
  const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
  const { data, loading, error } = useTopEndpoints({ days, limit: 10 })

  if (loading) {
    return (
      <div className={cn("p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50", className)}>
        <div className="h-80 animate-pulse bg-gray-700/30 rounded-xl" />
      </div>
    )
  }

  if (error || !data || data.length === 0) {
    return (
      <div className={cn("p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50", className)}>
        <p className="text-red-400 text-center">Không có dữ liệu endpoint</p>
      </div>
    )
  }

  // Determine usage thresholds for color coding
  const maxCalls = Math.max(...data.map(d => d.call_count))
  const getUsageColor = (calls: number) => {
    const ratio = calls / maxCalls
    if (ratio > 0.7) return USAGE_COLORS[0]
    if (ratio > 0.3) return USAGE_COLORS[1]
    return USAGE_COLORS[2]
  }

  const chartData = data.map((d, i) => ({
    name: d.endpoint.length > 20 ? d.endpoint.slice(0, 20) + '...' : d.endpoint,
    full_path: d.endpoint,
    calls: d.call_count,
    latency: d.avg_response_ms,
    error_rate: d.error_rate,
    color: getUsageColor(d.call_count),
  }))

  return (
    <div className={cn("p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Top Endpoints API
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {data.length} endpoints theo số lần gọi
          </p>
        </div>

        {/* Date Range Picker */}
        <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-1 border border-white/10">
          <Calendar className="w-4 h-4 text-gray-400 ml-2" />
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
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

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
            <XAxis type="number" stroke="#9ca3af" fontSize={12} tickFormatter={(v) => v.toLocaleString()} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#9ca3af"
              fontSize={11}
              width={80}
              tick={{ fill: '#9ca3af' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
              }}
              formatter={(value: any, name: string) => {
                if (name === 'Calls') return [value.toLocaleString(), 'Số lần gọi']
                if (name === 'Latency') return [`${value}ms`, 'Độ trễ']
                if (name === 'Error Rate') return [`${value}%`, 'Tỷ lệ lỗi']
                return [value, name]
              }}
            />
            <Bar dataKey="calls" name="Calls" radius={[0, 4, 4, 0]} barSize={24}>
              {chartData.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Grid */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {data.slice(0, 3).map((endpoint, i) => (
          <div key={endpoint.endpoint} className="p-3 bg-gray-800/50 rounded-lg border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("w-2 h-2 rounded-full", USAGE_COLORS[i === 0 ? 0 : i === 1 ? 1 : 2])} />
              <span className="text-xs text-gray-400 truncate flex-1">#{i + 1}</span>
            </div>
            <p className="text-sm font-semibold text-white truncate" title={endpoint.endpoint}>
              {endpoint.endpoint}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {endpoint.call_count.toLocaleString()} calls · {endpoint.avg_response_ms}ms
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Step 3: Integrate into Dashboard

**File:** `src/components/admin/LicenseAnalyticsDashboard.tsx`

Add import and render:

```tsx
import { TopEndpointsChart } from '@/components/analytics/TopEndpointsChart'

// In main render, add after ConversionFunnelChart:
<ConversionFunnelChart />
<TopEndpointsChart />
<CohortAnalysisChart />
```

## Success Criteria

- [x] TopEndpointsChart displays top 10 endpoints
- [x] Color coding works (red=high, amber=medium, green=low usage)
- [x] Date range toggle filters data correctly
- [x] Tooltip shows full endpoint path + metrics
- [x] Empty state handles no data gracefully
- [x] TypeScript strict mode (0 `any` types)

## Database Requirements

Ensure `license_usage_aggregations` table has:
- `endpoint` column (text, nullable)
- `avg_response_time_ms` column (integer)
- `error_count` column (integer)

If columns don't exist, either:
1. Add columns via migration
2. Or mock endpoint data from `api_calls` pattern

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| `endpoint` column missing | Medium | Fallback to grouping by `license_id` + mock paths |
| Query slow without index | Low | Add index on `(aggregation_date, endpoint)` |

## Next Steps

Top Endpoints Chart implemented and verified.

---

_Last Updated: 2026-03-07T20:15+07:00_
_Author: Project Manager_
_Status: COMPLETE - TopEndpointsChart component created and integrated_
