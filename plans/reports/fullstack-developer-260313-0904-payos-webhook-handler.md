# Phase 2: PayOS Webhook Handler - Implementation Report

**Date:** 2026-03-13
**Plan:** PayOS Payment Integration
**Status:** COMPLETED

---

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/api/routes/webhooks/payos-webhook.ts` | ~340 | PayOS webhook handler |
| `supabase/migrations/20260313090712_payos_webhook_events.sql` | ~80 | Database schema |

---

## Tasks Completed

### src/api/routes/webhooks/payos-webhook.ts

- [x] POST endpoint handler for `/api/webhooks/payos`
- [x] HMAC-SHA256 signature verification using `verifyWebhookSignature` (provider: 'payos')
- [x] Idempotency check via `payos_webhook_events` table (order_code + event_code)
- [x] Event routing: code '00' → `handlePaymentSuccess`, code '01' → `handlePaymentCancel`
- [x] Store all events to `payos_webhook_events` table
- [x] Log to `agent_logs` table for audit trail
- [x] Error handling with try-catch (no crashes)
- [x] CORS headers for cross-origin requests
- [x] Response codes: 200 (success/idempotent), 401 (invalid signature), 400/500 (errors)

### Database Migration

- [x] Created `payos_webhook_events` table with:
  - `event_id` (unique), `order_code`, `event_code`
  - `amount`, `currency`, `description`, `reference`
  - `payload` (JSONB for full audit)
  - `processed`, `processed_at`, `received_at`
- [x] Indexes for fast lookups (order_code, event_code, processed, received_at, GIN on payload)
- [x] RLS policies (service_role full access, authenticated read-only)
- [x] Auto-updating `updated_at` trigger

---

## Build Status

```
npm run build
✓ 4163 modules transformed
Build completed successfully - 0 TypeScript errors
```

---

## Key Implementation Details

### Signature Verification

Uses existing `@/lib/webhook-signature-verify` with provider 'payos':

```typescript
const verification = await verifyWebhookSignature(
  body,
  signature,
  checksumKey,
  'payos'  // Raw hex format, no prefix
);
```

### Idempotency Guard

Checks `payos_webhook_events` before processing:

```typescript
const isProcessed = await checkIdempotency(
  supabase,
  event.orderCode,
  event.eventCode
);
if (isProcessed) return successResponse(eventCode, true);
```

### Event Logging

All events logged to two tables:
1. `payos_webhook_events` - Full payload, idempotency key
2. `agent_logs` - Audit trail with action type

---

## Environment Variables Required

Add to `.env`:

```bash
PAYOS_CHECKSUM_KEY=your_payos_checksum_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Testing Notes

To test with PayOS sandbox:

1. Configure PayOS webhook URL: `https://your-domain.com/api/webhooks/payos`
2. Set webhook secret to `PAYOS_CHECKSUM_KEY`
3. Trigger test payment events from PayOS dashboard
4. Monitor logs: `logger.info('PayOS webhook...')`

Sample webhook payload:

```json
{
  "data": {
    "orderCode": 123456,
    "amount": 100000,
    "description": "Payment for order",
    "reference": "TXN-001",
    "transactionDateTime": "2026-03-13T09:00:00Z",
    "currency": "VND",
    "paymentLinkId": "pl_xxx",
    "code": "00",
    "desc": "Giao dịch thành công"
  },
  "signature": "hmac-sha256-hex-signature"
}
```

---

## Unresolved Questions

None - implementation complete.

---

## Next Steps

1. Deploy migration: `supabase db push` or run SQL in Supabase dashboard
2. Configure `PAYOS_CHECKSUM_KEY` in production environment
3. Test with PayOS sandbox webhooks
4. Monitor `agent_logs` and `payos_webhook_events` tables for incoming events
