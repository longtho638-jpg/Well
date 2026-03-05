---
title: "Phase 4: Add useMemo for Expensive Computations"
status: pending
priority: P3
effort: 45min
---

# Phase 4: Add useMemo Optimization

## Context
- useMemo: chỉ 5 occurrences (quá ít)
- useCallback: 177 occurrences (nhiều, có thể optimize)
- Need to identify expensive computations

## Files to Analyze

1. Dashboard components (chart data processing)
2. Pricing tables (tier calculations)
3. Filter/sort operations
4. Derived state from props

## Implementation Steps

1. **Identify candidates**
   ```bash
   # Find array operations without useMemo
   grep -rn "\.map\|\.filter\|\.reduce" src/pages/dashboard/ | head -20
   ```

2. **Pattern to optimize**

### Chart Data Processing
```tsx
// ❌ Before
const processedData = data.map(item => ({
  ...item,
  value: item.raw * multiplier
}));

// ✅ After
const processedData = useMemo(() =>
  data.map(item => ({
    ...item,
    value: item.raw * multiplier
  })),
  [data, multiplier]
);
```

### Filter/Sort Operations
```tsx
// ❌ Before
const filtered = tiers.filter(t => t.available);
const sorted = filtered.sort((a, b) => b.price - a.price);

// ✅ After
const tiersData = useMemo(() =>
  tiers
    .filter(t => t.available)
    .sort((a, b) => b.price - a.price),
  [tiers]
);
```

3. **Apply to these locations**
   - `src/pages/dashboard/DashboardHome.tsx` - chart data
   - `src/pages/pricing/PricingPage.tsx` - tier filtering
   - `src/components/tables/*` - data transformations

4. **Verify no regressions**
   ```bash
   pnpm test
   pnpm build
   ```

## Success Criteria
- [ ] 10+ useMemo additions for expensive ops
- [ ] No console errors
- [ ] All tests pass
- [ ] UI responsiveness improved

## Dependencies
Must complete Phase 1 & 2 first to ensure clean baseline.
