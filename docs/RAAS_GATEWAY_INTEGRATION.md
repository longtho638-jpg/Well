# RaaS Gateway Integration Guide

> **Build once, deploy anywhere** - Monetize your API with usage-based billing.

This guide covers everything you need to integrate your application with the RaaS (Revenue-as-a-Service) Gateway for usage metering, overage billing, and dunning workflows.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Authentication](#authentication)
4. [Usage Metering](#usage-metering)
5. [Overage Billing](#overage-billing)
6. [Dunning Workflows](#dunning-workflows)
7. [Observability](#observability)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js
```

### 2. Configure Environment

```bash
# .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
RAAS_GATEWAY_URL=https://raas.agencyos.network
RAAS_LICENSE_KEY=lic_xxx
```

### 3. Initialize Usage Metering

```typescript
import { UsageMeter } from '@/lib/usage-metering'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

const usageMeter = new UsageMeter(supabase)

// Track API call
await usageMeter.track({
  orgId: 'org_123',
  userId: 'user_456',
  feature: 'api_calls',
  quantity: 1,
  metadata: { endpoint: '/api/users' },
})
```

### 4. Set Up Threshold Alerts

```typescript
import { UsageAlertEngine } from '@/lib/usage-alert-engine'

const alertEngine = new UsageAlertEngine(supabase, {
  thresholds: [80, 90, 100],  // Percentage
  cooldownMinutes: 60,
})

// Check and emit alerts
await alertEngine.checkAndEmitAlerts({
  orgId: 'org_123',
  metricType: 'api_calls',
  currentUsage: 850,
  quotaLimit: 1000,
})
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Your Application                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ UsageMeter  │  │ AlertEngine  │  │ Billing UI   │           │
│  └─────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Backend                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ usage_      │  │ overage_     │  │ payment_     │           │
│  │ records     │  │ events       │  │ retry_queue  │           │
│  └─────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RaaS Gateway                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ JWT Auth    │  │ KV Storage   │  │ Stripe/Polar │           │
│  │ (mk_ keys)  │  │ (Usage)      │  │ Sync         │           │
│  └─────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AgencyOS Dashboard                           │
│  Real-time usage analytics, billing status, dunning management │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authentication

### JWT + mk_ API Key Model

All RaaS Gateway requests require JWT authentication with mk_ API key prefix.

#### Generate JWT Token

```typescript
import { GatewayAuthClient } from '@/lib/gateway-auth-client'

const authClient = new GatewayAuthClient({
  issuer: 'wellnexus.vn',
  audience: 'raas.agencyos.network',
  apiKey: 'mk_xxx',  // Your API key
  tokenExpirySeconds: 3600,
})

// Get valid token (auto-refreshes if expired)
const { token, expiresAt, refreshed } = authClient.getValidToken(
  'org_123',  // orgId
  'lic_456'   // licenseId (optional)
)

// Use in API request
const response = await fetch('https://raas.agencyos.network/api/v1/usage/report', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ usage: 100 }),
})
```

#### JWT Payload Structure

```typescript
interface JWTPayload {
  iss: string           // Issuer (wellnexus.vn)
  aud: string           // Audience (raas.agencyos.network)
  sub: string           // Subject (orgId)
  license_id?: string   // License ID
  mk_key?: string       // API key prefix (mk_xxx)
  exp: number           // Expiry (Unix timestamp in seconds)
  iat: number           // Issued at (Unix timestamp in seconds)
  jti?: string          // Unique token ID (for revocation)
}
```

#### mk_ API Key Format

```
mk_<prefix>_<random>

Example: mk_prod_abc123xyz
```

**Key Prefixes:**
- `mk_test_` - Test/sandbox environment
- `mk_dev_` - Development environment
- `mk_prod_` - Production environment

---

## Usage Metering

### Track Usage

```typescript
import { UsageMeter } from '@/lib/usage-metering'

const usageMeter = new UsageMeter(supabase)

// Simple tracking
await usageMeter.track({
  orgId: 'org_123',
  userId: 'user_456',
  feature: 'api_calls',
  quantity: 1,
})

// With metadata
await usageMeter.track({
  orgId: 'org_123',
  userId: 'user_456',
  feature: 'tokens',
  quantity: 1000,
  metadata: {
    model: 'gpt-4',
    endpoint: '/api/generate',
    latency_ms: 250,
  },
})
```

### Supported Metrics

| Metric | Description | Unit |
|--------|-------------|------|
| `api_calls` | API requests | count |
| `ai_calls` | AI/LLM calls | count |
| `tokens` | LLM tokens processed | tokens |
| `compute_minutes` | Compute time | minutes |
| `storage_gb` | Storage used | GB |
| `emails` | Emails sent | count |
| `model_inferences` | Model inferences | count |
| `agent_executions` | Agent runs | count |

### Get Current Usage

```typescript
const usage = await usageMeter.getUsage({
  orgId: 'org_123',
  feature: 'api_calls',
  period: 'day',  // 'hour' | 'day' | 'week' | 'month'
})

console.log(`Used: ${usage.used}/${usage.limit}`)
```

---

## Overage Billing

### Configure Overage Pricing

```typescript
import { OverageBillingEngine } from '@/lib/overage-billing-engine'

const overageEngine = new OverageBillingEngine(supabase)

// Set overage rates
await overageEngine.setOverageRate({
  orgId: 'org_123',
  metricType: 'api_calls',
  ratePerUnit: 0.001,  // $0.001 per call
  currency: 'USD',
})
```

### Calculate Overage Cost

```typescript
const overage = await overageEngine.calculateOverage({
  orgId: 'org_123',
  period: '2026-03',
})

console.log(`Overage cost: $${overage.totalCost}`)
```

### Invoice Overage (Stripe)

```typescript
import { StripeOverageClient } from '@/lib/stripe-overage-client'

const stripeClient = new StripeOverageClient(supabase)

// Create invoice for overage
await stripeClient.createOverageInvoice({
  orgId: 'org_123',
  period: '2026-03',
  overageCost: 50.00,
  lineItems: [
    { metric: 'api_calls', quantity: 50000, unitPrice: 0.001 },
    { metric: 'tokens', quantity: 1000000, unitPrice: 0.000004 },
  ],
})
```

---

## Dunning Workflows

### Payment Retry Configuration

```typescript
import { PaymentRetryScheduler } from '@/services/payment-retry-scheduler'

const retryScheduler = new PaymentRetryScheduler(supabase)

// Schedule retry on payment failure
await retryScheduler.scheduleRetry({
  orgId: 'org_123',
  userId: 'user_456',
  stripeInvoiceId: 'in_abc123',
  amount: 9900,  // cents
  failureReason: 'card_declined',
})
```

### Retry Schedule

| Attempt | Delay | Channels |
|---------|-------|----------|
| 1 | 1 hour | Email + SMS |
| 2 | 1 day | Email + SMS |
| 3 | 3 days | Email + SMS + Webhook |
| 4 | 7 days | Final notice |

### Smart Failure Detection

```typescript
// Transient failures - auto-retry
const isTransient = retryScheduler.isTransientFailure({
  code: 'card_declined',  // ✓ Retry
  decline_code: 'insufficient_funds',  // ✓ Retry
})

// Permanent failures - skip retry, notify user
const isPermanent = retryScheduler.isPermanentFailure({
  code: 'expired_card',  // ✗ Don't retry
  decline_code: 'incorrect_cvc',  // ✗ Don't retry
})
```

---

## Observability

### Reconciliation Service

```typescript
import { UsageReconciliationService } from '@/services/usage-reconciliation-service'

const reconciliationService = new UsageReconciliationService(supabase)

// Run reconciliation
const result = await reconciliationService.reconcile({
  orgId: 'org_123',
  period: '2026-03-08',
  tolerance: 0.05,  // 5%
  autoHeal: true,
})

console.log(`Discrepancy: ${(result.discrepancy * 100).toFixed(2)}%`)
```

### Anomaly Detection

```typescript
import { UsageAnomalyDetector } from '@/services/usage-anomaly-detector'

const anomalyDetector = new UsageAnomalyDetector(supabase)

// Detect anomalies
const result = await anomalyDetector.detectAnomalies({
  orgId: 'org_123',
  metricType: 'api_calls',
  windowHours: 24,
  baselineDays: 7,
  spikeThreshold: 3.0,  // 3x baseline = spike
  dropThreshold: 0.3,   // 30% of baseline = drop
})

if (result.detected) {
  for (const anomaly of result.anomalies) {
    console.log(`${anomaly.type}: ${anomaly.description}`)
  }
}
```

### Alert Levels

| Level | Condition | Action |
|-------|-----------|--------|
| `warning` | Spike > 3x or drop < 30% | Email notification |
| `critical` | Spike > 6x or drop < 15% | Email + SMS |
| `emergency` | License misuse or auth failures | Email + SMS + Webhook |

---

## Troubleshooting

### Common Issues

#### 1. "JWT token expired"

**Cause:** Token expired before request completed.

**Solution:** Use `GatewayAuthClient.getValidToken()` which auto-refreshes:

```typescript
const { token, refreshed } = authClient.getValidToken(orgId, licenseId)
// Token is automatically refreshed if expired
```

#### 2. "API key format invalid"

**Cause:** mk_ prefix missing or incorrect format.

**Solution:** Ensure key format is `mk_<env>_<random>`:

```typescript
const isValidKey = apiKey.startsWith('mk_')
if (!isValidKey) {
  throw new Error('Invalid API key format')
}
```

#### 3. "Usage not syncing to Gateway"

**Cause:** Network error or rate limiting.

**Solution:** Check retry queue and manual sync:

```typescript
// Check retry queue
const { data } = await supabase
  .from('gateway_sync_queue')
  .select('*')
  .eq('org_id', orgId)
  .order('created_at', { ascending: false })
  .limit(5)

// Manual sync
await usageMeter.syncToGateway({ orgId, force: true })
```

#### 4. "Overage not calculated correctly"

**Cause:** Missing usage records or incorrect quota limits.

**Solution:** Verify quota configuration and usage data:

```typescript
// Check quota
const { data: quota } = await supabase
  .from('quotas')
  .select('*')
  .eq('org_id', orgId)
  .single()

// Check usage aggregation
const { data: usage } = await supabase
  .from('usage_records')
  .select('SUM(quantity) as total')
  .eq('org_id', orgId)
  .eq('feature', 'api_calls')
  .gte('recorded_at', startOfMonth)
  .single()
```

#### 5. "Dunning emails not sent"

**Cause:** Resend API key not configured or email template missing.

**Solution:** Check environment variables and template:

```bash
# .env
RESEND_API_KEY=re_xxx
```

```typescript
// Verify email template exists
const template = await alertEngine.getEmailTemplate({
  type: 'dunning_retry_1',
  locale: 'en',
})
```

---

## API Reference

### RaaS Gateway Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/usage/report` | POST | Report usage to Gateway |
| `/api/v1/usage/query` | GET | Query usage records |
| `/api/v1/license/validate` | POST | Validate license key |
| `/api/v1/license/status` | GET | Get license status |
| `/api/v1/rate-limit/check` | GET | Check rate limit status |

### Supabase Tables

| Table | Purpose |
|-------|---------|
| `usage_records` | Raw usage events |
| `usage_alert_events` | Threshold alerts |
| `overage_events` | Overage calculations |
| `payment_retry_queue` | Payment retries |
| `reconciliation_log` | Reconciliation audit |
| `anomaly_events` | Anomaly detections |

---

## Best Practices

1. **Track usage early**: Instrument tracking at API entry points
2. **Set reasonable thresholds**: 80%, 90%, 100% recommended
3. **Enable auto-heal**: Let reconciliation fix minor discrepancies
4. **Monitor anomalies**: Set up alerts for spikes and drops
5. **Test in sandbox**: Use `mk_test_` keys for development

---

_Last Updated: 2026-03-09_
_Version: 1.0.0_
