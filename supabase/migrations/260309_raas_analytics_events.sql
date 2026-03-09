-- ============================================================================
-- RaaS Analytics Events Table
-- Phase 6.4: Analytics Event Emission
-- ============================================================================

-- Create analytics events table for tracking suspension and license events
CREATE TABLE IF NOT EXISTS raas_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  org_id TEXT NOT NULL,
  user_id UUID,

  -- Common fields
  timestamp TIMESTAMPTZ NOT NULL,
  request_id TEXT,
  path TEXT,
  ip_address INET,

  -- Suspension event fields
  reason TEXT,
  subscription_status TEXT,
  days_past_due INTEGER,
  amount_owed NUMERIC,
  dunning_stage TEXT,
  grace_period_hours NUMERIC,

  -- License event fields
  license_key TEXT,
  tier TEXT,
  valid BOOLEAN,
  source TEXT,
  response_time_ms INTEGER,
  cached BOOLEAN,

  -- Warning event fields
  warning_type TEXT,
  days_remaining INTEGER,
  quota_percentage INTEGER,

  -- Admin bypass fields
  admin_id TEXT,
  target_org_id TEXT,

  -- Metadata (JSONB for flexible schema)
  metadata JSONB,

  -- Auto fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for org-based queries (most common filter)
CREATE INDEX IF NOT EXISTS idx_raas_analytics_org_id
  ON raas_analytics_events(org_id, timestamp DESC);

-- Index for event type filtering
CREATE INDEX IF NOT EXISTS idx_raas_analytics_event_type
  ON raas_analytics_events(event_type, timestamp DESC);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_raas_analytics_timestamp
  ON raas_analytics_events(timestamp DESC);

-- Index for request tracing
CREATE INDEX IF NOT EXISTS idx_raas_analytics_request_id
  ON raas_analytics_events(request_id)
  WHERE request_id IS NOT NULL;

-- Composite index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_raas_analytics_org_event_time
  ON raas_analytics_events(org_id, event_type, timestamp DESC);

-- GIN index for metadata JSONB queries
CREATE INDEX IF NOT EXISTS idx_raas_analytics_metadata
  ON raas_analytics_events USING GIN (metadata);

-- ============================================================================
-- VIEWS FOR DASHBOARD
-- ============================================================================

-- Summary view for suspension analytics
CREATE OR REPLACE VIEW raas_analytics_suspension_summary AS
SELECT
  org_id,
  DATE_TRUNC('day', timestamp) as event_day,
  COUNT(*) FILTER (WHERE event_type = 'suspension_created') as suspensions_count,
  COUNT(*) FILTER (WHERE event_type = 'suspension_cleared') as cleared_count,
  COUNT(*) FILTER (WHERE event_type = 'license_expired') as expired_count,
  COUNT(DISTINCT user_id) as affected_users,
  AVG(days_past_due) FILTER (WHERE days_past_due IS NOT NULL) as avg_days_past_due,
  AVG(amount_owed) FILTER (WHERE amount_owed IS NOT NULL) as avg_amount_owed,
  COUNT(*) FILTER (WHERE dunning_stage = 'soft') as soft_dunning_count,
  COUNT(*) FILTER (WHERE dunning_stage = 'medium') as medium_dunning_count,
  COUNT(*) FILTER (WHERE dunning_stage = 'hard') as hard_dunning_count
FROM raas_analytics_events
WHERE timestamp > NOW() - INTERVAL '90 days'
GROUP BY org_id, DATE_TRUNC('day', timestamp);

-- License validity rate view
CREATE OR REPLACE VIEW raas_analytics_license_validity AS
SELECT
  org_id,
  DATE_TRUNC('hour', timestamp) as hour,
  COUNT(*) as total_checks,
  COUNT(*) FILTER (WHERE valid = true) as valid_checks,
  COUNT(*) FILTER (WHERE valid = false) as invalid_checks,
  ROUND(
    COUNT(*) FILTER (WHERE valid = true) * 100.0 / NULLIF(COUNT(*), 0),
    2
  ) as validity_rate_percent
FROM raas_analytics_events
WHERE event_type = 'license_validated'
  AND timestamp > NOW() - INTERVAL '30 days'
GROUP BY org_id, DATE_TRUNC('hour', timestamp);

-- Recent events view for real-time dashboard
CREATE OR REPLACE VIEW raas_analytics_recent_events AS
SELECT
  id,
  event_type,
  org_id,
  user_id,
  reason,
  subscription_status,
  timestamp,
  path,
  metadata->>'suspension_reason' as suspension_reason
FROM raas_analytics_events
WHERE timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC
LIMIT 1000;

-- ============================================================================
-- RPC FUNCTIONS FOR DASHBOARD QUERIES
-- ============================================================================

-- Get suspension summary for an org
CREATE OR REPLACE FUNCTION get_raas_suspension_summary(
  p_org_id TEXT,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  event_day DATE,
  suspensions_count BIGINT,
  cleared_count BIGINT,
  expired_count BIGINT,
  affected_users BIGINT,
  avg_days_past_due DOUBLE PRECISION,
  avg_amount_owed DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE_TRUNC('day', e.timestamp)::DATE as event_day,
    COUNT(*) FILTER (WHERE e.event_type = 'suspension_created')::BIGINT as suspensions_count,
    COUNT(*) FILTER (WHERE e.event_type = 'suspension_cleared')::BIGINT as cleared_count,
    COUNT(*) FILTER (WHERE e.event_type = 'license_expired')::BIGINT as expired_count,
    COUNT(DISTINCT e.user_id)::BIGINT as affected_users,
    AVG(e.days_past_due) as avg_days_past_due,
    AVG(e.amount_owed) as avg_amount_owed
  FROM raas_analytics_events e
  WHERE e.org_id = p_org_id
    AND e.timestamp > NOW() - (p_days || ' days')::INTERVAL
  GROUP BY DATE_TRUNC('day', e.timestamp)
  ORDER BY event_day DESC;
END;
$$ LANGUAGE plpgsql;

-- Get recent suspension events for an org
CREATE OR REPLACE FUNCTION get_raas_recent_suspensions(
  p_org_id TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  event_type TEXT,
  user_id UUID,
  reason TEXT,
  subscription_status TEXT,
  days_past_due INTEGER,
  amount_owed NUMERIC,
  dunning_stage TEXT,
  timestamp TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.event_type,
    e.user_id,
    e.reason,
    e.subscription_status,
    e.days_past_due,
    e.amount_owed,
    e.dunning_stage,
    e.timestamp
  FROM raas_analytics_events e
  WHERE e.org_id = p_org_id
    AND e.event_type IN ('suspension_created', 'suspension_cleared')
  ORDER BY e.timestamp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get license validity stats for an org
CREATE OR REPLACE FUNCTION get_raas_license_validity(
  p_org_id TEXT,
  p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  hour TIMESTAMPTZ,
  total_checks BIGINT,
  valid_checks BIGINT,
  invalid_checks BIGINT,
  validity_rate_percent DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE_TRUNC('hour', e.timestamp) as hour,
    COUNT(*)::BIGINT as total_checks,
    COUNT(*) FILTER (WHERE e.valid = true)::BIGINT as valid_checks,
    COUNT(*) FILTER (WHERE e.valid = false)::BIGINT as invalid_checks,
    ROUND(
      COUNT(*) FILTER (WHERE e.valid = true) * 100.0 / NULLIF(COUNT(*), 0),
      2
    ) as validity_rate_percent
  FROM raas_analytics_events e
  WHERE e.org_id = p_org_id
    AND e.event_type = 'license_validated'
    AND e.timestamp > NOW() - (p_hours || ' hours')::INTERVAL
  GROUP BY DATE_TRUNC('hour', e.timestamp)
  ORDER BY hour DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE raas_analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy: Allow org members to read their org's events
CREATE POLICY "Org members can read org analytics events"
  ON raas_analytics_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_memberships m
      WHERE m.org_id = (
        SELECT id FROM organizations WHERE external_id = raas_analytics_events.org_id
      )
      AND m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin', 'member')
    )
  );

-- Policy: Allow service role to insert events
CREATE POLICY "Service role can insert analytics events"
  ON raas_analytics_events
  FOR INSERT
  WITH CHECK (
    auth.jwt()->>'role' = 'service_role'
  );

-- Policy: Allow admins to delete events (for data retention)
CREATE POLICY "Admins can delete analytics events"
  ON raas_analytics_events
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM user_memberships m
      WHERE m.org_id = (
        SELECT id FROM organizations WHERE external_id = raas_analytics_events.org_id
      )
      AND m.user_id = auth.uid()
      AND m.role = 'owner'
    )
  );

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE raas_analytics_events IS
  'RaaS analytics events for tracking suspension, license, and billing events';

COMMENT ON COLUMN raas_analytics_events.event_type IS
  'Type of event: suspension_created, suspension_cleared, license_expired, license_validated, subscription_warning, admin_bypass_used';

COMMENT ON COLUMN raas_analytics_events.org_id IS
  'Organization identifier (external ID)';

COMMENT ON COLUMN raas_analytics_events.metadata IS
  'Flexible JSONB field for event-specific additional data';

COMMENT ON VIEW raas_analytics_suspension_summary IS
  'Daily summary of suspension events for dashboard analytics';

COMMENT ON VIEW raas_analytics_license_validity IS
  'Hourly license validity rate for monitoring';

COMMENT ON FUNCTION get_raas_suspension_summary IS
  'Get suspension summary for an org over specified days';

COMMENT ON FUNCTION get_raas_recent_suspensions IS
  'Get recent suspension events for an org';

COMMENT ON FUNCTION get_raas_license_validity IS
  'Get license validity statistics for an org';
