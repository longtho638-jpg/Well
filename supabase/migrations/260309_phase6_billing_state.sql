-- Phase 6: Real-time Billing State (KV abstraction)
-- This table acts as a key-value store for real-time quota tracking
-- Used by Polar webhook handlers and CF Worker middleware

CREATE TABLE IF NOT EXISTS billing_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  metric_type TEXT NOT NULL,
  current_usage BIGINT NOT NULL DEFAULT 0,
  quota_limit BIGINT NOT NULL DEFAULT 0,
  percentage_used INTEGER NOT NULL DEFAULT 0,
  is_exhausted BOOLEAN NOT NULL DEFAULT false,
  last_sync TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, metric_type)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_billing_state_org ON billing_state(org_id, metric_type);
CREATE INDEX IF NOT EXISTS idx_billing_state_exhausted ON billing_state(is_exhausted) WHERE is_exhausted = true;
CREATE INDEX IF NOT EXISTS idx_billing_state_percentage ON billing_state(percentage_used) WHERE percentage_used >= 80;

-- Enable RLS
ALTER TABLE billing_state ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "service_role_billing_state"
  ON billing_state FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Users can view their org's billing state
CREATE POLICY "users_view_billing_state"
  ON billing_state FOR SELECT
  USING (
    org_id IN (
      SELECT DISTINCT org_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Comment
COMMENT ON TABLE billing_state IS 'Phase 6: Real-time quota tracking (KV abstraction) for overage billing enforcement';
COMMENT ON COLUMN billing_state.is_exhausted IS 'True when current_usage >= quota_limit (100% or over)';
COMMENT ON COLUMN billing_state.percentage_used IS 'Integer percentage 0-100+ (can exceed 100 for overage)';
