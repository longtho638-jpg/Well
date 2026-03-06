-- ============================================================================
-- Add Idempotency Table for Usage Events
-- Migration: 202603062258_add_usage_event_idempotency.sql
-- ============================================================================

-- 1. Create idempotency table to prevent duplicate event processing
CREATE TABLE IF NOT EXISTS usage_event_idempotency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL,
  license_id UUID,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index on event_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_usage_event_idempotency_event_id
  ON usage_event_idempotency(event_id);

-- 3. Index on user_id for user-level queries
CREATE INDEX IF NOT EXISTS idx_usage_event_idempotency_user_id
  ON usage_event_idempotency(user_id);

-- 4. Index on license_id for license-level queries
CREATE INDEX IF NOT EXISTS idx_usage_event_idempotency_license_id
  ON usage_event_idempotency(license_id) WHERE license_id IS NOT NULL;

-- 5. Add retention policy (auto-delete idempotency records older than 30 days)
-- Using TimescaleDB if available, otherwise standard PostgreSQL
DO $$
BEGIN
  -- Check if TimescaleDB extension exists
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
    -- Add retention policy for idempotency table (30 days)
    PERFORM add_retention_policy('usage_event_idempotency', INTERVAL '30 days', if_not_exists => TRUE);
  END IF;
END $$;

-- 6. Grant permissions
GRANT SELECT, INSERT ON usage_event_idempotency TO authenticated;
GRANT SELECT ON usage_event_idempotency TO service_role;

-- 7. Create function to check and record idempotency
CREATE OR REPLACE FUNCTION check_usage_event_idempotency(
  p_event_id TEXT,
  p_user_id UUID,
  p_license_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE (is_duplicate BOOLEAN, id UUID) AS $$
DECLARE
  existing_record UUID;
BEGIN
  -- Try to insert the event_id
  BEGIN
    INSERT INTO usage_event_idempotency (event_id, user_id, license_id, metadata)
    VALUES (p_event_id, p_user_id, p_license_id, p_metadata)
    RETURNING id INTO existing_record;

    -- Insert succeeded, not a duplicate
    RETURN QUERY SELECT FALSE, existing_record;
  EXCEPTION
    WHEN unique_violation THEN
      -- Insert failed due to unique constraint, this is a duplicate
      SELECT id INTO existing_record
      FROM usage_event_idempotency
      WHERE event_id = p_event_id;

      RETURN QUERY SELECT TRUE, existing_record;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant execute permission
GRANT EXECUTE ON FUNCTION check_usage_event_idempotency TO authenticated;
GRANT EXECUTE ON FUNCTION check_usage_event_idempotency TO service_role;

-- ============================================================================
-- Migration Complete
-- ============================================================================
