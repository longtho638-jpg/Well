-- Polar Analytics Schema - ROIaaS Phase 5 Enhancement
-- Tracks Polar.sh webhook events and computes cohort retention metrics

-- ============================================================================
-- POLAR WEBHOOK EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS polar_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,  -- Polar's event ID (idempotency)
  event_type TEXT NOT NULL,        -- checkout.succeeded, subscription.activated, etc.
  received_at TIMESTAMPTZ DEFAULT NOW(),

  -- Core Data
  customer_id UUID,
  subscription_id UUID,
  order_id UUID,
  product_id UUID,
  license_id UUID REFERENCES raas_licenses(id),

  -- Amounts (in cents)
  amount_cents INTEGER,
  currency TEXT DEFAULT 'USD',

  -- Metadata
  customer_email TEXT,
  customer_name TEXT,
  product_name TEXT,
  tier TEXT,  -- free/basic/premium/enterprise/master

  -- Full payload for reprocessing
  payload JSONB NOT NULL,

  -- Processing status
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_polar_events_type ON polar_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_polar_events_customer ON polar_webhook_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_polar_events_received ON polar_webhook_events(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_polar_events_processed ON polar_webhook_events(processed, received_at);

-- ============================================================================
-- CUSTOMER COHORTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID UNIQUE NOT NULL REFERENCES auth.users(id),

  -- Cohort Assignment
  cohort_month DATE NOT NULL,  -- First day of signup month
  cohort_week DATE,            -- First day of signup week (optional)

  -- Initial State
  initial_tier TEXT NOT NULL,  -- free/basic/premium/enterprise/master
  initial_mrr_cents INTEGER DEFAULT 0,
  initial_arr_cents INTEGER DEFAULT 0,

  -- Current State
  current_tier TEXT,
  current_mrr_cents INTEGER DEFAULT 0,
  current_arr_cents INTEGER DEFAULT 0,
  status TEXT NOT NULL,  -- active/churned/trial/expired

  -- Lifecycle Dates
  first_purchase_date DATE,
  last_activity_date DATE,
  churned_date DATE,

  -- Segments
  segment TEXT,  -- b2b/b2c/enterprise
  geography TEXT,  -- country code

  -- Usage Aggregations
  total_api_calls INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_revenue_cents INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cohorts_month ON customer_cohorts(cohort_month);
CREATE INDEX IF NOT EXISTS idx_cohorts_customer ON customer_cohorts(customer_id);
CREATE INDEX IF NOT EXISTS idx_cohorts_status ON customer_cohorts(status);
CREATE INDEX IF NOT EXISTS idx_cohorts_tier ON customer_cohorts(current_tier);

-- ============================================================================
-- COHORT METRICS TABLE (Pre-computed for performance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cohort_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_month DATE NOT NULL,
  period_day INTEGER NOT NULL,  -- 0, 30, 60, 90...

  -- Cohort Info
  cohort_size INTEGER NOT NULL,

  -- Retention Metrics
  active_users INTEGER DEFAULT 0,
  retained_percentage DECIMAL(5,2) DEFAULT 0,

  -- Revenue Metrics
  revenue_cumulative_cents INTEGER DEFAULT 0,
  mrr_cents INTEGER DEFAULT 0,
  arpu_cents INTEGER DEFAULT 0,  -- Average Revenue Per User

  -- Usage Metrics
  total_api_calls INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,

  -- Tier Distribution
  tier_distribution JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(cohort_month, period_day)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cohort_metrics_month ON cohort_metrics(cohort_month, period_day);

-- ============================================================================
-- DAILY REVENUE SNAPSHOTS (Enhanced for Polar)
-- ============================================================================

-- Add Polar-specific columns to existing revenue_snapshots if not exists
DO $$ BEGIN
  ALTER TABLE revenue_snapshots ADD COLUMN polar_orders INTEGER DEFAULT 0;
  ALTER TABLE revenue_snapshots ADD COLUMN polar_subscriptions INTEGER DEFAULT 0;
  ALTER TABLE revenue_snapshots ADD COLUMN polar_revenue_cents INTEGER DEFAULT 0;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- ============================================================================
-- LICENSE USAGE AGGREGATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS license_usage_aggregations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES raas_licenses(id),
  user_id UUID REFERENCES auth.users(id),

  -- Period
  aggregation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_type TEXT NOT NULL DEFAULT 'daily',  -- daily/weekly/monthly

  -- Usage Metrics
  api_calls INTEGER DEFAULT 0,
  tokens INTEGER DEFAULT 0,
  compute_ms INTEGER DEFAULT 0,
  model_inferences INTEGER DEFAULT 0,
  agent_executions INTEGER DEFAULT 0,

  -- Cost Calculation
  cost_cents INTEGER DEFAULT 0,

  -- Revenue (from subscription)
  revenue_cents INTEGER DEFAULT 0,

  -- ROI Metrics
  roi_cents INTEGER DEFAULT 0,  -- revenue - cost
  roi_percentage DECIMAL(5,2) DEFAULT 0,
  margin_percentage DECIMAL(5,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(license_id, aggregation_date, period_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_license_usage_license ON license_usage_aggregations(license_id);
CREATE INDEX IF NOT EXISTS idx_license_usage_date ON license_usage_aggregations(aggregation_date DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE polar_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_usage_aggregations ENABLE ROW LEVEL SECURITY;

-- Admin can read all
CREATE POLICY IF NOT EXISTS admin_read_polar_events ON polar_webhook_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS admin_read_cohorts ON customer_cohorts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS admin_read_cohort_metrics ON cohort_metrics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS admin_read_usage_agg ON license_usage_aggregations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

-- Users can read their own data
CREATE POLICY IF NOT EXISTS user_read_own_cohort ON customer_cohorts
  FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY IF NOT EXISTS user_read_own_usage ON license_usage_aggregations
  FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

/**
 * Assign customer to cohort based on first purchase
 */
CREATE OR REPLACE FUNCTION assign_customer_cohort(
  p_customer_id UUID,
  p_first_purchase_date DATE
)
RETURNS UUID AS $$
DECLARE
  v_cohort_month DATE;
  v_cohort_id UUID;
BEGIN
  -- Cohort month = first day of month
  v_cohort_month := DATE_TRUNC('month', p_first_purchase_date)::DATE;

  INSERT INTO customer_cohorts (
    customer_id,
    cohort_month,
    initial_tier,
    status
  ) VALUES (
    p_customer_id,
    v_cohort_month,
    'free',  -- Will be updated by webhook
    'active'
  )
  ON CONFLICT (customer_id) DO UPDATE SET
    cohort_month = v_cohort_month,
    updated_at = NOW()
  RETURNING id INTO v_cohort_id;

  RETURN v_cohort_id;
END;
$$ LANGUAGE plpgsql;

/**
 * Compute cohort metrics for a given month
 */
CREATE OR REPLACE FUNCTION compute_cohort_metrics(
  p_cohort_month DATE,
  p_period_day INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_cohort_size INTEGER;
  v_active_users INTEGER;
  v_revenue INTEGER;
  v_api_calls BIGINT;
  v_tokens BIGINT;
BEGIN
  -- Get cohort size
  SELECT COUNT(*) INTO v_cohort_size
  FROM customer_cohorts
  WHERE cohort_month = p_cohort_month;

  -- Get active users at period
  SELECT COUNT(*) INTO v_active_users
  FROM customer_cohorts
  WHERE cohort_month = p_cohort_month
    AND status = 'active'
    AND (first_purchase_date + (p_period_day || ' days')::INTERVAL) >= CURRENT_DATE;

  -- Get revenue
  SELECT COALESCE(SUM(current_mrr_cents), 0) INTO v_revenue
  FROM customer_cohorts
  WHERE cohort_month = p_cohort_month;

  -- Get usage
  SELECT
    COALESCE(SUM(lica.total_api_calls), 0),
    COALESCE(SUM(lica.total_tokens), 0)
  INTO v_api_calls, v_tokens
  FROM customer_cohorts cc
  LEFT JOIN license_usage_aggregations lica ON cc.customer_id = lica.user_id
  WHERE cc.cohort_month = p_cohort_month
    AND lica.aggregation_date >= cc.first_purchase_date
    AND lica.aggregation_date < cc.first_purchase_date + (p_period_day || ' days')::INTERVAL;

  -- Upsert metrics
  INSERT INTO cohort_metrics (
    cohort_month,
    period_day,
    cohort_size,
    active_users,
    retained_percentage,
    revenue_cumulative_cents,
    mrr_cents,
    arpu_cents,
    total_api_calls,
    total_tokens
  ) VALUES (
    p_cohort_month,
    p_period_day,
    v_cohort_size,
    v_active_users,
    CASE WHEN v_cohort_size > 0 THEN (v_active_users::DECIMAL / v_cohort_size * 100) ELSE 0 END,
    v_revenue,
    v_revenue,
    CASE WHEN v_cohort_size > 0 THEN (v_revenue / v_cohort_size) ELSE 0 END,
    v_api_calls,
    v_tokens
  )
  ON CONFLICT (cohort_month, period_day) DO UPDATE SET
    active_users = EXCLUDED.active_users,
    retained_percentage = EXCLUDED.retained_percentage,
    revenue_cumulative_cents = EXCLUDED.revenue_cumulative_cents,
    arpu_cents = EXCLUDED.arpu_cents,
    total_api_calls = EXCLUDED.total_api_calls,
    total_tokens = EXCLUDED.total_tokens,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION compute_cohort_metrics IS 'Compute and upsert cohort retention metrics for a specific period';
