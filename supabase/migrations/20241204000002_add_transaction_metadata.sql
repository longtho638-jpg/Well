
-- ============================================================================
-- WOW UPGRADE: TRANSACTION TRACEABILITY & METADATA
-- ============================================================================

-- 1. Add Metadata Column (The "Brain" of the Transaction)
-- Allows storing rich context: Source Order, Agent Name, Campaign ID, etc.
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Update Reward Distribution Logic (The "Link")
-- Now stores the Source Transaction ID inside the Reward Transaction
CREATE OR REPLACE FUNCTION distribute_reward(p_user_id UUID, p_amount BIGINT, p_source_tx TEXT)
RETURNS VOID AS $$
DECLARE
  v_source_data JSONB;
BEGIN
  -- Try to get source transaction details for richer metadata (Optional)
  -- SELECT jsonb_build_object('type', type, 'amount', amount) INTO v_source_data 
  -- FROM transactions WHERE id = p_source_tx;

  -- Update User Balance
  UPDATE users 
  SET grow_balance = grow_balance + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Log Reward Transaction with "WOW" Metadata
  INSERT INTO transactions (id, user_id, amount, type, status, currency, metadata)
  VALUES (
    'TX-REW-' || md5(random()::text || clock_timestamp()::text)::text,
    p_user_id,
    p_amount,
    'Team Volume Bonus',
    'completed',
    'GROW',
    jsonb_build_object(
      'source_tx_id', p_source_tx,
      'trigger_agent', 'The Bee',
      'reward_rate', '5%',
      'timestamp', NOW()
    )
  );
END;
$$ LANGUAGE plpgsql;
