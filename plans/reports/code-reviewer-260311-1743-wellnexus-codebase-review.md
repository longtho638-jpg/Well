# Code Review Report - WellNexus

**Date:** 2026-03-11
**Scope:** Toàn bộ codebase `src/` (1,271 files, 86 test files)
**Focus:** TypeScript errors, Logic bugs, Error handling, Security, Performance

---

## Summary

| Metric | Value |
|--------|-------|
| Source files | 1,271 TS/TSX |
| Test files | 86 |
| Test pass rate | 96.6% (1187/1228) |
| Lint warnings | 56 files |
| Build status | FAIL (esbuild crash) |
| Critical issues | 6 |
| High priority | 12 |

---

## Critical Issues (Must Fix)

### 1. TypeScript Build Failures - 19 files với errors

**Location:** Multiple files
**Impact:** Production build không thể compile

```
src/pages/dashboard/billing/overage-status.tsx:14 - Missing module '@/components/billing/PlanUpgradeCTA'
src/pages/dashboard/billing/PaymentUpdate.tsx:31 - Property 'user' does not exist
src/scripts/reconcile-stripe-usage.ts:282 - Parameter 'd' implicitly has 'any' type
src/services/plan-status-scheduler.ts:18 - Cannot find name 'Deno'
src/services/raas-gateway-usage-sync.ts:21 - Cannot find name 'SyncConfig'
src/services/stripe-usage-sync.ts:16 - Cannot find name 'StripeUsageSyncResult'
src/services/usage-anomaly-helpers.ts:21 - Cannot find name 'Anomaly'
```

**Fix:** Export types đúng cách, thêm type declarations

---

### 2. Failing Tests - 41 tests failed / 1228 total

**Test suites failing:**

| File | Failed Tests | Root Cause |
|------|-------------|------------|
| `raas-workflow-e2e.test.ts` | 36/41 | JWT generation returns undefined |
| `overage-calculator.test.ts` | 3 | `percentageUsed` undefined, syncToStripe fails |
| `raas-workflow-e2e.test.ts:450` | Token undefined | License validation logic broken |

**Critical failure pattern:**
```typescript
// src/__tests__/e2e/raas-workflow-e2e.test.ts:450
expect(result.token).toBeDefined() // FAILS - token is undefined
```

**Fix required:** Check `authClient.generateToken()` implementation

---

### 3. Missing Error Handling - Silent catch blocks

**Location:** 4 files với `catch(() => {})`

```typescript
// src/lib/vibe-agent/agent-heartbeat-monitor.ts:215
Promise.resolve(this.onNotify(...)).catch(() => {})

// src/lib/vibe-agent/agent-health-monitor.ts:66,90
}, 'health-monitor').catch(() => {})
```

**Risk:** Errors bị swallow, không log, không debug được

---

### 4. Console.log Production Code - 260 occurrences

**Critical files:**
- `src/lib/stripe-billing-webhook-handler.ts:23` console.log
- `src/lib/raas-http-interceptor.ts:2` console.log
- `src/main.tsx:1` console.log
- `src/scripts/reconcile-stripe-usage.ts:27` console.log

**Rule violation:** Binh Pháp Quality Front - 0 console.log yêu cầu

---

### 5. TODO/FIXME Comments - 168 occurrences

**High-priority todos:**
```typescript
// src/lib/overage-calculator.ts:394
// TODO: Add grace period boost from Phase 6

// src/lib/grace-period-engine.ts:12 TODOs
```

---

### 6. `: any` Types - 11 occurrences

**Files:**
```
src/services/license-service.ts:1
src/__tests__/commission-deep-audit.test.ts:2
src/components/raas/LicenseManagementDashboard.tsx:2
src/scripts/reconcile-stripe-usage.ts:1
```

---

## Warnings

### Lint Issues - 56 files

| Pattern | Count | Example |
|---------|-------|---------|
| Unused vars | 25 | `forecast`, `orgId`, `err` |
| Missing useEffect deps | 5 | `loadRules`, `loadEvents`, `loadStats` |
| Non-null assertion | 10 | `!` operator |
| jsx-a11y issues | 8 | label association |
| autoFocus misuse | 2 | License input |

### React Hook Warnings

```typescript
// src/components/analytics/RaaSAlertSettings.tsx:73
useEffect(..., []) // Missing: loadRules

// src/components/billing/PaymentMethodManager.tsx:83
useEffect(..., []) // Missing: fetchInvoices, fetchPaymentMethod
```

---

## Security Scan Results

### ✅ Good News
- No `eval()`, `exec()`, `new Function()` found
- No hardcoded API keys in source (only in .env)
- No `dangerouslySetInnerHTML` patterns

### ⚠️ localStorage Usage - 30 occurrences

Some sensitive data stored in localStorage:
```typescript
// src/hooks/useAuth.ts:113-128
localStorage.setItem('wellnexus_mock_session', 'true')
localStorage.setItem('wellnexus_mock_email', email)

// src/utils/security-csrf-token-generator-and-session-store.ts:36
sessionStorage.setItem('csrf_token', token)
```

**Risk:** CSRF token trong sessionStorage = acceptable. Mock session data = OK for dev.

---

## Performance Issues

### File Size Violations (>200 lines)

**Top 10 largest files:**
| File | Lines |
|------|-------|
| `src/lib/usage-aggregator.ts` | 747 |
| `src/lib/overage-billing-engine.ts` | 688 |
| `src/lib/raas-alert-rules.ts` | 685 |
| `src/lib/dunning-service.ts` | 659 |
| `src/lib/overage-calculator.ts` | 609 |
| `src/components/billing/RealtimeQuotaTracker.tsx` | 520 |
| `src/lib/raas-analytics-events.ts` | 601 |

**Recommendation:** Split thành smaller modules

---

## Test Coverage Gaps

### Coverage Stats
- **Total tests:** 1,228
- **Passing:** 1,187 (96.6%)
- **Failing:** 41 (3.4%)

### Critical Gaps
1. **RAAS License Validation** - 36/41 failures集中在 e2e test
2. **Overage Calculator** - Core billing logic test fails
3. **Integration tests** missing for:
   - Stripe reconciliation
   - Usage anomaly detection
   - Tenant quota overrides

---

## Suggestions

### Immediate Actions (P0)
1. **Fix TypeScript errors** - Add missing type exports
2. **Fix JWT generation** - Debug `authClient.generateToken()`
3. **Remove console.log** - Replace with analyticsLogger
4. **Fix overage calculator** - percentageUsed calculation

### Short Term (P1)
5. **Split large files** - Target <300 lines
6. **Add error logging** - Replace silent catch blocks
7. **Fix useEffect deps** - Add missing dependencies
8. **Remove TODOs** - Complete or delete

### Medium Term (P2)
9. **Replace `: any`** - Add proper types
10. **Add integration tests** - Critical flows
11. **File size enforcement** - Add pre-commit hook
12. **Build optimization** - Fix esbuild crash

---

## Build Issues

### esbuild Crash
```
[vite:define] The service was stopped: write EPIPE
file: src/components/health/ContextSidebar.tsx
```

**Possible causes:**
- Memory limit (already at 4096MB)
- esbuild version conflict
- Circular dependencies

**Recommendation:** Restart dev server, check for circular imports

---

## Unresolved Questions

1. Why does `authClient.generateToken()` return undefined token?
2. Are the Deno-specific files intentional or migration artifacts?
3. What is the status of Phase 6 grace period implementation?
4. Should mock session data in useAuth.ts be removed from production?

---

## Files Requiring Immediate Attention

| Priority | File | Issue |
|----------|------|-------|
| P0 | `src/lib/raas-license-api.ts` | JWT generation broken |
| P0 | `src/lib/overage-calculator.ts` | Test failures |
| P0 | `src/pages/dashboard/billing/overage-status.tsx` | Missing imports |
| P1 | `src/lib/usage-aggregator.ts` | 747 lines - needs split |
| P1 | `src/lib/overage-billing-engine.ts` | 688 lines - needs split |
| P2 | 56 lint warning files | Clean up unused vars |

---

**Verdict:** APPROVE với điều kiện fix 6 Critical Issues trước khi deploy production.
