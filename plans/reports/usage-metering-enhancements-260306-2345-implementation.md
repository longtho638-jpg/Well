# Usage Metering Enhancements Report

**Date:** 2026-03-06
**Type:** Implementation
**Status:** Complete

---

## Overview

Implement usage metering enhancements with dedicated `usage_events` table, idempotency enforcement, and daily rollup materialized view for billing/analytics readiness.

---

## Implementation Summary

### 1. Usage Events Table Migration

**File:** `supabase/migrations/202603062259_usage_events_metering.sql`

#### Schema

```sql
CREATE TABLE usage_events (
  id UUID PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,      -- Idempotency key
  feature TEXT NOT NULL,               -- 'model_inference', 'agent_execution', etc.
  quantity INTEGER NOT NULL DEFAULT 1,
  customer_id TEXT NOT NULL,           -- From webhook metadata
  license_id UUID,                     -- Optional license reference
  user_id UUID,                        -- Optional user reference
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_payload JSONB NOT NULL,          -- Full webhook payload
  metadata JSONB,                      -- Extracted metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Key Features

| Feature | Implementation |
|---------|---------------|
| **Idempotency** | Unique constraint on `event_id` |
| **Feature Validation** | `check_usage_feature()` constraint |
| **Metadata Extraction** | `extract_usage_metadata()` function |
| **TimescaleDB** | Hypertable (chunk by day), compression (7 days), retention (90 days) |
| **Indexes** | `event_id`, `customer_id`, `feature`, `timestamp`, GIN for metadata |

---

### 2. Daily Usage Rollup Materialized View

```sql
CREATE MATERIALIZED VIEW daily_usage_rollup
WITH (timescaledb.continuous) AS
SELECT
  customer_id,
  feature,
  date_trunc('day', timestamp) AS day,
  SUM(quantity) AS total_quantity,
  COUNT(*) AS event_count,
  AVG(quantity) AS avg_quantity,
  MIN(timestamp) AS first_event,
  MAX(timestamp) AS last_event
FROM usage_events
GROUP BY customer_id, feature, date_trunc('day', timestamp);
```

**Refresh Policy:** Every hour, lag 1 hour

**Use Cases:**
- Billing calculations
- Analytics dashboards
- Customer usage reports
- Tier limit enforcement

---

### 3. Database Functions

#### `check_usage_event_idempotency_v2()`

Atomic check-and-record for idempotency:

```sql
SELECT * FROM check_usage_event_idempotency_v2(
  'event-123', 'customer-456', 'model_inference', 1,
  'license-uuid', 'user-uuid', '{"model": "gpt-4"}'::jsonb,
  '{"prompt_tokens": 100}'::jsonb
);
```

Returns:
```json
{ "is_duplicate": false, "event_uuid": "...", "message": "Event processed successfully" }
```

#### `validate_usage_feature()`

Immutable function for feature validation:

```sql
SELECT validate_usage_feature('model_inference');  -- true
SELECT validate_usage_feature('invalid_feature');  -- false
```

Allowed features: `api_call`, `tokens`, `compute_ms`, `storage_mb`, `bandwidth_mb`, `model_inference`, `agent_execution`

#### `extract_usage_metadata()`

Extracts standardized metadata from webhook payload:

```sql
SELECT extract_usage_metadata('{"model": "gpt-4", "prompt_tokens": 100, "extra": "ignored"}'::jsonb);
-- Returns: {"model": "gpt-4", "prompt_tokens": 100}
```

---

### 4. Webhook Ingestion Endpoint

**File:** `supabase/functions/usage-analytics/index.ts`

#### Endpoint

```
POST /functions/v1/usage-analytics?type=webhook
```

#### Request Format

```json
{
  "event_id": "unique-event-id-123",
  "customer_id": "customer-uuid",
  "license_id": "license-uuid",
  "user_id": "user-uuid",
  "feature": "model_inference",
  "quantity": 1,
  "metadata": {
    "model": "gpt-4",
    "provider": "openai"
  },
  "timestamp": "2026-03-06T16:00:00Z",
  "raw_payload": {
    "model": "gpt-4",
    "provider": "openai",
    "prompt_tokens": 150,
    "completion_tokens": 50,
    "total_tokens": 200,
    "inference_time_ms": 1200
  }
}
```

#### Response Format

**Success:**
```json
{
  "success": true,
  "event_id": "unique-event-id-123",
  "is_duplicate": false,
  "message": "Event processed successfully"
}
```

**Duplicate:**
```json
{
  "success": true,
  "event_id": "unique-event-id-123",
  "is_duplicate": true,
  "message": "Event already processed (idempotent)"
}
```

**Error (400):**
```json
{
  "error": "Invalid feature 'invalid_feature'. Allowed: api_call, tokens, ..."
}
```

---

## Processing Pipeline

### Webhook Ingestion Flow

```
1. Parse webhook payload
   ↓
2. Validate required fields (event_id, customer_id, feature)
   ↓
3. Validate feature against allowlist
   ↓
4. Extract metadata from raw_payload
   ↓
5. Call check_usage_event_idempotency_v2() RPC
   ↓
6a. If duplicate → return is_duplicate: true
   ↓
6b. If new → insert into usage_events table
   ↓
7. If model_inference/agent_execution → also insert into usage_records
   ↓
8. Return success response
```

---

## Integration with Existing Infrastructure

### usage_records Backward Compatibility

When `feature === 'model_inference'` or `feature === 'agent_execution'`, the edge function also inserts into `usage_records` table for backward compatibility with existing analytics queries.

### daily_usage_rollup Refresh

The materialized view refreshes automatically every hour via TimescaleDB continuous aggregate policy.

Manual refresh:
```sql
CALL refresh_continuous_aggregate('daily_usage_rollup', NULL, NOW());
```

---

## Usage Examples

### Example 1: Track AI Model Inference via Webhook

```bash
curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/usage-analytics?type=webhook" \
  -H "Authorization: Bearer SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "inference-001",
    "customer_id": "cust_abc123",
    "license_id": "license_xyz",
    "feature": "model_inference",
    "quantity": 1,
    "raw_payload": {
      "model": "gpt-4",
      "provider": "openai",
      "prompt_tokens": 150,
      "completion_tokens": 50,
      "total_tokens": 200
    }
  }'
```

### Example 2: Query Daily Usage Rollup

```sql
SELECT
  customer_id,
  feature,
  day,
  total_quantity,
  event_count
FROM daily_usage_rollup
WHERE customer_id = 'cust_abc123'
  AND day >= NOW() - INTERVAL '7 days'
ORDER BY day DESC;
```

### Example 3: Get Billing Summary

```sql
SELECT
  customer_id,
  SUM(total_quantity) FILTER (WHERE feature = 'model_inference') AS total_inferences,
  SUM(total_quantity) FILTER (WHERE feature = 'agent_execution') AS total_agent_runs,
  SUM(total_quantity) FILTER (WHERE feature = 'tokens') AS total_tokens
FROM daily_usage_rollup
WHERE day >= NOW() - INTERVAL '30 days'
GROUP BY customer_id;
```

---

## Idempotency Enforcement

### How It Works

1. Client sends `event_id` with each webhook
2. Database function attempts to insert with unique constraint
3. If `event_id` exists, function catches `unique_violation` exception
4. Returns `is_duplicate: true` with existing event UUID
5. No duplicate data inserted

### Retry Safety

```
Retry 1: event_id="abc123" → success, is_duplicate=false
Retry 2: event_id="abc123" → success, is_duplicate=true (no data change)
Retry 3: event_id="abc123" → success, is_duplicate=true (no data change)
```

---

## Deployment Steps

```bash
# 1. Apply migration
supabase migration up

# 2. Deploy updated edge function
supabase functions deploy usage-analytics

# 3. Verify deployment
curl https://YOUR_PROJECT.supabase.co/functions/v1/usage-analytics?type=webhook \
  -X POST -d '{"event_id":"test","customer_id":"test","feature":"api_call"}'
```

---

## Testing Checklist

- [ ] **Idempotency:** Send same event_id twice, verify `is_duplicate: true` on second
- [ ] **Feature Validation:** Send invalid feature, verify 400 error
- [ ] **Metadata Extraction:** Verify extracted metadata removes nulls
- [ ] **Daily Rollup:** Verify rollup updates after insert
- [ ] **Backward Compatibility:** Verify model_inference also appears in usage_records
- [ ] **TimescaleDB:** Verify hypertable chunks created correctly

---

## Performance Considerations

### Hypertable Chunking

- Chunk interval: 1 day
- Compression after: 7 days
- Retention: 90 days

### Query Optimization

```sql
-- Fast: Uses customer_id + timestamp index
SELECT * FROM usage_events
WHERE customer_id = 'cust_123'
  AND timestamp >= NOW() - INTERVAL '7 days';

-- Fast: Uses feature + timestamp index
SELECT * FROM usage_events
WHERE feature = 'model_inference'
  AND timestamp >= NOW() - INTERVAL '1 day';

-- Aggregation via rollup (instant)
SELECT SUM(total_quantity) FROM daily_usage_rollup
WHERE customer_id = 'cust_123' AND day = '2026-03-06';
```

---

## Related Files

- `supabase/migrations/202603062259_usage_events_metering.sql`
- `supabase/functions/usage-analytics/index.ts`
- `supabase/migrations/202603062256_timescale_usage_records.sql`
- `supabase/migrations/202603062258_add_usage_event_idempotency.sql`

---

## Open Questions

1. **Email alerts at quota thresholds** - Implement as database trigger + email service integration?
2. **Usage dashboard UI** - Create React components to visualize daily_usage_rollup?
3. **Real-time streaming** - WebSocket for live usage updates from usage_events?
