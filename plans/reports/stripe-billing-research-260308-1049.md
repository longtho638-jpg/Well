# Stripe Billing & Payment Research Report

**Date:** 2026-03-08
**Researcher:** researcher agent
**Project:** WellNexus Distributor Portal

---

## 1. Stripe Metered Usage API

### Overview
Metered billing allows you to charge customers based on actual usage (e.g., API calls, storage, users).

### Usage Records Report

**API Endpoint:**
```
POST /v1/usage_records
```

**Request Format:**
```javascript
{
  quantity: 100,
  subscription_item: "si_123456",  // subscription item ID
  timestamp: 1694200000,           // Unix timestamp (optional, defaults to now)
  action: "increment"              // "increment" or "set"
}
```

**Pricing Tiers Support:**

Stripe supports 3 pricing tier models:

| Model | Description | Use Case |
|-------|-------------|----------|
| `per_unit` | Flat rate per unit | Simple usage billing |
| `voluntary` | Volume discounts | tiered pricing (1-100: $0.10, 101+: $0.08) |
| `MODEL` |阶梯定价 (model = 1 | Same price within range, higher range = lower price | tiered pricing with volume discount |

**Pricing Tier API:**
```javascript
// Create product with tiered pricing
POST /v1/products
{
  name: "API Calls",
  type: "service",
  billing_scheme: "tiered",
  tiers: [
    { up_to: 1000, unit_amount: 100 },   // First 1000 @ $1.00
    { up_to: 5000, unit_amount: 80 },    // 1001-5000 @ $0.80
    { up_to: "inf", unit_amount: 50 }    // 5001+ @ $0.50
  ]
}
```

### Usage Record Management

| Operation | Endpoint | Description |
|-----------|----------|-------------|
| Create | `POST /v1/usage_records` | Report new usage |
| List | `GET /v1/usage_records?subscription_item={id}` | View reported usage |
| Summary | `GET /v1/subscription_items/{id}/usage_summary` | Get usage by period |

### Best Practices
1. **Report usage at end of billing period** - prevents duplicate counting
2. **Use idempotency keys** for retry safety
3. **Set timestamp to period end** for accurate invoicing
4. **Monitor usage reports** - Stripe shows pending usage before invoice creation

---

## 2. Stripe Dunning Management

### Overview
Dunning = automatic retry of failed payments to recover revenue.

### Automatic Retry Logic

**Retry Configuration (_via Subscription or Price object):**
```javascript
// Via subscription creation
POST /v1/subscriptions
{
  collection_method: "charge_automatically",
  trials_days: 0,
  default_payment_method: "pm_xxx",
  // Dunning settings via invoice settings
  invoice_settings: {
    days_until_due: 30
  }
}
```

**Retry Configuration (via Dunning Configuration API):**
```javascript
// Create dunning configuration
POST /v1/billing/dunning_configs
{
  enabled: true,
  end_behavior: "cancel",
  inactive_email: {
    enabled: true,
    days_until_dunning: 3,
    days_between_dunning: 1
  },
  active_email: {
    enabled: true,
    first_retry: 1,
    last_retry: 3
  }
}
```

### Dunning Status Flow

```
Payment Failed
    ↓
Day 1: First Retry Attempt
    ↓ (failed)
Day 3: Second Retry Attempt
    ↓ (failed)
Day 5: Third Retry Attempt
    ↓ (failed)
End Behavior:
  - cancel: Cancel subscription
  - downgrade: Downgrade to lower tier
  - none: Keep in dunning state
```

### Failed Payment Handling

**Webhook Events:**
| Event | Description |
|-------|-------------|
| `invoice.payment_failed` | Payment failed, dunning starts |
| `customer.subscription.updated` | Dunning status changed |
| `invoice.payment_succeeded` | Payment recovered |
| `customer.subscription.trial_will_end` | Trial ending通知 |

**Recovery Options:**
1. **Update default payment method** via customer portal
2. **Retry manually** via API
3. **Send updated invoice** with new payment method

---

## 3. Stripe Webhook Events for Billing

### Critical Billing Events

| Event | When It Fires | Key Data |
|-------|---------------|----------|
| `invoice.payment_failed` | Payment declined/expired | `invoice.id`, `charge.failure_message` |
| `invoice.payment_succeeded` | Payment successful | `invoice.id`, `charge.id` |
| `customer.subscription.created` | New subscription | `subscription.id`, `customer.id` |
| `customer.subscription.updated` | Status change (dunning, paused) | `subscription.status`, `previous_attributes` |
| `customer.subscription.paused` | Subscription paused | `pause_collection` details |
| `customer.subscription.resumed` | Subscription active again | subscription details |
| `customer.subscription.deleted` | Cancelled/expired | `subscription.id`, `cancellation_details` |
| `customer.source.created` | New payment method added | `source.id`, `customer.id` |
| `customer.source.expiring` | Card expiring soon | `source.id`, `exp_month`, `exp_year` |
| `customer.updated` | Payment method updated | `customer.id`, `invoice_settings` |

### Webhook Payload Example - invoice.payment_failed
```javascript
{
  "id": "evt_123",
  "object": "event",
  "type": "invoice.payment_failed",
  "data": {
    "object": {
      "id": "in_123",
      "object": "invoice",
      "amount_due": 2000,
      "currency": "usd",
      "status": "open",
      "charge": "ch_123",
      "subscription": "sub_123",
      "reason": "invoice.payment_failed",
      "payment失败_message": "Your card was declined."
    }
  }
}
```

### Webhook Payload Example - customer.subscription.updated
```javascript
{
  "type": "customer.subscription.updated",
  "data": {
    "object": {
      "id": "sub_123",
      "status": "past_due",  // active, past_due, incomplete, trialing, canceled, unpaid
      "collection_method": "charge_automatically",
      "current_period_end": 1694200000,
      "pending_setup_intent": "seti_123"  // whenRequires payment method update
    }
  }
}
```

### Webhook Signing & Verification

**Signature Header:** `Stripe-Signature`

**Verification Code:**
```javascript
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const payload = req.body;
const sig = req.headers["stripe-signature"];

let event;
try {
  event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
} catch (err) {
  return res.status(400).send(`Webhook Error: ${err.message}`);
}
```

### Recommended Webhook Endpoints

| Endpoint | Events to Listen |
|----------|------------------|
| `/webhooks/billing` | `invoice.payment_*`, `customer.subscription.*` |
| `/webhooks/payments` | `charge.*`, `payment_intent.*` |
| `/webhooks/customers` | `customer.*` |

---

## 4. Resend Email API

### Overview
Resend is a transactional email service for developers.

### API Authentication

**Method:** Bearer Token

```
Authorization: Bearer re_xxx_xxx
Content-Type: application/json
```

### Send Email Endpoint

**POST /v1/email/send**

```javascript
{
  "from": "Acme <onboarding@resend.dev>",
  "to": ["delivered@resend.dev"],
  "subject": "Hello World",
  "html": "<strong>Hello world</strong>",
  "reply_to": "reply@resend.dev"
}
```

### Node.js Example
```javascript
import { Resend } from 'resend';

const resend = new Resend('re_xxx_xxx');

await resend.emails.send({
  from: 'Acme <onboarding@resend.dev>',
  to: ['customer@example.com'],
  subject: 'Your Invoice is Ready',
  html: `
    <h1>Invoice #${invoiceId}</h1>
    <p>Amount: $${amount}</p>
    <a href="${invoiceUrl}">View Invoice</a>
  `
});
```

### Email Templates

**Create Template:**
```javascript
POST /v1/emails/templates
{
  name: "invoice_notification",
  subject: "Your Invoice is Ready",
  html: "<p>Hello {{name}},</p><p>Your invoice is ready.</p>"
}
```

**Send with Template:**
```javascript
{
  from: "Acme <onboarding@resend.dev>",
  to: ["customer@example.com"],
  template_id: "tmpl_xxx",
  template_data: {
    name: "John",
    invoiceId: "INV-001",
    amount: "$99"
  }
}
```

### Email Types for Billing

| Template | Trigger |
|----------|---------|
| `invoice_created` | New invoice generated |
| `invoice_payment_failed` | Payment declined |
| `subscription_renewal` | Before renewal |
| `dunning_email` | Failed payment retry |
| `payment_success` | Payment recovered |

### Best Practices

1. **Use templates** for consistency
2. **Add unsubscribe link** for marketing emails (required by CAN-SPAM)
3. **Use HTML + plain text** fallback
4. **Track opens/clicks** via email analytics
5. **Error handling** - check `error` response field

### Error Response Example
```javascript
{
  "error": {
    "name": "validation_error",
    "message": "Missing required field: 'to'",
    "code": "missing_field"
  }
}
```

### Rate Limits

| Plan |emails/day| emails/month|
|------|----------|-------------|
| Free | 3,000 | 3,000 |
| Pro | 100,000 | 100,000 |
| Scale | Custom | Custom |

---

## 5. Integration Recommendations

### Billing System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Application                         │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │ Webhook bars  │  │ API Service   │  │ Email Service │   │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘   │
│          │                   │                   │           │
│          ▼                   ▼                   ▼           │
│  ┌──────────────────┐  ┌───────────┐  ┌───────────────┐     │
│  │ Stripe Webhooks  │  │ Subscription│  │ Resend API  │     │
│  │ /webhooks/billing│  │ Management  │  │ /v1/send    │     │
│  └────────┬─────────┘  └───────┬─────┘  └───────────────┘     │
│           │                     │                            │
│           ▼                     ▼                            │
│     ┌────────────────────────────────────┐                   │
│     │        Stripe Dashboard            │                   │
│     │  - Subscriptions                   │                   │
│     │  - Metered Usage Reports           │                   │
│     │  - Dunning Management              │                   │
│     └────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### Event Flow Example (Payment Failed)

```
1. Customer payment fails
   ↓
2. Stripe fires invoice.payment_failed webhook
   ↓
3. Your webhook handler saves event to DB
   ↓
4. Your system schedules retry (via Stripe dunning or custom logic)
   ↓
5. After retry period, if still failed:
   - Update subscription status to "past_due"
   - Send dunning email via Resend
   - Notify admin via Slack/email
```

### Security Considerations

1. **Always verify webhook signatures**
2. **Use HTTPS endpoints** for webhooks
3. **Rate limit webhook handlers**
4. **Log all billing events** for audit trail
5. **Never trust client-side data** for billing updates

---

## 6. Unresolved Questions

1. **Stripe Usage Limits:**
   - What's the maximum usage record size per billing period?
   - Can usage records be modified after invoicing?

2. **Dunning Customization:**
   - Can retry timing be customized per customer segment?
   - Is there API access to dunning configuration in newer API versions?

3. **Resend Template Variables:**
   - What's the max length for template_html?
   - Can templates include custom headers (e.g., X-Marketing-Id)?

---

## Sources

- Stripe Billing Documentation: https://docs.stripe.com/billing
- Stripe Webhooks: https://docs.stripe.com/webhooks
- Resend API: https://resend.com/api
- Metered Billing Guide: https://docs.stripe.com/billing/metered-billing

---

*Report generated: 2026-03-08 10:49 UTC*
