-- ============================================================================
-- WellNexus RaaS — Usage Metering Phase 3
-- Migration: 260313_usage_metering_phase3.sql
-- Purpose: Simplified usage tracking with idempotency and billing config
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. USAGE METRICS TABLE - Simplified tracking with idempotency
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('api_calls', 'bookings', 'reports', 'email_sends')),
  quantity BIGINT NOT NULL DEFAULT 1,
  billing_period TEXT NOT NULL, -- 'YYYY-MM' format
  metadata JSONB DEFAULT '{}'::jsonb,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_usage_metrics_org_period ON usage_metrics(org_id, billing_period);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_user_period ON usage_metrics(user_id, billing_period);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_type ON usage_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_idempotency ON usage_metrics(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Enable RLS
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "service_role_usage_metrics"
  ON usage_metrics FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Users can view their org's metrics
CREATE POLICY "users_view_usage_metrics"
  ON usage_metrics FOR SELECT
  USING (
    org_id IN (
      SELECT DISTINCT org_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Insert via service only
CREATE POLICY "users_insert_usage_metrics"
  ON usage_metrics FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

COMMENT ON TABLE usage_metrics IS 'Phase 3: Simplified usage tracking with idempotency for billing';
COMMENT ON COLUMN usage_metrics.billing_period IS 'Billing period in YYYY-MM format';
COMMENT ON COLUMN usage_metrics.idempotency_key IS 'Unique key for deduplication (org_id:metric_type:period:uuid)';

-- ----------------------------------------------------------------------------
-- 2. USAGE BILLING CONFIG - Plan-based limits and pricing
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usage_billing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_tier TEXT NOT NULL UNIQUE CHECK (plan_tier IN ('free', 'pro', 'enterprise')),
  api_calls_limit BIGINT NOT NULL DEFAULT 1000,
  bookings_limit BIGINT NOT NULL DEFAULT 10,
  reports_limit BIGINT NOT NULL DEFAULT 5,
  email_sends_limit BIGINT NOT NULL DEFAULT 100,
  overage_rate_api_call NUMERIC DEFAULT 0.001, -- $ per call over limit
  overage_rate_booking NUMERIC DEFAULT 0.50,   -- $ per booking over limit
  overage_rate_report NUMERIC DEFAULT 1.00,    -- $ per report over limit
  overage_rate_email NUMERIC DEFAULT 0.01,     -- $ per email over limit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default pricing tiers
INSERT INTO usage_billing_config (plan_tier, api_calls_limit, bookings_limit, reports_limit, email_sends_limit)
VALUES
  ('free', 1000, 10, 5, 100),
  ('pro', 10000, 100, 50, 1000),
  ('enterprise', 100000, 1000, 500, 10000)
ON CONFLICT (plan_tier) DO NOTHING;

-- Enable RLS
ALTER TABLE usage_billing_config ENABLE ROW LEVEL SECURITY;

-- Everyone can read billing config
CREATE POLICY "usage_billing_config_read"
  ON usage_billing_config FOR SELECT
  USING (true);

-- Only admins can modify
CREATE POLICY "usage_billing_config_admin"
  ON usage_billing_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role_id <= 2
    )
  );

COMMENT ON TABLE usage_billing_config IS 'Phase 3: Plan-based usage limits and overage pricing';

-- ----------------------------------------------------------------------------
-- 3. HELPER FUNCTIONS
-- ----------------------------------------------------------------------------

-- Get current period usage for an org
CREATE OR REPLACE FUNCTION get_org_usage_summary(
  p_org_id UUID,
  p_period TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM')
)
RETURNS TABLE (
  metric_type TEXT,
  current_usage BIGINT,
  period TEXT
) AS $$
  SELECT
    um.metric_type,
    COALESCE(SUM(um.quantity), 0)::BIGINT AS current_usage,
    p_period AS period
  FROM usage_metrics um
  WHERE um.org_id = p_org_id
    AND um.billing_period = p_period
  GROUP BY um.metric_type;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if org is over quota for a specific metric
CREATE OR REPLACE FUNCTION check_org_quota(
  p_org_id UUID,
  p_metric_type TEXT,
  p_period TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM')
)
RETURNS TABLE (
  allowed BOOLEAN,
  remaining BIGINT,
  current_usage BIGINT,
  limit_value BIGINT
) AS $$
DECLARE
  v_limit BIGINT;
  v_usage BIGINT := 0;
  v_plan_tier TEXT;
BEGIN
  -- Get org's plan tier
  SELECT plan_tier INTO v_plan_tier
  FROM (
    SELECT ubc.plan_tier
    FROM usage_billing_config ubc
    JOIN organization_members om ON om.org_id = p_org_id
    JOIN users u ON u.id = om.user_id
    JOIN user_subscriptions us ON us.user_id = u.id
    JOIN subscription_plans sp ON sp.id = us.plan_id
    WHERE ubc.plan_tier = sp.slug
      AND us.status = 'active'
    LIMIT 1
  ) sub;

  -- Default to free tier if no active plan
  IF v_plan_tier IS NULL THEN
    v_plan_tier := 'free';
  END IF;

  -- Get limit for tier
  CASE p_metric_type
    WHEN 'api_calls' THEN
      SELECT api_calls_limit INTO v_limit FROM usage_billing_config WHERE plan_tier = v_plan_tier;
    WHEN 'bookings' THEN
      SELECT bookings_limit INTO v_limit FROM usage_billing_config WHERE plan_tier = v_plan_tier;
    WHEN 'reports' THEN
      SELECT reports_limit INTO v_limit FROM usage_billing_config WHERE plan_tier = v_plan_tier;
    WHEN 'email_sends' THEN
      SELECT email_sends_limit INTO v_limit FROM usage_billing_config WHERE plan_tier = v_plan_tier;
    ELSE
      v_limit := 9223372036854775807; -- Unlimited for unknown metrics
  END CASE;

  -- Get current usage
  SELECT COALESCE(SUM(quantity), 0) INTO v_usage
  FROM usage_metrics
  WHERE org_id = p_org_id
    AND metric_type = p_metric_type
    AND billing_period = p_period;

  RETURN QUERY SELECT
    (v_usage < v_limit) AS allowed,
    GREATEST(0, v_limit - v_usage)::BIGINT AS remaining,
    v_usage AS current_usage,
    v_limit AS limit_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Calculate overage units for billing
CREATE OR REPLACE FUNCTION get_org_overage_units(
  p_org_id UUID,
  p_period TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM')
)
RETURNS TABLE (
  metric_type TEXT,
  overage_units BIGINT,
  overage_amount NUMERIC
) AS $$
DECLARE
  v_plan_tier TEXT;
  v_config usage_billing_config%ROWTYPE;
  v_usage BIGINT;
  v_limit BIGINT;
BEGIN
  -- Get org's plan tier
  SELECT plan_tier INTO v_plan_tier
  FROM (
    SELECT ubc.plan_tier
    FROM usage_billing_config ubc
    JOIN organization_members om ON om.org_id = p_org_id
    JOIN users u ON u.id = om.user_id
    JOIN user_subscriptions us ON us.user_id = u.id
    JOIN subscription_plans sp ON sp.id = us.plan_id
    WHERE ubc.plan_tier = sp.slug
      AND us.status = 'active'
    LIMIT 1
  ) sub;

  IF v_plan_tier IS NULL THEN
    v_plan_tier := 'free';
  END IF;

  -- Get config for tier
  SELECT * INTO v_config FROM usage_billing_config WHERE plan_tier = v_plan_tier;

  -- Check each metric type
  FOR metric_type IN ('api_calls', 'bookings', 'reports', 'email_sends') LOOP
    SELECT COALESCE(SUM(quantity), 0) INTO v_usage
    FROM usage_metrics
    WHERE org_id = p_org_id
      AND metric_type = metric_type
      AND billing_period = p_period;

    CASE metric_type
      WHEN 'api_calls' THEN v_limit := v_config.api_calls_limit;
      WHEN 'bookings' THEN v_limit := v_config.bookings_limit;
      WHEN 'reports' THEN v_limit := v_config.reports_limit;
      WHEN 'email_sends' THEN v_limit := v_config.email_sends_limit;
    END CASE;

    overage_units := GREATEST(0, v_usage - v_limit);
    overage_amount := overage_units * (
      CASE metric_type
        WHEN 'api_calls' THEN v_config.overage_rate_api_call
        WHEN 'bookings' THEN v_config.overage_rate_booking
        WHEN 'reports' THEN v_config.overage_rate_report
        WHEN 'email_sends' THEN v_config.overage_rate_email
        ELSE 0
      END
    );

    IF overage_units > 0 THEN
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_org_usage_summary IS 'Get current period usage for an org';
COMMENT ON FUNCTION check_org_quota IS 'Check if org is over quota for a metric';
COMMENT ON FUNCTION get_org_overage_units IS 'Calculate overage units and amounts for billing';
