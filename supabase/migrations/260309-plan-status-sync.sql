-- Migration: Plan Status Sync Tables
-- Created: 2026-03-09
-- Purpose: Tables for tracking plan status sync between RaaS Gateway and AgencyOS

-- ============================================================================
-- PLAN SYNC QUEUE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS plan_sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL,
    license_id TEXT,
    plan_id TEXT NOT NULL,
    plan_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    action TEXT NOT NULL, -- 'sync', 'webhook_polar', 'webhook_stripe'
    payload JSONB,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 5,
    last_error TEXT,
    next_retry_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    CONSTRAINT valid_status CHECK (status IN ('pending', 'syncing', 'completed', 'failed', 'dead_letter')),
    CONSTRAINT valid_action CHECK (action IN ('sync', 'webhook_polar', 'webhook_stripe', 'revoke'))
);

-- Index for efficient queue polling
CREATE INDEX IF NOT EXISTS idx_plan_sync_queue_status ON plan_sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_plan_sync_queue_next_retry ON plan_sync_queue(next_retry_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_plan_sync_queue_org ON plan_sync_queue(org_id);

-- ============================================================================
-- PLAN SYNC LOG TABLE (Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS plan_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL,
    license_id TEXT,
    plan_id TEXT NOT NULL,
    sync_status TEXT NOT NULL, -- 'success', 'failed'
    synced_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    error_message TEXT,
    response_data JSONB,
    sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_plan_sync_log_org ON plan_sync_log(org_id);
CREATE INDEX IF NOT EXISTS idx_plan_sync_log_timestamp ON plan_sync_log(sync_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_plan_sync_log_status ON plan_sync_log(sync_status);

-- ============================================================================
-- SUBSCRIPTIONS CACHE TABLE (from Polar/Stripe webhooks)
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id TEXT UNIQUE NOT NULL,
    org_id TEXT NOT NULL,
    license_id TEXT,
    provider TEXT NOT NULL, -- 'polar', 'stripe'
    status TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    plan_name TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    raw_webhook_data JSONB,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_cache_org ON subscriptions_cache(org_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_cache_status ON subscriptions_cache(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_cache_provider ON subscriptions_cache(provider);

-- ============================================================================
-- ENTITLEMENTS CACHE TABLE (synced to AgencyOS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS entitlements_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    plan_name TEXT,
    features JSONB DEFAULT '{}',
    quota_limits JSONB DEFAULT '{}',
    overage_rates JSONB DEFAULT '{}',
    effective_date TIMESTAMPTZ NOT NULL,
    expiry_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    last_synced_to_agencyos TIMESTAMPTZ,
    agencyos_sync_status TEXT DEFAULT 'pending', -- 'pending', 'synced', 'failed'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_sync_status CHECK (agencyos_sync_status IN ('pending', 'synced', 'failed'))
);

-- Unique constraint for one active entitlement per org
CREATE UNIQUE INDEX IF NOT EXISTS idx_entitlements_cache_org_active
    ON entitlements_cache(org_id)
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_entitlements_cache_org ON entitlements_cache(org_id);

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================

-- Function to get active subscriptions for sync
CREATE OR REPLACE FUNCTION get_active_subscriptions()
RETURNS TABLE (
    org_id TEXT,
    license_id TEXT,
    status TEXT,
    plan_id TEXT,
    plan_name TEXT,
    current_period_start TEXT,
    current_period_end TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sc.org_id,
        sc.license_id,
        sc.status,
        sc.plan_id,
        sc.plan_name,
        to_char(sc.current_period_start, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        to_char(sc.current_period_end, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    FROM subscriptions_cache sc
    WHERE sc.status IN ('active', 'trialing')
    ORDER BY sc.org_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check notification cooldown (reused for sync deduplication)
CREATE OR REPLACE FUNCTION check_plan_sync_cooldown(
    p_org_id TEXT,
    p_plan_id TEXT,
    p_cooldown_minutes INTEGER DEFAULT 5
)
RETURNS BOOLEAN AS $$
DECLARE
    last_sync TIMESTAMPTZ;
BEGIN
    SELECT MAX(sync_timestamp) INTO last_sync
    FROM plan_sync_log
    WHERE org_id = p_org_id
      AND plan_id = p_plan_id
      AND sync_status = 'success';

    IF last_sync IS NULL THEN
        RETURN TRUE; -- No previous sync, allow
    END IF;

    RETURN last_sync < (NOW() - (p_cooldown_minutes || ' minutes')::INTERVAL);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to enqueue plan sync
CREATE OR REPLACE FUNCTION enqueue_plan_sync(
    p_org_id TEXT,
    p_plan_id TEXT,
    p_plan_name TEXT DEFAULT NULL,
    p_license_id TEXT DEFAULT NULL,
    p_action TEXT DEFAULT 'sync'
)
RETURNS UUID AS $$
DECLARE
    v_sync_id UUID;
BEGIN
    INSERT INTO plan_sync_queue (org_id, plan_id, plan_name, license_id, action, status, next_retry_at)
    VALUES (p_org_id, p_plan_id, p_plan_name, p_license_id, p_action, 'pending', NOW())
    RETURNING id INTO v_sync_id;

    RETURN v_sync_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process next pending sync from queue
CREATE OR REPLACE FUNCTION process_next_plan_sync()
RETURNS TABLE (
    sync_id UUID,
    org_id TEXT,
    license_id TEXT,
    plan_id TEXT,
    plan_name TEXT,
    action TEXT,
    payload JSONB
) AS $$
BEGIN
    RETURN QUERY
    UPDATE plan_sync_queue
    SET status = 'syncing',
        updated_at = NOW()
    WHERE id = (
        SELECT id FROM plan_sync_queue
        WHERE status = 'pending'
          AND (next_retry_at IS NULL OR next_retry_at <= NOW())
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    )
    RETURNING id, org_id, license_id, plan_id, plan_name, action, payload;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark sync as completed
CREATE OR REPLACE FUNCTION complete_plan_sync(
    p_sync_id UUID,
    p_success BOOLEAN,
    p_error_message TEXT DEFAULT NULL,
    p_response_data JSONB DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_org_id TEXT;
    v_plan_id TEXT;
BEGIN
    -- Get org_id and plan_id
    SELECT org_id, plan_id INTO v_org_id, v_plan_id
    FROM plan_sync_queue
    WHERE id = p_sync_id;

    -- Update queue
    UPDATE plan_sync_queue
    SET status = CASE
            WHEN p_success THEN 'completed'
            WHEN retry_count >= max_retries THEN 'dead_letter'
            ELSE 'failed'
        END,
        last_error = p_error_message,
        completed_at = CASE WHEN p_success THEN NOW() ELSE NULL END,
        updated_at = NOW()
    WHERE id = p_sync_id;

    -- If failed and retries remaining, schedule retry
    IF NOT p_success THEN
        UPDATE plan_sync_queue
        SET retry_count = retry_count + 1,
            next_retry_at = NOW() + (LEAST(POWER(2, retry_count), 60) || ' minutes')::INTERVAL,
            status = 'pending'
        WHERE id = p_sync_id
          AND retry_count < max_retries;
    END IF;

    -- Log the sync result
    INSERT INTO plan_sync_log (org_id, plan_id, sync_status, error_message, response_data)
    VALUES (v_org_id, v_plan_id,
            CASE WHEN p_success THEN 'success' ELSE 'failed' END,
            p_error_message, p_response_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upsert subscription from webhook
CREATE OR REPLACE FUNCTION upsert_subscription_from_webhook(
    p_subscription_id TEXT,
    p_org_id TEXT,
    p_provider TEXT,
    p_status TEXT,
    p_plan_id TEXT,
    p_plan_name TEXT DEFAULT NULL,
    p_license_id TEXT DEFAULT NULL,
    p_current_period_start TIMESTAMPTZ DEFAULT NULL,
    p_current_period_end TIMESTAMPTZ DEFAULT NULL,
    p_cancel_at_period_end BOOLEAN DEFAULT FALSE,
    p_metadata JSONB DEFAULT NULL,
    p_raw_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_sub_id UUID;
BEGIN
    INSERT INTO subscriptions_cache (
        subscription_id, org_id, license_id, provider, status,
        plan_id, plan_name, current_period_start, current_period_end,
        cancel_at_period_end, metadata, raw_webhook_data, last_synced_at
    )
    VALUES (
        p_subscription_id, p_org_id, p_license_id, p_provider, p_status,
        p_plan_id, p_plan_name, p_current_period_start, p_current_period_end,
        p_cancel_at_period_end, p_metadata, p_raw_data, NOW()
    )
    ON CONFLICT (subscription_id) DO UPDATE SET
        status = EXCLUDED.status,
        plan_name = EXCLUDED.plan_name,
        current_period_start = EXCLUDED.current_period_start,
        current_period_end = EXCLUDED.current_period_end,
        cancel_at_period_end = EXCLUDED.cancel_at_period_end,
        metadata = EXCLUDED.metadata,
        raw_webhook_data = EXCLUDED.raw_webhook_data,
        last_synced_at = NOW(),
        updated_at = NOW()
    RETURNING id INTO v_sub_id;

    -- Queue sync to AgencyOS
    PERFORM enqueue_plan_sync(p_org_id, p_plan_id, p_plan_name, p_license_id, 'webhook_' || p_provider);

    RETURN v_sub_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE plan_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlements_cache ENABLE ROW LEVEL SECURITY;

-- Service role policies (for Edge Functions)
CREATE POLICY "Service role can manage plan_sync_queue"
    ON plan_sync_queue FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage plan_sync_log"
    ON plan_sync_log FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage subscriptions_cache"
    ON subscriptions_cache FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage entitlements_cache"
    ON entitlements_cache FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Authenticated users can read their own data
CREATE POLICY "Users can view own plan_sync_log"
    ON plan_sync_log FOR SELECT
    USING (auth.jwt()->>'org_id' = org_id OR auth.jwt()->>'sub' = org_id);

CREATE POLICY "Users can view own entitlements"
    ON entitlements_cache FOR SELECT
    USING (auth.jwt()->>'org_id' = org_id OR auth.jwt()->>'sub' = org_id);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plan_sync_queue_updated_at
    BEFORE UPDATE ON plan_sync_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_cache_updated_at
    BEFORE UPDATE ON subscriptions_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entitlements_cache_updated_at
    BEFORE UPDATE ON entitlements_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE plan_sync_queue IS 'Queue for plan status sync jobs to AgencyOS';
COMMENT ON TABLE plan_sync_log IS 'Audit log for plan sync operations';
COMMENT ON TABLE subscriptions_cache IS 'Cached subscription data from Polar/Stripe webhooks';
COMMENT ON TABLE entitlements_cache IS 'Cached plan entitlements synced to AgencyOS';

COMMENT ON FUNCTION get_active_subscriptions IS 'Returns active subscriptions for sync processing';
COMMENT ON FUNCTION check_plan_sync_cooldown IS 'Checks if enough time has passed since last sync';
COMMENT ON FUNCTION enqueue_plan_sync IS 'Adds a new plan sync job to the queue';
COMMENT ON FUNCTION process_next_plan_sync IS 'Gets next pending sync job for processing';
COMMENT ON FUNCTION complete_plan_sync IS 'Marks a sync job as completed or failed with retry logic';
COMMENT ON FUNCTION upsert_subscription_from_webhook IS 'Upserts subscription from webhook and queues sync';
