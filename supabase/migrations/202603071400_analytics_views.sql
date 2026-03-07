-- Analytics Views & Functions for Usage Dashboard
-- Migration for Phase 5: Analytics Dashboard

-- ============================================================
-- ANALYTICS VIEWS
-- ============================================================

-- 1. Daily usage trends view (for charts)
CREATE OR REPLACE VIEW analytics_daily_usage AS
SELECT
  recorded_at::DATE AS usage_date,
  license_id,
  user_id,
  feature,
  SUM(quantity) AS total_quantity,
  COUNT(*) AS event_count,
  AVG(quantity) AS avg_quantity,
  MAX(quantity) AS max_quantity,
  MIN(quantity) AS min_quantity
FROM usage_records
GROUP BY recorded_at::DATE, license_id, user_id, feature
ORDER BY usage_date DESC;

-- 2. Hourly usage trends view (for detailed charts)
CREATE OR REPLACE VIEW analytics_hourly_usage AS
SELECT
  date_trunc('hour', recorded_at) AS usage_hour,
  license_id,
  user_id,
  feature,
  SUM(quantity) AS total_quantity,
  COUNT(*) AS event_count
FROM usage_records
WHERE recorded_at >= NOW() - INTERVAL '7 days'
GROUP BY date_trunc('hour', recorded_at), license_id, user_id, feature
ORDER BY usage_hour DESC;

-- 3. Weekly aggregation view
CREATE OR REPLACE VIEW analytics_weekly_usage AS
SELECT
  date_trunc('week', recorded_at)::DATE AS week_start,
  license_id,
  user_id,
  feature,
  SUM(quantity) AS total_quantity,
  COUNT(*) AS event_count,
  MIN(recorded_at) AS first_event,
  MAX(recorded_at) AS last_event
FROM usage_records
WHERE recorded_at >= NOW() - INTERVAL '12 weeks'
GROUP BY date_trunc('week', recorded_at), license_id, user_id, feature
ORDER BY week_start DESC;

-- 4. Monthly aggregation view
CREATE OR REPLACE VIEW analytics_monthly_usage AS
SELECT
  date_trunc('month', recorded_at)::DATE AS month_start,
  license_id,
  user_id,
  feature,
  SUM(quantity) AS total_quantity,
  COUNT(*) AS event_count
FROM usage_records
WHERE recorded_at >= NOW() - INTERVAL '12 months'
GROUP BY date_trunc('month', recorded_at), license_id, user_id, feature
ORDER BY month_start DESC;

-- 5. Top customers by usage (for admin dashboard)
CREATE OR REPLACE VIEW analytics_top_customers AS
SELECT
  license_id,
  user_id,
  feature,
  SUM(quantity) AS total_usage,
  COUNT(*) AS total_events,
  MAX(recorded_at) AS last_activity,
  date_trunc('day', MIN(recorded_at)) AS first_activity
FROM usage_records
WHERE recorded_at >= NOW() - INTERVAL '30 days'
GROUP BY license_id, user_id, feature
ORDER BY total_usage DESC;

-- 6. Quota utilization view
CREATE OR REPLACE VIEW analytics_quota_utilization AS
SELECT
  license_id,
  user_id,
  recorded_at::DATE AS usage_date,
  feature,
  SUM(quantity) AS daily_usage,
  -- Join with license tiers would happen in application layer
  ROW_NUMBER() OVER (PARTITION BY license_id, feature ORDER BY recorded_at::DATE DESC) AS rn
FROM usage_records
GROUP BY license_id, user_id, recorded_at::DATE, feature;

-- 7. Model usage breakdown (for AI inference analytics)
CREATE OR REPLACE VIEW analytics_model_usage AS
SELECT
  recorded_at::DATE AS usage_date,
  (metadata->>'model')::TEXT AS model_name,
  (metadata->>'provider')::TEXT AS provider,
  SUM(quantity) AS total_inferences,
  SUM((metadata->>'total_tokens')::INTEGER) FILTER (WHERE metadata->>'total_tokens' IS NOT NULL) AS total_tokens,
  COUNT(*) AS inference_count
FROM usage_records
WHERE feature = 'model_inference'
  AND metadata->>'model' IS NOT NULL
GROUP BY recorded_at::DATE, metadata->>'model', metadata->>'provider'
ORDER BY usage_date DESC, total_inferences DESC;

-- 8. Agent execution breakdown
CREATE OR REPLACE VIEW analytics_agent_usage AS
SELECT
  recorded_at::DATE AS usage_date,
  (metadata->>'agent_type')::TEXT AS agent_type,
  SUM(quantity) AS total_executions,
  AVG((metadata->>'duration_ms')::INTEGER) FILTER (WHERE metadata->>'duration_ms' IS NOT NULL) AS avg_duration_ms,
  SUM((metadata->>'duration_ms')::INTEGER) FILTER (WHERE metadata->>'duration_ms' IS NOT NULL) AS total_duration_ms,
  COUNT(*) AS execution_count
FROM usage_records
WHERE feature = 'agent_execution'
  AND metadata->>'agent_type' IS NOT NULL
GROUP BY recorded_at::DATE, metadata->>'agent_type'
ORDER BY usage_date DESC, total_executions DESC;

-- ============================================================
-- ANALYTICS FUNCTIONS
-- ============================================================

-- 9. Get usage trends for date range
CREATE OR REPLACE FUNCTION get_usage_trends(
  p_user_id TEXT DEFAULT NULL,
  p_license_id TEXT DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_granularity TEXT DEFAULT 'day'  -- 'hour', 'day', 'week', 'month'
)
RETURNS TABLE (
  period_start TIMESTAMPTZ,
  feature TEXT,
  total_quantity BIGINT,
  event_count BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE p_granularity
      WHEN 'hour' THEN date_trunc('hour', ur.recorded_at)
      WHEN 'day' THEN date_trunc('day', ur.recorded_at)
      WHEN 'week' THEN date_trunc('week', ur.recorded_at)
      WHEN 'month' THEN date_trunc('month', ur.recorded_at)
      ELSE date_trunc('day', ur.recorded_at)
    END::TIMESTAMPTZ AS period_start,
    ur.feature,
    SUM(ur.quantity) AS total_quantity,
    COUNT(*) AS event_count
  FROM usage_records ur
  WHERE (p_user_id IS NULL OR ur.user_id = p_user_id)
    AND (p_license_id IS NULL OR ur.license_id = p_license_id)
    AND (p_start_date IS NULL OR ur.recorded_at >= p_start_date::TIMESTAMPTZ)
    AND (p_end_date IS NULL OR ur.recorded_at < (p_end_date + INTERVAL '1 day')::TIMESTAMPTZ)
  GROUP BY
    CASE p_granularity
      WHEN 'hour' THEN date_trunc('hour', ur.recorded_at)
      WHEN 'day' THEN date_trunc('day', ur.recorded_at)
      WHEN 'week' THEN date_trunc('week', ur.recorded_at)
      WHEN 'month' THEN date_trunc('month', ur.recorded_at)
    END,
    ur.feature
  ORDER BY period_start ASC, feature;
END;
$$;

-- 10. Get top customers by usage
CREATE OR REPLACE FUNCTION get_top_customers(
  p_limit INTEGER DEFAULT 10,
  p_feature TEXT DEFAULT NULL,
  p_period_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  license_id TEXT,
  user_id TEXT,
  feature TEXT,
  total_usage BIGINT,
  total_events BIGINT,
  last_activity TIMESTAMPTZ,
  avg_daily_usage NUMERIC
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    ur.license_id,
    ur.user_id,
    ur.feature,
    SUM(ur.quantity) AS total_usage,
    COUNT(*) AS total_events,
    MAX(ur.recorded_at) AS last_activity,
    ROUND(SUM(ur.quantity)::NUMERIC / p_period_days, 2) AS avg_daily_usage
  FROM usage_records ur
  WHERE ur.recorded_at >= NOW() - (p_period_days || ' days')::INTERVAL
    AND (p_feature IS NULL OR ur.feature = p_feature)
  GROUP BY ur.license_id, ur.user_id, ur.feature
  ORDER BY total_usage DESC
  LIMIT p_limit;
END;
$$;

-- 11. Get quota utilization for a license
CREATE OR REPLACE FUNCTION get_quota_utilization(
  p_license_id TEXT,
  p_period_start DATE DEFAULT NULL,
  p_period_end DATE DEFAULT NULL
)
RETURNS TABLE (
  feature TEXT,
  total_usage BIGINT,
  usage_date DATE,
  days_remaining INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_period_start DATE;
  v_period_end DATE;
BEGIN
  v_period_start := COALESCE(p_period_start, date_trunc('month', CURRENT_DATE)::DATE);
  v_period_end := COALESCE(p_period_end, (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE);

  RETURN QUERY
  SELECT
    ur.feature,
    SUM(ur.quantity) AS total_usage,
    CURRENT_DATE AS usage_date,
    (v_period_end - CURRENT_DATE) AS days_remaining
  FROM usage_records ur
  WHERE ur.license_id = p_license_id
    AND ur.recorded_at >= v_period_start::TIMESTAMPTZ
    AND ur.recorded_at < (v_period_end + INTERVAL '1 day')::TIMESTAMPTZ
  GROUP BY ur.feature;
END;
$$;

-- 12. Detect usage anomalies (3-sigma detection)
CREATE OR REPLACE FUNCTION detect_usage_anomalies(
  p_user_id TEXT DEFAULT NULL,
  p_license_id TEXT DEFAULT NULL,
  p_feature TEXT DEFAULT NULL,
  p_zscore_threshold NUMERIC DEFAULT 3.0
)
RETURNS TABLE (
  usage_date DATE,
  feature TEXT,
  actual_value BIGINT,
  expected_value NUMERIC,
  std_dev NUMERIC,
  z_score NUMERIC,
  is_anomaly BOOLEAN,
  severity TEXT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
WITH daily_stats AS (
  SELECT
    recorded_at::DATE AS usage_date,
    feature,
    SUM(quantity) AS daily_total
  FROM usage_records
  WHERE recorded_at >= NOW() - INTERVAL '90 days'
    AND (p_user_id IS NULL OR user_id = p_user_id)
    AND (p_license_id IS NULL OR license_id = p_license_id)
    AND (p_feature IS NULL OR feature = p_feature)
  GROUP BY recorded_at::DATE, feature
),
stats AS (
  SELECT
    feature,
    AVG(daily_total) AS avg_daily,
    STDDEV(daily_total) AS std_dev
  FROM daily_stats
  GROUP BY feature
)
SELECT
  ds.usage_date,
  ds.feature,
  ds.daily_total AS actual_value,
  s.avg_daily AS expected_value,
  s.std_dev,
  CASE WHEN s.std_dev > 0 THEN (ds.daily_total - s.avg_daily) / s.std_dev ELSE 0 END AS z_score,
  ABS(CASE WHEN s.std_dev > 0 THEN (ds.daily_total - s.avg_daily) / s.std_dev ELSE 0 END) > p_zscore_threshold AS is_anomaly,
  CASE
    WHEN ABS(CASE WHEN s.std_dev > 0 THEN (ds.daily_total - s.avg_daily) / s.std_dev ELSE 0 END) > 4 THEN 'critical'
    WHEN ABS(CASE WHEN s.std_dev > 0 THEN (ds.daily_total - s.avg_daily) / s.std_dev ELSE 0 END) > 3 THEN 'high'
    WHEN ABS(CASE WHEN s.std_dev > 0 THEN (ds.daily_total - s.avg_daily) / s.std_dev ELSE 0 END) > 2 THEN 'medium'
    ELSE 'low'
  END AS severity
FROM daily_stats ds
JOIN stats s ON ds.feature = s.feature
WHERE s.std_dev > 0
ORDER BY ds.usage_date DESC, ABS(CASE WHEN s.std_dev > 0 THEN (ds.daily_total - s.avg_daily) / s.std_dev ELSE 0 END) DESC;
END;
$$;

-- 13. Get billing projection for current period
CREATE OR REPLACE FUNCTION get_billing_projection(
  p_license_id TEXT,
  p_subscription_item_id TEXT
)
RETURNS TABLE (
  period_start DATE,
  period_end DATE,
  current_usage BIGINT,
  projected_usage BIGINT,
  days_elapsed INTEGER,
  days_total INTEGER,
  projection_confidence TEXT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_period_start DATE;
  v_period_end DATE;
  v_current_usage BIGINT;
  v_days_elapsed INTEGER;
  v_days_total INTEGER;
  v_avg_daily NUMERIC;
  v_projected BIGINT;
BEGIN
  -- Get current billing period (assuming monthly)
  v_period_start := date_trunc('month', CURRENT_DATE)::DATE;
  v_period_end := (v_period_start + INTERVAL '1 month - 1 day')::DATE;

  -- Get current usage
  SELECT COALESCE(SUM(quantity), 0)
  INTO v_current_usage
  FROM usage_records
  WHERE license_id = p_license_id
    AND recorded_at >= v_period_start::TIMESTAMPTZ;

  v_days_elapsed := CURRENT_DATE - v_period_start;
  v_days_total := v_period_end - v_period_start + 1;

  -- Calculate projection
  IF v_days_elapsed > 0 THEN
    v_avg_daily := v_current_usage::NUMERIC / v_days_elapsed;
    v_projected := (v_avg_daily * v_days_total)::BIGINT;
  ELSE
    v_projected := v_current_usage;
  END IF;

  -- Determine confidence
  RETURN QUERY
  SELECT
    v_period_start,
    v_period_end,
    v_current_usage,
    v_projected,
    v_days_elapsed,
    v_days_total,
    CASE
      WHEN v_days_elapsed < 3 THEN 'low'
      WHEN v_days_elapsed < 7 THEN 'medium'
      ELSE 'high'
    END::TEXT AS projection_confidence;
END;
$$;

-- 14. Export usage data for date range
CREATE OR REPLACE FUNCTION export_usage_data(
  p_license_id TEXT DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_format TEXT DEFAULT 'json'  -- 'json', 'csv'
)
RETURNS TABLE (
  recorded_at TIMESTAMPTZ,
  license_id TEXT,
  user_id TEXT,
  feature TEXT,
  quantity BIGINT,
  metadata JSONB,
  recorded_at_date TEXT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    ur.recorded_at,
    ur.license_id,
    ur.user_id,
    ur.feature,
    ur.quantity,
    ur.metadata,
    ur.recorded_at::DATE::TEXT AS recorded_at_date
  FROM usage_records ur
  WHERE (p_license_id IS NULL OR ur.license_id = p_license_id)
    AND (p_start_date IS NULL OR ur.recorded_at >= p_start_date::TIMESTAMPTZ)
    AND (p_end_date IS NULL OR ur.recorded_at < (p_end_date + INTERVAL '1 day')::TIMESTAMPTZ)
  ORDER BY ur.recorded_at ASC;
END;
$$;

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- 15. Additional indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_usage_records_analytics_date
ON usage_records (recorded_at::DATE, feature, license_id);

CREATE INDEX IF NOT EXISTS idx_usage_records_analytics_hour
ON usage_records (date_trunc('hour', recorded_at), license_id);

CREATE INDEX IF NOT EXISTS idx_usage_records_metadata_model
ON usage_records ((metadata->>'model')) WHERE feature = 'model_inference';

CREATE INDEX IF NOT EXISTS idx_usage_records_metadata_agent
ON usage_records ((metadata->>'agent_type')) WHERE feature = 'agent_execution';

-- ============================================================
-- GRANTS
-- ============================================================

GRANT SELECT ON analytics_daily_usage TO authenticated;
GRANT SELECT ON analytics_hourly_usage TO authenticated;
GRANT SELECT ON analytics_weekly_usage TO authenticated;
GRANT SELECT ON analytics_monthly_usage TO authenticated;
GRANT SELECT ON analytics_top_customers TO authenticated;
GRANT SELECT ON analytics_quota_utilization TO authenticated;
GRANT SELECT ON analytics_model_usage TO authenticated;
GRANT SELECT ON analytics_agent_usage TO authenticated;
GRANT EXECUTE ON FUNCTION get_usage_trends TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_customers TO authenticated;
GRANT EXECUTE ON FUNCTION get_quota_utilization TO authenticated;
GRANT EXECUTE ON FUNCTION detect_usage_anomalies TO authenticated;
GRANT EXECUTE ON FUNCTION get_billing_projection TO authenticated;
GRANT EXECUTE ON FUNCTION export_usage_data TO authenticated;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON VIEW analytics_daily_usage IS 'Daily aggregated usage for trend charts';
COMMENT ON VIEW analytics_hourly_usage IS 'Hourly usage for detailed charts (last 7 days)';
COMMENT ON VIEW analytics_weekly_usage IS 'Weekly aggregated usage (last 12 weeks)';
COMMENT ON VIEW analytics_monthly_usage IS 'Monthly aggregated usage (last 12 months)';
COMMENT ON VIEW analytics_top_customers IS 'Top customers by usage (last 30 days)';
COMMENT ON VIEW analytics_quota_utilization IS 'Daily quota utilization tracking';
COMMENT ON VIEW analytics_model_usage IS 'AI model inference breakdown by model/provider';
COMMENT ON VIEW analytics_agent_usage IS 'Agent execution breakdown with timing stats';
COMMENT ON FUNCTION get_usage_trends IS 'Get usage trends for customizable date range and granularity';
COMMENT ON FUNCTION get_top_customers IS 'Get top customers by total usage (admin dashboard)';
COMMENT ON FUNCTION get_quota_utilization IS 'Get current quota utilization for a license';
COMMENT ON FUNCTION detect_usage_anomalies IS 'Detect usage anomalies using 3-sigma statistical method';
COMMENT ON FUNCTION get_billing_projection IS 'Project usage to end of billing period';
COMMENT ON FUNCTION export_usage_data IS 'Export raw usage data for reporting';
