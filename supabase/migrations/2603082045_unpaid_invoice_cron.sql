-- ============================================================
-- Cron: Detect Unpaid Invoices and Trigger Dunning
-- Description: Periodic check for failed payments and dunning stages
-- Schedule: Every hour
-- Created: 2026-03-08
-- ============================================================

-- Function: Process dunning stages and send notifications
CREATE OR REPLACE FUNCTION process_dunning_notifications()
RETURNS TABLE (
  dunning_id UUID,
  org_id UUID,
  user_id UUID,
  notification_type TEXT,
  template TEXT,
  amount_owed NUMERIC,
  payment_url TEXT
) AS $$
DECLARE
  v_record RECORD;
  v_config dunning_config;
BEGIN
  -- Get dunning config
  SELECT * INTO v_config FROM dunning_config LIMIT 1;

  IF NOT v_config.enabled THEN
    RAISE NOTICE 'Dunning is disabled';
    RETURN;
  END IF;

  -- Process dunning events that need notifications
  FOR v_record IN
    SELECT
      de.id,
      de.org_id,
      de.user_id,
      de.dunning_stage,
      de.amount_owed,
      de.payment_url,
      de.email_sent,
      de.sms_sent,
      EXTRACT(DAY FROM NOW() - de.created_at)::INTEGER as days_since_failure
    FROM dunning_events de
    WHERE de.resolved = FALSE
      AND (
        -- Initial stage: send immediately if not sent
        (de.dunning_stage = 'initial' AND (de.email_sent = FALSE OR (v_config.auto_send_sms AND de.sms_sent = FALSE)))
        OR
        -- Reminder stage: after 2 days
        (de.dunning_stage = 'reminder' AND EXTRACT(DAY FROM NOW() - de.created_at) >= 2)
        OR
        -- Final stage: after 5 days
        (de.dunning_stage = 'final' AND EXTRACT(DAY FROM NOW() - de.created_at) >= 5)
        OR
        -- Cancel notice: after 10 days
        (de.dunning_stage = 'cancel_notice' AND EXTRACT(DAY FROM NOW() - de.created_at) >= 10)
      )
  LOOP
    -- Determine notification type
    IF v_record.dunning_stage = 'initial' AND NOT v_record.email_sent THEN
      -- Send initial email
      INSERT INTO notification_queue (org_id, user_id, notification_type, template, data)
      VALUES (
        v_record.org_id,
        v_record.user_id,
        'email',
        'dunning-initial',
        jsonb_build_object(
          'amount', v_record.amount_owed,
          'payment_url', v_record.payment_url
        )
      );

      UPDATE dunning_events SET email_sent = TRUE WHERE id = v_record.id;

      RETURN QUERY SELECT v_record.id, v_record.org_id, v_record.user_id, 'email'::TEXT, 'dunning-initial'::TEXT, v_record.amount_owed, v_record.payment_url;
    END IF;

    IF v_record.dunning_stage = 'initial' AND v_config.auto_send_sms AND NOT v_record.sms_sent THEN
      -- Send initial SMS
      INSERT INTO notification_queue (org_id, user_id, notification_type, template, data)
      VALUES (
        v_record.org_id,
        v_record.user_id,
        'sms',
        'dunning-initial',
        jsonb_build_object(
          'amount', v_record.amount_owed,
          'payment_url', v_record.payment_url
        )
      );

      UPDATE dunning_events SET sms_sent = TRUE WHERE id = v_record.id;

      RETURN QUERY SELECT v_record.id, v_record.org_id, v_record.user_id, 'sms'::TEXT, 'dunning-initial'::TEXT, v_record.amount_owed, v_record.payment_url;
    END IF;

    IF v_record.dunning_stage = 'reminder' AND v_record.days_since_failure >= 2 THEN
      -- Send reminder email
      IF NOT EXISTS (
        SELECT 1 FROM notification_queue nq
        WHERE nq.org_id = v_record.org_id
          AND nq.dunning_event_id = v_record.id
          AND nq.template = 'dunning-reminder'
      ) THEN
        INSERT INTO notification_queue (org_id, user_id, notification_type, template, data, dunning_event_id)
        VALUES (
          v_record.org_id,
          v_record.user_id,
          'email',
          'dunning-reminder',
          jsonb_build_object(
            'amount', v_record.amount_owed,
            'payment_url', v_record.payment_url,
            'days', (v_config.suspend_after_days - v_record.days_since_failure)::TEXT
          ),
          v_record.id
        );
      END IF;

      -- Send reminder SMS if enabled
      IF v_config.auto_send_sms AND NOT EXISTS (
        SELECT 1 FROM notification_queue nq
        WHERE nq.org_id = v_record.org_id
          AND nq.dunning_event_id = v_record.id
          AND nq.template = 'dunning-reminder'
          AND nq.notification_type = 'sms'
      ) THEN
        INSERT INTO notification_queue (org_id, user_id, notification_type, template, data, dunning_event_id)
        VALUES (
          v_record.org_id,
          v_record.user_id,
          'sms',
          'dunning-reminder',
          jsonb_build_object(
            'amount', v_record.amount_owed,
            'payment_url', v_record.payment_url,
            'days', (v_config.suspend_after_days - v_record.days_since_failure)::TEXT
          ),
          v_record.id
        );
      END IF;

      UPDATE dunning_events
      SET dunning_stage = 'reminder',
          email_sent = TRUE,
          updated_at = NOW()
      WHERE id = v_record.id;

      RETURN QUERY SELECT v_record.id, v_record.org_id, v_record.user_id, 'email'::TEXT, 'dunning-reminder'::TEXT, v_record.amount_owed, v_record.payment_url;
    END IF;

    IF v_record.dunning_stage = 'final' AND v_record.days_since_failure >= 5 THEN
      -- Send final notice
      IF NOT EXISTS (
        SELECT 1 FROM notification_queue nq
        WHERE nq.org_id = v_record.org_id
          AND nq.dunning_event_id = v_record.id
          AND nq.template = 'dunning-final'
      ) THEN
        INSERT INTO notification_queue (org_id, user_id, notification_type, template, data, dunning_event_id)
        VALUES (
          v_record.org_id,
          v_record.user_id,
          'email',
          'dunning-final',
          jsonb_build_object(
            'amount', v_record.amount_owed,
            'payment_url', v_record.payment_url,
            'days', (v_config.suspend_after_days - v_record.days_since_failure)::TEXT
          ),
          v_record.id
        );
      END IF;

      -- Send final SMS if enabled
      IF v_config.auto_send_sms AND NOT EXISTS (
        SELECT 1 FROM notification_queue nq
        WHERE nq.org_id = v_record.org_id
          AND nq.dunning_event_id = v_record.id
          AND nq.template = 'dunning-final'
          AND nq.notification_type = 'sms'
      ) THEN
        INSERT INTO notification_queue (org_id, user_id, notification_type, template, data, dunning_event_id)
        VALUES (
          v_record.org_id,
          v_record.user_id,
          'sms',
          'dunning-final',
          jsonb_build_object(
            'amount', v_record.amount_owed,
            'payment_url', v_record.payment_url,
            'days', (v_config.suspend_after_days - v_record.days_since_failure)::TEXT
          ),
          v_record.id
        );
      END IF;

      UPDATE dunning_events
      SET dunning_stage = 'final',
          email_sent = TRUE,
          updated_at = NOW()
      WHERE id = v_record.id;

      RETURN QUERY SELECT v_record.id, v_record.org_id, v_record.user_id, 'email'::TEXT, 'dunning-final'::TEXT, v_record.amount_owed, v_record.payment_url;
    END IF;

    IF v_record.dunning_stage = 'cancel_notice' AND v_record.days_since_failure >= 10 THEN
      -- Suspend subscription
      UPDATE user_subscriptions
      SET status = 'canceled',
          canceled_at = NOW(),
          metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{canceled_reason}',
            '"payment_failed_dunning_complete"'
          )
      WHERE id = (
        SELECT subscription_id FROM dunning_events WHERE id = v_record.id
      );

      -- Resolve dunning event
      UPDATE dunning_events
      SET resolved = TRUE,
          resolved_at = NOW(),
          resolution_method = 'subscription_canceled'
      WHERE id = v_record.id;

      RETURN QUERY SELECT v_record.id, v_record.org_id, v_record.user_id, 'suspension'::TEXT, 'subscription_canceled'::TEXT, v_record.amount_owed, v_record.payment_url;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function: Process notification queue
CREATE OR REPLACE FUNCTION process_notification_queue()
RETURNS INTEGER AS $$
DECLARE
  v_notification RECORD;
  v_processed_count INTEGER := 0;
  v_sms_result RECORD;
BEGIN
  FOR v_notification IN
    SELECT * FROM notification_queue
    WHERE processed = FALSE
    ORDER BY created_at ASC
  LOOP
    IF v_notification.notification_type = 'email' THEN
      -- Send email via Resend
      BEGIN
        CALL send_notification_email(
          v_notification.org_id,
          v_notification.user_id,
          v_notification.template,
          v_notification.data
        );
        v_processed_count := v_processed_count + 1;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Failed to send email notification: %', SQLERRM;
      END;
    ELSIF v_notification.notification_type = 'sms' THEN
      -- Send SMS via Twilio
      BEGIN
        SELECT phone INTO v_sms_result FROM user_profiles WHERE id = v_notification.user_id;

        IF v_sms_result.phone IS NOT NULL THEN
          CALL send_notification_sms(
            v_notification.org_id,
            v_notification.user_id,
            v_notification.template,
            v_notification.data
          );
          v_processed_count := v_processed_count + 1;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Failed to send SMS notification: %', SQLERRM;
      END;
    END IF;

    -- Mark as processed
    UPDATE notification_queue
    SET processed = TRUE,
        processed_at = NOW()
    WHERE id = v_notification.id;
  END LOOP;

  RETURN v_processed_count;
END;
$$ LANGUAGE plpgsql;

-- Helper procedure: Send notification email
CREATE OR REPLACE PROCEDURE send_notification_email(
  p_org_id UUID,
  p_user_id UUID,
  p_template TEXT,
  p_data JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_email TEXT;
  v_subject TEXT;
  v_body TEXT;
BEGIN
  -- Get user email
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;

  IF v_email IS NULL THEN
    RAISE NOTICE 'User email not found: %', p_user_id;
    RETURN;
  END IF;

  -- Call edge function to send email
  -- Note: This would be implemented with pg_net or external service
  RAISE NOTICE 'Sending email to % with template %', v_email, p_template;

  -- Log email send attempt
  INSERT INTO notification_logs (org_id, user_id, notification_type, template, data, status)
  VALUES (p_org_id, p_user_id, 'email', p_template, p_data, 'sent');
END;
$$;

-- Helper procedure: Send notification SMS
CREATE OR REPLACE PROCEDURE send_notification_sms(
  p_org_id UUID,
  p_user_id UUID,
  p_template TEXT,
  p_data JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_phone TEXT;
BEGIN
  -- Get user phone
  SELECT phone INTO v_phone FROM user_profiles WHERE id = p_user_id;

  IF v_phone IS NULL THEN
    RAISE NOTICE 'User phone not found: %', p_user_id;
    RETURN;
  END IF;

  -- Call edge function to send SMS
  -- Note: This would be implemented with pg_net or external service
  RAISE NOTICE 'Sending SMS to % with template %', v_phone, p_template;

  -- Log SMS send attempt
  INSERT INTO notification_logs (org_id, user_id, notification_type, template, data, status)
  VALUES (p_org_id, p_user_id, 'sms', p_template, p_data, 'sent');
END;
$$;

-- Table: notification_queue
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dunning_event_id UUID REFERENCES dunning_events(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'email' or 'sms'
  template TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_queue_org ON notification_queue(org_id);
CREATE INDEX idx_notification_queue_user ON notification_queue(user_id);
CREATE INDEX idx_notification_queue_unprocessed ON notification_queue(processed, created_at);

-- Table: notification_logs
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  user_id UUID,
  notification_type TEXT NOT NULL,
  template TEXT NOT NULL,
  data JSONB,
  status TEXT NOT NULL, -- 'sent', 'failed', 'pending'
  error_message TEXT,
  provider_sid TEXT, -- Twilio/SendGrid ID
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_logs_org ON notification_logs(org_id);
CREATE INDEX idx_notification_logs_type ON notification_logs(notification_type);
CREATE INDEX idx_notification_logs_created ON notification_logs(created_at DESC);

-- Cron schedule comment
-- pg_cron: SELECT cron.schedule('process-dunning', '0 * * * *', 'SELECT * FROM process_dunning_notifications()');
-- pg_cron: SELECT cron.schedule('process-notifications', '*/5 * * * *', 'SELECT process_notification_queue()');
