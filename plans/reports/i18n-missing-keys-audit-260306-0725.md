# i18n Missing Keys Audit Report

**Date:** 2026-03-06
**Total Missing Keys:** 1137 keys (both vi.ts and en.ts)

---

## Summary

Validation script fixed to correctly parse multiple named imports. However, **1137 translation keys are genuinely missing** from locale files - code is using `t('key')` but keys don't exist in any locale file.

---

## Categories of Missing Keys

### 1. Numeric Prefix Keys (keys starting with numbers)

These keys likely failed to be added due to parser limitations with numeric-prefixed keys:

| Key | File Usage |
|-----|------------|
| `agentgridcard.0x` | AgentGridCard.tsx:49 |
| `commissionwallet.10_pit` | CommissionWallet.tsx:55 |
| `revenuebreakdown.100` | RevenueBreakdown.tsx:75 |
| `statsgrid.10_pit` | StatsGrid.tsx:119 |
| `valuationcard.12_5_pe_ratio` | ValuationCard.tsx:64 |
| `herocard.100m_vnd_revenue` | HeroCard.tsx:85 |

**Fix:** Add these keys to respective locale files with proper quoting or rename to non-numeric prefix.

---

### 2. Flat Keys Not Nested Properly

Keys that should exist in nested structure but are missing:

| Key | File Usage |
|-----|------------|
| `dailyquesthub.grow` | daily-quest-card-and-token-fly-animation.tsx:87 |
| `dailyquesthub.completed` | daily-quest-card-and-token-fly-animation.tsx:104 |
| `dailyquesthub.claim_reward` | daily-quest-card-and-token-fly-animation.tsx:106 |
| `dailyquesthub.start_quest` | daily-quest-card-and-token-fly-animation.tsx:108 |

**Fix:** Add to `src/locales/vi/dailyquesthub.ts` and `src/locales/en/dailyquesthub.ts`.

---

### 3. Error Boundary Keys

| Key | File Usage |
|-----|------------|
| `errorboundary.oops_something_went_wrong` | ErrorBoundary.tsx:67 |
| `errorboundary.we_ve_encountered_an_unexpecte` | ErrorBoundary.tsx:69 |
| `errorboundary.error_details_dev_only` | ErrorBoundary.tsx:74 |
| `errorboundary.reload_page` | ErrorBoundary.tsx:87 |
| `errorboundary.go_home` | ErrorBoundary.tsx:93 |

**Fix:** Add to `src/locales/vi/errorboundary.ts` and `src/locales/en/errorboundary.ts`.

---

### 4. Health Check Keys (CamelCase vs snake_case mismatch)

| Key | File Usage |
|-----|------------|
| `healthCheck.consultationTitle` | health-check-consultation-cta.tsx:48 |
| `healthCheck.consultationDescription` | health-check-consultation-cta.tsx:51 |
| `healthCheck.chatNow` | health-check-consultation-cta.tsx:62 |
| `healthCheck.recommendationsTitle` | health-check-product-recommendations.tsx:49 |
| `healthcheck.s_n_ph_m_c_ai_xu_t_d_nh` | health-check-product-recommendations.tsx:51 |

**Issue:** Code uses `healthCheck.*` (camelCase) but file exports `healthcheck` (snake_case).

**Fix:** Either:
1. Rename export in locale file to `healthCheck`
2. Or update code to use `t('healthcheck.*')`

---

### 5. Agent Module Keys (Already Fixed)

These were FALSE positives - now correctly parsed from shared `agent.ts`:

- `agent.chat.active` ✓
- `agent.chat.errorTitle` ✓
- `agentDashboard.strategic_objectives` ✓
- `agentdetailsmodal.intelligence_node_context` ✓
- `agentgridcard.node_id` ✓

**Status:** Already exist in `src/locales/vi/agent.ts` and `src/locales/en/agent.ts`.

---

## Root Causes

1. **Numeric prefix keys**: TypeScript objects can't have keys starting with numbers without quotes
2. **Flat keys not added**: New components added without corresponding locale entries
3. **CamelCase vs snake_case**: Inconsistent naming between code (`healthCheck`) and locale files (`healthcheck`)
4. **Shared modules**: Multiple exports in single file (e.g., `agent.ts`) confused the parser

---

## Recommended Actions

### Immediate (Blocker)
1. Add all numeric-prefix keys to respective locale files with quoted keys
2. Add missing errorboundary keys
3. Fix healthCheck naming inconsistency

### Short-term
1. Run `pnpm tsx scripts/i18n/auto-add-missing-keys.ts` to auto-add remaining keys
2. Manual review of auto-added translations
3. Build and verify no runtime errors

### Long-term
1. Add pre-commit hook to block new `t('key')` calls without locale entries
2. Consider TypeScript type-safe i18n (e.g., i18next with type generation)
3. Document naming conventions (camelCase vs snake_case)

---

## Files to Update

| File | Missing Keys Count |
|------|-------------------|
| `src/locales/vi/agentgridcard.ts` | 1 (0x) |
| `src/locales/vi/commissionwallet.ts` | ~50 |
| `src/locales/vi/herocard.ts` | ~10 |
| `src/locales/vi/revenuebreakdown.ts` | ~20 |
| `src/locales/vi/statsgrid.ts` | ~5 |
| `src/locales/vi/valuationcard.ts` | ~10 |
| `src/locales/vi/dailyquesthub.ts` | ~10 |
| `src/locales/vi/errorboundary.ts` | 5 |
| `src/locales/vi/health-check.ts` | ~50 |
| ... and many more | |

---

## Next Steps

1. **Auto-add missing keys:**
   ```bash
   pnpm tsx scripts/i18n/auto-add-missing-keys.ts
   ```

2. **Review and fix numeric keys manually** - auto-script may fail on numeric prefixes

3. **Build and test:**
   ```bash
   pnpm run build
   ```

4. **Verify in browser** - check for raw keys showing in UI

---

**Unresolved Questions:**
- Should numeric-prefix keys be renamed (e.g., `key_10_pit` instead of `10_pit`)?
- Should `healthCheck` and `healthcheck` be merged into single module?
- Are there any production pages currently showing raw translation keys?
