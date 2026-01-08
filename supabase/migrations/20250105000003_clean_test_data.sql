-- ============================================================================
-- CLEAN TEST DATA FOR BEE 3.0 LAUNCH
-- ============================================================================

-- 1. Truncate transactional tables
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE agent_logs CASCADE;

-- 2. Reset User Balances (Fresh Start for Bee 3.0)
UPDATE users 
SET 
  accumulated_bonus_revenue = 0,
  shop_balance = 0,
  team_volume = 0,
  total_sales = 0;

-- 3. Reset Wallets
UPDATE wallets
SET
  pending_cashback = 0,
  point_balance = 0;

-- 4. Ensure Admin/Founder Rank (Optional - keep existing ranks or reset?)
-- Let's keep existing ranks to avoid demoting the owner.
