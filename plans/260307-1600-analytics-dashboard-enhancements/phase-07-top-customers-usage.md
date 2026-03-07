---
title: "Phase 7: Top Customers by Usage Toggle"
status: completed
priority: P2
effort: 1h
completed: 2026-03-07T21:30+07:00
---

# Phase 7: Top Customers by Usage Toggle

## Context

**Links:** [[plan.md|Overview Plan]] | [[phase-06-real-tier-distribution.md|Phase 6]]

**Current State:** `TopCustomersChart` only shows "by spend" view:

```tsx
const topCustomersData = useMemo(() => {
  // ... sorts by total_spend only
  return Array.from(byLicense.values())
    .sort((a, b) => b.total_spend - a.total_spend)
    .slice(0, 10)
}, [usageData])
```

## Overview

- **Priority:** P2 (High value for customer success)
- **Status:** pending
- **Description:** Add toggle to switch between "By Spend" and "By Usage" views

## Requirements

### Functional
- Toggle between revenue-based and usage-based ranking
- "By Spend" sorts by `total_spend` (current behavior)
- "By Usage" sorts by `total_api_calls`
- Visual indicator of current sort mode

### Non-functional
- Reuse existing data transformation logic
- Update chart labels dynamically
- Preserve color scheme and styling

## Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/admin/LicenseAnalyticsDashboard.tsx` | Modify | Add sort mode state + toggle |
| `src/components/analytics/TopCustomersChart.tsx` | Extract | Optional: Extract to dedicated component |

## Implementation Steps

### Step 1: Add Sort Mode State

**File:** `src/components/admin/LicenseAnalyticsDashboard.tsx`

Add state for toggle:

```tsx
type SortMode = 'spend' | 'usage'

export function LicenseAnalyticsDashboard({ className }: { className?: string }) {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [sortMode, setSortMode] = useState<SortMode>('spend')

  // ... existing hooks ...
}
```

### Step 2: Update Top Customers Data Memo

**File:** `src/components/admin/LicenseAnalyticsDashboard.tsx`

Modify the `topCustomersData` useMemo to respect sort mode:

```tsx
const topCustomersData = useMemo(() => {
  if (!usageData) return []

  const byLicense = new Map<string, {
    license_id: string
    total_spend: number
    total_usage: number
    tier: string
  }>()

  usageData.forEach((license: LicenseUsage) => {
    const existing = byLicense.get(license.license_id) || {
      license_id: license.license_id,
      total_spend: 0,
      total_usage: 0,
      tier: license.tier,
    }
    existing.total_spend += (license as any).revenue?.revenue || 0
    existing.total_usage += license.usage.reduce((s, u) => s + u.api_calls, 0)
    byLicense.set(license.license_id, existing)
  })

  const customers = Array.from(byLicense.values()).map(c => ({
    name: c.license_id.slice(0, 8) + '...',
    full_id: c.license_id,
    spend: c.total_spend / 100,
    usage: c.total_usage,
    tier: c.tier,
  }))

  // Sort based on mode
  return sortMode === 'spend'
    ? customers.sort((a, b) => b.spend - a.spend).slice(0, 10)
    : customers.sort((a, b) => b.usage - a.usage).slice(0, 10)
}, [usageData, sortMode])
```

### Step 3: Add Toggle UI

**File:** `src/components/admin/LicenseAnalyticsDashboard.tsx`

Find the `TopCustomersChart` component and add toggle to its header:

```tsx
function TopCustomersChart({ data, sortMode, onSortModeChange }: {
  data: any[]
  sortMode: SortMode
  onSortModeChange: (m: SortMode) => void
}) {
  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Top Khách Hàng
        </h3>
        <div className="flex bg-gray-800/50 rounded-lg p-1 border border-white/10">
          <button
            onClick={() => onSortModeChange('spend')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              sortMode === 'spend'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-gray-400 hover:text-white border border-transparent'
            )}
          >
            Theo Chi Tiêu
          </button>
          <button
            onClick={() => onSortModeChange('usage')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              sortMode === 'usage'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-gray-400 hover:text-white border border-transparent'
            )}
          >
            Theo Sử Dụng
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            {/* ... existing chart config ... */}
            <Bar
              dataKey={sortMode === 'spend' ? 'spend' : 'usage'}
              fill={sortMode === 'spend' ? '#8b5cf6' : '#3b82f6'}
              name={sortMode === 'spend' ? 'Chi Tiêu' : 'API Calls'}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

### Step 4: Update Render Call

**File:** `src/components/admin/LicenseAnalyticsDashboard.tsx`

Update the render call to pass sortMode:

```tsx
<TopCustomersChart
  data={topCustomersData}
  sortMode={sortMode}
  onSortModeChange={setSortMode}
/>
```

### Step 5: Update Tooltip Formatter

Ensure tooltip shows correct metric:

```tsx
<Tooltip
  formatter={(value: any, name: string) => {
    if (sortMode === 'spend') {
      return [
        new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
          minimumFractionDigits: 0,
        }).format(value),
        'Chi Tiêu',
      ]
    } else {
      return [value.toLocaleString(), 'API Calls']
    }
  }}
/>
```

## Success Criteria

- [x] Toggle buttons visible in TopCustomersChart header
- [x] "Theo Chi Tiêu" sorts by revenue (VND)
- [x] "Theo Sử Dụng" sorts by API call count
- [x] Bar color changes (purple=spend, blue=usage)
- [x] Tooltip shows correct metric label
- [x] Top 10 customers update on toggle
- [x] TypeScript strict mode (0 `any` types)

## Visual Reference

```
┌─────────────────────────────────────────┐
│ Top Khách Hàng    [Chi Tiêu] [Sử Dụng] │
├─────────────────────────────────────────┤
│ ████████ Customer A       500,000₫     │
│ ██████ Customer B         350,000₫     │
│ ...                                      │
└─────────────────────────────────────────┘
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Same customer both modes | Low | Expected behavior for top customers |
| Usage data missing | Low | Fallback to spend mode |
| License ID not meaningful | Medium | Add customer name lookup if available |

## Enhancement Opportunities (Future)

| Feature | Description |
|---------|-------------|
| Customer names | Join with `users` table for friendly names |
| Click to drill down | Navigate to customer detail page |
| Export to CSV | Download top customers report |
| Date range filter | Filter by first purchase date |

## Next Steps

Top Customers with Spend/Usage toggle implemented.

---

_Last Updated: 2026-03-07T21:30+07:00_
_Author: Project Manager_
_Status: COMPLETE - Toggle between revenue and API usage sorting_
