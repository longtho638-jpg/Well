---
phase: 6
title: "i18n Pipeline + Monitoring + CI Hardening"
status: pending
priority: P2
effort: 2h
parallel: [2, 3, 4, 5]
depends_on: [1]
owns: ["scripts/validate-*.mjs", "scripts/check-*.mjs", ".github/workflows/ci.yml", ".husky/**"]
---

## Context Links
- Research: [researcher-02-i18n-monitoring.md](../260302-0916-i18n-monitoring-research/research/researcher-02-i18n-monitoring.md)
- Existing scripts: `scripts/validate-i18n-keys.mjs`, `scripts/check-locale-coverage.mjs`
- CI: `.github/workflows/ci.yml`
- Sentry: already in `package.json` (`@sentry/react ^10.40.0`)

## Overview
Harden the build pipeline: fix i18n validation scripts (may fail due to workspace issues), add pre-commit hooks for i18n + file-size checks, verify Sentry configuration, strengthen CI workflow. This phase does NOT modify application code — only scripts, CI config, and git hooks.

## Key Insights
- i18n validation already exists (`scripts/validate-i18n-keys.mjs`) but may not catch all edge cases
- WellNexus precedent: `metropolis` vs `empire` key mismatch broke production
- Sentry already installed (`@sentry/react ^10.40.0`) — need to verify init + source maps
- CI uses `npm` commands but project uses `pnpm` — misalignment risk
- Pre-commit hooks exist (husky) but no file-size enforcement

## Requirements
- i18n validation catches: missing keys, extra keys, placeholder mismatches
- Pre-commit hook blocks commits with i18n mismatches
- CI pipeline runs i18n validation + file-size check
- Sentry init verified in `main.tsx`

## Related Code Files

**Modified:**
- `scripts/validate-i18n-keys.mjs` — strengthen validation logic
- `.github/workflows/ci.yml` — add file-size validation step
- `.husky/pre-commit` — add i18n + file-size checks

**Created:**
- `scripts/validate-file-sizes-for-build-enforcement.mjs` — LOC checker for CI

**Read-only (verify):**
- `src/main.tsx` — verify Sentry.init() present
- `vite.config.ts` — verify `build.sourcemap` for Sentry

## Implementation Steps

### Step 1: Strengthen i18n validation script

Review and enhance `scripts/validate-i18n-keys.mjs`:
1. Ensure it compares ALL keys between `en/` and `vi/` locale files (28 files)
2. Add placeholder validation (`{{variable}}` matches between languages)
3. Add exit code 1 on any mismatch
4. Test: intentionally misname a key, run script, verify failure

### Step 2: Create file-size validation script

Create `scripts/validate-file-sizes-for-build-enforcement.mjs`:
```javascript
// Scans src/**/*.{ts,tsx} for files exceeding MAX_LINES
// Excludes: locales/**, __tests__/**, *.test.ts
// Exit 0: informational report (warn mode)
// Exit 1: enforcement mode (--strict flag)
```
- Default mode: prints violations, exits 0 (informational)
- Strict mode (`--strict`): exits 1 if any violation (for future CI enforcement)
- Skip patterns: `src/locales/**`, `src/__tests__/**`, `*.test.ts`, `*.test.tsx`

### Step 3: Update pre-commit hook

Update `.husky/pre-commit`:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Lint staged files
npx lint-staged

# Validate i18n keys on staged locale changes
LOCALE_CHANGED=$(git diff --cached --name-only | grep 'src/locales/' | head -1)
if [ -n "$LOCALE_CHANGED" ]; then
  echo "Locale files changed — validating i18n keys..."
  node scripts/validate-i18n-keys.mjs
fi
```

### Step 4: Harden CI workflow

Update `.github/workflows/ci.yml`:
1. Add file-size validation step (informational, non-blocking initially):
   ```yaml
   - name: Validate file sizes
     run: node scripts/validate-file-sizes-for-build-enforcement.mjs
   ```
2. Ensure i18n validation runs before build (already in pipeline — verify)
3. Consider pnpm alignment (optional — npm ci works for standalone app)

### Step 5: Verify Sentry configuration

1. Check `src/main.tsx` for `Sentry.init()` call
2. Check `vite.config.ts` for `build.sourcemap: true` (needed for stack traces)
3. Check for `Sentry.ErrorBoundary` usage in `App.tsx` or component tree
4. If any missing — document as follow-up task (not in this phase's scope to add)

### Step 6: Verify
```bash
pnpm i18n:validate && pnpm build && pnpm test
```

## Todo List
- [ ] Review and strengthen `scripts/validate-i18n-keys.mjs`
- [ ] Create `scripts/validate-file-sizes-for-build-enforcement.mjs`
- [ ] Update `.husky/pre-commit` with i18n gate
- [ ] Add file-size step to `.github/workflows/ci.yml`
- [ ] Verify Sentry init + source maps config
- [ ] Test pre-commit hook locally

## Success Criteria
- `pnpm i18n:validate` catches intentional key mismatch (test manually)
- Pre-commit hook blocks commit when locale files have mismatched keys
- CI pipeline includes file-size validation step
- Sentry status documented (working / needs-fix)

## Conflict Prevention
- **Exclusive ownership**: `scripts/validate-*`, `.github/workflows/ci.yml`, `.husky/**`
- Phase 01 owns `eslint.config.js` and `package.json` scripts — no overlap
- Application code (`src/**`) NOT modified by this phase
- Other phases may modify `src/locales/**` content but NOT the validation scripts

## Risk Assessment
- LOW: Script changes don't affect application behavior
- LOW: Pre-commit hook is additive, won't break existing flow
- MEDIUM: CI workflow change — test locally first, avoid blocking deploys
  - Mitigation: file-size check exits 0 (informational) until refactor complete

## Security Considerations
- Sentry DSN must remain in env vars, never hardcoded
- i18n validation prevents XSS via injected translation values (DOMPurify handles rendering)
