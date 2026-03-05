---
title: "Phase 2: Optimize Recharts Imports (Tree-shaking)"
status: pending
priority: P2
effort: 30min
---

# Phase 2: Optimize Recharts Imports

## Context
8 files using full recharts imports instead of tree-shakeable named imports.

## Files to Fix

1. `src/pages/dashboard/DashboardHome.tsx`
2. `src/pages/dashboard/DashboardLayout.tsx`
3. `src/components/charts/*` (6 files)

## Before/After Pattern

### ❌ Before (Full Import)
```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
```

### ✅ After (Tree-shaken)
```tsx
import { LineChart } from 'recharts';
import { Line } from 'recharts';
import { XAxis } from 'recharts';
import { YAxis } from 'recharts';
import { Tooltip } from 'recharts';
import { ResponsiveContainer } from 'recharts';
```

## Implementation Steps

1. **Find all recharts imports**
   ```bash
   grep -rn "from 'recharts'" src/
   ```

2. **Fix each file** - Convert to individual imports

3. **Verify tree-shaking**
   ```bash
   pnpm build --debug
   ```

4. **Visual verification**
   - Open each dashboard page
   - Verify charts render correctly

## Success Criteria
- [ ] All 8 files use named imports
- [ ] Build passes
- [ ] All charts render correctly
- [ ] Bundle size reduced (check `dist/assets/*.js`)

## Verification Command
```bash
grep -rn "import.*from 'recharts'" src/ | wc -l
# Should show individual imports, not combined
```
