# Usage Metering Implementation Research Report

**Date:** 2026-03-06
**Project:** WellNexus (ROIaaS Worker)
**Researcher:** Agent

---

## Executive Summary

**Usage metering infrastructure ALREADY EXISTS** - implementation is 85% complete.
Remaining: Integration hooks for real-time tracking + billing webhook sync.

---

## 1. Current API Architecture

### Supabase Edge Functions (5 existing)
| Function | Purpose | Auth Pattern |
|----------|---------|--------------|
| `check-rate-limit` | Per-user rate limiting | Service role key |
| `license-validate` | License validation + audit logging | Client IP + rate limit cache |
| `agent-worker` | Background job processing | Internal service key header |
| `payos-webhook` | Payment + subscription handling | N/A (internal trigger) |
| `send-email` | Email delivery | Service role key |

### Client API (`src/utils/api.ts`)
```typescript
// ApiClient withBearer auth + CSRF protection
api.get<T>(endpoint)
api.post<T>(endpoint, body)
// Token: localStorage from Supabase session
```

### Auth Pattern for Usage Tracking
- **User identify:** `supabase.auth.user().id` OR `auth.uid()` in RLS
- **Org context:** Pass `orgId` explicitly in tracking calls
- ** license context:** `licenseId` from validated license key

---

## 2. RaaS License Context

### License Schema (`raas_licenses` table)
```sql
- id, license_key, tier, nonce, key_hash
- expires_at, status, is_revoked, revoked_at
- metadata: { user_id, plan_id, billing_cycle, payment_id, ... }
```

### License Validation (`raas-gate.ts`)
```typescript
validateRaaSLicense(key): {
  isValid: boolean,
  tier: 'free' | 'pro' | 'agency',
  features: {
    adminDashboard: boolean,
    payosAutomation: boolean,
    premiumAgents: boolean,
    advancedAnalytics: boolean
  }
}
```

### Missing: Feature Usage Mapping
License tiers NOT mapped to usage limits - needs:
```
free    → 100 api_calls/day, 10k tokens/day
basic   → 1k api_calls/day, 100k tokens/day
premium → 10k api_calls/day, 1M tokens/day
agency  → 100k api_calls/day, 10M tokens/day
```

---

## 3. Data Storage

### Existing Tables

#### `usage_records` (USED in `usage-metering.ts`)
```sql
- id, org_id, user_id, license_id
- feature, quantity, metadata, recorded_at
```

#### `usage_metrics` (Migration 20260304)
```sql
- id, user_id, org_id, metric_type, metric_value
- period_start, period_end
--_agg per period (monthly)
```

#### `usage_limits` (Migration 20260304)
```sql
- id, plan_id, metric_type, limit_value, limit_period
-- 100 ai_calls/month for free, 1000 for pro, etc.
```

#### `feature_flags` (Migration 20260304)
```sql
- flag_key, flag_name, plan_access:text[]
- ai_insights, ai_copilot, white_label, api_access, etc.
```

#### `user_feature_access` (Migration 20260304)
- Explicit feature grants per user

### Missing: Audit Logs
Current: `audit_logs` exists but **no structured usage-event logging**.
Recommend: Add `audit_type = 'USAGE_TRACKED'` in usage hooks.

---

## 4. Security Patterns

### Rate Limiting (2 implementations)

#### Supabase Edge Function (`check_rate_limit` RPC)
```typescript
// Atomic PostgreSQL rate limiting
SELECT check_rate_limit(key, window_start, max_requests)
-- Uses INSERT ON CONFLICT ... DO UPDATE
```

#### Client-side (`lib/rate-limiter.ts`)
```typescript
const limiter = new RateLimiter({
  key: licenseId || userId,
  points: tier.limits.api_calls_per_minute
})
```

### Required Security for Usage API
- [ ] Service-to-service auth (billing → usage webhooks)
- [ ] Rate limit per license key (not just IP)
- [ ] Query validation (`quantity >= 0`, `feature` whitelist)
- [ ] RLS on `usage_records` → org members only

---

## 5. Billing Integration

### PayOS Webhook Flow (Current)
```
User Payment → PayOS Webhook →
  ├─ update subscription status
  ├─ org_id propagation
  └─ provision license (Phase 3)
```

### Missing: Usage-Based Billing Hooks
**To implement usage metering:**
```
API Call Triggers → UsageMeter.track() →
  ├─ record to usage_records
  ├─ check quota (getOrgUsageByFeature)
  ├─ if exceeded → return 429 with quota info
  └─ at period end → aggregate + bill
```

### Webhook Pattern for Billing
```typescript
// Usage-based billing webhook (ARGH - NOT EXISTING YET)
POST /_internal/billing/usage-summary
{
  org_id: "...",
  period_start: "...",
  period_end: "...",
  features: {
    api_calls: { used: 5000, limit: 10000 },
    tokens: { used: 500k, limit: 1M }
  }
}
```

---

## 6. Implementation Status

### Completed (`src/lib/usage-metering.ts`)
| Feature | Status |
|---------|--------|
| `UsageMeter.track(metric, data)` | ✅ |
| `trackBatch(events)` | ✅ |
| `getUsageStatus()` | ✅ |
| `isRateLimited()` | ✅ |
| `trackApiCall()` | ✅ |
| `trackTokens()` | ✅ |
| `trackCompute()` | ✅ |
| `createUsageMiddleware()` | ✅ |
| Tier limits config (free/basic/premium/enterprise/master) | ✅ |

### Missing Integration Points
| Component | Priority |
|-----------|----------|
| API route instrumentation (track all endpoints) | P1 |
| Supabase Edge Function for server-side tracking | P1 |
| PayOS webhook usage sync | P2 |
| Usage-based pricing calculation | P2 |
| Admin quota monitoring UI | P3 |

---

## 7. Data Schema Recommendations

### New Table (Usage Summary Aggregates)
```sql
CREATE TABLE usage_summary_snapshots (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  feature TEXT NOT NULL,
  total_quantity BIGINT NOT NULL,
  event_count INTEGER NOT NULL,
  cost_estimate NUMERIC(12,4),  -- for billing
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### New Table (Rate Limit Events)
```sql
CREATE TABLE rate_limit_events (
  id UUID PRIMARY KEY,
  user_id UUID,
  org_id UUID,
  license_id UUID,
  key TEXT NOT NULL,
  action TEXT,
  blocked BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 8. Implementation Plan

### Phase 1: Core Integration (2h)
1. Add usage tracking to API routes (`src/utils/api.ts`)
2. Add server-side tracking Edge Function
3. Wire up to existing `usage-metering.ts`

### Phase 2: Billing Sync (3h)
4. Webhook endpoint for usage snapshots
5. Periodic aggregation job (monthly reset)
6. Usage record archival

### Phase 3: Monitoring (2h)
7. Admin quota dashboard
8. Alert on 80%/90% usage
9. Exceeded action (block/retry)

---

## 9. Unresolved Questions

| Question | Owner |
|----------|-------|
| Q1: Should usage tracking be synchronous or async (queue)? | Architecture |
| Q2: How to handle multi-tier(org + plan) combined limits? | Product |
| Q3: Real-time vs batch billing calculation? | Finance |
| Q4: Cross-org usage aggregation for master plan? | Product |
| Q5: Usage data retention policy? | Infra |

---

## 10. Action Items

### Immediate (This Week)
- [ ] Add usage middleware to API routes
- [ ] Create Edge Function `/usage-track` (service key protected)
- [ ] Map license tiers to usage_limits (DB seed)

### Next Week
- [ ] Implement usage-based billing webhook
- [ ] Add admin usage monitoring UI
- [ ] Set up monthly aggregation job

---

## Appendix: File Inventory

### Existing Files
```
src/lib/usage-metering.ts           # Main SDK (COMPLETE)
src/lib/__tests__/usage-metering.test.ts
src/lib/vibe-supabase/usage-tracking-query-helpers.ts
src/lib/vibe-subscription/types.ts   # Types (complete)
supabase/migrations/20260304_usage_metering_feature_flags.sql
```

### New Files Needed
```
supabase/functions/usage-track/index.ts       # P1
src/lib/vibe-payment/usage-billing-sync.ts    # P2
```
