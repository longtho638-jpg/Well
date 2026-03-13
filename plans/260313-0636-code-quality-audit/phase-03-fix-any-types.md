# Phase 03: Replace :any Types with Proper Types

**Priority:** High | **Status:** Pending | **Owner:** fullstack-developer

## Context Links
- Parent Plan: [[plan.md]]
- Related: [[phase-01-remove-console-log.md]], [[phase-02-fix-todo-fixme.md]]

## Parallelization Info
- **Depends on:** Phase 01, Phase 02 (must complete first)
- **Can run parallel with:** None
- **Blocks:** Phase 04

## Overview
Replace top 15 :any type usages with proper TypeScript interfaces/types.

## Key Insights
- 186 :any instances total
- Most (50+) in test files - exclude from scope
- Priority targets:
  1. `tenant-context.ts:171` - middleware typing
  2. `LicenseAnalyticsDashboard.tsx:187` - summaryMetrics param
  3. Chart components in analytics/ - tooltip formatters

## Related Code Files
| File | Line | Action |
|------|------|--------|
| `src/middleware/tenant-context.ts` | 171 | Type status callback |
| `src/components/admin/LicenseAnalyticsDashboard.tsx` | 187 | Define SummaryMetrics interface |
| `src/components/analytics/RevenueByTierChart.tsx` | 147 | Type formatter value |
| `src/components/analytics/RaaSUsageChart.tsx` | 90 | Type CustomTooltip props |
| `src/components/analytics/CohortRetentionCharts.tsx` | 126 | Type formatter |
| `src/components/analytics/CohortAnalysisChart.tsx` | 81 | Type formatter |
| `src/components/analytics/CohortRetentionChart.tsx` | 57 | Type formatter |
| `src/components/analytics/ConversionFunnelChart.tsx` | 112 | Type formatter |
| `src/components/analytics/TopEndpointsChart.tsx` | 126 | Type formatter |
| `src/components/analytics/ChartExports.ts` | 6 | Type export function |

## File Ownership
This phase modifies (NO overlap with Phase 01, 02):
- `src/middleware/tenant-context.ts`
- `src/components/admin/LicenseAnalyticsDashboard.tsx`
- `src/components/analytics/*.tsx` (10 files)

## Implementation Steps
1. Create interfaces for common types in `src/types/analytics.ts` (if not exists)
2. Fix middleware tenant-context.ts callback type
3. Fix LicenseAnalyticsDashboard summaryMetrics type
4. Fix chart tooltip formatters (Recharts provides types)
5. Fix ChartExports.ts export function type

## Todo List
- [ ] Define interfaces for analytics types
- [ ] Fix tenant-context.ts middleware type
- [ ] Fix LicenseAnalyticsDashboard.tsx
- [ ] Fix all analytics chart components (top 10 priority)
- [ ] Run tsc --noEmit to verify

## Success Criteria
- At least 15 :any instances removed
- tsc --noEmit returns 0 errors
- No type-related runtime errors

## Conflict Prevention
- Files in this phase not modified by Phase 01 or 02
- Test files excluded (would conflict with tester agent later)

## Risk Assessment
- Medium: Breaking changes if types don't match runtime data
- Mitigation: Use existing Recharts types, verify with build

---
*File count: 12 files to modify*
