-- ============================================================
-- Phase 7: Dunning Management Database Schema
-- Description: Track payment failures and dunning email sequences
-- Created: 2026-03-08
-- ============================================================

-- ============================================================
-- Table: dunning_events
-- Tracks payment failure events and dunning stages
-- ============================================================
CREATE TABLE IF NOT EXISTS dunning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,

  -- Stripe details
  stripe_invoice_id TEXT NOT NULL,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,

  -- Payment details
  amount_owed NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  attempt_count INTEGER DEFAULT 1,

  -- Dunning stage
  dunning_stage TEXT NOT NULL DEFAULT 'initial', -- 'initial', 'reminder', 'final', 'cancel_notice'
  days_since_failure INTEGER DEFAULT 0,

  -- Email tracking
  email_sent BOOLEAN DEFAULT FALSE,
  email_template TEXT,
  email_sent_at TIMESTAMPTZ,
  email_opened BOOLEAN DEFAULT FALSE,
  email_clicked BOOLEAN DEFAULT FALSE,

  -- Payment link
  payment_url TEXT,
  payment_link_expires_at TIMESTAMPTZ,

  -- Resolution
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolution_method TEXT, -- 'payment_success', 'manual_override', 'subscription_canceled'

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_dunning_org ON dunning_events(org_id);
CREATE INDEX idx_dunning_user ON dunning_events(user_id);
CREATE INDEX idx_dunning_stage ON dunning_events(dunning_stage, days_since_failure);
CREATE INDEX idx_dunning_stripe ON dunning_events(stripe_invoice_id);
CREATE INDEX idx_dunning_unresolved ON dunning_events(resolved, created_at);
CREATE INDEX idx_dunning_created ON dunning_events(created_at DESC);

-- Comment
COMMENT ON TABLE dunning_events IS 'Phase 7: Tracks payment failures and dunning email sequence progress';

-- ============================================================
-- Table: dunning_config
-- Per-organization dunning configuration
-- ============================================================
CREATE TABLE IF NOT EXISTS dunning_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,

  -- Enable/disable
  enabled BOOLEAN DEFAULT TRUE,

  -- Retry settings
  max_retry_days INTEGER DEFAULT 14,
  retry_interval_days INTEGER DEFAULT 2,
  grace_period_days INTEGER DEFAULT 5,

  -- Email settings
  auto_send_emails BOOLEAN DEFAULT TRUE,
  email_sequence JSONB DEFAULT '[
    {"stage": "initial", "day": 0, "template": "dunning-initial"},
    {"stage": "reminder", "day": 2, "template": "dunning-reminder"},
    {"stage": "final", "day": 5, "template": "dunning-final"},
    {"stage": "cancel_notice", "day": 10, "template": "dunning-cancel"}
  ]'::jsonb,

  -- Suspension settings
  auto_suspend BOOLEAN DEFAULT TRUE,
  suspend_after_days INTEGER DEFAULT 14,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_dunning_config_org ON dunning_config(org_id);

-- Comment
COMMENT ON TABLE dunning_config IS 'Phase 7: Per-organization dunning configuration settings';

-- ============================================================
-- Table: failed_webhooks
-- Audit log for webhook processing failures
-- ============================================================
CREATE TABLE IF NOT EXISTS failed_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  error_message TEXT NOT NULL,
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_failed_webhooks_type ON failed_webhooks(event_type);
CREATE INDEX idx_failed_webhooks_unresolved ON failed_webhooks(resolved, next_retry_at);

-- Comment
COMMENT ON TABLE failed_webhooks IS 'Phase 7: Audit log for failed webhook processing with retry support';

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS
ALTER TABLE dunning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE dunning_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_webhooks ENABLE ROW LEVEL SECURITY;

-- Dunning events: Users can view their org's events
CREATE POLICY "Users can view org dunning events"
  ON dunning_events
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Dunning events: Service role can manage
CREATE POLICY "Service role manages dunning events"
  ON dunning_events
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Dunning config: Users can view their org's config
CREATE POLICY "Users can view org dunning config"
  ON dunning_config
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Dunning config: Service role can manage
CREATE POLICY "Service role manages dunning config"
  ON dunning_config
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Failed webhooks: Service role only
CREATE POLICY "Service role manages failed webhooks"
  ON failed_webhooks
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================
-- Functions and Triggers
-- ============================================================

-- Function: Log dunning event
CREATE OR REPLACE FUNCTION log_dunning_event(
  p_org_id UUID,
  p_user_id UUID,
  p_subscription_id UUID,
  p_stripe_invoice_id TEXT,
  p_stripe_subscription_id TEXT,
  p_stripe_customer_id TEXT,
  p_amount_owed NUMERIC,
  p_currency TEXT DEFAULT 'USD',
  p_payment_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_dunning_id UUID;
BEGIN
  INSERT INTO dunning_events (
    org_id,
    user_id,
    subscription_id,
    stripe_invoice_id,
    stripe_subscription_id,
    stripe_customer_id,
    amount_owed,
    currency,
    dunning_stage,
    email_sent,
    payment_url,
    metadata
  ) VALUES (
    p_org_id,
    p_user_id,
    p_subscription_id,
    p_stripe_invoice_id,
    p_stripe_subscription_id,
    p_stripe_customer_id,
    p_amount_owed,
    p_currency,
    'initial',
    FALSE,
    p_payment_url,
    jsonb_build_object('created_from', 'payment_failed_webhook')
  )
  RETURNING id INTO v_dunning_id;

  -- Update subscription status to past_due
  UPDATE user_subscriptions
  SET status = 'past_due',
      metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{dunning_started_at}',
        to_jsonb(NOW())
      )
  WHERE stripe_subscription_id = p_stripe_subscription_id;

  RETURN v_dunning_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Advance dunning stage
CREATE OR REPLACE FUNCTION advance_dunning_stage(
  p_dunning_id UUID,
  p_new_stage TEXT,
  p_email_template TEXT DEFAULT NULL,
  p_email_sent BOOLEAN DEFAULT TRUE
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE dunning_events
  SET dunning_stage = p_new_stage,
      email_template = p_email_template,
      email_sent = p_email_sent,
      email_sent_at = CASE WHEN p_email_sent THEN NOW() ELSE email_sent_at END,
      days_since_failure = EXTRACT(DAY FROM NOW() - created_at)::INTEGER,
      updated_at = NOW()
  WHERE id = p_dunning_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function: Resolve dunning event
CREATE OR REPLACE FUNCTION resolve_dunning_event(
  p_dunning_id UUID,
  p_resolution_method TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE dunning_events
  SET resolved = TRUE,
      resolved_at = NOW(),
      resolution_method = p_resolution_method,
      updated_at = NOW()
  WHERE id = p_dunning_id;

  -- Update subscription status back to active
  UPDATE user_subscriptions
  SET status = 'active',
      metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{dunning_resolved_at}',
        to_jsonb(NOW())
      )
  WHERE id = (
    SELECT subscription_id FROM dunning_events WHERE id = p_dunning_id
  );

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function: Get pending dunning emails
CREATE OR REPLACE FUNCTION get_pending_dunning_emails()
RETURNS TABLE (
  dunning_id UUID,
  org_id UUID,
  user_id UUID,
  email_template TEXT,
  amount_owed NUMERIC,
  payment_url TEXT,
  days_since_failure INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.id,
    de.org_id,
    de.user_id,
    CASE
      WHEN de.dunning_stage = 'initial' THEN 'dunning-initial'
      WHEN de.dunning_stage = 'reminder' THEN 'dunning-reminder'
      WHEN de.dunning_stage = 'final' THEN 'dunning-final'
      WHEN de.dunning_stage = 'cancel_notice' THEN 'dunning-cancel'
      ELSE NULL
    END::TEXT as email_template,
    de.amount_owed,
    de.payment_url,
    EXTRACT(DAY FROM NOW() - de.created_at)::INTEGER as days_since_failure
  FROM dunning_events de
  JOIN dunning_config dc ON de.org_id = dc.org_id
  WHERE de.resolved = FALSE
    AND de.email_sent = FALSE
    AND dc.enabled = TRUE
    AND dc.auto_send_emails = TRUE
  ORDER BY de.created_at ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Process dunning stage advancement
CREATE OR REPLACE FUNCTION process_dunning_stages()
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  -- Advance from initial to reminder (after 2 days)
  UPDATE dunning_events
  SET dunning_stage = 'reminder',
      days_since_failure = EXTRACT(DAY FROM NOW() - created_at)::INTEGER,
      updated_at = NOW()
  WHERE resolved = FALSE
    AND dunning_stage = 'initial'
    AND NOW() > created_at + INTERVAL '2 days';
  v_updated_count := v_updated_count + SQL ROWCOUNT;

  -- Advance from reminder to final (after 5 days)
  UPDATE dunning_events
  SET dunning_stage = 'final',
      days_since_failure = EXTRACT(DAY FROM NOW() - created_at)::INTEGER,
      updated_at = NOW()
  WHERE resolved = FALSE
    AND dunning_stage IN ('initial', 'reminder')
    AND NOW() > created_at + INTERVAL '5 days';
  v_updated_count := v_updated_count + SQL ROWCOUNT;

  -- Advance from final to cancel_notice (after 10 days)
  UPDATE dunning_events
  SET dunning_stage = 'cancel_notice',
      days_since_failure = EXTRACT(DAY FROM NOW() - created_at)::INTEGER,
      updated_at = NOW()
  WHERE resolved = FALSE
    AND dunning_stage IN ('initial', 'reminder', 'final')
    AND NOW() > created_at + INTERVAL '10 days';
  v_updated_count := v_updated_count + SQL ROWCOUNT;

  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Get dunning config with defaults
CREATE OR REPLACE FUNCTION get_dunning_config(p_org_id UUID)
RETURNS dunning_config AS $$
DECLARE
  v_config dunning_config;
BEGIN
  SELECT * INTO v_config
  FROM dunning_config
  WHERE org_id = p_org_id;

  -- Return default config if none exists
  IF v_config.id IS NULL THEN
    v_config.enabled := TRUE;
    v_config.max_retry_days := 14;
    v_config.retry_interval_days := 2;
    v_config.grace_period_days := 5;
    v_config.auto_send_emails := TRUE;
    v_config.auto_suspend := TRUE;
    v_config.suspend_after_days := 14;
  END IF;

  RETURN v_config;
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_dunning_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_dunning_events_updated_at
  BEFORE UPDATE ON dunning_events
  FOR EACH ROW
  EXECUTE FUNCTION update_dunning_updated_at();

CREATE TRIGGER trg_update_dunning_config_updated_at
  BEFORE UPDATE ON dunning_config
  FOR EACH ROW
  EXECUTE FUNCTION update_dunning_updated_at();

-- ============================================================
-- Views for Dashboard
-- ============================================================

-- View: Active dunning events
CREATE OR REPLACE VIEW active_dunning_events AS
SELECT
  de.id,
  de.org_id,
  de.user_id,
  de.stripe_invoice_id,
  de.amount_owed,
  de.dunning_stage,
  de.days_since_failure,
  de.email_sent,
  de.payment_url,
  de.created_at,
  o.name as org_name,
  u.email as user_email
FROM dunning_events de
LEFT JOIN organizations o ON de.org_id = o.id
LEFT JOIN auth.users u ON de.user_id = u.id
WHERE de.resolved = FALSE
ORDER BY de.created_at DESC;

-- View: Dunning statistics
CREATE OR REPLACE VIEW dunning_statistics AS
SELECT
  COUNT(*) FILTER (WHERE resolved = FALSE) as active_dunning_count,
  COUNT(*) FILTER (WHERE resolved = TRUE) as resolved_count,
  COUNT(*) FILTER (WHERE resolved = FALSE AND dunning_stage = 'initial') as initial_stage_count,
  COUNT(*) FILTER (WHERE resolved = FALSE AND dunning_stage = 'reminder') as reminder_stage_count,
  COUNT(*) FILTER (WHERE resolved = FALSE AND dunning_stage = 'final') as final_stage_count,
  COUNT(*) FILTER (WHERE resolved = FALSE AND dunning_stage = 'cancel_notice') as cancel_notice_count,
  SUM(amount_owed) FILTER (WHERE resolved = FALSE) as total_amount_at_risk,
  AVG(amount_owed) FILTER (WHERE resolved = TRUE) as avg_resolved_amount,
  COUNT(*) FILTER (WHERE resolved = TRUE AND resolution_method = 'payment_success') as payment_recovery_count,
  COUNT(*) FILTER (WHERE resolved = TRUE AND resolution_method = 'subscription_canceled') as cancellation_count
FROM dunning_events;

-- ============================================================
-- Seed default dunning config
-- ============================================================
INSERT INTO dunning_config (enabled, max_retry_days, retry_interval_days, grace_period_days, auto_suspend, suspend_after_days)
VALUES (TRUE, 14, 2, 5, TRUE, 14)
ON CONFLICT (org_id) DO NOTHING;

-- ============================================================
-- End of Migration
-- ============================================================
