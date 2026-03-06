# Usage Metering with Billing Integration Report

**Date:** 2026-03-06
**Type:** Implementation
**Status:** Complete

---

## Overview

Implement usage metering with webhook signature validation and Stripe/Polar billing integration for AI inference events.

---

## Implementation Summary

### 1. Usage Records Table with Billing Context

**File:** `supabase/migrations/202603062355_usage_records_billing_integration.sql`

#### Schema

```sql
CREATE TABLE usage_records (
  id UUID PRIMARY KEY,

  -- Tenant/User identification
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  license_id UUID,

  -- AI Model information
  model_id TEXT NOT NULL,
  model_provider TEXT,

  -- Token usage
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,

  -- Billing context
  stripe_customer_id TEXT,
  polar_customer_id TEXT,
  billing_period_start TIMESTAMPTZ,
  billing_period_end TIMESTAMPTZ,

  -- Event metadata
  event_id TEXT UNIQUE,
  request_id TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,

  -- Audit fields
  processed_for_billing BOOLEAN DEFAULT FALSE,
  invoice_id TEXT
);
```

---

### 2. Key Features

| Feature | Implementation |
|---------|---------------|
| **RLS Policies** | User isolation (`user_id = auth.uid()`) + tenant isolation |
| **Webhook Signature** | HMAC-SHA256 validation with `WEBHOOK_SHARED_SECRET` |
| **Stripe Integration** | `stripe_customer_id` stored per record |
| **Polar Integration** | `polar_customer_id` stored per record |
| **Billing Periods** | Auto-calculated (daily UTC) |
| **Idempotency** | Unique constraint on `event_id` |
| **TimescaleDB** | Hypertable, compression, 90-day retention |

---

### 3. Database Functions

#### `validate_webhook_signature()`

```sql
SELECT validate_webhook_signature(
  '{"tenant_id": "..."}',
  'sha256=abc123...',
  'webhook_secret'
);
-- Returns: true/false
```

#### `calculate_tenant_billing()`

```sql
SELECT * FROM calculate_tenant_billing(
  'tenant-uuid',
  '2026-03-01',
  '2026-04-01'
);

-- Returns:
-- model_id | total_input_tokens | total_output_tokens | billable_amount
-- gpt-4    | 150000            | 50000              | 0.20
```

#### `get_current_usage()`

```sql
SELECT * FROM get_current_usage('user-uuid', 'gpt-4');
-- Returns current day usage for quota enforcement
```

---

### 4. Enhanced Webhook Edge Function

**File:** `supabase/functions/ai-inference-webhook/index.ts`

#### Endpoint

```
POST /functions/v1/ai-inference-webhook
```

#### Headers

```
X-Webhook-Signature: sha256=<hmac-signature>
X-Webhook-Timestamp: <unix-timestamp>
```

#### Request Format

```json
{
  "event_id": "unique-event-id",
  "tenant_id": "tenant-uuid",
  "user_id": "user-uuid",
  "license_id": "license-uuid",
  "model_id": "gpt-4",
  "model_provider": "openai",
  "input_tokens": 150,
  "output_tokens": 50,
  "metadata": {
    "request_id": "req-123",
    "latency_ms": 1200
  },
  "stripe_customer_id": "cus_stripe123",
  "polar_customer_id": "pol_polar456"
}
```

#### Response Format

```json
{
  "success": true,
  "event_id": "unique-event-id",
  "tokens_used": 200,
  "tenant_id": "tenant-uuid",
  "model_id": "gpt-4",
  "billing": {
    "stripe_customer_id": "cus_stripe123",
    "polar_customer_id": "pol_polar456",
    "billing_period_start": "2026-03-06T00:00:00Z",
    "billing_period_end": "2026-03-07T00:00:00Z"
  }
}
```

---

## Signature Validation

### How It Works

```
1. Client sends webhook with:
   - Body: JSON payload
   - Header: X-Webhook-Signature: sha256=<hmac>
   - Header: X-Webhook-Timestamp: <unix>

2. Server computes:
   - signed_payload = "${timestamp}.${body}"
   - expected_signature = HMAC-SHA256(webhook_secret, signed_payload)

3. Server compares:
   - If computed == received → valid
   - If timestamp > 5 minutes old → invalid
```

### Edge Function Implementation

```typescript
async function validateWebhookSignature(
  req: Request,
  signature: string,
  timestamp: string
): Promise<boolean> {
  const webhookSecret = Deno.env.get('WEBHOOK_SHARED_SECRET')
  if (!webhookSecret) return true // Allow if not configured

  // Validate timestamp (5 minute tolerance)
  const now = Math.floor(Date.now() / 1000)
  const timestampNum = parseInt(timestamp, 10)
  if (Math.abs(now - timestampNum) > 300) return false

  // Compute HMAC-SHA256
  const body = await req.text()
  const key = await crypto.subtle.importKey(...)
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData)

  // Compare signatures
  return computedSignature === expectedSignature
}
```

---

## Billing Integration

### Stripe Customer Flow

```
1. Webhook received with stripe_customer_id
   ↓
2. If not provided, look up from license metadata
   ↓
3. Store in usage_records.stripe_customer_id
   ↓
4. Billing aggregation queries use this field
```

### License Metadata Schema

```json
{
  "stripe_customer_id": "cus_xxxxx",
  "polar_customer_id": "pol_xxxxx",
  "source": "stripe" | "polar" | "payos"
}
```

### Billing Calculation Query

```sql
SELECT
  stripe_customer_id,
  SUM(total_tokens) AS billable_tokens,
  SUM(total_tokens) * 0.000001 AS billable_amount_usd
FROM usage_records
WHERE billing_period_start >= '2026-03-01'
  AND billing_period_end < '2026-04-01'
GROUP BY stripe_customer_id;
```

---

## RLS Policies

### User Isolation

```sql
-- Users can only see their own records
CREATE POLICY user_isolation_select ON usage_records
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can only insert their own records
CREATE POLICY user_isolation_insert ON usage_records
  FOR INSERT
  WITH CHECK (user_id = auth.uid());
```

### Tenant Isolation

```sql
-- Tenants can see all records for their tenant
CREATE POLICY tenant_isolation_select ON usage_records
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

### Service Role Bypass

```sql
-- Service role bypasses RLS (for webhooks and billing)
CREATE POLICY service_bypass ON usage_records
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

---

## Processing Pipeline

### Webhook Flow

```
1. Receive POST webhook
   ↓
2. Validate signature (if provided)
   ↓
3. Parse and validate payload
   ↓
4. Look up Stripe/Polar customer from license
   ↓
5. Calculate billing period (current day UTC)
   ↓
6. Insert into usage_records with billing context
   ↓
7. Return success with billing info
```

---

## Usage Examples

### Example 1: Send Webhook with Signature

```bash
#!/bin/bash
WEBHOOK_SECRET="your-shared-secret"
TIMESTAMP=$(date +%s)
BODY='{"tenant_id":"uuid","user_id":"uuid","model_id":"gpt-4","input_tokens":100,"output_tokens":50}'
SIGNATURE=$(echo -n "${TIMESTAMP}.${BODY}" | openssl dgst -sha256 -hmac "${WEBHOOK_SECRET}" | awk '{print $2}')

curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/ai-inference-webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=${SIGNATURE}" \
  -H "X-Webhook-Timestamp: ${TIMESTAMP}" \
  -d "${BODY}"
```

### Example 2: Query Billing Summary

```typescript
// Get current month billing for tenant
const { data } = await supabase
  .from('billing_usage_summary')
  .select('*')
  .eq('tenant_id', tenantId)
  .gte('usage_date', new Date('2026-03-01'))
  .lt('usage_date', new Date('2026-04-01'))
```

### Example 3: Calculate Invoice Amount

```sql
SELECT
  stripe_customer_id,
  SUM(total_tokens) AS total_tokens,
  ROUND(SUM(total_tokens)::NUMERIC * 0.000001, 2) AS amount_usd
FROM usage_records
WHERE billing_period_start >= '2026-03-01'
  AND billing_period_end < '2026-04-01'
GROUP BY stripe_customer_id;
```

---

## Environment Variables

```bash
# Webhook security
WEBHOOK_SHARED_SECRET="your-256-bit-secret"

# Supabase
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."
```

---

## Deployment Steps

```bash
# 1. Apply migration
supabase migration up

# 2. Set webhook secret
supabase secrets set WEBHOOK_SHARED_SECRET="your-secret"

# 3. Deploy edge function
supabase functions deploy ai-inference-webhook

# 4. Test webhook
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/ai-inference-webhook \
  -H "Content-Type: application/json" \
  -d '{"tenant_id":"uuid","user_id":"uuid","model_id":"gpt-4","input_tokens":100,"output_tokens":50}'
```

---

## Testing Checklist

- [ ] **Signature Validation:** Send valid/invalid signatures
- [ ] **Timestamp Validation:** Send expired timestamp (> 5 min)
- [ ] **Billing Context:** Verify Stripe/Polar customer IDs stored
- [ ] **RLS Policies:** Verify users can only see their own data
- [ ] **Idempotency:** Send same event_id twice
- [ ] **License Lookup:** Verify customer IDs fetched from license

---

## Related Files

- `supabase/migrations/202603062355_usage_records_billing_integration.sql`
- `supabase/functions/ai-inference-webhook/index.ts`
- `supabase/migrations/202603062300_usage_events_tenant_rls.sql`

---

## Open Questions

1. **Pricing tiers** - Should we add per-model pricing (different rates for GPT-4 vs Claude)?
2. **Invoice generation** - Auto-create Stripe invoices at period end?
3. **Usage alerts** - Email alerts at 80%/90%/100% quota thresholds?
