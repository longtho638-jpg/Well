-- ============================================================================
-- Usage Events with Tenant Isolation and RLS Policies
-- Migration: 202603062300_usage_events_tenant_rls.sql
-- ============================================================================

-- 1. Create usage_events table with tenant-specific fields
CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,                 -- Tenant isolation key
  model_id TEXT NOT NULL,                  -- AI model identifier
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,      -- Additional context (user_id, request_id, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_usage_events_tenant_id ON usage_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_model_id ON usage_events(model_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_timestamp ON usage_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_tenant_time ON usage_events(tenant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_tenant_model_time ON usage_events(tenant_id, model_id, timestamp DESC);

-- 3. GIN index for metadata queries
CREATE INDEX IF NOT EXISTS idx_usage_events_metadata ON usage_events USING GIN (metadata);

-- 4. Enable Row Level Security
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies - Tenants can only see their own data

-- Policy: SELECT - Tenants can read only their own usage events
CREATE POLICY tenant_isolation_select ON usage_events
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Policy: INSERT - Tenants can insert their own usage events
CREATE POLICY tenant_isolation_insert ON usage_events
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant')::uuid);

-- Policy: UPDATE - Tenants can update their own usage events (if needed)
CREATE POLICY tenant_isolation_update ON usage_events
  FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant')::uuid);

-- Policy: DELETE - Tenants can delete their own usage events (if needed)
CREATE POLICY tenant_isolation_delete ON usage_events
  FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- 6. Service role bypass (for admin operations)
CREATE POLICY service_bypass ON usage_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 7. Function to set tenant context (for RLS)
CREATE OR REPLACE FUNCTION set_tenant_context(p_tenant_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant', p_tenant_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Function to get current tenant
CREATE OR REPLACE FUNCTION get_current_tenant()
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_tenant', true), '')::uuid;
END;
$$ LANGUAGE plpgsql STABLE;

-- 9. Function to validate tenant access
CREATE OR REPLACE FUNCTION tenant_can_access(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN p_tenant_id = get_current_tenant() OR get_current_tenant() IS NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- 10. Grant permissions
GRANT SELECT, INSERT ON usage_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON usage_events TO service_role;
GRANT EXECUTE ON FUNCTION set_tenant_context TO authenticated;
GRANT EXECUTE ON FUNCTION set_tenant_context TO service_role;
GRANT EXECUTE ON FUNCTION get_current_tenant TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_tenant TO service_role;
GRANT EXECUTE ON FUNCTION tenant_can_access TO authenticated;
GRANT EXECUTE ON FUNCTION tenant_can_access TO service_role;

-- 11. Add TimescaleDB support if available
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

-- 12. Create view for tenant's daily usage summary
CREATE OR REPLACE VIEW tenant_daily_usage AS
SELECT
  tenant_id,
  model_id,
  date_trunc('day', timestamp) AS day,
  COUNT(*) AS inference_count,
  SUM(input_tokens) AS total_input_tokens,
  SUM(output_tokens) AS total_output_tokens,
  SUM(input_tokens + output_tokens) AS total_tokens
FROM usage_events
GROUP BY tenant_id, model_id, date_trunc('day', timestamp);

-- Grant access to view
GRANT SELECT ON tenant_daily_usage TO authenticated;
GRANT SELECT ON tenant_daily_usage TO service_role;

-- ============================================================================
-- Migration Complete
-- ============================================================================
