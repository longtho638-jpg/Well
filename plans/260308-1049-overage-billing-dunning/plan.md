# Overage Billing & Dunning Implementation Plan

**Date:** 2026-03-08
**Status:** COMPLETE ✅

---

## Overview

Implement Stripe metered billing for usage overages and dunning management for failed payments.

---

## Phases

| Phase | Status | Description |
|-------|--------|-------------|
| 1. Backend | ✅ COMPLETE | Stripe usage metering + dunning edge functions |
| 2. Email Templates | ✅ COMPLETE | Billing notification email templates |
| 3. Dunning Workflow | ✅ COMPLETE | Automatic payment retry logic |
| 4. UI Components | ✅ COMPLETE | Billing status dashboard UI |
| 5. Testing | ⏳ PENDING | Test all workflows end-to-end |

---

## Files Created

### Backend
- `src/lib/stripe-billing-client.ts` - Frontend Stripe client helpers
- `supabase/functions/stripe-dunning/index.ts` - Dunning management edge function

### Email
- `src/services/email-service.ts` - Added billing email methods (sendPaymentFailed, sendPaymentRetry, etc.)
- `src/types/email-service-type-definitions.ts` - Added BillingEmailData types

### UI Components
- `src/components/billing/BillingStatusCard.tsx` - Subscription status card
- `src/components/billing/UsageMeter.tsx` - Real-time usage meter
- `src/components/billing/OverdueNotice.tsx` - Payment overdue notice
- `src/components/billing/index.ts` - Barrel exports

### Translations
- `src/locales/vi/billing.ts` - Vietnamese billing translations
- `src/locales/en/billing.ts` - English billing translations

---

## Files Modified

### Stripe Webhook
- `supabase/functions/stripe-webhook/index.ts`
  - Added `invoice.payment_failed` handler with dunning email
  - Added `invoice.payment_succeeded` handler to clear dunning status
  - Added `sendDunningEmail` helper function

---

## Integration Guide

### 1. Set Environment Variables

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID_API_CALLS=price_xxx
STRIPE_PRICE_ID_TOKENS=price_xxx

# Resend Email
RESEND_API_KEY=re_xxx

# App
APP_URL=https://wellnexus.vn
```

### 2. Deploy Edge Functions

```bash
npx supabase functions deploy stripe-webhook
npx supabase functions deploy stripe-dunning
npx supabase functions deploy stripe-usage-record
```

### 3. Usage in Components

```tsx
import { BillingStatusCard, UsageMeter, OverdueNotice } from '@/components/billing';
import { stripeBillingClient } from '@/lib/stripe-billing-client';
import { emailService } from '@/services/email-service';

// Report usage
await stripeBillingClient.reportUsage({
  subscriptionItemId: 'si_xxx',
  feature: 'api_call',
  quantity: 100,
});

// Get billing status
const status = await stripeBillingClient.getBillingStatus(userId);
```

---

## Success Criteria

1. ✅ Usage records reported to Stripe correctly
2. ✅ Failed payments trigger dunning workflow
3. ✅ Email notifications sent on billing events
4. ✅ Dashboard shows billing status and usage

---

## Unresolved Questions

1. Should dunning auto-cancel after 7 days or require manual intervention?
2. What's the grace period before subscription cancellation?
3. Need admin dashboard for manual license management?
