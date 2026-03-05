# 🔐 Security Audit: Webhook Handler

**Date:** 2026-03-06
**Scope:** PayOS Webhook Integration
**Files Audited:**
- `src/lib/vibe-payment/autonomous-webhook-handler.ts`
- `src/lib/vibe-payment/payos-adapter.ts`

---

## ✅ Security Strengths

### 1. Signature Verification (EXCELLENT)

```typescript
// HMAC-SHA256 computation
async function computeHmacSha256(key: string, message: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey('raw', encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  // ...
}
```

**✅ Good:**
- Uses Web Crypto API (secure, hardware-accelerated)
- HMAC-SHA256 is industry standard
- Key never exposed to client

### 2. Timing-Attack Safe Comparison (EXCELLENT)

```typescript
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
```

**✅ Good:**
- Constant-time comparison prevents timing attacks
- No early exit on mismatch

### 3. State Machine Validation (EXCELLENT)

```typescript
const VALID_TRANSITIONS: Record<string, VibePaymentStatusCode[]> = {
  pending: ['PAID', 'CANCELLED'],
  paid: [],       // terminal
  cancelled: [],  // terminal
  failed: ['PENDING'], // retry allowed
};

function isValidTransition(current: string, next: VibePaymentStatusCode): boolean {
  const allowed = VALID_TRANSITIONS[current.toLowerCase()];
  if (!allowed) return false;
  return allowed.includes(next);
}
```

**✅ Good:**
- Prevents invalid status transitions
- Terminal states cannot be changed
- Prevents double-payment fraud

### 4. Idempotency (EXCELLENT)

```typescript
// Idempotency: already in terminal state
if (!isValidTransition(order.status, newStatus)) {
  await deps.logAudit(order.userId, 'WEBHOOK_IGNORED', {...}, 'info');
  return { status: 'ignored', reason: 'Order already paid' };
}

// Atomic update with optimistic concurrency guard
const updated = await deps.updateOrderStatus(order.id, order.status, newStatus, event.raw);
if (!updated) {
  return { status: 'ignored', reason: 'Concurrent webhook already processed' };
}
```

**✅ Good:**
- Idempotent webhook handling
- Optimistic concurrency control
- Prevents duplicate processing

### 5. Audit Logging (GOOD)

```typescript
await deps.logAudit(order.userId, 'WEBHOOK_SUCCESS', {
  orderId: order.id,
  oldStatus: order.status,
  newStatus,
  amount: event.amount,
}, 'success');

await deps.logAudit(null, 'WEBHOOK_SIGNATURE_FAILED', {...}, 'failure');
```

**✅ Good:**
- All events logged
- Security failures tracked
- User attribution

---

## ⚠️ Security Concerns

### 1. Signature Verification Bypass Risk

**Location:** `autonomous-webhook-handler.ts:62`

```typescript
const event = await provider.parseWebhookEvent(rawPayload, signature, config.checksumKey);

if (!event) {
  await deps.logAudit(null, 'WEBHOOK_SIGNATURE_FAILED', { provider: provider.name }, 'failure');
  return { status: 'error', message: 'Invalid signature' };
}
```

**Risk:** ⚠️ **MEDIUM**
- Returns `null` on invalid signature but continues execution
- Attacker could send malformed payloads to trigger errors
- No rate limiting on failed signature attempts

**Fix:**
```typescript
if (!event) {
  await deps.logAudit(null, 'WEBHOOK_SIGNATURE_FAILED', { provider: provider.name }, 'failure');
  
  // Add rate limiting check
  const isRateLimited = await deps.checkRateLimit('webhook', event.orderCode);
  if (isRateLimited) {
    throw new SecurityError('Webhook rate limit exceeded');
  }
  
  return { status: 'error', message: 'Invalid signature' };
}
```

### 2. Missing Input Validation

**Location:** `payos-adapter.ts:156-188`

```typescript
const webhookPayload = payload as { data: PayOSWebhookData; signature: string };
const data = webhookPayload.data;

if (!data || !signature) return null;
```

**Risk:** ⚠️ **MEDIUM**
- No type validation on `payload`
- No sanitization of string fields
- Could lead to injection attacks if data used in SQL

**Fix:**
```typescript
function validateWebhookPayload(payload: unknown): PayOSWebhookData | null {
  if (!payload || typeof payload !== 'object') return null;
  
  const data = payload as Record<string, unknown>;
  
  // Required fields validation
  if (typeof data.orderCode !== 'number') return null;
  if (typeof data.amount !== 'number' || data.amount <= 0) return null;
  if (typeof data.code !== 'string' || !/^\d{2}$/.test(data.code)) return null;
  if (typeof data.reference !== 'string') return null;
  
  // Sanitize strings
  const sanitized = {
    orderCode: data.orderCode,
    amount: data.amount,
    code: data.code.replace(/[^\w]/g, ''),
    // ...
  };
  
  return sanitized as PayOSWebhookData;
}
```

### 3. Error Information Leakage

**Location:** `autonomous-webhook-handler.ts:83`

```typescript
return { status: 'error', message: `Order ${event.orderCode} not found` };
```

**Risk:** ⚠️ **LOW**
- Reveals order code format to attackers
- Could be used for enumeration attacks

**Fix:**
```typescript
return { status: 'error', message: 'Webhook processing failed' };
```

### 4. Non-Blocking Callbacks Could Lose Data

**Location:** `autonomous-webhook-handler.ts:128-138`

```typescript
if (newStatus === 'PAID' && config.onOrderPaid) {
  config.onOrderPaid(event, order.id).catch((err) =>
    deps.logAudit(order.userId, 'CALLBACK_FAILED', {...}, 'failure'),
  );
}
```

**Risk:** ⚠️ **MEDIUM**
- Callback errors only logged, not retried
- Critical business logic (license activation) could be lost
- No dead letter queue for failed callbacks

**Fix:**
```typescript
// Add retry with exponential backoff
if (newStatus === 'PAID' && config.onOrderPaid) {
  await retryWithBackoff(
    () => config.onOrderPaid(event, order.id),
    { maxRetries: 3, backoffMs: 1000 }
  );
}
```

### 5. Missing Webhook Secret Rotation

**Risk:** ⚠️ **LOW**
- No mechanism to rotate `checksumKey`
- If key compromised, all webhooks vulnerable
- No key versioning for gradual rotation

**Fix:**
```typescript
interface VibeWebhookConfig {
  checksumKey: string;
  checksumKeyVersion: string;  // Add version
  allowedKeyVersions: string[]; // Support multiple versions during rotation
}
```

---

## 🛡️ Security Recommendations

### Critical (Fix Now)

1. **Add Rate Limiting** - Prevent webhook flooding attacks
2. **Input Validation** - Validate all webhook payload fields
3. **Retry Failed Callbacks** - Ensure business logic executes

### High Priority (Fix This Sprint)

4. **Secret Rotation** - Support key rotation without downtime
5. **Dead Letter Queue** - Store failed webhooks for manual review
6. **Alerting** - Notify on multiple signature failures

### Medium Priority (Fix This Month)

7. **Payload Encryption** - Encrypt sensitive webhook data at rest
8. **IP Whitelisting** - Only accept webhooks from PayOS IPs
9. **Webhook Replay** - Support manual reprocessing of failed webhooks

---

## ✅ Production Readiness Checklist

| Check | Status | Notes |
|-------|--------|-------|
| Signature Verification | ✅ | HMAC-SHA256, constant-time compare |
| State Machine | ✅ | Valid transitions enforced |
| Idempotency | ✅ | Optimistic concurrency |
| Audit Logging | ✅ | All events tracked |
| Input Validation | ⚠️ | **NEEDS FIX** |
| Rate Limiting | ❌ | **MISSING** |
| Error Handling | ⚠️ | Info leakage risk |
| Callback Reliability | ⚠️ | No retry logic |
| Secret Rotation | ❌ | **MISSING** |
| IP Whitelisting | ❌ | **MISSING** |

**Overall Security Score:** **7/10** (Good, but needs hardening)

---

## 🔧 Quick Fixes to Implement

```bash
# 1. Add rate limiting check
# 2. Validate input payload types
# 3. Add retry logic for callbacks
# 4. Generic error messages
# 5. Add dead letter queue
```

---

*Audit performed by AgencyOS Security Agent*
*EOF
echo "Security audit report created"