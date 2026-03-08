---
title: "Phase 7: Overage Billing and Quota Enforcement"
description: "Implement overage tracking, hard quota enforcement, Stripe invoicing, and tenant-specific rate limiting"
status: complete
priority: P1
effort: 8h
branch: main
tags: [phase7, billing, quota-enforcement, stripe, overage, dunning]
created: 2026-03-08
completed: 2026-03-08
---

# Phase 7: Overage Billing and Quota Enforcement

## Overview

Build on Phase 6 multi-tenant license enforcement to add overage billing capabilities, hard quota enforcement, and Stripe integration for usage-based invoicing.

**Status:** ✅ **COMPLETE** - Core implementation done. See report: `plans/reports/phase7-overage-dunning-260308-1930-complete.md`

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Request Flow                                  │
├─────────────────────────────────────────────────────────────────┤
│ 1. JWT/API Key → Extract Tenant Context                         │
│ 2. Rate Limiter → Check per-second/minute limits                │
│ 3. Quota Check → Compare usage vs effective quota               │
│ 4. Overage Decision → Allow (bill) or Block (429)               │
│ 5. Usage Track → Record to Supabase + Stripe                    │
└─────────────────────────────────────────────────────────────────┘

Effective Quota = Base (Stripe) + Overrides + Grace Period
```

## Phases

| Phase | Component | Tests | Description |
|-------|-----------|-------|-------------|
| [7.1](./phase-7-1-overage-tracking.md) | Overage Tracking | 25 | Track usage exceeding quotas, calculate costs |
| [7.2](./phase-7-2-quota-enforcement.md) | Hard Enforcement | 30 | Block requests at limits, configurable modes |
| [7.3](./phase-7-3-stripe-invoicing.md) | Stripe Invoicing | 25 | Usage Records API, webhook events |
| [7.4](./phase-7-4-phase6-integration.md) | Phase 6 Integration | 20 | Tenant overrides, grace periods |
| [7.5](./phase-7-5-auth-alignment.md) | JWT/API Key Auth | 20 | Tenant context extraction |
| [7.6](./phase-7-6-testing.md) | Testing | 40 | Comprehensive test suite |

## Database Schema Changes

- `tenant_quota_overrides` - Per-tenant quota overrides (exists)
- `usage_records` - Detailed usage tracking (enhance)
- `overage_transactions` - Overage billing records (new)
- `stripe_usage_sync_log` - Stripe sync tracking (new)

## Edge Functions Required

- `usage-track` - Record usage events (exists - enhance)
- `stripe-usage-record` - Sync to Stripe (exists - enhance)
- `overage-calculator` - Calculate overage costs (new)
- `quota-enforcer` - Hard limit enforcement (new)

## Client Libraries

- `overage-tracking-client.ts` - Frontend overage helpers
- `quota-enforcement-client.ts` - Client-side quota checks
- `stripe-billing-client.ts` - Stripe integration (exists)

## Middleware Updates

- `tenant-context.ts` - Add overage context
- `rate-limiter-cloudflare.ts` - Add quota enforcement
- `usage-metering-middleware.ts` - Add overage tracking

## Test Strategy

1. Unit tests for overage calculation logic
2. Integration tests for Stripe sync
3. E2E tests for quota enforcement flow
4. Load tests for rate limiting at scale

## Success Criteria

1. ✅ Overage tracked accurately per metric type
2. ✅ Hard limits enforced (429 with overage info)
3. ✅ Stripe invoices created for overages
4. ✅ Tenant overrides affect overage calculation
5. ✅ Grace periods boost temporary quotas
6. ✅ JWT + API key auth both supported

## Unresolved Questions

1. Should overage billing be opt-in or opt-out per tenant?
2. What's the default grace period duration (7 vs 14 days)?
3. Should we support proration for mid-cycle plan changes?
