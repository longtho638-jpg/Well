---
title: "Phase 7.6: Comprehensive Testing"
description: "Test suite for overage billing and quota enforcement (40+ tests)"
status: pending
priority: P1
effort: 1h
---

# Phase 7.6: Comprehensive Testing

## Context Links

- Related: `src/__tests__/phase6-*.test.ts` - Phase 6 test patterns
- Related: `./plan.md` - Phase 7 overview

## Overview

Comprehensive test suite covering overage tracking, quota enforcement, Stripe integration, and Phase 6 integration.

## Test Categories

### 1. Overage Tracking Tests (15 tests)

```typescript
describe('Overage Tracking', () => {
  // Basic calculation
  test('calculateOverage returns correct units when usage > quota')
  test('calculateOverage returns 0 when usage <= quota')

  // Multi-metric
  test('different metrics have different overage rates')
  test('storage overage calculated in GB increments')

  // Edge cases
  test('usage exactly at quota = no overage')
  test('fractional overage rounded up')

  // Persistence
  test('overage transactions stored correctly')
  test('duplicate prevention with idempotency key')

  // Stripe sync
  test('usage reported to Stripe within 5 minutes')
  test('Stripe sync failure triggers retry')
  test('Stripe usage record uses correct action type')
})
```

### 2. Quota Enforcement Tests (15 tests)

```typescript
describe('Quota Enforcement', () => {
  // Soft mode
  test('soft mode allows overage with billing')
  test('soft mode includes overage warning headers')

  // Hard mode
  test('hard mode returns 429 at quota limit')
  test('429 response includes overage info')
  test('429 response includes upgrade URL')

  // Hybrid mode
  test('hybrid mode allows grace period')
  test('hybrid mode blocks after grace expires')

  // Per-tenant overrides
  test('tenant-specific limits applied correctly')
  test('tenant overrides take priority over tier defaults')

  // Rate limiting integration
  test('rate limit enforced at per-second level')
  test('rate limit enforced at per-minute level')
  test('rate limit enforced at per-hour level')
  test('rate limit enforced at per-day level')

  // Edge cases
  test('burst handling within allowed burst limit')
  test('concurrent request limiting')
})
```

### 3. Stripe Integration Tests (10 tests)

```typescript
describe('Stripe Integration', () => {
  // Usage records
  test('usage record created with increment action')
  test('usage record created with set action')
  test('usage record timestamp is Unix epoch')

  // Webhooks
  test('invoice.created webhook processed')
  test('invoice.finalized webhook triggers email')
  test('invoice.payment_succeeded clears balance')
  test('invoice.payment_failed triggers dunning')

  // Reconciliation
  test('daily sync detects drift')
  test('missing usage records backfilled')
})
```

### 4. Phase 6 Integration Tests (10 tests)

```typescript
describe('Phase 6 Integration', () => {
  // Effective quota
  test('effective quota = base + overrides + grace')
  test('grace period reduces limits by 50%')
  test('grace period activates 7 days before expiry')

  // Tenant isolation
  test('tenant A cannot see tenant B overages')
  test('RLS prevents cross-tenant access')

  // Feature flags
  test('feature flags affect overage eligibility')
})
```

### 5. Auth Integration Tests (10 tests)

```typescript
describe('Auth Integration', () => {
  // JWT
  test('tenant_id extracted from JWT claims')
  test('expired JWT rejected')
  test('invalid tenant_id returns 403')

  // API keys
  test('mk_ API key authenticates correctly')
  test('API key resolves to tenant context')
  test('invalid API key returns 401')
  test('API key rotation maintains access')

  // Rate limiting
  test('rate limits applied per tenant')
  test('rate limits reset at correct interval')
})
```

## Test Files to Create

| File | Tests | Focus |
|------|-------|-------|
| `phase7-1-overage-tracking.test.ts` | 15 | Overage calculation, persistence |
| `phase7-2-quota-enforcement.test.ts` | 15 | Hard/soft limits, 429 responses |
| `phase7-3-stripe-integration.test.ts` | 10 | Stripe API, webhooks |
| `phase7-4-phase6-integration.test.ts` | 10 | Grace periods, overrides |
| `phase7-5-auth-integration.test.ts` | 10 | JWT, API keys, rate limits |

**Total: 60 tests**

## Implementation Steps

1. Create test files following Phase 6 patterns
2. Mock Stripe API with MSW handlers
3. Use Supabase local testing for DB ops
4. Run tests in parallel with vitest forks
5. Verify 100% coverage on new code

## Success Criteria

1. All 60 tests pass
2. Coverage ≥ 80% on Phase 7 code
3. No flaky tests
4. Test execution < 2 seconds
