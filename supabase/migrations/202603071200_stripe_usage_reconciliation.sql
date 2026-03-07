-- Stripe Usage Records - Idempotency & Reconciliation Support
-- Migration for Phase 6: Billing Sync

-- 1. Ensure usage_events has idempotency_key index (already exists from Phase 4)
-- This migration adds additional indexes for Stripe reconciliation

-- 2. Create index for Stripe subscription_item_id tracking
CREATE INDEX IF NOT EXISTS idx_usage_events_subscription_item
ON usage_events ((metadata->>'subscription_item_id'))
WHERE metadata->>'subscription_item_id' IS NOT NULL;

-- 3. Create index for reconciliation queries by date
CREATE INDEX IF NOT EXISTS idx_usage_records_date_feature
ON usage_records (recorded_at::date, feature)
WHERE quantity > 0;

-- 4. Create view for daily usage aggregation (for reconciliation)
CREATE OR REPLACE VIEW daily_usage_summary AS
SELECT
  recorded_at::date AS usage_date,
  feature,
  user_id,
  license_id,
  SUM(quantity) AS total_quantity,
  COUNT(*) AS event_count,
  MIN(recorded_at) AS first_event,
  MAX(recorded_at) AS last_event
FROM usage_records
GROUP BY recorded_at::date, feature, user_id, license_id
ORDER BY usage_date DESC, feature;

-- 5. Create function to check if Stripe usage record was already reported
CREATE OR REPLACE FUNCTION check_stripe_usage_reported(
  p_subscription_item_id TEXT,
  p_timestamp_start BIGINT,
  p_timestamp_end BIGINT
)
RETURNS TABLE (
  has_been_reported BOOLEAN,
  reported_quantity BIGINT,
  last_reported_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXISTS (
      SELECT 1
      FROM usage_events
      WHERE metadata->>'subscription_item_id' = p_subscription_item_id
        AND (metadata->>'stripe_timestamp')::BIGINT BETWEEN p_timestamp_start AND p_timestamp_end
    ) AS has_been_reported,
    COALESCE(
      (
        SELECT SUM(quantity)
        FROM usage_events
        WHERE metadata->>'subscription_item_id' = p_subscription_item_id
          AND (metadata->>'stripe_timestamp')::BIGINT BETWEEN p_timestamp_start AND p_timestamp_end
      ),
      0
    ) AS reported_quantity,
    MAX(created_at) AS last_reported_at
  FROM usage_events
  WHERE metadata->>'subscription_item_id' = p_subscription_item_id
    AND (metadata->>'stripe_timestamp')::BIGINT BETWEEN p_timestamp_start AND p_timestamp_end;
END;
$$;

-- 6. Grant permissions
GRANT SELECT ON daily_usage_summary TO authenticated;
GRANT EXECUTE ON FUNCTION check_stripe_usage_reported TO authenticated;

-- 7. Comment documentation
COMMENT ON VIEW daily_usage_summary IS 'Daily aggregated usage for billing reconciliation';
COMMENT ON FUNCTION check_stripe_usage_reported IS 'Check if usage was already reported to Stripe for idempotency';
