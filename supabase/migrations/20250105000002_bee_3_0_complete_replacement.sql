-- ============================================================================
-- BEE 3.0: COMPLETE REPLACEMENT
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PART 1: FIX RANK SYSTEM
-- ----------------------------------------------------------------------------
-- Rename rank_level to role_id (match policy naming) if it exists
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'rank_level') THEN
    ALTER TABLE users RENAME COLUMN rank_level TO role_id;
  END IF;
END $$;

-- Add role_id if it doesn't exist (in case rename didn't happen or column didn't exist)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INT DEFAULT 8;

-- Migrate existing text ranks to role_id
UPDATE users SET role_id = CASE
  WHEN rank = 'Founder Club' THEN 1  -- Thiên Long (highest)
  WHEN rank = 'Partner' THEN 6       -- Đại Sứ
  WHEN rank = 'Startup' THEN 7       -- Khởi Nghiệp
  WHEN rank = 'Member' THEN 8        -- CTV
  ELSE 8
END
WHERE role_id IS NULL OR role_id = 8;

-- Add sponsor_id for F1 bonus logic
ALTER TABLE users ADD COLUMN IF NOT EXISTS sponsor_id UUID REFERENCES users(id);

-- Create index for sponsor lookups
CREATE INDEX IF NOT EXISTS idx_users_sponsor_id ON users(sponsor_id);

-- PART 2: FIX WALLET SYSTEM
-- ----------------------------------------------------------------------------
-- Create wallets table if it doesn't exist (it might not in some envs, or might be part of users)
-- Based on previous scans, wallets table might not exist as a separate table in initial schema, 
-- but was referenced in bee_agent_rpc.sql. Let's ensure it exists or columns are on users.
-- Checking initial_schema.sql, wallets columns were on users table. 
-- The master plan proposed a separate wallets table or columns on users. 
-- To minimize friction, let's keep them on users table for now OR create a separate table if that's the new architecture.
-- The master plan said "CREATE TABLE IF NOT EXISTS wallets". Let's stick to the plan to be clean.

CREATE TABLE IF NOT EXISTS wallets (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  pending_cashback BIGINT DEFAULT 0,
  point_balance BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrate grow_balance from users table to wallets table
INSERT INTO wallets (user_id, pending_cashback, point_balance)
SELECT id, grow_balance, 0 FROM users
ON CONFLICT (user_id) DO UPDATE 
SET pending_cashback = EXCLUDED.pending_cashback;

-- PART 3: CREATE/UPDATE RPC FUNCTIONS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_pending_balance(x_user_id UUID, x_amount BIGINT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO wallets (user_id, pending_cashback, updated_at)
  VALUES (x_user_id, x_amount, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET pending_cashback = wallets.pending_cashback + x_amount,
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_point_balance(x_user_id UUID, x_amount BIGINT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO wallets (user_id, point_balance, updated_at)
  VALUES (x_user_id, x_amount, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET point_balance = wallets.point_balance + x_amount,
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- PART 4: CREATE ORDERS TABLE (If not exists)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  total_vnd BIGINT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- PART 5: CREATE PROFILES VIEW (For Edge Function compatibility)
-- ----------------------------------------------------------------------------
-- The Edge Function uses 'profiles'. We map it to 'users'.
CREATE OR REPLACE VIEW profiles AS 
SELECT 
  id, 
  email, 
  name, 
  rank as role, -- Map rank to role for backward compat if needed, or just keep fields
  role_id,
  sponsor_id
FROM users;

-- Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON wallets TO authenticated;
GRANT ALL ON wallets TO service_role;
GRANT ALL ON orders TO authenticated;
GRANT ALL ON orders TO service_role;

-- PART 6: DEPRECATE OLD FUNCTIONS
-- ----------------------------------------------------------------------------
-- Rename for safety if it exists
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'distribute_reward') THEN
    ALTER FUNCTION distribute_reward(UUID, BIGINT, TEXT) RENAME TO distribute_reward_bee2_deprecated;
  END IF;
END $$;
