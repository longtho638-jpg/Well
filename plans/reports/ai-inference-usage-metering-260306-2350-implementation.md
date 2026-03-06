# AI Inference Usage Metering Report

**Date:** 2026-03-06
**Type:** Implementation
**Status:** Complete

---

## Overview

Implement usage metering for AI model inference events with tenant isolation via Row-Level Security (RLS) policies and a dedicated webhook edge function.

---

## Implementation Summary

### 1. Usage Events Table with RLS

**File:** `supabase/migrations/202603062300_usage_events_tenant_rls.sql`

#### Schema

```sql
CREATE TABLE usage_events (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,           -- Tenant isolation key
  model_id TEXT NOT NULL,            -- AI model identifier
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Key Features

| Feature | Implementation |
|---------|---------------|
| **Tenant Isolation** | RLS policies with `current_setting('app.current_tenant')` |
| **Token Tracking** | Separate `input_tokens`, `output_tokens`, computed `total_tokens` |
| **TimescaleDB** | Hypertable, compression (7 days), retention (90 days) |
| **Indexes** | `tenant_id`, `model_id`, `timestamp`, composite indexes |

---

### 2. Row-Level Security Policies

#### Tenant Isolation Policies

```sql
-- SELECT: Tenants can only read their own data
CREATE POLICY tenant_isolation_select ON usage_events
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- INSERT: Tenants can only insert their own data
CREATE POLICY tenant_isolation_insert ON usage_events
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant')::uuid);

-- UPDATE/DELETE: Same tenant isolation
```

#### Service Role Bypass

```sql
CREATE POLICY service_bypass ON usage_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

---

### 3. Context Functions

#### `set_tenant_context(p_tenant_id UUID)`

Sets the tenant context for RLS:

```sql
SELECT set_tenant_context('tenant-uuid-here');
```

#### `get_current_tenant()`

Returns the current tenant ID:

```sql
SELECT get_current_tenant();  -- Returns UUID or NULL
```

#### `tenant_can_access(p_tenant_id UUID)`

Validates if current tenant can access data:

```sql
SELECT tenant_can_access('tenant-uuid-here');  -- Returns BOOLEAN
```

---

### 4. AI Inference Webhook Edge Function

**File:** `supabase/functions/ai-inference-webhook/index.ts`

#### Endpoint

```
POST /functions/v1/ai-inference-webhook
```

#### Request Format

```json
{
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "model_id": "gpt-4",
  "input_tokens": 150,
  "output_tokens": 50,
  "metadata": {
    "user_id": "user-uuid",
    "request_id": "req-123",
    "latency_ms": 1200
  }
}
```

#### Response Format

```json
{
  "success": true,
  "event_id": "550e8400-e29b-41d4-a716-446655440001",
  "tokens_used": 200,
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "model_id": "gpt-4"
}
```

---

## Processing Pipeline

### Webhook Ingestion Flow

```
1. Receive POST webhook from AI inference service
   ↓
2. Validate required fields (tenant_id, model_id)
   ↓
3. Validate tenant_id UUID format
   ↓
4. Validate tokens are non-negative
   ↓
5. Enrich metadata with computed values
   ↓
6. Insert into usage_events table (service_role bypasses RLS)
   ↓
7. Return success with event_id and tokens_used
```

---

## Tenant Isolation Architecture

### How RLS Works

```
┌─────────────────────────────────────────────────────────┐
│  Client Request with JWT                                │
│  (contains user_id, tenant_id)                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Supabase Auth validates JWT                            │
│  Sets RLS context variables                             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Query executes with RLS filter applied:                │
│  WHERE tenant_id = current_setting('app.current_tenant')│
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Result: Tenant sees ONLY their own data                │
└─────────────────────────────────────────────────────────┘
```

### Setting Tenant Context

**From Edge Function (service_role):**
```typescript
// Service role bypasses RLS - we manually include tenant_id
const { data } = await supabase
  .from('usage_events')
  .insert({ tenant_id: 'tenant-uuid', ... })
```

**From Client (authenticated user):**
```typescript
// Set tenant context before querying
await supabase.rpc('set_tenant_context', { p_tenant_id: 'tenant-uuid' })

// Now queries are automatically filtered
const { data } = await supabase.from('usage_events').select('*')
// → Only returns rows where tenant_id = 'tenant-uuid'
```

---

## Integration with AI Inference Service

### Example: Trigger Webhook from Inference Service

```typescript
// After AI inference completes
async function logUsage(tenantId: string, modelId: string, tokens: { input: number; output: number }) {
  await fetch('https://YOUR_PROJECT.supabase.co/functions/v1/ai-inference-webhook', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer SERVICE_ROLE_KEY',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tenant_id: tenantId,
      model_id: modelId,
      input_tokens: tokens.input,
      output_tokens: tokens.output,
      metadata: {
        request_id: generateRequestId(),
        latency_ms: latency,
      }
    })
  })
}
```

---

## Usage Examples

### Example 1: Query Tenant's Usage

```typescript
// Set tenant context first
await supabase.rpc('set_tenant_context', { p_tenant_id: tenantId })

// Query last 7 days of usage
const { data } = await supabase
  .from('usage_events')
  .select('*')
  .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
  .order('timestamp', { ascending: false })
```

### Example 2: Get Daily Usage Summary

```sql
-- Using the tenant_daily_usage view
SELECT
  model_id,
  day,
  inference_count,
  total_input_tokens,
  total_output_tokens,
  total_tokens
FROM tenant_daily_usage
WHERE tenant_id = 'tenant-uuid'
  AND day >= NOW() - INTERVAL '30 days'
ORDER BY day DESC;
```

### Example 3: Calculate Monthly Bill

```sql
SELECT
  model_id,
  SUM(total_tokens) AS billable_tokens,
  COUNT(*) AS total_requests
FROM usage_events
WHERE tenant_id = 'tenant-uuid'
  AND timestamp >= date_trunc('month', NOW())
GROUP BY model_id;
```

---

## Security Considerations

### RLS Policy Enforcement

| Scenario | RLS Applied? | Can Access Other Tenants' Data? |
|----------|--------------|--------------------------------|
| Authenticated user query | ✅ Yes | ❌ No |
| Service role (edge function) | ❌ Bypassed | ✅ Yes (by design) |
| Admin with service_role key | ❌ Bypassed | ✅ Yes (admin ops) |
| Anonymous user | N/A (no access) | N/A |

### Best Practices

1. **Always use service_role only in edge functions** - Never expose to client
2. **Validate tenant_id in application logic** - Before inserting via service_role
3. **Use RLS policies for client queries** - Let database enforce isolation
4. **Audit logs for cross-tenant access** - Log all service_role operations

---

## Deployment Steps

```bash
# 1. Apply migration
supabase migration up

# 2. Deploy edge function
supabase functions deploy ai-inference-webhook

# 3. Test webhook
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/ai-inference-webhook \
  -H "Authorization: Bearer SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
    "model_id": "gpt-4",
    "input_tokens": 100,
    "output_tokens": 50
  }'
```

---

## Testing Checklist

- [ ] **RLS Isolation:** Query as tenant A, verify cannot see tenant B's data
- [ ] **Webhook Ingestion:** Send valid payload, verify event inserted
- [ ] **Token Validation:** Send negative tokens, verify 400 error
- [ ] **UUID Validation:** Send invalid tenant_id, verify 400 error
- [ ] **View Access:** Query tenant_daily_usage view, verify correct aggregation
- [ ] **Service Role Bypass:** Verify edge function can insert for any tenant

---

## Performance Considerations

### Hypertable Chunking

- Chunk interval: 1 day
- Compression after: 7 days
- Retention: 90 days

### Query Optimization

```sql
-- Fast: Uses tenant_id + timestamp index
SELECT * FROM usage_events
WHERE tenant_id = 'tenant-uuid'
  AND timestamp >= NOW() - INTERVAL '7 days';

-- Aggregation via view (pre-computed)
SELECT SUM(total_tokens) FROM tenant_daily_usage
WHERE tenant_id = 'tenant-uuid' AND day >= '2026-03-01';
```

---

## Related Files

- `supabase/migrations/202603062300_usage_events_tenant_rls.sql`
- `supabase/functions/ai-inference-webhook/index.ts`
- `supabase/migrations/202603062259_usage_events_metering.sql`

---

## Open Questions

1. **Multi-tenant billing aggregation** - Should we create a billing_summary view per tenant?
2. **Usage alerts** - Implement threshold-based alerts (e.g., 80% quota)?
3. **Real-time streaming** - WebSocket for live usage updates per tenant?
