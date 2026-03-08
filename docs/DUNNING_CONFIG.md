# Dunning Configuration Guide - WellNexus RaaS

Complete guide for configuring and customizing the dunning workflow for payment failures.

---

## Table of Contents

1. [Overview](#overview)
2. [Dunning Sequence Configuration](#dunning-sequence-configuration)
3. [Email/SMS Templates](#email-sms-templates)
4. [Per-Org Configuration](#per-org-configuration)
5. [Cron Job Schedules](#cron-job-schedules)
6. [Rate Limiting](#rate-limiting)
7. [Advanced Configuration](#advanced-configuration)
8. [Monitoring & Analytics](#monitoring--analytics)
9. [Troubleshooting](#troubleshooting)

---

## Overview

Dunning is the automated process of following up with customers who have failed payments. The WellNexus dunning system:

- Automatically detects payment failures
- Sends multi-channel notifications (email + SMS)
- Progresses through stages at configured intervals
- Resolves when payment is made or subscription canceled

### Dunning Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Dunning Flow                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Payment Failed                                                 │
│       │                                                         │
│       ▼                                                         │
│  ┌──────────┐                                                   │
│  │ Initial  │───[2 days]──▶ Remind                              │
│  │  Stage   │       │                  │                        │
│  └──────────┘       ▼                  ▼                        │
│       │        ┌──────────┐       ┌──────────┐                  │
│       │        │ Reminder │──[5d]─▶  Final   │                  │
│       │        └──────────┘       └──────────┘                  │
│       │                │                  │                      │
│       │                ▼                  ▼                      │
│       │        ┌────────────────┐  ┌────────────────┐            │
│       │        │ Final Notice   │  │ Cancel Notice  │            │
│       │        │  [10+ days]    │  │  [14+ days]    │            │
│       │        └────────────────┘  └────────────────┘            │
│       │                    │                  │                  │
│       │                    ▼                  ▼                   │
│       │              ┌─────────────┐  ┌─────────────┐            │
│       └─────────────▶│ Suspension  │  │ Cancellation│            │
│                      │  Triggered  │  │  Applied    │            │
│                      └─────────────┘  └─────────────┘            │
│                                                                 │
│  Resolution (Payment Made)                                      │
│       │                                                         │
│       ▼                                                         │
│  ┌──────────────┐                                               │
│  │ Dunning      │──▶ Subscription Active                       │
│  │ Resolved     │                                               │
│  └──────────────┘                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Dunning Sequence Configuration

### Default Sequence

The default dunning sequence is:

| Stage | Day | Email Template | SMS Template | Description |
|-------|-----|----------------|--------------|-------------|
| `initial` | 0 | dunning-initial | dunning_initial | First notification of failure |
| `reminder` | 2 | dunning-reminder | dunning_reminder | Follow-up after 2 days |
| `final` | 5 | dunning-final | dunning_final | Final warning before suspension |
| `cancel_notice` | 10 | dunning-cancel | dunning_cancel | Disruption notice |
| `suspended` | 14 | - | - | Service suspended |

### Configuration Example

```json
{
  "enabled": true,
  "max_retry_days": 14,
  "retry_interval_days": 2,
  "grace_period_days": 5,
  "auto_send_emails": true,
  "auto_send_sms": true,
  "auto_suspend": true,
  "suspend_after_days": 14,
  "email_sequence": [
    {"stage": "initial", "day": 0, "template": "dunning-initial"},
    {"stage": "reminder", "day": 2, "template": "dunning-reminder"},
    {"stage": "final", "day": 5, "template": "dunning-final"},
    {"stage": "cancel_notice", "day": 10, "template": "dunning-cancel"}
  ]
}
```

### Customizing the Sequence

To modify the default sequence, update the `dunning_config.email_sequence`:

```sql
-- Update default sequence (applies to new orgs)
UPDATE dunning_config
SET email_sequence = $$
[
  {"stage": "initial", "day": 0, "template": "dunning-initial"},
  {"stage": "reminder", "day": 3, "template": "dunning-reminder"},
  {"stage": "final", "day": 7, "template": "dunning-final"},
  {"stage": "cancel_notice", "day": 14, "template": "dunning-cancel"}
]
$$::jsonb;
```

### Adjusting Stage Timing

To change timing between stages, modify `retry_interval_days`:

| Setting | Default | Description |
|---------|---------|-------------|
| `retry_interval_days` | 2 | Days between email/SMS sends |
| `grace_period_days` | 5 | Buffer before first dunning action |
| `max_retry_days` | 14 | Total dunning period |

Example: Faster sequence for higher ticket items

```sql
-- For premium/enterprise orgs, shorter retry intervals
UPDATE dunning_config
SET retry_interval_days = 1,  -- Send daily instead of every 2 days
    max_retry_days = 7        -- Shorter overall period
WHERE org_id = 'enterprise-org-id';
```

---

## Email/SMS Templates

### Email Template Variables

All email templates support these variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{userName}}` | Customer's name | "John" |
| `{{amount}}` | Amount owed | "$99.00" |
| `{{invoiceId}}` | Stripe invoice ID | "inv_123456" |
| `{{planName}}` | Subscription plan | "Pro Plan" |
| `{{paymentUrl}}` | Customer portal URL | "https://..." |
| `{{daysUntilSuspension}}` | Days before suspension | "14" |

### Email Subject Lines

Default subject lines (customizable in template):

| Stage | Subject |
|-------|---------|
| `initial` | "⚠️ Payment Failed - ${{amount}}" |
| `reminder` | "🔔 Reminder: Payment Overdue" |
| `final` | "🚨 Final Notice - Suspension in {{days}} days" |
| `cancel` | "❌ Subscription Canceled" |

### SMS Template Variables

SMS templates support fewer variables due to character limits:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{amount}}` | Amount owed | "$99.00" |
| `{{days}}` | Days remaining | "12" |
| `{{payment_url}}` | Payment link | "https://..." |
| `{{account}}` | Account name | "WellNexus" |

### SMS Message Templates

```sql
-- Vietnamese templates
INSERT INTO sms_templates (code, name, message_vn, message_en) VALUES
-- Initial dunning SMS
('dunning_initial', 'Dunning Initial',
 '{{account}}: Thanh toan that bai ${{amount}}. Cap nhat phuong thuc tai: {{payment_url}}',
 '{{account}}: Payment failed ${{amount}}. Update at: {{payment_url}}'),

-- Reminder SMS
('dunning_reminder', 'Dunning Reminder',
 '{{account}}: Nhoc nhrop ${{amount}}. Cap nhat tai: {{payment_url}}. Con {{days}} ngay',
 '{{account}}: Reminder ${{amount}}. Update at: {{payment_url}}. {{days}} days left'),

-- Final SMS
('dunning_final', 'Dunning Final',
 '{{account}}: Canh bao cuoi ${{amount}}. Suspend {{days}} days. {{payment_url}}',
 '{{account}}: Final notice ${{amount}}. Suspend in {{days}} days. {{payment_url}}'),

-- Cancel SMS
('dunning_cancel', 'Subscription Canceled',
 '{{account}}: Subscription da bi huy. Kh phục tai: {{payment_url}}',
 '{{account}}: Subscription canceled. Recover at: {{payment_url}}'),

-- Payment confirmation SMS
('payment_confirmation', 'Payment Confirmation',
 '{{account}}: Thanh toan ${{amount}} thanh cong. Cam on!',
 '{{account}}: Payment ${{amount}} received. Thank you!');
```

### Customizing Templates

Update templates via Supabase dashboard or SQL:

```sql
-- Update Vietnamese email template
UPDATE dunning_config
SET email_sequence = jsonb_set(
  email_sequence::jsonb,
  '{0}',
  '{"stage": "initial", "day": 0, "template": "dunning-initial-vn"}'::jsonb
)
WHERE org_id = 'custom-org-id';
```

### Multi-Language Support

Configure templates per language:

```sql
-- Vietnamese org
INSERT INTO dunning_config (org_id, enabled, email_sequence) VALUES
('org-vn', true, $$
[
  {"stage": "initial", "day": 0, "template": "dunning-initial-vn"},
  {"stage": "reminder", "day": 2, "template": "dunning-reminder-vn"}
]
$$::jsonb);

-- English org
INSERT INTO dunning_config (org_id, enabled, email_sequence) VALUES
('org-en', true, $$
[
  {"stage": "initial", "day": 0, "template": "dunning-initial-en"},
  {"stage": "reminder", "day": 2, "template": "dunning-reminder-en"}
]
$$::jsonb);
```

---

## Per-Org Configuration

### Default Configuration

New organizations automatically get this configuration:

```sql
-- Default dunning config
INSERT INTO dunning_config (
  enabled,
  max_retry_days,
  retry_interval_days,
  grace_period_days,
  auto_send_emails,
  auto_send_sms,
  auto_suspend,
  suspend_after_days
) VALUES (
  true,           -- Enable dunning
  14,             -- Max 14 days of dunning
  2,              -- Every 2 days
  5,              -- 5 day grace period
  true,           -- Send emails
  true,           -- Send SMS
  true,           -- Auto suspend
  14              -- Suspend after 14 days
) ON CONFLICT (org_id) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  max_retry_days = EXCLUDED.max_retry_days;
```

### Customizing Per Organization

Override defaults per org:

```sql
-- Enterprise tier: More lenient dunning
UPDATE dunning_config SET
  enabled = true,
  max_retry_days = 21,           -- Longer period
  retry_interval_days = 3,       -- Less frequent
  grace_period_days = 10,        -- Longer grace
  suspend_after_days = 21        -- Later suspension
WHERE org_id = 'enterprise-org-id';

-- Freelancer tier: Aggressive dunning
UPDATE dunning_config SET
  enabled = true,
  max_retry_days = 7,            -- Shorter period
  retry_interval_days = 1,       -- Daily notices
  grace_period_days = 2,         -- No grace
  suspend_after_days = 7         -- Immediate suspension
WHERE org_id = 'freelancer-org-id';
```

### Disabling Dunning Per Org

```sql
-- Disable dunning for specific org
UPDATE dunning_config
SET enabled = false,
    auto_send_emails = false,
    auto_send_sms = false
WHERE org_id = 'exempt-org-id';

-- Disable only SMS, keep email
UPDATE dunning_config
SET auto_send_sms = false
WHERE org_id = 'email-only-org-id';
```

### Org-Specific Grace Periods

```sql
-- Free tier: 7 day grace, no SMS
UPDATE dunning_config SET
  grace_period_days = 7,
  auto_send_sms = false
WHERE org_id IN (SELECT org_id FROM user_subscriptions WHERE plan_tier IN ('free', 'starter'));

-- Premium tier: 14 day grace
UPDATE dunning_config SET
  grace_period_days = 14
WHERE org_id IN (SELECT org_id FROM user_subscriptions WHERE plan_tier IN ('premium', 'enterprise', 'master'));
```

### Test Mode for Development

```sql
-- Enable test mode (dry run, no actual sends)
UPDATE dunning_config
SET max_retry_days = 0,      -- Immediate advancement
    auto_send_emails = false,
    auto_send_sms = false
WHERE org_id = 'test-org-id';
```

---

## Cron Job Schedules

### Available Cron Jobs

| Job Name | Function | Schedule | Purpose |
|----------|----------|----------|---------|
| `process-dunning-stages` | `process_dunning_stages()` | Every 6 hours | Advance dunning stages |
| `detect-unpaid-invoices` | `detect_unpaid_invoices()` | Daily at 9 AM | Find unpaid invoices |
| `sync-pending-overages` | `sync_pending_overages()` | Hourly | Sync to Stripe |
| `retry-failed-synces` | `retry_failed_synces()` | Every 30 min | Retry failed syncs |

### Viewing Cron Jobs

```sql
-- List all cron jobs
SELECT jobid, schedule, command, nodename, nodeport
FROM cron.job;

-- Check last run status
SELECT * FROM cron.job_run_details ORDER BY end_time DESC LIMIT 10;
```

### Modifying Cron Schedules

**Option 1: Using cron.schedule()**

```sql
-- Run dunning stages every 3 hours instead of 6
SELECT cron.schedule(
  'process-dunning-stages',
  '0 0,3,6,9,12,15,18,21 * * *',  -- Every 3 hours
  $$SELECT process_dunning_stages()$$
);

-- Run unpaid invoice detection daily at 6 AM
SELECT cron.schedule(
  'detect-unpaid-invoices',
  '0 6 * * *',  -- Daily at 6 AM
  $$SELECT supabase_functions.invoke('process-unpaid-invoices')$$
);
```

**Option 2: Using pg_cron extension**

```sql
-- Run every 15 minutes
SELECT cron.schedule(
  'sync-pending-overages',
  '*/15 * * * *',
  $$SELECT sync_pending_overages()$$
);

-- Run every day at midnight
SELECT cron.schedule(
  'daily-dASHBOARD-report',
  '0 0 * * *',
  $$SELECT generate_daily_report()$$
);
```

### Job Schedule Examples

| Schedule | Cron Expression | Description |
|----------|-----------------|-------------|
| Every hour | `0 * * * *` | Top of every hour |
| Every 30 minutes | `*/30 * * * *` | Half-hourly |
| Every 6 hours | `0 */6 * * *` | Every 6 hours |
| Daily at 6 AM | `0 6 * * *` | Morning job |
| Daily at 9 PM | `0 21 * * *` | Evening job |
| Weekly (Sunday 3 AM) | `0 3 * * 0` | Weekly maintenance |

### Monitoring Cron Execution

```sql
-- Check recent cron runs
SELECT *
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-dunning-stages')
ORDER BY start_time DESC
LIMIT 10;

-- Find failed runs
SELECT *
FROM cron.job_run_details
WHERE status = 'failed'
ORDER BY end_time DESC
LIMIT 20;
```

### Manual Cron Execution

```sql
-- Run dunning stages manually
SELECT process_dunning_stages();

-- Run unpaid invoice detection manually
SELECT supabase_functions.invoke('process-unpaid-invoices');

-- Force all emails to be sent
SELECT get_pending_dunning_emails();
```

---

## Rate Limiting

### SMS Rate Limits

SMS rate limits prevent abuse and ensure deliverability.

**Default Limits:**
- per hour: 10 SMS per user
- per day: 50 SMS per user

### Configuring Rate Limits

```sql
-- Update SMS rate limits
UPDATE sms_rate_limits
SET max_per_hour = 20,   -- Increase to 20/hour
    max_per_day = 100    -- Increase to 100/day
WHERE org_id = 'high-volume-org';

-- Disable rate limits for testing
UPDATE sms_rate_limits
SET max_per_hour = 1000,
    max_per_day = 5000
WHERE org_id = 'test-org';
```

### Checking Rate Limit Status

```sql
-- Check current SMS usage
SELECT user_id, COUNT(*) as sent today
FROM sms_logs
WHERE created_at >= CURRENT_DATE
GROUP BY user_id
HAVING COUNT(*) > 50;

-- Check rate limit log
SELECT *
FROM sms_rate_limits
WHERE user_id = 'user-id'
  AND (today_count >= max_per_day OR hourly_count >= max_per_hour);
```

### Throttling Implementation

```sql
-- Function to check if SMS can be sent
CREATE OR REPLACE FUNCTION check_sms_rate_limit(
  p_user_id UUID,
  p_org_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_daily_count INTEGER;
  v_hourly_count INTEGER;
  v_max_daily INTEGER;
  v_max_hourly INTEGER;
BEGIN
  -- Get current counts
  SELECT COUNT(*) INTO v_daily_count
  FROM sms_logs
  WHERE user_id = p_user_id
    AND created_at >= CURRENT_DATE;

  SELECT COUNT(*) INTO v_hourly_count
  FROM sms_logs
  WHERE user_id = p_user_id
    AND created_at >= NOW() - INTERVAL '1 hour';

  -- Get limits
  SELECT COALESCE(max_per_day, 50), COALESCE(max_per_hour, 10)
  INTO v_max_daily, v_max_hourly
  FROM sms_rate_limits
  WHERE user_id = p_user_id;

  -- Check limits
  IF v_daily_count >= v_max_daily OR v_hourly_count >= v_max_hourly THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Use in SMS sending workflow
-- Before sending SMS:
IF check_sms_rate_limit(user_id, org_id) THEN
  -- Send SMS
ELSE
  -- Log rate limit hit
  INSERT INTO sms_rate_limit_hits (user_id, org_id, attempted_at)
  VALUES (user_id, org_id, NOW());
END IF;
```

### Rate Limit Bypass for Critical Events

```sql
-- Allow SMS bypass for urgent notifications
CREATE OR REPLACE FUNCTION send_urgent_sms(
  p_user_id UUID,
  p_org_id UUID,
  p_template TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Bypass rate limit for urgent messages
  INSERT INTO sms_logs (
    user_id,
    org_id,
    template,
    status,
    is_urgent
  ) VALUES (
    p_user_id,
    p_org_id,
    p_template,
    'pending',
    true
  );
END;
$$ LANGUAGE plpgsql;
```

---

## Advanced Configuration

### Dunning Automatic Stages

The system automatically advances stages based on time:

```sql
-- Current stage advancement logic
-- initial → reminder after 2 days
-- reminder → final after 5 days
-- final → cancel_notice after 5 days (10 total)
```

To customize:

```sql
-- Create custom advancement function
CREATE OR REPLACE FUNCTION custom_dunning_advancement()
RETURNS VOID AS $$
BEGIN
  -- Advance from initial to reminder after 3 days
  UPDATE dunning_events
  SET dunning_stage = 'reminder'
  WHERE dunning_stage = 'initial'
    AND NOW() > created_at + INTERVAL '3 days'
    AND resolved = FALSE;

  -- Advance from reminder to final after 7 days
  UPDATE dunning_events
  SET dunning_stage = 'final'
  WHERE dunning_stage = 'reminder'
    AND NOW() > created_at + INTERVAL '7 days'
    AND resolved = FALSE;

  -- Advance to cancel after 10 days
  UPDATE dunning_events
  SET dunning_stage = 'cancel_notice'
  WHERE dunning_stage = 'final'
    AND NOW() > created_at + INTERVAL '10 days'
    AND resolved = FALSE;
END;
$$ LANGUAGE plpgsql;
```

### Grace Period Handling

```sql
-- Grace period: Dunning stops if payment made within grace period
CREATE OR REPLACE FUNCTION handle_grace_period()
RETURNS VOID AS $$
BEGIN
  -- Mark dunning as resolved without action if payment within grace period
  UPDATE dunning_events
  SET resolved = TRUE,
      resolution_method = 'payment_within_grace',
      resolved_at = NOW()
  WHERE resolved = FALSE
    AND created_at > NOW() - INTERVAL '5 days'  -- Grace period
    AND amount_owed = 0;  -- Payment made
END;
$$ LANGUAGE plpgsql;
```

### Suspension Logic

```sql
-- Automatic suspension
CREATE OR REPLACE FUNCTION suspend_after_dunning()
RETURNS VOID AS $$
DECLARE
  v_suspended_count INTEGER;
BEGIN
  -- Find orgs past suspension threshold
  FOR org_id IN (
    SELECT DISTINCT org_id
    FROM dunning_events
    WHERE resolved = FALSE
      AND dunning_stage = 'cancel_notice'
      AND created_at < NOW() - INTERVAL '14 days'
  ) LOOP
    -- Suspend subscriptions
    UPDATE user_subscriptions
    SET status = 'suspended',
        metadata = jsonb_set(
          COALESCE(metadata, '{}'::jsonb),
          '{suspended_at}',
          to_jsonb(NOW())
        )
    WHERE org_id = org_id
      AND status NOT IN ('canceled', 'suspended');

    v_suspended_count := v_suspended_count + 1;
  END LOOP;

  RAISE INFO 'Suspended % subscriptions', v_suspended_count;
END;
$$ LANGUAGE plpgsql;
```

### Payment Link Expiration

```sql
-- Payment links expire after 24 hours
ALTER TABLE dunning_events
ADD COLUMN payment_link_expires_at TIMESTAMPTZ;

-- Update existing events
UPDATE dunning_events
SET payment_link_expires_at = created_at + INTERVAL '24 hours'
WHERE resolved = FALSE;

-- New payment link generation
CREATE OR REPLACE FUNCTION generate_payment_link(
  p_dunning_id UUID
)
RETURNS TEXT AS $$
DECLARE
  v_payment_url TEXT;
BEGIN
  -- Generate new Stripe hosted invoice URL
  v_payment_url := 'https://billing.stripe.com/payment/' || p_dunning_id;

  UPDATE dunning_events
  SET payment_url = v_payment_url,
      payment_link_expires_at = NOW() + INTERVAL '24 hours'
  WHERE id = p_dunning_id;

  RETURN v_payment_url;
END;
$$ LANGUAGE plpgsql;
```

---

## Monitoring & Analytics

### Dunning Dashboards

#### 1. Active Dunning Events Dashboard

```sql
-- Active dunning events by stage
SELECT
  dunning_stage,
  COUNT(*) as count,
  SUM(amount_owed) as total_owed,
  MIN(created_at) as oldest_event
FROM dunning_events
WHERE resolved = FALSE
GROUP BY dunning_stage
ORDER BY created_at ASC;
```

#### 2. Dunning Conversion Dashboard

```sql
-- Dunning success metrics
SELECT
  COUNT(*) FILTER (WHERE resolved = TRUE) as resolved_count,
  COUNT(*) FILTER (WHERE resolution_method = 'payment_success') as payment_recovery,
  COUNT(*) FILTER (WHERE resolution_method = 'subscription_canceled') as cancellations,
  COUNT(*) FILTER (WHERE resolved = FALSE) as active_count,
  AVG(amount_owed) FILTER (WHERE resolved = TRUE) as avg_recovery,
  SUM(amount_owed) FILTER (WHERE resolved = FALSE) as amount_at_risk
FROM dunning_events
WHERE created_at >= NOW() - INTERVAL '30 days';
```

#### 3. Stage Progression Dashboard

```sql
-- Time to resolve by stage
SELECT
  dunning_stage,
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) as avg_hours_to_resolve,
  COUNT(*) as total_resolved
FROM dunning_events
WHERE resolved = TRUE
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY dunning_stage
ORDER BY avg_hours_to_resolve;
```

### Alerting Configuration

```sql
-- High-value dunning alerts
CREATE OR REPLACE FUNCTION alert_high_value_dunning()
RETURNS VOID AS $$
DECLARE
  v_amount_threshold NUMERIC := 500;  -- $500
BEGIN
  -- Log high-value unpaid dunning events
  INSERT INTO dunning_alerts (dunning_id, alert_type, message)
  SELECT
    id,
    'high_value',
    'High-value dunning event: $' || amount_owed
  FROM dunning_events
  WHERE amount_owed > v_amount_threshold
    AND resolved = FALSE
    AND created_at >= NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;
```

### Email Delivery Tracking

```sql
-- Email delivery status
SELECT
  date_trunc('day', email_sent_at) as sent_date,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE email_opened) as opened,
  COUNT(*) FILTER (WHERE email_clicked) as clicked
FROM dunning_events
WHERE email_sent_at IS NOT NULL
GROUP BY date_trunc('day', email_sent_at)
ORDER BY sent_date DESC;
```

### SMS Delivery Monitoring

```sql
-- SMS delivery status
SELECT
  date_trunc('day', created_at) as sent_date,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE status = 'sent') as delivered,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'pending') as pending
FROM sms_logs
GROUP BY date_trunc('day', created_at)
ORDER BY sent_date DESC;
```

### Dunning Metrics to Track

| Metric | Purpose | Target |
|--------|---------|--------|
| Email Open Rate | Engagement | >40% |
| SMS Delivery Rate | Deliverability | >95% |
| Payment Recovery Rate | Success rate | >60% |
| Avg Time to Resolution | Efficiency | <72 hours |
| Stage Jump Rate | Engagement | <10% |

---

## Troubleshooting

### Common Issues

#### 1. Dunning Not Starting

**Symptom:** Payment fails but no dunning event created

**Debug:**
```sql
-- Check dunning config
SELECT enabled, auto_send_emails, auto_send_sms
FROM dunning_config
WHERE org_id = 'org-id';

-- Check webhooks
SELECT * FROM failed_webhooks
WHERE event_type = 'invoice.payment_failed'
  AND resolved = FALSE
ORDER BY created_at DESC;
```

**Fix:**
```sql
-- Enable dunning
UPDATE dunning_config
SET enabled = true,
    auto_send_emails = true,
    auto_send_sms = true
WHERE org_id = 'org-id';
```

#### 2. Emails Not Sending

**Symptom:** Dunning events exist but emails not sent

**Debug:**
```sql
-- Check email config
SELECT auto_send_emails, email_sequence
FROM dunning_config
WHERE org_id = 'org-id';

-- Check for email log entries
SELECT * FROM email_logs
WHERE dunning_event_id = 'dunning-id'
ORDER BY created_at DESC;
```

**Fix:**
```sql
-- Manually send email
UPDATE dunning_events
SET email_sent = false
WHERE id = 'dunning-id' AND email_sent = true;

-- Re-run email send
SELECT get_pending_dunning_emails();
```

#### 3. SMS Not Sending

**Symptom:** SMS queue not processed

**Debug:**
```sql
-- Check SMS logs
SELECT * FROM sms_logs
WHERE status = 'pending'
ORDER BY created_at DESC;

-- Check rate limits
SELECT
  user_id,
  today_count,
  hourly_count,
  max_per_day,
  max_per_hour
FROM sms_rate_limits;
```

**Fix:**
```sql
-- Clear SMS queue
UPDATE sms_logs
SET status = 'pending'
WHERE status = 'failed'
  AND created_at < NOW() - INTERVAL '1 hour';

-- Check Twilio credentials
SELECT supabase_functions.invoke('send-sms', ...);
```

#### 4. Stages Not Advancing

**Symptom:** Dunning stuck at initial stage

**Debug:**
```sql
-- Check last process run
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-dunning-stages')
ORDER BY end_time DESC
LIMIT 1;

-- Check dunning events
SELECT dunning_stage, created_at, NOW() - created_at as age
FROM dunning_events
WHERE resolved = FALSE
ORDER BY created_at ASC;
```

**Fix:**
```sql
-- Manually advance stages
SELECT process_dunning_stages();

-- Verify advancement
SELECT dunning_stage, days_since_failure
FROM dunning_events
WHERE id = 'dunning-id';
```

#### 5. High Failure Rate

**Symptom:** Many dunning events failing

**Debug:**
```sql
-- Find recent failures
SELECT
  error_message,
  COUNT(*) as count
FROM failed_webhooks
WHERE created_at >= NOW() - INTERVAL '1 day'
GROUP BY error_message
ORDER BY count DESC;
```

**Fix:**
```sql
-- Clear failed webhooks for retry
UPDATE failed_webhooks
SET resolved = false,
    retry_count = 0,
    next_retry_at = NOW()
WHERE created_at < NOW() - INTERVAL '1 hour'
  AND resolved = true;
```

### Diagnostic Queries

```sql
-- Complete dunning audit
SELECT
  de.id,
  de.org_id,
  de.dunning_stage,
  de.email_sent,
  de.amount_owed,
  de.created_at,
  de.resolved,
  us.status as subscription_status,
  us.metadata as subscription_metadata
FROM dunning_events de
JOIN user_subscriptions us ON de.stripe_subscription_id = us.stripe_subscription_id
WHERE de.created_at >= NOW() - INTERVAL '7 days'
ORDER BY de.created_at DESC;

-- Find orgs with multiple active dunning
SELECT
  org_id,
  COUNT(*) as dunning_count,
  SUM(amount_owed) as total_owed,
  MAX(dunning_stage) as highest_stage
FROM dunning_events
WHERE resolved = FALSE
GROUP BY org_id
HAVING COUNT(*) > 1
ORDER BY total_owed DESC;
```

### Logs to Check

```bash
# Edge function logs
npx supabase functions logs stripe-dunning

# Database logs
psql "$(npx supabase db url)" -c "SELECT * FROM pg_stat_activity WHERE query LIKE '%dunning%'"

# Failed webhook logs
psql "$(npx supabase db url)" -c "SELECT * FROM failed_webhooks ORDER BY created_at DESC LIMIT 100"
```

### Recovery Procedures

#### 1. Re-send All Pending Dunning Emails

```sql
-- Mark all as not sent
UPDATE dunning_events
SET email_sent = false
WHERE resolved = FALSE
  AND dunning_stage = 'initial';

-- Trigger email send
SELECT get_pending_dunning_emails();
```

#### 2. Reset Dunning Stage

```sql
-- Reset to initial stage
UPDATE dunning_events
SET dunning_stage = 'initial',
    email_sent = false,
    days_since_failure = 0,
    updated_at = NOW()
WHERE id = 'dunning-id';
```

#### 3. Force Resolution

```sql
-- Force resolve (cancellation)
UPDATE dunning_events
SET resolved = true,
    resolution_method = 'manual_override',
    resolved_at = NOW()
WHERE id = 'dunning-id';
```

---

## Best Practices

### 1. Start with Width Dunning

 Begin with less aggressive settings:

```sql
UPDATE dunning_config SET
  retry_interval_days = 3,     -- Every 3 days
  grace_period_days = 7,       -- 7-day grace
  suspend_after_days = 21      -- 21-day suspension
WHERE org_id = 'test-org';
```

### 2. Monitor First Week

Check daily for the first week:

```sql
SELECT
  COUNT(*) FILTER (WHERE resolved = FALSE) as active,
  COUNT(*) FILTER (WHERE resolved = TRUE) as resolved,
  COUNT(*) FILTER (WHERE resolution_method = 'payment_success') as recoveries
FROM dunning_events
WHERE created_at >= NOW() - INTERVAL '7 days';
```

### 3. Test Email Delivery

Use test mode before going live:

```sql
UPDATE dunning_config SET
  enabled = true,
  auto_send_emails = true,
  auto_send_sms = false  -- Only email for testing
WHERE org_id = 'test-org';
```

### 4. Set Up Alerts

Configure alerts for:

```sql
-- High-value events
 amount_owed > 500

-- Long-standing events
 created_at < NOW() - INTERVAL '10 days'
 AND resolved = FALSE

-- High failure rate
 (SELECT COUNT(*) FROM sms_logs WHERE status = 'failed' AND created_at > NOW() - INTERVAL '1 hour') > 10
```

---

## Support

For issues or questions:
- Documentation: [WellNexus Docs](https://docs.wellnexus.vn)
- Support Email: support@wellnexus.vn
- Status Page: [status.wellnexus.vn](https://status.wellnexus.vn)

---

**Last Updated:** 2026-03-08
**Version:** 1.0.0
**Author:** WellNexus Engineering Team
