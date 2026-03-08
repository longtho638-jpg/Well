-- Phase 6.7: Grace Period Schema
-- Creates tenant_grace_periods table for managing grace periods

-- Create tenant_grace_periods table
CREATE TABLE IF NOT EXISTS tenant_grace_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Grace period details
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  expired_at TIMESTAMPTZ,

  -- Configuration
  max_overrides INTEGER NOT NULL DEFAULT 3,
  limited_quotas JSONB NOT NULL DEFAULT '{
    "api_calls": 5000,
    "tokens": 250000,
    "compute_minutes": 50,
    "model_inferences": 500,
    "agent_executions": 100
  }'::jsonb,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated')),

  -- Audit
  activated_by UUID REFERENCES auth.users(id),
  expired_by UUID REFERENCES auth.users(id),
  terminated_by UUID REFERENCES auth.users(id),
  termination_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenant_grace_periods_tenant_id ON tenant_grace_periods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_grace_periods_status ON tenant_grace_periods(status);
CREATE INDEX IF NOT EXISTS idx_tenant_grace_periods_expires_at ON tenant_grace_periods(expires_at);
CREATE INDEX IF NOT EXISTS idx_tenant_grace_periods_active ON tenant_grace_periods(tenant_id, status) WHERE status = 'active';

-- RLS policies
ALTER TABLE tenant_grace_periods ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access
CREATE POLICY "Service role has full access"
  ON tenant_grace_periods
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to view their tenant's grace periods
CREATE POLICY "Users can view own tenant grace periods"
  ON tenant_grace_periods
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = tenant_grace_periods.tenant_id
      AND tenants.customer_id = auth.uid()
    )
  );

-- Policy: Allow admins to activate grace periods
CREATE POLICY "Admins can activate grace periods"
  ON tenant_grace_periods
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  );

-- Policy: Allow admins to update grace periods
CREATE POLICY "Admins can update grace periods"
  ON tenant_grace_periods
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  );

-- Trigger to auto-expire grace periods
CREATE OR REPLACE FUNCTION expire_grace_period()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at < NOW() AND NEW.status = 'active' THEN
    NEW.status := 'expired';
    NEW.expired_at := NOW();
    NEW.updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_expire_grace_period
  BEFORE UPDATE ON tenant_grace_periods
  FOR EACH ROW
  EXECUTE FUNCTION expire_grace_period();

-- Comment
COMMENT ON TABLE tenant_grace_periods IS 'Phase 6.7: Grace periods for tenants with expired licenses';
COMMENT ON COLUMN tenant_grace_periods.limited_quotas IS 'Reduced quota limits during grace period';
