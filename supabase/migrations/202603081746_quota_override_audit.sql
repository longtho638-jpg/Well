-- Phase 6.1: Quota Override Audit Log
-- Purpose: Track all quota limit overrides and manual adjustments with full audit trail
-- Date: 2026-03-08

-- Quota override audit log table
CREATE TABLE IF NOT EXISTS quota_override_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference IDs
  override_id TEXT UNIQUE NOT NULL, -- Human-readable override ID (e.g., "OVR-20260308-001")
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  policy_id UUID REFERENCES tenant_license_policies(id) ON DELETE SET NULL,

  -- Override details
  override_type TEXT NOT NULL CHECK (override_type IN (
    'quota_increase',
    'quota_decrease',
    'rate_limit_increase',
    'rate_limit_decrease',
    'feature_enable',
    'feature_disable',
    'overage_enable',
    'overage_disable',
    'temporary_boost',
    'emergency_override'
  )),

  -- Before/after values
  previous_value JSONB NOT NULL, -- {quota_limit: 10000, rate_limit: 100}
  new_value JSONB NOT NULL,      -- {quota_limit: 50000, rate_limit: 500}

  -- Justification
  reason TEXT NOT NULL,
  justification TEXT, -- Detailed business justification
  ticket_reference TEXT, -- Support ticket or JIRA ticket ID

  -- Approval workflow
  approval_required BOOLEAN DEFAULT true,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'auto_approved')),

  -- Duration (for temporary overrides)
  is_temporary BOOLEAN DEFAULT false,
  temporary_until TIMESTAMPTZ,
  auto_revert_at TIMESTAMPTZ,

  -- Execution
  executed_by UUID REFERENCES auth.users(id),
  executed_at TIMESTAMPTZ,
  reverted_at TIMESTAMPTZ,
  revert_reason TEXT,

  -- Risk assessment
  risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  impact_assessment JSONB,

  -- Notification
  notify_user BOOLEAN DEFAULT true,
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_quota_override_org_id ON quota_override_audit(org_id);
CREATE INDEX idx_quota_override_user_id ON quota_override_audit(user_id);
CREATE INDEX idx_quota_override_policy_id ON quota_override_audit(policy_id);
CREATE INDEX idx_quota_override_type ON quota_override_audit(override_type);
CREATE INDEX idx_quota_override_status ON quota_override_audit(approval_status);
CREATE INDEX idx_quota_override_created_at ON quota_override_audit(created_at DESC);
CREATE INDEX idx_quota_override_temporary_until ON quota_override_audit(temporary_until);
CREATE INDEX idx_quota_override_risk_level ON quota_override_audit(risk_level);

-- Composite index for common queries
CREATE INDEX idx_quota_override_org_status ON quota_override_audit(org_id, approval_status);
CREATE INDEX idx_quota_override_pending_approval ON quota_override_audit(approval_status) WHERE approval_status = 'pending';

-- Row Level Security (RLS)
ALTER TABLE quota_override_audit ENABLE ROW LEVEL SECURITY;

-- Users can view overrides for their own organizations
CREATE POLICY "Users can view org overrides"
  ON quota_override_audit
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Users can create override requests for their orgs
CREATE POLICY "Users can create override requests"
  ON quota_override_audit
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Service role has full access
CREATE POLICY "Service role full access"
  ON quota_override_audit
  FOR ALL
  USING (true);

-- Function: Generate override ID
CREATE OR REPLACE FUNCTION generate_override_id()
RETURNS TEXT AS $$
DECLARE
  v_date TEXT;
  v_seq INTEGER;
BEGIN
  v_date := TO_CHAR(NOW(), 'YYYYMMDD');

  -- Get next sequence number for today
  SELECT COALESCE(MAX(CAST(SUBSTRING(override_id FROM 13) AS INTEGER)), 0) + 1
  INTO v_seq
  FROM quota_override_audit
  WHERE override_id LIKE 'OVR-' || v_date || '-%';

  RETURN 'OVR-' || v_date || '-' || LPAD(v_seq::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Create override request
CREATE OR REPLACE FUNCTION create_override_request(
  p_org_id UUID,
  p_override_type TEXT,
  p_previous_value JSONB,
  p_new_value JSONB,
  p_reason TEXT,
  p_justification TEXT DEFAULT NULL,
  p_ticket_reference TEXT DEFAULT NULL,
  p_is_temporary BOOLEAN DEFAULT false,
  p_temporary_until TIMESTAMPTZ DEFAULT NULL,
  p_risk_level TEXT DEFAULT 'medium',
  p_requester_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  id UUID,
  override_id TEXT,
  approval_status TEXT
) AS $$
DECLARE
  v_override_id TEXT;
  v_id UUID;
BEGIN
  -- Generate override ID
  v_override_id := generate_override_id();

  -- Insert override request
  INSERT INTO quota_override_audit (
    override_id,
    org_id,
    user_id,
    override_type,
    previous_value,
    new_value,
    reason,
    justification,
    ticket_reference,
    is_temporary,
    temporary_until,
    risk_level,
    approval_status
  ) VALUES (
    v_override_id,
    p_org_id,
    p_requester_id,
    p_override_type,
    p_previous_value,
    p_new_value,
    p_reason,
    p_justification,
    p_ticket_reference,
    p_is_temporary,
    p_temporary_until,
    p_risk_level,
    'pending'
  )
  RETURNING id, override_id, approval_status INTO v_id, v_override_id, approval_status;

  -- Auto-approve low-risk overrides
  IF p_risk_level = 'low' THEN
    UPDATE quota_override_audit
    SET
      approval_status = 'auto_approved',
      approved_by = p_requester_id,
      approved_at = NOW()
    WHERE id = v_id;
  END IF;

  RETURN QUERY SELECT v_id, v_override_id, approval_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Approve override
CREATE OR REPLACE FUNCTION approve_override(
  p_override_id UUID,
  p_approver_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
  v_temporary_until TIMESTAMPTZ;
BEGIN
  UPDATE quota_override_audit
  SET
    approval_status = 'approved',
    approved_by = p_approver_id,
    approved_at = NOW(),
    temporary_until = COALESCE(temporary_until, temporary_until),
    auto_revert_at = CASE
      WHEN is_temporary AND temporary_until IS NOT NULL THEN temporary_until
      ELSE NULL
    END
  WHERE id = p_override_id
    AND approval_status = 'pending'
  RETURNING temporary_until INTO v_temporary_until;

  -- Execute the override if approved
  IF FOUND THEN
    PERFORM execute_override(p_override_id);
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Reject override
CREATE OR REPLACE FUNCTION reject_override(
  p_override_id UUID,
  p_rejection_reason TEXT,
  p_rejector_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE quota_override_audit
  SET
    approval_status = 'rejected',
    approved_by = p_rejector_id,
    approved_at = NOW(),
    metadata = jsonb_set(metadata, '{rejection_reason}', to_jsonb(p_rejection_reason))
  WHERE id = p_override_id
    AND approval_status = 'pending';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Execute override (apply changes to policy)
CREATE OR REPLACE FUNCTION execute_override(p_override_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_override RECORD;
  v_new_quota BIGINT;
  v_new_rate_limit INTEGER;
BEGIN
  -- Get override details
  SELECT * INTO v_override
  FROM quota_override_audit
  WHERE id = p_override_id
    AND approval_status IN ('approved', 'auto_approved')
    AND executed_at IS NULL;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Extract new values
  v_new_quota := (v_override.new_value->>'quota_limit')::BIGINT;
  v_new_rate_limit := (v_override.new_value->>'rate_limit_per_minute')::INTEGER;

  -- Update policy if policy_id is set
  IF v_override.policy_id IS NOT NULL THEN
    UPDATE tenant_license_policies
    SET
      quota_limit = COALESCE(v_new_quota, quota_limit),
      rate_limit_per_minute = COALESCE(v_new_rate_limit, rate_limit_per_minute),
      updated_at = NOW()
    WHERE id = v_override.policy_id;
  END IF;

  -- Mark override as executed
  UPDATE quota_override_audit
  SET
    executed_by = v_override.user_id,
    executed_at = NOW()
  WHERE id = p_override_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Revert temporary override
CREATE OR REPLACE FUNCTION revert_override(
  p_override_id UUID,
  p_revert_reason TEXT DEFAULT 'Temporary override expired'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_override RECORD;
BEGIN
  -- Get override details
  SELECT * INTO v_override
  FROM quota_override_audit
  WHERE id = p_override_id
    AND is_temporary = true
    AND reverted_at IS NULL;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Restore previous values to policy
  IF v_override.policy_id IS NOT NULL THEN
    UPDATE tenant_license_policies
    SET
      quota_limit = (v_override.previous_value->>'quota_limit')::BIGINT,
      rate_limit_per_minute = (v_override.previous_value->>'rate_limit_per_minute')::INTEGER,
      updated_at = NOW()
    WHERE id = v_override.policy_id;
  END IF;

  -- Mark as reverted
  UPDATE quota_override_audit
  SET
    reverted_at = NOW(),
    revert_reason = p_revert_reason
  WHERE id = p_override_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get pending overrides for org
CREATE OR REPLACE FUNCTION get_pending_overrides(p_org_id UUID)
RETURNS SETOF quota_override_audit AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM quota_override_audit
  WHERE org_id = p_org_id
    AND approval_status = 'pending'
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Trigger: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_quota_override_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_quota_override_timestamp
  BEFORE UPDATE ON quota_override_audit
  FOR EACH ROW
  EXECUTE FUNCTION update_quota_override_timestamp();

-- Comments
COMMENT ON TABLE quota_override_audit IS 'Phase 6.1: Audit log for all quota limit overrides and manual adjustments';
COMMENT ON COLUMN quota_override_audit.override_type IS 'Type of override: quota_increase, rate_limit_increase, feature_enable, etc.';
COMMENT ON COLUMN quota_override_audit.previous_value IS 'JSONB of values before override: {quota_limit: 10000}';
COMMENT ON COLUMN quota_override_audit.new_value IS 'JSONB of values after override: {quota_limit: 50000}';
COMMENT ON COLUMN quota_override_audit.approval_status IS 'Workflow status: pending, approved, rejected, auto_approved';
COMMENT ON COLUMN quota_override_audit.is_temporary IS 'If true, override auto-reverts at temporary_until';
COMMENT ON COLUMN quota_override_audit.risk_level IS 'Risk assessment: low, medium, high, critical';
COMMENT ON FUNCTION generate_override_id IS 'Generate human-readable override ID (OVR-YYYYMMDD-NNN)';
COMMENT ON FUNCTION create_override_request IS 'Create new override request with auto-approval for low-risk';
COMMENT ON FUNCTION approve_override IS 'Approve pending override and execute changes';
COMMENT ON FUNCTION execute_override IS 'Apply approved override changes to policy';
COMMENT ON FUNCTION revert_override IS 'Revert temporary override to previous values';

-- Grant permissions
GRANT SELECT ON quota_override_audit TO authenticated;
GRANT ALL ON quota_override_audit TO service_role;
