# Phase 2: PayOS Integration Hardening

## Context Links
- [Plan Overview](./plan.md)
- [Phase 1: Security Infrastructure](./phase-01-security-infrastructure.md)
- [PayOS Integration Docs](../../docs/PAYOS_INTEGRATION.md)
- [Production Hardening Report](../260207-1422-wellnexus-production-hardening/phase-01-payos-security-hardening.md)

## Overview

**Priority:** P1 Critical
**Status:** ⏳ Pending (Blocked by Phase 1)
**Effort:** 4 hours
**Dependencies:** Phase 1 (CSP updates required)

Verify and harden PayOS payment integration with proper security, error handling, webhook verification, and monitoring.

## Key Insights

1. **Current Implementation**: PayOS SDK likely used client-side (security risk)
2. **Webhook Security**: Signature verification needed to prevent payment fraud
3. **Environment Variables**: PayOS keys must be server-side only (Supabase Edge Functions)
4. **Error Handling**: Payment failures need graceful degradation and user feedback
5. **Monitoring**: Payment flow tracking essential for fraud detection

## Requirements

### Functional Requirements
- FR1: PayOS API calls must execute server-side via Supabase Edge Functions
- FR2: Webhook signature verification must validate all incoming webhooks
- FR3: Payment errors must be caught, logged, and presented to users gracefully
- FR4: Payment flow must be monitored end-to-end (initiate → complete → webhook)
- FR5: Environment variables must never expose secrets client-side

### Non-Functional Requirements
- NFR1: Payment initiation latency < 500ms
- NFR2: Webhook processing < 200ms
- NFR3: 99.9% uptime for payment edge function
- NFR4: All payment failures logged to Sentry with context
- NFR5: PCI DSS compliance (no card data stored)

## Architecture

### Current Architecture (Insecure)
```
Client → PayOS SDK (client-side) → PayOS API
                ↓
        Exposes PAYOS_CLIENT_ID + PAYOS_API_KEY
```

### Target Architecture (Secure)
```
Client → Supabase Edge Function → PayOS API
         (with secrets in vault)
                ↓
        Webhook → Edge Function → Verify Signature → Update DB
```

## Related Code Files

### Files to Audit/Modify
- `src/services/payos-service.ts` - Current PayOS integration
- `src/components/checkout/*.tsx` - Payment UI components
- `.env.example` - Remove VITE_PAYOS_* variables
- `supabase/functions/payos-create-payment/` - Edge function (create if missing)
- `supabase/functions/payos-webhook/` - Webhook handler (create if missing)

### Files to Create
- `supabase/functions/payos-create-payment/index.ts` - Payment initiation
- `supabase/functions/payos-webhook/index.ts` - Webhook receiver
- `scripts/test-payos-payment-flow.ts` - Integration test script
- `src/services/payos-client.ts` - Client-side wrapper for edge function
- `docs/PAYOS_SECURITY_AUDIT.md` - Security audit report

### Files to Delete
- Any client-side PayOS SDK imports

## Implementation Steps

### Step 1: Audit Current Implementation (30min)

1. **Find all PayOS references**:
   ```bash
   grep -r "payos\|PAYOS" src/ --include="*.ts" --include="*.tsx"
   grep -r "VITE_PAYOS" . --include=".env*"
   ```

2. **Document current flow**:
   ```typescript
   // Create audit report
   // File: docs/PAYOS_SECURITY_AUDIT.md
   - Where is PayOS SDK initialized?
   - Are secrets exposed client-side?
   - Is webhook signature verified?
   - What happens on payment failure?
   ```

3. **Identify migration scope**:
   - List all components using PayOS
   - List all API calls to PayOS
   - Document expected behavior

### Step 2: Create Supabase Edge Functions (1.5h)

1. **Payment Creation Function**:
   ```typescript
   // supabase/functions/payos-create-payment/index.ts
   import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

   serve(async (req) => {
     try {
       const { amount, orderCode, description } = await req.json();

       // Validate input
       if (!amount || !orderCode) {
         return new Response(
           JSON.stringify({ error: 'Missing required fields' }),
           { status: 400 }
         );
       }

       // Get PayOS credentials from Supabase secrets
       const PAYOS_CLIENT_ID = Deno.env.get('PAYOS_CLIENT_ID');
       const PAYOS_API_KEY = Deno.env.get('PAYOS_API_KEY');
       const PAYOS_CHECKSUM_KEY = Deno.env.get('PAYOS_CHECKSUM_KEY');

       // Call PayOS API
       const paymentUrl = await createPayOSPayment({
         clientId: PAYOS_CLIENT_ID,
         apiKey: PAYOS_API_KEY,
         checksumKey: PAYOS_CHECKSUM_KEY,
         amount,
         orderCode,
         description,
       });

       return new Response(
         JSON.stringify({ paymentUrl }),
         { status: 200, headers: { 'Content-Type': 'application/json' } }
       );
     } catch (error) {
       console.error('Payment creation failed:', error);
       return new Response(
         JSON.stringify({ error: 'Payment creation failed' }),
         { status: 500 }
       );
     }
   });
   ```

2. **Webhook Handler Function**:
   ```typescript
   // supabase/functions/payos-webhook/index.ts
   serve(async (req) => {
     try {
       const signature = req.headers.get('x-payos-signature');
       const body = await req.text();

       // Verify signature
       const CHECKSUM_KEY = Deno.env.get('PAYOS_CHECKSUM_KEY');
       const isValid = verifyPayOSSignature(body, signature, CHECKSUM_KEY);

       if (!isValid) {
         console.error('Invalid webhook signature');
         return new Response('Unauthorized', { status: 401 });
       }

       const webhook = JSON.parse(body);

       // Process payment based on status
       if (webhook.code === '00') {
         // Payment successful
         await updateOrderStatus(webhook.orderCode, 'paid');
         await processCommissions(webhook.orderCode);
       } else {
         // Payment failed
         await updateOrderStatus(webhook.orderCode, 'failed');
       }

       return new Response('OK', { status: 200 });
     } catch (error) {
       console.error('Webhook processing failed:', error);
       return new Response('Internal Server Error', { status: 500 });
     }
   });
   ```

3. **Deploy functions**:
   ```bash
   npx supabase functions deploy payos-create-payment
   npx supabase functions deploy payos-webhook

   # Set secrets
   npx supabase secrets set PAYOS_CLIENT_ID=xxx
   npx supabase secrets set PAYOS_API_KEY=xxx
   npx supabase secrets set PAYOS_CHECKSUM_KEY=xxx
   ```

### Step 3: Update Client Code (1h)

1. **Create client wrapper**:
   ```typescript
   // src/services/payos-client.ts
   import { supabase } from './supabase';

   export const createPayment = async (params: {
     amount: number;
     orderCode: string;
     description: string;
   }) => {
     const { data, error } = await supabase.functions.invoke(
       'payos-create-payment',
       { body: params }
     );

     if (error) {
       console.error('Payment creation failed:', error);
       throw new Error('Failed to create payment');
     }

     return data.paymentUrl;
   };
   ```

2. **Update checkout components**:
   ```typescript
   // src/components/checkout/PaymentButton.tsx
   import { createPayment } from '@/services/payos-client';

   const handlePayment = async () => {
     try {
       setLoading(true);
       const paymentUrl = await createPayment({
         amount: totalAmount,
         orderCode: generateOrderCode(),
         description: `Order ${orderCode}`,
       });

       // Redirect to PayOS payment page
       window.location.href = paymentUrl;
     } catch (error) {
       captureError(error as Error, { context: 'payment_creation' });
       setError(t('checkout.payment.error'));
     } finally {
       setLoading(false);
     }
   };
   ```

3. **Remove client-side secrets**:
   ```bash
   # Remove from .env files
   grep -v "VITE_PAYOS" .env.example > .env.example.tmp
   mv .env.example.tmp .env.example

   # Add server-side note
   echo "# PayOS credentials are managed via Supabase Edge Functions (vault)" >> .env.example
   ```

### Step 4: Implement Error Handling & Monitoring (1h)

1. **Add comprehensive error handling**:
   ```typescript
   // src/services/payos-client.ts
   export const createPayment = async (params: PaymentParams) => {
     try {
       const { data, error } = await supabase.functions.invoke(
         'payos-create-payment',
         { body: params }
       );

       if (error) {
         // Log to Sentry with context
         captureError(error, {
           context: 'payos_payment_creation',
           extra: { orderCode: params.orderCode, amount: params.amount },
         });

         throw new PaymentError('Payment creation failed', error);
       }

       // Log successful payment initiation
       console.info('Payment created:', {
         orderCode: params.orderCode,
         amount: params.amount,
       });

       return data.paymentUrl;
     } catch (error) {
       // User-friendly error message
       throw new Error(t('checkout.payment.error'));
     }
   };
   ```

2. **Add payment flow monitoring**:
   ```typescript
   // supabase/functions/payos-webhook/index.ts
   const logPaymentEvent = async (event: {
     orderCode: string;
     status: string;
     amount: number;
     timestamp: string;
   }) => {
     await supabase.from('payment_logs').insert({
       order_code: event.orderCode,
       status: event.status,
       amount: event.amount,
       created_at: event.timestamp,
     });
   };
   ```

3. **Create integration test**:
   ```typescript
   // scripts/test-payos-payment-flow.ts
   import { createPayment } from '../src/services/payos-client';

   async function testPaymentFlow() {
     console.log('Testing PayOS payment flow...');

     try {
       const paymentUrl = await createPayment({
         amount: 10000,
         orderCode: `TEST_${Date.now()}`,
         description: 'Test payment',
       });

       console.log('✅ Payment URL created:', paymentUrl);
       console.log('✅ Test passed');
     } catch (error) {
       console.error('❌ Test failed:', error);
       process.exit(1);
     }
   }

   testPaymentFlow();
   ```

## Todo List

- [ ] Audit current PayOS implementation (grep for all references)
- [ ] Create PAYOS_SECURITY_AUDIT.md report
- [ ] Create supabase/functions/payos-create-payment/index.ts
- [ ] Create supabase/functions/payos-webhook/index.ts
- [ ] Implement PayOS signature verification in webhook
- [ ] Deploy edge functions to Supabase
- [ ] Set PayOS secrets in Supabase vault
- [ ] Create src/services/payos-client.ts wrapper
- [ ] Update checkout components to use edge function
- [ ] Remove VITE_PAYOS_* from .env.example
- [ ] Add error handling with Sentry integration
- [ ] Create payment_logs table for monitoring
- [ ] Write scripts/test-payos-payment-flow.ts
- [ ] Test payment flow end-to-end
- [ ] Verify webhook receives and processes callbacks
- [ ] Verify build passes: `npm run build`
- [ ] Verify tests pass: `npm run test:run`
- [ ] Document PayOS security changes in docs/

## Success Criteria

### Automated Verification
```bash
# All must pass:
npm run build                           # 0 TypeScript errors
npm run test:run                        # 100% pass rate
tsx scripts/test-payos-payment-flow.ts  # Payment flow verified
npm run test:integration -- payos       # Integration tests pass
```

### Manual Verification
- [ ] Create test payment and verify redirect to PayOS
- [ ] Complete test payment and verify webhook received
- [ ] Verify order status updates after payment
- [ ] Verify commissions processed after successful payment
- [ ] Test payment failure scenario
- [ ] Verify Sentry captures payment errors
- [ ] Check payment_logs table for event tracking

### Security Checklist
- [ ] Zero PAYOS_* secrets in client-side code
- [ ] Webhook signature verification implemented
- [ ] All PayOS calls go through edge functions
- [ ] Edge function secrets stored in Supabase vault
- [ ] Error messages don't leak sensitive information
- [ ] Payment logs don't include card data (PCI compliance)

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Edge function deployment fails | High | Low | Test with Supabase CLI locally first |
| Webhook signature mismatch | High | Medium | Test with PayOS test environment |
| Payment flow breaks existing orders | High | Low | Maintain backward compatibility |
| Latency increase from edge function | Medium | Low | Monitor response times, optimize if needed |
| Secret rotation breaks production | Medium | Low | Document secret update process |

## Security Considerations

### Secret Management
- **Principle**: Never expose payment credentials client-side
- **Storage**: Use Supabase Secrets (encrypted at rest)
- **Rotation**: Document process for updating PayOS credentials
- **Access**: Only edge functions can access secrets

### Webhook Security
- **Signature Verification**: REQUIRED for all webhooks
- **Replay Protection**: Check timestamp, reject old webhooks
- **Error Handling**: Don't expose internal errors in webhook responses

### Error Messages
- **User-Facing**: Generic messages ("Payment failed, please try again")
- **Logging**: Detailed errors to Sentry with context
- **Exposure**: Never leak PayOS API responses to client

## Next Steps

After Phase 2 completion:

1. **Proceed to Phase 3**: Admin Dashboard Polish
2. **Monitor Payment Flow**: Set up alerts for payment failures
3. **Documentation**: Update PayOS integration guide with security best practices
4. **Training**: Share edge function patterns with team

---

**Phase Effort:** 4 hours
**Critical Path:** Yes (payment security critical)
**Automation Level:** High (80% automated verification)
