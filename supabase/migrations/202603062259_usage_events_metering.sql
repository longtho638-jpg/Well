-- ============================================================================
-- Usage Events Table with Idempotency and Daily Rollup
-- Migration: 202603062259_usage_events_metering.sql
-- ============================================================================

-- 1. Create usage_events table for normalized usage tracking
CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,        -- Idempotency key
  feature TEXT NOT NULL,                 -- e.g., 'model_inference', 'agent_execution'
  quantity INTEGER NOT NULL DEFAULT 1,
  customer_id TEXT NOT NULL,             -- From webhook metadata
  license_id UUID,                       -- Optional license reference
  user_id UUID,                          -- Optional user reference
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_payload JSONB NOT NULL,           -- Full webhook payload for debugging
  metadata JSONB,                        -- Extracted metadata (model, provider, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_usage_events_event_id ON usage_events(event_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_customer_id ON usage_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_feature ON usage_events(feature);
CREATE INDEX IF NOT EXISTS idx_usage_events_timestamp ON usage_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_customer_feature_time
  ON usage_events(customer_id, feature, timestamp DESC);

-- 3. GIN index for metadata queries
CREATE INDEX IF NOT EXISTS idx_usage_events_metadata_model
  ON usage_events USING GIN ((metadata->'model')) WHERE metadata ? 'model';

CREATE INDEX IF NOT EXISTS idx_usage_events_metadata_customer
  ON usage_events USING GIN ((raw_payload->'customer_id')) WHERE raw_payload ? 'customer_id';

-- 4. Add TimescaleDB hypertable if available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
    -- Convert to hypertable (chunk by day)
    PERFORM create_hypertable('usage_events', 'timestamp', chunk_time_interval => INTERVAL '1 day', if_not_exists => TRUE);

    -- Enable compression
    ALTER TABLE usage_events SET (timescaledb.compress);
    PERFORM add_compression_policy('usage_events', INTERVAL '7 days', if_not_exists => TRUE);

    -- Retention policy (90 days)
    PERFORM add_retention_policy('usage_events', INTERVAL '90 days', if_not_exists => TRUE);
  END IF;
END $$;

-- 5. Create daily_usage_rollup materialized view for billing/analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_usage_rollup
WITH (timescaledb.continuous) AS
SELECT
  customer_id,
  feature,
  date_trunc('day', timestamp) AS day,
  SUM(quantity) AS total_quantity,
  COUNT(*) AS event_count,
  AVG(quantity) AS avg_quantity,
  MIN(timestamp) AS first_event,
  MAX(timestamp) AS last_event
FROM usage_events
GROUP BY customer_id, feature, date_trunc('day', timestamp)
WITH NO DATA;

-- Refresh policy: every hour, lag 1 hour
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
    PERFORM add_continuous_aggregate_policy('daily_usage_rollup',
      start_offset => INTERVAL '1 day',
      end_offset => INTERVAL '1 hour',
      schedule_interval => INTERVAL '1 hour',
      if_not_exists => TRUE);
  END IF;
END $$;

-- 6. Create function to check and record idempotency atomically
CREATE OR REPLACE FUNCTION check_usage_event_idempotency_v2(
  p_event_id TEXT,
  p_customer_id TEXT,
  p_feature TEXT,
  p_quantity INTEGER,
  p_license_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_raw_payload JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE (is_duplicate BOOLEAN, event_uuid UUID, message TEXT) AS $$
DECLARE
  new_event_id UUID;
  existing_event UUID;
BEGIN
  -- Try to insert the event
  BEGIN
    INSERT INTO usage_events (event_id, customer_id, feature, quantity, license_id, user_id, raw_payload, metadata)
    VALUES (p_event_id, p_customer_id, p_feature, p_quantity, p_license_id, p_user_id, p_raw_payload, p_metadata)
    RETURNING id INTO new_event_id;

    -- Insert succeeded, not a duplicate
    RETURN QUERY SELECT FALSE, new_event_id, 'Event processed successfully'::TEXT;
  EXCEPTION
    WHEN unique_violation THEN
      -- Duplicate event_id, return existing
      SELECT id INTO existing_event
      FROM usage_events
      WHERE event_id = p_event_id;

      RETURN QUERY SELECT TRUE, existing_event, 'Duplicate event_id - already processed'::TEXT;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to validate feature names
CREATE OR REPLACE FUNCTION validate_usage_feature(p_feature TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN p_feature IN (
    'api_call', 'tokens', 'compute_ms', 'storage_mb', 'bandwidth_mb',
    'model_inference', 'agent_execution'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 8. Create function to extract metadata from webhook payload
CREATE OR REPLACE FUNCTION extract_usage_metadata(p_payload JSONB)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  result := jsonb_build_object(
    'model', p_payload->>'model',
    'provider', p_payload->>'provider',
    'prompt_tokens', (p_payload->>'prompt_tokens')::INTEGER,
    'completion_tokens', (p_payload->>'completion_tokens')::INTEGER,
    'total_tokens', (p_payload->>'total_tokens')::INTEGER,
    'agent_type', p_payload->>'agent_type',
    'inference_time_ms', (p_payload->>'inference_time_ms')::INTEGER
  );

  -- Remove null values
  SELECT jsonb_object_agg(key, value)
  INTO result
  FROM jsonb_each(result)
  WHERE value IS NOT NULL;

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 9. Grant permissions
GRANT SELECT, INSERT ON usage_events TO authenticated;
GRANT SELECT ON usage_events TO service_role;
GRANT SELECT ON daily_usage_rollup TO authenticated;
GRANT SELECT ON daily_usage_rollup TO service_role;
GRANT EXECUTE ON FUNCTION check_usage_event_idempotency_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION check_usage_event_idempotency_v2 TO service_role;
GRANT EXECUTE ON FUNCTION validate_usage_feature TO authenticated;
GRANT EXECUTE ON FUNCTION validate_usage_feature TO service_role;
GRANT EXECUTE ON FUNCTION extract_usage_metadata TO authenticated;
GRANT EXECUTE ON FUNCTION extract_usage_metadata TO service_role;

-- 10. Add constraint to ensure feature is valid
ALTER TABLE usage_events
  ADD CONSTRAINT check_usage_feature
  CHECK (validate_usage_feature(feature));

-- ============================================================================
-- Migration Complete
-- ============================================================================
