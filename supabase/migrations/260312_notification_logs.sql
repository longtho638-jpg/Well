-- Phase 3.5: Notification Logs Schema
-- Purpose: Track notification delivery across all channels (email, webhook, SMS, custom)
-- Date: 2026-03-12

-- Notification logs table
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Channel and event details
  channel TEXT NOT NULL CHECK (channel IN ('email', 'webhook', 'sms', 'custom_endpoint')),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,

  -- Delivery tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'retrying')),
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_org_id ON notification_logs(org_id);
CREATE INDEX idx_notification_logs_channel ON notification_logs(channel);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_event_type ON notification_logs(event_type);
CREATE INDEX idx_notification_logs_created_at ON notification_logs(created_at DESC);
CREATE INDEX idx_notification_logs_retry ON notification_logs(status, next_retry_at) WHERE status = 'retrying';

-- Row Level Security (RLS) Policies
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own notification logs
CREATE POLICY "Users can view own notification logs"
  ON notification_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service role full access"
  ON notification_logs
  FOR ALL
  USING (true);

-- Grant permissions
GRANT SELECT ON notification_logs TO authenticated;
GRANT ALL ON notification_logs TO service_role;

-- Comment for documentation
COMMENT ON TABLE notification_logs IS 'Phase 3.5: Track notification delivery across email, webhook, SMS, and custom endpoints';
