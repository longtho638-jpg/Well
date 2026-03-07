---
title: "Phase 6: Replace Mock Tier Distribution Data"
status: completed
priority: P1
effort: 1h
completed: 2026-03-07T21:15+07:00
---

```tsx
const tierDistributionData = useMemo(() => {
  if (!revenueData) return []
  return [
    { name: 'Free', value: 100 },
    { name: 'Basic', value: 80 },
    { name: 'Premium', value: 50 },
    { name: 'Enterprise', value: 15 },
    { name: 'Master', value: 5 }
  ]
}, [revenueData])
```

## Overview

- **Priority:** P1 (Critical - mock data is misleading)
- **Status:** completed
- **Description:** Replace mock data with real Supabase query for tier distribution
- **Completed:** 2026-03-07T21:15+07:00
- **Note:** `TierDistributionChart` now uses data from `tierData` via `useRevenueByTier` hook

## Requirements

### Functional
- Query `customer_cohorts` table grouped by tier
- Count active licenses per tier
- Display actual distribution percentages
- Update when date range changes

### Non-functional
- Reuse existing `useRevenue` hook (already has `by_tier` from Phase 3)
- Handle empty states gracefully
- Match pie chart style with existing design

## Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/admin/LicenseAnalyticsDashboard.tsx` | Modify | Remove mock data, use real data |
| `src/components/analytics/RevenueByTierChart.tsx` | Reuse | Can use same data source |

## Implementation Steps

### Step 1: Remove Mock Data

**File:** `src/components/admin/LicenseAnalyticsDashboard.tsx`

Remove the hardcoded `tierDistributionData` useMemo:

```tsx
// REMOVE THIS ENTIRE BLOCK:
// const tierDistributionData = useMemo(() => {
//   if (!revenueData) return []
//   return [{ name: 'Free', value: 100 }, ...]
// }, [revenueData])
```

### Step 2: Create Real Tier Distribution Data

**File:** `src/components/admin/LicenseAnalyticsDashboard.tsx`

Replace with real data from `useRevenue` hook:

```tsx
// Real tier distribution from revenue data
const tierDistributionData = useMemo(() => {
  if (!revenueData?.by_tier) return []

  return revenueData.by_tier
    .filter((t) => t.count > 0)
    .map((t) => ({
      tier: t.tier,
      name: t.tier.charAt(0).toUpperCase() + t.tier.slice(1),
      value: t.count,
      mrr: t.mrr_cents / 100,
      revenue: t.revenue_cents / 100,
    }))
}, [revenueData])
```

### Step 3: Update TierDistributionChart

**File:** `src/components/admin/LicenseAnalyticsDashboard.tsx`

Update the chart component to use real tier names:

```tsx
function TierDistributionChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
        <p className="text-gray-400 text-center py-12">Không có dữ liệu phân bố gói</p>
      </div>
    )
  }

  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
      <h3 className="text-lg font-semibold text-white mb-4">Phân Bố Gói Dịch Vụ</h3>
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
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
              }}
              formatter={(value: any, name: string) => {
                if (name === 'value') {
                  return [`${value} licenses`, 'Số lượng']
                }
                return [value, name]
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with counts */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.map((tier) => (
          <div
            key={tier.tier}
            className="flex items-center justify-between p-2 bg-gray-800/30 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: COLORS[data.indexOf(tier) % COLORS.length]
                }}
              />
              <span className="text-sm text-gray-300">{tier.name}</span>
            </div>
            <span className="text-sm font-semibold text-white">{tier.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Step 4: Add Fallback for Missing Data

If `by_tier` is not available in `useRevenue`, add a fallback query:

```tsx
// Fallback: Direct query for tier counts
const { data: tierCounts } = useSupabaseQuery(async () => {
  const { data } = await supabase
    .from('customer_cohorts')
    .select('tier')
    .eq('status', 'active')

  const counts = new Map<string, number>()
  data?.forEach((c) => {
    const tier = c.tier || 'free'
    counts.set(tier, (counts.get(tier) || 0) + 1)
  })

  return Array.from(counts.entries()).map(([tier, count]) => ({
    tier,
    name: tier.charAt(0).toUpperCase() + tier.slice(1),
    value: count,
  }))
})
```

## Success Criteria

- [x] TierDistributionChart shows real data from DB
- [x] Percentages calculated correctly
- [x] License counts displayed in legend
- [x] Empty state handles no data
- [x] Updates when revenue data refreshes
- [x] No TypeScript errors

## Database Requirements

Ensure `customer_cohorts` table has:
- `tier` column (text)
- `status` column (active/churned)

Query pattern:
```sql
SELECT tier, COUNT(*) as count
FROM customer_cohorts
WHERE status = 'active'
GROUP BY tier
ORDER BY count DESC
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| `by_tier` not in useRevenue | Medium | Add direct query fallback |
| Tier names inconsistent | Low | Normalize with `toLowerCase()` before grouping |
| Churned licenses included | Medium | Filter by `status = 'active'` |

## Next Steps

---

_Last Updated: 2026-03-07T21:15+07:00_
_Author: Project Manager_
_Status: COMPLETE - Real tier data now used from DB via useRevenueByTier hook_
