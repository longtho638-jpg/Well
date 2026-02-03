# Step 3: PayOS Integration

**Status:** 🔴 READY TO IMPLEMENT
**ETA:** 2 hours
**Priority:** P0

## Context

WellNexus cần integrate PayOS - Vietnamese QR payment gateway để cho phép customers thanh toán online.

## Requirements

### 1. Install PayOS SDK

```bash
npm install @payos/node --save
```

### 2. Create Payment Service

**File:** `src/services/payment/payos-client.ts`

Features:

- Create payment request
- Check payment status
- Handle webhook
- Cancel payment

### 3. Create QR Payment Modal

**File:** `src/components/checkout/qr-payment-modal.tsx`

UI Requirements:

- Display QR code
- Show amount and order info
- Auto-refresh status
- Success/Failure states
- Timer countdown

### 4. i18n Keys

Add translations for:

- `checkout.payment.qr_scan`
- `checkout.payment.amount`
- `checkout.payment.expires_in`
- `checkout.payment.success`
- `checkout.payment.failed`

### 5. Integration Points

- Checkout page integration
- Order service update
- Transaction logging

## Files to Create/Modify

1. `src/services/payment/payos-client.ts` (NEW)
2. `src/components/checkout/qr-payment-modal.tsx` (NEW)
3. `src/pages/Checkout/PaymentConfirmation.tsx` (NEW or MODIFY)
4. `src/locales/vi.ts` (ADD keys)
5. `src/locales/en.ts` (ADD keys)

## Environment Variables

Add to `.env.local`:

```
VITE_PAYOS_CLIENT_ID=your_client_id
VITE_PAYOS_API_KEY=your_api_key
VITE_PAYOS_CHECKSUM_KEY=your_checksum_key
```

## Success Criteria

- [x] PayOS SDK installed (Replaced with custom client for browser compatibility)
- [x] Payment client service created
- [x] QR modal component built
- [x] i18n keys synced
- [x] TypeScript: 0 errors
- [x] Build: passing
- [x] Basic test coverage

## Testing Steps

1. Create test order
2. Generate QR code
3. Scan with banking app (sandbox mode)
4. Verify payment callback
5. Confirm order status update
