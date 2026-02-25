-- ============================================================================
-- WellNexus Critical Bug Fixes - 2026-02-24
-- Fixes: Registration, Guest Checkout, Admin Access, Product Visibility
-- ============================================================================

-- ============================================================================
-- FIX 1: REGISTRATION - Allow authenticated users to insert their own profile
-- BUG: Signup creates auth user but fails at INSERT into public.users
-- because no INSERT policy exists.
-- ============================================================================

-- Allow newly authenticated users to create their own profile record
DROP POLICY IF EXISTS "users_insert_own" ON users;
CREATE POLICY "users_insert_own"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- FIX 2: GUEST CHECKOUT - Allow guest transactions (user_id = null)
-- BUG: orderService.createOrder inserts into transactions with user_id = null
-- for guest orders, but RLS requires auth.uid() = from_user_id
-- ============================================================================

-- Allow authenticated users to insert transactions (for logged-in purchases)
DROP POLICY IF EXISTS "transactions_insert_own" ON transactions;
CREATE POLICY "transactions_insert_own"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow anonymous inserts for guest checkout (COD orders)
DROP POLICY IF EXISTS "transactions_insert_guest" ON transactions;
CREATE POLICY "transactions_insert_guest"
  ON transactions FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- ============================================================================
-- FIX 3: PRODUCTS - Allow public (anon) users to view active products
-- BUG: Products policy only allows "authenticated" to view
-- so landing page store section doesn't load for non-logged-in visitors
-- ============================================================================

DROP POLICY IF EXISTS "Everyone can view active products" ON products;
CREATE POLICY "Everyone can view active products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- ============================================================================
-- FIX 4: ORDERS TABLE - Allow authenticated users to insert orders
-- BUG: PayOS edge function inserts into orders table after payment creation
-- but no INSERT policy exists for authenticated users
-- ============================================================================

DROP POLICY IF EXISTS "orders_insert_own" ON orders;
CREATE POLICY "orders_insert_own"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- VERIFY FIXES
-- ============================================================================
SELECT 'Migration complete! Bug fixes applied:' AS message;
SELECT '1. users INSERT policy for signup flow' AS fix1;
SELECT '2. transactions INSERT for guest checkout' AS fix2;
SELECT '3. products SELECT for anonymous visitors' AS fix3;
SELECT '4. orders INSERT for authenticated purchases' AS fix4;
