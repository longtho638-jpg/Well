-- ============================================================
-- Phase 6: Anomaly Detection & Alerting Schema
-- ============================================================
-- Created: 2026-03-09
-- Description: Database schema for anomaly alerts and ROI digests
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- Anomaly Alerts Table
-- ============================================================

CREATE TABLE IF NOT EXISTS anomaly_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'usage_spike',
    'usage_drop',
    'negative_roi',
    'quota_breach',
    'cost_spike',
    'error_rate_spike'
  )),
  alert_level TEXT NOT NULL CHECK (alert_level IN ('info', 'warning', 'critical')),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  threshold_value NUMERIC NOT NULL,
  description TEXT NOT NULL,
  z_score NUMERIC,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_anomaly_alerts_org_created ON anomaly_alerts(org_id, created_at DESC);
CREATE INDEX idx_anomaly_alerts_unacknowledged ON anomaly_alerts(org_id) WHERE acknowledged = FALSE;
CREATE INDEX idx_anomaly_alerts_level ON anomaly_alerts(alert_level);
CREATE INDEX idx_anomaly_alerts_type ON anomaly_alerts(alert_type);

-- ============================================================
-- ROI Digests Table
-- ============================================================

CREATE TABLE IF NOT EXISTS roi_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  digest_date DATE NOT NULL,
  roi_percentage NUMERIC DEFAULT 0,
  cost_per_api_call NUMERIC DEFAULT 0,
  revenue_per_user NUMERIC DEFAULT 0,
  utilization_rate NUMERIC DEFAULT 0,
  anomaly_score NUMERIC DEFAULT 0,
  total_api_calls BIGINT DEFAULT 0,
  total_ai_calls BIGINT DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  email_sent BOOLEAN DEFAULT FALSE,
  webhook_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, digest_date)
);

-- Indexes for efficient querying
CREATE INDEX idx_roi_digests_org_date ON roi_digests(org_id, digest_date DESC);
CREATE INDEX idx_roi_digests_date ON roi_digests(digest_date DESC);

-- ============================================================
-- Helper Functions
-- ============================================================

-- Function to calculate Z-score
CREATE OR REPLACE FUNCTION calculate_z_score(
  value NUMERIC,
  mean_val NUMERIC,
  stddev NUMERIC
)
RETURNS NUMERIC AS $$
BEGIN
  IF stddev = 0 THEN
    RETURN 0;
  END IF;
  RETURN (value - mean_val) / stddev;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to detect anomaly based on Z-score
CREATE OR REPLACE FUNCTION is_anomaly(
  z_score NUMERIC,
  threshold NUMERIC DEFAULT 2.0
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN ABS(z_score) > threshold;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to determine alert severity
CREATE OR REPLACE FUNCTION get_alert_severity(
  z_score NUMERIC
)
RETURNS TEXT AS $$
BEGIN
  IF ABS(z_score) >= 3.0 THEN
    RETURN 'critical';
  ELSIF ABS(z_score) >= 2.5 THEN
    RETURN 'warning';
  ELSE
    RETURN 'info';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to acknowledge an alert
CREATE OR REPLACE FUNCTION acknowledge_alert(
  p_alert_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  UPDATE anomaly_alerts
  SET acknowledged = TRUE,
      acknowledged_by = p_user_id,
      acknowledged_at = NOW()
  WHERE id = p_alert_id
    AND acknowledged = FALSE;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unacknowledged alerts for an org
CREATE OR REPLACE FUNCTION get_unacknowledged_alerts(
  p_org_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  alert_type TEXT,
  alert_level TEXT,
  metric_name TEXT,
  metric_value NUMERIC,
  description TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.alert_type,
    a.alert_level,
    a.metric_name,
    a.metric_value,
    a.description,
    a.created_at
  FROM anomaly_alerts a
  WHERE a.org_id = p_org_id
    AND a.acknowledged = FALSE
  ORDER BY
    CASE a.alert_level
      WHEN 'critical' THEN 1
      WHEN 'warning' THEN 2
      WHEN 'info' THEN 3
    END,
    a.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PgCron Jobs (Scheduled Tasks)
-- ============================================================

-- Schedule: Detect anomalies every 5 minutes
SELECT cron.schedule(
  'detect-anomalies-5min',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url:='https://raas-gateway.agencyos.network/anomaly/detect',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'X-API-Key', current_setting('app.api_key')
      ),
      body:=jsonb_build_object(
        'window', '1h'
      )
    );
  $$
);

-- Schedule: Send ROI digest daily at midnight UTC
SELECT cron.schedule(
  'send-roi-digest-daily',
  '0 0 * * *',
  $$
    SELECT net.http_post(
      url:='https://raas-gateway.agencyos.network/roi/digest',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'X-API-Key', current_setting('app.api_key')
      )
    );
  $$
);

-- Schedule: Cleanup old alerts (90 days retention)
SELECT cron.schedule(
  'cleanup-old-alerts-daily',
  '0 3 * * *',
  $$
    DELETE FROM anomaly_alerts
    WHERE created_at < NOW() - INTERVAL '90 days'
      AND acknowledged = TRUE;
  $$
);

-- ============================================================
-- RLS Policies (Row Level Security)
-- ============================================================

-- Enable RLS
ALTER TABLE anomaly_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi_digests ENABLE ROW LEVEL SECURITY;

-- Anomaly alerts policies
CREATE POLICY "Org members can view alerts"
  ON anomaly_alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.org_id = anomaly_alerts.org_id
        AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert alerts"
  ON anomaly_alerts
  FOR INSERT
  WITH CHECK (
    auth.jwt()->>'role' = 'service_role'
  );

CREATE POLICY "Users can acknowledge their alerts"
  ON anomaly_alerts
  FOR UPDATE
  USING (
    acknowledged_by = auth.uid() OR
    auth.jwt()->>'role' = 'service_role'
  );

-- ROI digests policies
CREATE POLICY "Org members can view ROI digests"
  ON roi_digests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.org_id = roi_digests.org_id
        AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert ROI digests"
  ON roi_digests
  FOR INSERT
  WITH CHECK (
    auth.jwt()->>'role' = 'service_role'
  );

-- ============================================================
-- Comments
-- ============================================================

COMMENT ON TABLE anomaly_alerts IS 'Stores anomaly detection alerts for usage monitoring';
COMMENT ON COLUMN anomaly_alerts.alert_type IS 'Type of anomaly: usage_spike, usage_drop, negative_roi, quota_breach, cost_spike, error_rate_spike';
COMMENT ON COLUMN anomaly_alerts.alert_level IS 'Severity: info (2σ), warning (2.5σ), critical (3σ)';
COMMENT ON COLUMN anomaly_alerts.z_score IS 'Statistical deviation from rolling mean';

COMMENT ON TABLE roi_digests IS 'Daily ROI metrics digest for each organization';
COMMENT ON COLUMN roi_digests.roi_percentage IS 'ROI = (Revenue - Cost) / Cost * 100';
COMMENT ON COLUMN roi_digests.utilization_rate IS 'Actual Usage / Quota (target: 70-90%)';
