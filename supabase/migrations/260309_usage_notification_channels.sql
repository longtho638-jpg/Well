-- Phase 7: Usage Notification Channels Schema
-- Purpose: Support multi-channel notifications (email, SMS, webhook) for usage thresholds
-- Date: 2026-03-09

-- User notification preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Channel preferences
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  webhook_enabled BOOLEAN NOT NULL DEFAULT true,
  webhook_url TEXT,

  -- Threshold preferences
  min_threshold SMALLINT NOT NULL DEFAULT 80 CHECK (min_threshold IN (80, 90, 100)),

  -- Metadata and timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX idx_user_notification_prefs_user_id ON user_notification_preferences(user_id);
CREATE INDEX idx_user_notification_prefs_org_id ON user_notification_preferences(org_id);

-- Row Level Security (RLS) Policies
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view own preferences"
  ON user_notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
  ON user_notification_preferences
  FOR ALL
  USING (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service role full access"
  ON user_notification_preferences
  FOR ALL
  USING (true);

-- Usage alert events table (for audit trail and cooldown tracking)
CREATE TABLE IF NOT EXISTS usage_alert_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Alert details
  metric_type TEXT NOT NULL,
  threshold_percentage SMALLINT NOT NULL CHECK (threshold_percentage IN (80, 90, 100)),
  current_usage BIGINT NOT NULL,
  quota_limit BIGINT NOT NULL,

  -- Channels sent
  channels_sent TEXT[] NOT NULL DEFAULT '{}',

  -- Cooldown tracking
  cooldown_until TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour',

  -- Metadata and timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance and cooldown checks
CREATE INDEX idx_usage_alerts_user_metric ON usage_alert_events(user_id, metric_type, threshold_percentage);
CREATE INDEX idx_usage_alerts_cooldown ON usage_alert_events(user_id, metric_type, threshold_percentage, cooldown_until);
CREATE INDEX idx_usage_alerts_created_at ON usage_alert_events(created_at DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE usage_alert_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own alert events
CREATE POLICY "Users can view own alert events"
  ON usage_alert_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert alert events
CREATE POLICY "Service role can insert alert events"
  ON usage_alert_events
  FOR INSERT
  WITH CHECK (true);

-- Notification events table (for detailed delivery tracking)
CREATE TABLE IF NOT EXISTS notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Channel details
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'webhook')),
  metric_type TEXT NOT NULL,
  threshold_percentage SMALLINT NOT NULL CHECK (threshold_percentage IN (80, 90, 100)),
  recipient TEXT NOT NULL,

  -- Delivery tracking
  message_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,

  -- Metadata and timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_notification_events_user_id ON notification_events(user_id);
CREATE INDEX idx_notification_events_channel ON notification_events(channel);
CREATE INDEX idx_notification_events_status ON notification_events(status);
CREATE INDEX idx_notification_events_created_at ON notification_events(created_at DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own notification events
CREATE POLICY "Users can view own notification events"
  ON notification_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert notification events
CREATE POLICY "Service role can insert notification events"
  ON notification_events
  FOR INSERT
  WITH CHECK (true);

-- Function to check notification cooldown (for multi-channel notifications)
CREATE OR REPLACE FUNCTION check_notification_cooldown(
  p_user_id UUID,
  p_metric_type TEXT,
  p_threshold_percentage SMALLINT,
  p_cooldown_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  v_cooldown_until TIMESTAMPTZ;
BEGIN
  -- Get the most recent cooldown_until for this user/metric/threshold
  SELECT cooldown_until INTO v_cooldown_until
  FROM usage_alert_events
  WHERE user_id = p_user_id
    AND metric_type = p_metric_type
    AND threshold_percentage = p_threshold_percentage
  ORDER BY created_at DESC
  LIMIT 1;

  -- If no recent alert, can send
  IF v_cooldown_until IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Check if cooldown has expired
  RETURN NOW() > v_cooldown_until;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old notification data (run daily via cron)
CREATE OR REPLACE FUNCTION cleanup_old_notification_data()
RETURNS void AS $$
BEGIN
  -- Delete usage alert events older than 30 days
  DELETE FROM usage_alert_events
  WHERE created_at < NOW() - INTERVAL '30 days';

  -- Delete notification events older than 30 days
  DELETE FROM notification_events
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON usage_alert_events TO authenticated;
GRANT ALL ON usage_alert_events TO service_role;
GRANT SELECT ON notification_events TO authenticated;
GRANT ALL ON notification_events TO service_role;
GRANT ALL ON user_notification_preferences TO authenticated;
GRANT ALL ON user_notification_preferences TO service_role;

-- Comments for documentation
COMMENT ON TABLE user_notification_preferences IS 'Phase 7: User preferences for multi-channel usage notifications (email/SMS/webhook)';
COMMENT ON TABLE usage_alert_events IS 'Phase 7: Audit trail for usage threshold alerts with cooldown tracking';
COMMENT ON TABLE notification_events IS 'Phase 7: Detailed delivery tracking for each notification channel';
COMMENT ON FUNCTION check_notification_cooldown IS 'Check if notification cooldown period has expired for user/metric/threshold';
COMMENT ON FUNCTION cleanup_old_notification_data IS 'Daily cleanup of notification data older than 30 days';
