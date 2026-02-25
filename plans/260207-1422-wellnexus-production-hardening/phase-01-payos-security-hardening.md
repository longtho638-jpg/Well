---
phase: 1
title: "PayOS Security Hardening + RLS Implementation"
priority: P1
status: pending
effort: 4h
dependencies: []
---

# Phase 1: PayOS Security Hardening + RLS Implementation

## Context Links

- **Code Standards**: `./docs/code-standards.md` (Security section)
- **System Architecture**: `./docs/system-architecture.md` (Security layer)
- **Current PayOS Client**: `./src/services/payment/payos-client.ts`
- **Supabase Functions**: `./supabase/functions/`

---

## Overview

**Priority:** P1 - Critical Security Issue
**Status:** ⏳ Pending
**Effort:** 4 hours

**Description:** Eliminate client-side payment secrets by migrating PayOS logic to Supabase Edge Functions and implementing comprehensive Row-Level Security (RLS) policies.

**Problem:**
- PayOS API keys currently exposed in client-side code (CRITICAL vulnerability)
- No RLS policies on sensitive tables (`users`, `orders`, `transactions`, `withdrawal_requests`)
- Payment creation and verification logic accessible to client manipulation

**Solution:**
- Move all PayOS operations to server-side Edge Functions
- Implement strict RLS policies based on user authentication
- Use Supabase Vault for secret management

---

## Key Insights

1. **Current Vulnerability**: `VITE_PAYOS_*` env vars expose secrets to browser
2. **Edge Function Benefits**: Server-side execution, Supabase Vault integration, automatic auth context
3. **RLS Strategy**: User can only access their own data, admin role for management access
4. **Zero Client-Side Secrets**: All payment operations proxied through authenticated Edge Functions

---

## Requirements

### Functional Requirements
- Create payment link via Edge Function (authenticated users only)
- Verify payment webhook signatures server-side
- Query payment status through secure proxy
- RLS prevents users from accessing others' financial data

### Non-Functional Requirements
- Edge Function response time < 2s for payment creation
- Webhook processing < 500ms (async email/notifications)
- Zero secrets in client bundle (verify with `grep -r "PAYOS" dist/`)
- Backward compatible with existing checkout flow

---

## Architecture

### Current Architecture (INSECURE)
```
┌─────────────────┐
│  Client Browser │
│  ├─ PayOS Key   │ ❌ EXPOSED!
│  ├─ Checksum    │ ❌ MANIPULABLE!
│  └─ API Calls   │ ❌ DIRECT!
└─────────────────┘
```

### New Architecture (SECURE)
```
┌─────────────────┐
│  Client Browser │
│  ├─ Auth Token  │ ✅ JWT only
│  └─ Proxy API   │ ✅ Edge Function
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Supabase Edge Function │
│  ├─ Verify Auth         │
│  ├─ Fetch from Vault    │
│  ├─ PayOS API Call      │
│  └─ Return Result       │
└─────────────────────────┘
         │
         ▼
┌─────────────────┐
│  PayOS API      │
└─────────────────┘
```

### Data Flow
1. **Payment Creation**:
   - Client → Edge Function `payos-create-payment` (with auth token)
   - Edge Function validates user, fetches secrets from Vault
   - Edge Function calls PayOS API, stores order in DB
   - Returns payment URL to client

2. **Webhook Verification**:
   - PayOS → Edge Function `payos-webhook`
   - Edge Function verifies signature using Vault secret
   - Updates order/transaction status in DB
   - Triggers notifications (async)

3. **Payment Status Check**:
   - Client → Edge Function `payos-get-payment`
   - Edge Function proxies to PayOS with Vault credentials
   - Returns sanitized payment info

---

## Related Code Files

### Files to Modify
- `src/services/payment/payos-client.ts` → Convert to Edge Function proxy client
- `src/pages/Checkout.tsx` → Update to use new service methods
- `src/components/checkout/PaymentMethod.tsx` → Update PayOS integration
- `.env.example` → Remove `VITE_PAYOS_*` (move to Supabase Secrets docs)

### Files to Create
- `supabase/functions/payos-create-payment/index.ts` (NEW)
- `supabase/functions/payos-webhook/index.ts` (NEW)
- `supabase/functions/payos-get-payment/index.ts` (NEW)
- `supabase/migrations/YYYYMMDD_rls_policies.sql` (NEW)

### Files to Delete
- None (refactor in place)

---

## Implementation Steps

### Step 1: Setup Supabase Secrets (15 min)
```bash
# Store PayOS secrets in Supabase Vault
supabase secrets set PAYOS_CLIENT_ID="your-client-id"
supabase secrets set PAYOS_API_KEY="your-api-key"
supabase secrets set PAYOS_CHECKSUM_KEY="your-checksum-key"

# Verify secrets stored
supabase secrets list
```

### Step 2: Create Edge Function - Payment Creation (45 min)
**File:** `supabase/functions/payos-create-payment/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface PaymentRequest {
  orderCode: string
  amount: number
  description: string
  returnUrl: string
  cancelUrl: string
  items: Array<{ name: string; quantity: number; price: number }>
}

serve(async (req) => {
  try {
    // 1. Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response('Unauthorized', { status: 401 })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return new Response('Unauthorized', { status: 401 })

    // 2. Parse request body
    const body: PaymentRequest = await req.json()

    // 3. Get PayOS credentials from Vault
    const payosClientId = Deno.env.get('PAYOS_CLIENT_ID')
    const payosApiKey = Deno.env.get('PAYOS_API_KEY')
    const payosChecksumKey = Deno.env.get('PAYOS_CHECKSUM_KEY')

    if (!payosClientId || !payosApiKey || !payosChecksumKey) {
      throw new Error('PayOS credentials not configured')
    }

    // 4. Create checksum (server-side only)
    const checksumData = `amount=${body.amount}&cancelUrl=${body.cancelUrl}&description=${body.description}&orderCode=${body.orderCode}&returnUrl=${body.returnUrl}`
    const encoder = new TextEncoder()
    const data = encoder.encode(checksumData + payosChecksumKey)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // 5. Call PayOS API
    const payosResponse = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
      method: 'POST',
      headers: {
        'x-client-id': payosClientId,
        'x-api-key': payosApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderCode: body.orderCode,
        amount: body.amount,
        description: body.description,
        returnUrl: body.returnUrl,
        cancelUrl: body.cancelUrl,
        signature: checksum,
        items: body.items,
      }),
    })

    if (!payosResponse.ok) {
      const error = await payosResponse.text()
      throw new Error(`PayOS API error: ${error}`)
    }

    const paymentData = await payosResponse.json()

    // 6. Store order in database (with RLS enabled)
    const { error: dbError } = await supabase.from('orders').insert({
      user_id: user.id,
      order_code: body.orderCode,
      amount: body.amount,
      status: 'pending',
      payment_url: paymentData.checkoutUrl,
      created_at: new Date().toISOString(),
    })

    if (dbError) throw dbError

    // 7. Return payment URL
    return new Response(
      JSON.stringify({ checkoutUrl: paymentData.checkoutUrl }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Payment creation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

### Step 3: Create Edge Function - Webhook Handler (30 min)
**File:** `supabase/functions/payos-webhook/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // 1. Parse webhook payload
    const payload = await req.json()
    const signature = req.headers.get('x-payos-signature')

    if (!signature) {
      return new Response('Missing signature', { status: 401 })
    }

    // 2. Verify webhook signature
    const checksumKey = Deno.env.get('PAYOS_CHECKSUM_KEY')
    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify(payload) + checksumKey)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const computedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    if (signature !== computedSignature) {
      return new Response('Invalid signature', { status: 401 })
    }

    // 3. Update order status
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Service role for webhook
    )

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: payload.data.status,
        payment_data: payload.data,
        updated_at: new Date().toISOString(),
      })
      .eq('order_code', payload.data.orderCode)

    if (updateError) throw updateError

    // 4. Trigger notifications (async - don't block webhook response)
    if (payload.data.status === 'PAID') {
      // Call send-email function for order confirmation
      supabase.functions.invoke('send-email', {
        body: {
          type: 'order-confirmation',
          orderCode: payload.data.orderCode,
        },
      }).catch(err => console.error('Email send failed:', err))
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

### Step 4: Create RLS Policies Migration (1h)
**File:** `supabase/migrations/20260207_rls_policies.sql`

```sql
-- Enable RLS on all sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- USERS TABLE POLICIES
-- Users can read their own profile
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (except sensitive fields)
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Prevent users from modifying their own role, balance, etc.
    (NEW.role = OLD.role) AND
    (NEW.shop_balance = OLD.shop_balance) AND
    (NEW.grow_balance = OLD.grow_balance)
  );

-- Admin can read all users
CREATE POLICY "users_select_admin"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can update all users
CREATE POLICY "users_update_admin"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ORDERS TABLE POLICIES
-- Users can read their own orders
CREATE POLICY "orders_select_own"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own orders
CREATE POLICY "orders_insert_own"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin can read all orders
CREATE POLICY "orders_select_admin"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can update all orders
CREATE POLICY "orders_update_admin"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- TRANSACTIONS TABLE POLICIES
-- Users can read transactions they're involved in (sender or receiver)
CREATE POLICY "transactions_select_own"
  ON transactions FOR SELECT
  USING (
    auth.uid() = from_user_id OR
    auth.uid() = to_user_id
  );

-- Users can create transactions (system will validate in Edge Function)
CREATE POLICY "transactions_insert_authenticated"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- Admin can read all transactions
CREATE POLICY "transactions_select_admin"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- WITHDRAWAL_REQUESTS TABLE POLICIES
-- Users can read their own withdrawal requests
CREATE POLICY "withdrawal_requests_select_own"
  ON withdrawal_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own withdrawal requests
CREATE POLICY "withdrawal_requests_insert_own"
  ON withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin can read all withdrawal requests
CREATE POLICY "withdrawal_requests_select_admin"
  ON withdrawal_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can update all withdrawal requests (approve/reject)
CREATE POLICY "withdrawal_requests_update_admin"
  ON withdrawal_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create index for admin role checks (performance optimization)
CREATE INDEX IF NOT EXISTS idx_users_role_admin ON users(id) WHERE role = 'admin';
```

### Step 5: Update Client Service Layer (30 min)
**File:** `src/services/payment/payos-client.ts`

```typescript
import { supabase } from '@/lib/supabase'

interface CreatePaymentParams {
  orderCode: string
  amount: number
  description: string
  returnUrl: string
  cancelUrl: string
  items: Array<{ name: string; quantity: number; price: number }>
}

export class PayOSClient {
  /**
   * Create payment via Edge Function (secure server-side)
   */
  async createPayment(params: CreatePaymentParams): Promise<string> {
    const { data, error } = await supabase.functions.invoke('payos-create-payment', {
      body: params,
    })

    if (error) {
      throw new Error(`Payment creation failed: ${error.message}`)
    }

    return data.checkoutUrl
  }

  /**
   * Get payment status via Edge Function proxy
   */
  async getPaymentStatus(orderCode: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke('payos-get-payment', {
      body: { orderCode },
    })

    if (error) {
      throw new Error(`Payment status check failed: ${error.message}`)
    }

    return data
  }

  /**
   * Cancel payment via Edge Function proxy
   */
  async cancelPayment(orderCode: string): Promise<void> {
    const { error } = await supabase.functions.invoke('payos-cancel-payment', {
      body: { orderCode },
    })

    if (error) {
      throw new Error(`Payment cancellation failed: ${error.message}`)
    }
  }
}

export const payosClient = new PayOSClient()
```

### Step 6: Deploy and Test (1h)
```bash
# 1. Run RLS migration
supabase db push

# 2. Deploy Edge Functions
supabase functions deploy payos-create-payment
supabase functions deploy payos-webhook

# 3. Update webhook URL in PayOS dashboard
# Set to: https://<project-ref>.supabase.co/functions/v1/payos-webhook

# 4. Test payment flow
npm run dev
# Navigate to checkout, create test payment

# 5. Verify secrets not in bundle
npm run build
grep -r "PAYOS" dist/ # Should return ZERO results

# 6. Test RLS policies
# Try accessing another user's order (should fail)
```

---

## Todo List

- [ ] Store PayOS secrets in Supabase Vault
- [ ] Create `payos-create-payment` Edge Function
- [ ] Create `payos-webhook` Edge Function
- [ ] Create `payos-get-payment` Edge Function
- [ ] Create RLS policies migration file
- [ ] Deploy RLS migration to Supabase
- [ ] Update `payos-client.ts` to use Edge Functions
- [ ] Update `Checkout.tsx` to use new client methods
- [ ] Remove `VITE_PAYOS_*` from `.env.example`
- [ ] Deploy Edge Functions to Supabase
- [ ] Update PayOS webhook URL in dashboard
- [ ] Test payment creation flow
- [ ] Test webhook processing
- [ ] Verify no secrets in production bundle
- [ ] Test RLS policies (user isolation)
- [ ] Test admin access to all data
- [ ] Update deployment documentation

---

## Success Criteria

- ✅ Zero `VITE_PAYOS` env vars in codebase
- ✅ `grep -r "PAYOS" dist/` returns 0 results
- ✅ Payment creation works via Edge Function
- ✅ Webhook signature verification passes
- ✅ RLS prevents users from accessing others' data
- ✅ Admin role can access all tables
- ✅ Edge Function response time < 2s
- ✅ All existing tests pass
- ✅ Manual QA: Create payment, receive webhook, verify order updated

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Edge Function timeout | High | Low | Implement 10s timeout, retry logic |
| RLS breaks existing admin features | High | Medium | Comprehensive testing before deploy |
| Webhook signature mismatch | High | Low | Test with PayOS sandbox first |
| Secret rotation complexity | Medium | Low | Document rotation process |
| Performance degradation | Medium | Low | Monitor Edge Function execution time |

---

## Security Considerations

1. **Zero Client-Side Secrets**: All PayOS credentials in Supabase Vault
2. **Webhook Signature Verification**: Prevent replay attacks
3. **RLS Enforcement**: Database-level access control
4. **Admin Role Validation**: Prevent privilege escalation
5. **Audit Trail**: Log all payment operations
6. **Rate Limiting**: Consider adding to Edge Functions (future)

---

## Next Steps

After Phase 1 completion:
1. Proceed to Phase 2 (Admin Dashboard Polish)
2. Update security documentation
3. Train admin users on new RLS restrictions
4. Monitor Edge Function logs for errors

---

**Phase Owner:** Security Team
**Reviewers:** Backend Lead, Security Auditor
**Target Completion:** Day 1
