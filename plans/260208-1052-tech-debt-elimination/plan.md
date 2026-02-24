# Tech Debt Elimination — GREEN 100/100

**Priority:** High | **Status:** Pending | **Complexity:** Low-Medium

## Objective

Eliminate all 48 lint problems (8 errors + 40 warnings) across ~27 files. Achieve zero lint errors, zero warnings, zero type errors, all tests passing.

## Current State (Audit)

| Metric | Current | Target |
|--------|---------|--------|
| `: any` types | 0 | 0 ✅ |
| TODO/FIXME/HACK | 0 | 0 ✅ |
| console.log (debug) | 3 (legitimate, eslint-disabled) | 3 ✅ |
| tsc --noEmit errors | 0 | 0 ✅ |
| Tests | 310 passed (31 files) | All pass ✅ |
| Lint errors | 8 | 0 |
| Lint warnings | 40 | 0 |
| Build | Pass (EPIPE was transient) | Pass |

## Phases

- [Phase 1: Fix 8 lint errors (empty blocks)](./phase-01-fix-lint-errors.md) — 6 files
- [Phase 2: Fix 40 lint warnings](./phase-02-fix-lint-warnings.md) — ~21 files
- [Phase 3: Verify & commit](./phase-03-verify-commit.md)

## Risk Assessment

- **Low risk**: All changes are mechanical (remove unused imports, add comments to empty blocks, replace `!` with null checks)
- **No behavior changes**: No logic modifications, only lint compliance
- **Test safety net**: 310 tests catch regressions
