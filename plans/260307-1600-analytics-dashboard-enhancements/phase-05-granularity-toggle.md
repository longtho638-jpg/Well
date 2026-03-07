---
title: "Phase 5: Time Granularity Toggle"
status: completed
priority: P2
effort: 1h
completed: 2026-03-07T21:00+07:00
---

# Phase 5: Day/Week/Month Granularity Toggle

## Context

**Links:** [[plan.md|Overview Plan]] | [[phase-04-realtime-polling.md|Phase 4]]

Missing feature: Usage trends chart shows daily data only, no option to view weekly or monthly aggregates.

## Overview

- **Priority:** P2 (Important for trend analysis)
- **Status:** pending
- **Description:** Add granularity selector (Day/Week/Month) to UsageTrendsChart

## Requirements

### Functional
- Toggle between daily, weekly, monthly views
- Aggregate data based on selected granularity
- Update x-axis labels appropriately
- Preserve feature toggle functionality

### Non-functional
- Recharts-compatible data transformation
- Vietnamese locale for date labels
- Match existing Aura Elite design

## Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/analytics/UsageTrendsChart.tsx` | Modify | Add granularity state + aggregation logic |
| `src/components/admin/LicenseAnalyticsDashboard.tsx` | Modify | Pass dateRange to UsageTrendsChart |

## Implementation Steps

### Step 1: Add Granularity State

**File:** `src/components/analytics/UsageTrendsChart.tsx`

Add granularity selector to component:

```tsx
import { useState } from 'react'

interface UsageTrendsChartProps {
  data: Array<{
    period_start: string
    feature: string
    total_quantity: number
    event_count: number
  }>
  className?: string
}

type Granularity = 'day' | 'week' | 'month'

export function UsageTrendsChart({ data, className }: UsageTrendsChartProps) {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['api_call', 'tokens'])
  const [granularity, setGranularity] = useState<Granularity>('day')

  // ... existing code ...
}
```

### Step 2: Add Granularity Toggle UI

**File:** `src/components/analytics/UsageTrendsChart.tsx`

Add toggle to header:

```tsx
<div className="flex items-center justify-between mb-6">
  <h3 className="text-lg font-semibold text-white">Xu hướng sử dụng</h3>

  <div className="flex items-center gap-2">
    {/* Granularity Toggle */}
    <div className="flex bg-gray-800/50 rounded-lg p-1 border border-white/10">
      {(['day', 'week', 'month'] as const).map((g) => (
        <button
          key={g}
          onClick={() => setGranularity(g)}
          className={cn(
            'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
            granularity === g
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'text-gray-400 hover:text-white border border-transparent'
          )}
        >
          {g === 'day' ? 'Ngày' : g === 'week' ? 'Tuần' : 'Tháng'}
        </button>
      ))}
    </div>

    {/* Feature Toggle (existing) */}
    <div className="flex gap-2">
      {/* ... existing feature toggles ... */}
    </div>
  </div>
</div>
```

### Step 3: Aggregate Data by Granularity

**File:** `src/components/analytics/UsageTrendsChart.tsx`

Add aggregation logic:

```tsx
// Transform data for chart with granularity support
const chartData = useMemo(() => {
  const grouped = new Map<string, Record<string, number>>()

  data.forEach((item) => {
    const date = new Date(item.period_start)
    let key: string

    // Group by granularity
    if (granularity === 'day') {
      key = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
    } else if (granularity === 'week') {
      // ISO week number
      const weekNum = Math.ceil(date.getDate() / 7)
      const month = date.toLocaleDateString('vi-VN', { month: 'short' })
      key = `T${weekNum} ${month}`
    } else {
      // Month
      key = date.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' })
    }

    if (!grouped.has(key)) {
      grouped.set(key, {})
    }

    const existing = grouped.get(key)!
    existing[item.feature] = (existing[item.feature] || 0) + item.total_quantity
  })

  return Array.from(grouped.entries()).map(([date, features]) => ({
    date,
    ...features,
  }))
}, [data, granularity])
```

### Step 4: Update X-Axis Labels

Adjust x-axis label size based on granularity:

```tsx
<XAxis
  dataKey="date"
  stroke="#9ca3af"
  fontSize={granularity === 'day' ? 10 : 12}
  tickLine={false}
  axisLine={false}
  angle={granularity === 'day' ? -45 : 0}
  textAnchor={granularity === 'day' ? 'end' : 'middle'}
  interval={granularity === 'day' ? 'preserveStartEnd' : 0}
/>
```

### Step 5: Pass Data from Dashboard

**File:** `src/components/admin/LicenseAnalyticsDashboard.tsx`

Ensure `UsageTrendsChart` receives proper data:

```tsx
// If UsageTrendsChart is used, pass dateRange for filtering
<UsageTrendsChart
  data={usageData}
  dateRange={dateRange}
/>
```

## Success Criteria

- [x] Day/Week/Month toggle buttons visible
- [x] Selecting granularity updates chart data
- [x] Weekly aggregation groups by ISO week
- [x] Monthly aggregation shows month labels
- [x] Daily view shows dd/mm labels
- [x] Feature toggles still work
- [x] X-axis labels readable at all granularities

## Data Transformation Reference

| Granularity | Label Format | Example |
|-------------|--------------|---------|
| Day | `dd/mm` | "07/03" |
| Week | `T{n} {month}` | "T1 Th3" |
| Month | `{month} {yy}` | "Th3/26" |

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Weekly aggregation off-by-one | Low | Use ISO week standard or simple date/7 |
| Too many daily points | Low | Recharts handles ~30 points well |
| X-axis label overlap (daily) | Low | Use angled labels + `preserveStartEnd` |

## Next Steps

Granularity toggle implemented in UsageTrendsChart.

---

_Last Updated: 2026-03-07T21:00+07:00_
_Author: Project Manager_
_Status: COMPLETE - Day/Week/Month toggle with aggregation logic_
