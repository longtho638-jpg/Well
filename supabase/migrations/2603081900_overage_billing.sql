-- ============================================================
-- Phase 7.1: Overage Billing Database Schema
-- Description: Track usage exceeding quotas and calculate costs
-- Created: 2026-03-08
-- ============================================================

-- ============================================================
-- Table: overage_transactions
-- Tracks usage that exceeds licensed quotas
-- ============================================================
CREATE TABLE IF NOT EXISTS overage_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  license_id UUID REFERENCES raas_licenses(id) ON DELETE CASCADE,

  -- Usage details
  metric_type TEXT NOT NULL, -- 'api_calls', 'ai_calls', 'tokens', 'compute_minutes', 'storage_gb', 'emails', 'model_inferences', 'agent_executions'
  billing_period TEXT NOT NULL, -- '2026-03' format

  -- Quota calculation
  total_usage BIGINT NOT NULL DEFAULT 0,
  included_quota BIGINT NOT NULL DEFAULT 0,
  overage_units BIGINT NOT NULL DEFAULT 0,

  -- Pricing
  rate_per_unit NUMERIC(12, 6) NOT NULL DEFAULT 0,
  total_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Stripe sync
  stripe_subscription_item_id TEXT,
  stripe_usage_record_id TEXT,
  stripe_synced_at TIMESTAMPTZ,
  stripe_sync_status TEXT DEFAULT 'pending', -- 'pending', 'synced', 'failed'

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  idempotency_key TEXT UNIQUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_overage_org_period ON overage_transactions(org_id, billing_period);
CREATE INDEX idx_overage_stripe_sync ON overage_transactions(stripe_usage_record_id);
CREATE INDEX idx_overage_tenant ON overage_transactions(tenant_id);
CREATE INDEX idx_overage_license ON overage_transactions(license_id);
CREATE INDEX idx_overage_created ON overage_transactions(created_at DESC);
CREATE INDEX idx_overage_idempotency ON overage_transactions(idempotency_key);

-- Comment
COMMENT ON TABLE overage_transactions IS 'Phase 7: Tracks usage exceeding quotas and overage billing costs';

-- ============================================================
-- Table: stripe_usage_sync_log
-- Audit log for Stripe usage record synchronization
-- ============================================================
CREATE TABLE IF NOT EXISTS stripe_usage_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  overage_transaction_id UUID REFERENCES overage_transactions(id) ON DELETE CASCADE,

  -- Stripe details
  stripe_subscription_item_id TEXT NOT NULL,
  stripe_usage_record_id TEXT,
  quantity BIGINT NOT NULL,
  action TEXT NOT NULL DEFAULT 'increment', -- 'increment' or 'set'
  timestamp BIGINT NOT NULL, -- Unix timestamp

  -- Sync status
  sync_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed'
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMPTZ,

  -- Response from Stripe
  stripe_response JSONB,

  -- Metadata
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_stripe_sync_overage ON stripe_usage_sync_log(overage_transaction_id);
CREATE INDEX idx_stripe_sync_status ON stripe_usage_sync_log(sync_status, next_retry_at);
CREATE INDEX idx_stripe_sync_record ON stripe_usage_sync_log(stripe_usage_record_id);

-- Comment
COMMENT ON TABLE stripe_usage_sync_log IS 'Phase 7: Audit log for Stripe usage record synchronization with retry support';

-- ============================================================
-- Table: overage_rates
-- Stores rate per unit for each metric type and plan tier
-- ============================================================
CREATE TABLE IF NOT EXISTS overage_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL UNIQUE,

  -- Rate by tier
  free_rate NUMERIC(12, 6) NOT NULL DEFAULT 0,
  basic_rate NUMERIC(12, 6) NOT NULL DEFAULT 0,
  pro_rate NUMERIC(12, 6) NOT NULL DEFAULT 0,
  enterprise_rate NUMERIC(12, 6) NOT NULL DEFAULT 0,
  master_rate NUMERIC(12, 6) NOT NULL DEFAULT 0,

  -- Custom tenant rates (override base rates)
  custom_rate JSONB DEFAULT '[]'::jsonb, -- [{tenant_id, rate}]

  -- Metadata
  description TEXT,
  unit_name TEXT, -- 'per 1K calls', 'per GB', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_overage_rates_metric ON overage_rates(metric_type);

-- Comment
COMMENT ON TABLE overage_rates IS 'Phase 7: Rate per unit for each metric type and plan tier';

-- ============================================================
-- Seed overage rates (default values)
-- ============================================================
INSERT INTO overage_rates (metric_type, free_rate, basic_rate, pro_rate, enterprise_rate, master_rate, description, unit_name) VALUES
  ('api_calls', 0.001000, 0.000800, 0.000500, 0.000300, 0.000100, 'Per API call over quota', 'per call'),
  ('ai_calls', 0.050000, 0.040000, 0.030000, 0.020000, 0.010000, 'Per AI inference over quota', 'per call'),
  ('tokens', 0.000004, 0.000003, 0.000002, 0.000001, 0.0000005, 'Per token over quota', 'per token'),
  ('compute_minutes', 0.010000, 0.008000, 0.005000, 0.003000, 0.001000, 'Per compute minute over quota', 'per minute'),
  ('storage_gb', 0.500000, 0.400000, 0.300000, 0.200000, 0.100000, 'Per GB storage over quota', 'per GB'),
  ('emails', 0.002000, 0.001500, 0.001000, 0.000500, 0.000200, 'Per email over quota', 'per email'),
  ('model_inferences', 0.020000, 0.015000, 0.010000, 0.005000, 0.002500, 'Per model inference over quota', 'per inference'),
  ('agent_executions', 0.100000, 0.080000, 0.050000, 0.030000, 0.015000, 'Per agent execution over quota', 'per execution')
ON CONFLICT (metric_type) DO UPDATE SET
  free_rate = EXCLUDED.free_rate,
  basic_rate = EXCLUDED.basic_rate,
  pro_rate = EXCLUDED.pro_rate,
  enterprise_rate = EXCLUDED.enterprise_rate,
  master_rate = EXCLUDED.master_rate,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS
ALTER TABLE overage_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_usage_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE overage_rates ENABLE ROW LEVEL SECURITY;

-- Overages: Users can view their org's overages
CREATE POLICY "Users can view org overages"
  ON overage_transactions
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Overages: Service role can insert/update (for backend operations)
CREATE POLICY "Service role can manage overages"
  ON overage_transactions
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Stripe sync log: Service role only
CREATE POLICY "Service role manages sync log"
  ON stripe_usage_sync_log
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Overage rates: Everyone can read, service role can write
CREATE POLICY "Everyone can read rates"
  ON overage_rates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role manages rates"
  ON overage_rates
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================
-- Functions and Triggers
-- ============================================================

-- Function: Calculate overage for a given metric
CREATE OR REPLACE FUNCTION calculate_overage(
  p_total_usage BIGINT,
  p_included_quota BIGINT
)
RETURNS BIGINT AS $$
BEGIN
  RETURN GREATEST(0, p_total_usage - p_included_quota);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Get overage rate for metric and tier
CREATE OR REPLACE FUNCTION get_overage_rate(
  p_metric_type TEXT,
  p_tier TEXT
)
RETURNS NUMERIC AS $$
DECLARE
  v_rate NUMERIC;
BEGIN
  SELECT
    CASE p_tier
      WHEN 'free' THEN free_rate
      WHEN 'basic' THEN basic_rate
      WHEN 'pro' THEN pro_rate
      WHEN 'enterprise' THEN enterprise_rate
      WHEN 'master' THEN master_rate
      ELSE basic_rate
    END
  INTO v_rate
  FROM overage_rates
  WHERE metric_type = p_metric_type;

  RETURN COALESCE(v_rate, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Calculate total overage cost
CREATE OR REPLACE FUNCTION calculate_overage_cost(
  p_overage_units BIGINT,
  p_rate_per_unit NUMERIC
)
RETURNS NUMERIC AS $$
BEGIN
  RETURN ROUND(p_overage_units * p_rate_per_unit, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Generate idempotency key for overage record
CREATE OR REPLACE FUNCTION generate_overage_idempotency_key(
  p_org_id UUID,
  p_metric_type TEXT,
  p_billing_period TEXT
)
RETURNS TEXT AS $$
BEGIN
  RETURN 'ovg_' || p_org_id || '_' || p_metric_type || '_' || p_billing_period;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_overage_transaction_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_overage_transaction_updated_at
  BEFORE UPDATE ON overage_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_overage_transaction_updated_at();

-- ============================================================
-- Views for Dashboard
-- ============================================================

-- View: Current period overages by org
CREATE OR REPLACE VIEW current_period_overages AS
SELECT
  org_id,
  billing_period,
  COUNT(*) as overage_count,
  SUM(total_cost) as total_overage_cost,
  SUM(overage_units) as total_overage_units,
  MAX(created_at) as last_overage_at
FROM overage_transactions
WHERE billing_period = to_char(CURRENT_DATE, 'YYYY-MM')
GROUP BY org_id, billing_period;

-- View: Overage summary by metric type
CREATE OR REPLACE VIEW overage_summary_by_metric AS
SELECT
  metric_type,
  billing_period,
  COUNT(*) as occurrence_count,
  SUM(overage_units) as total_units,
  AVG(rate_per_unit) as avg_rate,
  SUM(total_cost) as total_cost
FROM overage_transactions
GROUP BY metric_type, billing_period
ORDER BY billing_period DESC, total_cost DESC;

-- ============================================================
-- End of Migration
-- ============================================================
