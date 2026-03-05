-- ============================================================================
-- Phase 2C: Advisory Lock Functions for Bonus Pool Distribution
-- ============================================================================
-- Created: 2026-03-05
-- Description: PostgreSQL advisory locks for preventing race conditions
--              in bonus pool distribution

-- Create advisory lock helper functions
-- These use PostgreSQL's built-in pg_advisory_lock system

-- Try to acquire lock (non-blocking)
-- Returns true if lock acquired, false if already held
CREATE OR REPLACE FUNCTION try_advisory_lock(lock_key INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  lock_acquired BOOLEAN;
BEGIN
  -- Try to acquire lock without waiting
  SELECT pg_try_advisory_lock(lock_key) INTO lock_acquired;
  RETURN lock_acquired;
END;
$$ LANGUAGE plpgsql;

-- Release advisory lock
CREATE OR REPLACE FUNCTION release_advisory_lock(lock_key INTEGER)
RETURNS VOID AS $$
BEGIN
  -- Release the lock
  PERFORM pg_advisory_unlock(lock_key);
END;
$$ LANGUAGE plpgsql;

-- Alternative: Acquire lock with timeout (blocking)
-- Waits up to timeout_seconds for lock to become available
CREATE OR REPLACE FUNCTION try_advisory_lock_with_timeout(lock_key INTEGER, timeout_seconds INTEGER DEFAULT 30)
RETURNS BOOLEAN AS $$
DECLARE
  start_time TIMESTAMPTZ;
  lock_acquired BOOLEAN := FALSE;
BEGIN
  start_time := clock_timestamp();

  -- Try to acquire lock in a loop with timeout
  WHILE (clock_timestamp() - start_time) < (timeout_seconds || ' seconds')::INTERVAL LOOP
    SELECT pg_try_advisory_lock(lock_key) INTO lock_acquired;

    IF lock_acquired THEN
      RETURN TRUE;
    END IF;

    -- Wait 100ms before retrying
    PERFORM pg_sleep(0.1);
  END LOOP;

  RETURN FALSE; -- Timeout expired, lock not acquired
END;
$$ LANGUAGE plpgsql;

-- Check if lock is currently held
CREATE OR REPLACE FUNCTION is_lock_held(lock_key INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  is_held BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_locks
    WHERE locktype = 'advisory'
      AND classid = (lock_key >> 32) -- High 32 bits
      AND objid = (lock_key & 4294967295) -- Low 32 bits (2^32 - 1)
      AND granted = TRUE
  ) INTO is_held;

  RETURN is_held;
END;
$$ LANGUAGE plpgsql;

-- Security: Only service_role can execute these functions
REVOKE ALL ON FUNCTION try_advisory_lock(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION release_advisory_lock(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION try_advisory_lock_with_timeout(INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION is_lock_held(INTEGER) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION try_advisory_lock(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION release_advisory_lock(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION try_advisory_lock_with_timeout(INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION is_lock_held(INTEGER) TO service_role;

-- Create view for monitoring active locks
CREATE OR REPLACE VIEW v_active_advisory_locks AS
SELECT
  locktype,
  database,
  relation,
  page,
  tuple,
  virtualxid,
  transactionid,
  classid,
  objid,
  objsubid,
  virtualtransaction,
  pid,
  mode,
  granted,
  waitstart,
  query_start,
  backend_start,
  xact_start,
  state,
  wait_event_type,
  wait_event,
  query
FROM pg_locks l
LEFT JOIN pg_stat_activity a ON l.pid = a.pid
WHERE locktype = 'advisory'
ORDER BY query_start;

-- Security: Only admins can view lock monitoring
REVOKE ALL ON v_active_advisory_locks FROM PUBLIC;
GRANT SELECT ON v_active_advisory_locks TO authenticated;

COMMENT ON FUNCTION try_advisory_lock(INTEGER) IS 'Acquire advisory lock without blocking (returns false if already held)';
COMMENT ON FUNCTION release_advisory_lock(INTEGER) IS 'Release advisory lock';
COMMENT ON FUNCTION try_advisory_lock_with_timeout(INTEGER, INTEGER) IS 'Acquire advisory lock with timeout (blocks up to timeout_seconds)';
COMMENT ON FUNCTION is_lock_held(INTEGER) IS 'Check if advisory lock is currently held by any session';
COMMENT ON VIEW v_active_advisory_locks IS 'Monitor active advisory locks across all sessions';
