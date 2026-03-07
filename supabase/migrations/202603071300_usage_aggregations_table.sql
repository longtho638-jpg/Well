-- Usage Aggregations Table - For Stripe Billing Integration
-- Migration for Phase 6: Batch Aggregation & Stripe Sync

-- 1. Create usage_aggregations table
CREATE TABLE IF NOT EXISTS usage_aggregations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id TEXT NOT NULL,              -- License key for tenant isolation
  user_id TEXT NOT NULL,                 -- User who triggered the usage
  feature TEXT NOT NULL,                 -- Feature type: api_call, tokens, model_inference, etc.
  total_quantity BIGINT NOT NULL,        -- Aggregated quantity for billing period
  event_count INTEGER NOT NULL,          -- Number of raw events aggregated
  period_start TIMESTAMPTZ NOT NULL,     -- Billing period start
  period_end TIMESTAMPTZ NOT NULL,       -- Billing period end
  subscription_item_id TEXT,             -- Stripe subscription item ID (si_xxx)
  stripe_price_id TEXT,                  -- Stripe price ID for this feature
  is_synced_to_stripe BOOLEAN DEFAULT FALSE,
  synced_at TIMESTAMPTZ,
  metadata JSONB,                        -- Additional context (period_type, first_event, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for efficient queries
CREATE INDEX idx_usage_aggregations_license ON usage_aggregations(license_id);
CREATE INDEX idx_usage_aggregations_feature ON usage_aggregations(feature);
CREATE INDEX idx_usage_aggregations_period ON usage_aggregations(period_start, period_end);
CREATE INDEX idx_usage_aggregations_sync_status ON usage_aggregations(is_synced_to_stripe) WHERE is_synced_to_stripe = FALSE;
CREATE INDEX idx_usage_aggregations_subscription ON usage_aggregations(subscription_item_id);
CREATE INDEX idx_usage_aggregations_created_at ON usage_aggregations(created_at DESC);

-- 3. Create unique constraint for idempotency (one aggregation per license/feature/period)
CREATE UNIQUE INDEX idx_usage_aggregations_unique_period
ON usage_aggregations(license_id, feature, period_start, period_end);

-- 4. Create view for pending Stripe sync
CREATE OR REPLACE VIEW usage_aggregations_pending_sync AS
SELECT
  id,
  license_id,
  user_id,
  feature,
  total_quantity,
  event_count,
  period_start,
  period_end,
  subscription_item_id,
  stripe_price_id,
  created_at
FROM usage_aggregations
WHERE is_synced_to_stripe = FALSE
ORDER BY period_start DESC, created_at DESC;

-- 5. Create view for daily aggregation summary
CREATE OR REPLACE VIEW usage_aggregations_daily_summary AS
SELECT
  period_start::DATE AS usage_date,
  license_id,
  feature,
  COUNT(*) AS aggregation_count,
  SUM(total_quantity) AS total_quantity,
  SUM(event_count) AS total_events,
  COUNT(*) FILTER (WHERE is_synced_to_stripe = TRUE) AS synced_count,
  COUNT(*) FILTER (WHERE is_synced_to_stripe = FALSE) AS pending_count
FROM usage_aggregations
GROUP BY period_start::DATE, license_id, feature
ORDER BY usage_date DESC, license_id, feature;

-- 6. Create function to get aggregation by period (for idempotency check)
CREATE OR REPLACE FUNCTION get_usage_aggregation(
  p_license_id TEXT,
  p_feature TEXT,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
)
RETURNS TABLE (
  id UUID,
  total_quantity BIGINT,
  event_count INTEGER,
  is_synced_to_stripe BOOLEAN,
  synced_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.total_quantity,
    a.event_count,
    a.is_synced_to_stripe,
    a.synced_at
  FROM usage_aggregations a
  WHERE a.license_id = p_license_id
    AND a.feature = p_feature
    AND a.period_start = p_period_start
    AND a.period_end = p_period_end;
END;
$$;

-- 7. Create function to create or update aggregation (upsert)
CREATE OR REPLACE FUNCTION upsert_usage_aggregation(
  p_license_id TEXT,
  p_user_id TEXT,
  p_feature TEXT,
  p_total_quantity BIGINT,
  p_event_count INTEGER,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ,
  p_subscription_item_id TEXT DEFAULT NULL,
  p_stripe_price_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_aggregation_id UUID;
BEGIN
  INSERT INTO usage_aggregations (
    license_id,
    user_id,
    feature,
    total_quantity,
    event_count,
    period_start,
    period_end,
    subscription_item_id,
    stripe_price_id,
    metadata
  ) VALUES (
    p_license_id,
    p_user_id,
    p_feature,
    p_total_quantity,
    p_event_count,
    p_period_start,
    p_period_end,
    p_subscription_item_id,
    p_stripe_price_id,
    p_metadata
  )
  ON CONFLICT (license_id, feature, period_start, period_end)
  DO UPDATE SET
    total_quantity = usage_aggregations.total_quantity + p_total_quantity,
    event_count = usage_aggregations.event_count + p_event_count,
    updated_at = NOW()
  RETURNING id INTO v_aggregation_id;

  RETURN v_aggregation_id;
END;
$$;

-- 8. Create function to mark aggregation as synced
CREATE OR REPLACE FUNCTION mark_usage_aggregation_synced(
  p_aggregation_id UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE usage_aggregations
  SET
    is_synced_to_stripe = TRUE,
    synced_at = NOW(),
    updated_at = NOW()
  WHERE id = p_aggregation_id;
END;
$$;

-- 9. Create function to get pending sync count by license
CREATE OR REPLACE FUNCTION get_pending_sync_count(
  p_license_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  license_id TEXT,
  pending_count BIGINT,
  total_quantity BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.license_id,
    COUNT(*)::BIGINT AS pending_count,
    SUM(a.total_quantity)::BIGINT AS total_quantity
  FROM usage_aggregations a
  WHERE a.is_synced_to_stripe = FALSE
    AND (p_license_id IS NULL OR a.license_id = p_license_id)
  GROUP BY a.license_id;
END;
$$;

-- 10. Grant permissions
GRANT SELECT ON usage_aggregations TO authenticated;
GRANT SELECT ON usage_aggregations_pending_sync TO authenticated;
GRANT SELECT ON usage_aggregations_daily_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_usage_aggregation TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_usage_aggregation TO authenticated;
GRANT EXECUTE ON FUNCTION mark_usage_aggregation_synced TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_sync_count TO authenticated;

-- 11. Enable RLS
ALTER TABLE usage_aggregations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own aggregations
CREATE POLICY "Users can view own usage aggregations"
  ON usage_aggregations
  FOR SELECT
  TO authenticated
  USING (true);  -- TODO: Add license ownership check when auth context is available

-- Policy: Users can insert their own aggregations
CREATE POLICY "Users can insert own usage aggregations"
  ON usage_aggregations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);  -- TODO: Add license ownership check

-- Policy: Users can update their own aggregations
CREATE POLICY "Users can update own usage aggregations"
  ON usage_aggregations
  FOR UPDATE
  TO authenticated
  USING (true);

-- 12. Comments for documentation
COMMENT ON TABLE usage_aggregations IS 'Aggregated usage data for Stripe billing - one row per license/feature/billing period';
COMMENT ON VIEW usage_aggregations_pending_sync IS 'Usage aggregations waiting to be synced to Stripe';
COMMENT ON VIEW usage_aggregations_daily_summary IS 'Daily summary of usage aggregations by license and feature';
COMMENT ON FUNCTION get_usage_aggregation IS 'Get aggregation by license/feature/period for idempotency check';
COMMENT ON FUNCTION upsert_usage_aggregation IS 'Create or update aggregation with automatic quantity accumulation';
COMMENT ON FUNCTION mark_usage_aggregation_synced IS 'Mark aggregation as synced to Stripe';
COMMENT ON FUNCTION get_pending_sync_count IS 'Get count of pending Stripe syncs by license';
