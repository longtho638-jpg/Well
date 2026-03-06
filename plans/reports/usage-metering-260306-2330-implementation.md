# Usage Metering Implementation Report

**Date:** 2026-03-06
**Type:** Implementation
**Status:** Complete

---

## Overview

Implement usage metering infrastructure by enhancing the existing Supabase Edge Function `usage-analytics` to capture, validate, and store granular AI model usage events into the TimescaleDB-backed `usage_records` table.

---

## Implementation Summary

### 1. Idempotency Table Migration

**File:** `supabase/migrations/202603062258_add_usage_event_idempotency.sql`

Created `usage_event_idempotency` table to prevent duplicate event processing:

```sql
CREATE TABLE usage_event_idempotency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL,
  license_id UUID,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Features:**
- Unique constraint on `event_id` for idempotency
- Indexes on `event_id`, `user_id`, `license_id`
- 30-day retention policy via TimescaleDB
- `check_usage_event_idempotency()` function for atomic check-and-record

---

### 2. Usage Analytics Edge Function Enhancement

**File:** `supabase/functions/usage-analytics/index.ts`

Added **POST endpoint** for usage event ingestion:

#### Request Format

```json
POST /functions/v1/usage-analytics
{
  "event_id": "unique-event-id-123",
  "user_id": "user-uuid",
  "license_id": "license-uuid",
  "events": [
    {
      "feature": "model_inference",
      "quantity": 1,
      "metadata": {
        "model": "gpt-4",
        "provider": "openai",
        "prompt_tokens": 150,
        "completion_tokens": 50
      },
      "timestamp": "2026-03-06T16:00:00Z"
    },
    {
      "feature": "agent_execution",
      "quantity": 1,
      "metadata": {
        "agent_type": "planner"
      }
    }
  ]
}
```

#### Response Format

```json
{
  "processed": 2,
  "duplicates": 0,
  "warnings": [],
  "event_id": "unique-event-id-123"
}
```

---

## Processing Pipeline

### Step 1: Validate Request
- Check required fields: `event_id`, `user_id`, `license_id`
- Validate `events` array is non-empty
- Return 400 if validation fails

### Step 2: Check Idempotency
- Call `check_usage_event_idempotency()` RPC function
- If duplicate detected, return early with `duplicates: 1`
- Idempotency ensures retry safety

### Step 3: Validate License
- Query `raas_licenses` table
- Check license exists and status
- Add warnings if license not active (but continue processing)

### Step 4: Validate Events
- Validate feature type against allowed list
- Validate quantity is positive number
- Skip invalid events with warnings

### Step 5: Batch Insert
- Insert all valid records into `usage_records`
- TimescaleDB hypertable handles partitioning automatically
- Rollback idempotency record on insert failure

### Step 6: Return Response
- Return count of processed events
- Include any warnings
- Structured logs for debugging

---

## Integration with Existing Infrastructure

### License Validation via Check-Quota

The ingestion endpoint validates license existence but does **not** enforce quota limits during ingestion. Quota enforcement happens separately via:

```
POST /functions/v1/check-quota
{
  "user_id": "...",
  "license_id": "...",
  "feature": "model_inference",
  "requested_quantity": 1
}
```

**Recommended Flow:**
1. Call `check-quota` **before** making API call
2. If allowed, proceed with AI inference
3. Call `usage-analytics` POST to record usage

### TimescaleDB Integration

Records are automatically optimized by TimescaleDB:
- **Hypertable:** Chunked by day (`recorded_at`)
- **Compression:** Chunks older than 7 days
- **Continuous Aggregations:** `usage_hourly`, `usage_daily` materialized views
- **Retention:** 90-day auto-delete

---

## Usage Examples

### Example 1: Track AI Model Inference

```typescript
import { UsageMeter } from '@/lib/usage-metering'

const meter = new UsageMeter(supabase, { userId, licenseId })

await meter.trackModelInference({
  model: 'claude-sonnet-4',
  provider: 'anthropic',
  prompt_tokens: 1200,
  completion_tokens: 450,
})
```

### Example 2: Track Agent Execution

```typescript
await meter.trackAgentExecution('planner', {
  task_id: 'task-123',
  duration_ms: 2500,
})
```

### Example 3: Batch Ingestion via Edge Function

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/usage-analytics \
  -H "Authorization: Bearer SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "batch-001",
    "user_id": "user-uuid",
    "license_id": "license-uuid",
    "events": [
      {
        "feature": "model_inference",
        "quantity": 5,
        "metadata": { "model": "gpt-4", "provider": "openai" }
      },
      {
        "feature": "agent_execution",
        "quantity": 3,
        "metadata": { "agent_type": "researcher" }
      }
    ]
  }'
```

---

## Schema Alignment

### Migrations Referenced

| Migration | Purpose |
|-----------|---------|
| `202603062256_timescale_usage_records.sql` | TimescaleDB hypertable, compression, aggregations |
| `202603062257_add_ai_metrics.sql` | AI metrics constraints, database functions |
| `202603062258_add_usage_event_idempotency.sql` | Idempotency table and function |

### usage_records Schema

```sql
CREATE TABLE usage_records (
  id UUID PRIMARY KEY,
  org_id UUID,
  user_id UUID NOT NULL,
  license_id UUID,
  feature TEXT NOT NULL,  -- 'api_call' | 'tokens' | 'compute_ms' | 'model_inference' | 'agent_execution'
  quantity INTEGER NOT NULL,
  metadata JSONB,
  recorded_at TIMESTAMPTZ NOT NULL
);
```

---

## Structured Logging

All ingestion events are logged with format:

```
[INGESTION] Received event_id=xxx, user_id=yyy, license_id=zzz, event_count=N
[INGESTION] SUCCESS event_id=xxx, processed=N, duration_ms=XX
[INGESTION] DUPLICATE detected event_id=xxx
[INGESTION] ERROR: <error message>
```

Logs can be exported to external logging services via Supabase Logs integration.

---

## Deployment Steps

```bash
# 1. Apply idempotency migration
supabase migration up

# 2. Deploy updated edge function
supabase functions deploy usage-analytics

# 3. Verify deployment
curl https://YOUR_PROJECT.supabase.co/functions/v1/usage-analytics
# Should return 400 (missing params) not 404
```

---

## Testing Checklist

- [ ] Idempotency: Send same event_id twice, second should return `duplicates: 1`
- [ ] License validation: Send invalid license_id, should return warning
- [ ] Feature validation: Send invalid feature, should skip with warning
- [ ] Batch insert: Send 10 events, verify all inserted
- [ ] TimescaleDB: Verify records appear in `usage_hourly` view after refresh
- [ ] Quota enforcement: Call check-quota before/after ingestion

---

## Open Questions

1. **Email alerts at 80%/90% thresholds** - Should be implemented as separate trigger-based notification system?
2. **Usage dashboard UI** - Should we create React components to display analytics?
3. **Real-time streaming** - Consider WebSocket for live usage updates?

---

## Related Files

- `src/lib/usage-metering.ts` - Client SDK
- `src/lib/usage-analytics.ts` - Analytics query SDK
- `supabase/functions/usage-analytics/index.ts` - Edge function (GET + POST)
- `supabase/functions/check-quota/index.ts` - Quota enforcement
- `supabase/migrations/202603062256-2258_*.sql` - Database schema
