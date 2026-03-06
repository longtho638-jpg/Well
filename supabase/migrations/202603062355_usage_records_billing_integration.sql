-- ============================================================================
-- Usage Records with Billing Integration (Stripe/Polar)
-- Migration: 202603062355_usage_records_billing_integration.sql
-- ============================================================================

-- 1. Create usage_records table with billing context
CREATE TABLE IF NOT EXISTS usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant/User identification
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  license_id UUID,

  -- AI Model information
  model_id TEXT NOT NULL,
  model_provider TEXT,                    -- 'openai', 'anthropic', 'dashscope'

  -- Token usage
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,

  -- Billing context
  stripe_customer_id TEXT,                -- Stripe customer ID
  polar_customer_id TEXT,                 -- Polar customer ID
  billing_period_start TIMESTAMPTZ,       -- Current billing period start
  billing_period_end TIMESTAMPTZ,         -- Current billing period end

  -- Event metadata
  event_id TEXT UNIQUE,                   -- Idempotency key from webhook
  request_id TEXT,                        -- Original request ID
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_for_billing BOOLEAN DEFAULT FALSE,
  invoice_id TEXT                         -- Generated invoice ID (Stripe/Polar)
);

-- 2. Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_usage_records_tenant_id ON usage_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_license_id ON usage_records(license_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_model_id ON usage_records(model_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_timestamp ON usage_records(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_usage_records_tenant_time ON usage_records(tenant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_usage_records_billing_period ON usage_records(billing_period_start, billing_period_end);
CREATE INDEX IF NOT EXISTS idx_usage_records_stripe_customer ON usage_records(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_usage_records_polar_customer ON usage_records(polar_customer_id) WHERE polar_customer_id IS NOT NULL;

-- 3. GIN index for metadata queries
CREATE INDEX IF NOT EXISTS idx_usage_records_metadata ON usage_records USING GIN (metadata);

-- 4. Enable Row Level Security
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Policy: SELECT - Users can read their own usage records
CREATE POLICY user_isolation_select ON usage_records
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: INSERT - Users can insert their own usage records
CREATE POLICY user_isolation_insert ON usage_records
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Tenant SELECT - Tenants can read all records for their tenant
CREATE POLICY tenant_isolation_select ON usage_records
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Policy: Service role bypass (for webhook processing and billing)
CREATE POLICY service_bypass ON usage_records
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 6. Function to validate webhook signature (HMAC-SHA256)
CREATE OR REPLACE FUNCTION validate_webhook_signature(
  p_payload TEXT,
  p_signature TEXT,
  p_secret TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  computed_signature TEXT;
BEGIN
  -- Compute HMAC-SHA256
  SELECT encode(hmac(p_payload::bytea, p_secret::bytea, 'sha256'), 'hex') INTO computed_signature;

  -- Compare signatures (case-insensitive)
  RETURN LOWER(computed_signature) = LOWER(p_signature);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 7. Function to get or create Stripe customer ID for tenant
CREATE OR REPLACE FUNCTION get_or_create_stripe_customer(p_tenant_id UUID, p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_stripe_customer_id TEXT;
BEGIN
  -- Try to get existing
  SELECT stripe_customer_id INTO v_stripe_customer_id
  FROM usage_records
  WHERE tenant_id = p_tenant_id AND stripe_customer_id IS NOT NULL
  LIMIT 1;

  -- Return existing or generate new (integration with Stripe happens in edge function)
  IF v_stripe_customer_id IS NULL THEN
    -- Return a placeholder - actual Stripe customer creation happens in edge function
    RETURN NULL;
  END IF;

  RETURN v_stripe_customer_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- 8. Function to calculate billing for period
CREATE OR REPLACE FUNCTION calculate_tenant_billing(
  p_tenant_id UUID,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
)
RETURNS TABLE (
  model_id TEXT,
  total_input_tokens BIGINT,
  total_output_tokens BIGINT,
  total_tokens BIGINT,
  inference_count BIGINT,
  billable_amount NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ur.model_id,
    SUM(ur.input_tokens)::BIGINT,
    SUM(ur.output_tokens)::BIGINT,
    SUM(ur.total_tokens)::BIGINT,
    COUNT(*)::BIGINT,
    -- Simple pricing: $0.000001 per token (adjust based on model)
    SUM(ur.total_tokens)::NUMERIC * 0.000001 AS billable_amount
  FROM usage_records ur
  WHERE ur.tenant_id = p_tenant_id
    AND ur.timestamp >= p_period_start
    AND ur.timestamp < p_period_end
  GROUP BY ur.model_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- 9. Function to get current usage for quota enforcement
CREATE OR REPLACE FUNCTION get_current_usage(
  p_user_id UUID,
  p_feature TEXT DEFAULT 'all'
)
RETURNS TABLE (
  feature TEXT,
  total_tokens BIGINT,
  inference_count BIGINT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ
) AS $$
DECLARE
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
BEGIN
  -- Current day (UTC)
  v_period_start := date_trunc('day', NOW() AT TIME ZONE 'UTC');
  v_period_end := v_period_start + INTERVAL '1 day';

  RETURN QUERY
  SELECT
    CASE WHEN p_feature = 'all' THEN 'all' ELSE p_feature END,
    SUM(ur.total_tokens)::BIGINT,
    COUNT(*)::BIGINT,
    v_period_start,
    v_period_end
  FROM usage_records ur
  WHERE ur.user_id = p_user_id
    AND ur.timestamp >= v_period_start
    AND ur.timestamp < v_period_end
    AND (p_feature = 'all' OR ur.model_id = p_feature);
END;
$$ LANGUAGE plpgsql STABLE;

-- 10. Grant permissions
GRANT SELECT, INSERT ON usage_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON usage_records TO service_role;
GRANT EXECUTE ON FUNCTION validate_webhook_signature TO authenticated;
GRANT EXECUTE ON FUNCTION validate_webhook_signature TO service_role;
GRANT EXECUTE ON FUNCTION get_or_create_stripe_customer TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_stripe_customer TO service_role;
GRANT EXECUTE ON FUNCTION calculate_tenant_billing TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_tenant_billing TO service_role;
GRANT EXECUTE ON FUNCTION get_current_usage TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_usage TO service_role;

-- 11. Add TimescaleDB support if available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
    -- Convert to hypertable (chunk by day)
    PERFORM create_hypertable('usage_records', 'timestamp', chunk_time_interval => INTERVAL '1 day', if_not_exists => TRUE);

    -- Enable compression
    ALTER TABLE usage_records SET (timescaledb.compress);
    PERFORM add_compression_policy('usage_records', INTERVAL '7 days', if_not_exists => TRUE);

    -- Retention policy (90 days)
    PERFORM add_retention_policy('usage_records', INTERVAL '90 days', if_not_exists => TRUE);
  END IF;
END $$;

-- 12. Create view for billing dashboard
CREATE OR REPLACE VIEW billing_usage_summary AS
SELECT
  tenant_id,
  user_id,
  stripe_customer_id,
  polar_customer_id,
  date_trunc('day', timestamp) AS usage_date,
  COUNT(*) AS total_inferences,
  SUM(input_tokens) AS total_input_tokens,
  SUM(output_tokens) AS total_output_tokens,
  SUM(total_tokens) AS total_tokens,
  MAX(timestamp) AS last_activity
FROM usage_records
GROUP BY tenant_id, user_id, stripe_customer_id, polar_customer_id, date_trunc('day', timestamp);

-- Grant access to view
GRANT SELECT ON billing_usage_summary TO authenticated;
GRANT SELECT ON billing_usage_summary TO service_role;

-- ============================================================================
-- Migration Complete
-- ============================================================================
