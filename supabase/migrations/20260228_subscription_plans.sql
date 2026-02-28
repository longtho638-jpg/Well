-- ============================================================================
-- WellNexus RaaS — Subscription Plans & User Subscriptions
-- Migration: 20260228_subscription_plans.sql
-- Purpose: Cho phép Well bán platform dưới dạng subscription cho agency/reseller
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SUBSCRIPTION PLANS — Các gói dịch vụ
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_plans (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug          TEXT NOT NULL UNIQUE,             -- 'free' | 'basic' | 'pro' | 'agency'
  name          TEXT NOT NULL,                    -- Tên hiển thị
  price_monthly BIGINT NOT NULL DEFAULT 0,        -- Giá VNĐ/tháng (0 = miễn phí)
  price_yearly  BIGINT NOT NULL DEFAULT 0,        -- Giá VNĐ/năm
  max_members   INTEGER NOT NULL DEFAULT 50,      -- Giới hạn thành viên mạng lưới
  features      JSONB NOT NULL DEFAULT '[]',      -- Danh sách tính năng
  is_active     BOOLEAN NOT NULL DEFAULT true,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed dữ liệu gói mặc định
INSERT INTO subscription_plans (slug, name, price_monthly, price_yearly, max_members, features, sort_order)
VALUES
  ('free',   'Miễn Phí',    0,         0,          50,   '["dashboard","marketplace","basic_commission"]',           0),
  ('basic',  'Cơ Bản',      299000,    2990000,    200,  '["dashboard","marketplace","commission","withdrawal","health_coach"]', 1),
  ('pro',    'Chuyên Nghiệp',690000,   6900000,    1000, '["all_features","ai_copilot","advanced_analytics","priority_support"]', 2),
  ('agency', 'Đại Lý',      1490000,   14900000,   5000, '["all_features","white_label","multi_network","api_access","dedicated_support"]', 3)
ON CONFLICT (slug) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. USER SUBSCRIPTIONS — Subscription của từng user
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id            UUID NOT NULL REFERENCES subscription_plans(id),
  status             TEXT NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active','past_due','canceled','trialing','expired')),
  billing_cycle      TEXT NOT NULL DEFAULT 'monthly'
                     CHECK (billing_cycle IN ('monthly','yearly')),
  -- Thời hạn
  started_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,
  canceled_at        TIMESTAMPTZ,
  -- PayOS tracking
  payos_order_code   BIGINT,                      -- Order code từ PayOS
  last_payment_at    TIMESTAMPTZ,
  next_payment_at    TIMESTAMPTZ,
  -- Metadata
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index cho queries thường gặp
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status  ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_period  ON user_subscriptions(current_period_end);

-- Trigger tự cập nhật updated_at
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_subscription_updated_at();

-- ----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
ALTER TABLE subscription_plans   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions   ENABLE ROW LEVEL SECURITY;

-- Subscription plans: mọi người đọc được, chỉ admin ghi
CREATE POLICY "subscription_plans_read_all"
  ON subscription_plans FOR SELECT USING (true);

CREATE POLICY "subscription_plans_admin_write"
  ON subscription_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role_id <= 2
    )
  );

-- User subscriptions: chỉ đọc của mình hoặc admin
CREATE POLICY "user_subscriptions_own"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_subscriptions_admin"
  ON user_subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role_id <= 2
    )
  );

-- ----------------------------------------------------------------------------
-- 4. HELPER FUNCTION — Lấy plan hiện tại của user
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_active_plan(p_user_id UUID)
RETURNS TABLE (
  plan_slug     TEXT,
  plan_name     TEXT,
  status        TEXT,
  period_end    TIMESTAMPTZ,
  max_members   INTEGER
) AS $$
  SELECT
    sp.slug,
    sp.name,
    us.status,
    us.current_period_end,
    sp.max_members
  FROM user_subscriptions us
  JOIN subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = p_user_id
    AND us.status IN ('active', 'trialing')
    AND us.current_period_end > NOW()
  ORDER BY us.created_at DESC
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
