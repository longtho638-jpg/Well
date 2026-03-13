# Phase 02: Fix TODO/FIXME Comments

**Priority:** High | **Status:** Pending | **Owner:** fullstack-developer

## Context Links
- Parent Plan: [[plan.md]]
- Related: [[phase-01-remove-console-log.md]], [[phase-03-fix-any-types.md]]

## Parallelization Info
- **Can run parallel with:** Phase 01, Phase 03 (different files)
- **Blocks:** Phase 04

## Overview
Resolve or remove all TODO/FIXME comments in the codebase.

## Key Insights
- Only 2 TODO items found:
  1. `UpgradeModal.tsx:31` - Polar checkout URL integration
  2. `reconcile-stripe-usage.ts:293` - Write report to file

## Related Code Files
| File | Action |
|------|--------|
| `src/components/premium/UpgradeModal.tsx` | Implement Polar checkout link or remove TODO |
| `src/scripts/reconcile-stripe-usage.ts` | Add file writing or remove TODO |

## File Ownership
This phase modifies:
- `src/components/premium/UpgradeModal.tsx`
- `src/scripts/reconcile-stripe-usage.ts`

## Implementation Steps
1. Read UpgradeModal.tsx line 31 - check if Polar URL available
2. If Polar URL exists, implement link. If not, remove TODO or add placeholder
3. Read reconcile-stripe-usage.ts line 293
4. Implement file writing for report or remove TODO if not needed

## Todo List
- [ ] Fix TODO in UpgradeModal.tsx
- [ ] Fix TODO in reconcile-stripe-usage.ts
- [ ] Verify 0 TODO/FIXME remaining

## Success Criteria
- grep -r "TODO\|FIXME" src/ returns 0 results

## Conflict Prevention
- UpgradeModal.tsx not modified by other phases
- reconcile-stripe-usage.ts: Phase 01 only touches comments, this phase touches implementation

## Risk Assessment
- Medium: TODO in UpgradeModal may require Polar URL configuration
- Mitigation: Use environment variable or remove TODO if feature deferred

---
*File count: 2 files to modify*
