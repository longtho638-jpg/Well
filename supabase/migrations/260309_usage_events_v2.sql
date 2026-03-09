-- Phase 6: High-volume Usage Events (Timescale-compatible)
-- Optimized for time-series analytics with compression

CREATE TABLE IF NOT EXISTS usage_events (
  time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  org_id UUID NOT NULL,
  tenant_id UUID,
  user_id UUID,
  license_id UUID,
  feature TEXT NOT NULL,
  quantity BIGINT NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  batch_id TEXT,
  event_id UUID DEFAULT gen_random_uuid(),
  idempotency_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable TimescaleDB compression (if Timescale extension is enabled)
-- Note: This requires TimescaleDB extension in Supabase
-- SELECT create_hypertable('usage_events', 'time', if_not_exists => TRUE);

-- Standard indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_usage_events_org_time
  ON usage_events(org_id, time DESC);

CREATE INDEX IF NOT EXISTS idx_usage_events_feature_time
  ON usage_events(feature, time DESC);

CREATE INDEX IF NOT EXISTS idx_usage_events_tenant
  ON usage_events(tenant_id);

CREATE INDEX IF NOT EXISTS idx_usage_events_user
  ON usage_events(user_id);

CREATE INDEX IF NOT EXISTS idx_usage_events_batch
  ON usage_events(batch_id);

CREATE INDEX IF NOT EXISTS idx_usage_events_idempotency
  ON usage_events(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Enable RLS
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "service_role_usage_events"
  ON usage_events FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Users can view their org's events
CREATE POLICY "users_view_usage_events"
  ON usage_events FOR SELECT
  USING (
    org_id IN (
      SELECT DISTINCT org_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Insert policy for authenticated users (via Edge Function)
CREATE POLICY "users_insert_usage_events"
  ON usage_events FOR INSERT
  WITH CHECK (
    auth.jwt()->>'role' = 'service_role' OR
    org_id IN (
      SELECT DISTINCT org_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE usage_events IS 'Phase 6: High-volume time-series usage events for analytics';
COMMENT ON COLUMN usage_events.idempotency_key IS 'Unique key for deduplication (batch_id:event_idx)';
COMMENT ON COLUMN usage_events.batch_id IS 'Batch identifier for bulk ingestion tracking';

-- View: Daily usage aggregation (for dashboard)
CREATE OR REPLACE VIEW usage_daily_agg AS
SELECT
  DATE_TRUNC('day', time) AS date,
  org_id,
  feature,
  SUM(quantity) AS total_quantity,
  COUNT(*) AS event_count,
  AVG(quantity) AS avg_quantity
FROM usage_events
GROUP BY 1, 2, 3
ORDER BY 1 DESC;

-- View: Hourly usage aggregation (for real-time monitoring)
CREATE OR REPLACE VIEW usage_hourly_agg AS
SELECT
  DATE_TRUNC('hour', time) AS hour,
  org_id,
  feature,
  SUM(quantity) AS total_quantity,
  COUNT(*) AS event_count
FROM usage_events
WHERE time > NOW() - INTERVAL '24 hours'
GROUP BY 1, 2, 3
ORDER BY 1 DESC;

-- View: Current period usage (for quota checking)
CREATE OR REPLACE VIEW usage_current_period AS
SELECT
  org_id,
  feature,
  SUM(quantity) AS total_usage,
  DATE_TRUNC('month', MIN(time)) AS period_start,
  DATE_TRUNC('month', MAX(time)) + INTERVAL '1 month' AS period_end
FROM usage_events
WHERE time >= DATE_TRUNC('month', NOW())
GROUP BY org_id, feature;
