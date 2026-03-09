---
title: "Phase 6: Automated ROI Analytics Reporting"
description: "Cloudflare Worker cron task aggregating Stripe/Polar usage + billing data to compute ROI metrics and push reports to AgencyOS dashboard via secure webhook"
status: pending
priority: P1
effort: 6h
branch: main
tags: [roi, analytics, cloudflare-worker, cron, stripe, polar, webhook, phase-6]
created: 2026-03-09
---

# Phase 6: Automated ROI Analytics Reporting

## Overview

Build Cloudflare Worker scheduled task (cron trigger) that aggregates daily usage from Stripe/Polar APIs and KV-stored metering logs, computes ROI metrics per customer, and pushes summary reports via secure webhook to AgencyOS dashboard.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ROI Analytics Reporting Architecture                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Stripe API     │     │   Polar API      │     │  Cloudflare KV   │
│  (Subscription)  │     │  (Transactions)  │     │ (Usage Metering) │
└────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘
         │                        │                        │
         │ GET /v1/customers      │ GET /payments          │ GET usage:${orgId}
         │ GET /v1/subscriptions  │ GET /orders            │ GET billing:${orgId}
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   ROI Digest Worker     │
                    │   (Cron: 0 0 * * *)     │
                    │                         │
                    │  ┌───────────────────┐  │
                    │  │ 1. Fetch Usage    │  │
                    │  │    - Stripe API   │  │
                    │  │    - Polar API    │  │
                    │  │    - KV Cache     │  │
                    │  └─────────┬─────────┘  │
                    │            │            │
                    │  ┌─────────▼─────────┐  │
                    │  │ 2. Compute ROI    │  │
                    │  │    - Cost         │  │
                    │  │    - Value        │  │
                    │  │    - ROI Score    │  │
                    │  └─────────┬─────────┘  │
                    │            │            │
                    │  ┌─────────▼─────────┐  │
                    │  │ 3. Store Digest   │  │
                    │  │    - roi_digests  │  │
                    │  │    - KV Cache     │  │
                    │  └─────────┬─────────┘  │
                    │            │            │
                    │  ┌─────────▼─────────┐  │
                    │  │ 4. Push Webhook   │  │
                    │  │    - JWT Auth     │  │
                    │  │    - AgencyOS     │  │
                    │  └─────────┬─────────┘  │
                    └────────────┼────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   AgencyOS Dashboard    │
                    │   /api/webhooks/roi     │
                    │   (JWT/mk_api_key)      │
                    └─────────────────────────┘
```

## ROI Calculation Formula

```typescript
// ROI Score = (Value Delivered - Cost) / Cost * 100
roi_percentage = ((value_delivered - total_cost) / total_cost) * 100

// Cost = Subscription + Overage
total_cost = subscription_cost + overage_charges

// Value Delivered = Usage Units * Unit Value
value_delivered = (api_calls * value_per_api_call) +
                  (ai_calls * value_per_ai_call) +
                  (features_used * value_per_feature)

// Unit Economics
cost_per_api_call = total_cost / total_api_calls
revenue_per_user = total_revenue / active_users
utilization_rate = actual_usage / quota_limit
```

## Implementation Phases

### Phase 1: Worker Setup & Environment Configuration (1h)

**Goal:** Setup Cloudflare Worker project structure and environment variables

**Files to Create:**
- `workers/roi-analytics-worker/wrangler.toml` - Worker configuration
- `workers/roi-analytics-worker/package.json` - Dependencies
- `workers/roi-analytics-worker/src/index.ts` - Main worker entry
- `workers/roi-analytics-worker/src/types.ts` - TypeScript interfaces
- `workers/roi-analytics-worker/src/env.d.ts` - Environment type definitions

**Files to Modify:**
- `.env.example` - Add new environment variables

**Wrangler Configuration:**
```toml
name = "roi-analytics-worker"
main = "src/index.ts"
compatibility_date = "2024-09-01"

[triggers]
crons = ["0 0 * * *"]  # Daily at midnight UTC

[[kv_namespaces]]
binding = "ROI_KV"
id = "<kv-namespace-id>"

[[r2_buckets]]
binding = "ROI_REPORTS"
bucket_name = "roi-reports-audit"

[vars]
WEBHOOK_URL = "https://agencyos.network/api/webhooks/roi-digest"
ENFORCEMENT_MODE = "hybrid"
```

**Success Criteria:**
- [ ] Worker deploys successfully with `wrangler deploy`
- [ ] Cron trigger configured for daily execution
- [ ] KV namespace bound
- [ ] R2 bucket bound for audit logs

---

### Phase 2: Stripe API Integration (1.5h)

**Goal:** Fetch subscription and billing data from Stripe API

**Files to Create:**
- `workers/roi-analytics-worker/src/stripe-client.ts` - Stripe API client

**Stripe API Endpoints:**
```typescript
// Fetch customer subscriptions
GET /v1/subscriptions?customer={customer_id}&expand[]=data.items

// Fetch invoices for period
GET /v1/invoices?customer={customer_id}&period[end]=gt.{timestamp}

// Fetch usage records for metered billing
GET /v1/subscription_items/{item_id}/usage_record_summaries
```

**Interfaces:**
```typescript
interface StripeSubscription {
  id: string
  customer: string
  status: 'active' | 'past_due' | 'canceled'
  items: {
    data: Array<{
      price: { unit_amount: number; recurring?: { interval: string } }
      quantity: number
    }>
  }
  current_period_start: number
  current_period_end: number
}

interface StripeInvoice {
  id: string
  customer: string
  amount_due: number
  amount_paid: number
  status: 'paid' | 'open' | 'void' | 'uncollectible'
  created: number
  lines: {
    data: Array<{
      description: string
      amount: number
      type: 'subscription' | 'invoiceitem'
    }>
  }
}
```

**Rate Limiting:**
- Store last fetch timestamp in KV
- Cache Stripe responses for 1 hour
- Exponential backoff on 429 errors

**Success Criteria:**
- [ ] Fetch subscriptions for all active customers
- [ ] Parse invoice data correctly
- [ ] Handle Stripe API errors gracefully
- [ ] Cache responses in KV to avoid rate limits

---

### Phase 3: Polar API Integration (1h)

**Goal:** Fetch transaction and order data from Polar API

**Files to Create:**
- `workers/roi-analytics-worker/src/polar-client.ts` - Polar API client

**Polar API Endpoints:**
```typescript
// Fetch orders (subscriptions)
GET /api/v1/orders?organization_id={org_id}

// Fetch transactions
GET /api/v1/transactions?organization_id={org_id}
```

**Interfaces:**
```typescript
interface PolarOrder {
  id: string
  organization_id: string
  product_id: string
  amount: number
  currency: string
  status: 'confirmed' | 'refunded'
  created_at: string
  metadata: {
    subscription_tier?: string
    billing_period?: string
  }
}

interface PolarTransaction {
  id: string
  order_id: string
  amount: number
  type: 'charge' | 'refund' | 'dispute'
  created_at: string
}
```

**Success Criteria:**
- [ ] Fetch orders for all organizations
- [ ] Parse transaction data correctly
- [ ] Handle Polar API errors gracefully
- [ ] Merge Polar + Stripe data for unified view

---

### Phase 4: ROI Calculation Engine (1.5h)

**Goal:** Implement ROI calculation logic

**Files to Create:**
- `workers/roi-analytics-worker/src/roi-calculator.ts` - Core calculation logic

**ROI Calculator Implementation:**
```typescript
export class ROICalculator {
  private static readonly DEFAULT_VALUES = {
    api_call_value: 0.01,      // $0.01 per API call
    ai_call_value: 0.05,       // $0.05 per AI inference
    feature_base_value: 5.00,  // $5 per feature used
  }

  async calculateROI(orgId: string): Promise<ROIDigest> {
    // 1. Fetch usage from KV
    const usage = await this.fetchUsageFromKV(orgId)

    // 2. Fetch billing from Stripe/Polar
    const billing = await this.fetchBillingData(orgId)

    // 3. Calculate total cost
    const totalCost = billing.subscriptionCost + billing.overageCharges

    // 4. Calculate value delivered
    const valueDelivered =
      (usage.api_calls * ROICalculator.DEFAULT_VALUES.api_call_value) +
      (usage.ai_calls * ROICalculator.DEFAULT_VALUES.ai_call_value) +
      (usage.features_used * ROICalculator.DEFAULT_VALUES.feature_base_value)

    // 5. Calculate ROI percentage
    const roiPercentage = totalCost > 0
      ? ((valueDelivered - totalCost) / totalCost) * 100
      : 0

    // 6. Calculate unit economics
    const costPerApiCall = usage.api_calls > 0
      ? totalCost / usage.api_calls
      : 0

    const utilizationRate = usage.quotaLimit > 0
      ? (usage.api_calls / usage.quotaLimit) * 100
      : 0

    return {
      id: crypto.randomUUID(),
      org_id: orgId,
      digest_date: new Date().toISOString(),
      roi_percentage: roiPercentage,
      cost_per_api_call: costPerApiCall,
      revenue_per_user: billing.totalRevenue / (billing.activeUsers || 1),
      utilization_rate: utilizationRate,
      anomaly_score: this.calculateAnomalyScore(usage),
      total_api_calls: usage.api_calls,
      total_ai_calls: usage.ai_calls,
      total_cost: totalCost,
      total_revenue: billing.totalRevenue,
      email_sent: false,
      webhook_sent: false,
      created_at: new Date().toISOString(),
    }
  }

  private calculateAnomalyScore(usage: UsageData): number {
    // Simple anomaly detection based on deviation from normal
    const zScore = Math.abs((usage.api_calls - usage.avgApiCalls) / usage.stdDevApiCalls)
    return Math.min(zScore / 3, 1) // Normalize to 0-1
  }
}
```

**Success Criteria:**
- [ ] ROI calculation follows formula correctly
- [ ] Handle edge cases (zero cost, zero usage)
- [ ] Anomaly score calculated for each org
- [ ] All metrics properly typed and validated

---

### Phase 5: Webhook Delivery with JWT Auth (1h)

**Goal:** Push ROI digest to AgencyOS dashboard via secure webhook

**Files to Create:**
- `workers/roi-analytics-worker/src/webhook-client.ts` - Webhook delivery client

**JWT Generation:**
```typescript
import * as jose from 'jose'

async function generateJWT(secret: string, orgId: string): Promise<string> {
  const secretKey = new TextEncoder().encode(secret)

  return await new jose.SignJWT({
    org_id: orgId,
    scope: 'roi_digest'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .setJti(crypto.randomUUID())
    .sign(secretKey)
}
```

**Webhook Payload:**
```typescript
interface ROIWebhookPayload {
  event_type: 'roi_digest' | 'roi_alert'
  timestamp: string
  org_id: string
  project_id: string
  digest: {
    roi_percentage: number
    cost_per_api_call: number
    revenue_per_user: number
    utilization_rate: number
    anomaly_score: number
    total_api_calls: number
    total_ai_calls: number
    total_cost: number
    total_revenue: number
  }
  alerts: Array<{
    type: 'negative_roi' | 'low_utilization' | 'cost_spike'
    severity: 'info' | 'warning' | 'critical'
    message: string
  }>
}
```

**Webhook Delivery:**
```typescript
async function sendWebhook(payload: ROIWebhookPayload, webhookUrl: string, jwtSecret: string): Promise<boolean> {
  const jwt = await generateJWT(jwtSecret, payload.org_id)

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`,
      'X-API-Key': `mk_${payload.org_id}`,  // Dual auth
    },
    body: JSON.stringify(payload),
  })

  return response.ok
}
```

**Success Criteria:**
- [ ] JWT generated with correct claims
- [ ] Webhook includes both JWT and mk_api_key auth
- [ ] Retry logic with exponential backoff
- [ ] Failed webhooks logged to R2

---

### Phase 6: Main Worker Orchestration (0.5h)

**Goal:** Implement main worker scheduled handler

**Files to Modify:**
- `workers/roi-analytics-worker/src/index.ts` - Main orchestration

**Worker Implementation:**
```typescript
export default {
  async scheduled(_event: ScheduledEvent, env: WorkerEnv, _ctx: ExecutionContext): Promise<void> {
    const calculator = new ROICalculator(env.ROI_KV, env.STRIPE_KEY, env.POLAR_KEY)

    // 1. Get all active organizations
    const orgs = await this.getActiveOrganizations(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

    for (const org of orgs.slice(0, 100)) {  // Rate limit to 100 orgs/run
      try {
        // 2. Calculate ROI
        const digest = await calculator.calculateROI(org.org_id)

        // 3. Store in Supabase
        await this.storeDigestInSupabase(digest, env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

        // 4. Store in KV cache
        await env.ROI_KV.put(`roi:${org.org_id}:${digest.digest_date}`, JSON.stringify(digest), { expirationTtl: 86400 * 30 })

        // 5. Generate alerts for negative ROI
        const alerts = this.generateAlerts(digest)

        // 6. Push webhook
        const payload: ROIWebhookPayload = {
          event_type: 'roi_digest',
          timestamp: new Date().toISOString(),
          org_id: org.org_id,
          project_id: org.org_id,
          digest: { ...digest },
          alerts,
        }

        await sendWebhook(payload, env.WEBHOOK_URL, env.JWT_SECRET)

        // 7. Store audit log in R2
        await env.ROI_REPORTS.put(`audit/${org.org_id}/${digest.digest_date}.json`, JSON.stringify({ digest, alerts, webhook_sent: true }))

      } catch (error) {
        console.error(`[ROI] Error processing org ${org.org_id}:`, error)
        // Store error in R2 for debugging
        await env.ROI_REPORTS.put(`errors/${org.org_id}/${new Date().toISOString()}.json`, JSON.stringify({ error: error.message }))
      }
    }
  },

  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    // Health check endpoint
    const url = new URL(request.url)
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Manual trigger endpoint (auth required)
    if (url.pathname === '/trigger' && request.method === 'POST') {
      const apiKey = request.headers.get('X-API-Key')
      if (apiKey !== env.ADMIN_API_KEY) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
      }

      // Trigger manual ROI calculation
      // ...
    }

    return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 })
  },
}
```

**Success Criteria:**
- [ ] Scheduled handler processes all orgs
- [ ] Error handling for each org (don't fail entire run)
- [ ] Health check endpoint works
- [ ] Manual trigger endpoint for testing

---

## File List

### New Files

| File | Purpose |
|------|---------|
| `workers/roi-analytics-worker/wrangler.toml` | Worker configuration |
| `workers/roi-analytics-worker/package.json` | Dependencies |
| `workers/roi-analytics-worker/src/index.ts` | Main worker entry |
| `workers/roi-analytics-worker/src/types.ts` | TypeScript interfaces |
| `workers/roi-analytics-worker/src/env.d.ts` | Environment types |
| `workers/roi-analytics-worker/src/stripe-client.ts` | Stripe API client |
| `workers/roi-analytics-worker/src/polar-client.ts` | Polar API client |
| `workers/roi-analytics-worker/src/roi-calculator.ts` | ROI calculation engine |
| `workers/roi-analytics-worker/src/webhook-client.ts` | Webhook delivery |

### Modified Files

| File | Changes |
|------|---------|
| `.env.example` | Add ROI worker env vars |

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe API secret key | `sk_test_xxx` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_xxx` |
| `POLAR_ACCESS_TOKEN` | Polar API access token | `pat_xxx` |
| `JWT_SECRET` | Secret for JWT signing | `your-jwt-secret` |
| `WEBHOOK_URL` | AgencyOS webhook endpoint | `https://agencyos.network/api/webhooks/roi-digest` |
| `ADMIN_API_KEY` | Admin API key for manual trigger | `mk_admin_xxx` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJxxx` |
| `ENFORCEMENT_MODE` | `soft`, `hard`, or `hybrid` | `hybrid` |

---

## Testing Strategy

### Unit Tests (Vitest)

```typescript
// __tests__/roi-calculator.test.ts
describe('ROICalculator', () => {
  it('calculates positive ROI correctly', async () => {
    const calculator = new ROICalculator(mockKV, 'stripe_key', 'polar_key')
    const result = await calculator.calculateROI('org_123')
    expect(result.roi_percentage).toBeGreaterThan(0)
  })

  it('handles zero cost edge case', async () => {
    // ...
  })

  it('generates alerts for negative ROI', async () => {
    // ...
  })
})
```

### Integration Tests

```typescript
// __tests__/stripe-client.test.ts
describe('StripeClient', () => {
  it('fetches subscriptions from Stripe API', async () => {
    // Use Stripe test mode
  })

  it('handles rate limiting with backoff', async () => {
    // ...
  })
})
```

### Worker Tests (Miniflare)

```typescript
// __tests__/worker.test.ts
import { Miniflare } from 'miniflare'

describe('ROI Analytics Worker', () => {
  let mf: Miniflare

  beforeEach(() => {
    mf = new Miniflare({
      scriptPath: 'src/index.ts',
      kvNamespaces: ['ROI_KV'],
      r2Buckets: ['ROI_REPORTS'],
    })
  })

  it('runs scheduled handler successfully', async () => {
    const worker = await mf.getWorker()
    await worker.scheduled({ cron: '0 0 * * *' })
    // Verify digests stored
  })
})
```

---

## Database Schema

### roi_digests Table

```sql
CREATE TABLE roi_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  digest_date TIMESTAMP WITH TIME ZONE NOT NULL,
  roi_percentage NUMERIC(10, 2) NOT NULL,
  cost_per_api_call NUMERIC(10, 6) NOT NULL,
  revenue_per_user NUMERIC(10, 2) NOT NULL,
  utilization_rate NUMERIC(5, 2) NOT NULL,
  anomaly_score NUMERIC(3, 2) NOT NULL,
  total_api_calls BIGINT NOT NULL,
  total_ai_calls BIGINT NOT NULL,
  total_cost NUMERIC(10, 2) NOT NULL,
  total_revenue NUMERIC(10, 2) NOT NULL,
  email_sent BOOLEAN DEFAULT FALSE,
  webhook_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(org_id, digest_date)
);

CREATE INDEX idx_roi_digests_org_id ON roi_digests(org_id);
CREATE INDEX idx_roi_digests_date ON roi_digests(digest_date);
CREATE INDEX idx_roi_digests_roi ON roi_digests(roi_percentage);
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `wrangler` | ^3.0.0 | Cloudflare Workers CLI |
| `@cloudflare/workers-types` | ^4.0.0 | Workers type definitions |
| `jose` | ^5.0.0 | JWT generation |
| `typescript` | ^5.0.0 | TypeScript compiler |
| `vitest` | ^1.0.0 | Testing framework |
| `miniflare` | ^3.0.0 | Local Workers testing |

---

## Success Criteria

- [ ] Worker deploys and runs daily cron successfully
- [ ] ROI calculated for all active organizations
- [ ] Webhooks delivered to AgencyOS with JWT auth
- [ ] Failed deliveries retry with exponential backoff
- [ ] All digests stored in Supabase + KV cache
- [ ] Audit logs stored in R2 for 30 days
- [ ] Health check endpoint responds correctly
- [ ] Manual trigger endpoint works for testing

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Stripe/Polar API rate limits | Medium | High | Cache responses, exponential backoff |
| Webhook delivery failures | Medium | Medium | Retry queue, R2 audit logging |
| Cron job timeout (>10min) | Low | High | Process orgs in batches of 100 |
| JWT secret exposure | Low | Critical | Store in Workers secrets, never log |

---

## Next Steps

1. Setup Wrangler project and deploy worker skeleton
2. Implement Stripe client with test mode
3. Implement Polar client integration
4. Build ROI calculator with unit tests
5. Implement webhook delivery with JWT auth
6. Configure cron trigger for daily execution
7. Test end-to-end with AgencyOS dashboard

---

## Unresolved Questions

1. **Polar vs Stripe priority**: Should we prioritize one payment provider over the other, or merge both?
2. **Value per unit**: What are the actual business values for `api_call_value`, `ai_call_value`? Should these be configurable per tier?
3. **Webhook auth**: Does AgencyOS expect specific JWT claims format?
4. **Alert thresholds**: What ROI percentage triggers `negative_roi` alert? (-10%? -25%?)
5. **Email delivery**: Should we also email ROI digest to customer admins (via Resend)?
