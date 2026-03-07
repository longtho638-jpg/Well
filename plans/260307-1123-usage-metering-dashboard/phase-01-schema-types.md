---
phase: 1
title: Database Schema & TypeScript Types
status: pending
effort: 1.5h
---

# Phase 1: Database Schema & TypeScript Types

## Overview

Extend existing usage metering schema with dashboard-specific types, add i18n translation keys, and ensure database schema supports all Phase 5 features.

## Context Links

- **Existing Schema:** `src/lib/usage-metering.ts` - UsageMeter SDK with types
- **License Types:** `src/types/raas-license.ts` - RaaSLicense interface
- **Edge Functions:** `supabase/functions/usage-analytics/` - Analytics API
- **i18n Files:** `src/locales/vi/dashboard.ts`, `src/locales/en/dashboard.ts`

## Key Insights

1. **Existing `usage_records` table is sufficient** - already supports `feature`, `quantity`, `metadata`
2. **Need new `usage_quotas` table** - cache daily quotas to reduce DB queries
3. **i18n keys must be symmetric** - VI and EN must have identical key structures (Rule 1)
4. **Tier limits already defined** - `TIER_LIMITS` in `usage-metering.ts` lines 62-68

## Requirements

### Functional

- [ ] Add `usage_quotas` table for caching (optional optimization)
- [ ] Extend TypeScript types for dashboard UI
- [ ] Add i18n keys for usage dashboard (VI + EN)
- [ ] Document schema in types file

### Non-Functional

- TypeScript strict mode (0 errors)
- i18n keys symmetric (VI = EN structure)
- No console.log in production code

## Architecture

### New TypeScript Types (`src/types/usage-metering.ts`)

```typescript
export interface UsageQuota {
  feature: 'api_call' | 'tokens' | 'model_inference' | 'agent_execution' | 'compute_ms'
  used: number
  limit: number
  remaining: number
  percentage: number
  reset_at: string
  status: 'ok' | 'warning' | 'exceeded'
}

export interface UsageDashboardData {
  user_id: string
  tier: string
  period: { start: string; end: string }
  quotas: Record<string, UsageQuota>
  breakdown: {
    by_feature: Array<{ feature: string; total: number }>
    by_model: Array<{ model: string; total_inferences: number }>
    by_agent: Array<{ agent_type: string; executions: number }>
    trend: Array<{ date: string; usage: number }>
  }
  warnings: string[]
}

export type TierName = 'free' | 'basic' | 'premium' | 'enterprise' | 'master'

export const TIER_DISPLAY_NAMES: Record<TierName, string> = {
  free: 'Free',
  basic: 'Basic',
  premium: 'Premium',
  enterprise: 'Enterprise',
  master: 'Master (Unlimited)',
}
```

### i18n Keys to Add

**vietnamese.ts:**
```typescript
usage: {
  dashboard_title: 'Sử Dụng API & AI',
  current_usage: 'Sử Dụng Hôm Nay',
  quota_remaining: 'Còn Lại',
  reset_time: 'Đặt Lại Sau',
  tiers: {
    free: 'Miễn Phí',
    basic: 'Cơ Bản',
    premium: 'Cao Cấp',
    enterprise: 'Doanh Nghiệp',
    master: 'Master (Không Giới Hạn)',
  },
  features: {
    api_call: 'API Calls',
    tokens: 'AI Tokens',
    model_inference: 'Model Inferences',
    agent_execution: 'Agent Executions',
    compute_ms: 'Compute Time',
  },
  status: {
    ok: 'OK',
    warning: 'Cảnh Báo',
    exceeded: 'Vượt Quota',
  },
}
```

**english.ts:** (identical structure)

## Implementation Steps

### Step 1: Create TypeScript Types File

**File:** `src/types/usage-metering.ts`

```typescript
/**
 * Usage Metering Types for Dashboard
 */

export type UsageMetric = 'api_call' | 'tokens' | 'compute_ms' | 'model_inference' | 'agent_execution'

export type TierName = 'free' | 'basic' | 'premium' | 'enterprise' | 'master'

export interface UsageQuota {
  feature: UsageMetric
  used: number
  limit: number
  remaining: number
  percentage: number
  reset_at: string
  status: 'ok' | 'warning' | 'exceeded'
}

// ... (rest of types from Architecture section)
```

### Step 2: Add i18n Keys

**Files to Update:**
- `src/locales/vi/dashboard.ts` - Add `usage` section
- `src/locales/en/dashboard.ts` - Add `usage` section (identical structure)

**Location:** Add at end of existing `dashboard` export object

### Step 3: Verify Schema

**Action:** Check `usage_records` table has required columns:
```sql
-- Run in Supabase SQL Editor
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'usage_records';
```

Expected columns: `id`, `user_id`, `license_id`, `org_id`, `feature`, `quantity`, `metadata`, `recorded_at`

## Todo List

- [ ] Create `src/types/usage-metering.ts` with all dashboard types
- [ ] Add `usage` i18n keys to `src/locales/vi/dashboard.ts`
- [ ] Add `usage` i18n keys to `src/locales/en/dashboard.ts` (symmetric)
- [ ] Verify `usage_records` table schema
- [ ] Export types from `src/types/index.ts` (if exists)
- [ ] Run `npm run build` - verify 0 TypeScript errors

## Success Criteria

1. **Types File Created:** `src/types/usage-metering.ts` exists with all interfaces
2. **i18n Symmetric:** VI and EN have identical key structures
3. **Build Passes:** `npm run build` exits with code 0
4. **No Console Logs:** No new `console.log` statements added

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| i18n key mismatch | High (broken UI) | Copy-paste structure, verify key-by-key |
| Missing DB columns | Medium | Schema check before implementation |
| Type conflicts | Low | Use unique type names |

## Security Considerations

- No sensitive data in types
- Types are frontend-only (no DB credentials)

## Next Steps

After Phase 1 complete:
1. Run tests to verify no regressions
2. Proceed to Phase 2 (React Hooks)

---

_Phase: 1/7 | Effort: 1.5h_
