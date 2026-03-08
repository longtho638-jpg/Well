# Code Review: Overage Billing Implementation

**Date:** 2026-03-08
**Reviewer:** code-reviewer
**Scope:** Phase 7 overage billing & dunning workflows
**Report:** `plans/reports/code-reviewer-260308-overage-billing.md`

---

## Scope

| File | LOC | Focus |
|------|-----|-------|
| `src/services/overage-calculator.ts` | 367 | Type safety, error handling, rate calculation |
| `src/services/stripe-usage-sync.ts` | 406 | Retry logic, edge cases, Stripe sync |
| `supabase/functions/stripe-dunning/index.ts` | 881 | SMS integration, dunning workflow |
| `supabase/functions/usage-alert-webhook/index.ts` | 578 | Notification flow, JWT signing |
| `src/components/billing/CustomerPortalButton.tsx` | 65 | React patterns, error handling |
| `src/types/overage.ts` | 116 | Type definitions |

**Total:** ~2,413 LOC

---

## Overall Assessment

Implementation demonstrates solid architectural patterns with comprehensive error handling and proper separation of concerns. However, there are **critical security issues**, **type safety gaps**, and **inconsistent error handling** that must be addressed before production.

**Quality Score: 6.5/10**

---

## Critical Issues

### 1. JWT Secret with Fallback to Plaintext (Security Critical)

**File:** `usage-alert-webhook/index.ts:352`

```typescript
const secret = Deno.env.get('RAAS_JWT_SECRET') || 'fallback-secret-change-in-production'
```

**Impact:** Production may use hardcoded secret if env var missing → JWT can be forged.

**Fix:**
```typescript
const secret = Deno.env.get('RAAS_JWT_SECRET')
if (!secret) {
  throw new Error('RAAS_JWT_SECRET is required')
}
```

---

### 2. Console Statements in Production Code (19 occurrences)

**Files:** `overage-calculator.ts` (11), `stripe-usage-sync.ts` (8)

**Impact:** Violates Binh Pháp Front 1 (Tech Debt Elimination). Leaks internal state, potential PII exposure.

**Fix:** Replace with structured logging service or remove entirely.

---

### 3. Unused Variable Reference (Bug)

**File:** `stripe-dunning/index.ts:326`

```typescript
const plan_name = subscription?.metadata?.plan_name || 'Subscription'
// ❌ 'subscription' is not defined in this scope
```

**Location:** Inside `handleInvoicePaymentFailed()` after SMS send block.

**Impact:** Runtime error when SMS notification triggered.

**Fix:** Fetch subscription before this line or remove reference.

---

### 4. Missing Type Safety - `any` Usage

**Files:**
- `overage-calculator.ts:58` - `(r: any) => r.tenant_id`
- `overage-calculator.ts:134` - `.map((row: any) => ...)`
- `overage-calculator.ts:311` - `.map((row: any) => ...)`
- `stripe-usage-sync.ts` - Multiple `any` in function params

**Impact:** Violates Binh Pháp Front 2 (Type Safety 100%).

**Fix:** Define proper interfaces for database row types.

---

## High Priority

### 5. Inconsistent Error Handling - Supabase Errors Silently Swallowed

**Files:** `overage-calculator.ts`, `stripe-usage-sync.ts`

**Pattern:**
```typescript
try {
  // Supabase query
} catch (err) {
  console.error('[OverageCalculator] Error:', err)
  return []  // ❌ Silently returns empty, caller has no idea error occurred
}
```

**Impact:** Errors hidden, downstream code processes empty data → incorrect billing.

**Fix:** Throw errors or return Result type:
```typescript
interface Result<T> {
  data?: T
  error?: Error
}
```

---

### 6. Missing Retry Logic in Stripe Usage Sync

**File:** `stripe-usage-sync.ts:222-298`

The `syncPendingOverages()` function has **no retry logic** despite exponential backoff calculation at line 274:

```typescript
const nextRetryAt = new Date(Date.now() + Math.pow(2, retryCount) * 3600000)
```

But `retryCount` is hardcoded to `0` (line 273).

**Fix:** Fetch actual retry count from `stripe_usage_sync_log` before calculating backoff.

---

### 7. Race Condition in Idempotency Key Generation

**File:** `overage-calculator.ts:343-349`

```typescript
export function generateOverageIdempotencyKey(
  orgId: string,
  metricType: string,
  billingPeriod: string
): string {
  return `ovg_${orgId}_${metricType}_${billingPeriod}`
}
```

**Issue:** No timestamp/randomness → if same org/metric/period processed twice concurrently, duplicate transactions possible.

**Fix:** Add atomic DB constraint on idempotency_key + use `ON CONFLICT DO NOTHING`.

---

### 8. Webhook Signature Verification Missing Error Details

**File:** `stripe-dunning/index.ts:86-95`

```typescript
try {
  event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret)
} catch (err) {
  console.error('[StripeDunning] Webhook signature verification failed:', err)
  return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
    status: 400,
  })
}
```

**Impact:** Debugging failed webhooks impossible without error details in response.

**Fix:** Include error message in development, generic message in production.

---

## Medium Priority

### 9. React Component Hardcoded Text (i18n Violation)

**File:** `CustomerPortalButton.tsx:61`

```typescript
>Quản lý Subscription
```

**Impact:** Violates i18n protocol. Text should use `t('billing.customer_portal.button')`.

**Fix:**
```typescript
import { useTranslation } from 'react-i18next'
const { t } = useTranslation()
> {t('billing.customer_portal.button')}
```

---

### 10. Missing Error UI in React Component

**File:** `CustomerPortalButton.tsx:37-42`

```typescript
} else {
  console.error('Failed to get portal URL')
  // Show error toast here  ❌ TODO not implemented
}
```

**Fix:** Implement toast notification or error state.

---

### 11. SMS Template Data Type Mismatch Risk

**File:** `usage-alert-webhook/index.ts:283`

```typescript
percentage: Math.round((current_usage / quota_limit) * 100).toString(),
```

**Issue:** If `quota_limit` is 0, division returns `Infinity` → `"Infinity"` sent to user.

**Fix:**
```typescript
percentage: quota_limit > 0
  ? Math.round((current_usage / quota_limit) * 100).toString()
  : '100',
```

---

### 12. Dunning Email Subject Function Incomplete

**File:** `stripe-dunning/index.ts:550-560`

```typescript
function getAlertSubject(threshold: number, metricType: string): string {
  if (threshold >= 125) { ... }  // ❌ 125% threshold not configurable
}
```

**Fix:** Move thresholds to config table.

---

## Low Priority

### 13. Inconsistent Naming Convention

**File:** `stripe-usage-sync.ts`

- `getFailedSyncesForRetry()` → should be `getFailedSyncsForRetry()`
- `retryFailedSynces()` → should be `retryFailedSyncs()`

---

### 14. Magic Numbers in Dunning Sequence

**File:** `stripe-dunning/index.ts:32-37`

```typescript
const DUNNING_SEQUENCE = [
  { stage: 'initial', day: 0, template: 'dunning-initial' },
  { stage: 'reminder', day: 2, template: 'dunning-reminder' },
  ...
]
```

**Fix:** Move to database config for runtime adjustment.

---

### 15. Test Coverage Incomplete

**File:** `overage-calculator.test.ts`

**Missing tests:**
- `getOverageRate()` with custom tenant rates
- `calculateOverageForOrg()` integration
- Error scenarios (DB connection failures)
- Edge cases: zero quota, negative usage

---

## Security Audit

| Check | Status | Notes |
|-------|--------|-------|
| Secrets in codebase | ❌ FAIL | Fallback JWT secret |
| Input validation | ✅ PASS | Phone validation, required fields |
| CORS configured | ✅ PASS | All edge functions have corsHeaders |
| Webhook signatures | ✅ PASS | Stripe webhook verification |
| Idempotency | ⚠️ PARTIAL | Key generation has race condition |
| Rate limiting | ✅ PASS | SMS rate limiting via DB |
| XSS prevention | ✅ PASS | React auto-escape |
| SQL injection | ✅ PASS | Supabase parameterized queries |

---

## Edge Cases Found by Scout

| Edge Case | Severity | Status |
|-----------|----------|--------|
| Quota = 0 causes division by zero | High | ⚠️ Partial (handled in some places, not all) |
| Concurrent overage calculation → duplicate transactions | Medium | ⚠️ Idempotency key collision |
| Stripe API rate limits | Medium | ❌ No rate limit handling |
| User deletes phone number mid-dunning | Low | ✅ Handled (null check) |
| JWT secret rotation | Low | ❌ No rotation support |
| Timezone mismatches in billing period | Medium | ❌ Not addressed |

---

## Positive Observations

1. **Proper Supabase RPC usage** for atomic operations (`check_alert_idempotency`, `log_sms_send`)
2. **Comprehensive webhook event handling** covering all Stripe dunning scenarios
3. **Multi-channel notifications** (email + SMS + in-app) with graceful degradation
4. **Idempotency patterns** implemented throughout (keys, duplicate detection)
5. **Type definitions** well-structured in `overage.ts`
6. **RaaS Gateway integration** for license state consistency
7. **Exponential backoff** structure in place (though not fully implemented)
8. **CORS properly configured** on all edge functions

---

## Recommended Actions (Prioritized)

### P0 (Before Production)
1. **Fix JWT secret fallback** - Require env var, throw if missing
2. **Remove all console statements** - Replace with structured logging
3. **Fix undefined `subscription` variable** in stripe-dunning
4. **Add type annotations** to replace all `any` types
5. **Implement error UI** in CustomerPortalButton

### P1 (Within 1 Sprint)
6. **Fix error handling** - Throw errors instead of silent returns
7. **Implement proper retry logic** - Fetch retry count from DB
8. **Add idempotency DB constraint** - Prevent race conditions
9. **Add i18n** to CustomerPortalButton
10. **Fix division by zero** in percentage calculations

### P2 (Technical Debt)
11. Fix naming: `Synces` → `Syncs`
12. Move magic numbers to config
13. Expand test coverage to 80%+
14. Add Stripe API rate limit handling
15. Add timezone handling for billing periods

---

## Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Type Coverage | ~85% | 100% | ❌ |
| Test Coverage | ~30% | 80% | ❌ |
| Console Statements | 19 | 0 | ❌ |
| `any` Types | 8 | 0 | ❌ |
| Security Issues | 2 critical | 0 | ❌ |
| Lines of Code | 2,413 | - | - |

---

## Unresolved Questions

1. **Why is `console.log` used extensively** despite Binh Pháp rules prohibiting it?
2. **Is there a structured logging service** available that should be used instead?
3. **What is the expected behavior** when Stripe API returns rate limit (429)?
4. **Are there database indexes** on `overage_transactions(stripe_sync_status, created_at)`?
5. **Is the JWT expiry (1 hour)** appropriate for webhook delivery retries?
6. **Should dunning emails be queued** instead of sent synchronously in webhook handler?

---

## Compliance with Standards

| Standard | Compliance | Notes |
|----------|------------|-------|
| Binh Pháp Front 1 (Tech Debt) | ❌ | 19 console statements |
| Binh Pháp Front 2 (Type Safety) | ❌ | 8 `any` types |
| Binh Pháp Front 3 (Performance) | ✅ | No obvious bottlenecks |
| Binh Pháp Front 4 (Security) | ⚠️ | JWT secret fallback |
| i18n Sync Protocol | ❌ | Hardcoded text in component |
| Orchestration Protocol | ✅ | Proper service layering |

---

**Next Review:** After P0 fixes completion.
