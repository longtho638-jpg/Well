-- ============================================================================
-- WellNexus RaaS — AgencyOS Analytics Sync (Phase 8)
-- Migration: 2603082130_agencyos_analytics_sync.sql
-- Purpose: Track sync operations from RaaS Gateway to Supabase
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. AGENCYOS SYNC QUEUE — Queue for sync requests
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agencyos_sync_queue (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period          TEXT NOT NULL, -- YYYY-MM format
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'syncing', 'completed', 'failed')),
  requested_by    UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  error_message   TEXT,
  retry_count     INTEGER NOT NULL DEFAULT 0,
  max_retries     INTEGER NOT NULL DEFAULT 3
);

-- Indexes for queue queries
CREATE INDEX IF NOT EXISTS idx_agencyos_sync_queue_org ON agencyos_sync_queue(org_id);
CREATE INDEX IF NOT EXISTS idx_agencyos_sync_queue_status ON agencyos_sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_agencyos_sync_queue_period ON agencyos_sync_queue(period);
CREATE INDEX IF NOT EXISTS idx_agencyos_sync_queue_created ON agencyos_sync_queue(created_at);

-- Unique constraint: one sync per org per period
CREATE UNIQUE INDEX IF NOT EXISTS idx_agencyos_sync_queue_unique
  ON agencyos_sync_queue(org_id, period)
  WHERE status IN ('pending', 'syncing');

-- RLS
ALTER TABLE agencyos_sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agencyos_sync_queue_org_read"
  ON agencyos_sync_queue FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "agencyos_sync_queue_org_insert"
  ON agencyos_sync_queue FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "agencyos_sync_queue_admin"
  ON agencyos_sync_queue FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role_id <= 2
    )
  );

-- ----------------------------------------------------------------------------
-- 2. AGENCYOS SYNC LOG — Audit log for sync operations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agencyos_sync_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period          TEXT NOT NULL, -- YYYY-MM format
  sync_status     TEXT NOT NULL DEFAULT 'pending'
                  CHECK (sync_status IN ('pending', 'success', 'failed')),
  synced_count    INTEGER NOT NULL DEFAULT 0,
  metrics_synced  TEXT[], -- Array of metric types that were synced
  error_message   TEXT,
  response_data   JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for log queries
CREATE INDEX IF NOT EXISTS idx_agencyos_sync_log_org ON agencyos_sync_log(org_id);
CREATE INDEX IF NOT EXISTS idx_agencyos_sync_log_status ON agencyos_sync_log(sync_status);
CREATE INDEX IF NOT EXISTS idx_agencyos_sync_log_period ON agencyos_sync_log(period);
CREATE INDEX IF NOT EXISTS idx_agencyos_sync_log_created ON agencyos_sync_log(created_at);

-- RLS
ALTER TABLE agencyos_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agencyos_sync_log_org_read"
  ON agencyos_sync_log FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "agencyos_sync_log_admin"
  ON agencyos_sync_log FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role_id <= 2
    )
  );

-- ----------------------------------------------------------------------------
-- 3. HELPER FUNCTION — Queue a sync request
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION queue_agencyos_sync(
  p_org_id UUID,
  p_period TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_sync_id UUID;
  v_period TEXT;
BEGIN
  -- Default to current period if not specified
  v_period := COALESCE(p_period, to_char(CURRENT_DATE, 'YYYY-MM'));

  -- Check if already pending or syncing
  SELECT id INTO v_sync_id
  FROM agencyos_sync_queue
  WHERE org_id = p_org_id
    AND period = v_period
    AND status IN ('pending', 'syncing')
  LIMIT 1;

  -- If exists, return existing ID
  IF v_sync_id IS NOT NULL THEN
    RETURN v_sync_id;
  END IF;

  -- Create new queue entry
  INSERT INTO agencyos_sync_queue (org_id, period, status, requested_by)
  VALUES (p_org_id, v_period, 'pending', auth.uid())
  ON CONFLICT (org_id, period)
    WHERE status IN ('pending', 'syncing')
    DO UPDATE SET
      status = 'pending',
      created_at = NOW()
  RETURNING id INTO v_sync_id;

  RETURN v_sync_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 4. HELPER FUNCTION — Get next pending sync
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_next_agencyos_sync()
RETURNS agencyos_sync_queue AS $$
DECLARE
  v_sync agencyos_sync_queue%ROWTYPE;
BEGIN
  -- Get oldest pending sync
  SELECT * INTO v_sync
  FROM agencyos_sync_queue
  WHERE status = 'pending'
  ORDER BY created_at ASC
  LIMIT 1;

  -- Mark as syncing
  IF v_sync.id IS NOT NULL THEN
    UPDATE agencyos_sync_queue
    SET status = 'syncing',
        started_at = NOW()
    WHERE id = v_sync.id;
  END IF;

  RETURN v_sync;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 5. HELPER FUNCTION — Complete sync with result
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION complete_agencyos_sync(
  p_sync_id UUID,
  p_status TEXT, -- 'completed' or 'failed'
  p_synced_count INTEGER DEFAULT 0,
  p_metrics_synced TEXT[] DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_response_data JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Update queue entry
  UPDATE agencyos_sync_queue
  SET status = p_status,
      completed_at = NOW(),
      error_message = p_error_message,
      retry_count = CASE
        WHEN p_status = 'failed' THEN retry_count + 1
        ELSE retry_count
      END
  WHERE id = p_sync_id;

  -- Insert log entry
  INSERT INTO agencyos_sync_log (
    org_id,
    period,
    sync_status,
    synced_count,
    metrics_synced,
    error_message,
    response_data
  )
  SELECT
    org_id,
    period,
    p_status,
    p_synced_count,
    p_metrics_synced,
    p_error_message,
    p_response_data
  FROM agencyos_sync_queue
  WHERE id = p_sync_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 6. CRON SCHEDULE — Run every 6 hours to sync pending requests
-- ----------------------------------------------------------------------------
-- Note: This assumes pg_cron is installed and configured
-- If not, the sync can be triggered manually via Edge Function

DO $$
BEGIN
  -- Schedule sync job every 6 hours
  BEGIN
    PERFORM cron.schedule(
      'agencyos-usage-sync-6h',
      '0 */6 * * *', -- Every 6 hours
      $$ SELECT get_next_agencyos_sync() $$
    );
  EXCEPTION WHEN OTHERS THEN
    -- pg_cron might not be available, that's OK
    RAISE NOTICE 'pg_cron not available, manual sync required';
  END;
END $$;

-- ----------------------------------------------------------------------------
-- 7. COMMENTS
-- ----------------------------------------------------------------------------
COMMENT ON TABLE agencyos_sync_queue IS 'Queue for AgencyOS RaaS Gateway sync requests';
COMMENT ON TABLE agencyos_sync_log IS 'Audit log for AgencyOS RaaS Gateway sync operations';
COMMENT ON FUNCTION queue_agencyos_sync IS 'Queue a new sync request for AgencyOS usage data';
COMMENT ON FUNCTION get_next_agencyos_sync IS 'Get and lock next pending sync for processing';
COMMENT ON FUNCTION complete_agencyos_sync IS 'Mark sync as completed/failed and log result';
