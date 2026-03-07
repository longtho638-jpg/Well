# Well Project Integration Research Report
**Date:** 2026-03-07
** researcher:** research agent

---

## 1. STRIPE INTEGRATION HIỆN TẠI

### 1.1 Stripe Webhook Handler
**File:** `/supabase/functions/stripe-webhook/index.ts`

```typescript
// Key event handlers
- customer.subscription.created → provisionLicenseOnPayment()
- customer.subscription.updated → update license tier
- customer.subscription.deleted → revokeLicenseOnCancel()
- checkout.session.completed → activate license
- invoice.payment_succeeded/payment_failed → update subscription
```

**Stripe Config:**
- API Version: `2024-12-18.acacia`
- Secret Key: `Deno.env.get('STRIPE_SECRET_KEY')`
- Webhook Secret: `Deno.env.get('STRIPE_WEBHOOK_SECRET')`

**Client-side Types:**
**File:** `/src/types/payments.ts`
- `StripePaymentIntent`, `StripePaymentStatus`
- `StripeConfig`: `{ publishableKey, webhookSecret, apiVersion }`

### 1.2 Stripe Usage Metering Endpoint
**File:** `/supabase/functions/stripe-usage-metering/index.ts`

**Purpose:** Receive Stripe events and record usage to `usage_events` table

**Auth:** `Authorization: Bearer SERVICE_ROLE_KEY`

**Key Function:** `check_usage_event_idempotency_v2()` - atomic idempotency check

**Event-to-Feature Mapping:**
```typescript
'customer.subscription.created' → 'api_call'
'customer.subscription.updated' → 'api_call'
'customer.subscription.deleted' → 'api_call'
'checkout.session.completed' → 'api_call'
'invoice.payment_succeeded' → 'api_call'
'invoice.payment_failed' → 'api_call'
'payment_intent.succeeded' → 'api_call'
```

---

## 2. LICENSE SYSTEM

### 2.1 Database Schema

**Table:** `raas_licenses`
**Migration:** `20260305234147_roiaas_phase3_licenses.sql`

```sql
CREATE TABLE raas_licenses (
  id UUID PRIMARY KEY,
  license_key TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  status TEXT CHECK (IN ('active', 'expired', 'revoked', 'pending')),
  features JSONB NOT NULL DEFAULT {},
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT {}
);
```

**Index:** license_key, user_id, status, expires_at

**RLS Policies:**
- Users can view own licenses
- Service role can manage all

**Audit Table:** `raas_license_audit_logs`
- Tracks: created, activated, expired, revoked, updated

### 2.2 License Types

**File:** `/src/lib/raas-license-provision.ts`
**File:** `/src/types/raas-license.ts`

```typescript
export type Tier = 'basic' | 'premium' | 'enterprise' | 'master'

export interface RaaSLicense {
  id: string
  license_key: string
  user_id: string
  status: 'active' | 'expired' | 'revoked' | 'pending'
  features: {
    adminDashboard: boolean
    payosWebhook: boolean
    commissionDistribution: boolean
    policyEngine: boolean
  }
  created_at: string
  expires_at: string
  metadata?: Record<string, unknown>
}
```

### 2.3 License Auto-Provisioning

**File:** `/supabase/functions/_shared/raas-license-provision.ts`

**Function:** `provisionLicenseOnPayment(input, supabase)`

**Flow:**
1. Map plan_id → tier
2. Calculate expiration (30 days/month or 365 days/year)
3. Generate license key: `raas_{tier}_{timestamp}_{nonce}_{hmac}`
4. Insert into `raas_licenses`
5. Insert audit log
6. Send email with license key (fire-and-forget)

**Key Functions:**
- `generateLicenseKey()` - HMAC-SHA256 signature
- `provisionLicenseOnPayment()` - main provisioning
- `revokeLicenseOnCancel()` - on subscription cancel

**Plan-to-Tier Map:**
```typescript
'plan_basic_monthly' → 'basic'
'plan_premium_monthly' → 'premium'
'plan_enterprise_monthly' → 'enterprise'
'plan_master_monthly' → 'master'
```

### 2.4 Client License Services

**File:** `/src/services/license-service.ts`

**Functions:**
- `validateLicenseKeyQuick()` - format check
- `activateLicenseViaPayOS()` - create license via payment
- `validateLicenseFromDB()` - check status
- `revokeLicense()` - admin action
- `getUserLicense()` - get user's active license

---

## 3. USAGE TRACKING

### 3.1 Usage Records Table
**Migration:** `202603062355_usage_records_billing_integration.sql`

```sql
CREATE TABLE usage_records (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  license_id UUID,
  model_id TEXT NOT NULL,
  model_provider TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
  stripe_customer_id TEXT,
  polar_customer_id TEXT,
  billing_period_start/end TIMESTAMPTZ,
  event_id TEXT UNIQUE,  -- for idempotency
  request_id TEXT,
  timestamp TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  processed_for_billing BOOLEAN DEFAULT FALSE,
  invoice_id TEXT
);
```

**Billing Functions:**
- `calculate_tenant_billing()` - aggregate usage for billing
- `get_current_usage()` - current quota status
- `validate_webhook_signature()` - HMAC-SHA256 validation

### 3.2 Usage Events Table
**Migration:** `202603062259_usage_events_metering.sql`

```sql
CREATE TABLE usage_events (
  id UUID PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,  -- idempotency key
  feature TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  customer_id TEXT NOT NULL,
  license_id UUID,
  user_id UUID,
  timestamp TIMESTAMPTZ,
  raw_payload JSONB NOT NULL,
  metadata JSONB,
  created_at/processed_at TIMESTAMPTZ
);
```

**Feature Types:**
```typescript
'api_call' | 'tokens' | 'compute_ms' | 'storage_mb' |
'bandwidth_mb' | 'model_inference' | 'agent_execution'
```

**Key Function:** `check_usage_event_idempotency_v2()` - atomic insert with duplicate checking

### 3.3 Usage Metering SDK (TypeScript)

**File:** `/src/lib/usage-metering.ts`

**Class:** `UsageMeter`

**Constructor:** `new UsageMeter(supabase, { userId, orgId, licenseId, tier })`

**Methods:**
- `track(metric, data)` - track single usage event
- `trackBatch(events)` - batch track
- `getUsageStatus()` - get tier quota status
- `isRateLimited()` - check rate limit
- `trackApiCall(endpoint, method, metadata)`
- `trackTokens(count, metadata)`
- `trackCompute(milliseconds, metadata)`
- `trackModelInference(options)` - tracks inference + tokens
- `trackAgentExecution(agentType, metadata)`

**Tier Limits:**
```typescript
free:    { api_calls_per_day: 100, tokens_per_day: 10_000, ... }
basic:   { api_calls_per_day: 1_000, tokens_per_day: 100_000, ... }
premium: { api_calls_per_day: 10_000, tokens_per_day: 1_000_000, ... }
enterprise: { api_calls_per_day: 100_000, tokens_per_day: 10_000_000, ... }
master:  { api_calls_per_day: -1, tokens_per_day: -1, ... } // unlimited
```

### 3.4 Usage Aggregator

**File:** `/src/lib/usage-aggregator.ts`

**Class:** `UsageAggregator`

**Features:**
- Real-time subscription to `usage_records` INSERT
- Get real-time summary by feature
- Hourly trend data
- Top users by usage

### 3.5 Usage Middleware

**File:** `/src/lib/usage-metering-middleware.ts`

**Function:** `createUsageMiddleware(supabase, options)`

**Purpose:** Express/FastAPI middleware for usage tracking + rate limiting

**Behavior:**
1. Get user from request
2. Check rate limit before processing
3. Set X-RateLimit headers
4. Track API call after response

---

## 4. EDGE FUNCTIONS

### 4.1 Stripe Webhook Handler
**Path:** `/supabase/functions/stripe-webhook/index.ts`

**Events Handled:**
- subscription.created/updated/deleted
- checkout.session.completed
- invoice.payment_succeeded/failed

### 4.2 Usage Track
**Path:** `/supabase/functions/usage-track/index.ts`

**Auth:** HMAC-SHA256 signature via `x-signature` + `x-timestamp` headers

**Secret:** `USAGE_WEBHOOK_SECRET`

**Body:**
```typescript
{
  org_id: string
  user_id: string
  license_id?: string
  feature: string
  quantity: number
  metadata?: Record<string, unknown>
  recorded_at?: string
}
```

### 4.3 Usage Summary
**Path:** `/supabase/functions/usage-summary/index.ts`

**Auth:** HMAC-SHA256 signature

**Purpose:** Calculate billing usage for a period

**Input:**
```typescript
{ org_id, license_id, period_start, period_end }
```

**Output:**
```typescript
{
  org_id, license_id, period_start, period_end,
  metrics: { api_calls, tokens, compute_ms, storage_mb, bandwidth_mb },
  tier, overage, calculated_cost
}
```

### 4.4 Usage Analytics
**Path:** `/supabase/functions/usage-analytics/index.ts`

**GET Endpoints:**
- `?query=current&user_id=xxx` - current usage + quotas
- `?query=quotas&user_id=xxx` - quota breakdown
- `?query=breakdown&period=week&user_id=xxx` - usage breakdown by model/agent
- `?query=summary&org_id=xxx&period=day` - org-level summary

**POST Endpoints:**
- Direct ingestion: `event_id`, `user_id`, `license_id`, `events[]`
- Webhook ingestion: `event_id`, `customer_id`, `feature`, `quantity`, `metadata`

### 4.5 License Validate
**Path:** `/supabase/functions/license-validate/index.ts`

**Purpose:** Validate license key and check status

---

## 5. BILLING INTEGRATION

### 5.1 Usage Billing Webhook (Polar.sh)

**File:** `/src/lib/vibe-payment/usage-billing-webhook.ts`

**Function:** `sendUsageToBilling(options)`

**Flow:**
1. Call `/functions/v1/usage-summary` to get usage
2. Send to Polar.sh `/v1/billing/usage`
3. Log to `usage_billing_sync_log`

**Polar Payload:**
```typescript
{
  organization_id: orgId,
  subscription_id: licenseId,
  billing_period: { start, end },
  usage: { api_calls, tokens, compute_minutes },
  calculated_cost,
  metadata: { tier, total_api_calls, total_tokens }
}
```

**Cron:** `monthlyBillingSync()` - runs 1st of month

### 5.2 Sync Log Table

**Migration:** `20260306_create_usage_billing_sync_log.sql`

```sql
CREATE TABLE usage_billing_sync_log (
  id UUID PRIMARY KEY,
  org_id UUID,
  license_id UUID,
  period_start/end TIMESTAMPTZ,
  status: 'success' | 'failed',
  polar_usage_id TEXT,
  calculated_cost NUMERIC,
  error_message TEXT,
  synced_at TIMESTAMPTZ
);
```

---

## 6. MISSING COMPONENTS - STRIPE USAGE RECORD API

###احت})
#### 6.1 Stripe Usage Record API Integration

**Missing:** `Stripe UsageRecord.create()` integration for metered billing

**Current State:**
- Stripe webhook receives events ✅
- Usage recorded in `usage_events` table ✅
- Usage summary computed via edge function ✅
- **Send to Stripe for metered billing: MISSING** ❌

**Required Integration:**

```typescript
// After usage recorded in usage_events
import Stripe from 'stripe';

async function sendUsageToStripe(
  customerId: string,
  quantity: number,
  stripeUsageRecordParams: {
    price?: string;      // Stripe price ID for metered billing
    usage?: number;
    timestamp?: number;  // Unix timestamp
    action?: 'increment' | 'set';
  }
) {
  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' });

  return stripe.billing.segments.usageRecords.create(
    customerId,
    stripeUsageRecordParams
  );
}
```

**Use Cases to Implement:**

1. **Incremental Usage Recording (per event):**
   - When usage event recorded → call Stripe UsageRecord
   - Use `action: 'increment'` for accurate metering

2. **Monthly Usage Summary (bulk):**
   - At end of billing period
   - Aggregate usage_events → single UsageRecord
   - Use `action: 'set'` with total quantity

3. **Usage Record Idempotency:**
   - Store Stripe usage record ID in Supabase
   - Prevent duplicate usage records to Stripe
   - Handle Stripe network failures gracefully

#### 6.2 Required Database Fields

**Add to `usage_events`:**
- `stripe_usage_record_id TEXT UNIQUE` - Stripe's UsageRecord ID
- `stripe_price_id TEXT` - Price being metered
- `sent_to_stripe_at TIMESTAMPTZ` - When sent to Stripe

**Add to `usage_records`:**
- `stripe_customer_id TEXT` (already有)
- `billing_period_start/end` (already有)

#### 6.3 Implementation Tasks

**Phase 1: Single Event Recording**
1. Extract Stripe customer_id from usage_events.metadata
2. Create UsageRecord for each event (or batch)
3. Store usage_record_id back to usage_events
4. Mark `sent_to_stripe_at`

**Phase 2: Batch Processing**
1. Cron job: every 15min, find unsent usage_events
2. Batch by customer_id + price_id
3. Aggregate quantity within batch window
4. Create bulk UsageRecords

**Phase 3: Reconciliation**
1. Daily reconciliation: compare Supabase vs Stripe usage
2. Fix discrepancies via UsageRecord refunds/creations
3. Log reconciliation results to auditing table

#### 6.4 Stripe Webhook for Usage Events

**Missing:** Handle Stripe `usage-record.reported` webhook events

**Purpose:** Sync confirmation from Stripe back to Supabase

**Event Type:** `usage-record.reported`
- Confirm usage record was processed
- Capture reported usage amount
- Handle errors (rate limit exceeded, etc.)

---

## 7. API ENDPOINTS

### Edge Functions
```
POST /functions/v1/stripe-webhook
POST /functions/v1/stripe-usage-metering
POST /functions/v1/usage-track
POST /functions/v1/usage-summary
POST /functions/v1/usage-analytics (type=webhook or direct)
GET  /functions/v1/usage-analytics (query params)
POST /functions/v1/license-validate
```

### Client Services (src/services/)
- `license-service.ts`: Validate, activate, revoke licenses
- `subscription-service.ts`: Stripe/Polar subscription management
- `payment/payos-client.ts`: PayOS payment flow

---

## 8. RESOURCES

### Files Referenced

| Category | File Path |
|----------|-----------|
| Stripe Webhook | `supabase/functions/stripe-webhook/index.ts` |
| Stripe Usage Metering | `supabase/functions/stripe-usage-metering/index.ts` |
| License Provision | `supabase/functions/_shared/raas-license-provision.ts` |
| Usage Track | `supabase/functions/usage-track/index.ts` |
| Usage Summary | `supabase/functions/usage-summary/index.ts` |
| Usage Analytics | `supabase/functions/usage-analytics/index.ts` |
| License Validate | `supabase/functions/license-validate/index.ts` |
| Usage Metering SDK | `src/lib/usage-metering.ts` |
| Usage Aggregator | `src/lib/usage-aggregator.ts` |
| License Service | `src/services/license-service.ts` |
| Usage Billing Webhook | `src/lib/vibe-payment/usage-billing-webhook.ts` |
| Usage Middleware | `src/lib/usage-metering-middleware.ts` |

### Database Migrations

| Migration | Purpose |
|-----------|---------|
| `20260305234147_roiaas_phase3_licenses.sql` | raas_licenses table |
| `202603062259_usage_events_metering.sql` | usage_events + idempotency |
| `202603062258_add_usage_event_idempotency.sql` | RLS + idempotency function |
| `202603062355_usage_records_billing_integration.sql` | usage_records + billing |
| `20260304_usage_metering_feature_flags.sql` | Feature flags |
| `20260306_create_usage_billing_sync_log.sql` | Billing sync audit |

---

## 9. UNRESOLVED QUESTIONS

1. **Stripe Customer ID Source:** Where is `stripe_customer_id` populated? Is it extracted from Stripe webhook metadata or created separately?

2. **Billing Period Tracking:** How are billing periods determined for usage aggregation? Is it based on subscription current_period_start/end or calendar months?

3. **Usage Event Correlation:** How do `usage_events` and `usage_records` tables correlate? Is there a unique event_id that links them?

4. **Rate Limit Enforcement:** Is rate limiting enforced at the API layer (middleware) or at the database layer (trigger/function)?

5. **Multi-Tenant Strategy:** For org_id usage aggregation, is there a 1:1 mapping between org and license, or can multiple licenses serve one org?

6. ** refund Handling:** If a Stripe subscription is refunded, is the corresponding license immediately revoked or does it continue until period end?

7. **Usage Record Idempotency in Stripe:** When sending usage to Stripe, is there a client-ref-idempotency key to prevent duplicates on retry?

8. **Premium Tier Features:** What specific premium features are controlled by `raas_licenses.features` JSONB?

---

END OF REPORT
