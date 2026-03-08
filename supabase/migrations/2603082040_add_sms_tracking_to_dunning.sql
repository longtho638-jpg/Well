-- ============================================================
-- Add SMS Tracking to Dunning Events
-- Description: Add SMS notification tracking fields for dunning
-- Created: 2026-03-08
-- ============================================================

-- Add SMS tracking columns to dunning_events
ALTER TABLE dunning_events
ADD COLUMN IF NOT EXISTS sms_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sms_template TEXT,
ADD COLUMN IF NOT EXISTS sms_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sms_sid TEXT, -- Twilio SID
ADD COLUMN IF NOT EXISTS sms_clicked BOOLEAN DEFAULT FALSE;

-- Add SMS settings to dunning_config
ALTER TABLE dunning_config
ADD COLUMN IF NOT EXISTS auto_send_sms BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sms_sequence JSONB DEFAULT '[
  {"stage": "initial", "day": 0, "template": "dunning-initial"},
  {"stage": "reminder", "day": 2, "template": "dunning-reminder"},
  {"stage": "final", "day": 5, "template": "dunning-final"}
]'::jsonb;

-- Index for SMS tracking
CREATE INDEX IF NOT EXISTS idx_dunning_sms_sent ON dunning_events(sms_sent);

-- Comment
COMMENT ON COLUMN dunning_events.sms_sid IS 'Twilio message SID for tracking delivery status';

-- Update get_pending_dunning_emails to include SMS info
CREATE OR REPLACE FUNCTION get_pending_dunning_notifications()
RETURNS TABLE (
  dunning_id UUID,
  org_id UUID,
  user_id UUID,
  email_template TEXT,
  sms_template TEXT,
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
    CASE
      WHEN de.dunning_stage = 'initial' THEN 'dunning-initial'
      WHEN de.dunning_stage = 'reminder' THEN 'dunning-reminder'
      WHEN de.dunning_stage = 'final' THEN 'dunning-final'
      ELSE NULL
    END::TEXT as sms_template,
    de.amount_owed,
    de.payment_url,
    EXTRACT(DAY FROM NOW() - de.created_at)::INTEGER as days_since_failure
  FROM dunning_events de
  JOIN dunning_config dc ON de.org_id = dc.org_id
  WHERE de.resolved = FALSE
    AND dc.enabled = TRUE
  ORDER BY de.created_at ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Mark SMS as sent
CREATE OR REPLACE FUNCTION mark_sms_sent(
  p_dunning_id UUID,
  p_sms_template TEXT,
  p_sms_sid TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE dunning_events
  SET sms_sent = TRUE,
      sms_template = p_sms_template,
      sms_sid = p_sms_sid,
      sms_sent_at = NOW(),
      updated_at = NOW()
  WHERE id = p_dunning_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function: Update SMS click tracking
CREATE OR REPLACE FUNCTION track_sms_click(
  p_sms_sid TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE dunning_events
  SET sms_clicked = TRUE
  WHERE sms_sid = p_sms_sid;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
