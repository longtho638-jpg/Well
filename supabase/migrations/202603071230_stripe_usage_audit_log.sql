-- Stripe Usage Record Audit Logging
-- Track all usage submissions to Stripe for auditability and reconciliation

-- 1. Create audit log table
CREATE TABLE IF NOT EXISTS stripe_usage_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,              -- Unique event identifier
  subscription_item_id TEXT NOT NULL,   -- Stripe subscription item (si_xxx)
  price_id TEXT NOT NULL,               -- Stripe price ID
  quantity BIGINT NOT NULL,             -- Usage quantity reported
  action TEXT NOT NULL DEFAULT 'set',   -- set, increment, or clear
  timestamp BIGINT NOT NULL,            -- Unix timestamp of usage
  idempotency_key TEXT UNIQUE,          -- For retry support
  stripe_response JSONB,                -- Full Stripe API response
  stripe_usage_record_id TEXT,          -- mbur_xxx from Stripe
  status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed
  error_message TEXT,                   -- Error if failed
  retry_count INTEGER DEFAULT 0,
  metadata JSONB,                       -- Additional context
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for efficient queries
CREATE INDEX idx_stripe_audit_event_id ON stripe_usage_audit_log(event_id);
CREATE INDEX idx_stripe_audit_subscription ON stripe_usage_audit_log(subscription_item_id);
CREATE INDEX idx_stripe_audit_status ON stripe_usage_audit_log(status);
CREATE INDEX idx_stripe_audit_timestamp ON stripe_usage_audit_log(timestamp);
CREATE INDEX idx_stripe_audit_created_at ON stripe_usage_audit_log(created_at DESC);
CREATE INDEX idx_stripe_audit_idempotency ON stripe_usage_audit_log(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- 3. Create index for reconciliation queries
CREATE INDEX idx_stripe_audit_date_range ON stripe_usage_audit_log((to_timestamp(timestamp)::date)) WHERE status = 'success';

-- 4. Create view for daily usage summary by subscription
CREATE OR REPLACE VIEW stripe_usage_daily_summary AS
SELECT
  to_timestamp(timestamp)::DATE AS usage_date,
  subscription_item_id,
  price_id,
  COUNT(*) AS submission_count,
  SUM(quantity) AS total_quantity,
  COUNT(*) FILTER (WHERE status = 'success') AS successful_submissions,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_submissions,
  MAX(created_at) AS last_submission_at
FROM stripe_usage_audit_log
GROUP BY to_timestamp(timestamp)::DATE, subscription_item_id, price_id
ORDER BY usage_date DESC;

-- 5. Create function to log usage submission
CREATE OR REPLACE FUNCTION log_stripe_usage_submission(
  p_event_id TEXT,
  p_subscription_item_id TEXT,
  p_price_id TEXT,
  p_quantity BIGINT,
  p_action TEXT,
  p_timestamp BIGINT,
  p_idempotency_key TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO stripe_usage_audit_log (
    event_id,
    subscription_item_id,
    price_id,
    quantity,
    action,
    timestamp,
    idempotency_key,
    status,
    metadata
  ) VALUES (
    p_event_id,
    p_subscription_item_id,
    p_price_id,
    p_quantity,
    p_action,
    p_timestamp,
    p_idempotency_key,
    'pending',
    p_metadata
  ) RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$;

-- 6. Create function to update audit log after Stripe API call
CREATE OR REPLACE FUNCTION update_stripe_submission_result(
  p_audit_id UUID,
  p_status TEXT,
  p_stripe_response JSONB,
  p_stripe_usage_record_id TEXT,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE stripe_usage_audit_log
  SET
    status = p_status,
    stripe_response = p_stripe_response,
    stripe_usage_record_id = p_stripe_usage_record_id,
    error_message = p_error_message,
    updated_at = NOW()
  WHERE id = p_audit_id;
END;
$$;

-- 7. Create function to increment retry count
CREATE OR REPLACE FUNCTION increment_stripe_submission_retry(
  p_audit_id UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE stripe_usage_audit_log
  SET
    retry_count = retry_count + 1,
    status = 'pending',
    updated_at = NOW()
  WHERE id = p_audit_id;
END;
$$;

-- 8. Grant permissions
GRANT SELECT ON stripe_usage_audit_log TO authenticated;
GRANT SELECT ON stripe_usage_daily_summary TO authenticated;
GRANT EXECUTE ON FUNCTION log_stripe_usage_submission TO authenticated;
GRANT EXECUTE ON FUNCTION update_stripe_submission_result TO authenticated;
GRANT EXECUTE ON FUNCTION increment_stripe_submission_retry TO authenticated;

-- 9. Enable RLS (optional - for multi-tenant isolation)
ALTER TABLE stripe_usage_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own usage logs (via subscription association)
-- Note: This requires joining with subscriptions table to determine ownership
-- For now, allow authenticated users to read (can be tightened later)
CREATE POLICY "Authenticated users can view own usage audit logs"
  ON stripe_usage_audit_log
  FOR SELECT
  TO authenticated
  USING (true);  -- TODO: Add subscription ownership check

-- 10. Comments for documentation
COMMENT ON TABLE stripe_usage_audit_log IS 'Audit trail for all Stripe Usage Record API submissions';
COMMENT ON VIEW stripe_usage_daily_summary IS 'Daily aggregated usage submissions to Stripe for reconciliation';
COMMENT ON FUNCTION log_stripe_usage_submission IS 'Log a usage submission before calling Stripe API';
COMMENT ON FUNCTION update_stripe_submission_result IS 'Update audit log with Stripe API response';
COMMENT ON FUNCTION increment_stripe_submission_retry IS 'Increment retry count for failed submissions';
