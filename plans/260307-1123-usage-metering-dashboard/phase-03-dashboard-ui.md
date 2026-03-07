---
phase: 3
title: Dashboard UI Components
status: pending
effort: 3h
---

# Phase 3: Dashboard UI Components

## Overview

Build the Usage Metering Dashboard page at `/dashboard/usage` with real-time usage cards, quota meters, charts, and tier information. Follow Aura Elite design system.

## Context Links

- **Dashboard Page:** `src/pages/Dashboard.tsx` - Pattern reference
- **Aura Elite Design:** Glassmorphism, dark gradients, Framer Motion
- **i18n:** Use `t('dashboard.usage.*')` keys from Phase 1
- **Hooks:** Use `useUsage`, `useQuota` from Phase 2

## Key Insights

1. **Dashboard follows existing pattern** - similar to `Dashboard.tsx` stats cards
2. **Real-time updates** - use hooks polling (30s interval)
3. **Responsive design** - mobile-first, Tailwind grid
4. **Loading states** - skeleton loaders during fetch

## Requirements

### Functional

- [ ] Usage dashboard page at `/dashboard/usage`
- [ ] Usage summary cards (API calls, tokens, inferences, agent executions)
- [ ] Quota progress meters with color coding
- [ ] Usage breakdown charts (by feature, by model, by agent)
- [ ] Tier information card
- [ ] Warning alerts at 80%/90% quota

### Non-Functional

- Aura Elite design (glassmorphism, gradients)
- Responsive (mobile, tablet, desktop)
- Loading states and error handling
- TypeScript strict mode

## Architecture

### Page Structure

```
/dashboard/usage
├── Header
│   ├── Title "Sử Dụng API & AI"
│   └── Tier badge (Free/Basic/Premium/etc.)
├── Usage Summary Grid (2x2)
│   ├── API Calls Card
│   ├── AI Tokens Card
│   ├── Model Inferences Card
│   └── Agent Executions Card
├── Quota Progress Section
│   ├── Progress bars for each metric
│   └── Reset timer
├── Usage Breakdown Charts
│   ├── By Feature (bar chart)
│   ├── By Model (pie chart)
│   └── Trend (line chart)
└── Warnings Alert Banner
```

### Component Breakdown

1. **UsagePage** - Main page container
2. **UsageSummaryCard** - Reusable card component
3. **QuotaProgressBar** - Progress meter component
4. **UsageBreakdownChart** - Chart component
5. **TierBadge** - Tier display component

## Implementation Steps

### Step 1: Create Usage Page

**File:** `src/pages/UsagePage.tsx`

```typescript
import React from 'react'
import { useUsage } from '@/hooks/use-usage-metering'
import { useTranslation } from 'react-i18next'
import { UsageSummaryCard } from './usage-page/UsageSummaryCard'
import { QuotaProgressSection } from './usage-page/QuotaProgressSection'
import { UsageBreakdownCharts } from './usage-page/UsageBreakdownCharts'
import { WarningsAlert } from './usage-page/WarningsAlert'

export function UsagePage() {
  const { t } = useTranslation('dashboard')
  const { usage, loading, error } = useUsage()

  if (loading) {
    return <UsagePageSkeleton />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
        <div className="text-red-400 text-center">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            {t('usage.dashboard_title')}
          </h1>
        </header>

        {/* Warnings */}
        <WarningsAlert />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <UsageSummaryCard
            metric="api_call"
            title={t('usage.features.api_call')}
            value={usage?.api_calls.used ?? 0}
            limit={usage?.api_calls.limit ?? 0}
            percentage={usage?.api_calls.percentage ?? 0}
          />
          {/* ... more cards */}
        </div>

        {/* Quota Progress */}
        <QuotaProgressSection />

        {/* Breakdown Charts */}
        <UsageBreakdownCharts />
      </div>
    </div>
  )
}
```

### Step 2: Create UsageSummaryCard Component

**File:** `src/pages/usage-page/UsageSummaryCard.tsx`

```typescript
import React from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

interface UsageSummaryCardProps {
  metric: string
  title: string
  value: number
  limit: number
  percentage: number
}

export function UsageSummaryCard({ metric, title, value, limit, percentage }: UsageSummaryCardProps) {
  const { t } = useTranslation('dashboard')

  const getColor = (pct: number) => {
    if (pct >= 90) return 'text-red-400'
    if (pct >= 80) return 'text-yellow-400'
    return 'text-emerald-400'
  }

  const getBgColor = (pct: number) => {
    if (pct >= 90) return 'from-red-500/20 to-red-600/10'
    if (pct >= 80) return 'from-yellow-500/20 to-yellow-600/10'
    return 'from-emerald-500/20 to-emerald-600/10'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${getBgColor(percentage)} backdrop-blur-xl border border-white/10 p-6`}
    >
      <div className="space-y-4">
        <h3 className="text-white/80 text-sm font-medium">{title}</h3>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">
            {value.toLocaleString()}
          </span>
          {limit !== -1 && (
            <span className="text-white/60 text-sm">
              / {limit.toLocaleString()}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage, 100)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full ${getColor(percentage).replace('text-', 'bg-')}`}
          />
        </div>

        {/* Percentage */}
        <div className={`text-sm ${getColor(percentage)}`}>
          {limit === -1 ? 'Unlimited' : `${percentage}% used`}
        </div>
      </div>
    </motion.div>
  )
}
```

### Step 3: Create QuotaProgressSection

**File:** `src/pages/usage-page/QuotaProgressSection.tsx`

```typescript
import React from 'react'
import { useQuota } from '@/hooks/use-usage-metering'
import { useTranslation } from 'react-i18next'

export function QuotaProgressSection() {
  const { t } = useTranslation('dashboard')
  const { quotas, warnings } = useQuota()

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
      <h2 className="text-xl font-bold text-white mb-6">
        {t('usage.quota_status')}
      </h2>

      <div className="space-y-4">
        {Object.entries(quotas).map(([feature, quota]) => (
          <div key={feature} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/80">
                {t(`usage.features.${feature}`)}
              </span>
              <span className={quota.percentage >= 90 ? 'text-red-400' : 'text-white/60'}>
                {quota.used.toLocaleString()} / {quota.limit === -1 ? '∞' : quota.limit.toLocaleString()}
              </span>
            </div>
            <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  quota.percentage >= 90 ? 'bg-red-500' :
                  quota.percentage >= 80 ? 'bg-yellow-500' :
                  'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(quota.percentage, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Reset Timer */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <p className="text-white/60 text-sm">
          {t('usage.reset_time')}: {quotas['api_call']?.reset_at
            ? new Date(quotas['api_call'].reset_at).toLocaleTimeString()
            : 'N/A'
          }
        </p>
      </div>
    </div>
  )
}
```

### Step 4: Create WarningsAlert

**File:** `src/pages/usage-page/WarningsAlert.tsx`

```typescript
import React from 'react'
import { useQuota } from '@/hooks/use-usage-metering'
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'

export function WarningsAlert() {
  const { t } = useTranslation('dashboard')
  const { warnings } = useQuota()

  if (warnings.length === 0) return null

  return (
    <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-4 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
      <div className="space-y-1">
        <h3 className="text-yellow-400 font-medium">
          {t('usage.quota_warning')}
        </h3>
        <ul className="text-white/80 text-sm space-y-1">
          {warnings.map((warning, i) => (
            <li key={i}>{warning}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
```

### Step 5: Add Route

**File:** `src/App.tsx` or routing config

```typescript
// Add route for usage page
<Route path="/dashboard/usage" element={UsagePage} />
```

## Todo List

- [ ] Create `src/pages/UsagePage.tsx`
- [ ] Create `src/pages/usage-page/UsageSummaryCard.tsx`
- [ ] Create `src/pages/usage-page/QuotaProgressSection.tsx`
- [ ] Create `src/pages/usage-page/UsageBreakdownCharts.tsx` (optional, use Recharts)
- [ ] Create `src/pages/usage-page/WarningsAlert.tsx`
- [ ] Create `src/pages/usage-page/UsagePageSkeleton.tsx`
- [ ] Add route to App.tsx
- [ ] Run `npm run build` - verify 0 errors
- [ ] Test in browser - verify design matches Aura Elite

## Success Criteria

1. **Page Renders:** `/dashboard/usage` accessible and renders
2. **Real-time Data:** Usage updates every 30s
3. **Design Match:** Aura Elite glassmorphism style
4. **Responsive:** Works on mobile, tablet, desktop
5. **i18n Working:** All text uses translation keys

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Chart library conflicts | Medium | Use simple div bars, avoid heavy libs |
| Design inconsistency | Medium | Copy existing Dashboard.tsx patterns |
| Performance issues | Low | Lazy load charts, skeleton loaders |

## Security Considerations

- No sensitive data displayed
- User only sees own usage (RLS enforced)

## Next Steps

After Phase 3 complete:
1. Test dashboard in browser
2. Verify design matches Aura Elite
3. Proceed to Phase 4 (Auto-Tracking Middleware)

---

_Phase: 3/7 | Effort: 3h_
