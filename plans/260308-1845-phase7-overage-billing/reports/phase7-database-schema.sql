-- Phase 7: Overage Billing and Quota Enforcement Schema
-- Purpose: Add overage tracking, enforcement modes, and Stripe integration tables
-- Date: 2026-03-08

-- ============================================================================
-- 1. Overage Transactions Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS overage_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Metric identification
  metric_type TEXT NOT NULL CHECK (metric_type IN (
    'api_calls',
    'ai_calls',
    'storage_gb',
    'email_sends',
    'agent_executions',
    'compute_ms',
    'tokens'
  )),
  billing_period TEXT NOT NULL,  -- '2026-03' (YYYY-MM format)

  -- Usage calculation
  total_usage BIGINT NOT NULL DEFAULT 0,
  included_quota BIGINT NOT NULL DEFAULT 0,
  overage_units BIGINT NOT NULL DEFAULT 0,

  -- Pricing
  rate_per_unit NUMERIC(10, 6) NOT NULL DEFAULT 0,
  total_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',

  -- Stripe integration
  stripe_subscription_item_id TEXT,
  stripe_price_id TEXT,
  stripe_usage_record_id TEXT,
  stripe_synced_at TIMESTAMPTZ,
  stripe_sync_status TEXT DEFAULT 'pending' CHECK (stripe_sync_status IN (
    'pending',
    'synced',
    'failed',
    'retry'
  )),

  -- Enforcement context
  enforcement_mode TEXT DEFAULT 'soft' CHECK (enforcement_mode IN ('soft', 'hard', 'hybrid')),
  was_blocked BOOLEAN DEFAULT false,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_overage_org_period ON overage_transactions(org_id, billing_period);
CREATE INDEX idx_overage_tenant ON overage_transactions(tenant_id);
CREATE INDEX idx_overage_metric ON overage_transactions(metric_type, billing_period);
CREATE INDEX idx_overage_stripe ON overage_transactions(stripe_usage_record_id);
CREATE INDEX idx_overage_sync_status ON overage_transactions(stripe_sync_status);
CREATE INDEX idx_overage_created_at ON overage_transactions(created_at DESC);

-- Row Level Security
ALTER TABLE overage_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org overages"
  ON overage_transactions
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Service role full access"
  ON overage_transactions
  FOR ALL
  USING (true);


-- ============================================================================
-- 2. Enhanced Tenant License Policies (add enforcement_mode)
-- ============================================================================

ALTER TABLE tenant_license_policies
ADD COLUMN IF NOT EXISTS enforcement_mode TEXT DEFAULT 'soft' CHECK (enforcement_mode IN ('soft', 'hard', 'hybrid')),
ADD COLUMN IF NOT EXISTS grace_period_days INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS grace_period_rate_reduction NUMERIC(5, 2) DEFAULT 0.50;  -- 50% reduction


-- ============================================================================
-- 3. API Keys Table (for mk_ key authentication)
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Key details
  key_hash TEXT NOT NULL,  -- SHA-256 hash of the actual key
  key_prefix TEXT NOT NULL,  -- First 8 chars for identification (e.g., "mk_tenant")
  key_name TEXT,  -- User-friendly name

  -- Permissions
  allowed_scopes JSONB DEFAULT '[]'::jsonb,  -- ["read", "write", "admin"]
  rate_limit_override JSONB,  -- Custom rate limits for this key

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_api_keys_org ON api_keys(org_id);
CREATE INDEX idx_api_keys_tenant ON api_keys(tenant_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_status ON api_keys(status);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);

-- RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org keys"
  ON api_keys
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can create own org keys"
  ON api_keys
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Service role full access"
  ON api_keys
  FOR ALL
  USING (true);


-- ============================================================================
-- 4. Stripe Usage Sync Log (for reconciliation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS stripe_usage_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  overage_transaction_id UUID REFERENCES overage_transactions(id) ON DELETE SET NULL,

  -- Stripe details
  stripe_subscription_item_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  stripe_usage_record_id TEXT,

  -- Sync details
  sync_action TEXT DEFAULT 'increment' CHECK (sync_action IN ('increment', 'set', 'clear')),
  quantity BIGINT NOT NULL,
  timestamp BIGINT NOT NULL,  -- Unix timestamp

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'retry')),
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,

  -- Error handling
  error_message TEXT,
  stripe_response JSONB,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stripe_sync_org ON stripe_usage_sync_log(org_id);
CREATE INDEX idx_stripe_sync_overage ON stripe_usage_sync_log(overage_transaction_id);
CREATE INDEX idx_stripe_sync_status ON stripe_usage_sync_log(status);
CREATE INDEX idx_stripe_sync_retry ON stripe_usage_sync_log(next_retry_at) WHERE status = 'retry';

-- RLS
ALTER TABLE stripe_usage_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org sync logs"
  ON stripe_usage_sync_log
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Service role full access"
  ON stripe_usage_sync_log
  FOR ALL
  USING (true);


-- ============================================================================
-- 5. Functions
-- ============================================================================

-- Function: Calculate overage for a given usage
CREATE OR REPLACE FUNCTION calculate_overage(
  p_total_usage BIGINT,
  p_included_quota BIGINT,
  p_rate_per_unit NUMERIC
)
RETURNS TABLE (
  overage_units BIGINT,
  total_cost NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    GREATEST(0, p_total_usage - p_included_quota) AS overage_units,
    GREATEST(0, p_total_usage - p_included_quota) * p_rate_per_unit AS total_cost;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Get effective quota (Base + Overrides + Grace)
CREATE OR REPLACE FUNCTION get_effective_quota(
  p_tenant_id UUID,
  p_metric_type TEXT
)
RETURNS TABLE (
  base_quota BIGINT,
  override_quota BIGINT,
  grace_boost BIGINT,
  effective_quota BIGINT,
  enforcement_mode TEXT,
  is_grace_period BOOLEAN
) AS $$
DECLARE
  v_base_quota BIGINT;
  v_override BIGINT;
  v_grace_boost BIGINT := 0;
  v_is_grace BOOLEAN := false;
  v_enforcement_mode TEXT;
  v_grace_rate_reduction NUMERIC;
BEGIN
  -- Get base quota from tenant policy
  SELECT quota_limit, enforcement_mode, grace_period_rate_reduction
  INTO v_base_quota, v_enforcement_mode, v_grace_rate_reduction
  FROM tenant_license_policies
  WHERE org_id = (SELECT org_id FROM tenants WHERE id = p_tenant_id)
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Get override
  SELECT quota_limit
  INTO v_override
  FROM tenant_quota_overrides
  WHERE tenant_id = p_tenant_id
    AND metric_type = p_metric_type
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Check if in grace period (implement based on your grace period logic)
  -- This is a simplified version - integrate with grace_period_engine.ts
  v_is_grace := false;  -- TODO: Implement grace period check

  IF v_is_grace AND v_grace_rate_reduction IS NOT NULL THEN
    v_grace_boost := ROUND(v_base_quota * v_grace_rate_reduction)::BIGINT;
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(v_base_quota, 0) AS base_quota,
    COALESCE(v_override, 0) AS override_quota,
    v_grace_boost AS grace_boost,
    (COALESCE(v_base_quota, 0) + COALESCE(v_override, 0) + v_grace_boost) AS effective_quota,
    COALESCE(v_enforcement_mode, 'soft') AS enforcement_mode,
    v_is_grace AS is_grace_period;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Record overage transaction
CREATE OR REPLACE FUNCTION record_overage(
  p_org_id UUID,
  p_tenant_id UUID,
  p_metric_type TEXT,
  p_billing_period TEXT,
  p_total_usage BIGINT,
  p_included_quota BIGINT,
  p_rate_per_unit NUMERIC,
  p_enforcement_mode TEXT DEFAULT 'soft',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_overage_units BIGINT;
  v_total_cost NUMERIC;
  v_transaction_id UUID;
BEGIN
  -- Calculate overage
  SELECT overage_units, total_cost
  INTO v_overage_units, v_total_cost
  FROM calculate_overage(p_total_usage, p_included_quota, p_rate_per_unit);

  -- Insert transaction
  INSERT INTO overage_transactions (
    org_id,
    tenant_id,
    metric_type,
    billing_period,
    total_usage,
    included_quota,
    overage_units,
    rate_per_unit,
    total_cost,
    enforcement_mode,
    metadata
  ) VALUES (
    p_org_id,
    p_tenant_id,
    p_metric_type,
    p_billing_period,
    p_total_usage,
    p_included_quota,
    v_overage_units,
    p_rate_per_unit,
    v_total_cost,
    p_enforcement_mode,
    p_metadata
  )
  RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Check quota and determine if request should be allowed
CREATE OR REPLACE FUNCTION check_quota_enforcement(
  p_tenant_id UUID,
  p_metric_type TEXT,
  p_current_usage BIGINT
)
RETURNS TABLE (
  allowed BOOLEAN,
  effective_quota BIGINT,
  overage_units BIGINT,
  enforcement_mode TEXT,
  should_block BOOLEAN
) AS $$
DECLARE
  v_effective_quota BIGINT;
  v_enforcement_mode TEXT;
  v_overage BIGINT;
BEGIN
  -- Get effective quota
  SELECT eq.effective_quota, eq.enforcement_mode
  INTO v_effective_quota, v_enforcement_mode
  FROM get_effective_quota(p_tenant_id, p_metric_type) eq;

  -- Calculate overage
  v_overage := GREATEST(0, p_current_usage - v_effective_quota);

  -- Determine if allowed
  IF v_overage = 0 THEN
    -- Under quota - always allowed
    RETURN QUERY SELECT true, v_effective_quota, 0, v_enforcement_mode, false;
  ELSIF v_enforcement_mode = 'soft' THEN
    -- Soft mode - allow with overage billing
    RETURN QUERY SELECT true, v_effective_quota, v_overage, v_enforcement_mode, false;
  ELSIF v_enforcement_mode = 'hard' THEN
    -- Hard mode - block immediately
    RETURN QUERY SELECT false, v_effective_quota, v_overage, v_enforcement_mode, true;
  ELSIF v_enforcement_mode = 'hybrid' THEN
    -- Hybrid - allow with warnings, block after threshold
    -- TODO: Implement hybrid logic with grace period
    RETURN QUERY SELECT true, v_effective_quota, v_overage, v_enforcement_mode, false;
  ELSE
    -- Default to soft mode
    RETURN QUERY SELECT true, v_effective_quota, v_overage, 'soft', false;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;


-- ============================================================================
-- 6. Triggers
-- ============================================================================

-- Auto-update updated_at for overage_transactions
CREATE OR REPLACE FUNCTION update_overage_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_overage_timestamp
  BEFORE UPDATE ON overage_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_overage_timestamp();

-- Auto-update updated_at for api_keys
CREATE OR REPLACE FUNCTION update_api_key_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_api_key_timestamp
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_api_key_timestamp();


-- ============================================================================
-- 7. Comments
-- ============================================================================

COMMENT ON TABLE overage_transactions IS 'Phase 7: Track usage overages and billing';
COMMENT ON COLUMN overage_transactions.enforcement_mode IS 'soft=allow with billing, hard=block, hybrid=grace period then block';
COMMENT ON TABLE api_keys IS 'Phase 7.5: API key authentication with mk_ prefix';
COMMENT ON TABLE stripe_usage_sync_log IS 'Phase 7.3: Track Stripe usage record sync for reconciliation';
COMMENT ON FUNCTION get_effective_quota IS 'Calculate effective quota = base + overrides + grace period boost';
COMMENT ON FUNCTION check_quota_enforcement IS 'Determine if request should be allowed based on quota and enforcement mode';


-- ============================================================================
-- 8. Permissions
-- ============================================================================

GRANT SELECT ON overage_transactions TO authenticated;
GRANT ALL ON overage_transactions TO service_role;

GRANT SELECT, INSERT, UPDATE ON api_keys TO authenticated;
GRANT ALL ON api_keys TO service_role;

GRANT SELECT ON stripe_usage_sync_log TO authenticated;
GRANT ALL ON stripe_usage_sync_log TO service_role;

GRANT EXECUTE ON FUNCTION calculate_overage TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_effective_quota TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION record_overage TO service_role;
GRANT EXECUTE ON FUNCTION check_quota_enforcement TO authenticated, service_role;
