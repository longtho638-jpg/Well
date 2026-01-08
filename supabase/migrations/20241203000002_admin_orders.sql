-- Admin Order Management Permissions
-- Allows founders to view and update all orders for approval workflow

-- 1. Add payment_proof_url column if not exists
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

-- 2. Create orders table if using transactions (or update existing orders table)
-- Note: Assuming we're using 'transactions' table with type='sale' as orders
-- If you have separate 'orders' table, adjust accordingly

-- 3. Admin permissions for founders to see ALL orders/transactions
-- 3. Admin permissions for founders to see ALL orders/transactions
DROP POLICY IF EXISTS "Founders can view all transactions" ON transactions;
CREATE POLICY "Founders can view all transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.rank = 'Partner' -- Adjust to your founder identifier
    )
  );

-- 4. Admin permissions for founders to UPDATE all orders/transactions
DROP POLICY IF EXISTS "Founders can update all transactions" ON transactions;
CREATE POLICY "Founders can update all transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.rank = 'Partner' -- Adjust to your founder identifier
    )
  );

-- 5. Create index for performance
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- 6. If using separate orders table, apply similar policies:
-- Uncomment and adjust if needed:
/*
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

CREATE POLICY "Founders can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'founder'
    )
  );

CREATE POLICY "Founders can update all orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'founder'
    )
  );

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
*/
