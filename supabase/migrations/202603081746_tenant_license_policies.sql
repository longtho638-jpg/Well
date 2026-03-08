-- Phase 6.1: Multi-tenant License Policies
-- Purpose: Define license policies per tenant with quota limits and feature access
-- Date: 2026-03-08

-- Tenant license policies table
CREATE TABLE IF NOT EXISTS tenant_license_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- License reference
  license_id UUID REFERENCES raas_licenses(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Policy identification
  policy_name TEXT NOT NULL,
  policy_version TEXT DEFAULT '1.0.0',

  -- Quota configuration
  quota_type TEXT NOT NULL DEFAULT 'monthly' CHECK (quota_type IN ('daily', 'weekly', 'monthly', 'yearly', 'lifetime')),
  quota_limit BIGINT NOT NULL DEFAULT 10000,
  quota_reset_day INTEGER DEFAULT 1, -- Day of month/week when quota resets (1-31 for monthly, 0-6 for weekly)

  -- Rate limiting
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_hour INTEGER DEFAULT 1000,
  rate_limit_per_day INTEGER DEFAULT 10000,

  -- Feature flags (JSONB for flexible feature gating)
  allowed_features JSONB DEFAULT '{}'::jsonb,
  restricted_features JSONB DEFAULT '[]'::jsonb,

  -- Overage settings
  allow_overage BOOLEAN DEFAULT false,
  overage_rate_per_unit NUMERIC(10, 6) DEFAULT 0, -- Price per extra unit
  overage_limit BIGINT, -- Hard cap on overage (NULL = unlimited)

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired', 'draft')),

  -- Validity period
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_tenant_policies_license_id ON tenant_license_policies(license_id);
CREATE INDEX idx_tenant_policies_org_id ON tenant_license_policies(org_id);
CREATE INDEX idx_tenant_policies_status ON tenant_license_policies(status);
CREATE INDEX idx_tenant_policies_valid_from ON tenant_license_policies(valid_from);
CREATE INDEX idx_tenant_policies_valid_until ON tenant_license_policies(valid_until);
CREATE INDEX idx_tenant_policies_quota_type ON tenant_license_policies(quota_type);

-- GIN index for JSONB feature queries
CREATE INDEX idx_tenant_policies_allowed_features ON tenant_license_policies USING GIN(allowed_features);

-- Composite index for common queries
CREATE INDEX idx_tenant_policies_org_status ON tenant_license_policies(org_id, status);

-- Row Level Security (RLS)
ALTER TABLE tenant_license_policies ENABLE ROW LEVEL SECURITY;

-- Users can view policies for their own organizations
CREATE POLICY "Users can view policies for their org"
  ON tenant_license_policies
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Service role has full access
CREATE POLICY "Service role full access"
  ON tenant_license_policies
  FOR ALL
  USING (true);

-- Function: Get active policy for tenant
CREATE OR REPLACE FUNCTION get_tenant_policy(p_org_id UUID)
RETURNS TABLE (
  id UUID,
  policy_name TEXT,
  quota_limit BIGINT,
  quota_type TEXT,
  rate_limit_per_minute INTEGER,
  allowed_features JSONB,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.policy_name,
    p.quota_limit,
    p.quota_type,
    p.rate_limit_per_minute,
    p.allowed_features,
    p.status
  FROM tenant_license_policies p
  WHERE p.org_id = p_org_id
    AND p.status = 'active'
    AND (p.valid_until IS NULL OR p.valid_until > NOW())
    AND p.valid_from <= NOW()
    AND p.deleted_at IS NULL
  ORDER BY p.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function: Check feature access for tenant
CREATE OR REPLACE FUNCTION check_feature_access(
  p_org_id UUID,
  p_feature_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_allowed_features JSONB;
  v_restricted_features JSONB;
BEGIN
  -- Get current policy
  SELECT allowed_features, restricted_features
  INTO v_allowed_features, v_restricted_features
  FROM tenant_license_policies
  WHERE org_id = p_org_id
    AND status = 'active'
    AND (valid_until IS NULL OR valid_until > NOW())
    AND valid_from <= NOW()
    AND deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  -- If no policy found, deny access
  IF v_allowed_features IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if feature is explicitly restricted
  IF v_restricted_features ? p_feature_name THEN
    RETURN FALSE;
  END IF;

  -- Check if feature is in allowed features
  IF v_allowed_features ? p_feature_name THEN
    RETURN (v_allowed_features->>p_feature_name)::BOOLEAN;
  END IF;

  -- Default: deny if not explicitly allowed
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function: Check if overage is allowed
CREATE OR REPLACE FUNCTION check_overage_allowed(p_org_id UUID)
RETURNS TABLE (
  allowed BOOLEAN,
  rate_per_unit NUMERIC,
  hard_limit BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.allow_overage,
    p.overage_rate_per_unit,
    p.overage_limit
  FROM tenant_license_policies p
  WHERE p.org_id = p_org_id
    AND p.status = 'active'
    AND (p.valid_until IS NULL OR p.valid_until > NOW())
    AND p.valid_from <= NOW()
    AND p.deleted_at IS NULL
  ORDER BY p.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function: Update policy (with audit)
CREATE OR REPLACE FUNCTION update_tenant_policy(
  p_policy_id UUID,
  p_quota_limit BIGINT DEFAULT NULL,
  p_rate_limit_per_minute INTEGER DEFAULT NULL,
  p_allowed_features JSONB DEFAULT NULL,
  p_updated_by UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE tenant_license_policies
  SET
    quota_limit = COALESCE(p_quota_limit, quota_limit),
    rate_limit_per_minute = COALESCE(p_rate_limit_per_minute, rate_limit_per_minute),
    allowed_features = COALESCE(p_allowed_features, allowed_features),
    updated_at = NOW()
  WHERE id = p_policy_id
    AND deleted_at IS NULL;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_tenant_policy_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_tenant_policy_timestamp
  BEFORE UPDATE ON tenant_license_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_policy_timestamp();

-- Comments
COMMENT ON TABLE tenant_license_policies IS 'Phase 6.1: License policies per tenant with quotas, rate limits, and feature gating';
COMMENT ON COLUMN tenant_license_policies.quota_type IS 'Quota reset period: daily, weekly, monthly, yearly, lifetime';
COMMENT ON COLUMN tenant_license_policies.allowed_features IS 'JSONB map of feature flags: {"ai_agents": true, "advanced_analytics": true}';
COMMENT ON COLUMN tenant_license_policies.restricted_features IS 'Array of explicitly blocked features';
COMMENT ON COLUMN tenant_license_policies.overage_rate_per_unit IS 'Price charged per unit when over quota';
COMMENT ON FUNCTION get_tenant_policy IS 'Get active license policy for a tenant organization';
COMMENT ON FUNCTION check_feature_access IS 'Check if tenant has access to specific feature';
COMMENT ON FUNCTION check_overage_allowed IS 'Get overage settings for tenant';

-- Grant permissions
GRANT SELECT ON tenant_license_policies TO authenticated;
GRANT ALL ON tenant_license_policies TO service_role;
