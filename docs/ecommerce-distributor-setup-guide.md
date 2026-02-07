# Complete E-Commerce & Distributor Setup Guide

**Project:** WellNexus
**Date:** 2026-02-05
**Prerequisites:** Supabase project created (from `supabase-setup-guide.md`)

---

## 🎯 OVERVIEW

This guide completes the setup for:
1. ✅ Multi-level referral network (F1-F7)
2. ✅ Automated commission distribution
3. ✅ Withdrawal request system
4. ✅ Stock validation in cart

---

## 📋 STEP-BY-STEP SETUP

### Step 1: Run SQL Setup (CRITICAL)

**File:** `docs/supabase-ecommerce-setup.sql`

**Action:**
1. Open Supabase Dashboard → SQL Editor
2. Click **New query**
3. Copy entire contents of `supabase-ecommerce-setup.sql`
4. Paste into SQL Editor
5. Click **Run** (or press `Ctrl+Enter`)
6. Wait for "Success" message

**What This Creates:**
- ✅ `get_downline_tree()` function - Fetches F1-F7 referral network
- ✅ `distribute_commissions()` function - Auto-calculates commissions
- ✅ `trigger_commission_on_order()` trigger - Fires when order completed
- ✅ `withdrawal_requests` table - Stores withdrawal requests
- ✅ `create_withdrawal_request()` function - Users can request withdrawals
- ✅ `process_withdrawal_request()` function - Admins approve/reject
- ✅ Performance indexes

**Verification:**
```sql
-- Test referral tree function (replace with your user ID)
SELECT * FROM get_downline_tree('your-user-id-here');

-- Check withdrawal table exists
SELECT * FROM withdrawal_requests LIMIT 1;

-- Check if trigger exists
SELECT tgname FROM pg_trigger WHERE tgname = 'order_completion_trigger';
```

---

### Step 2: Configure PayOS Credentials (Optional)

**Only needed if you want QR code payments**

**Get Credentials:**
1. Sign up at [payos.vn](https://payos.vn)
2. Complete business verification
3. Go to Dashboard → API Keys
4. Copy:
   - Client ID
   - API Key
   - Checksum Key

**Add to `.env.local`:**
```bash
# PayOS Payment Gateway
VITE_PAYOS_CLIENT_ID=your-client-id-here
VITE_PAYOS_API_KEY=your-api-key-here
VITE_PAYOS_CHECKSUM_KEY=your-checksum-key-here
```

**Restart Dev Server:**
```bash
npm run dev
```

**Test:**
- Go to `/checkout`
- Select "PayOS QR Code" payment method
- Should generate QR code (if credentials correct)

---

### Step 3: Test Commission Flow

**Create Test Data:**

1. **Create Test Users:**
   ```sql
   -- In Supabase SQL Editor
   -- User A (sponsor)
   INSERT INTO users (id, email, name, role_id)
   VALUES (
     gen_random_uuid(),
     'sponsor@test.com',
     'Sponsor User',
     8 -- CTV rank
   );

   -- User B (referral of A)
   INSERT INTO users (id, email, name, role_id, sponsor_id)
   VALUES (
     gen_random_uuid(),
     'referral@test.com',
     'Referral User',
     8,
     (SELECT id FROM users WHERE email = 'sponsor@test.com')
   );
   ```

2. **Create Test Order:**
   ```sql
   -- Create pending order for User B
   INSERT INTO transactions (user_id, amount, type, status, currency)
   VALUES (
     (SELECT id FROM users WHERE email = 'referral@test.com'),
     10000000, -- 10M VND
     'sale',
     'pending',
     'VND'
   );
   ```

3. **Approve Order (Trigger Commission):**
   ```sql
   -- Update order to completed → triggers commission
   UPDATE transactions
   SET status = 'completed'
   WHERE type = 'sale'
   AND user_id = (SELECT id FROM users WHERE email = 'referral@test.com')
   AND status = 'pending';
   ```

4. **Verify Commission Created:**
   ```sql
   -- Check commission transactions for Sponsor
   SELECT
     t.id,
     t.amount,
     t.type,
     t.status,
     t.metadata->>'commission_level' AS level,
     t.metadata->>'commission_rate' AS rate,
     u.email
   FROM transactions t
   JOIN users u ON t.user_id = u.id
   WHERE t.type = 'commission'
   ORDER BY t.created_at DESC;

   -- Check Sponsor's updated balance
   SELECT
     email,
     pending_cashback,
     accumulated_bonus_revenue
   FROM users
   WHERE email = 'sponsor@test.com';
   ```

**Expected Result:**
- ✅ Commission transaction created (10M × 10% = 1M VND)
- ✅ Sponsor's `pending_cashback` increased by 1M
- ✅ Sponsor's `accumulated_bonus_revenue` increased by 1M

---

### Step 4: Test Withdrawal Flow

**From User Interface:**

1. Login as user with commission balance
2. Go to Commission Wallet page
3. Click "Withdraw Funds"
4. Fill withdrawal form:
   - Amount (min: 2,000,000 VND)
   - Bank name
   - Account number
   - Account name
5. Submit request

**Verify in Database:**
```sql
SELECT * FROM withdrawal_requests
ORDER BY created_at DESC
LIMIT 5;
```

**Admin Approval (via SQL for now):**
```sql
-- Approve withdrawal
SELECT process_withdrawal_request(
  'withdrawal-request-id-here'::uuid,
  'approve',
  'Approved by admin'
);

-- Or reject
SELECT process_withdrawal_request(
  'withdrawal-request-id-here'::uuid,
  'reject',
  'Invalid bank details'
);
```

---

### Step 5: Test E-Commerce Flow End-to-End

**User Journey:**

1. **Browse Products:**
   - Go to `/marketplace`
   - ✅ Products display

2. **Add to Cart:**
   - Click "Add to Cart" on product
   - ✅ Cart count increases
   - ✅ Stock validation works (if product has stock)

3. **Checkout (COD):**
   - Go to `/checkout`
   - Fill guest form (name, email, phone, address)
   - Select "Cash on Delivery"
   - Submit
   - ✅ Order created in `transactions` table
   - ✅ Redirects to `/checkout/success`

4. **Admin Approves Order:**
   ```sql
   -- Find the order
   SELECT id, amount, status
   FROM transactions
   WHERE type = 'sale'
   AND status = 'pending'
   ORDER BY created_at DESC
   LIMIT 1;

   -- Approve it
   UPDATE transactions
   SET status = 'completed'
   WHERE id = 'order-id-here';
   ```

5. **Commission Distributed:**
   - ✅ If buyer has sponsor, sponsor gets commission
   - ✅ Check `transactions` table for commission entries

---

## 🧪 COMPREHENSIVE TEST SCENARIOS

### Scenario 1: New User Signup → Referral

```
1. User A shares referral link: wellnexus.vn/ref/USER_A_ID
2. User B clicks link and signs up
3. User B's sponsor_id = USER_A_ID ✅
4. User A can see User B in referral network ✅
```

**Verify:**
```sql
SELECT * FROM get_downline_tree('USER_A_ID');
-- Should return User B with level = 1
```

---

### Scenario 2: Multi-Level Commission (F1-F7)

```
Setup:
- A sponsors B
- B sponsors C
- C sponsors D
- D sponsors E

Test:
1. E makes purchase of 10M VND
2. Commission distributed:
   - D gets 10% = 1M (F1)
   - C gets 5% = 500K (F2)
   - B gets 3% = 300K (F3)
   - A gets 2% = 200K (F4)
```

**Verify:**
```sql
-- Create the network
INSERT INTO users (email, name, sponsor_id) VALUES
('a@test.com', 'User A', NULL),
('b@test.com', 'User B', (SELECT id FROM users WHERE email = 'a@test.com')),
('c@test.com', 'User C', (SELECT id FROM users WHERE email = 'b@test.com')),
('d@test.com', 'User D', (SELECT id FROM users WHERE email = 'c@test.com')),
('e@test.com', 'User E', (SELECT id FROM users WHERE email = 'd@test.com'));

-- User E buys 10M VND
INSERT INTO transactions (user_id, amount, type, status)
VALUES (
  (SELECT id FROM users WHERE email = 'e@test.com'),
  10000000,
  'sale',
  'completed'
);

-- Check commissions
SELECT
  u.email,
  t.amount,
  t.metadata->>'commission_level' AS level
FROM transactions t
JOIN users u ON t.user_id = u.id
WHERE t.type = 'commission'
ORDER BY (t.metadata->>'commission_level');
```

---

### Scenario 3: Withdrawal Request Flow

```
1. User has 5M VND in pending_cashback
2. User requests withdrawal of 3M VND
3. System checks: 3M < 5M ✅
4. System checks: 3M >= 2M (minimum) ✅
5. Withdrawal request created
6. User's pending_cashback reduced to 2M (locked 3M)
7. Admin approves request
8. Bank transfer happens (external)
9. Admin marks as completed
```

**Verify:**
```sql
-- Check user balance before
SELECT email, pending_cashback FROM users WHERE email = 'user@test.com';

-- User creates request (via app UI or function call)
SELECT create_withdrawal_request(
  3000000,
  'Vietcombank',
  '1234567890',
  'NGUYEN VAN A'
);

-- Check balance after (should be reduced by 3M)
SELECT email, pending_cashback FROM users WHERE email = 'user@test.com';
```

---

## 🚨 COMMON ISSUES & FIXES

### Issue: "Function get_downline_tree does not exist"

**Cause:** SQL script not run in Supabase
**Fix:** Run `docs/supabase-ecommerce-setup.sql` in SQL Editor

---

### Issue: "Commission not created after order completion"

**Cause:** Trigger not created or buyer has no sponsor
**Fix:**
```sql
-- Check trigger exists
SELECT tgname FROM pg_trigger WHERE tgname = 'order_completion_trigger';

-- Check buyer has sponsor
SELECT email, sponsor_id FROM users WHERE id = 'buyer-user-id';
```

---

### Issue: "Withdrawal request fails with 'Insufficient balance'"

**Cause:** User's pending_cashback is less than requested amount
**Fix:** Check user balance:
```sql
SELECT email, pending_cashback FROM users WHERE id = 'user-id';
```

---

### Issue: "PayOS payment fails"

**Cause:** Missing credentials in `.env.local`
**Fix:** Add PayOS credentials (Step 2) or use COD payment

---

### Issue: "Stock validation not working"

**Cause:** Products in database don't have `stock` field
**Fix:** Add stock field to products:
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER;
UPDATE products SET stock = 999 WHERE stock IS NULL;
```

---

## 📊 MONITORING & ADMIN TASKS

### Daily Admin Tasks:

1. **Check Pending Withdrawals:**
   ```sql
   SELECT
     w.id,
     u.email,
     w.amount,
     w.bank_name,
     w.bank_account_number,
     w.requested_at
   FROM withdrawal_requests w
   JOIN users u ON w.user_id = u.id
   WHERE w.status = 'pending'
   ORDER BY w.requested_at DESC;
   ```

2. **Approve/Reject Withdrawals:**
   ```sql
   -- Approve
   SELECT process_withdrawal_request(
     'request-id'::uuid,
     'approve',
     'Approved - Bank transfer initiated'
   );

   -- After bank transfer completes
   UPDATE withdrawal_requests
   SET status = 'completed'
   WHERE id = 'request-id';
   ```

3. **Monitor Commission Distribution:**
   ```sql
   SELECT
     DATE(created_at) AS date,
     COUNT(*) AS total_commissions,
     SUM(amount) AS total_amount
   FROM transactions
   WHERE type = 'commission'
   GROUP BY DATE(created_at)
   ORDER BY date DESC
   LIMIT 7;
   ```

---

## ✅ FINAL CHECKLIST

Before going live:

- [ ] SQL functions created (Step 1)
- [ ] PayOS configured (if using QR payments)
- [ ] Commission flow tested
- [ ] Withdrawal flow tested
- [ ] E-commerce flow tested end-to-end
- [ ] Stock validation working
- [ ] Admin can approve withdrawals
- [ ] Email confirmations working (from auth setup)
- [ ] Production Supabase configured (not dev)
- [ ] Vercel environment variables set

---

## 📈 NEXT STEPS

### Phase 1: Current Setup (Complete)
- ✅ Database functions
- ✅ Commission automation
- ✅ Withdrawal system

### Phase 2: Admin Dashboard (Recommended)
- [ ] Create admin withdrawal approval UI
- [ ] Add order management interface
- [ ] Commission reports and analytics

### Phase 3: Automation (Optional)
- [ ] Email notifications for withdrawals
- [ ] SMS alerts for high-value orders
- [ ] Automatic bank transfer integration
- [ ] Fraud detection rules

---

## 🔗 RELATED DOCUMENTATION

- **Auth Setup:** `docs/supabase-setup-guide.md`
- **SQL Functions:** `docs/supabase-ecommerce-setup.sql`
- **Debug Report:** `plans/reports/debugger-260205-2217-ecommerce-flows-audit.md`
- **Withdrawal Service:** `src/services/withdrawal-service.ts`
- **Cart Store:** `src/store/cartStore.ts`

---

_Last Updated: 2026-02-05 22:21_
_Setup Guide Version: 1.0_
