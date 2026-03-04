-- ============================================================================
-- WellNexus RaaS — Usage Metering & Feature Flags
-- Migration: 20260304_usage_metering_feature_flags.sql
-- Purpose: Track API usage, AI calls for Pro/Enterprise tiers + Feature gating
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. USAGE METRICS — Theo dõi usage per user/org
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usage_metrics (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id       UUID REFERENCES organizations(id) ON DELETE CASCADE,
  metric_type  TEXT NOT NULL,
  metric_value BIGINT NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index cho queries
CREATE INDEX IF NOT EXISTS idx_usage_metrics_user ON usage_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_org ON usage_metrics(org_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_period ON usage_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_type ON usage_metrics(metric_type);

-- Unique constraint: 1 user + 1 metric type + 1 period
CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_metrics_unique
  ON usage_metrics(user_id, metric_type, period_start, period_end);

-- RLS
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_metrics_own_read"
  ON usage_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "usage_metrics_admin"
  ON usage_metrics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role_id <= 2
    )
  );

-- ----------------------------------------------------------------------------
-- 2. USAGE LIMITS — Giới hạn theo plan
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usage_limits (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id      UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  metric_type  TEXT NOT NULL,
  limit_value  BIGINT NOT NULL,
  limit_period TEXT NOT NULL DEFAULT 'monthly' CHECK (limit_period IN ('daily', 'monthly', 'yearly')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default limits
INSERT INTO usage_limits (plan_id, metric_type, limit_value, limit_period)
SELECT
  sp.id,
  ul.metric_type,
  ul.limit_value,
  ul.limit_period
FROM subscription_plans sp
CROSS JOIN (
  VALUES
    ('ai_calls', 100, 'monthly'),
    ('api_calls', 1000, 'monthly'),
    ('storage_mb', 100, 'monthly'),
    ('email_sends', 100, 'monthly')
) AS ul(metric_type, limit_value, limit_period)
WHERE sp.slug IN ('free', 'basic')
ON CONFLICT DO NOTHING;

-- Pro tier: cao hơn
INSERT INTO usage_limits (plan_id, metric_type, limit_value, limit_period)
SELECT
  sp.id,
  ul.metric_type,
  ul.limit_value,
  ul.limit_period
FROM subscription_plans sp
CROSS JOIN (
  VALUES
    ('ai_calls', 1000, 'monthly'),
    ('api_calls', 10000, 'monthly'),
    ('storage_mb', 1000, 'monthly'),
    ('email_sends', 1000, 'monthly')
) AS ul(metric_type, limit_value, limit_period)
WHERE sp.slug = 'pro'
ON CONFLICT DO NOTHING;

-- Agency tier: unlimited (null = no limit)
INSERT INTO usage_limits (plan_id, metric_type, limit_value, limit_period)
SELECT
  sp.id,
  ul.metric_type,
  ul.limit_value,
  ul.limit_period
FROM subscription_plans sp
CROSS JOIN (
  VALUES
    ('ai_calls', 10000, 'monthly'),
    ('api_calls', 100000, 'monthly'),
    ('storage_mb', 10000, 'monthly'),
    ('email_sends', 10000, 'monthly')
) AS ul(metric_type, limit_value, limit_period)
WHERE sp.slug = 'agency'
ON CONFLICT DO NOTHING;

-- Index
CREATE INDEX IF NOT EXISTS idx_usage_limits_plan ON usage_limits(plan_id);
CREATE INDEX IF NOT EXISTS idx_usage_limits_type ON usage_limits(metric_type);

-- RLS
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_limits_read_all"
  ON usage_limits FOR SELECT
  USING (true);

-- ----------------------------------------------------------------------------
-- 3. FEATURE FLAGS — Bật/tắt tính năng theo plan
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feature_flags (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flag_key     TEXT NOT NULL UNIQUE,
  flag_name    TEXT NOT NULL,
  description  TEXT,
  is_enabled   BOOLEAN NOT NULL DEFAULT true,
  plan_access  TEXT[] NOT NULL DEFAULT '{}',  -- Array of plan slugs
  metadata     JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed feature flags
INSERT INTO feature_flags (flag_key, flag_name, description, plan_access) VALUES
  ('ai_insights', 'AI Insights', 'AI-powered health insights và recommendations', '{"basic","pro","agency"}'),
  ('ai_copilot', 'AI Copilot', 'Trợ lý AI cho sales và marketing', '{"pro","agency"}'),
  ('white_label', 'White Label', 'Tùy chỉnh branding, domain riêng', '{"agency"}'),
  ('api_access', 'API Access', 'REST API cho tích hợp bên thứ 3', '{"agency"}'),
  ('advanced_analytics', 'Advanced Analytics', 'Báo cáo và phân tích nâng cao', '{"pro","agency"}'),
  ('multi_network', 'Multi-Network', 'Quản lý nhiều network cùng lúc', '{"agency"}'),
  ('priority_support', 'Priority Support', 'Hỗ trợ ưu tiên 24/7', '{"pro","agency"}'),
  ('health_coach', 'Health Coach Agent', 'AI Health Coach tự động', '{"basic","pro","agency"}'),
  ('commission_advanced', 'Commission Advanced', 'Hoa hồng đa cấp 8 tầng', '{"basic","pro","agency"}')
ON CONFLICT (flag_key) DO NOTHING;

-- Index
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(flag_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(is_enabled);

-- RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feature_flags_read_all"
  ON feature_flags FOR SELECT
  USING (true);

-- ----------------------------------------------------------------------------
-- 4. USER FEATURE ACCESS — User nào được access feature nào
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_feature_access (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flag_key   TEXT NOT NULL REFERENCES feature_flags(flag_key) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, flag_key)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_feature_user ON user_feature_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feature_flag ON user_feature_access(flag_key);

-- RLS
ALTER TABLE user_feature_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_feature_own_read"
  ON user_feature_access FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_feature_admin"
  ON user_feature_access FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role_id <= 2
    )
  );

-- ----------------------------------------------------------------------------
-- 5. HELPER FUNCTIONS
-- ----------------------------------------------------------------------------

-- Check if user has access to a feature
CREATE OR REPLACE FUNCTION user_has_feature(p_user_id UUID, p_flag_key TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_access BOOLEAN;
  v_plan_slug TEXT;
BEGIN
  -- Check if feature exists and is enabled
  IF NOT EXISTS (
    SELECT 1 FROM feature_flags
    WHERE flag_key = p_flag_key AND is_enabled = true
  ) THEN
    RETURN FALSE;
  END IF;

  -- Check if user has explicit access
  SELECT EXISTS (
    SELECT 1 FROM user_feature_access
    WHERE user_id = p_user_id
      AND flag_key = p_flag_key
      AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO v_has_access;

  IF v_has_access THEN
    RETURN TRUE;
  END IF;

  -- Check via plan access
  SELECT plan_slug INTO v_plan_slug
  FROM get_user_active_plan(p_user_id);

  IF v_plan_slug IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM feature_flags
    WHERE flag_key = p_flag_key
      AND plan_access @> ARRAY[v_plan_slug]
  ) INTO v_has_access;

  RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get all features for a user
CREATE OR REPLACE FUNCTION get_user_features(p_user_id UUID)
RETURNS TABLE (
  flag_key TEXT,
  flag_name TEXT,
  is_enabled BOOLEAN,
  granted_at TIMESTAMPTZ
) AS $$
  SELECT
    ff.flag_key,
    ff.flag_name,
    ff.is_enabled,
    ufa.granted_at
  FROM feature_flags ff
  LEFT JOIN user_feature_access ufa ON ufa.flag_key = ff.flag_key AND ufa.user_id = p_user_id
  WHERE user_has_feature(p_user_id, ff.flag_key)
  ORDER BY ff.flag_name;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Increment usage counter
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_org_id UUID,
  p_metric_type TEXT,
  p_value BIGINT DEFAULT 1
)
RETURNS TABLE (
  current_value BIGINT,
  limit_value BIGINT,
  is_exceeded BOOLEAN
) AS $$
DECLARE
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
  v_current_value BIGINT;
  v_limit_value BIGINT;
BEGIN
  -- Get current period (monthly)
  v_period_start := date_trunc('month', NOW());
  v_period_end := (v_period_start + INTERVAL '1 month')::TIMESTAMPTZ;

  -- Upsert usage metric
  INSERT INTO usage_metrics (user_id, org_id, metric_type, metric_value, period_start, period_end)
  VALUES (p_user_id, p_org_id, p_metric_type, p_value, v_period_start, v_period_end)
  ON CONFLICT (user_id, metric_type, period_start, period_end)
  DO UPDATE SET metric_value = usage_metrics.metric_value + p_value;

  -- Get current value
  SELECT metric_value INTO v_current_value
  FROM usage_metrics
  WHERE user_id = p_user_id
    AND metric_type = p_metric_type
    AND period_start = v_period_start;

  -- Get limit from plan
  SELECT ul.limit_value INTO v_limit_value
  FROM usage_limits ul
  JOIN user_subscriptions us ON us.plan_id = ul.plan_id
  WHERE us.user_id = p_user_id
    AND us.status = 'active'
    AND ul.metric_type = p_metric_type
    AND ul.limit_period = 'monthly'
  LIMIT 1;

  -- If no limit found, check free tier defaults
  IF v_limit_value IS NULL THEN
    v_limit_value := 9223372036854775807; -- Unlimited (max bigint)
  END IF;

  RETURN QUERY SELECT v_current_value, v_limit_value, (v_current_value > v_limit_value);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check usage status
CREATE OR REPLACE FUNCTION get_usage_status(p_user_id UUID, p_metric_type TEXT)
RETURNS TABLE (
  current_value BIGINT,
  limit_value BIGINT,
  percentage_used NUMERIC,
  is_exceeded BOOLEAN,
  period_end TIMESTAMPTZ
) AS $$
DECLARE
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
  v_current_value BIGINT := 0;
  v_limit_value BIGINT := 9223372036854775807;
BEGIN
  v_period_start := date_trunc('month', NOW());
  v_period_end := (v_period_start + INTERVAL '1 month')::TIMESTAMPTZ;

  -- Get current usage
  SELECT COALESCE(metric_value, 0) INTO v_current_value
  FROM usage_metrics
  WHERE user_id = p_user_id
    AND metric_type = p_metric_type
    AND period_start = v_period_start;

  -- Get limit
  SELECT ul.limit_value INTO v_limit_value
  FROM usage_limits ul
  JOIN user_subscriptions us ON us.plan_id = ul.plan_id
  WHERE us.user_id = p_user_id
    AND us.status = 'active'
    AND ul.metric_type = p_metric_type
    AND ul.limit_period = 'monthly'
  LIMIT 1;

  IF v_limit_value IS NULL THEN
    v_limit_value := 9223372036854775807;
  END IF;

  RETURN QUERY
    SELECT
      v_current_value,
      v_limit_value,
      CASE
        WHEN v_limit_value = 0 THEN 0
        ELSE ROUND((v_current_value::NUMERIC / v_limit_value::NUMERIC) * 100, 2)
      END,
      (v_current_value > v_limit_value),
      v_period_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
