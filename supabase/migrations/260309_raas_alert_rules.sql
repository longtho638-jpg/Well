-- RaaS Alert Rules & Events Migration
-- Phase 6.4-6.6: Alerting Rules + i18n + Audit Trail
-- Date: 2026-03-09
-- Description: Creates tables for alert rules configuration and alert events tracking

-- ============================================================================
-- ALERT RULES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS raas_alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('quota_threshold', 'feature_blocked', 'spending_limit', 'license_expiring', 'suspension_warning')),
    name TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
    threshold NUMERIC NOT NULL DEFAULT 90,
    operator TEXT NOT NULL DEFAULT 'gte' CHECK (operator IN ('gt', 'gte', 'lt', 'lte', 'eq')),
    enabled BOOLEAN NOT NULL DEFAULT true,
    cooldown_seconds INTEGER DEFAULT 3600,
    notification_channels TEXT[],
    message_template TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_raas_alert_rules_org_id ON raas_alert_rules(org_id);
CREATE INDEX IF NOT EXISTS idx_raas_alert_rules_rule_type ON raas_alert_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_raas_alert_rules_enabled ON raas_alert_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_raas_alert_rules_severity ON raas_alert_rules(severity);
CREATE INDEX IF NOT EXISTS idx_raas_alert_rules_expires_at ON raas_alert_rules(expires_at);

-- Row Level Security
ALTER TABLE raas_alert_rules ENABLE ROW LEVEL SECURITY;

-- Policies for alert rules
CREATE POLICY "Users can view their own alert rules"
    ON raas_alert_rules FOR SELECT
    USING (auth.uid() = org_id);

CREATE POLICY "Users can insert their own alert rules"
    ON raas_alert_rules FOR INSERT
    WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can update their own alert rules"
    ON raas_alert_rules FOR UPDATE
    USING (auth.uid() = org_id);

CREATE POLICY "Users can delete their own alert rules"
    ON raas_alert_rules FOR DELETE
    USING (auth.uid() = org_id);

-- Admin policy for full access
CREATE POLICY "Admins can manage all alert rules"
    ON raas_alert_rules FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- ============================================================================
-- ALERT EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS raas_alert_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES raas_alert_rules(id) ON DELETE SET NULL,
    rule_type TEXT NOT NULL,
    triggered BOOLEAN NOT NULL DEFAULT false,
    current_value NUMERIC NOT NULL,
    threshold_value NUMERIC NOT NULL,
    severity TEXT NOT NULL,
    message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_raas_alert_events_org_id ON raas_alert_events(org_id);
CREATE INDEX IF NOT EXISTS idx_raas_alert_events_rule_id ON raas_alert_events(rule_id);
CREATE INDEX IF NOT EXISTS idx_raas_alert_events_rule_type ON raas_alert_events(rule_type);
CREATE INDEX IF NOT EXISTS idx_raas_alert_events_triggered ON raas_alert_events(triggered);
CREATE INDEX IF NOT EXISTS idx_raas_alert_events_created_at ON raas_alert_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_raas_alert_events_org_created ON raas_alert_events(org_id, created_at DESC);

-- Row Level Security
ALTER TABLE raas_alert_events ENABLE ROW LEVEL SECURITY;

-- Policies for alert events
CREATE POLICY "Users can view their own alert events"
    ON raas_alert_events FOR SELECT
    USING (auth.uid() = org_id);

CREATE POLICY "System can insert alert events"
    ON raas_alert_events FOR INSERT
    WITH CHECK (true);

-- Admin policy for full access
CREATE POLICY "Admins can manage all alert events"
    ON raas_alert_events FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- ============================================================================
-- ADD API KEY & SESSION TRACKING TO SUSPENSION_EVENTS
-- ============================================================================

-- Add columns if they don't exist
ALTER TABLE suspension_events
    ADD COLUMN IF NOT EXISTS api_key TEXT,
    ADD COLUMN IF NOT EXISTS session_id TEXT,
    ADD COLUMN IF NOT EXISTS ip_address TEXT,
    ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Indexes for API key and session tracking
CREATE INDEX IF NOT EXISTS idx_suspension_events_api_key ON suspension_events(api_key);
CREATE INDEX IF NOT EXISTS idx_suspension_events_session_id ON suspension_events(session_id);

-- ============================================================================
-- ADD API KEY & SESSION TRACKING TO RAAS_ANALYTICS_EVENTS
-- ============================================================================

-- Add columns if they don't exist
ALTER TABLE raas_analytics_events
    ADD COLUMN IF NOT EXISTS api_key TEXT,
    ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Indexes for API key and session tracking
CREATE INDEX IF NOT EXISTS idx_raas_analytics_events_api_key ON raas_analytics_events(api_key);
CREATE INDEX IF NOT EXISTS idx_raas_analytics_events_session_id ON raas_analytics_events(session_id);

-- ============================================================================
-- FUNCTION: Auto-cleanup expired alert rules
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_alert_rules()
RETURNS void AS $$
BEGIN
    DELETE FROM raas_alert_rules
    WHERE expires_at < NOW();

    RAISE NOTICE 'Cleaned up expired alert rules';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get alert rules with rate limit check
-- ============================================================================

CREATE OR REPLACE FUNCTION get_active_alert_rules(
    p_org_id UUID,
    p_rule_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    org_id UUID,
    rule_type TEXT,
    name TEXT,
    description TEXT,
    severity TEXT,
    threshold NUMERIC,
    operator TEXT,
    cooldown_seconds INTEGER,
    message_template TEXT,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ar.id,
        ar.org_id,
        ar.rule_type,
        ar.name,
        ar.description,
        ar.severity,
        ar.threshold,
        ar.operator,
        ar.cooldown_seconds,
        ar.message_template,
        ar.metadata
    FROM raas_alert_rules ar
    WHERE ar.org_id = p_org_id
        AND ar.enabled = true
        AND (ar.expires_at IS NULL OR ar.expires_at > NOW())
        AND (p_rule_type IS NULL OR ar.rule_type = p_rule_type)
    ORDER BY
        CASE ar.severity
            WHEN 'critical' THEN 1
            WHEN 'warning' THEN 2
            WHEN 'info' THEN 3
            ELSE 4
        END,
        ar.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Check cooldown for alert rule
-- ============================================================================

CREATE OR REPLACE FUNCTION check_alert_cooldown(
    p_org_id UUID,
    p_rule_id UUID,
    p_cooldown_seconds INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    last_alert_time TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT MAX(created_at) INTO last_alert_time
    FROM raas_alert_events
    WHERE org_id = p_org_id
        AND rule_id = p_rule_id;

    IF last_alert_time IS NULL THEN
        RETURN TRUE; -- No previous alert, allow
    END IF;

    IF NOW() - last_alert_time > (p_cooldown_seconds || ' seconds')::INTERVAL THEN
        RETURN TRUE; -- Cooldown expired, allow
    END IF;

    RETURN FALSE; -- Still in cooldown, block
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SEED DATA: Default alert rules template
-- ============================================================================

-- Function to initialize default alert rules for new organizations
CREATE OR REPLACE FUNCTION initialize_default_alert_rules(p_org_id UUID)
RETURNS void AS $$
BEGIN
    -- Only insert if no rules exist for this org
    IF NOT EXISTS (SELECT 1 FROM raas_alert_rules WHERE org_id = p_org_id) THEN
        -- Quota 90% Warning
        INSERT INTO raas_alert_rules (org_id, rule_type, name, description, severity, threshold, operator, cooldown_seconds, message_template, metadata)
        VALUES
            (p_org_id, 'quota_threshold', 'Quota 90% Warning', 'Alert when quota usage exceeds 90%', 'warning', 90, 'gte', 3600, 'Quota usage at {{percentage}}% - approaching limit', '{"threshold_type": "percentage"}'::jsonb),

            -- Quota 95% Critical
            (p_org_id, 'quota_threshold', 'Quota 95% Critical', 'Critical alert when quota usage exceeds 95%', 'critical', 95, 'gte', 1800, 'Quota usage at {{percentage}}% - critical limit', '{"threshold_type": "percentage"}'::jsonb),

            -- Spending 80% Warning
            (p_org_id, 'spending_limit', 'Spending 80% Warning', 'Alert when spending reaches 80% of limit', 'warning', 80, 'gte', 7200, 'Spending at {{percentage}}% of limit', '{"threshold_type": "percentage"}'::jsonb),

            -- Feature Blocked
            (p_org_id, 'feature_blocked', 'Feature Blocked', 'Alert when a feature access is blocked', 'info', 1, 'eq', 300, 'Feature {{featureName}} access blocked: {{reason}}', '{}'::jsonb);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE raas_alert_rules IS 'Stores configurable alert rules for RaaS monitoring';
COMMENT ON TABLE raas_alert_events IS 'Tracks triggered alert events for audit and compliance';
COMMENT ON COLUMN raas_alert_rules.threshold IS 'Threshold value for triggering alert';
COMMENT ON COLUMN raas_alert_rules.operator IS 'Comparison operator: gt, gte, lt, lte, eq';
COMMENT ON COLUMN raas_alert_rules.cooldown_seconds IS 'Minimum seconds between consecutive alerts for same rule';
COMMENT ON COLUMN raas_alert_rules.message_template IS 'Template with {{variable}} placeholders for alert messages';
COMMENT ON COLUMN raas_alert_rules.metadata IS 'Additional rule configuration in JSON format';
COMMENT ON COLUMN raas_alert_events.current_value IS 'Actual value that triggered (or didn''t trigger) the alert';
COMMENT ON COLUMN raas_alert_events.threshold_value IS 'Threshold value compared against';

-- ============================================================================
-- GRANTS (for service role access)
-- ============================================================================

-- Grant access to service role for edge functions
GRANT ALL ON raas_alert_rules TO service_role;
GRANT ALL ON raas_alert_events TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_alert_rules TO service_role;
GRANT EXECUTE ON FUNCTION get_active_alert_rules TO service_role;
GRANT EXECUTE ON FUNCTION check_alert_cooldown TO service_role;
GRANT EXECUTE ON FUNCTION initialize_default_alert_rules TO service_role;
