---
phase: 1
title: "Build System Fix — .npmrc + Workspace Resolution"
status: pending
priority: P0
effort: 1h
parallel: none (blocker for all other phases)
owns: [".npmrc", "package.json (scripts)", "eslint.config.js"]
---

## Context Links
- Research: [researcher-01-component-splitting.md](research/researcher-01-component-splitting.md) (Section 2: Monorepo)
- CI: [.github/workflows/ci.yml](../../.github/workflows/ci.yml)
- Root .npmrc: `/Users/macbookprom1/mekong-cli/.npmrc`

## Overview
Build system is broken. `.npmrc` deleted (had `legacy-peer-deps=true`), CI uses `npm ci` but project uses `pnpm`. Must restore `.npmrc`, fix package manager alignment, add ESLint `max-lines` rule.

## Key Insights
- Git status shows `D .npmrc` — file deleted, contained `legacy-peer-deps=true`
- Root monorepo uses `pnpm@9.15.0` as package manager
- CI workflow uses `npm ci` / `npm run build` — mismatch with pnpm
- `prebuild` script calls `pnpm sitemap:generate && pnpm i18n:validate`
- ESLint config has no `max-lines` rule currently

## Requirements
- Restore `.npmrc` with correct workspace settings
- Align CI with pnpm (or ensure npm works standalone)
- Add ESLint `max-lines` rule (200 LOC, skip blanks/comments)
- Build must pass: `pnpm build` exits 0

## Related Code Files

**Modified:**
- `apps/well/.npmrc` — restore with `legacy-peer-deps=true`
- `apps/well/eslint.config.js` — add `max-lines` rule
- `apps/well/package.json` — add `validate:file-sizes` script

**Read-only (reference):**
- `/Users/macbookprom1/mekong-cli/.npmrc` — root config
- `/Users/macbookprom1/mekong-cli/package.json` — root workspace def

## Implementation Steps

1. **Restore `.npmrc`**
   ```
   legacy-peer-deps=true
   ```
   This was the original content. Required for React 19 peer dep resolution.

2. **Add ESLint `max-lines` rule** to `eslint.config.js`:
   ```javascript
   // In the TypeScript files config rules:
   'max-lines': ['warn', { max: 200, skipBlankLines: true, skipComments: true }],
   ```
   Use `warn` not `error` — 96 existing violations; set to `error` after refactor completes (Phase 07).

3. **Add file-size validation script** to `package.json`:
   ```json
   "validate:file-sizes": "node scripts/validate-file-sizes.mjs"
   ```

4. **Create `scripts/validate-file-sizes.mjs`** — standalone validator (no ESLint dependency for CI).

5. **Verify build pipeline**:
   ```bash
   pnpm i18n:validate && pnpm build && pnpm test
   ```

## Todo List
- [ ] Restore `.npmrc` with `legacy-peer-deps=true`
- [ ] Add `max-lines` warn rule to `eslint.config.js`
- [ ] Create `scripts/validate-file-sizes.mjs`
- [ ] Add `validate:file-sizes` script to `package.json`
- [ ] Verify `pnpm build` passes
- [ ] Verify `pnpm test` passes

## Success Criteria
- `pnpm build` exits 0
- `pnpm test` exits 0
- `pnpm run lint` reports `max-lines` warnings for >200 LOC files
- `pnpm run validate:file-sizes` lists current violations (informational, non-blocking)

## Conflict Prevention
- Only this phase touches `.npmrc`, `eslint.config.js`, and `package.json` scripts
- No other phase modifies build/lint config

## Risk Assessment
- LOW: `.npmrc` restore is a known-good rollback
- LOW: `max-lines` as `warn` won't break existing CI
- MEDIUM: If CI uses npm but local uses pnpm — test both paths

## Next Steps
- Once build passes, Phases 02-06 can all start in parallel
