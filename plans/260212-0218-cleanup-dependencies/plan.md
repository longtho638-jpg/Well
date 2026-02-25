# Plan: Dependency Cleanup and Architecture Hygiene

## Context
Research identified unused and misplaced dependencies in `package.json`.
- `@payos/node`: Unused in frontend code (PayOS logic is in Supabase Edge Functions).
- `dotenv`: Used only in scripts, currently in `dependencies`.

## Goals
1. Remove `@payos/node` to reduce bundle size and confusion.
2. Move `dotenv` to `devDependencies`.
3. Verify project builds successfully.

## Steps
1.  **Uninstall** `@payos/node`.
2.  **Install** `dotenv` as a dev dependency.
3.  **Run** `npm run build` to verify no regressions.
4.  **Run** `npm test` to verify no regressions.

## Verification
- `grep -r "@payos/node" src/` returns nothing.
- Build passes.
- Tests pass.
