---
title: "Phase 5 - Backfill Migration Script"
description: "Create script to backfill historical Stripe data into analytics tables"
status: pending
priority: P3
effort: 1h
---

# Phase 5: Backfill Migration Script

## Overview

Create migration script to backfill historical Stripe data into local analytics tables for continuous analytics after Polar.sh migration.

## Context Links

- Existing schema: `supabase/migrations/202603071500_revenue_analytics_schema.sql`
- Research: `plans/reports/researcher-260307-polar-analytics-api.md` (Backfill Strategy section)
- Stripe doc: `docs/stripe-usage-metering-setup.md`

## Key Insights

From research findings:
- Polar.sh API doesn't expose Stripe data directly
- Historical Stripe subscriptions cannot be "backfilled" as active Polar subscriptions
- **Can** create historical `Order` records and `revenue_snapshots` from Stripe data
- Use backfill for analytics continuity, not for Polar subscription management

## Requirements

### Functional

1. Extract historical Stripe data (customers, subscriptions, charges)
2. Transform to local analytics schema format
3. Load into `customer_cohorts`, `revenue_snapshots`, `polar_webhook_events` (as historical)
4. Idempotency handling (don't duplicate on re-run)
5. Dry-run mode for testing

### Non-Functional

1. Run as Node.js script (CLI)
2. Progress logging (every 100 records)
3. Error handling with retry
4. Transaction safety (rollback on failure)

## Architecture

```
┌─────────────────┐
│  Stripe API     │
│  - Customers    │
│  - Subscriptions│
│  - Invoices     │
│  - Charges      │
└────────┬────────┘
         │ Extract (Stripe SDK)
         ▼
┌─────────────────┐
│  Backfill       │
│  Script         │
│  (Node.js CLI)  │
└────────┬────────┘
         │ Transform & Load
         ▼
┌─────────────────┐
│  Supabase       │
│  - customer_    │
│    cohorts      │
│  - revenue_     │
│    snapshots    │
│  - polar_       │
│    webhook_     │
│    events       │
│    (historical) │
└─────────────────┘
```

## Related Code Files

### To Create

- `src/scripts/backfill-stripe-analytics.ts` - Main backfill script
- `supabase/migrations/202603071700_backfill_historical_data.sql` - Helper SQL functions

### To Modify

- None (backfill is additive, doesn't modify existing code)

## Implementation Steps

### Step 1: Create Backfill Script

Create `src/scripts/backfill-stripe-analytics.ts`:

```typescript
/**
 * Backfill Stripe historical data into analytics tables
 *
 * Usage:
 *   npx tsx src/scripts/backfill-stripe-analytics.ts
 *   npx tsx src/scripts/backfill-stripe-analytics.ts --dry-run
 *   npx tsx src/scripts/backfill-stripe-analytics.ts --days 365
 */

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface BackfillOptions {
  dryRun: boolean
  days: number
  batchSize: number
}

async function backfill(options: BackfillOptions) {
  const { dryRun, days, batchSize } = options
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  console.log(`Starting backfill...`)
  console.log(`  Dry run: ${dryRun}`)
  console.log(`  Days: ${days}`)
  console.log(`  Cutoff: ${cutoffDate.toISOString()}`)

  // 1. Backfill Customers → customer_cohorts
  console.log('\n[1/3] Backfilling customers...')
  await backfillCustomers(cutoffDate, batchSize, dryRun)

  // 2. Backfill Subscriptions/Invoices → revenue_snapshots
  console.log('\n[2/3] Backfilling revenue data...')
  await backfillRevenue(cutoffDate, batchSize, dryRun)

  // 3. Backfill Charges → polar_webhook_events (as historical)
  console.log('\n[3/3] Backfilling events...')
  await backfillEvents(cutoffDate, batchSize, dryRun)

  console.log('\n✅ Backfill complete!')
}

async function backfillCustomers(
  cutoffDate: Date,
  batchSize: number,
  dryRun: boolean
) {
  let inserted = 0
  let skipped = 0

  for await (const customer of stripe.customers.list({
    created: { gte: Math.floor(cutoffDate.getTime() / 1000) },
    limit: batchSize,
  })) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('customer_cohorts')
      .select('id')
      .eq('customer_id', customer.id)
      .maybeSingle()

    if (existing) {
      skipped++
      continue
    }

    const cohortMonth = new Date(customer.created * 1000)
    cohortMonth.setDate(1)
    cohortMonth.setHours(0, 0, 0, 0)

    if (!dryRun) {
      const { error } = await supabase
        .from('customer_cohorts')
        .insert({
          customer_id: customer.id,
          cohort_month: cohortMonth.toISOString().split('T')[0],
          initial_tier: 'free', // Will be updated by revenue backfill
          current_tier: 'free',
          status: customer.deleted ? 'churned' : 'active',
          first_purchase_date: null, // Will be updated by revenue backfill
          lifetime_revenue_cents: 0, // Will be updated by revenue backfill
          total_orders: 0,
        })

      if (error) {
        console.error(`  Error inserting customer ${customer.id}:`, error)
        continue
      }
    }

    inserted++
    if (inserted % 100 === 0) {
      console.log(`  Inserted ${inserted} customers...`)
    }
  }

  console.log(`  ✓ Inserted: ${inserted}, Skipped: ${skipped}`)
}

async function backfillRevenue(
  cutoffDate: Date,
  batchSize: number,
  dryRun: boolean
) {
  let inserted = 0
  let totalRevenue = 0

  // Backfill invoices as revenue snapshots
  for await (const invoice of stripe.invoices.list({
    created: { gte: Math.floor(cutoffDate.getTime() / 1000) },
    limit: batchSize,
    status: 'paid', // Only paid invoices
  })) {
    const snapshotDate = new Date(invoice.created * 1000).toISOString().split('T')[0]

    if (!dryRun) {
      // Determine tier from invoice line items
      const tier = determineTierFromInvoice(invoice)
      const amountCents = invoice.amount_paid

      // Update customer cohort with revenue
      const { error } = await supabase.rpc('update_cohort_revenue', {
        p_customer_id: invoice.customer as string,
        p_amount_cents: amountCents,
        p_tier: tier,
        p_invoice_date: snapshotDate,
      })

      if (error) {
        console.error(`  Error updating revenue for ${invoice.id}:`, error)
        continue
      }

      // Insert/update daily revenue snapshot
      await supabase.rpc('upsert_daily_revenue_snapshot', {
        p_snapshot_date: snapshotDate,
        p_stripe_revenue: amountCents,
        p_stripe_subscriptions: 1,
      })
    }

    inserted++
    totalRevenue += invoice.amount_paid
    if (inserted % 100 === 0) {
      console.log(`  Inserted ${inserted} invoices (${(totalRevenue / 100).toLocaleString()} USD)...`)
    }
  }

  console.log(`  ✓ Inserted: ${inserted}, Total Revenue: ${(totalRevenue / 100).toLocaleString()} USD`)
}

async function backfillEvents(
  cutoffDate: Date,
  batchSize: number,
  dryRun: boolean
) {
  let inserted = 0

  // Create synthetic webhook events for historical Stripe data
  for await (const charge of stripe.charges.list({
    created: { gte: Math.floor(cutoffDate.getTime() / 1000) },
    limit: batchSize,
  })) {
    const eventId = `stripe_charge_${charge.id}`

    if (!dryRun) {
      const { error } = await supabase
        .from('polar_webhook_events')
        .insert({
          event_id: eventId,
          event_type: 'order.paid',
          customer_id: charge.customer as string,
          amount_cents: charge.amount,
          currency: charge.currency,
          payload: {
            source: 'stripe',
            charge: charge,
            backfilled: true,
          },
          processed: true,
          processed_at: new Date(charge.created * 1000).toISOString(),
        })
        .onConflict('event_id')
        .ignoreDuplicates()

      if (error) {
        console.error(`  Error inserting event ${eventId}:`, error)
        continue
      }
    }

    inserted++
    if (inserted % 100 === 0) {
      console.log(`  Inserted ${inserted} events...`)
    }
  }

  console.log(`  ✓ Inserted: ${inserted} events`)
}

// Helper functions
function determineTierFromInvoice(invoice: Stripe.Invoice): string {
  // Check invoice line items for plan/subscription info
  const lineItem = invoice.lines.data[0]
  if (!lineItem) return 'free'

  const planName = (lineItem.plan?.nickname || '').toLowerCase()
  if (planName.includes('master')) return 'master'
  if (planName.includes('enterprise')) return 'enterprise'
  if (planName.includes('premium')) return 'premium'
  if (planName.includes('basic') || planName.includes('pro')) return 'basic'
  return 'free'
}

// CLI entry point
const args = process.argv.slice(2)
const options: BackfillOptions = {
  dryRun: args.includes('--dry-run'),
  days: parseInt(args.find(a => a.startsWith('--days='))?.split('=')[1] || '90'),
  batchSize: 100,
}

backfill(options).catch(console.error)
```

### Step 2: Create SQL Helper Functions

Create `supabase/migrations/202603071700_backfill_historical_data.sql`:

```sql
-- Update cohort revenue from invoice
CREATE OR REPLACE FUNCTION update_cohort_revenue(
  p_customer_id TEXT,
  p_amount_cents INTEGER,
  p_tier TEXT,
  p_invoice_date DATE
)
RETURNS void AS $$
BEGIN
  UPDATE customer_cohorts
  SET
    current_tier = p_tier,
    current_mrr_cents = CASE
      WHEN p_tier = 'basic' THEN 10000
      WHEN p_tier = 'premium' THEN 50000
      WHEN p_tier = 'enterprise' THEN 200000
      WHEN p_tier = 'master' THEN 1000000
      ELSE 0
    END,
    first_purchase_date = LEAST(COALESCE(first_purchase_date, p_invoice_date), p_invoice_date),
    lifetime_revenue_cents = COALESCE(lifetime_revenue_cents, 0) + p_amount_cents,
    total_orders = COALESCE(total_orders, 0) + 1,
    last_active_date = p_invoice_date,
    updated_at = NOW()
  WHERE customer_id = p_customer_id;
END;
$$ LANGUAGE plpgsql;

-- Upsert daily revenue snapshot
CREATE OR REPLACE FUNCTION upsert_daily_revenue_snapshot(
  p_snapshot_date DATE,
  p_stripe_revenue INTEGER,
  p_stripe_subscriptions INTEGER
)
RETURNS void AS $$
BEGIN
  INSERT INTO revenue_snapshots (
    snapshot_date,
    gmv_total,
    gmv_subscription,
    stripe_orders,
    stripe_subscriptions,
    source_breakdown
  )
  VALUES (
    p_snapshot_date,
    p_stripe_revenue,
    p_stripe_revenue,
    1,
    p_stripe_subscriptions,
    jsonb_build_object('stripe', p_stripe_revenue)
  )
  ON CONFLICT (snapshot_date) DO UPDATE SET
    gmv_total = revenue_snapshots.gmv_total + EXCLUDED.gmv_total,
    gmv_subscription = revenue_snapshots.gmv_subscription + EXCLUDED.gmv_subscription,
    stripe_orders = revenue_snapshots.stripe_orders + 1,
    stripe_subscriptions = revenue_snapshots.stripe_subscriptions + EXCLUDED.stripe_subscriptions,
    source_breakdown = revenue_snapshots.source_breakdown || EXCLUDED.source_breakdown;
END;
$$ LANGUAGE plpgsql;
```

### Step 3: Test Backfill Script

```bash
# Dry run (no data written)
npx tsx src/scripts/backfill-stripe-analytics.ts --dry-run --days 30

# Real backfill (last 90 days)
npx tsx src/scripts/backfill-stripe-analytics.ts --days 90

# Full backfill (last 365 days)
npx tsx src/scripts/backfill-stripe-analytics.ts --days 365
```

### Step 4: Verify Backfill Results

```sql
-- Check customer cohorts
SELECT cohort_month, COUNT(*) as cohort_size
FROM customer_cohorts
GROUP BY cohort_month
ORDER BY cohort_month;

-- Check revenue snapshots
SELECT snapshot_date, gmv_total, stripe_orders
FROM revenue_snapshots
WHERE source_breakdown->>'stripe' IS NOT NULL
ORDER BY snapshot_date DESC
LIMIT 30;

-- Check backfilled events
SELECT event_type, COUNT(*) as count
FROM polar_webhook_events
WHERE payload->>'backfilled' = 'true'
GROUP BY event_type;
```

## Todo List

- [ ] Create `src/scripts/backfill-stripe-analytics.ts`
- [ ] Create SQL helper functions migration
- [ ] Add `.env.example` entries for Stripe keys
- [ ] Test dry-run mode
- [ ] Test real backfill (small dataset)
- [ ] Verify data integrity after backfill
- [ ] Document backfill process in docs/

## Success Criteria

- [ ] Script runs without errors
- [ ] Dry-run mode shows what would be inserted
- [ ] Customer cohorts created from Stripe customers
- [ ] Revenue snapshots populated from Stripe invoices
- [ ] Events stored for historical analysis
- [ ] Re-running script doesn't duplicate data (idempotency)

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Script too slow on large datasets | Use batch processing, progress logging |
| Duplicate data on re-run | Use ON CONFLICT ... IGNORE |
| Stripe API rate limits | Add delays between batches |
| Timezone issues with dates | Use UTC throughout |

## Next Steps

After backfill is complete:
1. Verify analytics dashboard shows historical data
2. Set up Polar.sh webhooks for new data
3. Document migration process for future reference
