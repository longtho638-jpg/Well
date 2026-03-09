-- ============================================================
-- Phase 7.2: Overage Events and Billing State Enhancements
-- Description: Audit trail for overage billing and real-time state
-- Created: 2026-03-09
-- ============================================================

-- ============================================================
-- Table: overage_events
-- Audit trail for overage detection and invoicing
-- ============================================================
CREATE TABLE IF NOT EXISTS overage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  license_id UUID REFERENCES raas_licenses(id) ON DELETE CASCADE,

  -- Overage details
  metric_type TEXT NOT NULL,
  overage_units BIGINT NOT NULL DEFAULT 0,
  overage_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,

  -- Stripe invoice tracking
  stripe_invoice_id TEXT,
  stripe_invoice_item_id TEXT,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending',
  CHECK (status IN ('pending', 'invoiced', 'paid', 'failed', 'refunded')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  invoiced_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  idempotency_key TEXT
);

-- Indexes for fast lookups
CREATE INDEX idx_overage_events_org_created ON overage_events(org_id, created_at DESC);
CREATE INDEX idx_overage_events_status ON overage_events(status) WHERE status != 'paid';
CREATE INDEX idx_overage_events_stripe ON overage_events(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;
CREATE INDEX idx_overage_events_idempotency ON overage_events(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Comment
COMMENT ON TABLE overage_events IS 'Phase 7: Audit trail for overage detection, invoicing, and payment lifecycle';

-- ============================================================
-- Table: billing_state (enhancements)
-- Real-time billing state KV store with forecasting
-- ============================================================

-- Add forecast columns if not exist (using DO block for idempotency)
DO $$ BEGIN
  ALTER TABLE billing_state
    ADD COLUMN IF NOT EXISTS projected_end_of_month BIGINT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS projected_overage_units BIGINT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS projected_overage_cost_cents INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS forecast_confidence REAL DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS trend TEXT DEFAULT 'stable';
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Add index for forecasting queries
CREATE INDEX IF NOT EXISTS idx_billing_state_forecast ON billing_state(org_id, metric_type)
  WHERE projected_overage_units > 0;

-- ============================================================
-- Table: notification_events
-- Audit trail for multi-channel notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- Notification details
  channel TEXT NOT NULL,
  CHECK (channel IN ('email', 'sms', 'webhook')),
  metric_type TEXT NOT NULL,
  threshold_percentage SMALLINT NOT NULL,
  recipient TEXT NOT NULL,

  -- Delivery tracking
  message_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  error_message TEXT,

  -- Retry tracking
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,

  -- Response tracking
  response_status INTEGER,
  response_body JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for notification tracking
CREATE INDEX idx_notification_events_user ON notification_events(user_id, created_at DESC);
CREATE INDEX idx_notification_events_org ON notification_events(org_id, created_at DESC);
CREATE INDEX idx_notification_events_status_retry ON notification_events(status, next_retry_at)
  WHERE status IN ('pending', 'failed');
CREATE INDEX idx_notification_events_channel ON notification_events(channel, created_at);

-- Comment
COMMENT ON TABLE notification_events IS 'Phase 7: Audit trail for multi-channel notification delivery (email, SMS, webhook)';

-- ============================================================
-- Table: alert_webhook_events
-- Specialized tracking for usage alert webhooks to AgencyOS
-- ============================================================
CREATE TABLE IF NOT EXISTS alert_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL UNIQUE,
  event_type TEXT NOT NULL,

  -- Alert details
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  license_id UUID NOT NULL REFERENCES raas_licenses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  metric_type TEXT NOT NULL,

  -- Usage details
  current_usage BIGINT NOT NULL,
  quota_limit BIGINT NOT NULL,
  threshold_percentage SMALLINT NOT NULL,

  -- Webhook delivery
  webhook_url TEXT NOT NULL,
  webhook_status TEXT NOT NULL DEFAULT 'pending',
  CHECK (webhook_status IN ('pending', 'sent', 'failed')),
  webhook_attempts INTEGER DEFAULT 0,
  jwt_token TEXT,
  jwt_expires_at TIMESTAMPTZ,

  -- Response tracking
  response_status INTEGER,
  response_body JSONB,
  error_message TEXT,
  last_attempt_at TIMESTAMPTZ,

  -- Idempotency
  idempotency_key TEXT NOT NULL,

  -- Processing
  processed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for alert tracking
CREATE INDEX idx_alert_webhook_events_event_id ON alert_webhook_events(event_id);
CREATE INDEX idx_alert_webhook_events_user ON alert_webhook_events(user_id, created_at DESC);
CREATE INDEX idx_alert_webhook_events_license ON alert_webhook_events(license_id, created_at DESC);
CREATE INDEX idx_alert_webhook_events_status ON alert_webhook_events(webhook_status, last_attempt_at);
CREATE INDEX idx_alert_webhook_events_idempotency ON alert_webhook_events(idempotency_key);

-- Comment
COMMENT ON TABLE alert_webhook_events IS 'Phase 7: Specialized tracking for usage alert webhooks to AgencyOS dashboard with JWT auth';

-- ============================================================
-- Table: usage_alert_events
-- Usage threshold alert events for cooldown tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS usage_alert_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  metric_type TEXT NOT NULL,
  threshold_percentage SMALLINT NOT NULL CHECK (threshold_percentage IN (80, 90, 100)),
  current_usage BIGINT NOT NULL,
  quota_limit BIGINT NOT NULL,

  -- Delivery tracking
  channels_sent TEXT[] NOT NULL DEFAULT '{}',
  cooldown_until TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for cooldown checks
CREATE INDEX idx_usage_alerts_user_metric ON usage_alert_events(user_id, metric_type, threshold_percentage);
CREATE INDEX idx_usage_alerts_cooldown ON usage_alert_events(user_id, metric_type, threshold_percentage, cooldown_until);

-- Comment
COMMENT ON TABLE usage_alert_events IS 'Phase 7: Usage threshold alert events with cooldown tracking for idempotency';

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS
ALTER TABLE overage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_alert_events ENABLE ROW LEVEL SECURITY;

-- Overage events: Users can view their org's events
CREATE POLICY "Users can view org overage events"
  ON overage_events
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Overage events: Service role can manage
CREATE POLICY "Service role manages overage events"
  ON overage_events
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Notification events: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notification_events
  FOR SELECT
  USING (user_id = auth.uid());

-- Notification events: Service role can manage
CREATE POLICY "Service role manages notifications"
  ON notification_events
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Alert webhook events: Service role only
CREATE POLICY "Service role manages alert webhooks"
  ON alert_webhook_events
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Usage alert events: Users can view their own alerts
CREATE POLICY "Users can view own usage alerts"
  ON usage_alert_events
  FOR SELECT
  USING (user_id = auth.uid());

-- Usage alert events: Service role can manage
CREATE POLICY "Service role manages usage alerts"
  ON usage_alert_events
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================
-- Functions
-- ============================================================

-- Function: Check notification cooldown (idempotency)
CREATE OR REPLACE FUNCTION check_notification_cooldown(
  p_user_id UUID,
  p_metric_type TEXT,
  p_threshold_percentage SMALLINT,
  p_cooldown_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  v_last_alert TIMESTAMPTZ;
BEGIN
  -- Get last alert time for this user/metric/threshold combination
  SELECT MAX(created_at) INTO v_last_alert
  FROM usage_alert_events
  WHERE user_id = p_user_id
    AND metric_type = p_metric_type
    AND threshold_percentage = p_threshold_percentage;

  -- No previous alert - allow
  IF v_last_alert IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Check if cooldown period has passed
  IF NOW() > v_last_alert + (p_cooldown_minutes || ' minutes')::INTERVAL THEN
    RETURN TRUE;
  END IF;

  -- Still in cooldown - deny
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Check alert idempotency for webhooks
CREATE OR REPLACE FUNCTION check_alert_idempotency(
  p_user_id UUID,
  p_metric_type TEXT,
  p_threshold_percentage SMALLINT,
  p_hours INTEGER DEFAULT 24
)
RETURNS BOOLEAN AS $$
DECLARE
  v_last_alert TIMESTAMPTZ;
BEGIN
  -- Get last alert time
  SELECT MAX(created_at) INTO v_last_alert
  FROM alert_webhook_events
  WHERE user_id = p_user_id
    AND metric_type = p_metric_type
    AND threshold_percentage = p_threshold_percentage
    AND created_at > NOW() - (p_hours || ' hours')::INTERVAL;

  -- Return FALSE if alert exists (suppress duplicate)
  RETURN v_last_alert IS NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get current period overage summary
CREATE OR REPLACE FUNCTION get_current_period_overage_summary(
  p_org_id UUID
)
RETURNS TABLE (
  billing_period TEXT,
  total_overage_cost NUMERIC,
  total_overage_units BIGINT,
  overage_count BIGINT,
  by_metric JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ot.billing_period::TEXT,
    SUM(ot.overage_cost)::NUMERIC,
    SUM(ot.overage_units)::BIGINT,
    COUNT(*)::BIGINT,
    JSONB_OBJECT_AGG(ot.metric_type, jsonb_build_object(
      'units', ot.overage_units,
      'cost', ot.overage_cost
    ))
  FROM overage_transactions ot
  WHERE ot.org_id = p_org_id
    AND ot.billing_period = to_char(CURRENT_DATE, 'YYYY-MM')
  GROUP BY ot.billing_period;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- Views for Dashboard
-- ============================================================

-- View: Real-time overage events dashboard
CREATE OR REPLACE VIEW overage_events_dashboard AS
SELECT
  oe.org_id,
  oe.user_id,
  oe.license_id,
  oe.metric_type,
  oe.overage_units,
  oe.overage_cost,
  oe.status,
  oe.created_at,
  oe.stripe_invoice_id,
  CASE
    WHEN oe.status = 'pending' THEN 'Chờ xử lý'
    WHEN oe.status = 'invoiced' THEN 'Đã xuất hóa đơn'
    WHEN oe.status = 'paid' THEN 'Đã thanh toán'
    WHEN oe.status = 'failed' THEN 'Thất bại'
    ELSE 'Đã hoàn tiền'
  END as status_label
FROM overage_events oe
ORDER BY oe.created_at DESC;

-- View: Notification delivery summary
CREATE OR REPLACE VIEW notification_delivery_summary AS
SELECT
  DATE(created_at) as notification_date,
  channel,
  status,
  COUNT(*) as notification_count,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'delivered') / NULLIF(COUNT(*), 0), 2) as delivery_rate
FROM notification_events
GROUP BY DATE(created_at), channel, status
ORDER BY notification_date DESC, channel;

-- ============================================================
-- End of Migration
-- ============================================================
