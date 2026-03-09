-- Payment Retry Queue Schema
-- Phase 2: Payment Retry Automation
-- Created: 2026-03-09

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Payment Retry Queue Table
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_retry_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_invoice_id TEXT NOT NULL,
  stripe_subscription_id TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  failure_reason TEXT,
  failure_type TEXT CHECK (failure_type IN ('transient', 'permanent', 'unknown')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 4,
  next_retry_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'dead_letter')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying of due retries
CREATE INDEX IF NOT EXISTS idx_retry_queue_next_attempt
  ON payment_retry_queue(status, next_retry_at)
  WHERE status = 'pending';

-- Index for looking up retries by invoice ID
CREATE INDEX IF NOT EXISTS idx_retry_queue_invoice_id
  ON payment_retry_queue(stripe_invoice_id);

-- Index for org-based queries
CREATE INDEX IF NOT EXISTS idx_retry_queue_org_id
  ON payment_retry_queue(org_id, status);

-- ============================================================
-- Dead-Letter Queue Table
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_retry_dead_letter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retry_queue_id UUID REFERENCES payment_retry_queue(id) ON DELETE SET NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_invoice_id TEXT NOT NULL UNIQUE,
  final_retry_count INTEGER DEFAULT 0,
  failure_reason TEXT,
  requires_manual_review BOOLEAN DEFAULT TRUE,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for pending manual review
CREATE INDEX IF NOT EXISTS idx_dead_letter_manual_review
  ON payment_retry_dead_letter(requires_manual_review, reviewed_at)
  WHERE requires_manual_review = TRUE AND reviewed_at IS NULL;

-- Index for org-based queries
CREATE INDEX IF NOT EXISTS idx_dead_letter_org_id
  ON payment_retry_dead_letter(org_id, created_at);

-- ============================================================
-- Retry Queue Audit Log
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_retry_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retry_queue_id UUID REFERENCES payment_retry_queue(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN (
    'scheduled',
    'retry_attempted',
    'retry_succeeded',
    'retry_failed',
    'moved_to_dead_letter',
    'manual_retry',
    'resolved'
  )),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for retry history queries
CREATE INDEX IF NOT EXISTS idx_retry_audit_queue_id
  ON payment_retry_audit_log(retry_queue_id, created_at);

-- ============================================================
-- Helper Functions
-- ============================================================

-- Function to get due payment retries
CREATE OR REPLACE FUNCTION get_due_payment_retries(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  org_id UUID,
  user_id UUID,
  stripe_invoice_id TEXT,
  stripe_subscription_id TEXT,
  amount DECIMAL,
  currency TEXT,
  failure_reason TEXT,
  failure_type TEXT,
  retry_count INTEGER,
  next_retry_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    prq.id,
    prq.org_id,
    prq.user_id,
    prq.stripe_invoice_id,
    prq.stripe_subscription_id,
    prq.amount,
    prq.currency,
    prq.failure_reason,
    prq.failure_type,
    prq.retry_count,
    prq.next_retry_at
  FROM payment_retry_queue prq
  WHERE prq.status = 'pending'
    AND (prq.next_retry_at IS NULL OR prq.next_retry_at <= NOW())
    AND prq.retry_count < prq.max_retries
  ORDER BY prq.next_retry_at ASC NULLS FIRST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a payment retry entry
CREATE OR REPLACE FUNCTION create_payment_retry(
  p_org_id UUID,
  p_user_id UUID,
  p_stripe_invoice_id TEXT,
  p_stripe_subscription_id TEXT,
  p_amount DECIMAL,
  p_failure_reason TEXT,
  p_failure_type TEXT,
  p_next_retry_at TIMESTAMPTZ
)
RETURNS UUID AS $$
DECLARE
  v_retry_id UUID;
BEGIN
  -- Check if invoice already has pending retry
  SELECT id INTO v_retry_id
  FROM payment_retry_queue
  WHERE stripe_invoice_id = p_stripe_invoice_id
    AND status IN ('pending', 'processing')
  LIMIT 1;

  IF v_retry_id IS NOT NULL THEN
    -- Return existing retry ID (idempotency)
    RETURN v_retry_id;
  END IF;

  -- Create new retry entry
  INSERT INTO payment_retry_queue (
    org_id,
    user_id,
    stripe_invoice_id,
    stripe_subscription_id,
    amount,
    failure_reason,
    failure_type,
    next_retry_at,
    retry_count,
    status
  ) VALUES (
    p_org_id,
    p_user_id,
    p_stripe_invoice_id,
    p_stripe_subscription_id,
    p_amount,
    p_failure_reason,
    p_failure_type,
    p_next_retry_at,
    0,
    'pending'
  )
  RETURNING id INTO v_retry_id;

  -- Log the action
  INSERT INTO payment_retry_audit_log (retry_queue_id, action, details)
  VALUES (
    v_retry_id,
    'scheduled',
    jsonb_build_object(
      'failure_reason', p_failure_reason,
      'failure_type', p_failure_type,
      'next_retry_at', p_next_retry_at,
      'amount', p_amount
    )
  );

  RETURN v_retry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to advance retry to next attempt
CREATE OR REPLACE FUNCTION advance_payment_retry(
  p_retry_id UUID,
  p_new_retry_count INTEGER,
  p_next_retry_at TIMESTAMPTZ,
  p_failure_reason TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE payment_retry_queue
  SET
    retry_count = p_new_retry_count,
    next_retry_at = p_next_retry_at,
    failure_reason = p_failure_reason,
    status = 'pending',
    updated_at = NOW()
  WHERE id = p_retry_id;

  -- Log the action
  INSERT INTO payment_retry_audit_log (retry_queue_id, action, details)
  VALUES (
    p_retry_id,
    'retry_failed',
    jsonb_build_object(
      'retry_count', p_new_retry_count,
      'next_retry_at', p_next_retry_at,
      'failure_reason', p_failure_reason
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark retry as completed
CREATE OR REPLACE FUNCTION complete_payment_retry(p_retry_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE payment_retry_queue
  SET
    status = 'completed',
    updated_at = NOW()
  WHERE id = p_retry_id;

  -- Log the action
  INSERT INTO payment_retry_audit_log (retry_queue_id, action)
  VALUES (p_retry_id, 'retry_succeeded');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to move retry to dead-letter queue
CREATE OR REPLACE FUNCTION move_to_dead_letter(
  p_retry_id UUID,
  p_failure_reason TEXT
)
RETURNS VOID AS $$
DECLARE
  v_retry RECORD;
BEGIN
  -- Get retry details
  SELECT * INTO v_retry
  FROM payment_retry_queue
  WHERE id = p_retry_id;

  IF v_retry.id IS NOT NULL THEN
    -- Insert into dead-letter queue
    INSERT INTO payment_retry_dead_letter (
      retry_queue_id,
      org_id,
      user_id,
      stripe_invoice_id,
      final_retry_count,
      failure_reason,
      requires_manual_review
    ) VALUES (
      p_retry_id,
      v_retry.org_id,
      v_retry.user_id,
      v_retry.stripe_invoice_id,
      v_retry.retry_count,
      p_failure_reason,
      TRUE
    )
    ON CONFLICT (stripe_invoice_id) DO UPDATE
    SET
      final_retry_count = EXCLUDED.final_retry_count,
      failure_reason = EXCLUDED.failure_reason,
      updated_at = NOW();

    -- Update retry queue status
    UPDATE payment_retry_queue
    SET status = 'dead_letter', updated_at = NOW()
    WHERE id = p_retry_id;

    -- Log the action
    INSERT INTO payment_retry_audit_log (retry_queue_id, action, details)
    VALUES (
      p_retry_id,
      'moved_to_dead_letter',
      jsonb_build_object('failure_reason', p_failure_reason)
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get retry statistics for an organization
CREATE OR REPLACE FUNCTION get_retry_statistics(p_org_id UUID DEFAULT NULL)
RETURNS TABLE (
  total_retries INTEGER,
  pending_retries INTEGER,
  completed_retries INTEGER,
  dead_letter_count INTEGER,
  total_amount_recovered DECIMAL,
  total_amount_failed DECIMAL,
  avg_retry_count DECIMAL,
  success_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_retries,
    COUNT(*) FILTER (WHERE status = 'pending')::INTEGER AS pending_retries,
    COUNT(*) FILTER (WHERE status = 'completed')::INTEGER AS completed_retries,
    (SELECT COUNT(*) FROM payment_retry_dead_letter dl
     WHERE p_org_id IS NULL OR dl.org_id = p_org_id)::INTEGER AS dead_letter_count,
    COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) AS total_amount_recovered,
    COALESCE(SUM(amount) FILTER (WHERE status IN ('failed', 'dead_letter')), 0) AS total_amount_failed,
    COALESCE(AVG(retry_count), 0) AS avg_retry_count,
    CASE
      WHEN COUNT(*) > 0 THEN
        ROUND((COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / COUNT(*)::DECIMAL) * 100, 2)
      ELSE 0
    END AS success_rate
  FROM payment_retry_queue
  WHERE p_org_id IS NULL OR org_id = p_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Row Level Security Policies
-- ============================================================

-- Enable RLS on retry queue
ALTER TABLE payment_retry_queue ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role has full access"
  ON payment_retry_queue
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Enable RLS on dead-letter queue
ALTER TABLE payment_retry_dead_letter ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access"
  ON payment_retry_dead_letter
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Enable RLS on audit log
ALTER TABLE payment_retry_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access"
  ON payment_retry_audit_log
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================
-- Comments for Documentation
-- ============================================================

COMMENT ON TABLE payment_retry_queue IS 'Queue for tracking failed payment retry attempts with exponential backoff';
COMMENT ON TABLE payment_retry_dead_letter IS 'Dead-letter queue for payments that failed all retry attempts';
COMMENT ON TABLE payment_retry_audit_log IS 'Audit log for all payment retry actions';
COMMENT ON FUNCTION get_due_payment_retries IS 'Returns pending retries that are due for processing';
COMMENT ON FUNCTION create_payment_retry IS 'Creates a new retry entry with idempotency check';
COMMENT ON FUNCTION complete_payment_retry IS 'Marks a retry as completed after successful payment';
COMMENT ON FUNCTION move_to_dead_letter IS 'Moves a retry to dead-letter queue after max failures';

-- ============================================================
-- Cron Schedule Entry (for pg_cron extension)
-- ============================================================

-- Schedule retry processing every 15 minutes
-- Requires pg_cron extension enabled in Supabase
DO $$
BEGIN
  -- Try to create cron job, ignore if pg_cron not available
  BEGIN
    PERFORM cron.schedule(
      'process-payment-retries',
      '*/15 * * * *',
      $$
      SELECT process_payment_retry_batch()
      $$
    );
  EXCEPTION
    WHEN undefined_function THEN
      -- pg_cron not available, skip cron scheduling
      NULL;
  END;
END $$;

-- Function to process a batch of retries (called by cron)
CREATE OR REPLACE FUNCTION process_payment_retry_batch(p_batch_size INTEGER DEFAULT 50)
RETURNS INTEGER AS $$
DECLARE
  v_retry RECORD;
  v_processed_count INTEGER := 0;
BEGIN
  -- Get due retries
  FOR v_retry IN SELECT * FROM get_due_payment_retries(p_batch_size)
  LOOP
    -- Process each retry (this would call the Edge Function)
    -- For now, just update status to indicate processing
    UPDATE payment_retry_queue
    SET status = 'processing'
    WHERE id = v_retry.id;

    v_processed_count := v_processed_count + 1;
  END LOOP;

  RETURN v_processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
