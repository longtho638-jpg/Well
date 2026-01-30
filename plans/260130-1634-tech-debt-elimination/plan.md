---
title: "Tech Debt Elimination: Fix All `: any` Types"
description: "GO-LIVE task to eliminate all `: any` types in src/, verify TypeScript compilation, and ensure build passes"
status: completed
priority: P0
effort: 4h
issue: N/A
branch: main
tags: [tech-debt, typescript, go-live, type-safety]
created: 2026-01-30
completed: 2026-01-30
---

# Tech Debt Elimination: Fix All `: any` Types

## Overview

Systematic elimination of all `: any` type annotations in the src/ directory to achieve strict TypeScript compliance before GO-LIVE. Total of **31 occurrences across 11 files** identified.

**Verification Results:**
- `tsc --noEmit` produces **0 errors** ✅
- `npm run build` passes successfully (9.24s) ✅
- All **235 existing tests** continue to pass (99.6% success rate, 1 skip) ✅

## Scope Summary

| Category | Files | Occurrences |
|----------|-------|-------------|
| **Test Files** | 3 | 21 |
| **Hooks** | 2 | 4 |
| **Services** | 1 | 1 |
| **Components** | 2 | 3 |
| **Agents** | 1 | 1 |
| **Types** | 1 | 1 |
| **Utilities** | 1 | 1 |
| **TOTAL** | **11** | **31** |

**Good News:** No TODO or FIXME comments found in src/!

## Phases

| # | Phase | Status | Effort | Files | Link |
|---|-------|--------|--------|-------|------|
| 1 | Test Files (Low Risk) | Completed | 1h | 3 | [phase-01](./phase-01-test-files.md) |
| 2 | Hooks & Services | Completed | 1.5h | 3 | [phase-02-hooks-services.md) |
| 3 | Components & UI | Completed | 1h | 3 | [phase-03-components-ui.md) |
| 4 | Verification & Build | Completed | 30min | - | [phase-04-verification.md) |

## Strategy

**Prioritization:** Test files first (lowest production impact) → Hooks/Services → Components → Final verification

**Approach:**
- Replace `: any` with proper TypeScript types
- Leverage existing type definitions where available
- Create minimal interfaces only when necessary (YAGNI)
- Maintain existing functionality (zero behavior changes)

## Dependencies

- TypeScript 5.x (already configured with `strict: true`)
- Existing type definitions in `/src/types/`
- Vitest test suite (230 tests)

## Risk Assessment

**Low Risk:**
- Test files contain most `: any` (21/31 = 68%)
- All changes are type-only (no runtime behavior changes)
- Comprehensive test suite validates functionality

**Mitigation:**
- Run tests after each phase
- Incremental commits per file/phase
- Verify `tsc --noEmit` after each change
