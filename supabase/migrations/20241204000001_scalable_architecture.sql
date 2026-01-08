-- ============================================================================
-- SCALABLE ARCHITECTURE MIGRATION FOR 1M USERS
-- ============================================================================

-- 1. JOB QUEUE SYSTEM (The Outbox Pattern)
-- Thay vì chạy Agent ngay lập tức, ta đẩy việc vào hàng đợi
CREATE TABLE IF NOT EXISTS agent_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name TEXT NOT NULL,       -- 'The Bee', 'Gemini Coach'
  action TEXT NOT NULL,           -- 'calculate_reward', 'analyze_churn'
  payload JSONB NOT NULL,         -- Dữ liệu đầu vào (Transaction ID, User ID)
  status TEXT DEFAULT 'pending',  -- pending, processing, completed, failed
  attempts INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Index cho Worker tìm job nhanh nhất
CREATE INDEX IF NOT EXISTS idx_agent_jobs_status_created ON agent_jobs(status, created_at) WHERE status = 'pending';

-- 2. PARTITIONING AGENT LOGS (Cold Storage)
-- 1M User -> Log phình to rất nhanh. Cần chia bảng theo tháng.
-- Lưu ý: Supabase Free tier có giới hạn partitioning, đây là code chuẩn cho Prod.

CREATE TABLE IF NOT EXISTS agent_logs_partitioned (
  id UUID DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  agent_name TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Tạo partition cho tháng hiện tại và tháng sau
CREATE TABLE IF NOT EXISTS agent_logs_y2025m12 PARTITION OF agent_logs_partitioned
  FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');
CREATE TABLE IF NOT EXISTS agent_logs_y2026m01 PARTITION OF agent_logs_partitioned
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE INDEX IF NOT EXISTS idx_logs_user_date ON agent_logs_partitioned(user_id, created_at DESC);

-- 3. DATABASE TRIGGER FOR "THE BEE" (Reward Engine)
-- Khi có giao dịch thành công -> Tự động tạo Job cho Agent
CREATE OR REPLACE FUNCTION trigger_the_bee_reward()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.type = 'Direct Sale' THEN
    INSERT INTO agent_jobs (agent_name, action, payload)
    VALUES (
      'The Bee', 
      'process_reward', 
      jsonb_build_object(
        'transaction_id', NEW.id,
        'user_id', NEW.user_id,
        'amount', NEW.amount
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sales_reward ON transactions;
CREATE TRIGGER tr_sales_reward
AFTER INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION trigger_the_bee_reward();

-- 4. TRANSACTIONAL REWARD DISTRIBUTION
-- Hàm này đảm bảo cộng tiền an toàn (Atomic)
CREATE OR REPLACE FUNCTION distribute_reward(p_user_id UUID, p_amount BIGINT, p_source_tx TEXT)
RETURNS VOID AS $$
BEGIN
  -- Update User Balance
  UPDATE users 
  SET grow_balance = grow_balance + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Log Reward Transaction
  INSERT INTO transactions (id, user_id, amount, type, status, currency)
  VALUES (
    'TX-REW-' || md5(random()::text || clock_timestamp()::text)::text, -- UUID giả lập
    p_user_id,
    p_amount,
    'Team Volume Bonus', -- Reward Type
    'completed',
    'GROW'
  );
END;
$$ LANGUAGE plpgsql;