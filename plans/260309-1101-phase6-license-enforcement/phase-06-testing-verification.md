---
phase: 6.6
title: "Testing & Verification"
description: "E2E tests for license enforcement flows, production verification, and documentation"
status: pending
priority: P1
effort: 2h
---

# Phase 6.6: Testing & Verification

## Context Links

- Parent Plan: [./plan.md](./plan.md)
- Previous: [./phase-05-analytics-events.md](./phase-05-analytics-events.md)
- Existing: `src/__tests__/phase6-license-compliance-enforcer.test.ts` - Existing Phase 6 tests
- Existing: `src/__tests__/raas-license-validation.test.ts` - License validation tests

## Overview

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 - Quality gate |
| **Effort** | 2 hours |
| **Status** | ⏳ Pending |

## Testing Scope

| Test Category | Coverage |
|---------------|----------|
| Unit Tests | Service functions, response builders |
| Integration Tests | Middleware + KV + Stripe |
| E2E Tests | Full enforcement flow |
| Load Tests | Concurrent requests, cache performance |

## Implementation Steps

### Step 1: Create Unit Tests

**Files to Create:**
- `src/services/__tests__/license-enforcement-service.test.ts`
- `src/services/__tests__/billing-state-service.test.ts`
- `src/services/__tests__/suspension-response.test.ts`

```typescript
// license-enforcement-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LicenseEnforcementService } from '@/services/license-enforcement-service'

describe('LicenseEnforcementService', () => {
  let service: LicenseEnforcementService

  beforeEach(() => {
    service = new LicenseEnforcementService()
  })

  it('should validate valid license', async () => {
    const result = await service.validateLicense('RAAS-valid-key')
    expect(result.isValid).toBe(true)
    expect(result.status).toBe('active')
  })

  it('should reject invalid license', async () => {
    const result = await service.validateLicense('RAAS-invalid-key')
    expect(result.isValid).toBe(false)
    expect(result.status).toBe('revoked')
  })

  it('should cache validation results', async () => {
    // First call - API
    await service.validateLicense('RAAS-test-key')
    // Second call - cache
    const cached = await service.validateLicense('RAAS-test-key')
    expect(cached).toBeDefined()
  })

  it('should respect grace period for expired licenses', () => {
    const expiredLicense = {
      isValid: false,
      status: 'expired' as const,
      expiresAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12h ago
    }
    expect(service.isInGracePeriod(expiredLicense)).toBe(true)
  })
})
```

### Step 2: Create Integration Tests

**Files to Create:**
- `src/__tests__/phase6-license-enforcement-integration.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { licenseValidationMiddleware } from '@/lib/raas-gate-quota'
import { billingStateService } from '@/services/billing-state-service'

describe('License Enforcement Integration', () => {
  beforeEach(async () => {
    // Reset test data
    await setupTestData()
  })

  it('should allow valid license with active subscription', async () => {
    const request = new Request('http://localhost/api/test', {
      headers: { 'X-API-Key': 'RAAS-valid-key' },
    })

    const result = await licenseValidationMiddleware(request)
    expect(result.allowed).toBe(true)
  })

  it('should block invalid license with 403', async () => {
    const request = new Request('http://localhost/api/test', {
      headers: { 'X-API-Key': 'RAAS-invalid-key' },
    })

    const result = await licenseValidationMiddleware(request)
    expect(result.allowed).toBe(false)
    expect(result.statusCode).toBe(403)
  })

  it('should block canceled subscription', async () => {
    // Setup: valid license + canceled subscription
    await setupSubscription('org-test', 'canceled')

    const request = new Request('http://localhost/api/test', {
      headers: { 'X-API-Key': 'RAAS-valid-key' },
    })

    const result = await licenseValidationMiddleware(request)
    expect(result.allowed).toBe(false)
    expect(result.error).toContain('subscription')
  })

  it('should allow grace period for past_due without dunning', async () => {
    // Setup: valid license + past_due subscription (no dunning)
    await setupSubscription('org-test', 'past_due', { hasDunning: false })

    const request = new Request('http://localhost/api/test', {
      headers: { 'X-API-Key': 'RAAS-valid-key' },
    })

    const result = await licenseValidationMiddleware(request)
    expect(result.allowed).toBe(true) // Grace period
  })

  it('should admin bypass suspension', async () => {
    const request = new Request('http://localhost/api/test', {
      headers: {
        'X-API-Key': 'mk_admin_key',
        'X-Admin-Bypass': 'true',
      },
    })

    const result = await licenseValidationMiddleware(request)
    expect(result.allowed).toBe(true) // Bypass works
  })
})

async function setupTestData() {
  // Insert test license, subscription, etc.
}

async function setupSubscription(
  orgId: string,
  status: string,
  options?: { hasDunning?: boolean }
) {
  // Setup test subscription
}
```

### Step 3: Create E2E Tests

**Files to Create:**
- `src/__tests__/e2e/license-enforcement-e2e.test.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('License Enforcement E2E', () => {
  test('should show suspension page when license invalid', async ({ page }) => {
    // Setup: Invalid license
    await mockLicense('invalid')

    await page.goto('/dashboard')
    await expect(page.locator('[data-testid="suspension-banner"]')).toBeVisible()
    await expect(page.locator('[data-testid="suspension-reason"]')).toHaveText(
      'License invalid'
    )
  })

  test('should allow access with valid license', async ({ page }) => {
    // Setup: Valid license
    await mockLicense('valid')

    await page.goto('/dashboard')
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible()
  })

  test('should show payment update option when past_due', async ({ page }) => {
    // Setup: Past due subscription
    await mockSubscription('past_due')

    await page.goto('/dashboard/billing')
    await expect(page.locator('[data-testid="payment-update-btn"]')).toBeVisible()
  })

  test('should restore access after payment update', async ({ page }) => {
    // Setup: Past due → Update payment → Active
    await mockSubscription('past_due')

    await page.goto('/dashboard/billing/payment-update')
    await page.fill('[data-testid="card-number"]', '4242424242424242')
    await page.click('[data-testid="submit-payment"]')

    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible()

    // Navigate back to dashboard
    await page.goto('/dashboard')
    await expect(page.locator('[data-testid="suspension-banner"]')).not.toBeVisible()
  })
})

async function mockLicense(status: 'valid' | 'invalid') {
  // Mock API response
}

async function mockSubscription(status: string) {
  // Mock subscription state
}
```

### Step 4: Create Load Tests

**Files to Create:**
- `src/__tests__/load/license-enforcement-load.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { licenseValidationMiddleware } from '@/lib/raas-gate-quota'

describe('License Enforcement Load Tests', () => {
  it('should handle 100 concurrent requests', async () => {
    const requests = Array.from({ length: 100 }, () =>
      licenseValidationMiddleware(
        new Request('http://localhost/api/test', {
          headers: { 'X-API-Key': 'RAAS-valid-key' },
        })
      )
    )

    const results = await Promise.all(requests)
    const successCount = results.filter((r) => r.allowed).length

    expect(successCount).toBeGreaterThan(90) // 90%+ success rate
  })

  it('should maintain < 50ms response time with cache', async () => {
    const start = Date.now()

    // Warm up cache
    await licenseValidationMiddleware(
      new Request('http://localhost/api/test', {
        headers: { 'X-API-Key': 'RAAS-valid-key' },
      })
    )

    // Timed requests
    const requests = Array.from({ length: 50 }, () =>
      licenseValidationMiddleware(
        new Request('http://localhost/api/test', {
          headers: { 'X-API-Key': 'RAAS-valid-key' },
        })
      )
    )

    await Promise.all(requests)
    const duration = Date.now() - start

    expect(duration / 50).toBeLessThan(50) // Avg < 50ms per request
  })
})
```

### Step 5: Run Tests & Fix Issues

**Commands:**
```bash
# Run unit tests
npm test -- license-enforcement

# Run integration tests
npm test -- integration:license

# Run E2E tests
npx playwright test license-enforcement-e2e

# Run load tests
npm test -- load:license
```

### Step 6: Documentation

**Files to Create:**
- `docs/LICENSE-ENFORCEMENT.md` - Implementation guide

```markdown
# License Enforcement System

## Overview

The license enforcement system validates RaaS licenses on every API request and blocks access for invalid/expired licenses or subscriptions.

## Architecture

See `plans/260309-1101-phase6-license-enforcement/plan.md`

## Configuration

### Environment Variables

```env
VITE_RAAS_GATEWAY_URL=https://raas-gateway-worker.xxx.workers.dev
VITE_ADMIN_API_KEY=mk_admin_xxx
VITE_SUPPORT_API_KEY=mk_support_xxx
```

### KV Cache

- TTL: 5 minutes
- Namespace: LICENSE_CACHE
- Format: `license:{licenseKey}`

## Suspension Reasons

| Reason | Description | Recovery |
|--------|-------------|----------|
| `license_invalid` | License key not found | Enter valid key |
| `license_expired` | License past expiry | Renew license |
| `subscription_canceled` | Stripe subscription canceled | Resubscribe |
| `dunning_active` | Payment failure dunning | Update payment |

## Admin Bypass

Support team can bypass suspension using:
```
X-API-Key: mk_support_xxx
X-Admin-Bypass: true
```

## Monitoring

- Dashboard: Analytics → License Events
- Alerts: Slack on suspension spike
- Logs: Supabase → suspension_audit_log
```

## Todo List

- [ ] Create unit tests for all services
- [ ] Create integration tests for middleware
- [ ] Create E2E tests for UI flows
- [ ] Create load tests for performance
- [ ] Run all tests and fix failures
- [ ] Create LICENSE-ENFORCEMENT.md documentation
- [ ] Add API documentation for error responses
- [ ] Document troubleshooting guide

## Success Criteria

- [ ] All unit tests pass (90%+ coverage)
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Load tests: < 50ms avg response time
- [ ] Documentation complete
- [ ] Production verification: enforcement working

## Test Coverage Goals

| Module | Target | Actual |
|--------|--------|--------|
| license-enforcement-service.ts | 90% | TBD |
| billing-state-service.ts | 90% | TBD |
| suspension-response.ts | 95% | TBD |
| raas-gate-quota.ts (middleware) | 85% | TBD |
| license-analytics.ts | 80% | TBD |

## Production Verification Checklist

- [ ] RaaS Gateway Worker deployed
- [ ] KV namespace configured
- [ ] Middleware enabled on all API routes
- [ ] Suspension responses returning 403
- [ ] Admin bypass working
- [ ] Analytics events visible in dashboard
- [ ] Audit log capturing suspensions
- [ ] Stripe webhooks updating subscription state

## Rollback Plan

If enforcement causes issues:
1. Set `VITE_DISABLE_LICENSE_ENFORCEMENT=true`
2. Redeploy
3. Investigate logs in suspension_audit_log
4. Fix issue and re-enable

---

_Created: 2026-03-09_
