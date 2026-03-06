-- ============================================================================
-- Add AI Metrics to Usage Records
-- Migration: 202603062257_add_ai_metrics.sql
-- ============================================================================

-- 1. Update check constraint to include new metric types
ALTER TABLE usage_records
  DROP CONSTRAINT IF EXISTS check_feature_type;

ALTER TABLE usage_records
  ADD CONSTRAINT check_feature_type
  CHECK (feature IN (
    'api_call', 'tokens', 'compute_ms', 'storage_mb', 'bandwidth_mb',
    'model_inference', 'agent_execution'
  ));

-- 2. Add indexes for AI-specific queries
CREATE INDEX IF NOT EXISTS idx_usage_records_feature_inference
  ON usage_records(feature, user_id, recorded_at)
  WHERE feature = 'model_inference';

CREATE INDEX IF NOT EXISTS idx_usage_records_feature_agent
  ON usage_records(feature, user_id, recorded_at)
  WHERE feature = 'agent_execution';

-- 3. Add function to get AI usage summary by model
CREATE OR REPLACE FUNCTION get_ai_usage_summary(
  p_user_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  model TEXT,
  provider TEXT,
  total_inferences BIGINT,
  total_prompt_tokens BIGINT,
  total_completion_tokens BIGINT,
  total_tokens BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (metadata->>'model')::TEXT AS model,
    (metadata->>'provider')::TEXT AS provider,
    SUM(quantity) FILTER (WHERE feature = 'model_inference') AS total_inferences,
    SUM((metadata->>'prompt_tokens')::BIGINT) FILTER (WHERE metadata ? 'prompt_tokens') AS total_prompt_tokens,
    SUM((metadata->>'completion_tokens')::BIGINT) FILTER (WHERE metadata ? 'completion_tokens') AS total_completion_tokens,
    SUM((metadata->>'total_tokens')::BIGINT) FILTER (WHERE metadata ? 'total_tokens') AS total_tokens
  FROM usage_records
  WHERE user_id = p_user_id
    AND recorded_at >= p_start_date
    AND recorded_at < p_end_date
    AND feature IN ('model_inference', 'tokens')
  GROUP BY metadata->>'model', metadata->>'provider'
  ORDER BY total_inferences DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. Add function to get agent execution summary
CREATE OR REPLACE FUNCTION get_agent_usage_summary(
  p_user_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  agent_type TEXT,
  total_executions BIGINT,
  total_compute_ms BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (metadata->>'agent_type')::TEXT AS agent_type,
    SUM(quantity) FILTER (WHERE feature = 'agent_execution') AS total_executions,
    SUM(quantity) FILTER (WHERE feature = 'compute_ms') AS total_compute_ms
  FROM usage_records
  WHERE user_id = p_user_id
    AND recorded_at >= p_start_date
    AND recorded_at < p_end_date
    AND (feature = 'agent_execution' OR (feature = 'compute_ms' AND metadata ? 'agent_type'))
  GROUP BY metadata->>'agent_type'
  ORDER BY total_executions DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. Grant execute permissions
GRANT EXECUTE ON FUNCTION get_ai_usage_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_agent_usage_summary TO authenticated;

-- ============================================================================
-- Migration Complete
-- ============================================================================
