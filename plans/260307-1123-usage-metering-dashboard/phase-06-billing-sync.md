---
phase: 6
title: Billing Sync Webhooks
status: complete
effort: 1.5h
---

# Phase 6: Billing Sync Webhooks - COMPLETE

## Implementation Summary

### ✅ Completed Components

1. **Stripe Usage Record Types** - `src/types/payments.ts`
   - `StripeMeteredPrice` - Metered billing price configuration
   - `StripeUsageRecord` - Usage record API response
   - `StripeUsageRecordCreate` - Create usage record request
   - `StripeUsageRecordSummary` - Usage summary for reconciliation
   - `UsageReconciliationResult` - Reconciliation report structure

2. **Edge Functions**
   - `stripe-usage-record/index.ts` - Report usage to Stripe API
   - Supports idempotency keys for retry
   - Dry run mode for testing
   - Batch processing with partial success handling

3. **Reconciliation Script**
   - `src/scripts/reconcile-stripe-usage.ts`
   - Compares Supabase vs Stripe usage
   - Identifies discrepancies
   - Generates recommendations

4. **Database Migration**
   - `supabase/migrations/202603071200_stripe_usage_reconciliation.sql`
   - Indexes for subscription_item_id tracking
   - `daily_usage_summary` view for reporting
   - `check_stripe_usage_reported()` function for idempotency

## Overview

Sync usage events to Stripe Billing (Metered Billing) and Polar.sh for usage-based billing. Usage events trigger automatic invoice updates.

## Context Links

- **Stripe Webhook:** `supabase/functions/stripe-webhook/index.ts` - Existing webhook
- **Polar Webhook:** `supabase/functions/polar-webhook/index.ts` - Existing webhook
- **Usage Analytics:** `supabase/functions/usage-analytics/index.ts` - Has webhook ingestion

## Key Insights

1. **Stripe Metered Billing** - Track usage, bill at end of period
2. **Polar.sh** - May not have native metered billing, use custom events
3. **Idempotency** - Already implemented in `usage-analytics` function
4. **Async processing** - Don't block user actions on billing sync

## Requirements

### Functional

- [ ] Sync usage events to Stripe Metered Billing
- [ ] Sync usage events to Polar.sh events
- [ ] Idempotency (no duplicate billing events)
- [ ] Retry failed syncs (DLQ pattern)
- [ ] Dashboard shows billing status

### Non-Functional

- Async (non-blocking)
- Idempotent (safe to retry)
- Auditable (all syncs logged)

## Architecture

### Billing Sync Flow

```
Usage Event → usage_records insert → Database Trigger → Edge Function
                                                       │
                         ┌─────────────────────────────┼─────────────────────────────┐
                         ▼                                                     ▼
                Stripe Metered Billing                                 Polar.sh Events
                (price_id: usage_tokens)                               (custom:event)
```

### Stripe Metered Billing Setup

```typescript
// Create metered price in Stripe
{
  product: 'prod_xxx',
  unit_amount: 100, // $0.01 per 10 tokens
  currency: 'usd',
  billing_scheme: 'per_unit',
  tiers_mode: 'volume',
  tiers: [
    { up_to: 10000, unit_amount: 100 },
    { up_to: 100000, unit_amount: 80 },
    { up_to: null, unit_amount: 50 },
  ],
}
```

## Implementation Steps

### Step 1: Create Stripe Billing Sync Function

**File:** `supabase/functions/stripe-usage-sync/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.0.0?deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface SyncRequest {
  user_id: string
  subscription_id: string
  events: Array<{
    feature: string
    quantity: number
    timestamp: string
  }>
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const payload: SyncRequest = await req.json()
    const { user_id, subscription_id, events } = payload

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Get subscription to get customer and current period
    const subscription = await stripe.subscriptions.retrieve(subscription_id)
    const customer = subscription.customer as string
    const current_period_start = Math.floor(new Date(subscription.current_period_start * 1000).getTime() / 1000)
    const current_period_end = Math.floor(new Date(subscription.current_period_end * 1000).getTime() / 1000)

    // Group events by price (feature)
    const eventsByPrice = new Map<string, number>()
    events.forEach(event => {
      const priceId = getStripePriceId(event.feature)
      const current = eventsByPrice.get(priceId) || 0
      eventsByPrice.set(priceId, current + event.quantity)
    })

    // Report usage to Stripe for each price
    for (const [priceId, quantity] of eventsByPrice.entries()) {
      await stripe.subscriptionItems.createUsageRecord(
        await getSubscriptionItemId(subscription_id, priceId),
        {
          quantity,
          timestamp: current_period_start,
          action: 'set', // Set total usage (idempotent)
        }
      )
    }

    return new Response(JSON.stringify({
      success: true,
      subscription_id,
      events_synced: events.length,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[StripeUsageSync] Error:', error)
    return new Response(JSON.stringify({
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function getStripePriceId(feature: string): string {
  const mapping: Record<string, string> = {
    'api_call': 'price_api_calls',
    'tokens': 'price_tokens',
    'model_inference': 'price_inferences',
    'agent_execution': 'price_agents',
  }
  return mapping[feature] || 'price_api_calls'
}

async function getSubscriptionItemId(subscriptionId: string, priceId: string): Promise<string> {
  // Query subscription items to find the one with matching price
  // Cache this result to avoid repeated lookups
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
  })
  const items = await stripe.subscriptionItems.list({
    subscription: subscriptionId,
    price: priceId,
    limit: 1,
  })
  if (items.data.length === 0) {
    throw new Error(`No subscription item found for price ${priceId}`)
  }
  return items.data[0].id
}
```

### Step 2: Create Polar Events Sync Function

**File:** `supabase/functions/polar-usage-sync/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface PolarEvent {
  event_id: string
  customer_id: string
  feature: string
  quantity: number
  metadata?: Record<string, unknown>
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const payload: PolarEvent = await req.json()
    const { event_id, customer_id, feature, quantity, metadata } = payload

    // Polar.sh doesn't have native metered billing
    // Use custom events for tracking
    const response = await fetch('https://api.polar.sh/v1/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('POLAR_ACCESS_TOKEN')}`,
      },
      body: JSON.stringify({
        event_id,
        customer_id,
        event_type: `usage.${feature}`,
        quantity,
        metadata: {
          ...metadata,
          synced_at: new Date().toISOString(),
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Polar API error: ${response.statusText}`)
    }

    return new Response(JSON.stringify({
      success: true,
      event_id,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[PolarUsageSync] Error:', error)
    return new Response(JSON.stringify({
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

### Step 3: Create Database Trigger for Auto-Sync

**File:** `supabase/migrations/XXXX_add_usage_sync_trigger.sql`

```sql
-- Create function to trigger billing sync
create or replace function sync_usage_to_billing()
returns trigger as $$
begin
  -- Only sync if quantity > 0
  if NEW.quantity > 0 then
    -- Queue for async sync (use pg_net or insert to sync queue table)
    insert into usage_billing_sync_queue (
      user_id,
      license_id,
      feature,
      quantity,
      metadata,
      recorded_at,
      status
    ) values (
      NEW.user_id,
      NEW.license_id,
      NEW.feature,
      NEW.quantity,
      NEW.metadata,
      NEW.recorded_at,
      'pending'
    );
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

-- Create trigger
create trigger on_usage_record_inserted
after insert on usage_records
for each row
execute function sync_usage_to_billing();
```

### Step 4: Create Sync Queue Table

**File:** `supabase/migrations/XXXX_create_sync_queue_table.sql`

```sql
create table usage_billing_sync_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  license_id uuid references raas_licenses(id),
  feature text not null,
  quantity bigint not null,
  metadata jsonb,
  recorded_at timestamptz not null,
  status text not null default 'pending', -- pending, syncing, synced, failed
  stripe_synced_at timestamptz,
  polar_synced_at timestamptz,
  error_message text,
  retry_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_sync_queue_status on usage_billing_sync_queue(status);
create index idx_sync_queue_retry on usage_billing_sync_queue(retry_count, created_at);
```

### Step 5: Create DLQ Retry Function

**File:** `supabase/functions/usage-billing-sync/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  )

  // Fetch pending sync jobs (limit 100)
  const { data: jobs } = await supabase
    .from('usage_billing_sync_queue')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(100)

  if (!jobs || jobs.length === 0) {
    return new Response(JSON.stringify({ synced: 0 }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let synced = 0
  let failed = 0

  for (const job of jobs) {
    try {
      // Update status to syncing
      await supabase
        .from('usage_billing_sync_queue')
        .update({ status: 'syncing', updated_at: new Date().toISOString() })
        .eq('id', job.id)

      // Sync to Stripe
      await syncToStripe(job)
      await supabase
        .from('usage_billing_sync_queue')
        .update({
          status: 'synced',
          stripe_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id)

      // Sync to Polar
      await syncToPolar(job)
      await supabase
        .from('usage_billing_sync_queue')
        .update({
          polar_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id)

      synced++
    } catch (error) {
      console.error('[UsageBillingSync] Job failed:', error)
      failed++

      // Increment retry count
      const newRetryCount = job.retry_count + 1
      if (newRetryCount >= 3) {
        // Mark as failed after 3 retries
        await supabase
          .from('usage_billing_sync_queue')
          .update({
            status: 'failed',
            error_message: error.message,
            retry_count: newRetryCount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id)
      } else {
        // Re-queue for retry
        await supabase
          .from('usage_billing_sync_queue')
          .update({
            status: 'pending',
            retry_count: newRetryCount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id)
      }
    }
  }

  return new Response(JSON.stringify({ synced, failed }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})

async function syncToStripe(job: any) {
  // Call stripe-usage-sync function
  const response = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/stripe-usage-sync`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        user_id: job.user_id,
        events: [{
          feature: job.feature,
          quantity: job.quantity,
          timestamp: job.recorded_at,
        }],
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Stripe sync failed: ${response.statusText}`)
  }
}

async function syncToPolar(job: any) {
  // Call polar-usage-sync function
  const response = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/polar-usage-sync`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        event_id: job.id,
        customer_id: job.user_id,
        feature: job.feature,
        quantity: job.quantity,
        metadata: job.metadata,
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Polar sync failed: ${response.statusText}`)
  }
}
```

## Todo List

- [ ] Create `supabase/functions/stripe-usage-sync/index.ts`
- [ ] Create `supabase/functions/polar-usage-sync/index.ts`
- [ ] Create `supabase/migrations/XXXX_add_usage_sync_trigger.sql`
- [ ] Create `supabase/migrations/XXXX_create_sync_queue_table.sql`
- [ ] Create `supabase/functions/usage-billing-sync/index.ts`
- [ ] Add cron job to run billing sync every 5 minutes
- [ ] Run `npx supabase db push`
- [ ] Deploy Edge Functions

## Success Criteria

1. **Stripe Sync:** Usage events appear in Stripe Billing dashboard
2. **Polar Sync:** Events logged in Polar.sh
3. **Idempotency:** Retry doesn't create duplicates
4. **DLQ Works:** Failed syncs retry up to 3 times

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Duplicate billing | High | Idempotency keys, `action: 'set'` |
| Sync failures | Medium | DLQ with 3 retries |
| API rate limits | Medium | Batch syncs, backoff |

## Security Considerations

- Never expose Stripe/Polar keys to frontend
- Use service role key for Edge Functions only
- Audit logging for all billing events

## Next Steps

After Phase 6 complete:
1. Verify usage appears in Stripe dashboard
2. Test invoice generation with metered usage
3. Proceed to Phase 7 (Testing & Integration)

---

_Phase: 6/7 | Effort: 1.5h_
