-- ============================================================================
-- BEE 2.0: ADVANCED BONUS LOGIC & AUTO-RANK UPGRADE
-- ============================================================================

-- 1. Schema Updates
-- ----------------------------------------------------------------------------

-- Add 'bonus_revenue' to Products (Doanh thu tính thưởng)
ALTER TABLE products ADD COLUMN IF NOT EXISTS bonus_revenue BIGINT DEFAULT 0;

-- Add 'accumulated_bonus_revenue' to Users (Tích lũy doanh thu tính thưởng)
ALTER TABLE users ADD COLUMN IF NOT EXISTS accumulated_bonus_revenue BIGINT DEFAULT 0;

-- 2. Update Seed Data
-- ----------------------------------------------------------------------------
-- Set ANIMA 119: Price 1.868M, Bonus Revenue 990k
UPDATE products 
SET bonus_revenue = 990000 
WHERE id = 'PROD-119';

-- Set defaults for other products (approx 50% of price for now)
UPDATE products 
SET bonus_revenue = price * 0.5 
WHERE bonus_revenue = 0;

-- 3. The Bee 2.0: Advanced Reward Distribution
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION distribute_reward(p_user_id UUID, p_amount BIGINT, p_source_tx TEXT)
RETURNS VOID AS $$
DECLARE
  v_product_id TEXT;
  v_bonus_revenue BIGINT;
  v_user_rank TEXT;
  v_commission_rate FLOAT;
  v_reward_amount BIGINT;
  v_current_accumulated BIGINT;
BEGIN
  -- A. Get Transaction Metadata (Product ID)
  SELECT metadata->>'product_id' INTO v_product_id
  FROM transactions 
  WHERE id = p_source_tx;

  -- B. Get Bonus Revenue from Product
  IF v_product_id IS NOT NULL THEN
    SELECT bonus_revenue INTO v_bonus_revenue
    FROM products 
    WHERE id = v_product_id;
  END IF;

  -- Fallback if no product linked (Legacy/Direct Sales without product)
  -- Use 50% of amount as estimated bonus revenue base
  IF v_bonus_revenue IS NULL THEN
    v_bonus_revenue := p_amount * 0.5;
  END IF;

  -- C. Get User Rank & Accumulation
  SELECT rank, accumulated_bonus_revenue INTO v_user_rank, v_current_accumulated
  FROM users 
  WHERE id = p_user_id;

  -- D. Determine Commission Rate
  IF v_user_rank = 'Startup' OR v_user_rank = 'Partner' THEN
    v_commission_rate := 0.25; -- 25% for Startup+
  ELSE
    v_commission_rate := 0.21; -- 21% for Member (Free)
  END IF;

  -- E. Calculate Reward
  v_reward_amount := v_bonus_revenue * v_commission_rate;

  -- F. Update User (Balance + Accumulation)
  UPDATE users 
  SET grow_balance = grow_balance + v_reward_amount,
      accumulated_bonus_revenue = accumulated_bonus_revenue + v_bonus_revenue,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- G. Auto-Rank Upgrade Logic
  -- Check if new accumulation crosses threshold (9.9M)
  IF v_user_rank = 'Member' AND (v_current_accumulated + v_bonus_revenue) >= 9900000 THEN
    UPDATE users 
    SET rank = 'Startup' 
    WHERE id = p_user_id;
    
    -- Log the upgrade (Optional: could insert into agent_logs or notifications)
    -- For now, we just update the rank.
  END IF;

  -- H. Log Reward Transaction
  INSERT INTO transactions (id, user_id, amount, type, status, currency, metadata)
  VALUES (
    'TX-REW-' || md5(random()::text || clock_timestamp()::text)::text,
    p_user_id,
    v_reward_amount,
    'Team Volume Bonus',
    'completed',
    'GROW',
    jsonb_build_object(
      'source_tx_id', p_source_tx,
      'trigger_agent', 'The Bee',
      'calculation_base', v_bonus_revenue,
      'applied_rate', v_commission_rate,
      'user_rank_snapshot', v_user_rank,
      'timestamp', NOW()
    )
  );
END;
$$ LANGUAGE plpgsql;
