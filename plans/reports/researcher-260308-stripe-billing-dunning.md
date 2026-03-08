# Stripe Billing Best Practices Report - Overage & Dunning

**Date:** 2026-03-08
**Researcher:** researcher
**Project:** WellNexus (RaaS AgencyOS)
**Status:** Completed

---

## Executive Summary

WellNexus already has substantial Bill&ng infrastructure in place. This report synthesizes Stripe Billing best practices with the existing architecture.

**Key Finding:** The codebase already implements most Stripe Billing patterns correctly. The main gap is **dunning workflow configuration and email sequences**.

---

## 1. Stripe Usage Records API - Best Practices

### API Endpoint

```
POST https://api.stripe.com/v1/subscription_items/{subscription_item_id}/usage_records
```

### Request Format

```typescript
{
  subscription_item: string;  // si_xxxx
  quantity: number;
  timestamp?: number;        // Unix timestamp
  action?: 'set' | 'increment' | 'clear';  // Default: 'set'
  idempotency_key?: string;  // For retry idempotency
}
```

### Response Format

```typescript
{
  id: 'mbur_xxx',           // Usage record ID
  object: 'usage_record',
  quantity: number,
  subscription_item: 'si_xxx',
  timestamp: number,
  livemode: boolean,
  idempotency_key?: string
}
```

### Best Practices

1. **Idempotency:** Always use `idempotency_key` for retries
2. **Action Types:**
   - `set` - Replace usage with exact quantity (recommended for metered billing)
   - `increment` - Add to existing usage
   - `clear` - Reset usage to zero
3. **Timestamp:** Use UTC Unix timestamp; Stripe stores in UTC
4. **Rate Limiting:** Stripe allows ~100 usage records/second per subscription item

### Your Implementation

**File:** `supabase/functions/stripe-usage-record/index.ts`

✓ Correct endpoint usage
✓ Exponential backoff retry (3 retries)
✓ Idempotency key generation
✓ Audit logging via `log_stripe_usage_submission`
✓ Overage transaction sync back to DB
✗ **Missing:** Rate limiting control (no queue for high-volume usage)

---

## 2. Dunning Management Configuration

### What is Dunning?

Dunning is the automated process of collecting failed payments. Stripe handles this automatically with configurable email sequences.

### Stripe Dunning Configuration Options

| Setting | Default | Best Practice |
|---------|---------|---------------|
| Automatic dunning | Enabled | Enable for subscriptions |
| Dunning intervals | Day 3, 7, 14 | Configure based on churn tolerance |
| Email templates | Stripe defaults | Customize with brand assets |
| Payment attempt window | 3 days | Adjust per billing cycle |

### Configure Dunning via Dashboard

```
Dashboard → Billing → Subscriptions → Dunning Settings
```

### API Configuration (Stripe Connected Accounts)

```typescript
// Configure dunning for a subscription
const subscription = await stripe.subscriptions.update(subscriptionId, {
  collection_method: 'charge_automatically',
  days_until_due: 3,  // For manual billing
});

// Or set dunning at invoice level
const invoice = await stripe.invoices.update(invoiceId, {
  collection_method: 'charge_automatically',
  dunning_config: {
    enabled: true,
  },
});
```

### Best Practices for Dunning

1. **Enable Automatic Dunning** - Let Stripe handle failed payments
2. **Custom Email Templates** - Brand your dunning emails
3. **Set Appropriate Intervals:**
   - Day 0: Initial failure email
   - Day 2: First reminder
   - Day 5: Final notice
   - Day 10: Subscription cancellation notice
4. ** trials to「 'recovery emails** - Offer help before cancellation

---

## 3. Webhook Handlers - Critical Events

### Event: `invoice.payment_failed`

**When:** Payment for an invoice fails (card declined, insufficient funds)

**Payload Structure:**
```typescript
{
  id: 'evt_xxx',
  object: 'event',
  type: 'invoice.payment_failed',
  data: {
    object: {
      id: 'in_xxx',
      object: 'invoice',
      amount_due: number,
      amount_paid: number,
      amount_remaining: number,
      application_fee_amount: number | null,
      automatic_below: number | null,
      collection_method: 'charge_automatically' | 'send_invoice',
      created: number,
      currency: 'usd',
      customer: 'cus_xxx',
      description: 'Your invoice description',
      invoice_pdf: 'https://pay.stripe.com/invoice/...',
      lines: {
        data: [{
          amount: number,
          currency: 'usd',
          description: 'Product name',
          quantity: number,
          unit_amount: number,
        }]
      },
      status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void',
      subscription: 'sub_xxx',
      subtotal: number,
      total: number,
      webhooks_delivered_at: number | null,
    }
  }
}
```

**Handler Recommendations:**

```typescript
// Pseudocode for invoice.payment_failed handler
async function handleInvoicePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  const customerId = invoice.customer as string;

  // 1. Update local subscription status
  await supabase
    .from('user_subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', invoice.subscription)
    .eq('customer_id', customerId);

  // 2. Log dunning event
  await supabase
    .from('dunning_events')
    .insert({
      customer_id: customerId,
      invoice_id: invoice.id,
      event_type: 'payment_failed',
      amount_owed: invoice.amount_remaining,
      dunning_stage: 'initial',
    });

  // 3. Trigger dunning email (optional - Stripe handles this)
  if (invoice.collection_method === 'send_invoice') {
    await sendDunningEmail(customerId, invoice);
  }

  // 4. Notify user via dashboard alert
  await createNotification(customerId, {
    type: 'payment_failed',
    title: 'Payment Failed',
    message: `Your payment of $${invoice.amount_due / 100} failed.`,
    action_url: '/dashboard/billing',
  });
}
```

---

### Event: `customer.subscription.updated`

**When:** Subscription status changes (trial ending, plan upgrade/downgrade, cancellation)

**Payload Structure:**
```typescript
{
  id: 'evt_xxx',
  object: 'event',
  type: 'customer.subscription.updated',
  data: {
    object: {
      id: 'sub_xxx',
      object: 'subscription',
      status: 'active' | 'trialing' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete',
      customer: 'cus_xxx',
      current_period_start: number,
      current_period_end: number,
      items: {
        data: [{
          id: 'si_xxx',
          price: { id: 'price_xxx', product: 'prod_xxx' },
          quantity: number,
        }]
      },
      metadata: { org_id: 'xxx', user_id: 'xxx' },
      cancel_at_period_end: boolean,
      ended_at: number | null,
    }
  }
}
```

**Handler Recommendations:**

```typescript
async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  // Map Stripe status to local status
  const statusMap: Record<string, string> = {
    'active': 'active',
    'trialing': 'trialing',
    'past_due': 'past_due',
    'unpaid': 'past_due',
    'canceled': 'canceled',
    'incomplete': 'incomplete',
  };

  const localStatus = statusMap[subscription.status] || 'active';

  // Update subscription in database
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: localStatus,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
      metadata: { ...subscription.metadata, stripe_status: subscription.status },
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to update subscription:', error);
  }

  // Handle trialing to active transition
  if (subscription.status === 'active' && subscription.trial_end) {
    await activateFeatures(subscription.metadata?.org_id);
  }

  // Handle cancellation
  if (subscription.cancel_at_period_end && subscription.status === 'active') {
    await scheduleDeactivation(subscription.metadata?.org_id, subscription.current_period_end);
  }
}
```

---

### Event: `invoice.upcoming`

**When:** Invoice preview is generated (before billing period ends)

**Payload Structure:**
```typescript
{
  id: 'evt_xxx',
  object: 'event',
  type: 'invoice.upcoming',
  data: {
    object: {
      id: 'in_xxx',
      object: 'invoice',
      amount_due: number,
      amount_paid: number,
      amount_remaining: number,
      application_fee_amount: number | null,
      Collection_method: 'charge_automatically' | 'send_invoice',
      created: number,
      currency: 'usd',
      customer: 'cus_xxx',
      description: 'Invoice description',
      lines: { data: [...] },
      status: 'draft',
      subscription: 'sub_xxx',
      subtotal: number,
      total: number,
    }
  }
}
```

**Handler Recommendations:**

```typescript
async function handleInvoiceUpcoming(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;

  // Notify user before billing period ends
  await sendPreRenewalNotification(invoice.customer as string, {
    amount_due: invoice.amount_due / 100,
    billing_period: {
      start: new Date(invoice.lines.data[0].period.start * 1000),
      end: new Date(invoice.lines.data[0].period.end * 1000),
    },
    items: invoice.lines.data.map(item => ({
      name: item.description,
      quantity: item.quantity,
      amount: item.amount / 100,
    })),
  });

  // Generate invoice PDF
  if (invoice.payment_intent) {
    const paymentIntent = await stripe.paymentIntents.retrieve(invoice.payment_intent as string);
    const invoicePdf = await stripe.invoices.retrieve(invoice.id);
    await storeInvoicePdf(invoice.id, invoicePdf.invoice_pdf);
  }
}
```

---

## 4. Dunning Email Sequence - Best Practices

### Recommended Email Sequence

| Day | Email Type | Subject Template | Content Goals |
|-----|------------|------------------|---------------|
| 0 (Failure) | Initial Failure | "_payment for your subscription failed" | Explain failure, provide payment link |
| 2 | First Reminder | "payment failed - please update payment method" | Friendly reminder, support link |
| 5 | Final Notice | "final notice: subscription will be suspended" | Consequences warning, urgent payment |
| 10 | Cancellation | "subscription canceled due to payment" | Cancellation confirmation, reactivation info |

### Email Template Examples

#### Day 0: Payment Failed

```html
<!DOCTYPE html>
<html>
<head>
  <title>Payment Failed - WellNexus</title>
</head>
<body>
  <h1>Payment Failed</h1>
  <p>Hi {{customer_name}},</p>

  <p>Your payment of <strong>${{amount_due}}</strong> for WellNexus subscription <strong>{{plan_name}}</strong> has failed.</p>

  <h2>Next Steps</h2>
  <ul>
    <li>Update your payment method in the <a href="{{billing_url}}">Billing Dashboard</a></li>
    <li>Contact support if you need assistance</li>
    <li>Your subscription will be suspended if payment isn't received</li>
  </ul>

  <a href="{{billing_url}}" class="btn">Update Payment Method</a>

  <p>Questions? Reply to this email or visit our <a href="https://wellnexus.vn/support">Support Center</a>.</p>

  <hr>
  <p>WellNexus - AI Agency Operating System</p>
</body>
</html>
```

#### Day 5: Final Notice

```html
<!DOCTYPE html>
<html>
<head>
  <title>Final Notice - Payment Required</title>
</head>
<body>
  <h1 style="color: #e74c3c;">FINAL NOTICE</h1>
  <p>Hi {{customer_name}},</p>

  <p>This is a final notice regarding your overdue payment of <strong>${{amount_due}}</strong>.</p>

  <p><strong>Action Required:</strong></p>
  <p>Your WellNexus subscription will be <strong>suspended</strong> in 24 hours if payment is not received.</p>

  <a href="{{billing_url}}" class="btn" style="background: #e74c3c; color: white;">Pay Now</a>

  <p>Need to update your payment method? <a href="{{billing_url}}">Click here</a>.</p>

  <hr>
  <p>If you've already paid, please ignore this email. Your subscription will be reinstated once payment clears.</p>
</body>
</html>
```

### Stripe Email Template Configuration

In Stripe Dashboard:
1. Go to **Settings → Email Notifications**
2. Configure custom templates for:
   - Invoice payment failed
   - Subscription trial ending
   - Payment successful
   - Subscription renewed

---

## 5. Overage Billing Patterns

### Current Implementation Review

**Files Analyzed:**
- `src/lib/overage-calculator.ts` - Overage calculation logic
- `src/lib/quota-enforcer.ts` - Quota enforcement middleware
- `src/lib/overage-tracking-client.ts` - React hooks for overage
- `supabase/functions/stripe-usage-record/index.ts` - Stripe sync
- `supabase/migrations/2603081900_overage_billing.sql` - Database schema

### Overage Calculation Pattern

```typescript
// 1. Check quota
const enforcer = new QuotaEnforcer(supabase, { orgId, enforcementMode: 'soft' });
const result = await enforcer.checkQuota('api_calls');

// 2. Calculate overage if exceeded
if (result.isOverLimit) {
  const calculator = new OverageCalculator(supabase, orgId);
  const overage = await calculator.calculateOverage({
    metricType: 'api_calls',
    currentUsage: result.currentUsage,
    includedQuota: result.effectiveQuota,
    tier: result.metadata?.tier || 'basic',
  });

  // 3. Track overage transaction
  await calculator.trackOverage({
    metricType: 'api_calls',
    overageUnits: overage.overageUnits,
    totalCost: overage.totalCost,
    // ...
  });

  // 4. Sync to Stripe
  await calculator.syncToStripe(transactionId);
}
```

### Overage Rates Configuration

| Metric Type | Free | Basic | Pro | Enterprise | Master |
|-------------|------|-------|-----|------------|--------|
| api_calls | $0.001 | $0.0008 | $0.0005 | $0.0003 | $0.0001 |
| ai_calls | $0.05 | $0.04 | $0.03 | $0.02 | $0.01 |
| tokens | $0.000004 | $0.000003 | $0.000002 | $0.000001 | $0.0000005 |
| compute_minutes | $0.01 | $0.008 | $0.005 | $0.003 | $0.001 |

### Database Schema

**Tables:**
- `overage_transactions` - Tracks overage events with Stripe sync status
- `stripe_usage_sync_log` - Audit log for Stripe sync attempts
- `overage_rates` - Stores rate per unit by metric type and tier

**Key Fields:**
```sql
-- overage_transactions
stripe_subscription_item_id TEXT  -- Stripe SI for this feature
stripe_usage_record_id TEXT       -- MagicBilling usage record ID
stripe_sync_status TEXT           -- 'pending' | 'synced' | 'failed'
stripe_synced_at TIMESTAMPTZ      -- When sync succeeded
idempotency_key TEXT UNIQUE       -- For retry idempotency

-- stripe_usage_sync_log
retry_count INTEGER              -- Exponential backoff counter
next_retry_at TIMESTAMPTZ        -- When to retry next
error_message TEXT               -- Error details for debugging
```

---

## 6. Critical Gaps & Recommendations

### Immediate Actions Required

| Priority | Feature | Status | Recommendation |
|----------|---------|--------|----------------|
| 🔴 High | Dunning Config | Missing | Configure automatic dunning in Stripe Dashboard |
| 🔴 High | Webhook Handler | Partial | Implement `invoice.payment_failed` webhook |
| 🟡 Medium | Overage Email | Missing | Implement dunning email sequence |
| 🟡 Medium | Usage Queue | Missing | Add rate limiting queue for high-volume usage |
| 🟢 Low | Preview Invoice | Optional | Implement `invoice.upcoming` for pre-billing notifications |

### Step-by-Step Implementation Plan

#### Phase 1: Dunning Configuration (1-2 days)

1. **Enable Automatic Dunning** in Stripe Dashboard
2. **Configure Email Sequences** (Day 0, 2, 5, 10)
3. **Customize Email Templates** with WellNexus branding

#### Phase 2: Webhook Handler (2-3 days)

```typescript
// supabase/functions/webhooks/stripe.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  const payload = await req.text();
  const signature = req.headers.get('Stripe-Signature');

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature!,
      DENO.env.get('STRIPE_WEBHOOK_SECRET')!
    );

    switch (event.type) {
      case 'invoice.payment_failed':
        await handlePaymentFailed(event);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event);
        break;
      case 'invoice.upcoming':
        await handleInvoiceUpcoming(event);
        break;
    }

    return new Response(JSON.stringify({ received: true }));
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
});
```

#### Phase 3: Overage Email Templates (1-2 days)

Create email templates in `src/emails/`:

```
src/emails/
├── overage-initial.tsx
├── overage-reminder.tsx
├── overage-final.tsx
└── overage-cancellation.tsx
```

---

## 7. Code Examples

### Complete Dunning Webhook Handler

```typescript
// supabase/functions/dunning-handler/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DUNNING_EMAILS = [
  { day: 0, template: 'dunning_initial' },
  { day: 2, template: 'dunning_reminder' },
  { day: 5, template: 'dunning_final' },
  { day: 10, template: 'dunning_cancel' },
];

serve(async (req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const stripe = require('stripe')(stripeSecretKey);

  const payload = await req.text();
  const sig = req.headers.get('Stripe-Signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      sig!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }

  switch (event.type) {
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      // Get customer metadata
      const customer = await stripe.customers.retrieve(customerId);
      const orgId = customer.metadata.org_id;

      // Update subscription status
      await supabase
        .from('user_subscriptions')
        .update({ status: 'past_due' })
        .eq('stripe_subscription_id', invoice.subscription);

      // Log dunning event
      await supabase.rpc('log_dunning_event', {
        p_org_id: orgId,
        p_invoice_id: invoice.id,
        p_event_type: 'payment_failed',
        p_amount_owed: invoice.amount_remaining / 100,
        p_email_sent: false,
      });

      // Create notification
      await supabase.rpc('create_user_notification', {
        p_user_id: customer.metadata.user_id,
        p_title: 'Payment Failed',
        p_message: `Your payment of $${invoice.amount_due / 100} has failed. Please update your payment method.`,
        p_action_url: '/dashboard/billing',
      });

      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;

      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        console.error('Subscription update error:', error);
      }

      break;
    }
  }

  return new Response(JSON.stringify({ received: true }));
});
```

---

## 8. Database Schema for Dunning

```sql
-- Dunning events tracking
CREATE TABLE IF NOT EXISTS dunning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  invoice_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'payment_failed', 'retry_succeeded', 'dunning_stage_changed'
  amount_owed NUMERIC(10,2) NOT NULL,
  email_sent BOOLEAN DEFAULT FALSE,
  email_template TEXT,
  dunning_stage TEXT DEFAULT 'initial', -- 'initial', 'reminder', 'final', 'cancel_notice'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dunning_org ON dunning_events(org_id);
CREATE INDEX idx_dunning_invoice ON dunning_events(invoice_id);
CREATE INDEX idx_dunning_stage ON dunning_events(dunning_stage);

-- Dunning configuration
CREATE TABLE IF NOT EXISTS dunning_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID UNIQUE REFERENCES organizations(id),
  enabled BOOLEAN DEFAULT true,
  max_retry_days INTEGER DEFAULT 14,
  email_interval_days INTEGER DEFAULT 3,
  grace_period_days INTEGER DEFAULT 5,
  auto_retry BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function: Update dunning stage based on days since failure
CREATE OR REPLACE FUNCTION update_dunning_stage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.dunning_stage = 'initial' AND
     NOW() > OLD.created_at + INTERVAL '2 days' THEN
    NEW.dunning_stage = 'reminder';
  ELSIF NEW.dunning_stage = 'reminder' AND
        NOW() > OLD.created_at + INTERVAL '5 days' THEN
    NEW.dunning_stage = 'final';
  ELSIF NEW.dunning_stage = 'final' AND
        NOW() > OLD.created_at + INTERVAL '10 days' THEN
    NEW.dunning_stage = 'cancel_notice';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_dunning_stage_update
  BEFORE UPDATE ON dunning_events
  FOR EACH ROW
  EXECUTE FUNCTION update_dunning_stage();
```

---

## 9. Production Checklist

Before going live with dunning:

- [ ] Enable automatic dunning in Stripe Dashboard
- [ ] Configure email templates for each dunning stage
- [ ] Test webhook handler in Stripe test mode
- [ ] Implement `invoice.payment_failed` handler
- [ ] Implement `customer.subscription.updated` handler
- [ ] Set up monitoring for failed webhooks
- [ ] Deploy edge function to Supabase
- [ ] Configure webhook URL: `https://your-domain.supabase.co/functions/v1/dunning-handler`
- [ ] Test end-to-end scenario: failed payment → dunning email → payment update → subscription restored

---

## 10. Unresolved Questions

### Architecture Questions

1. **Should we use Stripe's dunning or implement custom?**
   - Stripe's dunning is robust and handles charge retries automatically
   - Custom implementation gives more control over email content
   - **Recommendation:** Use Stripe's dunning for now, custom only if needed

2. **How to handle metered billing with dunning?**
   - Metered billing doesn't generate invoices until usage is recorded
   - Dunning applies to the usage invoice, not the subscription itself
   - **Recommendation:** Sync usage daily, generate invoice, if fails → dunning

3. **Should overage be included in dunning?**
   - Overage is usually small amounts (~$5-20)
   - May not be worth the complexity
   - **Recommendation:** Add overage to next billing cycle instead of immediate dunning

### Implementation Questions

1. **Where should webhook handler run?**
   - Option A: Supabase Edge Functions (current pattern)
   - Option B: Cloudflare Workers (faster, cheaper)
   - Option C: Vercel Functions (simpler deployment)
   - **Recommendation:** Supabase Edge Functions for now (consistent with existing)

2. **How to handle webhook failures?**
   - Stripe retries for 3 days on 5xx errors
   - Should we log failures for manual review?
   - **Recommendation:** Log to failed_webhooks table, alert on high failure rate

3. **Should we implement instant dunning notification?**
   - Real-time notification via WebSocket
   - Dashboard badge showing "payment failed"
   - **Recommendation:** Yes, for better user experience

---

## Appendix: Files Created/Modified

### Existing Files (No Changes Needed)
- `src/lib/overage-calculator.ts` - ✅ Complete
- `src/lib/quota-enforcer.ts` - ✅ Complete
- `src/lib/overage-tracking-client.ts` - ✅ Complete
- `src/lib/stripe-billing-client.ts` - ✅ Complete
- `supabase/functions/stripe-usage-record/index.ts` - ✅ Complete
- `supabase/migrations/2603081900_overage_billing.sql` - ✅ Complete

### Files to Create

```
supabase/functions/
└── dunning-handler/              [NEW]
    └── index.ts                  [NEW]
        - Handle webhook events
        - Update subscription status
        - Log dunning events
        - Send notifications

src/emails/                       [NEW]
├── dunning-initial.tsx           [NEW]
├── dunning-reminder.tsx          [NEW]
├── dunning-final.tsx             [NEW]
└── dunning-cancel.tsx            [NEW]

supabase/migrations/
└── 260308-dunning-schema.sql     [NEW]
    - dunning_events table
    - dunning_config table
    - RLS policies
    - Triggers
```

---

## Related Documentation

- [Stripe Usage Records API](https://docs.stripe.com/api/usage_records)
- [Stripe Dunning Configuration](https://docs.stripe.com/billing/dunning)
- [Stripe Webhooks](https://docs.stripe.com/webhooks)
- [Stripe Billing Overview](https://docs.stripe.com/billing/overview)

---

*End of Report*
