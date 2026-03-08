-- ============================================================
-- SMS Service Schema - Phase 7 Dunning Notifications
-- Description: Track SMS notifications for dunning and billing
-- Created: 2026-03-08
-- ============================================================

-- ============================================================
-- Table: sms_logs
-- Audit log for all SMS sent through the system
-- ============================================================
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Recipient and sender
  to_number TEXT NOT NULL,
  from_number TEXT,

  -- Message content
  message_body TEXT NOT NULL,
  message_template TEXT, -- 'dunning-initial', 'dunning-reminder', 'dunning-final', 'dunning-cancel', 'payment-confirmation'
  locale TEXT DEFAULT 'vi', -- 'vi' or 'en'

  -- Provider details (Twilio)
  provider_sid TEXT, -- Twilio Message SID
  provider_status TEXT, -- 'queued', 'sent', 'delivered', 'failed', 'undelivered'
  provider_error_code TEXT,
  provider_error_message TEXT,

  -- Context
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dunning_event_id UUID REFERENCES dunning_events(id) ON DELETE SET NULL,

  -- Delivery tracking
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  segments INTEGER DEFAULT 1, -- SMS segments (160 chars each)
  price NUMERIC(10, 4), -- Cost of SMS
  price_currency TEXT DEFAULT 'USD',

  -- Idempotency
  idempotency_key TEXT UNIQUE,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sms_logs_org ON sms_logs(org_id);
CREATE INDEX idx_sms_logs_user ON sms_logs(user_id);
CREATE INDEX idx_sms_logs_dunning ON sms_logs(dunning_event_id);
CREATE INDEX idx_sms_logs_status ON sms_logs(status, created_at);
CREATE INDEX idx_sms_logs_provider ON sms_logs(provider_sid);
CREATE INDEX idx_sms_logs_created ON sms_logs(created_at DESC);
CREATE INDEX idx_sms_logs_idempotency ON sms_logs(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Comment
COMMENT ON TABLE sms_logs IS 'Phase 7: Audit log for SMS notifications (dunning, billing, etc.)';

-- ============================================================
-- Table: sms_templates
-- Localized SMS message templates
-- ============================================================
CREATE TABLE IF NOT EXISTS sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template identification
  template_key TEXT NOT NULL UNIQUE, -- 'dunning_initial', 'dunning_reminder', etc.
  template_name TEXT NOT NULL,

  -- Localization
  locale TEXT NOT NULL DEFAULT 'vi', -- 'vi' or 'en'

  -- Message content
  message_template TEXT NOT NULL, -- SMS body with {{variables}}

  -- Variables supported: {{amount}}, {{plan_name}}, {{payment_url}}, {{days_until_suspension}}
  variables JSONB DEFAULT '[]'::jsonb,

  -- Character count (for segment calculation)
  char_count INTEGER,

  -- Active status
  is_active BOOLEAN DEFAULT TRUE,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sms_templates_key ON sms_templates(template_key);
CREATE INDEX idx_sms_templates_locale ON sms_templates(locale, is_active);

-- Comment
COMMENT ON TABLE sms_templates IS 'Phase 7: Localized SMS templates for dunning and billing notifications';

-- ============================================================
-- Table: sms_rate_limits
-- Rate limiting for SMS sending per org/user
-- ============================================================
CREATE TABLE IF NOT EXISTS sms_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Rate limit scope
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT, -- Rate limit per recipient number

  -- Window tracking
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,

  -- Counters
  sms_count INTEGER DEFAULT 0,

  -- Limits
  max_sms_per_window INTEGER DEFAULT 10, -- Default: 10 SMS per window
  window_type TEXT DEFAULT 'hourly', -- 'hourly', 'daily'

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast rate limit lookups
CREATE INDEX idx_sms_rate_limits_org ON sms_rate_limits(org_id);
CREATE INDEX idx_sms_rate_limits_user ON sms_rate_limits(user_id);
CREATE INDEX idx_sms_rate_limits_window ON sms_rate_limits(window_start, window_end);
CREATE UNIQUE INDEX idx_sms_rate_limits_unique ON sms_rate_limits(org_id, user_id, phone_number, window_start);

-- Comment
COMMENT ON TABLE sms_rate_limits IS 'Phase 7: Rate limiting for SMS sending to prevent abuse';

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_rate_limits ENABLE ROW LEVEL SECURITY;

-- SMS logs: Users can view their org's logs
CREATE POLICY "Users can view org SMS logs"
  ON sms_logs
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- SMS logs: Service role can manage
CREATE POLICY "Service role manages SMS logs"
  ON sms_logs
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- SMS templates: Anyone can view active templates
CREATE POLICY "Anyone can view active SMS templates"
  ON sms_templates
  FOR SELECT
  USING (is_active = TRUE);

-- SMS templates: Service role can manage
CREATE POLICY "Service role manages SMS templates"
  ON sms_templates
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- SMS rate limits: Service role only
CREATE POLICY "Service role manages SMS rate limits"
  ON sms_rate_limits
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================
-- Functions and Triggers
-- ============================================================

-- Function: Check SMS rate limit
CREATE OR REPLACE FUNCTION check_sms_rate_limit(
  p_org_id UUID,
  p_user_id UUID,
  p_phone_number TEXT,
  p_window_type TEXT DEFAULT 'hourly'
)
RETURNS TABLE (
  allowed BOOLEAN,
  current_count INTEGER,
  max_allowed INTEGER,
  reset_at TIMESTAMPTZ
) AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_window_end TIMESTAMPTZ;
  v_current_count INTEGER;
  v_max_allowed INTEGER;
BEGIN
  -- Calculate window boundaries
  IF p_window_type = 'hourly' THEN
    v_window_start := DATE_TRUNC('hour', NOW());
    v_window_end := v_window_start + INTERVAL '1 hour';
    v_max_allowed := 10; -- 10 SMS per hour
  ELSIF p_window_type = 'daily' THEN
    v_window_start := DATE_TRUNC('day', NOW());
    v_window_end := v_window_start + INTERVAL '1 day';
    v_max_allowed := 50; -- 50 SMS per day
  ELSE
    v_window_start := DATE_TRUNC('hour', NOW());
    v_window_end := v_window_start + INTERVAL '1 hour';
    v_max_allowed := 10;
  END IF;

  -- Get current count
  SELECT COALESCE(SUM(sms_count), 0) INTO v_current_count
  FROM sms_rate_limits
  WHERE org_id = p_org_id
    AND user_id = p_user_id
    AND (phone_number IS NULL OR phone_number = p_phone_number)
    AND window_start = v_window_start
    AND window_type = p_window_type;

  -- Return result
  RETURN QUERY
  SELECT
    (v_current_count < v_max_allowed) AS allowed,
    v_current_count AS current_count,
    v_max_allowed AS max_allowed,
    v_window_end AS reset_at;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Log SMS send attempt
CREATE OR REPLACE FUNCTION log_sms_send(
  p_to_number TEXT,
  p_message_body TEXT,
  p_message_template TEXT,
  p_locale TEXT DEFAULT 'vi',
  p_org_id UUID,
  p_user_id UUID,
  p_dunning_event_id UUID DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_sms_id UUID;
BEGIN
  INSERT INTO sms_logs (
    to_number,
    from_number,
    message_body,
    message_template,
    locale,
    org_id,
    user_id,
    dunning_event_id,
    status,
    idempotency_key,
    metadata
  ) VALUES (
    p_to_number,
    NULL, -- Will be set after Twilio response
    p_message_body,
    p_message_template,
    p_locale,
    p_org_id,
    p_user_id,
    p_dunning_event_id,
    'pending',
    p_idempotency_key,
    jsonb_build_object('created_from', 'sms_send_function')
  )
  ON CONFLICT (idempotency_key) DO UPDATE
  SET updated_at = NOW()
  RETURNING id INTO v_sms_id;

  -- Update rate limit counter
  INSERT INTO sms_rate_limits (
    org_id,
    user_id,
    phone_number,
    window_start,
    window_end,
    sms_count,
    window_type
  ) VALUES (
    p_org_id,
    p_user_id,
    p_to_number,
    DATE_TRUNC('hour', NOW()),
    DATE_TRUNC('hour', NOW()) + INTERVAL '1 hour',
    1,
    'hourly'
  )
  ON CONFLICT (org_id, user_id, phone_number, window_start)
  DO UPDATE SET
    sms_count = sms_rate_limits.sms_count + 1,
    updated_at = NOW();

  RETURN v_sms_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Update SMS delivery status
CREATE OR REPLACE FUNCTION update_sms_status(
  p_sms_id UUID,
  p_status TEXT,
  p_provider_sid TEXT DEFAULT NULL,
  p_provider_status TEXT DEFAULT NULL,
  p_error_code TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_segments INTEGER DEFAULT NULL,
  p_price NUMERIC DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE sms_logs
  SET status = p_status,
      provider_sid = COALESCE(p_provider_sid, provider_sid),
      provider_status = COALESCE(p_provider_status, provider_status),
      provider_error_code = COALESCE(p_error_code, provider_error_code),
      provider_error_message = COALESCE(p_error_message, provider_error_message),
      segments = COALESCE(p_segments, segments),
      price = COALESCE(p_price, price),
      sent_at = CASE WHEN p_status = 'sent' THEN NOW() ELSE sent_at END,
      delivered_at = CASE WHEN p_status = 'delivered' THEN NOW() ELSE delivered_at END,
      updated_at = NOW()
  WHERE id = p_sms_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function: Get SMS template
CREATE OR REPLACE FUNCTION get_sms_template(
  p_template_key TEXT,
  p_locale TEXT DEFAULT 'vi'
)
RETURNS sms_templates AS $$
DECLARE
  v_template sms_templates;
BEGIN
  SELECT * INTO v_template
  FROM sms_templates
  WHERE template_key = p_template_key
    AND locale = p_locale
    AND is_active = TRUE;

  -- Fallback to English if locale not found
  IF v_template.id IS NULL AND p_locale != 'en' THEN
    SELECT * INTO v_template
    FROM sms_templates
    WHERE template_key = p_template_key
      AND locale = 'en'
      AND is_active = TRUE;
  END IF;

  RETURN v_template;
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger: Auto-update updated_at
CREATE TRIGGER trg_update_sms_logs_updated_at
  BEFORE UPDATE ON sms_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_dunning_updated_at();

CREATE TRIGGER trg_update_sms_templates_updated_at
  BEFORE UPDATE ON sms_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_dunning_updated_at();

-- ============================================================
-- Views for Dashboard
-- ============================================================

-- View: Recent SMS activity
CREATE OR REPLACE VIEW sms_activity AS
SELECT
  sl.id,
  sl.to_number,
  sl.message_template,
  sl.locale,
  sl.status,
  sl.provider_status,
  sl.segments,
  sl.price,
  sl.org_id,
  sl.user_id,
  sl.dunning_event_id,
  o.name as org_name,
  u.email as user_email,
  sl.created_at
FROM sms_logs sl
LEFT JOIN organizations o ON sl.org_id = o.id
LEFT JOIN auth.users u ON sl.user_id = u.id
ORDER BY sl.created_at DESC
LIMIT 100;

-- View: SMS statistics
CREATE OR REPLACE VIEW sms_statistics AS
SELECT
  COUNT(*) as total_sms_sent,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered_count,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE locale = 'vi') as vi_count,
  COUNT(*) FILTER (WHERE locale = 'en') as en_count,
  SUM(price) FILTER (WHERE price IS NOT NULL) as total_cost,
  AVG(price) FILTER (WHERE price IS NOT NULL) as avg_cost_per_sms,
  COUNT(DISTINCT org_id) as unique_orgs,
  COUNT(DISTINCT user_id) as unique_users
FROM sms_logs;

-- ============================================================
-- Seed default SMS templates (Vietnamese)
-- ============================================================
INSERT INTO sms_templates (template_key, template_name, locale, message_template, variables, is_active) VALUES
  ('dunning_initial', 'Dunning - Payment Failed (Initial)', 'vi',
   '⚠️ WellNexus: Thanh toan that bai so tien {{amount}} cho goi {{plan_name}}. Cap nhat phuong thuc thanh toan: {{payment_url}}',
   '["amount", "plan_name", "payment_url"]', TRUE),

  ('dunning_reminder', 'Dunning - Payment Reminder', 'vi',
   '🔔 WellNexus: Nhac nho: Thanh toan qua han {{amount}}. Dich vu se bi tam ngưng sau {{days_until_suspension}} ngay neu khong thanh toan. Cap nhat ngay: {{payment_url}}',
   '["amount", "days_until_suspension", "payment_url"]', TRUE),

  ('dunning_final', 'Dunning - Final Notice', 'vi',
   '🚨 WellNexus: Canh bao cuoi! Subscription cua ban se bi dinh chi trong {{days_until_suspension}} ngay. Thanh toan ngay: {{payment_url}}',
   '["days_until_suspension", "payment_url"]', TRUE),

  ('dunning_cancel', 'Dunning - Cancellation Notice', 'vi',
   '❌ WellNexus: Subscription da bi huy do thanh toan that bai. Lien he support@wellnexus.vn de duoc ho tro.',
   '[]', TRUE),

  ('payment_confirmation', 'Payment Confirmation', 'vi',
   '✅ WellNexus: Da nhan thanh toan {{amount}}. Subscription cua ban da duockich hoat lai. Cam on ban!',
   '["amount"]', TRUE);

-- ============================================================
-- Seed default SMS templates (English)
-- ============================================================
INSERT INTO sms_templates (template_key, template_name, locale, message_template, variables, is_active) VALUES
  ('dunning_initial', 'Dunning - Payment Failed (Initial)', 'en',
   '⚠️ WellNexus: Payment failed for {{amount}} on your {{plan_name}} subscription. Update payment: {{payment_url}}',
   '["amount", "plan_name", "payment_url"]', TRUE),

  ('dunning_reminder', 'Dunning - Payment Reminder', 'en',
   '🔔 WellNexus: Payment overdue {{amount}}. Service will be suspended in {{days_until_suspension}} days. Update now: {{payment_url}}',
   '["amount", "days_until_suspension", "payment_url"]', TRUE),

  ('dunning_final', 'Dunning - Final Notice', 'en',
   '🚨 WellNexus: Final notice! Your subscription will be suspended in {{days_until_suspension}} days. Pay now: {{payment_url}}',
   '["days_until_suspension", "payment_url"]', TRUE),

  ('dunning_cancel', 'Dunning - Cancellation Notice', 'en',
   '❌ WellNexus: Your subscription has been canceled due to failed payment. Contact support@wellnexus.vn for assistance.',
   '[]', TRUE),

  ('payment_confirmation', 'Payment Confirmation', 'en',
   '✅ WellNexus: Payment of {{amount}} received. Your subscription has been reactivated. Thank you!',
   '["amount"]', TRUE);

-- ============================================================
-- End of Migration
-- ============================================================
