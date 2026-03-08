-- Phase 6.8: License Compliance Enforcement Schema
-- Purpose: Track license compliance checks and auto-suspension events
-- Date: 2026-03-08

-- License compliance audit log
CREATE TABLE IF NOT EXISTS license_compliance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,

  -- License identification
  license_id UUID REFERENCES raas_licenses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Compliance check details
  check_type TEXT NOT NULL CHECK (check_type IN ('usage_threshold', 'periodic', 'manual', 'api_call')),
  trigger_reason TEXT, -- 'usage_90_percent', 'usage_100_percent', 'scheduled_check', etc.

  -- RaaS Gateway validation
  raas_gateway_response JSONB,
  license_status TEXT, -- 'active', 'expired', 'revoked', 'invalid'
  license_tier TEXT, -- 'basic', 'premium', 'enterprise', 'master'

  -- Usage context
  current_usage BIGINT,
  quota_limit BIGINT,
  usage_percentage INTEGER,

  -- Enforcement action
  enforcement_action TEXT CHECK (enforcement_action IN ('none', 'warning', 'suspend', 'revoke')),
  enforcement_status TEXT DEFAULT 'pending' CHECK (enforcement_status IN ('pending', 'executed', 'failed', 'overridden')),

  -- Agency/org status changes
  previous_org_status TEXT,
  new_org_status TEXT,

  -- API Key tracking (if mk_ key was used)
  api_key_prefix TEXT, -- e.g., 'mk_live', 'mk_test'
  api_key_id TEXT,

  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_compliance_logs_user_id ON license_compliance_logs(user_id);
CREATE INDEX idx_compliance_logs_org_id ON license_compliance_logs(org_id);
CREATE INDEX idx_compliance_logs_license_id ON license_compliance_logs(license_id);
CREATE INDEX idx_compliance_logs_check_type ON license_compliance_logs(check_type);
CREATE INDEX idx_compliance_logs_created_at ON license_compliance_logs(created_at DESC);
CREATE INDEX idx_compliance_logs_enforcement ON license_compliance_logs(enforcement_status);

-- Row Level Security (RLS)
ALTER TABLE license_compliance_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own compliance logs
CREATE POLICY "Users can view own compliance logs"
  ON license_compliance_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service role full access"
  ON license_compliance_logs
  FOR ALL
  USING (true);

-- Add compliance_status column to organizations if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'compliance_status'
  ) THEN
    ALTER TABLE organizations ADD COLUMN compliance_status TEXT DEFAULT 'compliant'
      CHECK (compliance_status IN ('compliant', 'warning', 'suspended', 'revoked'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'compliance_checked_at'
  ) THEN
    ALTER TABLE organizations ADD COLUMN compliance_checked_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'suspended_at'
  ) THEN
    ALTER TABLE organizations ADD COLUMN suspended_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'suspension_reason'
  ) THEN
    ALTER TABLE organizations ADD COLUMN suspension_reason TEXT;
  END IF;
END $$;

-- Index for compliance status checks
CREATE INDEX IF NOT EXISTS idx_org_compliance_status ON organizations(compliance_status);

-- Function: Check if compliance check is needed (idempotency)
CREATE OR REPLACE FUNCTION check_compliance_idempotency(
  p_user_id UUID,
  p_check_type TEXT,
  p_hours_lookback INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM license_compliance_logs
    WHERE user_id = p_user_id
    AND check_type = p_check_type
    AND created_at > NOW() - (p_hours_lookback || ' hours')::INTERVAL
    AND enforcement_status IN ('pending', 'executed')
  ) INTO v_exists;

  RETURN NOT v_exists; -- Return true if check can proceed
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Auto-suspend organization
CREATE OR REPLACE FUNCTION suspend_organization(
  p_org_id UUID,
  p_reason TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_previous_status TEXT;
BEGIN
  -- Get current status
  SELECT compliance_status INTO v_previous_status
  FROM organizations WHERE id = p_org_id;

  -- Update organization status
  UPDATE organizations
  SET
    compliance_status = 'suspended',
    suspended_at = NOW(),
    suspension_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_org_id;

  -- Log the suspension
  INSERT INTO license_compliance_logs (
    event_id, check_type, trigger_reason, org_id, user_id,
    enforcement_action, enforcement_status,
    previous_org_status, new_org_status,
    metadata
  ) VALUES (
    'suspend_' || p_org_id || '_' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'manual',
    p_reason,
    p_org_id,
    p_user_id,
    'suspend',
    'executed',
    v_previous_status,
    'suspended',
    '{"auto_suspended": true}'::jsonb
  );

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Reactivate organization (after license renewal)
CREATE OR REPLACE FUNCTION reactivate_organization(
  p_org_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE organizations
  SET
    compliance_status = 'compliant',
    suspended_at = NULL,
    suspension_reason = NULL,
    updated_at = NOW()
  WHERE id = p_org_id;

  -- Log the reactivation
  INSERT INTO license_compliance_logs (
    event_id, check_type, trigger_reason, org_id, user_id,
    enforcement_action, enforcement_status,
    previous_org_status, new_org_status
  ) VALUES (
    'reactivate_' || p_org_id || '_' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'manual',
    'license_renewed',
    p_org_id,
    p_user_id,
    'none',
    'executed',
    'suspended',
    'compliant'
  );

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cron job: Daily compliance check (optional - configure via Supabase Dashboard)
-- SELECT cron.schedule(
--   'daily-compliance-check',
--   '0 3 * * *', -- 3 AM UTC daily
--   $$SELECT check_and_enforce_compliance()$$
-- );

-- Grant permissions
GRANT SELECT ON license_compliance_logs TO authenticated;
GRANT ALL ON license_compliance_logs TO service_role;
GRANT UPDATE ON organizations TO service_role;

-- Comments
COMMENT ON TABLE license_compliance_logs IS 'Phase 6.8: Audit log for license compliance checks and enforcement actions';
COMMENT ON COLUMN license_compliance_logs.check_type IS 'Trigger type: usage_threshold, periodic, manual, api_call';
COMMENT ON COLUMN license_compliance_logs.enforcement_action IS 'Action taken: none, warning, suspend, revoke';
COMMENT ON COLUMN organizations.compliance_status IS 'Compliance status: compliant, warning, suspended, revoked';
COMMENT ON FUNCTION check_compliance_idempotency IS 'Prevent duplicate compliance checks within time window';
COMMENT ON FUNCTION suspend_organization IS 'Auto-suspend organization for license violations';
COMMENT ON FUNCTION reactivate_organization IS 'Reactivate organization after license renewal';
