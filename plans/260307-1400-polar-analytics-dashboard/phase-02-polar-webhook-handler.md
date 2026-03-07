---
title: "Phase 2 - Polar Webhook Handler"
description: "Enhance Edge Function to ingest all Polar events into analytics tables"
status: pending
priority: P1
effort: 3h
---

# Phase 2: Polar Webhook Handler

## Overview

Enhance existing `polar-webhook` Edge Function to ingest ALL events into `polar_webhook_events` table for analytics.

## Context Links

- Existing handler: `supabase/functions/polar-webhook/index.ts`
- Schema: `phase-01-analytics-schema.md`
- Research: `plans/reports/researcher-260307-polar-analytics-api.md`

## Key Insights

Current webhook handler only processes subscription lifecycle (activated/canceled/expired).

**Missing events for analytics:**
- `checkout.succeeded` - Revenue tracking
- `order.paid` - One-time purchase revenue
- `order.refunded` - Churn/refund tracking
- `customer.created` - Acquisition tracking
- `subscription.updated` - MRR changes (expansion/contraction)

## Requirements

### Functional

1. Ingest ALL Polar webhook events into `polar_webhook_events` table
2. Signature verification (HMAC-SHA256 with timestamp)
3. Idempotency handling (event_id unique constraint)
4. Extract key fields: customer_id, subscription_id, amount, currency
5. Trigger downstream processing (cohort updates, revenue snapshots)

### Non-Functional

1. Response time < 500ms (async processing)
2. Error handling with retry queue for failed events
3. Audit logging for all webhook attempts

## Architecture

```
Polar.sh
   │
   │ Webhook POST (signed)
   ▼
┌─────────────────────────────────┐
│  supabase/functions/polar-      │
│  webhook/index.ts               │
│                                 │
│  1. Verify signature            │
│  2. Parse event                 │
│  3. Insert into polar_events    │
│  4. Async process by type       │
└────────────┬────────────────────┘
             │
             ▼
   ┌─────────────────────┐
   │ Event Processors:   │
   │ - checkout.succeeded│
   │ - order.paid        │
   │ - subscription.*    │
   │ - customer.created  │
   └─────────────────────┘
```

## Related Code Files

### To Create

- `supabase/functions/polar-webhook/analytics-processor.ts` - Event processing logic
- `supabase/functions/polar-webhook/cohort-updater.ts` - Update cohort tables

### To Modify

- `supabase/functions/polar-webhook/index.ts` - Add event ingestion

## Implementation Steps

### Step 1: Add Event Ingestion to Main Handler

```typescript
// In polar-webhook/index.ts, add after signature verification:

const { data: event, error: insertError } = await supabase
  .from('polar_webhook_events')
  .insert({
    event_id: event.data.id as string,
    event_type: event.type,
    customer_id: event.data.customer_id as UUID | null,
    subscription_id: event.data.subscription_id as UUID | null,
    order_id: event.data.order_id as UUID | null,
    product_id: event.data.product_id as UUID | null,
    amount_cents: event.data.amount as number | null,
    currency: event.data.currency as string | null,
    payload: event,
    processed: false,
  })
  .select()
  .single()

if (insertError && !insertError.message.includes('duplicate')) {
  console.error('[PolarWebhook] Failed to insert event:', insertError)
}
```

### Step 2: Create Analytics Processor

Create `analytics-processor.ts`:

```typescript
export async function processPolarEvent(
  event: PolarWebhookEvent,
  supabase: SupabaseClient
) {
  switch (event.event_type) {
    case 'checkout.succeeded':
      return handleCheckoutSucceeded(event, supabase)
    case 'order.paid':
      return handleOrderPaid(event, supabase)
    case 'order.refunded':
      return handleOrderRefunded(event, supabase)
    case 'customer.created':
      return handleCustomerCreated(event, supabase)
    case 'subscription.activated':
    case 'subscription.updated':
    case 'subscription.canceled':
      // Existing logic
      break
  }
}

async function handleCheckoutSucceeded(
  event: PolarWebhookEvent,
  supabase: SupabaseClient
) {
  // 1. Create/update customer cohort
  // 2. Update daily revenue snapshot
  // 3. Mark event as processed
}

async function handleCustomerCreated(
  event: PolarWebhookEvent,
  supabase: SupabaseClient
) {
  // Insert into customer_cohorts table
  const { data: customer } = event.payload.data

  await supabase.from('customer_cohorts').insert({
    customer_id: customer.id,
    cohort_month: truncateToMonth(customer.created_at),
    initial_tier: 'free', // Default until first purchase
    current_tier: 'free',
    status: 'active',
    first_purchase_date: null,
  })
}
```

### Step 3: Add Cohort Updater

Create `cohort-updater.ts`:

```typescript
export async function updateCohortOnPurchase(
  customerId: string,
  amountCents: number,
  tier: string,
  supabase: SupabaseClient
) {
  // Update customer_cohorts with purchase info
  const { error } = await supabase
    .from('customer_cohorts')
    .update({
      current_tier: tier,
      current_mrr_cents: amountCents,
      first_purchase_date: new Date(),
      lifetime_revenue_cents: amountCents,
      total_orders: 1,
    })
    .eq('customer_id', customerId)

  return !error
}
```

### Step 4: Handle Idempotency

```typescript
// Use INSERT ... ON CONFLICT DO NOTHING
const { error } = await supabase
  .from('polar_webhook_events')
  .insert({...})
  .onConflict('event_id')
  .ignoreDuplicates()
```

## Todo List

- [ ] Add event ingestion INSERT to main webhook handler
- [ ] Create `analytics-processor.ts` with event handlers
- [ ] Create `cohort-updater.ts` for cohort table updates
- [ ] Implement `checkout.succeeded` handler
- [ ] Implement `order.paid` handler
- [ ] Implement `order.refunded` handler
- [ ] Implement `customer.created` handler
- [ ] Add idempotency handling (ON CONFLICT)
- [ ] Add error handling with dead letter queue
- [ ] Test all event types with Polar sandbox
- [ ] Deploy Edge Function

## Success Criteria

- [ ] ALL Polar events stored in `polar_webhook_events`
- [ ] Duplicate events handled (idempotency works)
- [ ] Customer cohorts created/updated on events
- [ ] Revenue snapshots updated correctly
- [ ] Signature verification passes
- [ ] Function responds < 500ms

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Webhook processing slow | Async processing, return 200 quickly |
| Duplicate events | event_id UNIQUE constraint |
| Invalid payload | Schema validation before insert |
| Missing customer_id | Store in payload for reprocessing later |

## Security Considerations

- HMAC-SHA256 signature verification (existing)
- Timestamp validation (prevent replay attacks)
- RLS on `polar_webhook_events` (service role only)
- Input validation on all JSON fields

## Next Steps

After webhook handler is complete:
1. Build React hooks to query analytics data
2. Create dashboard UI components
3. Backfill historical Stripe data
