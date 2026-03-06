# Webhook Security & Integration Research Report

**Date:** 2026-03-06
**Work Context:** /Users/macbookprom1/mekong-cli/apps/well
**Researcher:** researcher

---

## 1. Stripe Webhook Specification

### 1.1 Signature Header Format
```
Stripe-Signature: t=<timestamp>,v1=<signature>
```
Example: `t=1492774577,v1=5257a869e7ecebed...`

### 1.2 Verification Algorithm
1. Extract timestamp (`t=`) and signature (`v1=`) from header
2. Create `signed_payload` = `{timestamp}.{raw_payload}`
3. Compute HMAC-SHA256: `HMAC(secret, signed_payload)`
4. Compare signatures using constant-time comparison
5. Validate timestamp tolerance (default: 5 minutes)

### 1.3 Critical Event Types
| Event | Description |
|-------|-------------|
| `customer.subscription.created` | New subscription created |
| `customer.subscription.updated` | Subscription modified |
| `customer.subscription.deleted` | Cancellation or expiration |
| `checkout.session.completed` | Checkout payment complete |
| `payment_intent.succeeded` | Payment received |
| `payment_method.attached` | Payment method added |

### 1.4 Idempotency Pattern
```
// Use event.id or (data.object.id, event.type) pair
const processedEvents = await db(table)
  .where('event_id', eventId)
  .orWhereRaw('data_object_id = ? AND event_type = ?', [dataObjectId, eventType])
  .first();
```

### 1.5 Security Checklist
- ✅ Timestamp validation (5-min tolerance)
- ✅ HMAC-SHA256 signature verification
- ✅ Constant-time comparison (timing attack prevention)
- ✅ Idempotency key tracking
- ✅ Secret stored in Supabase secrets (not code)

---

## 2. PayOS (Vietnamese Gateway) Webhook

### 2.1 Current Implementation (Already in Codebase)
The project uses **PayOS** as primary Vietnamese payment gateway with full webhook infrastructure:

**File:** `supabase/functions/payos-webhook/index.ts`

**Signature Method:** HMAC-SHA256
**Header:** `X-Webhook-Secret` (app-level) + `signature` field in payload

### 2.2 PayOS Signature Verification
```typescript
// Pattern: flat key=value& joined
const sortedKeys = Object.keys(data).sort();
const message = sortedKeys.map(k => `${k}=${data[k]}`).join('&');
const computed = await hmacSha256(checksumKey, message);
return secureCompare(signature, computed);
```

### 2.3 PayOS Webhook Events
| Code | Event | Status |
|------|-------|--------|
| `00` | Payment received | `paid` |
| `01` | Payment cancelled | `cancelled` |
| `other` | Pending | `pending` |

### 2.4[RaaS License Gate](file:///Users/macbookprom1/mekong-cli/apps/well/CLAUDE.md)
Production webhooks require valid `RAAS_LICENSE_KEY`:
```
/^RAAS-\d{10}-[a-zA-Z0-9]{6,}$/
```

---

## 3. Security Patterns (Production Grade)

### 3.1 HMAC-SHA256 Implementation
```typescript
// supabase/functions/_shared/vibe-payos/crypto.ts
export async function hmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey('raw', encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(sigBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Constant-time comparison
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}
```

### 3.2 Timestamp Validation
```typescript
// Add to validation logic
const timestamp = Date.now();
const MAX_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes
if (Math.abs(payload.timestamp - timestamp) > MAX_TOLERANCE_MS) {
  throw new Error('Webhook timestamp expired (replay attack detected)');
}
```

### 3.3 Secret Management
```bash
# Supabase CLI
supabase secrets set PAYOS_CHECKSUM_KEY=your_checksum_key
supabase secrets set WEBHOOK_SECRET=your_webhook_secret
supabase secrets set RAAS_LICENSE_SECRET=your_license_secret

# Verify
supabase secrets list
```

### 3.4 Rate Limiting
```typescript
// Current implementation
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // per orderCode

function checkRateLimit(key: string): boolean {
  // Per-orderCode throttling
}
```

---

## 4. Error Handling & Retry Patterns

### 4.1 Dead Letter Queue (DLQ) Architecture
**Files:**
- `src/lib/vibe-payment/dead-letter-queue-service.ts`
- `supabase/functions/dlq-retry-job/index.ts`
- `supabase/functions/webhook-retry/index.ts`

**Schema (Supabase):**
```sql
CREATE TABLE dead_letter_queue (
  id UUID PRIMARY KEY,
  event_type TEXT,
  order_code INTEGER,
  raw_payload JSONB,
  signature TEXT,
  error_message TEXT,
  error_details JSONB,
  failure_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  status TEXT CHECK (status IN ('pending', 'processing', 'resolved', 'discarded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_error_at TIMESTAMPTZ
);
```

### 4.2 Exponential Backoff
```typescript
// supabase/functions/_shared/utils.ts
export function calculateBackoffDelay(
  failureCount: number,
  baseDelayMs: number = 60000,
  maxDelayMs: number = 3600000
): number {
  const count = Math.max(1, failureCount);
  return Math.min(baseDelayMs * Math.pow(2, count - 1), maxDelayMs);
}

// Example: 1→2→4→8→16 minutes (capped at 1hr)
```

### 4.3 Retry Strategy
| Attempt | Delay |
|---------|-------|
| 1st | 1 min |
| 2nd | 2 min |
| 3rd | 4 min |
| 4th | 8 min |
| 5th+ | Discard (16 min capped) |

---

## 5. Implementation Pattern (Recommended)

### 5.1 Webhook Handler Template (Deno Edge Function)
```typescript
// supabase/functions/my-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createAdminClient } from '../_shared/vibe-payos/client.ts';
import { verifyWebhookSignature, hmacSha256 } from '../_shared/vibe-payos/crypto.ts';
import { calculateBackoffDelay, sanitizeErrorMessage } from '../_shared/utils.ts';

const corsHeaders = { /* ... */ };

serve(async (req) => {
  // 1. CORS preflight
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // 2. RaaS License Gate (production only)
  const licenseKey = Deno.env.get('RAAS_LICENSE_KEY');
  const isProduction = Deno.env.get('DENO_DEPLOYMENT_ID') !== undefined;
  if (isProduction && (!licenseKey || !/^RAAS-\d{10}-[a-zA-Z0-9]{6,}$/.test(licenseKey))) {
    return new Response(JSON.stringify({ error: 'Invalid RaaS license' }), { status: 403 });
  }

  // 3. Webhook secret verification
  const secret = req.headers.get('X-Webhook-Secret');
  const expectedSecret = Deno.env.get('WEBHOOK_SECRET');
  if (secret !== expectedSecret) return new Response('Unauthorized', { status: 401 });

  try {
    const payload = await req.json();

    // 4. Input validation
    if (!payload.data?.orderCode || !payload.signature) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
    }

    // 5. HMAC verification
    const checksumKey = Deno.env.get('PAYOS_CHECKSUM_KEY');
    const isValid = await verifyWebhookSignature(payload.data, payload.signature, checksumKey);
    if (!isValid) {
      await queueToDLQ(payload, 'Invalid signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
    }

    // 6. Rate limiting check
    if (!checkRateLimit(`webhook:${payload.data.orderCode}`)) {
      return new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429 });
    }

    // 7. Process webhook (order or subscription)
    const supabase = createAdminClient();
    const order = await supabase.from('orders').select('id,status').eq('order_code', payload.data.orderCode).single();

    if (order?.data?.status === 'paid') {
      return new Response(JSON.stringify({ success: true, skipped: true, reason: 'Already processed' }));
    }

    // 8. Atomic update with optimistic concurrency
    const { data: updated } = await supabase
      .from('orders')
      .update({ status: 'paid', payment_data: payload.data })
      .eq('id', order.data.id)
      .eq('status', 'pending')
      .select()
      .single();

    if (!updated) {
      return new Response(JSON.stringify({ success: true, reason: 'Concurrent webhook already processed' }));
    }

    // 9. Fire-and-forget side effects
    await supabase.functions.invoke('send-email', { body: { /* ... */ } }).catch(() => {});
    await supabase.functions.invoke('agent-reward', { body: { /* ... */ } }).catch(() => {});

    return new Response(JSON.stringify({ success: true, status: 'paid' }));

  } catch (error) {
    await queueToDLQ(payload, error instanceof Error ? error.message : String(error));
    return new Response(JSON.stringify({ error: sanitizeErrorMessage(error) }), { status: 500 });
  }
});

// Helpers
function checkRateLimit(key: string): boolean { /* ... */ }
async function queueToDLQ(payload: unknown, error: string) { /* ... */ }
```

### 5.2 Idempotency Guard Pattern
```typescript
// Prevent duplicate processing
async function isAlreadyProcessed(supabase: SupabaseClient, eventId: string): Promise<boolean> {
  const { count } = await supabase
    .from('processed_webhooks')
    .select('id', { count: 'exact' })
    .eq('event_id', eventId)
    .single();
  return (count || 0) > 0;
}

async function markProcessed(supabase: SupabaseClient, eventId: string): Promise<void> {
  await supabase.from('processed_webhooks').insert({ event_id: eventId });
}
```

---

## 6. Audit Logging Strategy

### 6.1 Required Audit Events
| Event | Severity | Fields |
|-------|----------|--------|
| `WEBHOOK_RECEIVED` | info | orderCode, signaturePresent |
| `WEBHOOK_SIGNATURE_FAILED` | failure | provider, reason |
| `WEBHOOK_RATE_LIMITED` | warning | orderCode, attempts |
| `WEBHOOK_SUCCESS` | success | orderId, amount, statusTransition |
| `CALLBACK_RETRY` | warning | callbackName, attempt, maxRetries |
| `CALLBACK_FAILED` | failure | callbackName, errorMessage |
| `DLQ_QUEUED` | info | orderId, error, retryCount |

### 6.2 Audit Schema
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  payload JSONB,
  severity TEXT CHECK (severity IN ('info', 'warning', 'failure', 'success')),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
```

---

## 7. Polar.sh Integration Notes

### 7.1 Current Status
- **Status:** NO POLAR INTEGRATION YET
- **Payment Provider:** PayOS (Vietnamese QR gateway)

### 7.2 Integration Coverage
| Component | Status | Location |
|-----------|--------|----------|
| PayOS Payment | ✅ | `supabase/functions/payos-*` |
| Webhook Handler | ✅ | `supabase/functions/payos-webhook` |
| License Auto-Provision | ✅ | `supabase/functions/_shared/raas-license-provision.ts` |
| DLQ Retry | ✅ | `supabase/functions/dlq-retry-job` |
| Polar SDK | ❌ | Needs implementation |
| Polar Webhook | ❌ | Needs implementation |

### 7.3 Adding Polar Integration
When integrating Polar.sh (if needed):
1. Follow same pattern as PayOS (HMAC-SHA256)
2. Store Polar secret in Supabase secrets
3. Use identical DLQ pattern for retries
4. Map Polar event types to internal `WebhookEventType`

---

## 8. Safety Checklist for Production

### 8.1 Pre-Deployment
- [ ] `RAAS_LICENSE_KEY` set for production
- [ ] `PAYOS_CHECKSUM_KEY` in Supabase secrets
- [ ] `WEBHOOK_SECRET` in Supabase secrets
- [ ] All env vars set: `RAAS_LICENSE_SECRET`, `DLQ_SERVICE_SECRET`, `SUPABASE_CRON_SECRET`
- [ ] Webhook URL registered with PayOS dashboard
- [ ] Firewall allows incoming webhooks (no IP whitelist unless required)

### 8.2 Security Tests
```bash
# Test signature rejection
curl -X POST https://your-domain.supabase.co/functions/v1/payos-webhook \
  -H "X-Webhook-Secret: invalid-secret" \
  -H "Content-Type: application/json" \
  -d '{"data":{"orderCode":123},"signature":"invalid"}'
# Expect: 401 Unauthorized

# Test rate limiting (10 req/minute per orderCode)
for i in {1..12}; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST ... orderCode:999
done
# Expected: 429 on attempt 11+
```

### 8.3 Monitoring
```sql
-- Monitor webhook health
SELECT
  action,
  COUNT(*) as count,
  MAX(created_at) as last_event
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY action
ORDER BY count DESC;

-- Check DLQ backlog
SELECT COUNT(*) as pending FROM dead_letter_queue WHERE status = 'pending';
SELECT failure_count, COUNT(*) FROM dead_letter_queue GROUP BY failure_count;
```

---

## 9. Unresolved Questions

1. **Stripe vs PayOS Decision:** Should we add Stripe support alongside PayOS, or keep PayOS only?
2. **Polar.sh Priority:** Is Polar integration needed? Current PayOS + RaaS license pattern is working.
3. **Timestamp in PayOS Payload:** PayOS payloads don't show explicit timestamp field - verify if PayOS includes this
4. **Multi-tenancy:** Rails `org_id` handling - confirm subscription activation uses correct org context
5. **Webhook URL Testing:** How to test local development with PayOS? Need ngrok/tunnel setup docs?

---

## References

| File | Purpose |
|------|---------|
| `supabase/functions/payos-webhook/index.ts` | Main PayOS webhook handler |
| `supabase/functions/_shared/vibe-payos/crypto.ts` | HMAC-SHA256 + secureCompare |
| `supabase/functions/_shared/vibe-payos/webhook-pipeline.ts` | Reusable webhook pipeline |
| `supabase/functions/_shared/raas-license-provision.ts` | License auto-provisioning |
| `src/lib/vibe-payment/autonomous-webhook-handler.ts` | Provider-agnostic handler |
| `src/lib/vibe-payment/dead-letter-queue-service.ts` | DLQ retry service |
| `src/types/payments.ts` | TypeScript integration types |
| `supabase/migrations/20260305234147_roiaas_phase3_licenses.sql` | License schema |

---

*Report generated: 2026-03-06 22:41*
*Researcher: a3e9f5a112562f4f5*
