-- Add rank enum values for commission policy
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('ctv', 'startup', 'ambassador', 'platinum', 'diamond', 'unicorn', 'phoenix', 'dragon');
  ELSE
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ctv';
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'startup';
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ambassador';
  END IF;
END $$;

-- Add rank_level column for numeric comparison (8=CTV, 7=STARTUP, 6=AMBASSADOR...)
ALTER TABLE users ADD COLUMN IF NOT EXISTS rank_level INT DEFAULT 8;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'ctv';

-- Update existing users to have rank_level based on rank
UPDATE users SET 
  rank_level = CASE rank
    WHEN 'Partner' THEN 7  -- Map to STARTUP
    WHEN 'Member' THEN 8   -- Map to CTV
    ELSE 8
  END
WHERE rank_level IS NULL OR rank_level = 8;

-- Create RPC function: increment_wallet_cashback (Atomic increment for safety)
CREATE OR REPLACE FUNCTION increment_wallet_cashback(user_uuid UUID, amount_add BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE wallets
  SET pending_cashback = COALESCE(pending_cashback, 0) + amount_add,
      updated_at = NOW()
  WHERE user_id = user_uuid;
  
  -- Create wallet if not exists
  IF NOT FOUND THEN
    INSERT INTO wallets (user_id, pending_cashback, updated_at)
    VALUES (user_uuid, amount_add, NOW());
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function: increment_wallet_point (Atomic increment for points)
CREATE OR REPLACE FUNCTION increment_wallet_point(user_uuid UUID, amount_add BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE wallets
  SET point_balance = COALESCE(point_balance, 0) + amount_add,
      updated_at = NOW()
  WHERE user_id = user_uuid;
  
  -- Create wallet if not exists
  IF NOT FOUND THEN
    INSERT INTO wallets (user_id, point_balance, updated_at)
    VALUES (user_uuid, amount_add, NOW());
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add metadata column to transactions for tracking
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
-- CREATE INDEX IF NOT EXISTS idx_users_sponsor_id ON users(sponsor_id); -- Column does not exist yet
