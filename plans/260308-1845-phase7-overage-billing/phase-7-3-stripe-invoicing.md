---
title: "Phase 7.3: Stripe Invoicing for Overages"
description: "Webhook events trigger Stripe invoice creation with Usage Records API"
status: pending
priority: P1
effort: 2h
---

# Phase 7.3: Stripe Invoicing for Overages

## Context Links

- Related: `src/lib/stripe-billing-client.ts` - Existing Stripe client
- Related: `supabase/functions/stripe-usage-record/index.ts` - Edge function
- Research: `../reports/researcher-260308-overage-billing-patterns.md`

## Overview

Integrate with Stripe Usage Records API for automated overage invoicing using webhook events.

## Key Insights

From research:
- Stripe supports `metered` pricing with automatic aggregation
- Usage Records can use `increment` or `set` actions
- Invoices generated automatically at billing period end
- Webhooks notify when invoices created/paid/failed

## Requirements

### Functional
1. Create metered prices for each overage metric
2. Report usage to Stripe via Usage Records API
3. Support both `increment` (delta) and `set` (absolute) actions
4. Handle webhook events for invoice lifecycle
5. Sync usage records with Stripe for reconciliation

### Non-Functional
- Idempotent usage reporting
- Retry failed Stripe API calls
- Audit trail for all Stripe operations

## Stripe Integration

```typescript
// 1. Create metered price (one-time setup)
const price = await stripe.prices.create({
  unit_amount: 100,  // $0.01 per unit
  currency: 'usd',
  recurring: {
    interval: 'month',
    usage_type: 'metered',
    aggregate: 'sum'  // or 'last', 'max', 'avg'
  },
  product: 'prod_xxx'
})

// 2. Report usage (per request or batched)
await stripe.usageRecords.create({
  subscription_item: 'si_xxx',
  quantity: 1,  // or batch sum
  timestamp: Math.floor(Date.now() / 1000),
  action: 'increment'  // or 'set'
})
```

## Webhook Events

| Event | Handler |
|-------|---------|
| `invoice.created` | Preview with overages |
| `invoice.finalized` | Send email notification |
| `invoice.payment_succeeded` | Clear overage balance |
| `invoice.payment_failed` | Trigger dunning |

## Implementation Steps

1. Create Stripe metered prices for overage metrics
2. Enhance stripe-usage-record edge function
3. Add webhook handlers for invoice events
4. Create usage sync reconciliation job
5. Add admin dashboard for usage review

## Todo List

- [ ] Setup Stripe metered prices
- [ ] Enhance usage record edge function
- [ ] Add webhook event handlers
- [ ] Create reconciliation job
- [ ] Write integration tests

## Success Criteria

1. Usage reported to Stripe accurately
2. Invoices include overage line items
3. Webhook events processed correctly

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Usage sync drift | High | Daily reconciliation job |
| Stripe API failures | Medium | Retry with backoff, dead letter queue |
