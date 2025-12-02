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

**Status:** ⏳ Waiting for API credentials
