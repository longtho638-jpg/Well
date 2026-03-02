---
phase: 7
title: "Validation + Enforcement Activation — Final Gate"
status: pending
priority: P1
effort: 1h
parallel: none
depends_on: [2, 3, 4, 5, 6]
owns: []
---

## Context Links
- Plan overview: [plan.md](plan.md)
- ESLint config (from Phase 01): `eslint.config.js`
- File-size script (from Phase 06): `scripts/validate-file-sizes-for-build-enforcement.mjs`

## Overview
Final validation phase. Runs after ALL refactoring phases complete. Verifies every file is under 200 LOC, upgrades ESLint `max-lines` from `warn` to `error`, enables strict file-size enforcement in CI. No application code changes — only config toggles and verification.

## Key Insights
- Phase 01 set `max-lines` to `warn` — 96 violations existed at that time
- After Phases 02-05, violations should be 0 (excluding skipped files)
- This phase flips the switch: `warn` -> `error` to prevent future bloat
- Full build + test + lint must pass as final gate

## Requirements
- 0 files over 200 LOC (excluding locales, tests, App.tsx)
- ESLint `max-lines` upgraded to `error`
- CI file-size check upgraded to `--strict` (exit 1 on violation)
- Full pipeline green: lint, build, test

## Implementation Steps

### Step 1: Run file-size audit
```bash
node scripts/validate-file-sizes-for-build-enforcement.mjs
```
- Must report 0 violations
- If violations remain: identify which phase missed them, fix before proceeding

### Step 2: Upgrade ESLint `max-lines` to `error`
In `eslint.config.js`, change:
```javascript
// From (set in Phase 01):
'max-lines': ['warn', { max: 200, skipBlankLines: true, skipComments: true }],

// To:
'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
```

### Step 3: Enable strict file-size CI enforcement
In `.github/workflows/ci.yml`, change:
```yaml
# From (set in Phase 06):
- name: Validate file sizes
  run: node scripts/validate-file-sizes-for-build-enforcement.mjs

# To:
- name: Validate file sizes (strict)
  run: node scripts/validate-file-sizes-for-build-enforcement.mjs --strict
```

### Step 4: Full pipeline verification
```bash
pnpm run lint          # 0 errors (max-lines now error)
pnpm i18n:validate     # i18n keys in sync
pnpm build             # 0 TS errors
pnpm test              # all tests pass
```

### Step 5: Score reassessment
Run audit against the 10-layer scoring matrix:
- Before: 76/100
- Expected after: 85/100
- Document improvements per layer

### Step 6: Generate completion report
Create `plans/reports/planner-260302-0919-architecture-refactor-completion.md`:
- Files refactored count
- LOC before/after comparison
- New file count (extracted hooks, sub-components, type files)
- Pipeline status (lint, build, test)
- Score delta

## Todo List
- [ ] Run file-size audit — confirm 0 violations
- [ ] Upgrade `max-lines` from `warn` to `error` in `eslint.config.js`
- [ ] Enable `--strict` flag in CI file-size step
- [ ] Run full pipeline: lint + i18n + build + test
- [ ] Reassess project score (target: 85/100)
- [ ] Generate completion report

## Success Criteria
- `pnpm run lint` exits 0 with `max-lines: error`
- `node scripts/validate-file-sizes-for-build-enforcement.mjs --strict` exits 0
- `pnpm build` exits 0
- `pnpm test` exits 0 — all 349+ tests pass
- No regressions in any page/component behavior

## Conflict Prevention
- This phase modifies `eslint.config.js` (Phase 01 ownership transferred here)
- This phase modifies `.github/workflows/ci.yml` (Phase 06 ownership transferred here)
- Both transfers are safe: Phases 01 and 06 are completed before this phase starts

## Risk Assessment
- LOW: Config toggle only — no application code changes
- LOW: If any violations remain, they're caught before enforcement is enabled
- MEDIUM: Strict CI enforcement could block future PRs if contributors add large files
  - Mitigation: document the 200 LOC limit in CONTRIBUTING.md or README

## Next Steps
- Update `docs/code-standards.md` with 200 LOC file limit
- Update `docs/codebase-summary.md` with new file structure
- Consider adding `max-lines-per-function: ['warn', { max: 80 }]` as next quality gate
