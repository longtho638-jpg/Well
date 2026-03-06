-- ============================================================================
-- TimescaleDB Optimization for Usage Records
-- Migration: 202603062256_timescale_usage_records.sql
-- ============================================================================

-- 1. Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- 2. Ensure recorded_at is NOT NULL (required for hypertable)
ALTER TABLE usage_records ALTER COLUMN recorded_at SET NOT NULL;

-- 3. Create index on recorded_at
CREATE INDEX IF NOT EXISTS idx_usage_records_recorded_at ON usage_records(recorded_at);

-- 4. Convert to hypertable (chunk by day)
SELECT create_hypertable('usage_records', 'recorded_at', chunk_time_interval => INTERVAL '1 day', if_not_exists => TRUE);

-- 5. Enable compression (compress chunks older than 7 days)
ALTER TABLE usage_records SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'user_id, org_id, license_id, feature'
);

SELECT add_compression_policy('usage_records', INTERVAL '7 days', if_not_exists => TRUE);

-- 6. Create continuous aggregation for hourly usage
CREATE MATERIALIZED VIEW IF NOT EXISTS usage_hourly
WITH (timescaledb.continuous) AS
SELECT
  user_id,
  org_id,
  license_id,
  feature,
  time_bucket('1 hour', recorded_at) AS bucket,
  SUM(quantity) AS total_quantity,
  COUNT(*) AS event_count,
  AVG(quantity) AS avg_quantity
FROM usage_records
GROUP BY user_id, org_id, license_id, feature, bucket
WITH NO DATA;

-- Refresh every 5 minutes, lag 1 hour
SELECT add_continuous_aggregate_policy('usage_hourly',
  start_offset => INTERVAL '1 hour',
  end_offset => INTERVAL '5 minutes',
  schedule_interval => INTERVAL '5 minutes',
  if_not_exists => TRUE);

-- 7. Create continuous aggregation for daily usage
CREATE MATERIALIZED VIEW IF NOT EXISTS usage_daily
WITH (timescaledb.continuous) AS
SELECT
  user_id,
  org_id,
  license_id,
  feature,
  time_bucket('1 day', recorded_at) AS bucket,
  SUM(quantity) AS total_quantity,
  COUNT(*) AS event_count,
  AVG(quantity) AS avg_quantity
FROM usage_records
GROUP BY user_id, org_id, license_id, feature, bucket
WITH NO DATA;

-- Refresh every hour, lag 1 hour
SELECT add_continuous_aggregate_policy('usage_daily',
  start_offset => INTERVAL '1 day',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour',
  if_not_exists => TRUE);

-- 8. Add retention policy (auto-delete data older than 90 days)
SELECT add_retention_policy('usage_records', INTERVAL '90 days', if_not_exists => TRUE);

-- 9. Optimize queries with indexes
CREATE INDEX IF NOT EXISTS idx_usage_records_user_feature_time
  ON usage_records(user_id, feature, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_records_org_time
  ON usage_records(org_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_records_license_time
  ON usage_records(license_id, recorded_at DESC) WHERE license_id IS NOT NULL;

-- 10. Add GIN indexes for metadata queries (JSONB)
CREATE INDEX IF NOT EXISTS idx_usage_records_metadata_model
  ON usage_records USING GIN ((metadata->'model')) WHERE metadata ? 'model';

CREATE INDEX IF NOT EXISTS idx_usage_records_metadata_agent
  ON usage_records USING GIN ((metadata->'agent_type')) WHERE metadata ? 'agent_type';

-- 11. Grant permissions
GRANT SELECT ON usage_records TO authenticated;
GRANT SELECT ON usage_hourly TO authenticated;
GRANT SELECT ON usage_daily TO authenticated;

-- 12. Refresh materialized views immediately
REFRESH MATERIALIZED VIEW usage_hourly;
REFRESH MATERIALIZED VIEW usage_daily;

-- ============================================================================
-- Migration Complete
-- ============================================================================
