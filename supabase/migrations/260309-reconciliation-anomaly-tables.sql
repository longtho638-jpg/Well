-- Reconciliation Log Table
-- Tracks daily reconciliation between RaaS Gateway and Stripe/Polar billing

CREATE TABLE IF NOT EXISTS reconciliation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  period DATE NOT NULL,  -- YYYY-MM-DD
  gateway_usage BIGINT NOT NULL DEFAULT 0,
  stripe_usage BIGINT NOT NULL DEFAULT 0,
  polar_usage BIGINT NOT NULL DEFAULT 0,
  discrepancy DECIMAL(10, 8) NOT NULL DEFAULT 0,  -- Percentage (0.05 = 5%)
  auto_healed BOOLEAN NOT NULL DEFAULT false,
  alert_sent BOOLEAN NOT NULL DEFAULT false,
  authoritative_source TEXT,  -- 'gateway' or 'billing'
  status TEXT NOT NULL CHECK (status IN ('matched', 'auto_healed', 'alerted', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reconciliation_org_period ON reconciliation_log(org_id, period DESC);
CREATE INDEX idx_reconciliation_status ON reconciliation_log(status);
CREATE INDEX idx_reconciliation_created_at ON reconciliation_log(created_at DESC);

-- Anomaly Events Table
-- Tracks detected anomalies (spikes, drops, license mismatches, JWT failures, rate limit breaches)

CREATE TABLE IF NOT EXISTS anomaly_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  anomaly_type TEXT NOT NULL CHECK (anomaly_type IN (
    'spike',
    'drop',
    'license_mismatch',
    'jwt_failure',
    'rate_limit_breach',
    'pattern_deviation'
  )),
  alert_level TEXT NOT NULL CHECK (alert_level IN ('warning', 'critical', 'emergency')),
  metric_type TEXT,
  current_value BIGINT NOT NULL,
  baseline_value BIGINT NOT NULL,
  deviation_percent DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_anomaly_events_org_type ON anomaly_events(org_id, anomaly_type);
CREATE INDEX idx_anomaly_events_level ON anomaly_events(alert_level);
CREATE INDEX idx_anomaly_events_detected_at ON anomaly_events(detected_at DESC);
CREATE INDEX idx_anomaly_events_unacknowledged ON anomaly_events(org_id, detected_at DESC)
  WHERE acknowledged = false;

-- RLS Policies for reconciliation_log
ALTER TABLE reconciliation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Orgs can view their own reconciliation logs"
  ON reconciliation_log
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT owner_id FROM organizations WHERE id = org_id
      UNION
      SELECT user_id FROM org_members WHERE org_id = reconciliation_log.org_id
    )
  );

CREATE POLICY "Service role can insert reconciliation logs"
  ON reconciliation_log
  FOR INSERT
  WITH CHECK (true);  -- Allow service role to insert

-- RLS Policies for anomaly_events
ALTER TABLE anomaly_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Orgs can view their own anomaly events"
  ON anomaly_events
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT owner_id FROM organizations WHERE id = org_id
      UNION
      SELECT user_id FROM org_members WHERE org_id = anomaly_events.org_id
    )
  );

CREATE POLICY "Service role can insert anomaly events"
  ON anomaly_events
  FOR INSERT
  WITH CHECK (true);  -- Allow service role to insert

CREATE POLICY "Org members can acknowledge anomaly events"
  ON anomaly_events
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT owner_id FROM organizations WHERE id = org_id
      UNION
      SELECT user_id FROM org_members WHERE org_id = anomaly_events.org_id
    )
  )
  WITH CHECK (true);

-- Cron schedule for daily reconciliation at 2 AM UTC
INSERT INTO cron.schedules (schedule, command)
VALUES ('0 2 * * *', $$
  SELECT supabase.functions.invoke('reconcile-gateway-billing', '{
    "method": "POST",
    "headers": {"Content-Type": "application/json"}
  }')
$$)
ON CONFLICT (schedule) DO UPDATE SET command = EXCLUDED.command;

-- Comments
COMMENT ON TABLE reconciliation_log IS 'Daily reconciliation audit trail between Gateway and billing providers';
COMMENT ON TABLE anomaly_events IS 'Detected usage anomalies with alert levels and acknowledgment tracking';
COMMENT ON COLUMN reconciliation_log.discrepancy IS 'Percentage difference (e.g., 0.05 = 5%)';
COMMENT ON COLUMN reconciliation_log.authoritative_source IS 'Which system was trusted as source of truth during auto-heal';
COMMENT ON COLUMN anomaly_events.alert_level IS 'warning=3x spike, critical=6x spike, emergency=license misuse';
