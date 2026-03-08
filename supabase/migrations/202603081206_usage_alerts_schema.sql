-- Phase 6: Usage Alerts Schema
-- Purpose: Track webhook events for usage threshold alerts to AgencyOS dashboard
-- Date: 2026-03-08

-- Alert webhook events table
CREATE TABLE IF NOT EXISTS alert_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('usage.threshold_exceeded', 'usage.quota_exhausted')),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  license_id UUID REFERENCES raas_licenses(id) ON DELETE CASCADE,
  customer_id TEXT, -- Stripe/Polar customer ID for billing context

  -- Alert details
  metric_type TEXT NOT NULL CHECK (metric_type IN ('api_calls', 'tokens', 'compute_minutes', 'model_inferences', 'agent_executions')),
  current_usage BIGINT NOT NULL DEFAULT 0,
  quota_limit BIGINT NOT NULL DEFAULT 0,
  threshold_percentage INTEGER NOT NULL CHECK (threshold_percentage IN (80, 90, 100)),

  -- Webhook delivery
  webhook_url TEXT NOT NULL,
  webhook_status TEXT NOT NULL DEFAULT 'pending' CHECK (webhook_status IN ('pending', 'sent', 'failed', 'retrying')),
  webhook_attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,

  -- JWT tracking
  jwt_token TEXT,
  jwt_expires_at TIMESTAMPTZ,

  -- Response tracking
  response_status INTEGER,
  response_body JSONB,
  error_message TEXT,

  -- Metadata and timestamps
  metadata JSONB DEFAULT '{}'::jsonb,
  idempotency_key TEXT UNIQUE, -- Prevent duplicate alerts
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ -- Alert expires after 24 hours
);

-- Indexes for performance
CREATE INDEX idx_alert_webhook_user_id ON alert_webhook_events(user_id);
CREATE INDEX idx_alert_webhook_license_id ON alert_webhook_events(license_id);
CREATE INDEX idx_alert_webhook_status ON alert_webhook_events(webhook_status);
CREATE INDEX idx_alert_webhook_created_at ON alert_webhook_events(created_at DESC);
CREATE INDEX idx_alert_webhook_event_type ON alert_webhook_events(event_type);
CREATE INDEX idx_alert_webhook_idempotency ON alert_webhook_events(idempotency_key);

-- Composite indexes for common queries
CREATE INDEX idx_alert_webhook_user_status ON alert_webhook_events(user_id, webhook_status);
CREATE INDEX idx_alert_webhook_created_status ON alert_webhook_events(created_at DESC, webhook_status);

-- Row Level Security (RLS) Policies
ALTER TABLE alert_webhook_events ENABLE ROW LEVEL SECURITY;

-- Users can only view their own alerts
CREATE POLICY "Users can view own alerts"
  ON alert_webhook_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert alerts (triggered by RaaS Gateway)
CREATE POLICY "Service role can insert alerts"
  ON alert_webhook_events
  FOR INSERT
  WITH CHECK (true); -- Service role has full access

-- Service role can update alerts (for webhook delivery status)
CREATE POLICY "Service role can update alerts"
  ON alert_webhook_events
  FOR ALL
  USING (true);

-- Function to cleanup old alerts (run daily via cron)
CREATE OR REPLACE FUNCTION cleanup_old_alerts()
RETURNS void AS $$
BEGIN
  -- Delete alerts older than 90 days
  DELETE FROM alert_webhook_events
  WHERE created_at < NOW() - INTERVAL '90 days'
  AND webhook_status IN ('sent', 'failed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check idempotency (prevent duplicate alerts)
CREATE OR REPLACE FUNCTION check_alert_idempotency(
  p_user_id UUID,
  p_metric_type TEXT,
  p_threshold_percentage INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM alert_webhook_events
    WHERE user_id = p_user_id
    AND metric_type = p_metric_type
    AND threshold_percentage = p_threshold_percentage
    AND webhook_status IN ('pending', 'sent')
    AND created_at > NOW() - INTERVAL '1 hour' -- Cooldown period
  ) INTO v_exists;

  RETURN NOT v_exists; -- Return true if alert can be sent
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to set expires_at on insert
CREATE OR REPLACE FUNCTION set_alert_expiry()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expires_at = NEW.created_at + INTERVAL '24 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_alert_expiry
  BEFORE INSERT ON alert_webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION set_alert_expiry();

-- Grant permissions
GRANT SELECT ON alert_webhook_events TO authenticated;
GRANT ALL ON alert_webhook_events TO service_role;

-- Comment for documentation
COMMENT ON TABLE alert_webhook_events IS 'Phase 6: Tracks usage threshold alerts sent to AgencyOS dashboard via webhooks';
COMMENT ON COLUMN alert_webhook_events.event_type IS 'Type of alert: usage.threshold_exceeded (80%, 90%) or usage.quota_exhausted (100%)';
COMMENT ON COLUMN alert_webhook_events.metric_type IS 'Which metric triggered the alert: api_calls, tokens, compute_minutes, model_inferences, agent_executions';
COMMENT ON COLUMN alert_webhook_events.webhook_status IS 'Delivery status: pending, sent, failed, retrying';
COMMENT ON COLUMN alert_webhook_events.idempotency_key IS 'Unique key to prevent duplicate alerts (user_id + metric_type + threshold + date)';
COMMENT ON FUNCTION check_alert_idempotency IS 'Check if alert was already sent within cooldown period (1 hour)';
COMMENT ON FUNCTION cleanup_old_alerts IS 'Daily cleanup of alerts older than 90 days';
