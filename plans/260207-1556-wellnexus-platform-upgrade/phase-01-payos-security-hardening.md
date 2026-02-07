# Phase 01: PayOS Security Hardening

## Context

PayOS integration is currently operational but lacks production-grade security measures. This phase implements webhook signature verification, transaction state management, and error handling to ensure payment system reliability.

**Current State:**
- PayOS integration complete with basic webhook handling
- Transaction data stored in Supabase
- No signature verification on webhook payloads
- Limited error handling and retry logic

**Target State:**
- HMAC-SHA256 signature verification for all webhooks
- Transaction state machine with audit trail
- Exponential backoff retry logic
- Isolated error handling (payment failures don't crash app)

## Requirements

### Functional Requirements
- **FR-01:** Verify webhook signatures using PayOS secret key
- **FR-02:** Implement transaction state machine (pending → processing → completed/failed)
- **FR-03:** Retry failed webhook processing with exponential backoff (3 attempts max)
- **FR-04:** Log all payment events to audit trail
- **FR-05:** Handle payment errors gracefully without app crash

### Non-Functional Requirements
- **NFR-01:** Webhook verification latency < 50ms
- **NFR-02:** 100% of payment events logged to audit trail
- **NFR-03:** TypeScript strict mode with 0 errors
- **NFR-04:** Test coverage > 90% for payment utilities

## Architecture

### Component Structure

```
src/
├── services/
│   └── payos/
│       ├── webhook-verifier.ts       # HMAC-SHA256 signature verification
│       ├── transaction-state.ts       # State machine logic
│       ├── retry-handler.ts           # Exponential backoff retry
│       └── payos-client.ts            # Enhanced API client
├── utils/
│   └── security/
│       ├── hmac.ts                    # HMAC utility
│       └── audit-logger.ts            # Audit trail logger
└── types/
    └── payos.ts                       # TypeScript interfaces
```

### State Machine

```
┌─────────┐
│ PENDING │──────┐
└─────────┘      │
     │           │ timeout (30min)
     │ webhook   │
     ▼           ▼
┌────────────┐  ┌────────┐
│ PROCESSING │──>│ FAILED │
└────────────┘  └────────┘
     │
     │ success
     ▼
┌───────────┐
│ COMPLETED │
└───────────┘
```

### Webhook Verification Flow

```
1. Receive webhook POST
2. Extract signature from headers
3. Compute HMAC-SHA256(payload + secret)
4. Compare signatures (constant-time)
5. If valid → process transaction
6. If invalid → reject (403) + log security event
```

## Implementation Steps

### Step 1: Create HMAC Verification Utility

**File:** `src/utils/security/hmac.ts`

```typescript
import crypto from 'crypto';

export function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  );
}

export function generateHmacSignature(
  payload: string,
  secret: string
): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}
```

### Step 2: Create Audit Logger

**File:** `src/utils/security/audit-logger.ts`

```typescript
import { supabase } from '@/lib/supabase';

interface AuditEvent {
  event_type: 'payment.created' | 'payment.completed' | 'payment.failed' | 'webhook.invalid';
  user_id?: string;
  metadata: Record<string, any>;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export async function logAuditEvent(event: AuditEvent): Promise<void> {
  await supabase.from('audit_logs').insert({
    ...event,
    timestamp: new Date().toISOString(),
  });
}
```

### Step 3: Implement Transaction State Machine

**File:** `src/services/payos/transaction-state.ts`

```typescript
export type TransactionState = 'pending' | 'processing' | 'completed' | 'failed';

export const transitionRules: Record<TransactionState, TransactionState[]> = {
  pending: ['processing', 'failed'],
  processing: ['completed', 'failed'],
  completed: [],
  failed: [],
};

export function canTransition(
  from: TransactionState,
  to: TransactionState
): boolean {
  return transitionRules[from].includes(to);
}

export async function transitionTransaction(
  transactionId: string,
  newState: TransactionState,
  metadata?: Record<string, any>
): Promise<void> {
  const { data: current } = await supabase
    .from('transactions')
    .select('status')
    .eq('id', transactionId)
    .single();

  if (!canTransition(current.status, newState)) {
    throw new Error(
      `Invalid state transition: ${current.status} → ${newState}`
    );
  }

  await supabase
    .from('transactions')
    .update({
      status: newState,
      updated_at: new Date().toISOString(),
      metadata: { ...current.metadata, ...metadata },
    })
    .eq('id', transactionId);

  await logAuditEvent({
    event_type: `payment.${newState}`,
    metadata: { transactionId, from: current.status, to: newState },
    severity: newState === 'failed' ? 'error' : 'info',
  });
}
```

### Step 4: Implement Retry Handler

**File:** `src/services/payos/retry-handler.ts`

```typescript
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Failed after ${maxRetries} retries: ${lastError.message}`
  );
}
```

### Step 5: Create Webhook Verifier

**File:** `src/services/payos/webhook-verifier.ts`

```typescript
import { verifyHmacSignature } from '@/utils/security/hmac';
import { logAuditEvent } from '@/utils/security/audit-logger';

export async function verifyPayOSWebhook(
  payload: string,
  signature: string
): Promise<boolean> {
  const secret = import.meta.env.VITE_PAYOS_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error('PayOS webhook secret not configured');
  }

  const isValid = verifyHmacSignature(payload, signature, secret);

  if (!isValid) {
    await logAuditEvent({
      event_type: 'webhook.invalid',
      metadata: { signature, payloadLength: payload.length },
      severity: 'critical',
    });
  }

  return isValid;
}
```

### Step 6: Update PayOS Webhook Handler

**File:** `src/api/webhooks/payos.ts` (enhance existing)

```typescript
import { verifyPayOSWebhook } from '@/services/payos/webhook-verifier';
import { transitionTransaction } from '@/services/payos/transaction-state';
import { retryWithBackoff } from '@/services/payos/retry-handler';

export async function handlePayOSWebhook(request: Request): Promise<Response> {
  const signature = request.headers.get('x-payos-signature');
  const payload = await request.text();

  // Verify signature
  const isValid = await verifyPayOSWebhook(payload, signature || '');
  if (!isValid) {
    return new Response('Invalid signature', { status: 403 });
  }

  const data = JSON.parse(payload);

  // Process with retry logic
  try {
    await retryWithBackoff(async () => {
      await transitionTransaction(
        data.transactionId,
        data.status === 'PAID' ? 'completed' : 'failed',
        { payosData: data }
      );
    });

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return new Response('Processing failed', { status: 500 });
  }
}
```

### Step 7: Add Database Schema for Audit Logs

**File:** `supabase/migrations/20260207_audit_logs.sql`

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  severity TEXT CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);
```

### Step 8: Add Environment Variables

**File:** `.env.example`

```bash
# PayOS Configuration
VITE_PAYOS_CLIENT_ID=your_client_id
VITE_PAYOS_API_KEY=your_api_key
VITE_PAYOS_CHECKSUM_KEY=your_checksum_key
VITE_PAYOS_WEBHOOK_SECRET=your_webhook_secret  # NEW
```

### Step 9: Write Tests

**File:** `src/services/payos/__tests__/webhook-verifier.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { verifyPayOSWebhook } from '../webhook-verifier';

describe('PayOS Webhook Verifier', () => {
  it('should verify valid HMAC signature', async () => {
    const payload = JSON.stringify({ transactionId: 'TX123' });
    const secret = 'test-secret';
    const signature = generateHmacSignature(payload, secret);

    const isValid = await verifyPayOSWebhook(payload, signature);
    expect(isValid).toBe(true);
  });

  it('should reject invalid signature', async () => {
    const payload = JSON.stringify({ transactionId: 'TX123' });
    const invalidSignature = 'invalid-signature';

    const isValid = await verifyPayOSWebhook(payload, invalidSignature);
    expect(isValid).toBe(false);
  });

  it('should log security event on invalid signature', async () => {
    const payload = JSON.stringify({ transactionId: 'TX123' });
    const logSpy = vi.spyOn(auditLogger, 'logAuditEvent');

    await verifyPayOSWebhook(payload, 'invalid');

    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'webhook.invalid',
        severity: 'critical',
      })
    );
  });
});
```

### Step 10: Update Documentation

**File:** `docs/payos-integration.md`

```markdown
# PayOS Integration

## Webhook Security

All PayOS webhooks are verified using HMAC-SHA256 signature verification.

### Configuration
Set `VITE_PAYOS_WEBHOOK_SECRET` in environment variables.

### Verification Flow
1. Extract `x-payos-signature` header
2. Compute HMAC-SHA256 of payload
3. Compare using constant-time comparison
4. Reject if invalid (403 response)

## Transaction States

| State | Description | Transitions To |
|-------|-------------|----------------|
| pending | Initial state | processing, failed |
| processing | Payment being processed | completed, failed |
| completed | Payment successful | (final state) |
| failed | Payment failed | (final state) |

## Audit Trail

All payment events are logged to `audit_logs` table with:
- Event type
- Timestamp
- User ID (if applicable)
- Metadata (transaction details)
- Severity level
```

## Verification & Success Criteria

### Automated Tests

```bash
# Run PayOS security tests
npm test -- src/services/payos/__tests__

# Expected output:
# ✓ webhook-verifier.test.ts (5 tests)
# ✓ transaction-state.test.ts (8 tests)
# ✓ retry-handler.test.ts (6 tests)
```

### Manual Verification

1. **Webhook Signature Test:**
   ```bash
   curl -X POST https://wellnexus.vn/api/webhooks/payos \
     -H "x-payos-signature: invalid-signature" \
     -d '{"transactionId":"TX123","status":"PAID"}'

   # Expected: 403 Forbidden
   ```

2. **Valid Webhook Test:**
   ```bash
   # Generate valid signature using PayOS secret
   node scripts/generate-payos-signature.js

   # Send with valid signature
   # Expected: 200 OK + transaction state updated
   ```

3. **Audit Log Verification:**
   ```sql
   SELECT * FROM audit_logs
   WHERE event_type LIKE 'payment.%'
   ORDER BY timestamp DESC
   LIMIT 10;

   -- Expected: All payment events logged
   ```

4. **State Transition Test:**
   ```typescript
   // Should succeed
   await transitionTransaction('TX123', 'processing'); // pending → processing
   await transitionTransaction('TX123', 'completed'); // processing → completed

   // Should fail
   await transitionTransaction('TX123', 'pending'); // Error: completed → pending invalid
   ```

### Success Criteria Checklist

- [ ] HMAC verification utility implemented with constant-time comparison
- [ ] Transaction state machine enforces valid transitions only
- [ ] Retry handler uses exponential backoff (1s, 2s, 4s)
- [ ] Audit logs capture all payment events (100% coverage)
- [ ] Webhook endpoint rejects invalid signatures with 403
- [ ] All tests pass (19+ tests for PayOS security)
- [ ] TypeScript build: 0 errors
- [ ] Environment variable `VITE_PAYOS_WEBHOOK_SECRET` documented
- [ ] Supabase migration applied (audit_logs table exists)
- [ ] Documentation updated in `docs/payos-integration.md`

### Performance Benchmarks

```bash
# Webhook verification latency test
node scripts/benchmark-webhook-verification.js

# Target: < 50ms per verification
# Typical: 2-5ms (HMAC computation)
```

### Security Validation

```bash
# Test timing attack resistance
npm run test:security -- timing-attack.test.ts

# Verify constant-time comparison prevents signature leakage
```

## Rollback Plan

If issues arise:

1. **Disable webhook verification:**
   ```typescript
   // In webhook-verifier.ts (temporary)
   export async function verifyPayOSWebhook(): Promise<boolean> {
     return true; // BYPASS - EMERGENCY ONLY
   }
   ```

2. **Revert to previous commit:**
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Disable audit logging:**
   ```typescript
   // In audit-logger.ts
   export async function logAuditEvent(): Promise<void> {
     // NO-OP - emergency bypass
   }
   ```

## Next Steps

After Phase 1 completion:
- Proceed to Phase 2 (i18n Sync & Validation)
- Monitor audit logs for 24h
- Verify PayOS test transaction with production secret
- Update Admin Dashboard (Phase 5) to display transaction audit trail

---

**Estimated Effort:** 2 hours
**Dependencies:** Supabase database, PayOS account with webhook secret
**Risk Level:** Medium (payment system changes require careful testing)
