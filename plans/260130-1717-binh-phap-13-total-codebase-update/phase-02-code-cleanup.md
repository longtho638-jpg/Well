---
phase: 2
title: "Code Cleanup & Linting"
priority: P1
effort: 0.5 day
status: completed
---

# Phase 02: Code Cleanup & Linting

**Goal**: Eliminate technical debt, ensure zero linting errors, and remove dead code to prepare for final verification.

**Scope**:
1.  Fix all ESLint/Prettier violations (approx 56 issues).
2.  Remove unused imports and variables.
3.  Remove dead code and unused files.
4.  Standardize code style (naming conventions, file structure).
5.  Resolve critical TODOs and FIXMEs.

---

## Context Links

- **Main Plan**: `./plan.md`
- **Scan Report**: `../reports/explorer-260130-1717-codebase-scan.md` (Reference)
- **ESLint Config**: `/Users/macbookprom1/Well/eslint.config.js`

---

## Key Insights

- **Zero Tolerance**: We aim for 0 warnings/errors.
- **Strict Mode**: TypeScript strict mode is already enabled (verified in Phase 1).
- **Dead Code**: Several files from previous refactoring might still exist.
- **Imports**: "import React from 'react'" is no longer needed in React 17+ (and we are on 19), can be removed if not used.

---

## Requirements

### Functional Requirements
- **FR2-1**: `npm run build` must pass without any lint warnings.
- **FR2-2**: All TODOs categorized as "Critical" or "P0" must be resolved.
- **FR2-3**: No unused variables or imports in the final build.

### Non-Functional Requirements
- **NFR2-1**: Maintainability - Code should be cleaner and easier to read.
- **NFR2-2**: Performance - Smaller bundle size by removing dead code.

---

## Implementation Steps

### Step 1: Analysis & Setup
1.  Run `npx eslint .` to identify current issues.
2.  Run `tsc --noEmit` to verify type safety (should be clean from Phase 1).
3.  Identify unused files (using `ts-prune` or manual check against build graph if needed, but simple grep/audit works too).

### Step 2: Fix Linting Issues
1.  Fix specific ESLint errors.
2.  Apply auto-fixes (`eslint --fix`).
3.  Manually resolve remaining complex issues.

### Step 3: Remove Dead Code
1.  Scan for unused exports.
2.  Delete known obsolete files (e.g., from `plans/reports` mentioning extracted files).
3.  Clean up `TODO` comments that are stale.

### Step 4: Verification
1.  Run full test suite `npm run test:run`.
2.  Verify build `npm run build`.

---

## Todo List

- [x] Run initial lint scan and save report
- [x] Fix ESLint errors/warnings
- [x] Remove unused imports (global replace or auto-fix)
- [x] Identify and delete dead files
- [x] Resolve critical TODOs
- [x] Verify `npm run build` passes
- [x] Verify tests pass

---

## Success Criteria

- ✅ `npx eslint .` returns 0 errors/warnings.
- ✅ No unused files in `src/`.
- ✅ Build succeeds.
