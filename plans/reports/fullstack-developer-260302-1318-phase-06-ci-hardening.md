# Phase Implementation Report

## Executed Phase
- Phase: phase-06-ci-hardening
- Plan: none (standalone task)
- Status: completed

## Files Modified

| File | Action | Lines |
|------|--------|-------|
| `scripts/validate-file-sizes-for-build-enforcement.mjs` | Updated — added blank-line/comment-skipping logic | 130 |
| `.github/workflows/ci.yml` | Updated — moved `Validate file sizes` step to run immediately after install | 68 |

## Files Verified (read-only, no changes needed)

| File | Status |
|------|--------|
| `scripts/validate-i18n-keys.mjs` | Exists, covers coverage + symmetry checks, exits 1 on failure |
| `.husky/pre-commit` | Exists, already has i18n gate on staged locale changes |
| `src/main.tsx` | Has `initSentry()` via `./utils/sentry` utility |
| `vite.config.ts` | Sentry chunked in `manualChunks` — see Sentry note below |

## Tasks Completed

- [x] Step 1: Updated `validate-file-sizes-for-build-enforcement.mjs` to skip blank lines and comment-only lines (ESLint `max-lines` compatible counting)
- [x] Step 2: Verified `validate-i18n-keys.mjs` — two-phase (coverage + key symmetry), exits 1 on any failure
- [x] Step 3: Moved file-size validation step in `.github/workflows/ci.yml` to run immediately after install (before lint, tests, build)
- [x] Step 4: `.husky/pre-commit` already has i18n validation on staged locale changes — no changes needed
- [x] Step 5: Sentry/sourcemap verified (findings below)

## Key Change: Line Counting Algorithm

Previous: `content.split('\n').length` — counted ALL lines including blanks and comments.

Updated: `countMeaningfulLines(content)` — mirrors ESLint `max-lines` behaviour:
- Strips blank/whitespace-only lines
- Strips `//` single-line comment lines
- Strips `/* ... */` block comment lines (including multi-line)

Effect: 9 files flagged as violations (informational, exit 0). Examples:
- `src/pages/LandingPage.tsx` — 289 meaningful / 316 raw lines
- `src/lib/vibe-agent/index.ts` — 272 meaningful / 383 raw lines

Raw line count was inflating numbers; meaningful count is more accurate signal for refactor priority.

## CI Step Order (final)

```
install → validate-file-sizes (lightweight, no deps) → security-audit → i18n-validate → lint → tests → build → upload artifacts
```

File-size validation runs first after install — zero cost, exits 0 (informational), fails fast without wasting test/build minutes.

## Sentry Config Findings

- `src/main.tsx`: calls `initSentry()` from `./utils/sentry` — conditional prod-only init exists
- `vite.config.ts`: Sentry chunked via `manualChunks` (`@sentry` → `'sentry'` chunk) — correct
- `vite.config.ts`: **No `build.sourcemap` configured** — source maps NOT generated at build time
  - Impact: Sentry will receive minified stack traces, making error attribution harder in production
  - Recommendation: Add `build: { sourcemap: true }` or `sourcemap: 'hidden'` to `vite.config.ts`
  - This is a follow-up item; not modified in this phase (read-only per task scope)

## Tests Status
- Type check: pass (0 errors — `pnpm exec tsc --noEmit`)
- Unit tests: not run (out of scope for this phase)
- Integration tests: n/a

## Issues Encountered

None. All target files already existed from prior phase work. Changes were minimal diffs.

## Next Steps

1. Fix `vite.config.ts` missing `build.sourcemap` — add `sourcemap: 'hidden'` so Sentry receives source maps without exposing them to end users
2. Consider promoting `--strict` flag on file-size validator once the 9 violations are refactored
3. 9 files flagged for eventual refactor (all informational, no CI blocking):
   - `src/pages/LandingPage.tsx` (+89)
   - `src/lib/vibe-agent/index.ts` (+72)
   - `src/pages/Admin/admin-sidebar-nav.tsx` (+57)
   - `src/components/Wallet/wallet-transaction-history-table.tsx` (+22)
   - `src/components/auth/LoginActivityLog.tsx` (+20)
   - `src/data/mock-users-team-members-referrals.ts` (+16)
   - `src/pages/Admin/Products.tsx` (+12)
   - `src/pages/SubscriptionPage.tsx` (+7)
   - `src/pages/Marketplace.tsx` (+2)

## Unresolved Questions

- Should `build.sourcemap: 'hidden'` be added to `vite.config.ts`? Hidden source maps upload to Sentry but are not served to browsers — recommended for production Sentry usage.
- Should the file-size CI step become `--strict` (exit 1) after the 9 violations are resolved?
