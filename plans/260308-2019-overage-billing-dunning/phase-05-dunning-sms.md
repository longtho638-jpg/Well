# Phase 5: Dunning SMS Notifications

**Status:** COMPLETED
**Priority:** P1
**Effort:** 2h
**Date:** 2026-03-08

---

## Overview

Added SMS to dunning flow using send-sms Edge Function alongside email notifications.

---

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/stripe-dunning/index.ts` | Modified | Added SMS calls |
| `src/locales/vi/billing.ts` | Modified | SMS translations |
| `supabase/functions/send-sms/index.ts` | Already exists | Twilio integration |

---

## Implementation Details

### SMS Flow

```typescript
await supabase.functions.invoke('send-sms', {
  body: {
    to: user.phone_number,
    template: 'dunning_initial',
    templateData: {
      amount: `$${amount.toFixed(2)}`,
      plan_name: planName,
      payment_url: invoice.hosted_invoice_url
    },
    locale: 'vi',
    org_id: orgId,
    user_id: userId,
    dunning_event_id: dunningId
  }
});
```

### SMS Schedule (Same as Email)

| Stage | Template | Message |
|-------|----------|---------|
| Initial | dunning_initial | ⚠️ WellNexus: Thanh toan that bai... |
| Reminder | dunning_reminder | 🔔 WellNexus: Nhac nho... |
| Final | dunning_final | 🚨 WellNexus: Canh bao cuoi!... |
| Cancel | dunning_cancel | ❌ WellNexus: Subscription da bi huy... |

### Rate Limiting

- Max 10 SMS/hour per user
- Max 50 SMS/day per user
- Enforced by `sms_rate_limits` table

---

## Success Criteria

- [x] SMS sent alongside each email stage
- [x] Rate limiting prevents abuse
- [x] SMS delivery logged in sms_logs
- [x] Failed SMS retries with backoff

---

## Test Results

```
Build: ✅ PASS (0 TypeScript errors)
SMS Flow: ✅ VERIFIED (Twilio sandbox)
Rate Limits: ✅ OPERATIONAL
```

---

## Known Issues

None - SMS dunning fully operational.

---

## Next Steps

Monitor SMS delivery rates and adjust international routing if needed.
