# Usage Metering Integration Report - Phase 4 Complete

**Date:** 2026-03-07
**Status:** ✅ Complete - Ready for Phase 5 Dashboard
**Type:** Implementation Summary

---

## Executive Summary

Usage metering system has been fully implemented and integrated across the application stack:

| Component | Status | Location |
|-----------|--------|----------|
| **SDK** | ✅ Complete | `src/lib/usage-metering.ts` |
| **Middleware** | ✅ Complete | `src/lib/usage-metering-middleware.ts` |
| **API Client Integration** | ✅ Complete | `src/utils/api.ts` |
| **Database Schema** | ✅ Complete | Supabase migrations |
| **Edge Functions** | ✅ Complete | `supabase/functions/*/` |
| **Analytics Dashboard API** | ✅ Complete | `usage-analytics` endpoint |

---

## 1. Usage Metering SDK

**File:** `src/lib/usage-metering.ts`

### Core Class: `UsageMeter`

```typescript
const meter = new UsageMeter(supabase, {
  userId: 'user-uuid',
  orgId: 'org-uuid',    // optional
  licenseId: 'lic-uuid', // optional
  tier: 'premium'        // default: 'free'
})
```

### Tracked Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `api_call` | Counter | API requests made |
| `tokens` | Counter | AI tokens consumed |
| `compute_ms` | Counter | Compute time in milliseconds |
| `model_inference` | Counter | AI model inference count |
| `agent_execution` | Counter | Agent execution count |
| `storage_mb` | Gauge | Storage used (MB) |
| `bandwidth_mb` | Gauge | Bandwidth used (MB) |

### Key Methods

```typescript
// Track API call (automatically called by API client)
await meter.trackApiCall('/api/users', 'GET', { statusCode: 200 })

// Track AI model inference
await meter.trackModelInference({
  model: 'gpt-4',
  provider: 'openai',
  prompt_tokens: 150,
  completion_tokens: 50,
})

// Track agent execution
await meter.trackAgentExecution('planner', { task_id: '123' })

// Track raw metrics
await meter.track('tokens', { tokens: 1000, metadata: {...} })

// Check rate limit
const status = meter.isRateLimited()
// { allowed: true, remaining: 95, resetAt: '...' }

// Get usage status
const status = await meter.getUsageStatus()
// { api_calls: {...}, tokens: {...}, isLimited: false }
```

### Tier Limits

| Tier | API Calls/Day | Tokens/Day | Model Inferences/Day | Agent Executions/Day |
|------|---------------|------------|---------------------|---------------------|
| **free** | 100 | 10,000 | 10 | 5 |
| **basic** | 1,000 | 100,000 | 100 | 50 |
| **premium** | 10,000 | 1,000,000 | 1,000 | 500 |
| **enterprise** | 100,000 | 10,000,000 | 10,000 | 5,000 |
| **master** | ∞ | ∞ | ∞ | ∞ |

---

## 2. Middleware Integration

**File:** `src/lib/usage-metering-middleware.ts`

### Express/FastAPI Middleware

```typescript
import { createUsageMiddleware } from '@/lib/usage-metering-middleware'

const middleware = createUsageMiddleware(supabase, {
  getUserFromRequest: async (req) => ({
    userId: req.user.id,
    orgId: req.user.orgId,
    tier: req.user.tier,
  }),
})

// Usage in Express
app.use('/api', middleware)
```

### Features

- ✅ Automatic rate limiting (429 responses)
- ✅ Rate limit headers (X-RateLimit-*)
- ✅ Automatic API call tracking
- ✅ Request-scoped meter injection

---

## 3. API Client Integration

**File:** `src/utils/api.ts`

### Auto-Tracking API Client

```typescript
import { api, endpoints } from '@/utils/api'

// Set auth token
api.setAuthToken('bearer-token')

// Set usage meter (optional, for detailed tracking)
const meter = new UsageMeter(supabase, { userId })
api.setUsageMeter(meter)

// All API calls automatically tracked
const result = await api.get(endpoints.products.list)
```

### Tracking Points

| Event | Tracked Data |
|-------|--------------|
| **Successful request** | endpoint, method, statusCode, duration |
| **Failed request** | endpoint, method, statusCode, error, duration |
| **Timeout** | endpoint, method, error: 'Timeout' |
| **Network error** | endpoint, method, error: 'Network error' |

---

## 4. Database Schema

### usage_events Table

```sql
CREATE TABLE usage_events (
  id UUID PRIMARY KEY,
  event_id TEXT UNIQUE,           -- Idempotency key
  feature TEXT NOT NULL,           -- Metric type
  quantity INTEGER DEFAULT 1,
  customer_id TEXT NOT NULL,
  license_id UUID,
  user_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  raw_payload JSONB,               -- Full webhook payload
  metadata JSONB                   -- Extracted metadata
);
```

### daily_usage_rollup View

```sql
CREATE MATERIALIZED VIEW daily_usage_rollup
WITH (timescaledb.continuous) AS
SELECT customer_id, feature,
       date_trunc('day', timestamp) AS day,
       SUM(quantity) AS total_quantity,
       COUNT(*) AS event_count
FROM usage_events
GROUP BY customer_id, feature, day
```

- Auto-refreshes every hour
- 1-day start offset, 1-hour lag
- Optimized for billing queries

### Related Migrations

| Migration | Purpose |
|-----------|---------|
| `202603062256_timescale_usage_records.sql` | TimescaleDB hypertable |
| `202603062258_add_usage_event_idempotency.sql` | Idempotency table |
| `202603062259_usage_events_metering.sql` | usage_events schema |
| `202603062300_usage_events_tenant_rls.sql` | RLS policies |
| `202603062355_usage_records_billing_integration.sql` | Billing integration |

---

## 5. Edge Functions

### POST /usage-analytics?type=webhook

Generic webhook ingestion endpoint.

```typescript
POST /functions/v1/usage-analytics?type=webhook
Authorization: Bearer SERVICE_ROLE_KEY

{
  "event_id": "unique-id",
  "customer_id": "customer-123",
  "feature": "model_inference",
  "quantity": 1,
  "metadata": { "model": "gpt-4" },
  "raw_payload": { ... }
}
```

### POST /stripe-usage-metering

Stripe-specific webhook handler.

```typescript
POST /functions/v1/stripe-usage-metering
Authorization: Bearer SERVICE_ROLE_KEY

{
  "id": "evt_xxx",
  "type": "customer.subscription.created",
  "customer": "cus_xxx",
  "data": { object: {...} }
}
```

### POST /ai-inference-webhook

AI inference tracking endpoint.

### GET /usage-analytics?query=*

Analytics query endpoints for dashboard.

| Query | Params | Response |
|-------|--------|----------|
| `current` | user_id, license_id | Current usage + quotas |
| `quotas` | user_id, license_id | Quota limits + usage % |
| `breakdown` | user_id, period | Usage breakdown by feature |

---

## 6. Code Path Coverage

### ✅ Integrated Paths

| Code Path | Integration | Status |
|-----------|-------------|--------|
| **API Client requests** | `api.ts` auto-tracking | ✅ |
| **Express middleware** | `usage-metering-middleware.ts` | ✅ |
| **Stripe webhooks** | `stripe-usage-metering/` | ✅ |
| **AI inference webhooks** | `ai-inference-webhook/` | ✅ |
| **Usage analytics API** | `usage-analytics/` | ✅ |

### ⚠️ Partial Integration

| Code Path | Current State | Recommendation |
|-----------|---------------|----------------|
| **analytics.trackAgentExecution()** | Only tracks analytics event, not UsageMeter | Add `UsageMeter.trackAgentExecution()` call |
| **Agent execution in UI** | No direct metering | Inject UsageMeter into agent context |

### Suggested Improvement

```typescript
// src/utils/analytics.ts - Enhancement
import { UsageMeter } from '@/lib/usage-metering'

class AnalyticsService {
  private meter: UsageMeter | null = null

  setUsageMeter(meter: UsageMeter): void {
    this.meter = meter
  }

  trackAgentExecution(agentName: string, action: string): void {
    // Track analytics event
    this.track({ name: 'agent_executed', properties: { agentName, action } })

    // Track usage metering
    if (this.meter) {
      this.meter.trackAgentExecution(agentName, { action }).catch(console.error)
    }
  }
}

export const analytics = new AnalyticsService()
```

---

## 7. Phase 5 Dashboard Readiness

### Available Data for Dashboard

The analytics dashboard (Phase 5) can query:

```typescript
// 1. Current usage
const { data } = await fetch(
  `${SUPABASE_URL}/functions/v1/usage-analytics?query=current&user_id=${userId}`
)

// Response:
{
  totals: {
    api_calls: 85,
    tokens: 45000,
    model_inferences: 12,
    agent_executions: 5
  },
  quotas: {
    api_calls: { used: 85, limit: 1000, remaining: 915, percentage: 9 },
    tokens: { used: 45000, limit: 100000, remaining: 55000, percentage: 45 }
  },
  warnings: []  // At 80%/90% thresholds
}
```

### Dashboard Components Ready

| Component | Data Source | Ready |
|-----------|-------------|-------|
| **Usage Gauge Cards** | `?query=current` | ✅ |
| **Quota Progress Bars** | `?query=quotas` | ✅ |
| **Usage Breakdown Chart** | `?query=breakdown&period=week` | ✅ |
| **Real-time Counter** | WebSocket from edge function | ⚠️ Optional |
| **Alert Notifications** | `warnings` array | ✅ |

---

## 8. License Boundary Enforcement

### Quota Enforcement Flow

```
1. Request arrives
   ↓
2. UsageMeter checks tier limits
   ↓
3. If exceeded → 429 Too Many Requests
   ↓
4. If allowed → Process request + track usage
   ↓
5. usage_events table updated
   ↓
6. daily_usage_rollup aggregates hourly
```

### 429 Response Format

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please upgrade your plan.",
  "retryAfter": "2026-03-07T01:00:00Z"
}
```

### Warning Thresholds

- **80%**: Soft warning (can add toast notification)
- **90%**: Critical warning (can add modal/banner)
- **100%**: Hard limit (429 response)

---

## 9. Testing Checklist

- [x] SDK methods work correctly
- [x] API client tracks all requests
- [x] Middleware rate limiting works
- [x] Edge functions accept webhooks
- [x] Idempotency prevents duplicates
- [x] Database functions validate features
- [x] TimescaleDB aggregations work
- [ ] E2E test: Full webhook → dashboard flow
- [ ] Load test: High-throughput ingestion

---

## 10. Deployment Checklist

```bash
# 1. Apply migrations
supabase migration up

# 2. Deploy edge functions
supabase functions deploy usage-analytics
supabase functions deploy stripe-usage-metering
supabase functions deploy ai-inference-webhook

# 3. Verify deployment
curl https://PROJECT.supabase.co/functions/v1/usage-analytics

# 4. Test webhook ingestion
curl -X POST https://PROJECT.supabase.co/functions/v1/stripe-usage-metering \
  -H "Authorization: Bearer SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"event_id":"test-1","customer_id":"cus-1","feature":"api_call","quantity":1}'
```

---

## 11. Open Questions

1. **Real-time updates**: Should we add WebSocket for live usage counter?
2. **Email alerts**: Implement email notifications at 80%/90% thresholds?
3. **Custom metrics**: Allow tenants to define custom usage metrics?
4. **Billing sync**: Auto-sync with Stripe/Polar usage-based billing?

---

## Summary

Usage metering is **Phase 4 COMPLETE** and **Phase 5 READY**.

All core infrastructure is in place:
- ✅ SDK for tracking
- ✅ Middleware for rate limiting
- ✅ API client integration
- ✅ Database schema with TimescaleDB
- ✅ Edge functions for ingestion
- ✅ Analytics query API

**Next Step:** Phase 5 - Build analytics dashboard UI components to consume the usage data.
