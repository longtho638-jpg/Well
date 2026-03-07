---
phase: 7
title: Testing & Integration
status: pending
effort: 2h
---

# Phase 7: Testing & Integration

## Overview

Comprehensive testing of all Phase 5 components: unit tests for hooks/components, integration tests for API tracking, E2E tests for quota enforcement, and production verification.

## Context Links

- **Existing Tests:** `src/lib/__tests__/usage-metering.test.ts` - SDK tests
- **Test Patterns:** `src/hooks/__tests__/*` - Hook test patterns
- **E2E Tests:** `e2e/*` - Playwright tests

## Key Insights

1. **Test isolation** - Mock Supabase, mock Edge Functions
2. **Snapshot testing** - Dashboard UI components
3. **E2E flow** - Login → Use API → Check quota → Exceed → Verify block
4. **Production verify** - Browser check after deploy

## Requirements

### Functional

- [ ] Unit tests for all hooks (useUsage, useQuota, useQuotaGuard)
- [ ] Component tests for dashboard UI
- [ ] Integration tests for auto-tracking
- [ ] E2E test for quota enforcement flow
- [ ] Production smoke test checklist

### Non-Functional

- 80%+ code coverage
- All tests pass before merge
- No console errors in browser

## Architecture

### Test Structure

```
src/
├── lib/__tests__/
│   ├── usage-http-interceptor.test.ts
│   └── usage-manual-tracking.test.ts
├── hooks/__tests__/
│   ├── use-usage-metering.test.ts
│   ├── use-quota-guard.test.ts
│   └── use-quota.test.ts
├── pages/__tests__/
│   └── UsagePage.test.tsx
├── components/__tests__/
│   ├── QuotaGuard.test.tsx
│   ├── UsageSummaryCard.test.tsx
│   └── UpgradePromptModal.test.tsx
e2e/
└── usage-metering.e2e.ts
```

## Implementation Steps

### Step 1: Test Hooks (useUsage, useQuota)

**File:** `src/hooks/__tests__/use-usage-metering.test.ts`

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUsage, useQuota } from '../use-usage-metering'
import { createClient } from '@supabase/supabase-js'

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lt: vi.fn(() => ({
              single: vi.fn(),
              then: vi.fn(),
            })),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  })),
}))

describe('useUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches usage on mount', async () => {
    const { result } = renderHook(() => useUsage())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.usage).toBeDefined()
  })

  it('tracks usage events', async () => {
    const { result } = renderHook(() => useUsage())

    await result.current.trackUsage('api_call', {
      quantity: 1,
      metadata: { endpoint: '/test' },
    })

    // Verify track was called
    expect(createClient).toHaveBeenCalled()
  })

  it('handles errors gracefully', async () => {
    // Mock error
    vi.mocked(createClient).mockImplementationOnce(() => ({
      from: vi.fn(() => {
        throw new Error('Test error')
      }),
    }))

    const { result } = renderHook(() => useUsage())

    await waitFor(() => {
      expect(result.current.error).toBeNull() // Should handle gracefully
    })
  })
})

describe('useQuota', () => {
  it('checks quota for all features', async () => {
    const { result } = renderHook(() => useQuota())

    await waitFor(() => {
      expect(result.current.quotas).toBeDefined()
    })

    expect(result.current.quotas).toHaveProperty('api_call')
    expect(result.current.quotas).toHaveProperty('tokens')
  })

  it('detects when quota exceeded', async () => {
    // Mock 429 response
    global.fetch = vi.fn(() =>
      Promise.resolve({
        status: 429,
        json: Promise.resolve({
          allowed: false,
          current_usage: 150,
          limit: 100,
          warnings: ['Quota exceeded'],
        }),
      })
    ) as any

    const { result } = renderHook(() => useQuota())

    await waitFor(() => {
      expect(result.current.isLimited).toBe(true)
    })
  })
})
```

### Step 2: Test QuotaGuard Hook

**File:** `src/hooks/__tests__/use-quota-guard.test.ts`

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useQuotaGuard } from '../use-quota-guard'

describe('useQuotaGuard', () => {
  beforeEach(() => {
    // Mock fetch for /check-quota
    global.fetch = vi.fn(() =>
      Promise.resolve({
        status: 200,
        json: Promise.resolve({
          allowed: true,
          current_usage: 50,
          limit: 100,
          remaining: 50,
          percentage: 50,
          warnings: [],
          reset_at: new Date().toISOString(),
        }),
      })
    ) as any
  })

  it('allows when quota not exceeded', async () => {
    const { result } = renderHook(() => useQuotaGuard('api_call'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.allowed).toBe(true)
    expect(result.current.blocked).toBe(false)
  })

  it('blocks when quota exceeded (429)', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        status: 429,
        json: Promise.resolve({
          allowed: false,
          current_usage: 150,
          limit: 100,
          remaining: 0,
          percentage: 150,
          warnings: ['CRITICAL: Quota exceeded'],
          reset_at: new Date().toISOString(),
        }),
      })
    ) as any

    const { result } = renderHook(() => useQuotaGuard('api_call'))

    await waitFor(() => {
      expect(result.current.blocked).toBe(true)
    })
  })

  it('caches quota status', async () => {
    const { result, rerender } = renderHook(() => useQuotaGuard('api_call'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const firstCallCount = (global.fetch as any).mock.calls.length

    // Rerender should use cache
    rerender()
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should not have called fetch again (cached)
    expect((global.fetch as any).mock.calls.length).toBe(firstCallCount)
  })
})
```

### Step 3: Test Dashboard Components

**File:** `src/pages/__tests__/UsagePage.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UsagePage } from '../UsagePage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../../i18n/test'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </I18nextProvider>
  )
}

describe('UsagePage', () => {
  beforeEach(() => {
    // Mock useUsage hook
    vi.mock('@/hooks/use-usage-metering', () => ({
      useUsage: () => ({
        usage: {
          api_calls: { used: 50, limit: 100, remaining: 50, percentage: 50 },
          tokens: { used: 5000, limit: 10000, remaining: 5000, percentage: 50 },
          model_inferences: { used: 5, limit: 10, remaining: 5, percentage: 50 },
          agent_executions: { used: 2, limit: 5, remaining: 3, percentage: 40 },
          isLimited: false,
          resetAt: new Date().toISOString(),
        },
        loading: false,
        error: null,
      }),
    }))
  })

  it('renders usage dashboard', async () => {
    render(<UsagePage />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText(/Sử Dụng API & AI/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/API Calls/i)).toBeInTheDocument()
    expect(screen.getByText(/AI Tokens/i)).toBeInTheDocument()
  })

  it('shows loading state', async () => {
    vi.mock('@/hooks/use-usage-metering', () => ({
      useUsage: () => ({
        usage: null,
        loading: true,
        error: null,
      }),
    }))

    render(<UsagePage />, { wrapper: createWrapper() })

    expect(screen.getByTestId('usage-skeleton')).toBeInTheDocument()
  })

  it('shows error state', async () => {
    vi.mock('@/hooks/use-usage-metering', () => ({
      useUsage: () => ({
        usage: null,
        loading: false,
        error: 'Failed to fetch usage',
      }),
    }))

    render(<UsagePage />, { wrapper: createWrapper() })

    expect(screen.getByText(/Error/i)).toBeInTheDocument()
  })
})
```

### Step 4: Test QuotaGuard Component

**File:** `src/components/__tests__/QuotaGuard.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QuotaGuard } from '../QuotaGuard'

describe('QuotaGuard', () => {
  it('renders children when allowed', async () => {
    vi.mock('@/hooks/use-quota-guard', () => ({
      useQuotaGuard: () => ({
        allowed: true,
        blocked: false,
        loading: false,
        warnings: [],
        percentage: 50,
      }),
    }))

    render(
      <QuotaGuard feature="api_call">
        <button>Click Me</button>
      </QuotaGuard>
    )

    expect(screen.getByText('Click Me')).toBeInTheDocument()
  })

  it('shows blocked UI when quota exceeded', async () => {
    vi.mock('@/hooks/use-quota-guard', () => ({
      useQuotaGuard: () => ({
        allowed: false,
        blocked: true,
        loading: false,
        warnings: ['Quota exceeded'],
        percentage: 150,
      }),
    }))

    render(
      <QuotaGuard feature="api_call">
        <button>Click Me</button>
      </QuotaGuard>
    )

    await waitFor(() => {
      expect(screen.getByText(/quota_exceeded/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/upgrade_plan/i)).toBeInTheDocument()
  })

  it('shows warnings at 80%', async () => {
    vi.mock('@/hooks/use-quota-guard', () => ({
      useQuotaGuard: () => ({
        allowed: true,
        blocked: false,
        loading: false,
        warnings: ['WARNING: api_call quota at 80%'],
        percentage: 80,
      }),
    }))

    render(
      <QuotaGuard feature="api_call">
        <button>Click Me</button>
      </QuotaGuard>
    )

    expect(screen.getByText(/quota_warning/i)).toBeInTheDocument()
  })
})
```

### Step 5: E2E Test (Playwright)

**File:** `e2e/usage-metering.e2e.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Usage Metering', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
  })

  test('displays usage dashboard', async ({ page }) => {
    await page.goto('/dashboard/usage')

    await expect(page.locator('h1')).toContainText(/Sử Dụng API & AI/i)
    await expect(page.locator('[data-testid="usage-card-api"]')).toBeVisible()
    await expect(page.locator('[data-testid="usage-card-tokens"]')).toBeVisible()
  })

  test('shows real-time updates', async ({ page }) => {
    await page.goto('/dashboard/usage')

    // Make an API call
    await page.goto('/dashboard')
    await page.click('[data-testid="run-agent"]')
    await page.waitForTimeout(2000)

    // Go back to usage page
    await page.goto('/dashboard/usage')

    // Usage should have increased
    const usageValue = await page.locator('[data-testid="usage-value-api"]').textContent()
    expect(parseInt(usageValue || '0')).toBeGreaterThan(0)
  })

  test('blocks when quota exceeded', async ({ page }) => {
    // This would require seeding test data with high usage
    // For now, test the UI state manually
    await page.goto('/dashboard/usage')

    // Verify quota progress bars visible
    await expect(page.locator('[data-testid="quota-progress"]')).toBeVisible()
  })

  test('shows upgrade prompt when blocked', async ({ page }) => {
    await page.goto('/dashboard/usage')

    // Click on a blocked feature (if any)
    const upgradeButton = page.locator('[data-testid="upgrade-button"]')
    if (await upgradeButton.isVisible()) {
      await upgradeButton.click()
      await expect(page.locator('[data-testid="upgrade-modal"]')).toBeVisible()
    }
  })
})
```

### Step 6: Production Smoke Test Checklist

**File:** `e2e/usage-smoke-test.md`

```markdown
# Usage Metering - Production Smoke Test

## Pre-deploy Checklist

- [ ] All unit tests pass (`npm run test:run`)
- [ ] E2E tests pass (`npm run e2e`)
- [ ] Build passes (`npm run build` - 0 errors)
- [ ] TypeScript clean (`npx tsc --noEmit`)

## Post-deploy Checklist

### 1. Dashboard Page

- [ ] Navigate to `/dashboard/usage`
- [ ] Verify page loads without errors
- [ ] Check console for errors (should be 0)
- [ ] Verify usage cards display real data

### 2. Real-time Updates

- [ ] Make an API call (run agent, use AI)
- [ ] Refresh usage page
- [ ] Verify usage increased

### 3. Quota Enforcement

- [ ] Check quota progress bars show correct percentages
- [ ] Verify warnings appear at 80%
- [ ] (Test with high-usage account) Verify 429 blocks actions

### 4. Billing Sync

- [ ] Check Stripe dashboard for usage records
- [ ] Verify Polar.sh events logged
- [ ] Confirm no duplicate events

### 5. Error Handling

- [ ] Simulate network error (throttle in DevTools)
- [ ] Verify graceful degradation (no crash)
- [ ] Check error boundaries catch exceptions

## Rollback Plan

If production issues:
1. Revert last deploy in Vercel
2. Disable usage interceptor in code
3. Monitor error rates

## Sign-off

- [ ] All checks passed
- [ ] No critical errors
- [ ] Ready to proceed

Tested by: ___________
Date: ___________
```

## Todo List

- [ ] Create `src/hooks/__tests__/use-usage-metering.test.ts`
- [ ] Create `src/hooks/__tests__/use-quota-guard.test.ts`
- [ ] Create `src/pages/__tests__/UsagePage.test.tsx`
- [ ] Create `src/components/__tests__/QuotaGuard.test.tsx`
- [ ] Create `e2e/usage-metering.e2e.ts`
- [ ] Create `e2e/usage-smoke-test.md`
- [ ] Run all tests, fix failures
- [ ] Verify 80%+ coverage

## Success Criteria

1. **All Tests Pass:** Unit, component, E2E all green
2. **Coverage:** 80%+ lines covered
3. **Production Green:** Smoke test checklist complete
4. **Zero Errors:** No console errors in browser

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tests flaky | Medium | Retry logic, stable selectors |
| Mock mismatch | Medium | Test against real API in E2E |
| Coverage low | Low | Add tests for edge cases |

## Security Considerations

- Don't commit test credentials
- Use test users only in E2E

## Next Steps

After Phase 7 complete:
1. Merge to main
2. Deploy to production
3. Monitor usage metrics
4. Mark Phase 5 complete!

---

_Phase: 7/7 | Effort: 2h_
