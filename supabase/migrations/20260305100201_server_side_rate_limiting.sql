-- Server-side Rate Limiting with PostgreSQL
-- Date: 2026-03-05
-- Uses atomic PostgreSQL operations for distributed-safe rate limiting

-- ============================================================================
-- RATE LIMITS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS rate_limits (
    id TEXT PRIMARY KEY,
    request_count INTEGER NOT NULL DEFAULT 0,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_window
ON rate_limits (window_start);

-- ============================================================================
-- RATE LIMIT CHECK FUNCTION (Atomic)
-- ============================================================================

CREATE OR REPLACE FUNCTION check_rate_limit(
    p_key TEXT,
    p_window_start TIMESTAMP WITH TIME ZONE,
    p_max_requests INTEGER DEFAULT 100
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
    v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- Try to update existing record within window
    UPDATE rate_limits
    SET
        request_count = request_count + 1,
        updated_at = v_now
    WHERE
        id = p_key
        AND window_start >= p_window_start
    RETURNING request_count INTO v_count;

    -- If no record updated, check if old record exists
    IF v_count IS NULL THEN
        -- Delete old records (cleanup)
        DELETE FROM rate_limits
        WHERE id = p_key AND window_start < p_window_start;

        -- Insert new record
        INSERT INTO rate_limits (id, request_count, window_start)
        VALUES (p_key, 1, v_now)
        ON CONFLICT (id) DO UPDATE
        SET
            request_count = 1,
            window_start = v_now,
            updated_at = v_now;

        RETURN TRUE;
    END IF;

    -- Check if under limit
    IF v_count <= p_max_requests THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;

-- ============================================================================
-- CLEANUP OLD RECORDS (Run periodically)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_rate_limits(
    p_older_than INTERVAL DEFAULT INTERVAL '1 hour'
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM rate_limits
    WHERE window_start < NOW() - p_older_than;

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$;

-- ============================================================================
-- ADMIN VIEW: Monitor Rate Limits
-- ============================================================================

CREATE OR REPLACE VIEW admin_rate_limits AS
SELECT
    id,
    request_count,
    window_start,
    created_at,
    updated_at,
    EXTRACT(EPOCH FROM (NOW() - window_start)) AS seconds_since_window_start
FROM rate_limits
ORDER BY updated_at DESC;

-- ============================================================================
-- SEED: Initial cleanup schedule (optional - use pg_cron)
-- ============================================================================

-- If pg_cron is enabled, schedule automatic cleanup every hour:
-- SELECT cron.schedule(
--     'cleanup-rate-limits-hourly',
--     '0 * * * *',
--     'SELECT cleanup_rate_limits(INTERVAL ''1 hour'')'
-- );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Test rate limit function
-- SELECT check_rate_limit('test_user_api', NOW() - INTERVAL '1 minute', 5);

-- Check current rate limits
-- SELECT * FROM admin_rate_limits LIMIT 10;

-- Cleanup old records
-- SELECT cleanup_rate_limits(INTERVAL '1 hour');
