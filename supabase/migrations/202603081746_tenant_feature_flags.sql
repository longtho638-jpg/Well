-- Phase 6.1: Tenant Feature Flags
-- Purpose: Granular feature flag management per tenant with targeting and rollout controls
-- Date: 2026-03-08

-- Tenant feature flags table
CREATE TABLE IF NOT EXISTS tenant_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Flag identification
  flag_key TEXT NOT NULL, -- e.g., "ai_agents", "advanced_analytics", "api_access"
  flag_name TEXT NOT NULL,
  flag_description TEXT,

  -- Tenant scoping
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  license_id UUID REFERENCES raas_licenses(id) ON DELETE SET NULL,

  -- Flag configuration
  enabled BOOLEAN DEFAULT false,
  flag_type TEXT DEFAULT 'boolean' CHECK (flag_type IN ('boolean', 'percentage', 'variant', 'json')),

  -- Value configuration
  boolean_value BOOLEAN DEFAULT false,
  percentage_value INTEGER DEFAULT 0 CHECK (percentage_value >= 0 AND percentage_value <= 100), -- For percentage rollouts
  variant_value TEXT, -- For A/B testing variants
  json_value JSONB, -- For complex flag configurations

  -- Targeting rules
  targeting_rules JSONB DEFAULT '[]'::jsonb, -- Array of targeting conditions
  user_segments TEXT[] DEFAULT '{}', -- User segment IDs for targeting

  -- Rollout configuration
  rollout_strategy TEXT DEFAULT 'immediate' CHECK (rollout_strategy IN ('immediate', 'gradual', 'scheduled', 'canary')),
  rollout_start TIMESTAMPTZ,
  rollout_end TIMESTAMPTZ,
  canary_percentage INTEGER DEFAULT 0, -- For canary rollouts

  -- Environment scoping
  environments TEXT[] DEFAULT '{"production", "staging", "development"}',

  -- Dependencies
  depends_on_flags TEXT[] DEFAULT '{}', -- Other flag keys that must be enabled first
  conflicts_with_flags TEXT[] DEFAULT '{}', -- Flags that cannot be enabled together

  -- Analytics
  evaluation_count BIGINT DEFAULT 0,
  last_evaluated_at TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_tenant_flags_org_id ON tenant_feature_flags(org_id);
CREATE INDEX idx_tenant_flags_license_id ON tenant_feature_flags(license_id);
CREATE INDEX idx_tenant_flags_flag_key ON tenant_feature_flags(flag_key);
CREATE INDEX idx_tenant_flags_status ON tenant_feature_flags(status);
CREATE INDEX idx_tenant_flags_enabled ON tenant_feature_flags(enabled);
CREATE INDEX idx_tenant_flags_environments ON tenant_feature_flags USING GIN(environments);
CREATE INDEX idx_tenant_flags_user_segments ON tenant_feature_flags USING GIN(user_segments);

-- Unique constraint per org and flag key
CREATE UNIQUE INDEX idx_tenant_flags_unique_key ON tenant_feature_flags(org_id, flag_key) WHERE deleted_at IS NULL;

-- Row Level Security (RLS)
ALTER TABLE tenant_feature_flags ENABLE ROW LEVEL SECURITY;

-- Users can view flags for their own organizations
CREATE POLICY "Users can view org flags"
  ON tenant_feature_flags
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Service role has full access
CREATE POLICY "Service role full access"
  ON tenant_feature_flags
  FOR ALL
  USING (true);

-- Function: Check if feature is enabled for tenant
CREATE OR REPLACE FUNCTION is_feature_enabled(
  p_org_id UUID,
  p_flag_key TEXT,
  p_user_id UUID DEFAULT auth.uid(),
  p_environment TEXT DEFAULT 'production'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_flag RECORD;
  v_enabled BOOLEAN := false;
BEGIN
  -- Get flag configuration
  SELECT * INTO v_flag
  FROM tenant_feature_flags
  WHERE org_id = p_org_id
    AND flag_key = p_flag_key
    AND status = 'active'
    AND enabled = true
    AND p_environment = ANY(environments)
    AND deleted_at IS NULL
  LIMIT 1;

  -- Flag not found or disabled
  IF v_flag IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check dependencies
  IF array_length(v_flag.depends_on_flags, 1) > 0 THEN
    FOR dep_key IN SELECT unnest(v_flag.depends_on_flags)
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM tenant_feature_flags
        WHERE org_id = p_org_id
          AND flag_key = dep_key
          AND enabled = true
          AND deleted_at IS NULL
      ) THEN
        RETURN FALSE;
      END IF;
    END LOOP;
  END IF;

  -- Check conflicts
  IF array_length(v_flag.conflicts_with_flags, 1) > 0 THEN
    IF EXISTS (
      SELECT 1 FROM tenant_feature_flags
      WHERE org_id = p_org_id
        AND flag_key = ANY(v_flag.conflicts_with_flags)
        AND enabled = true
        AND deleted_at IS NULL
    ) THEN
      RETURN FALSE;
    END IF;
  END IF;

  -- Evaluate based on flag type
  CASE v_flag.flag_type
    WHEN 'boolean' THEN
      v_enabled := v_flag.boolean_value;

    WHEN 'percentage' THEN
      -- Use user_id hash for consistent percentage rollout
      IF p_user_id IS NOT NULL THEN
        v_enabled := (
          ('x' || md5(p_flag_key || ':' || p_user_id::TEXT))::bit(32)::bigint % 100
        ) < v_flag.percentage_value;
      ELSE
        v_enabled := (RANDOM() * 100) < v_flag.percentage_value;
      END IF;

    WHEN 'variant' THEN
      v_enabled := v_flag.variant_value IS NOT NULL;

    WHEN 'json' THEN
      v_enabled := v_flag.json_value IS NOT NULL;
  END CASE;

  -- Update evaluation stats
  UPDATE tenant_feature_flags
  SET
    evaluation_count = evaluation_count + 1,
    last_evaluated_at = NOW()
  WHERE id = v_flag.id;

  RETURN v_enabled;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get flag value for tenant
CREATE OR REPLACE FUNCTION get_flag_value(
  p_org_id UUID,
  p_flag_key TEXT,
  p_user_id UUID DEFAULT auth.uid(),
  p_environment TEXT DEFAULT 'production'
)
RETURNS JSONB AS $$
DECLARE
  v_flag RECORD;
  v_result JSONB;
BEGIN
  -- Get flag configuration
  SELECT * INTO v_flag
  FROM tenant_feature_flags
  WHERE org_id = p_org_id
    AND flag_key = p_flag_key
    AND status = 'active'
    AND enabled = true
    AND p_environment = ANY(environments)
    AND deleted_at IS NULL
  LIMIT 1;

  -- Flag not found
  IF v_flag IS NULL THEN
    RETURN NULL;
  END IF;

  -- Build result based on flag type
  CASE v_flag.flag_type
    WHEN 'boolean' THEN
      v_result := jsonb_build_object('enabled', v_flag.boolean_value, 'value', v_flag.boolean_value);

    WHEN 'percentage' THEN
      v_result := jsonb_build_object(
        'enabled', true,
        'percentage', v_flag.percentage_value,
        'rollout_strategy', v_flag.rollout_strategy
      );

    WHEN 'variant' THEN
      v_result := jsonb_build_object('enabled', true, 'variant', v_flag.variant_value);

    WHEN 'json' THEN
      v_result := v_flag.json_value;

    ELSE
      v_result := jsonb_build_object('enabled', false);
  END CASE;

  -- Add metadata
  v_result := jsonb_set(v_result, '{flag_key}', to_jsonb(p_flag_key));
  v_result := jsonb_set(v_result, '{environment}', to_jsonb(p_environment));

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function: Create or update feature flag
CREATE OR REPLACE FUNCTION upsert_feature_flag(
  p_org_id UUID,
  p_flag_key TEXT,
  p_flag_name TEXT,
  p_enabled BOOLEAN DEFAULT false,
  p_flag_type TEXT DEFAULT 'boolean',
  p_boolean_value BOOLEAN DEFAULT false,
  p_percentage_value INTEGER DEFAULT 0,
  p_variant_value TEXT DEFAULT NULL,
  p_json_value JSONB DEFAULT NULL,
  p_rollout_strategy TEXT DEFAULT 'immediate',
  p_environments TEXT[] DEFAULT '{"production", "staging", "development"}',
  p_updated_by UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  id UUID,
  flag_key TEXT,
  enabled BOOLEAN,
  status TEXT
) AS $$
DECLARE
  v_id UUID;
  v_status TEXT := 'active';
BEGIN
  -- Check if flag exists
  SELECT id INTO v_id
  FROM tenant_feature_flags
  WHERE org_id = p_org_id
    AND flag_key = p_flag_key
    AND deleted_at IS NULL;

  IF v_id IS NOT NULL THEN
    -- Update existing flag
    UPDATE tenant_feature_flags
    SET
      flag_name = p_flag_name,
      enabled = p_enabled,
      flag_type = p_flag_type,
      boolean_value = p_boolean_value,
      percentage_value = p_percentage_value,
      variant_value = p_variant_value,
      json_value = p_json_value,
      rollout_strategy = p_rollout_strategy,
      environments = p_environments,
      updated_by = p_updated_by,
      updated_at = NOW(),
      status = p_status
    WHERE id = v_id
    RETURNING id, flag_key, enabled, status INTO id, flag_key, enabled, status;
  ELSE
    -- Create new flag
    INSERT INTO tenant_feature_flags (
      org_id, flag_key, flag_name, enabled, flag_type,
      boolean_value, percentage_value, variant_value, json_value,
      rollout_strategy, environments, created_by, status
    ) VALUES (
      p_org_id, p_flag_key, p_flag_name, p_enabled, p_flag_type,
      p_boolean_value, p_percentage_value, p_variant_value, p_json_value,
      p_rollout_strategy, p_environments, p_updated_by, v_status
    )
    RETURNING id, flag_key, enabled, status INTO id, flag_key, enabled, status;
  END IF;

  RETURN QUERY SELECT id, flag_key, enabled, status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Enable feature flag
CREATE OR REPLACE FUNCTION enable_feature_flag(
  p_org_id UUID,
  p_flag_key TEXT,
  p_updated_by UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE tenant_feature_flags
  SET
    enabled = true,
    status = 'active',
    updated_by = p_updated_by,
    updated_at = NOW()
  WHERE org_id = p_org_id
    AND flag_key = p_flag_key
    AND deleted_at IS NULL;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Disable feature flag
CREATE OR REPLACE FUNCTION disable_feature_flag(
  p_org_id UUID,
  p_flag_key TEXT,
  p_updated_by UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE tenant_feature_flags
  SET
    enabled = false,
    status = 'paused',
    updated_by = p_updated_by,
    updated_at = NOW()
  WHERE org_id = p_org_id
    AND flag_key = p_flag_key
    AND deleted_at IS NULL;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get all flags for tenant
CREATE OR REPLACE FUNCTION get_tenant_flags(p_org_id UUID, p_environment TEXT DEFAULT 'production')
RETURNS TABLE (
  flag_key TEXT,
  flag_name TEXT,
  enabled BOOLEAN,
  flag_type TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.flag_key,
    f.flag_name,
    f.enabled,
    f.flag_type,
    f.status
  FROM tenant_feature_flags f
  WHERE f.org_id = p_org_id
    AND p_environment = ANY(f.environments)
    AND f.deleted_at IS NULL
  ORDER BY f.flag_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Trigger: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_tenant_flag_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_tenant_flag_timestamp
  BEFORE UPDATE ON tenant_feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_flag_timestamp();

-- Comments
COMMENT ON TABLE tenant_feature_flags IS 'Phase 6.1: Granular feature flag management per tenant with targeting and rollout controls';
COMMENT ON COLUMN tenant_feature_flags.flag_key IS 'Unique identifier for the flag (e.g., "ai_agents", "advanced_analytics")';
COMMENT ON COLUMN tenant_feature_flags.flag_type IS 'Type: boolean, percentage, variant, json';
COMMENT ON COLUMN tenant_feature_flags.targeting_rules IS 'JSONB array of targeting conditions for gradual rollouts';
COMMENT ON COLUMN tenant_feature_flags.rollout_strategy IS 'Strategy: immediate, gradual, scheduled, canary';
COMMENT ON COLUMN tenant_feature_flags.depends_on_flags IS 'Flags that must be enabled before this flag';
COMMENT ON COLUMN tenant_feature_flags.conflicts_with_flags IS 'Flags that cannot be enabled simultaneously';
COMMENT ON FUNCTION is_feature_enabled IS 'Check if a feature flag is enabled for a tenant (with dependency checking)';
COMMENT ON FUNCTION get_flag_value IS 'Get full flag value including metadata';
COMMENT ON FUNCTION upsert_feature_flag IS 'Create or update a feature flag';
COMMENT ON FUNCTION get_tenant_flags IS 'Get all active flags for a tenant';

-- Grant permissions
GRANT SELECT ON tenant_feature_flags TO authenticated;
GRANT ALL ON tenant_feature_flags TO service_role;
