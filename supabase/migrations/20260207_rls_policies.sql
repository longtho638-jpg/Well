-- Enable RLS on all sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent migration)
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_select_admin" ON users;
DROP POLICY IF EXISTS "users_update_admin" ON users;
DROP POLICY IF EXISTS "orders_select_own" ON orders;
DROP POLICY IF EXISTS "orders_insert_own" ON orders;
DROP POLICY IF EXISTS "orders_select_admin" ON orders;
DROP POLICY IF EXISTS "orders_update_admin" ON orders;
DROP POLICY IF EXISTS "transactions_select_own" ON transactions;
DROP POLICY IF EXISTS "transactions_insert_authenticated" ON transactions;
DROP POLICY IF EXISTS "transactions_select_admin" ON transactions;
DROP POLICY IF EXISTS "withdrawal_requests_select_own" ON withdrawal_requests;
DROP POLICY IF EXISTS "withdrawal_requests_insert_own" ON withdrawal_requests;
DROP POLICY IF EXISTS "withdrawal_requests_select_admin" ON withdrawal_requests;
DROP POLICY IF EXISTS "withdrawal_requests_update_admin" ON withdrawal_requests;

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
