# Phase 3: TypeScript Build & Seed Scripts

## Context
- Parent: [plan.md](./plan.md)
- Inspired by: zx TypeScript-first scripting with built-in utilities

## Overview
- **Date:** 2026-03-01 | **Priority:** P3 | **Status:** pending

Create type-safe build/seed/deploy helper scripts in TypeScript instead of bash.

## Implementation Steps
1. Create `scripts/seed-products.ts` — type-safe product seeding
2. Create `scripts/check-i18n-sync.ts` — verify translation key completeness
3. Create `scripts/verify-types.ts` — run tsc + report any type errors
4. Add npm scripts: `npm run seed`, `npm run i18n:check`, `npm run types:check`

## Todo
- [ ] seed-products.ts | - [ ] check-i18n-sync.ts
- [ ] verify-types.ts | - [ ] npm script entries | - [ ] Tests

## Success Criteria
- All utility scripts in TypeScript with full type safety
- `npm run i18n:check` catches missing translation keys
- `npm run types:check` reports type coverage
