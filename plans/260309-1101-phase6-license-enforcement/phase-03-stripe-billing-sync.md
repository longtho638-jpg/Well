---
phase: 6.3
title: "Stripe Billing State Sync"
description: "Sync Stripe subscription state to license enforcement - suspend when subscription expired/unpaid"
status: pending
priority: P1
effort: 2.5h
---

# Phase 6.3: Stripe Billing State Sync

## Context Links

- Parent Plan: [./plan.md](./plan.md)
- Previous: [./phase-02-license-validation-middleware.md](./phase-02-license-validation-middleware.md)
- Next: [./phase-04-suspension-logic.md](./phase-04-suspension-logic.md)
- Existing: `src/lib/dunning-service.ts` - Dunning state management
- Existing: `src/lib/subscription-health.ts` - Subscription health checks

## Overview

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 - Revenue protection |
| **Effort** | 2.5 hours |
| **Status** | ⏳ Pending |

## Key Insights

- Dunning service already tracks payment failures
- Need to expose dunning state to license enforcement
- Subscription status in `user_subscriptions` table
- Must handle: active, past_due, canceled, expired

## Requirements

### Functional

1. Check `user_subscriptions.status` on every request
2. Block if status = 'canceled' or 'expired'
3. Block if status = 'past_due' AND dunning_active
4. Allow if status = 'active'
5. Allow grace period for 'past_due' without dunning

### Non-Functional

- Subscription check < 5ms (cached)
- Sync with Stripe via webhooks (real-time)
- Handle subscription gaps gracefully

## Database Schema

```sql
-- Existing tables (Phase 3 & 7)
user_subscriptions:
  - id, org_id, stripe_subscription_id
  - plan_slug, status (active|past_due|canceled|expired)
  - current_period_start, current_period_end
  - metadata (JSON)

dunning_events:
  - id, org_id, subscription_id
  - resolved (boolean), dunning_stage
  - days_since_failure, amount_owed
```

## Implementation Steps

### Step 1: Create Billing State Service

**Files to Create:**
- `src/services/billing-state-service.ts` - Stripe state sync

```typescript
import { supabase } from '@/lib/supabase'
import { dunningService } from '@/lib/dunning-service'

export interface BillingState {
  subscriptionStatus: 'active' | 'past_due' | 'canceled' | 'expired' | 'none'
  hasActiveSubscription: boolean
  hasActiveDunning: boolean
  daysPastDue: number
  amountOwed: number
  subscriptionEndsAt?: string
  gracePeriodRemaining?: number // hours
}

export class BillingStateService {
  private cache: Map<string, { state: BillingState; expiry: number }>
  private readonly CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

  async getBillingState(orgId: string): Promise<BillingState> {
    // Check cache
    const cached = this.cache.get(orgId)
    if (cached && Date.now() < cached.expiry) {
      return cached.state
    }

    // Fetch subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .or('status.eq.past_due,status.eq.canceled,status.eq.expired')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!subscription) {
      return {
        subscriptionStatus: 'none',
        hasActiveSubscription: false,
        hasActiveDunning: false,
        daysPastDue: 0,
        amountOwed: 0,
      }
    }

    // Check for active dunning
    const dunningEvents = await dunningService.getActiveDunningEvents(orgId)
    const hasActiveDunning = dunningEvents.length > 0

    // Calculate days past due
    const daysPastDue = hasActiveDunning
      ? dunningEvents[0].daysSinceFailure
      : 0

    // Calculate grace period remaining (48h for past_due without dunning)
    let gracePeriodRemaining: number | undefined
    if (subscription.status === 'past_due' && !hasActiveDunning) {
      const periodEnd = new Date(subscription.current_period_end).getTime()
      const now = Date.now()
      const graceMs = 48 * 60 * 60 * 1000
      gracePeriodRemaining = Math.max(0, graceMs - (now - periodEnd)) / (60 * 60 * 1000)
    }

    const state: BillingState = {
      subscriptionStatus: subscription.status as BillingState['subscriptionStatus'],
      hasActiveSubscription: subscription.status === 'active' || subscription.status === 'past_due',
      hasActiveDunning,
      daysPastDue,
      amountOwed: hasActiveDunning ? dunningEvents[0].amountOwed : 0,
      subscriptionEndsAt: subscription.current_period_end,
      gracePeriodRemaining,
    }

    // Cache
    this.cache.set(orgId, { state, expiry: Date.now() + this.CACHE_TTL_MS })

    return state
  }

  isSubscriptionActive(state: BillingState): boolean {
    return state.subscriptionStatus === 'active' ||
      (state.subscriptionStatus === 'past_due' && !state.hasActiveDunning)
  }

  shouldSuspend(state: BillingState): boolean {
    // Suspend if canceled or expired
    if (state.subscriptionStatus === 'canceled' || state.subscriptionStatus === 'expired') {
      return true
    }

    // Suspend if past_due with active dunning > 7 days
    if (state.subscriptionStatus === 'past_due' && state.hasActiveDunning && state.daysPastDue >= 7) {
      return true
    }

    return false
  }
}

export const billingStateService = new BillingStateService()
```

### Step 2: Update License Middleware

**Files to Modify:**
- `src/lib/raas-gate-quota.ts` - Add billing state check

```typescript
import { billingStateService } from '@/services/billing-state-service'

export async function licenseValidationMiddleware(
  request: Request,
  options?: { requireFeature?: string }
): Promise<LicenseMiddlewareResult> {
  // ... existing license validation ...

  // Get org ID from license
  const orgId = license.orgId

  if (orgId) {
    // Check billing state
    const billingState = await billingStateService.getBillingState(orgId)

    // Check if should suspend
    if (billingStateService.shouldSuspend(billingState)) {
      return {
        allowed: false,
        license,
        error: 'Subscription suspended due to non-payment',
        statusCode: 403,
      }
    }

    // Check grace period
    if (billingState.subscriptionStatus === 'past_due' && !billingState.hasActiveDunning) {
      if (billingState.gracePeriodRemaining && billingState.gracePeriodRemaining > 0) {
        // Allow but log warning
        console.warn('[LicenseMiddleware] Subscription past_due, grace period remaining', {
          orgId,
          gracePeriodRemaining: billingState.gracePeriodRemaining,
        })
      } else {
        return {
          allowed: false,
          license,
          error: 'Subscription past due - grace period expired',
          statusCode: 403,
        }
      }
    }
  }

  return { allowed: true, license }
}
```

### Step 3: Add Webhook Listener

**Files to Modify:**
- `src/lib/stripe-billing-webhook-handler.ts` - Add subscription state refresh

```typescript
// In webhook handler for customer.subscription.updated
await billingStateService.invalidateCache(event.data.object.customer)

// In webhook handler for invoice.payment_failed
await billingStateService.invalidateCache(event.data.object.customer)
```

### Step 4: Add Cache Invalidation

**Files to Modify:**
- `src/services/billing-state-service.ts` - Add invalidate method

```typescript
invalidateCache(orgId: string): void {
  this.cache.delete(orgId)
}

invalidateAll(): void {
  this.cache.clear()
}
```

## Todo List

- [ ] Create BillingStateService
- [ ] Implement subscription status checks
- [ ] Implement dunning state integration
- [ ] Implement grace period logic
- [ ] Add shouldSuspend() method
- [ ] Update license middleware to call billing service
- [ ] Add cache invalidation on webhook
- [ ] Add unit tests for billing state logic
- [ ] Test with Stripe test mode subscriptions

## Success Criteria

- [ ] Active subscriptions allowed
- [ ] Canceled subscriptions blocked (403)
- [ ] Expired subscriptions blocked (403)
- [ ] Past due without dunning allowed (48h grace)
- [ ] Past due with dunning > 7 days blocked
- [ ] Cache invalidates on webhook events
- [ ] Billing state check < 5ms (cached)

## Stripe Test Scenarios

| Test Case | Stripe State | Expected Result |
|-----------|--------------|-----------------|
| Active sub | `status: 'active'` | ✅ 200 OK |
| Past due (new) | `status: 'past_due'`, no dunning | ✅ 200 OK (grace) |
| Past due (old) | `status: 'past_due'`, dunning > 7 days | ❌ 403 |
| Canceled | `status: 'canceled'` | ❌ 403 |
| Expired | `status: 'expired'` | ❌ 403 |
| No sub | No subscription record | ❌ 403 (or free tier) |

## Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Webhook delays | Poll state every 5 min as fallback |
| Cache stale | 5-min TTL + webhook invalidation |
| Grace period abuse | Log all grace period accesses |

## Next Steps

After billing sync is implemented, proceed to [Phase 6.4](./phase-04-suspension-logic.md) for suspension logic.

---

_Created: 2026-03-09_
