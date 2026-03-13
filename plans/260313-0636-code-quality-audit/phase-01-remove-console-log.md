# Phase 01: Remove console.log Statements

**Priority:** High | **Status:** Pending | **Owner:** fullstack-developer

## Context Links
- Parent Plan: [[plan.md]]
- Related: [[phase-02-fix-todo-fixme.md]]
- Docs: `/Users/macbookprom1/mekong-cli/apps/well/docs/code-standards.md`

## Parallelization Info
- **Can run parallel with:** Phase 02 (different files)
- **Blocks:** Phase 03, Phase 04

## Overview
Remove all console.log/warn/error statements from production code, excluding:
- Test files (`__tests__/`, `test/`)
- Logger utility (`src/utils/logger.ts`)
- Commented-out example code

## Key Insights
- 37 console.* statements found in non-test files
- Most (27) are in `reconcile-stripe-usage.ts` script - acceptable for CLI tool
- `LiveConsole.tsx` references are UI text, not actual console calls
- Only actionable: commented example in `use-raas-analytics-stream.ts`

## Related Code Files
| File | Action | Count |
|------|--------|-------|
| `src/lib/raas-realtime-events.ts` | Remove commented console.log examples | 2 |
| `src/hooks/use-raas-analytics-stream.ts` | Remove commented console.log example | 1 |

## File Ownership
This phase modifies:
- `src/lib/raas-realtime-events.ts`
- `src/hooks/use-raas-analytics-stream.ts`

## Implementation Steps
1. Read `src/lib/raas-realtime-events.ts` lines 19, 24
2. Remove console.log from comments (replace with proper JSDoc if needed)
3. Read `src/hooks/use-raas-analytics-stream.ts` line 22
4. Remove console.log from comments
5. Verify no other console.log in production components

## Todo List
- [ ] Remove console.log comments in raas-realtime-events.ts
- [ ] Remove console.log comment in use-raas-analytics-stream.ts
- [ ] Verify changes with grep

## Success Criteria
- grep returns 0 results for console.log in production src/ (excluding logger.ts, scripts/, tests/)

## Conflict Prevention
- No overlap with Phase 02 (TODO/FIXME) or Phase 03 (:any types)

## Risk Assessment
- Low risk - only removing comments

---
*File count: 2 files to modify*
