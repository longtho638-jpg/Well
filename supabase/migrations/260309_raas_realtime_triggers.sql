-- ============================================================================
-- RaaS Realtime Triggers
-- Phase 6.1: Real-time Analytics Pipeline
-- Migration: 260309_raas_realtime_triggers
-- ============================================================================
--
-- Purpose:
-- - Enable Supabase Realtime broadcasting for analytics events
-- - Create trigger function to broadcast INSERT events
-- - Configure replication for raas_analytics_events table
--
-- Usage:
--   npx supabase db push
--   OR
--   psql "$(npx supabase db url)" -f 260309_raas_realtime_triggers.sql
--

-- ============================================================================
-- 1. ENABLE REALTIME PUBLICATION
-- ============================================================================

-- Check if publication exists, create if not
DO $$
BEGIN
  -- Create publication for realtime if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Add raas_analytics_events table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE raas_analytics_events;

-- ============================================================================
-- 2. ENABLE REPLICATION
-- ============================================================================

-- Enable replication on the table
ALTER TABLE raas_analytics_events REPLICA IDENTITY FULL;

-- ============================================================================
-- 3. CREATE BROADCAST TRIGGER FUNCTION
-- ============================================================================

-- Create or replace the trigger function for broadcasting events
CREATE OR REPLACE FUNCTION broadcast_raas_analytics_event()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
BEGIN
  -- Build event payload matching RaasEvent interface
  payload := jsonb_build_object(
    'event_id', NEW.id::text,
    'event_type', NEW.event_type,
    'org_id', NEW.org_id,
    'user_id', NEW.user_id::text,
    'timestamp', NEW.timestamp,
    'request_id', NEW.request_id,
    'path', NEW.path,
    'ip_address', NEW.ip_address::text,

    -- Suspension event fields
    'reason', NEW.reason,
    'subscription_status', NEW.subscription_status,
    'days_past_due', NEW.days_past_due,
    'amount_owed', NEW.amount_owed::text,
    'dunning_stage', NEW.dunning_stage,
    'grace_period_hours', NEW.grace_period_hours::text,

    -- License event fields
    'license_key', NEW.license_key,
    'tier', NEW.tier,
    'valid', NEW.valid,
    'source', NEW.source,
    'response_time_ms', NEW.response_time_ms,
    'cached', NEW.cached,

    -- Warning event fields
    'warning_type', NEW.warning_type,
    'days_remaining', NEW.days_remaining,
    'quota_percentage', NEW.quota_percentage,

    -- Admin bypass fields
    'admin_id', NEW.admin_id,
    'target_org_id', NEW.target_org_id,

    -- Metadata
    'metadata', NEW.metadata
  );

  -- Send broadcast event via Supabase Realtime
  PERFORM pg_notify(
    'realtime:raas_analytics_events',
    jsonb_build_object(
      'schema', 'public',
      'table', 'raas_analytics_events',
      'commit_timestamp', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'type', 'INSERT',
      'new', payload
    )::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. CREATE TRIGGER
-- ============================================================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS broadcast_raas_analytics_insert ON raas_analytics_events;

-- Create trigger on INSERT
CREATE TRIGGER broadcast_raas_analytics_insert
  AFTER INSERT ON raas_analytics_events
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_raas_analytics_event();

-- ============================================================================
-- 5. OPTIMIZED INDEXES FOR REALTIME QUERIES
-- ============================================================================

-- Index for org + event type filtering (common in realtime subscriptions)
CREATE INDEX IF NOT EXISTS idx_raas_analytics_org_event
  ON raas_analytics_events(org_id, event_type, timestamp DESC);

-- Index for recent events query (dashboard)
CREATE INDEX IF NOT EXISTS idx_raas_analytics_recent
  ON raas_analytics_events(timestamp DESC, org_id)
  WHERE timestamp > NOW() - INTERVAL '24 hours';

-- Partial index for high-frequency event types
CREATE INDEX IF NOT EXISTS idx_raas_analytics_license_validated
  ON raas_analytics_events(org_id, timestamp DESC)
  WHERE event_type = 'license_validated';

CREATE INDEX IF NOT EXISTS idx_raas_analytics_quota_check
  ON raas_analytics_events(org_id, timestamp DESC)
  WHERE event_type = 'quota_check';

-- ============================================================================
-- 6. RPC FUNCTION FOR RECENT EVENTS (FALLBACK)
-- ============================================================================

-- Get recent events for an org (with realtime as primary, this is fallback)
CREATE OR REPLACE FUNCTION get_raas_recent_events(
  p_org_id TEXT,
  p_limit INTEGER DEFAULT 50,
  p_event_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  event_type TEXT,
  org_id TEXT,
  user_id UUID,
  timestamp TIMESTAMPTZ,
  reason TEXT,
  subscription_status TEXT,
  license_key TEXT,
  tier TEXT,
  valid BOOLEAN,
  warning_type TEXT,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.event_type,
    e.org_id,
    e.user_id,
    e.timestamp,
    e.reason,
    e.subscription_status,
    e.license_key,
    e.tier,
    e.valid,
    e.warning_type,
    e.metadata
  FROM raas_analytics_events e
  WHERE e.org_id = p_org_id
    AND (p_event_type IS NULL OR e.event_type = p_event_type)
  ORDER BY e.timestamp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. CLEANUP FUNCTION FOR OLD EVENTS
-- ============================================================================

-- Function to clean up old events (retention policy)
CREATE OR REPLACE FUNCTION cleanup_raas_analytics_events(
  p_retention_days INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM raas_analytics_events
  WHERE timestamp < NOW() - (p_retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup via pg_cron (if available)
DO $$
BEGIN
  -- Only create schedule if pg_cron is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Clean up events older than 90 days, daily at 3 AM UTC
    PERFORM cron.schedule(
      'cleanup-raas-analytics-events',
      '0 3 * * *',
      'SELECT cleanup_raas_analytics_events(90)'
    );
  END IF;
END $$;

-- ============================================================================
-- 8. GRANT PERMISSIONS
-- ============================================================================

-- Allow authenticated users to read their org's events via RPC
GRANT EXECUTE ON FUNCTION get_raas_recent_events TO authenticated;

-- Allow service role to execute cleanup
GRANT EXECUTE ON FUNCTION cleanup_raas_analytics_events TO service_role;

-- ============================================================================
-- 9. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION broadcast_raas_analytics_event() IS
  'Trigger function to broadcast INSERT events via Supabase Realtime';

COMMENT ON TRIGGER broadcast_raas_analytics_insert ON raas_analytics_events IS
  'Broadcasts new analytics events to realtime subscribers';

COMMENT ON FUNCTION get_raas_recent_events(TEXT, INTEGER, TEXT) IS
  'Get recent analytics events for an org (fallback for realtime)';

COMMENT ON FUNCTION cleanup_raas_analytics_events(INTEGER) IS
  'Clean up analytics events older than specified retention days';

-- ============================================================================
-- 10. VERIFICATION QUERIES
-- ============================================================================

-- Verify publication
-- SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- Verify table is in publication
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Verify trigger exists
-- SELECT * FROM pg_trigger WHERE tgname = 'broadcast_raas_analytics_insert';

-- Verify replication identity
-- SELECT relname, relreplident FROM pg_class WHERE relname = 'raas_analytics_events';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Output confirmation
DO $$
BEGIN
  RAISE NOTICE 'RaaS Realtime Triggers migration completed successfully!';
  RAISE NOTICE 'Supabase Realtime is now enabled for raas_analytics_events';
  RAISE NOTICE 'Subscription topic: raas_analytics_events:*';
END $$;
