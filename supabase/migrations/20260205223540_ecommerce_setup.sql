-- ============================================================================
-- WellNexus Supabase Database Setup - E-Commerce & Referral System
-- Run this in Supabase SQL Editor after basic schema is created
-- ============================================================================

-- ============================================================================
-- 1. REFERRAL TREE FUNCTION (F1-F7 Multi-Level Network)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_downline_tree(root_user_id UUID)
RETURNS TABLE (
  id UUID,
  sponsor_id UUID,
  email TEXT,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  level INTEGER,
  rank TEXT,
  avatar_url TEXT,
  total_sales BIGINT,
  kyc_status BOOLEAN
) AS $$
WITH RECURSIVE downline AS (
  -- Base case: Direct referrals (F1)
  SELECT
    u.id,
    u.sponsor_id,
    u.email,
    u.name,
    u.created_at,
    1 AS level,
    CASE
      WHEN u.role_id = 1 THEN 'Chủ tịch'
      WHEN u.role_id = 2 THEN 'Đại sứ Diamond'
      WHEN u.role_id = 3 THEN 'Đại sứ Platinum'
      WHEN u.role_id = 4 THEN 'Đại sứ Gold'
      WHEN u.role_id = 5 THEN 'Giám đốc'
      WHEN u.role_id = 6 THEN 'Quản lý'
      WHEN u.role_id = 7 THEN 'Nhân viên'
      WHEN u.role_id = 8 THEN 'CTV'
      ELSE 'Member'
    END AS rank,
    u.avatar_url,
    COALESCE(u.total_sales, 0) AS total_sales,
    COALESCE(u.kyc_status, false) AS kyc_status
  FROM users u
  WHERE u.sponsor_id = root_user_id

  UNION ALL

  -- Recursive case: Get children of children (F2-F7)
  SELECT
    u.id,
    u.sponsor_id,
    u.email,
    u.name,
    u.created_at,
    d.level + 1,
    CASE
      WHEN u.role_id = 1 THEN 'Chủ tịch'
      WHEN u.role_id = 2 THEN 'Đại sứ Diamond'
      WHEN u.role_id = 3 THEN 'Đại sứ Platinum'
      WHEN u.role_id = 4 THEN 'Đại sứ Gold'
      WHEN u.role_id = 5 THEN 'Giám đốc'
      WHEN u.role_id = 6 THEN 'Quản lý'
      WHEN u.role_id = 7 THEN 'Nhân viên'
      WHEN u.role_id = 8 THEN 'CTV'
      ELSE 'Member'
    END AS rank,
    u.avatar_url,
    COALESCE(u.total_sales, 0) AS total_sales,
    COALESCE(u.kyc_status, false) AS kyc_status
  FROM users u
  INNER JOIN downline d ON u.sponsor_id = d.id
  WHERE d.level < 7  -- Limit to 7 levels (F1-F7)
)
SELECT * FROM downline ORDER BY level, created_at;
$$ LANGUAGE SQL STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_downline_tree(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_downline_tree(UUID) TO anon;

-- ============================================================================
-- 2. COMMISSION DISTRIBUTION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION distribute_commissions(
  buyer_user_id UUID,
  order_amount BIGINT
) RETURNS VOID AS $$
DECLARE
  sponsor_record RECORD;
  commission_amount BIGINT;
  current_user_id UUID;
  current_level INTEGER := 1;
  commission_rate DECIMAL;
BEGIN
  -- Start with the buyer's sponsor
  SELECT sponsor_id INTO current_user_id
  FROM users
  WHERE id = buyer_user_id;

  -- Loop through upline (F1 to F7)
  WHILE current_user_id IS NOT NULL AND current_level <= 7 LOOP

    -- Get commission rate based on level
    commission_rate := CASE current_level
      WHEN 1 THEN 0.10  -- F1: 10%
      WHEN 2 THEN 0.05  -- F2: 5%
      WHEN 3 THEN 0.03  -- F3: 3%
      WHEN 4 THEN 0.02  -- F4: 2%
      WHEN 5 THEN 0.01  -- F5: 1%
      WHEN 6 THEN 0.005 -- F6: 0.5%
      WHEN 7 THEN 0.003 -- F7: 0.3%
      ELSE 0
    END;

    -- Calculate commission
    commission_amount := FLOOR(order_amount * commission_rate);

    -- Create commission transaction
    INSERT INTO transactions (
      user_id,
      amount,
      type,
      status,
      currency,
      created_at,
      metadata
    ) VALUES (
      current_user_id,
      commission_amount,
      'commission',
      'completed',
      'VND',
      NOW(),
      jsonb_build_object(
        'source_order_user_id', buyer_user_id,
        'order_amount', order_amount,
        'commission_level', 'F' || current_level,
        'commission_rate', commission_rate
      )
    );

    -- Update user's pending_cashback (grows their balance)
    UPDATE users
    SET
      pending_cashback = COALESCE(pending_cashback, 0) + commission_amount,
      accumulated_bonus_revenue = COALESCE(accumulated_bonus_revenue, 0) + commission_amount
    WHERE id = current_user_id;

    -- Move to next level sponsor
    SELECT sponsor_id INTO current_user_id
    FROM users
    WHERE id = current_user_id;

    current_level := current_level + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. ORDER COMPLETION TRIGGER (Auto-trigger commission distribution)
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_commission_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- When order status changes from pending to completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN

    -- Only trigger for 'sale' type transactions with a user
    IF NEW.type = 'sale' AND NEW.user_id IS NOT NULL THEN
      -- Call commission distribution
      PERFORM distribute_commissions(NEW.user_id, NEW.amount);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (idempotent)
DROP TRIGGER IF EXISTS order_completion_trigger ON transactions;

-- Create trigger
CREATE TRIGGER order_completion_trigger
AFTER UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION trigger_commission_on_order();

-- ============================================================================
-- 4. WITHDRAWAL REQUEST TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),

  -- Bank information
  bank_name TEXT NOT NULL,
  bank_account_number TEXT NOT NULL,
  bank_account_name TEXT NOT NULL,

  -- Metadata
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own withdrawal requests
CREATE POLICY "Users can view own withdrawals"
  ON withdrawal_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create withdrawal requests
CREATE POLICY "Users can create withdrawals"
  ON withdrawal_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Only admins can update withdrawal requests
CREATE POLICY "Admins can update withdrawals"
  ON withdrawal_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id IN (1, 2, 5) -- Chairman, Ambassador, Manager
    )
  );

-- ============================================================================
-- 5. CREATE WITHDRAWAL REQUEST FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION create_withdrawal_request(
  p_amount BIGINT,
  p_bank_name TEXT,
  p_bank_account_number TEXT,
  p_bank_account_name TEXT
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_available_balance BIGINT;
  v_request_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Get user's available balance (pending_cashback)
  SELECT COALESCE(pending_cashback, 0) INTO v_available_balance
  FROM users
  WHERE id = v_user_id;

  -- Check if user has enough balance
  IF v_available_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance. Available: %, Requested: %', v_available_balance, p_amount;
  END IF;

  -- Check minimum withdrawal amount (2M VND)
  IF p_amount < 2000000 THEN
    RAISE EXCEPTION 'Minimum withdrawal amount is 2,000,000 VND';
  END IF;

  -- Create withdrawal request
  INSERT INTO withdrawal_requests (
    user_id,
    amount,
    bank_name,
    bank_account_number,
    bank_account_name,
    status
  ) VALUES (
    v_user_id,
    p_amount,
    p_bank_name,
    p_bank_account_number,
    p_bank_account_name,
    'pending'
  ) RETURNING id INTO v_request_id;

  -- Deduct from pending_cashback (lock the amount)
  UPDATE users
  SET pending_cashback = pending_cashback - p_amount
  WHERE id = v_user_id;

  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_withdrawal_request(BIGINT, TEXT, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- 6. APPROVE/REJECT WITHDRAWAL FUNCTION (Admin only)
-- ============================================================================

CREATE OR REPLACE FUNCTION process_withdrawal_request(
  p_request_id UUID,
  p_action TEXT, -- 'approve' or 'reject'
  p_notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_admin_id UUID;
  v_request RECORD;
BEGIN
  -- Get current user
  v_admin_id := auth.uid();

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = v_admin_id
    AND role_id IN (1, 2, 5) -- Chairman, Ambassador, Manager
  ) THEN
    RAISE EXCEPTION 'Only admins can process withdrawal requests';
  END IF;

  -- Get withdrawal request
  SELECT * INTO v_request
  FROM withdrawal_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal request not found';
  END IF;

  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Withdrawal request is not pending (current status: %)', v_request.status;
  END IF;

  IF p_action = 'approve' THEN
    -- Approve withdrawal
    UPDATE withdrawal_requests
    SET
      status = 'approved',
      processed_at = NOW(),
      processed_by = v_admin_id,
      notes = p_notes
    WHERE id = p_request_id;

    -- Note: Actual bank transfer happens externally
    -- After bank transfer is confirmed, call complete_withdrawal()

  ELSIF p_action = 'reject' THEN
    -- Reject withdrawal and refund to user
    UPDATE withdrawal_requests
    SET
      status = 'rejected',
      processed_at = NOW(),
      processed_by = v_admin_id,
      rejection_reason = p_notes
    WHERE id = p_request_id;

    -- Refund amount to user's pending_cashback
    UPDATE users
    SET pending_cashback = COALESCE(pending_cashback, 0) + v_request.amount
    WHERE id = v_request.user_id;

  ELSE
    RAISE EXCEPTION 'Invalid action. Use "approve" or "reject"';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to admins only
GRANT EXECUTE ON FUNCTION process_withdrawal_request(UUID, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for faster referral tree queries
CREATE INDEX IF NOT EXISTS idx_users_sponsor_id ON users(sponsor_id);

-- Index for withdrawal requests
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);

-- Index for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- ============================================================================
-- 8. SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Uncomment to insert sample data for testing
/*
-- Insert test user if not exists
INSERT INTO users (id, email, name, role_id, sponsor_id)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'test@wellnexus.vn',
  'Test User',
  8,
  NULL
) ON CONFLICT (id) DO NOTHING;

-- Insert test transaction
INSERT INTO transactions (user_id, amount, type, status, currency)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  10000000, -- 10M VND
  'sale',
  'pending',
  'VND'
);

-- Test commission distribution (run after inserting transaction)
-- SELECT distribute_commissions('00000000-0000-0000-0000-000000000001'::uuid, 10000000);
*/

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================

-- Verify setup
SELECT 'Setup complete! Run these queries to verify:' AS message;
SELECT '1. SELECT * FROM get_downline_tree(''your-user-id'');' AS query1;
SELECT '2. SELECT * FROM withdrawal_requests;' AS query2;
SELECT '3. SELECT * FROM transactions WHERE type = ''commission'';' AS query3;
