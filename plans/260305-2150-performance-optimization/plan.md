---
title: "Resources Optimization 5→10"
description: "Lazy loading, virtual scrolling, prefetching, bundle splitting"
status: in-progress
priority: P0
effort: 4h
branch: main
tags: [performance, optimization, resources, lazy-loading]
created: 2026-03-05
updated: 2026-03-07
---

# Resources Optimization 5→10

## Overview
Score: 5/10 → Target: 10/10. Tập trung resource loading optimization.

## Maintenance Scan Results (2026-03-07)

**Report:** `plans/reports/code-reviewer-260307-2108-maintenance-scan.md`

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Build Time | <10s | 7.77s | ✅ |
| Max Chunk | <500KB | 1.6MB | ❌ |
| TypeScript Errors | 0 | 12 | ❌ |
| ESLint Errors | 0 | 29 | ❌ |
| `: any` Types | 0 | 70+ | ⚠️ |

## Phases

| Phase | Status | Effort | Dependencies |
|-------|--------|--------|--------------|
| [01-lazy-heavy-libs](./phase-01-lazy-heavy-libs.md) | pending | 45min | None |
| [02-virtual-scroll-tables](./phase-02-virtual-scroll-tables.md) | pending | 1h | None |
| [03-react-query-prefetch](./phase-03-react-query-prefetch.md) | pending | 45min | None |
| [04-font-image-preload](./phase-04-font-image-preload.md) | pending | 30min | None |

## Critical Fixes Required

1. **UpgradeModal.tsx syntax error** - Line 20 corrupted import
2. **Missing type exports** - `use-cohort-analysis.ts` → `use-polar-analytics.ts`
3. **CohortRetentionCharts.tsx** - Implicit `any` on lines 26, 97
4. **Bundle splitting** - Add manualChunks for charts (482KB) + pdf (1.6MB)

## Verification
- Initial bundle giảm 60%
- FCP < 1.5s
- Lighthouse Performance ≥95
- Test pass 100%
- TypeScript errors: 0
- ESLint errors: 0

## Risks
- Loading states phức tạp → Dùng Suspense boundaries
- Regression → Test critical paths
