# PayOS Integration Guide

## Overview
PayOS is a Vietnamese payment gateway with **0% transaction fees** for approved partners. This integration replaces manual order approval with automatic payment verification.

## Architecture

### Current Flow (Manual)
```
User creates order → Upload payment proof → Admin manually approves → The Bee triggers
```

### New Flow (PayOS Auto)
```
User creates order → Click PayOS button → Scan QR, pay → PayOS webhook → Auto approved → The Bee triggers
```

## Features

### 1. Zero Fees
- No transaction fees (0%)
- No setup fees
- No monthly fees

### 2. Real-time Processing
- Instant webhook notifications
- Immediate order status updates
- Automatic commission calculations

### 3. Security
- Webhook signature verification
- Secure payment links
- PayOS manages payment security

## Implementation Checklist

Waiting for PayOS API credentials:
- Client ID
- API Key
- Checksum Key
- Webhook URL

## File Structure

```
supabase/functions/
  payos-webhook/
    index.ts          # Webhook handler
    
src/
  lib/
    payos.ts          # PayOS client
  components/
    PaymentButton.tsx # Payment button with QR
  services/
    payment.ts        # Payment link generation
```

## Environment Variables

```env
# PayOS Credentials
VITE_PAYOS_CLIENT_ID=
VITE_PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=          # Server-side only
PAYOS_WEBHOOK_URL=           # Your webhook endpoint
```

## Next Steps

1. Receive API credentials from user
2. Implement webhook handler
3. Create payment button UI
4. Test in sandbox
5. Deploy to production

---

**Status:** ✅ IMPLEMENTED

## Payment Providers

### Stripe Integration
- **Webhook Endpoint:** `/functions/v1/stripe-webhook`
- **Events:** subscription.created/updated/deleted, checkout.session.completed, invoice.payment_succeeded/failed
- **Security:** Stripe SDK signature verification

### Polar.sh Integration
- **Webhook Endpoint:** `/functions/v1/polar-webhook`
- **Events:** subscription.activated/canceled/expired, payment.succeeded/failed
- **Security:** HMAC-SHA256 + 5-min timestamp validation

### PayOS Integration
- **Webhook Endpoint:** `/functions/v1/payos-webhook`
- **Events:** payment status updates (code 00=paid, 01=canceled)
- **Security:** Custom webhook secret header + HMAC checksum

## License Provisioning

All three providers auto-provision RaaS licenses on successful payment:
- License key generated with tier-based format
- Stored in `raas_licenses` table
- Email notification sent with license key
- Audit logging for compliance

See `supabase/functions/_shared/raas-license-provision.ts` for implementation.
