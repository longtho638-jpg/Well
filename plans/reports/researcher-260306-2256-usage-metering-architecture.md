# Usage Metering Architecture Research Report

**Date:** 2026-03-06
**Researcher:** researcher
**Project:** WellNexus RaaS
**Status:** Complete

---

## Executive Summary

WellNexus already has a **production-grade usage metering system** built on Supabase Postgres with:
- Edge Functions for tracking (`usage-track`, `usage-summary`)
- Native Supabase Realtime subscriptions
- RaaS license-based tier limits
- Polar.sh billing integration
- Automatic quota enforcement

**Recommendation:** Enhance the existing system with TimescaleDB for time-series optimization, but **NO major refactor needed**.

---

## 1. Recommended Architecture

### Current State (Production)
```
┌─────────────────────────────────────────────────────────────────┐
│  Client → Supabase RLS → usage_records table                   │
│            ↓                                                    │
│  Edge Functions: /usage-track (POST), /usage-summary (GET)     │
│            ↓                                                    │
│  UsageAggregator → Realtime subscription → Dashboard updates  │
│            ↓                                                    │
│  usage-billing-webhook → Polar.sh (monthly sync)               │
└─────────────────────────────────────────────────────────────────┘
```

### Recommended Enhancement: TimescaleDB Hypertable

**Why TimescaleDB?**
- Native time-series optimization for `usage_records` (date-range queries)
- Continuous aggregations for reports (pre-computed daily/mo Aggregates)
- Automatic data retention policies
- Linear scaling to billions of rows

**Design Pattern (Hypertable + Materialized Views):**
```sql
-- Convert usage_records to hypertable
SELECT create_hypertable('usage_records', 'recorded_at');

-- Continuous aggregate for daily aggregation (auto-updated)
CREATE MATERIALIZED VIEW daily_usage_aggregates
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', recorded_at) AS day,
  org_id,
  feature,
  SUM(quantity) AS total_quantity,
  COUNT(*) AS event_count
FROM usage_records
GROUP BY day, org_id, feature;

-- Index the hypertable
CREATE INDEX idx_usage_records_org_day
ON usage_records (org_id, time_bucket('1 day', recorded_at));
```

**Migration Path:**
```sql
-- Step 1: Enable extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Step 2: Convert table (non-blocking)
SELECT create_hypertable('usage_records', 'recorded_at', if_not_exists => true);

-- Step 3: Add continuous aggregate
CREATE MATERIALIZED VIEW IF NOT EXISTS usage_daily_summary
WITH (timescaledb.continuous) AS ...
```

### Alternative: Keep Native (Current Setup)

**If NOT using TimescaleDB:**
- Partition `usage_records` by month (manual):
```sql
CREATE TABLE usage_records_2026_03 (
  LIKE usage_records INCLUDING ALL
)/partitions-by-month;

-- Partition key: date_trunc('month', recorded_at)
```
- Use materialized views:
```sql
CREATE MATERIALIZED VIEW org_monthly_usage AS
SELECT
  date_trunc('month', recorded_at) AS billing_month,
  org_id, feature, SUM(quantity) AS total
FROM usage_records
GROUP BY billing_month, org_id, feature;
```

---

## 2. Database Schema Recommendations

### Existing Tables (Working)
| Table | Status | Purpose |
|-------|--------|---------|
| `usage_records` | ✅ Production | Raw usage events (org_id, user_id, feature, quantity, recorded_at) |
| `usage_metrics` | ✅ Production | Aggregated monthly metrics (ai_calls, api_calls, storage_mb) |
| `usage_limits` | ✅ Production | Tier limits per plan |
| `raas_licenses` | ✅ Production | License tier + expiration |
| `usage_billing_sync_log` | ✅ Production | Track Polar sync history |

### Recommended New Schema Elements

#### A. Hypertable Conversion (TimescaleDB Preferred)
```sql
-- After creating hypertable, usage_records becomes:
-- time_bucket('1 day', recorded_at) AS day
-- Efficient for period queries (no full table scans)

-- Query optimization (uses index):
SELECT feature, SUM(quantity) FROM usage_records
WHERE org_id = 'xxx' AND recorded_at >= '2026-03-01'
-- Uses time_bucket index automatically
```

#### B. Usage Summary View (Native Fallback)
```sql
-- If no TimescaleDB, create optimized view:
CREATE OR REPLACE VIEW org_usage_view AS
SELECT
  date_trunc('month', recorded_at) AS billing_month,
  org_id, user_id, license_id, feature,
  SUM(quantity) AS total_quantity,
  COUNT(*) AS event_count,
  MIN(recorded_at) AS first_usage,
  MAX(recorded_at) AS last_usage
FROM usage_records
GROUP BY billing_month, org_id, user_id, license_id, feature;

-- Index for the view:
CREATE INDEX idx_org_usage_monthly
ON org_usage_view (billing_month, org_id);
```

#### C. Quota Enforcement Table (New)
```sql
-- Real-time quota tracking (atomic counters)
CREATE TABLE usage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  feature TEXT NOT NULL,
  current_count BIGINT NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, feature, period_start)
);

-- Trigger function for atomic increment:
CREATE OR REPLACE FUNCTION increment_quota()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO usage_quotas (org_id, feature, current_count, period_start, period_end)
  VALUES (NEW.org_id, NEW.feature, 1, date_trunc('month', NOW()), (date_trunc('month', NOW()) + INTERVAL '1 month')::TIMESTAMPTZ)
  ON CONFLICT (org_id, feature, period_start)
  DO UPDATE SET current_count = usage_quotas.current_count + 1, updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usage_quota
AFTER INSERT ON usage_records
FOR EACH ROW EXECUTE FUNCTION increment_quota();
```

---

## 3. API Specification

### Current API (Edge Functions)
```
POST  /functions/v1/usage-track      → Track single usage event
GET   /functions/v1/usage-summary    → Pull usage summary (HMAC-authed)
POST  /functions/v1/check-rate-limit → Check rate limit status
```

### Recommended Enhancement: REST API Layer

#### `/api/v1/usage/current` - Current Status
```typescript
// GET /api/v1/usage/current?tenant_id=org_123
interface UsageCurrentResponse {
  org_id: string
  license_id: string
  tier: 'free' | 'basic' | 'premium' | 'enterprise' | 'master'
  period: {
    start: string  // ISO today 00:00:00
    end: string    // ISO tomorrow 00:00:00
  }
  metrics: {
    api_calls: { used: number; limit: number; remaining: number; percentage: number }
    tokens: { used: number; limit: number; remaining: number; percentage: number }
    compute_minutes: { used: number; limit: number; remaining: number; percentage: number }
    storage_mb: { used: number; limit: number; remaining: number; percentage: number }
  }
  is_limited: boolean
  reset_at: string
}
```

#### `/api/v1/usage/period` - Period Details
```typescript
// GET /api/v1/usage/period?org_id=xxx&start=2026-03-01&end=2026-03-31
interface UsagePeriodResponse {
  org_id: string
  period: { start: string; end: string }
  summary: Record<string, { total: number; count: number }>
  hourly_trend: Array<{ hour: number; feature: string; quantity: number }>
  top_users: Array<{ user_id: string; total_usage: number; features_used: number }>
}
```

#### `/api/v1/quotas` - Quota Status
```typescript
// GET /api/v1/quotas?org_id=xxx
interface QuotaStatus {
  feature: string
  limit: number          // Plan-defined limit
  used: number           // Current consumption
  remaining: number
  percentage: number     // 0-100
  until_reset: number    // Seconds until period reset
}
```

---

## 4. Implementation Patterns (Code Samples)

### Pattern 1: Real-Time Dashboard (Existing - Working)
```typescript
// Client: Subscribe to real-time updates
const { data: subscription } = supabase
  .channel('usage:org_123')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'usage_records', filter: 'org_id=eq.org_123' },
    (payload) => {
      // Update dashboard UI immediately
      updateDashboard(payload.new);
    }
  )
  .subscribe();

// Server: UsageAggregator service (already exists)
// - Tracks cache updates
// - Notifies subscribers via WebSocket
// - Provides hourly_trend(), getTopUsers() methods
```

### Pattern 2: Quota Check Middleware (Edge Function)
```typescript
// functions/check-quota/index.ts
interface QuotaCheckRequest {
  org_id: string;
  feature: string;
  quantity: number;
}

serve(async (req) => {
  // 1. Parse & validate
  const { org_id, feature, quantity } = await req.json();

  // 2. Fetch current usage + limit
  const { data: quota } = await supabase
    .from('usage_quotas')
    .select('current_count, limit')
    .eq('org_id', org_id)
    .eq('feature', feature)
    .single();

  // 3. Check if over limit
  const would exceed = (quota.current_count + quantity) > quota.limit;

  return jsonRes({ allowed: !wouldExceed, remaining: quota.limit - quota.current_count - quantity });
});
```

### Pattern 3: Batch Usage Tracking (Performance)
```typescript
// Batch insert for high-throughput scenarios
interface UsageEvent {
  org_id: string;
  user_id: string;
  feature: string;
  quantity: number;
  metadata?: Record<string, unknown>;
}

async function trackBatch(events: UsageEvent[]) {
  const rows = events.map(e => ({
    org_id: e.org_id,
    user_id: e.user_id,
    feature: e.feature,
    quantity: e.quantity,
    metadata: e.metadata || {},
    recorded_at: new Date().toISOString()
  }));

  // Single bulk insert (atomic)
  const { error } = await supabase
    .from('usage_records')
    .insert(rows, { count: 'exact' });

  return rows.length;
}
```

### Pattern 4: Usage Summary Report (Aggregation)
```typescript
// Edge function: usage-summary (existing) + enhancement
async function getUsageSummary(org_id: string, period_start: string, period_end: string) {
  // Optimized query with time_bucket (TimescaleDB) or date_trunc (native)
  const { data } = await supabase
    .rpc('get_org_usage_summary', {
      p_org_id: org_id,
      p_period_start: period_start,
      p_period_end: period_end
    });

  // Aggregate into tier limits
  const tierLimits = getTierLimits(license.tier);

  return {
    metrics: {
      api_calls: data.find(x => x.feature === 'api_call')?.total || 0,
      tokens: data.find(x => x.feature === 'tokens')?.total || 0,
      // ... etc
    },
    overage: {
      api_calls: Math.max(0, api_calls - tierLimits.api_calls_per_day),
      // ... etc
    }
  };
}
```

---

## 5. Security Patterns

### JWT Authentication (Already Implemented)
```typescript
// Edge Functions use service_role for admin access
const supabase = createClient(url, serviceRoleKey);

// Or client-side with RLS
const supabase = createClient(url, anonKey);
// RLS policies enforce: org_id = auth.uid() OR admin role
```

### RLS Policies (Already Implemented)
```sql
-- Users can only see their org's usage
CREATE POLICY "usage_own_read" ON usage_records
  FOR SELECT USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

-- Admin read access
CREATE POLICY "usage_admin" ON usage_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_id <= 2)
  );
```

### Rate Limiting (Atomic PostgreSQL)
```sql
-- functions/check-rate-limit/index.ts uses atomic RPC function
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key TEXT, p_window_start TIMESTAMPTZ, p_max_requests INTEGER
) RETURNS BOOLEAN AS $$
DECLARE v_count INTEGER;
BEGIN
  UPDATE rate_limits SET request_count = request_count + 1
  WHERE id = p_key AND window_start >= p_window_start
  RETURNING request_count INTO v_count;

  IF v_count IS NULL THEN
    INSERT INTO rate_limits (id, request_count, window_start)
    VALUES (p_key, 1, NOW());
    RETURN TRUE;
  END IF;

  RETURN v_count <= p_max_requests;
END;
$$ LANGUAGE plpgsql;
```

---

## 6. Metrics to Track (Already Defined)

| Category | Metrics | Current Status |
|----------|---------|----------------|
| AI Inference | `model_inference_count`, `tokens_used`, `agent_executions` | `feature` column |
| Active Users | `daily_active_users`, `monthly_active_users` | Via `user_id` aggregation |
| Feature Usage | `feature_invocation_count`, `api_calls`, `quota_consumed` | `feature` + `quantity` |

**Implementation:**
```typescript
// Track any event type
await meter.track('tokens', { tokens: 2048, metadata: { model: 'gemini-1.5-flash' } });
await meter.track('compute_ms', { computeMs: 1500, metadata: { operation: 'imagegen' } });
await meter.track('api_call', { quantity: 1, metadata: { endpoint: '/api/users' } });
```

---

## 7. Integration Points

### Current Integration Flow
```
Payment (Polar) → Webhook → provisionLicenseOnPayment()
                                        ↓
                              raas_licenses (tier set)
                                        ↓
                              usage-track edge function
                                        ↓
                              usage_records (insert)
                                        ↓
                              Realtime subscription → Dashboard
                                        ↓
                              usage-summary (monthly sync)
                                        ↓
                              Polar.sh billing API
```

### Enhancement: Direct Quota Check
```typescript
// Before processing request, check quota
const { data: license } = await supabase
  .from('raas_licenses')
  .select('tier, metadata')
  .eq('license_key', request.headers.get('X-License-Key'))
  .single();

const tier = license.tier;
const limits = TIER_LIMITS[tier];

// Check if within quota
const quota = await checkOrgQuota(supabase, org_id, feature, limits.api_calls_per_day);
if (quota.remaining <= 0) {
  return jsonRes({ error: 'Quota exceeded' }, 429);
}
```

---

## 8. Migration Plan (If Adding TimescaleDB)

### Phase 1: Enable Extension (Safe, Non-Blocking)
```sql
CREATE EXTENSION IF NOT EXISTS timescaledb;
SELECT create_hypertable('usage_records', 'recorded_at', if_not_exists => true);
```

### Phase 2: Add Continuous Aggregate (Offline Build)
```sql
-- Create aggregate (builds in background)
CREATE MATERIALIZED VIEW daily_usage_summary
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', recorded_at) AS day,
  org_id,
  feature,
  SUM(quantity) AS total,
  COUNT(*) AS event_count
FROM usage_records
GROUP BY day, org_id, feature;

-- Refresh每天 (scheduled job)
SELECT add_job(
  'SELECT materialize_continuous_aggregate(...)',
  '1 day'
);
```

### Phase 3: Migrate Queries (Gradual Rollout)
```sql
-- Conversion: Replace date_trunc with time_bucket
-- Before:
SELECT feature, SUM(quantity) FROM usage_records
WHERE org_id = 'x' AND recorded_at >= '2026-03-01';

-- After:
SELECT feature, SUM(quantity) FROM daily_usage_summary
WHERE org_id = 'x' AND day >= '2026-03-01';
```

---

## 9. Monitoring & Observability

### Dashboard Metrics
```typescript
// Admin dashboard should show:
- Total usage per tier (bar chart)
- Daily usage trend (line chart)
- Top orgs by usage (table)
- Quota utilization per feature (progress bars)
- Error rate (rate limit exceeded, quota exceeded)
```

### Alert Thresholds
```typescript
const ALERT_THRESHOLDS = {
  quota_50: (used, limit) => used >= limit * 0.5,
  quota_90: (used, limit) => used >= limit * 0.9,
  quota_100: (used, limit) => used >= limit,
  rate_limit_hit: (remaining) => remaining === 0,
};
```

---

## 10. Unresolved Questions

| Question | Priority | Notes |
|----------|----------|-------|
| **Need individual user tracking?** | Medium | Current schema tracks org_id + user_id. Decide if per-user quotas needed |
| **HMAC secret rotation?** | Medium | Edge Functions use static `USAGE_WEBHOOK_SECRET`. Add rotation mechanism |
| **Long-term retention policy?** | Low | Consider cold storage (S3) after 90 days for audit compliance |
| **Cross-org aggregation?** | Low | Platform admin needs aggregate across all orgs (RLS bypass) |
| **Real-time alerting?** | Medium | Trigger on_quota_90% via Realtime + edge function notification |

---

## Recommendation Summary

### ✅ DO (Immediate)
1. **Add `license_id` index** - Already exists, verify usage in queries
2. **Enable TimescaleDB extension** - Enables time-series optimization (non-breaking)
3. **Add continuous aggregate** - Pre-compute daily summaries

### 🟡 CONSIDER (If Scaling)
1. **Separate rate_limits table** from usage_records (cleaner separation)
2. **Add Redis-compatible rate limiter** for sub-ms latency (if >10k rps)
3. **Archive old data** to S3 for compliance

### 🚫 DO NOT (Avoid)
1. **Don't migrate away from Supabase** - Current setup is production-ready
2. **Don't re-invent quota tracking** - Use existing `usage_quotas` pattern
3. **Don't skip HMAC auth** - Edge Functions must verify signatures

---

##uggested Next Steps

1. **Enable TimescaleDB** (15 min):
   ```sql
   CREATE EXTENSION IF NOT EXISTS timescaledb;
   SELECT create_hypertable('usage_records', 'recorded_at');
   ```

2. **Add continuous aggregate** (30 min):
   ```sql
   CREATE MATERIALIZED VIEW daily_usage_summary WITH (timescaledb.continuous) AS ...
   ```

3. **Optional: Enhance API** (1-2 days) - Add `/api/v1/usage/current` REST endpoint

---

**Report generated:** 2026-03-06 22:56
**Files analyzed:** 12 files (usage-metering.ts, Edge Functions, migrations)
**Status:** Ready for implementation
