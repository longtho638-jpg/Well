# RaaS Overage Billing Patterns Research Report

**Date:** 2026-03-08
**Researcher:** Researcher Agent
**Context:** WellNexus Distributor Portal Billing System

---

## 1. SaaS Billing Systems Implementation Patterns

### Stripe Metered Billing Workflow

**Pattern:** Usage-based billing with metered price

```typescript
// 1. Create metered price
const price = await stripe.prices.create({
  unit_amount: 100,  // $1.00 per unit
  currency: 'usd',
  recurring: { interval: 'month', usage_type: 'metered' },
  product: productId
})

// 2. Create subscription with metered price
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: priceId }]
})

// 3. Record usage (call per API request)
await stripe.usageRecords.create({
  subscription_item: subscriptionItem.id,
  quantity: 1,  // Increment by 1 per request
  timestamp: Math.floor(Date.now() / 1000)
})
```

**Key Patterns:**
- **Metered price type**: Automatic usage aggregation per billing cycle
- **Timestamp grouping**: Usage grouped by billing period automatically
- **Pro-rated usage**: New subscriptions calculate usage from start date
- **Invoicing**: Automatic invoice generation with usage line items

### Chargebee Usage-Based Billing

**Pattern:** Usage tracking + tiered pricing

```typescript
// 1. Create usage-based price plan
const plan = await chargebee.plan.create({
  id: 'monthly-usage',
  name: 'Monthly Usage Plan',
  price: 0,  // Base price
  period_unit: 'month',
  currency_code: 'USD'
})

// 2. Add metered charges
const charge = await chargebee.charge.create({
  id: 'api-usage',
  name: 'API Requests',
  amount: 1,  // $1 per unit
  unit: 'request',
  type: 'usage',
  currency_code: 'USD'
})

// 3. Record usage
await chargebee.usage.create({
  item_price_id: 'api-usage',
  subscription_id: subscriptionId,
  quantity: 1,
  unit: 'request'
})
```

**Key Patterns:**
- **Separate charge items**: Decouple plan from usage charges
- **Flexible units**: Support various metrics (requests, storage, etc.)
- **Real-time tracking**: Usage recorded immediately vs. batch aggregation

---

## 2. Overage Calculation Algorithms

### Tiered Pricing Algorithm

**Pattern:** Volume-based pricing with price breaks

```typescript
interface Tier {
  upto: number      // Usage limit (null for unlimited)
  flat_amount: number  // Base price for tier
  unit_amount: number   // Price per unit
}

function calculateTieredCost(usage: number, tiers: Tier[]): number {
  let remaining = usage
  let totalCost = 0
  let previousLimit = 0

  for (const tier of tiers) {
    if (remaining <= 0) break

    const tierLimit = tier.upto ?? Infinity
    const tierUnits = { ...(Math.min(remaining, tierLimit - previousLimit)) }

    if (tierUnits > 0) {
      totalCost += tier.flat_amount + (tierUnits * tier.unit_amount)
      remaining -= tierUnits
    }

    previousLimit = tierLimit
  }

  return totalCost
}

// Example: $0-100: $10 + $0.10/unit, 100-500: $30 + $0.08/unit, 500+: $50 + $0.05/unit
const tiers = [
  { upto: 100, flat_amount: 1000, unit_amount: 10 },   // $10 + $0.10/unit
  { upto: 500, flat_amount: 3000, unit_amount: 8 },   // $30 + $0.08/unit
  { upto: null, flat_amount: 5000, unit_amount: 5 }   // $50 + $0.05/unit
]
```

### Overage Calculation Pattern

**Pattern:** Base price + overage beyond included units

```typescript
function calculateOverageCost(
  includedUnits: number,
  usage: number,
  basePrice: number,
  overagePricePerUnit: number
): { baseCost: number, overageCost: number, totalCost: number } {
  const overageUnits = Math.max(0, usage - includedUnits)
  const baseCost = basePrice
  const overageCost = overageUnits * overagePricePerUnit

  return {
    baseCost,
    overageCost,
    totalCost: baseCost + overageCost
  }
}

// Example: 1,000 included requests at $10/month, $0.01 per overage request
const result = calculateOverageCost(1000, 1500, 1000, 1)
// { baseCost: 1000, overageCost: 500, totalCost: 1500 }  // $15.00
```

### Usage Aggregation Patterns

**Pattern 1: Counter aggregation (simple increment)**
```typescript
// Best for: API requests, events, discrete actions
await db.usage_counters.increment({
  subscription_id: subscriptionId,
  metric: 'api_requests',
  period: '2026-03',
  delta: 1
})
```

**Pattern 2: Time-series aggregation (continuous metrics)**
```typescript
// Best for: Storage usage, bandwidth, compute time
await db.usage_timeseries.insert({
  subscription_id: subscriptionId,
  metric: 'storage_gb',
  value: 10.5,  // Current value
  timestamp: now,
  period: '2026-03-01'
})
// Query: SELECT AVG(value) OVER (PARTITION BY period)
```

**Pattern 3: Batch aggregation (bulk operations)**
```typescript
// Best for: High-volume systems, reduce DB writes
const usageBuffer: UsageRecord[] = []
setInterval(async () => {
  if (usageBuffer.length > 0) {
    await db.usage.bulk_insert(usageBuffer)
    usageBuffer.length = 0
  }
}, 60000)  // Flush every 60 seconds
```

---

## 3. Dunning Management Best Practices

### Stripe Dunning Retry Schedule

**Default Pattern:** Exponential backoff with max attempts

```
Attempt 1: Day 0 (immediate)
Attempt 2: Day 1 (24h later)
Attempt 3: Day 3 (72h later)
Attempt 4: Day 7 (168h later)
Attempt 5: Day 14 (336h later)

After attempt 5: Subscription cancelled (final_dunning_action: cancel)
```

**Custom Dunning Configuration:**

```typescript
await stripe.customers.update(customerId, {
  invoice_settings: {
    default_payment_method: paymentMethodId
  },
  payment_method_types: ['card', 'us_bank_account'],
  invoice_preview: true
})

// Configure subscription dunning
await stripe.subscriptions.update(subscriptionId, {
  payment_settings: {
    payment_method_types: ['card'],
    save_default_payment_method: 'on_subscription',
    payment_method_options: {
      card: {
        request_three_d_secure: 'automatic'
      }
    }
  }
})
```

### Dunning State Machine Pattern

**States:**
```
ACTIVE → PENDING_PAYMENT (invoice overdue)
         → DUNNING_RETRY_1 → DUNNING_RETRY_2 → ... → DUNNING_FINAL
         → PAST_DUE (grace period expired)
         → CANCELLED (final dunning action)
```

**Implementation:**

```typescript
interface DunningState {
  subscriptionId: string
  state: 'ACTIVE' | 'PENDING_PAYMENT' | 'DUNNING_RETRY' | 'PAST_DUE' | 'CANCELLED'
  retryCount: number
  nextRetryAt?: Date
  lastAttemptAt: Date
  failedInvoices: string[]
}

async function handlePaymentFailure(invoiceId: string) {
  const invoice = await stripe.invoices.retrieve(invoiceId)
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription)

  const dunningState = await getDunningState(subscription.id)

  // Transition state
  dunningState.retryCount++
  dunningState.lastAttemptAt = new Date()
  dunningState.failedInvoices.push(invoiceId)

  // Calculate next retry (exponential backoff)
  const delayMs = Math.pow(2, dunningState.retryCount) * 24 * 60 * 60 * 1000
  dunningState.nextRetryAt = new Date(Date.now() + delayMs)

  // Check final dunning action
  if (dunningState.retryCount >= 5) {
    dunningState.state = 'CANCELLED'
    await cancelSubscription(subscription.id, 'dunning_exhausted')
  } else {
    dunningState.state = 'DUNNING_RETRY'
    await scheduleRetry(subscription.id, dunningState.nextRetryAt)
  }

  await saveDunningState(dunningState)
}
```

### Recurly Dunning Configuration

**Pattern:** Customizable retry schedule per payment gateway

```xml
<!-- recurly.js configuration -->
<script type="text/javascript">
  recurly.configure({
    publicKey: 'pk_live_xxxxxxxxx',
    dunning: {
      schedule: [
        { days: 0 },      // Immediate
        { days: 1 },      // 1 day
        { days: 3 },      // 3 days
        { days: 7 },      // 7 days
        { days: 14 }      // 14 days
      ],
      final_action: 'cancel',  // or 'hold', 'leave_open'
      grace_period: 7  // Days before subscription suspended
    }
  })
</script>
```

---

## 4. Grace Period Enforcement Strategies

### Grace Period Pattern 1: Pre-paid Buffer

**Concept:** Include usage buffer before enforcing limits

```typescript
interface GracePeriodConfig {
  includedUnits: number     // Included in base plan
  graceUnits: number        // Buffer before hard limit
  hardLimit: number         // Absolute maximum
}

function checkUsageLimit(usage: number, config: GracePeriodConfig): {
  allowed: boolean
  state: 'within_quota' | 'in_grace' | 'over_limit'
  message?: string
} {
  if (usage <= config.includedUnits) {
    return { allowed: true, state: 'within_quota' }
  }

  if (usage <= config.includedUnits + config.graceUnits) {
    const graceUsed = usage - config.includedUnits
    const graceRemaining = config.graceUnits - graceUsed
    return {
      allowed: true,
      state: 'in_grace',
      message: `Grace period: ${graceUsed}/${config.graceUnits} units used`
    }
  }

  return {
    allowed: false,
    state: 'over_limit',
    message: `Usage limit exceeded: ${usage} > ${config.hardLimit}`
  }
}

// Example: 1,000 included + 500 grace = 1,500 effective limit
const config = { includedUnits: 1000, graceUnits: 500, hardLimit: 1500 }
```

### Grace Period Pattern 2: Temporal Grace (Time-based)

**Concept:** Allow overage for X days before enforcing

```typescript
interface TemporalGracePeriod {
  graceStartAt?: Date
  graceDurationDays: number
  lastNotifiedAt?: Date
}

function checkTemporalGrace(usage: number, includedUnits: number, grace: TemporalGracePeriod): {
  allowed: boolean
  inGrace: boolean
  graceExpired: boolean
} {
  const isOverQuota = usage > includedUnits

  if (!isOverQuota) {
    return { allowed: true, inGrace: false, graceExpired: false }
  }

  // Start grace period if not already started
  if (!grace.graceStartAt) {
    grace.graceStartAt = new Date()
    return { allowed: true, inGrace: true, graceExpired: false }
  }

  // Check if grace period expired
  const graceEnd = new Date(grace.graceStartAt.getTime() + grace.graceDurationDays * 24 * 60 * 60 * 1000)
  const graceExpired = new Date() > graceEnd

  return {
    allowed: !graceExpired,
    inGrace: true,
    graceExpired
  }
}
```

### Grace Period Pattern 3: Soft Limit with Warnings

**Concept:** Allow continued use with escalating warnings

```typescript
function checkSoftLimitWarnings(usage: number, thresholds: {
  warning: number   // 80% of quota
  critical: number  // 95% of quota
  hardLimit: number // 100% of quota
}): {
  allowed: boolean
  level: 'ok' | 'warning' | 'critical' | 'blocked'
  message?: string
} {
  const ratio = usage / thresholds.hardLimit

  if (ratio >= 1.0) {
    return {
      allowed: false,
      level: 'blocked',
      message: 'Hard limit reached - usage blocked'
    }
  }

  if (ratio >= 0.95) {
    return {
      allowed: true,
      level: 'critical',
      message: `CRITICAL: ${usage}/${thresholds.hardLimit} units (${(ratio * 100).toFixed(1)}%)`
    }
  }

  if (ratio >= 0.80) {
    return {
      allowed: true,
      level: 'warning',
      message: `WARNING: ${usage}/${thresholds.hardLimit} units (${(ratio * 100).toFixed(1)}%)`
    }
  }

  return { allowed: true, level: 'ok' }
}
```

---

## 5. Email Notification Strategies

### Billing Event Triggers

**Pattern:** Email on specific billing lifecycle events

```typescript
const emailTriggers = {
  // Subscription events
  subscription_created: sendWelcomeEmail,
  subscription_updated: sendPlanChangeEmail,
  subscription_cancelled: sendCancellationEmail,

  // Invoice events
  invoice_created: sendInvoicePreviewEmail,
  invoice_payment_succeeded: sendPaymentSuccessEmail,
  invoice_payment_failed: sendPaymentFailedEmail,
  invoice_finalized: sendInvoiceReadyEmail,

  // Usage events
  usage_threshold_reached: sendUsageWarningEmail,
  usage_limit_exceeded: sendLimitExceededEmail,

  // Dunning events
  dunning_retry_started: sendRetryPaymentEmail,
  dunning_retry_failed: sendRetryFailedEmail,
  dunning_subscription_cancelled: sendDunningCancellationEmail
}

// Stripe webhook handler
async function handleStripeWebhook(event: Stripe.Event) {
  const handler = emailTriggers[event.type]
  if (handler) {
    await handler(event.data.object)
  }
}
```

### Email Content Patterns

**1. Invoice Ready Email**
```
Subject: Your invoice for [period] is ready

Hi [name],

Your invoice for March 2026 is ready for payment.

📋 Invoice Details:
- Amount: $X.XX
- Period: March 1 - 31, 2026
- Usage: N API requests
- Due date: April 5, 2026

Payment method: [card_****1234]
[View Invoice] | [Update Payment Method]

Thanks,
Team
```

**2. Payment Failed Email**
```
Subject: Payment failed - Action required

Hi [name],

We couldn't process your payment for invoice #[number].

❌ Error: [error_message]

🔁 We'll retry payment in 3 days.

To ensure uninterrupted service:
[Update Payment Method] | [Contact Support]

Thanks,
Team
```

**3. Usage Warning Email**
```
Subject: Usage alert: 80% of quota used

Hi [name],

You've used 8,000 / 10,000 API requests this month (80%).

⚠️ If you exceed your quota, additional requests will be billed at $0.01 each.

[View Usage Dashboard] | [Upgrade Plan]

Thanks,
Team
```

**4. Dunning Cancellation Email**
```
Subject: Subscription cancelled - Payment failed

Hi [name],

After multiple payment attempts, your subscription has been cancelled.

📅 Last payment attempt: [date]
🔄 Total retries: 5
❌ Reason: All payment attempts failed

To reactivate your subscription:
[Reactivate Subscription] | [Contact Support]

Thanks,
Team
```

### Notification Throttling Pattern

**Prevent email spam:**

```typescript
const notificationTracker = new Map<string, { lastSent: Date, count: number }>()

async function sendThrottledNotification(
  recipient: string,
  type: string,
  cooldownMs: number,
  maxPerDay: number
) {
  const key = `${recipient}:${type}`
  const now = new Date()
  const last = notificationTracker.get(key)

  // Check cooldown
  if (last && (now.getTime() - last.lastSent.getTime()) < cooldownMs) {
    console.log(`Notification throttled for ${key} (cooldown)`)
    return
  }

  // Check daily limit
  if (last && last.count >= maxPerDay && isSameDay(last.lastSent, now)) {
    console.log(`Notification throttled for ${key} (daily limit)`)
    return
  }

  // Send notification
  await sendEmail(recipient, type)

  // Update tracker
  notificationTracker.set(key, {
    lastSent: now,
    count: (last?.count || 0) + 1
  })
}
```

---

## 6. Database Schema Patterns

### Usage Tracking Schema

**Pattern 1: Counter-based (simple)**

```sql
CREATE TABLE usage_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  metric VARCHAR(50) NOT NULL,  -- 'api_requests', 'storage_gb', etc.
  period VARCHAR(7) NOT NULL,    -- '2026-03' (YYYY-MM)
  count BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(subscription_id, metric, period)
);

CREATE INDEX idx_usage_counters_period ON usage_counters(period);
CREATE INDEX idx_usage_counters_subscription ON usage_counters(subscription_id, period);
```

**Pattern 2: Time-series (continuous metrics)**

```sql
CREATE TABLE usage_timeseries (
  id BIGSERIAL PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  metric VARCHAR(50) NOT NULL,
  value DECIMAL(12,4) NOT NULL,  -- Actual value (not delta)
  recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Partitioning by month for performance
  partition_key VARCHAR(7) GENERATED ALWAYS AS (TO_CHAR(recorded_at, 'YYYY-MM')) STORED
);

-- Create monthly partitions automatically
CREATE INDEX idx_usage_timeseries_subscription ON usage_timeseries(subscription_id, recorded_at DESC);
CREATE INDEX idx_usage_timeseries_partition ON usage_timeseries(partition_key);

-- Materialized view for monthly aggregates
CREATE MATERIALIZED VIEW monthly_usage_aggregates AS
SELECT
  subscription_id,
  metric,
  TO_CHAR(recorded_at, 'YYYY-MM') AS period,
  AVG(value) AS average_value,
  MAX(value) AS peak_value,
  MIN(value) AS min_value
FROM usage_timeseries
GROUP BY subscription_id, metric, TO_CHAR(recorded_at, 'YYYY-MM');

REFRESH MATERIALIZED VIEW monthly_usage_aggregates;
```

**Pattern 3: Event-based (detailed audit trail)**

```sql
CREATE TABLE usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  metric VARCHAR(50) NOT NULL,
  quantity DECIMAL(12,4) NOT NULL,  -- Delta (can be negative for refunds)
  metadata JSONB,                     -- Additional context: { endpoint, response_time, etc. }
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usage_events_subscription ON usage_events(subscription_id, created_at DESC);
CREATE INDEX idx_usage_events_metric ON usage_events(metric, created_at DESC);

-- Aggregate view for billing
CREATE OR REPLACE VIEW get_period_usage AS
SELECT

  subscription_id,
  metric,
  TO_CHAR(created_at, 'YYYY-MM') AS period,
  SUM(quantity) AS total_quantity
FROM usage_events
GROUP BY subscription_id, metric, TO_CHAR(created_at, 'YYYY-MM');
```

### Billing Events Schema

```sql
CREATE TABLE billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  type VARCHAR(50) NOT NULL,  -- 'invoice_created', 'payment_failed', 'usage_alert', etc.
  payload JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending'  -- 'pending', 'processed', 'failed'
);

CREATE INDEX idx_billing_events_subscription ON billing_events(subscription_id, created_at DESC);
CREATE INDEX idx_billing_events_type ON billing_events(type, created_at DESC);
```

### Dunning State Schema

```sql
CREATE TABLE dunning_states (
  subscription_id UUID PRIMARY KEY REFERENCES subscriptions(id),
  state VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  retry_count INTEGER NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMP,
  last_attempt_at TIMESTAMP,
  failed_invoices UUID[] NOT NULL DEFAULT '{}',
  metadata JSONB,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dunning_states_next_retry ON dunning_states(next_retry_at);
```

### Usage Alerts Schema

```sql
CREATE TABLE usage_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  threshold_type VARCHAR(20) NOT NULL,  -- 'warning', 'critical', 'blocked'
  threshold_percentage DECIMAL(5,2) NOT NULL,
  current_usage DECIMAL(12,4) NOT NULL,
  max_usage DECIMAL(12,4) NOT NULL,
  notification_sent_at TIMESTAMP,
  acknowledged_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usage_alerts_subscription ON usage_alerts(subscription_id, created_at DESC);
```

---

## 7. Implementation Recommendations

### For WellNexus RaaS Billing System:

1. **Start with Stripe metered billing** for production-grade reliability
2. **Implement counter-based usage tracking** for simplicity, migrate to time-series if needed
3. **Use 5-attempt dunning schedule** with exponential backoff (Stripe default)
4. **Implement temporal grace period** (3-7 days) before hard limits
5. **Send emails on all billing events** with throttling (1 email per event type per day)
6. **Track usage_events for audit trail**, aggregate with materialized views for billing

### Recommended Technology Stack:

- **Billing**: Stripe (metered prices) or Chargebee
- **Usage Tracking**: PostgreSQL with materialized views
- **Time-series (optional)**: TimescaleDB for high-volume metrics
- **Email**: SendGrid or Postmark (transactional email)
- **Webhooks**: Supabase Edge Functions or Cloudflare Workers
- **Cron Jobs**: Vercel Cron or GitHub Actions for daily aggregations

### Critical Implementation Steps:

1. **Phase 1**: Metered billing integration (Stripe)
2. **Phase 2**: Usage tracking schema (counter-based)
3. **Phase 3**: Overage calculation engine (tiered pricing)
4. **Phase 4**: Grace period enforcement (temporal)
5. **Phase 5**: Dunning management (Stripe + custom state machine)
6. **Phase 6**: Email notifications (webhooks + throttling)
7. **Phase 7**: Usage dashboard (real-time + historical)

---

## Unresolved Questions

1. **Should we implement custom overage calculation or rely on Stripe's metered billing?**
   - Trade-off: Flexibility vs. reliability
   - Recommendation: Start with Stripe, migrate to custom if needed

2. **What grace period duration should we use?**
   - Options: 3 days (strict), 7 days (balanced), 14 days (generous)
   - Consider: Customer churn vs. revenue protection

3. **Should we implement usage limits at API gateway or application level?**
   - Gateway: Global enforcement, but requires separate service
   - Application: Simpler, but may allow bypass
   - Recommendation: Both (gateway for hard limits, app for soft limits)

4. **How should we handle multi-tenant usage tracking?**
   - Row-level security (RLS) for isolation
   - Separate databases per tenant (expensive)
   - Recommendation: RLS with tenant_id partitioning

---

**Sources:**
- [Stripe Usage-Based Billing](https://docs.stripe.com/billing/subscriptions/usage-based)
- [Stripe Dunning Management](https://docs.stripe.com/billing/subscriptions/setting-up-cancel-and-pay-overdue-invoices)
- [Chargebee Usage-Based Billing](https://www.chargebee.com/docs/2.0/usage-based-billing)
- [SaaS Dunning Best Practices](https://www.google.com/search?q=SaaS+dunning+retry+schedule+exponential+backoff+payment+failures)
- [TimescaleDB for Usage Tracking](https://www.timescale.com/blog/timescaledb-vs-standard-postgresql/)
