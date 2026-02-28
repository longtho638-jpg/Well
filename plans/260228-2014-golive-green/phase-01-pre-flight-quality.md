---
title: "Phase 01: Pre-flight Quality Gates"
description: "Ensure tech debt elimination, type safety, linting, and i18n sync."
status: pending
priority: P1
created: 2026-02-28
---

# Phase 01: Pre-flight Quality Gates

## Context Links
- **Binh Pháp Quality Rules:** [[researcher-01-golive-rules.md]]
- **i18n Protocol:** `CLAUDE.md` Rule 1

## Overview
This phase focuses on the "始計" (Initial Calculations) and "作戰" (Type Safety) fronts to ensure the codebase is clean and robust before testing.

## Requirements
- 0 `console.log` in production code.
- 0 `TODO`, `FIXME`, or `@ts-ignore` markers.
- 0 `any` types in the `src/` directory.
- 100% i18n synchronization between `vi.ts` and `en.ts`.

## Implementation Steps
1. **Tech Debt Scan:** Run grep commands to identify leaks.
2. **Type Safety Check:** Run `tsc --noEmit` to verify 0 errors.
3. **Linting:** Run `npm run lint` to ensure style compliance.
4. **i18n Validation:** Run `npm run i18n:validate` and `npm run i18n:check`.

## Todo List
- [ ] Remove `console.log` statements.
- [ ] Clear `TODO/FIXME` comments.
- [ ] Fix any remaining `any` types.
- [ ] Verify i18n sync across all locale files.

## Success Criteria
- Commands return 0 matches for debt/any.
- `i18n:validate` exits with code 0.
- `tsc --noEmit` exits with code 0.
