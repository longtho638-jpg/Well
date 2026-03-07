-- Revenue Analytics Schema - ROIaaS Phase 5
-- Creates tables for revenue tracking, ROI calculations, and cohort analysis

-- ============================================================================
-- REVENUE SNAPSHOTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS revenue_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- GMV Metrics
  gmv_total DECIMAL(12,2) DEFAULT 0,
  gmv_subscription DECIMAL(12,2) DEFAULT 0,
  gmv_usage_based DECIMAL(12,2) DEFAULT 0,

  -- MRR Metrics
  mrr_total DECIMAL(12,2) DEFAULT 0,
  mrr_new DECIMAL(12,2) DEFAULT 0,
  mrr_expansion DECIMAL(12,2) DEFAULT 0,
  mrr_contraction DECIMAL(12,2) DEFAULT 0,
  mrr_churn DECIMAL(12,2) DEFAULT 0,

  -- ARR Metrics
  arr_total DECIMAL(12,2) DEFAULT 0,

  -- Customer Metrics
  total_customers INTEGER DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  churned_customers INTEGER DEFAULT 0,

  -- Tier Breakdown
  tier_breakdown JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(snapshot_date)
);

-- ============================================================================
-- ROI CALCULATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS roi_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID REFERENCES raas_licenses(id),
  user_id UUID REFERENCES auth.users(id),
  org_id UUID REFERENCES organizations(id),

  calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Revenue
  revenue_subscription DECIMAL(12,2) DEFAULT 0,
  revenue_usage_based DECIMAL(12,2) DEFAULT 0,
  revenue_total DECIMAL(12,2) DEFAULT 0,

  -- Costs
  cost_api_calls DECIMAL(12,2) DEFAULT 0,
  cost_tokens DECIMAL(12,2) DEFAULT 0,
  cost_compute DECIMAL(12,2) DEFAULT 0,
  cost_total DECIMAL(12,2) DEFAULT 0,

  -- ROI Metrics
  roi_absolute DECIMAL(12,2) DEFAULT 0,  -- Revenue - Cost
  roi_percentage DECIMAL(5,2) DEFAULT 0,  -- (Revenue - Cost) / Cost * 100
  margin_percentage DECIMAL(5,2) DEFAULT 0,  -- (Revenue - Cost) / Revenue * 100

  -- Usage Metrics
  api_calls INTEGER DEFAULT 0,
  tokens INTEGER DEFAULT 0,
  agent_executions INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(license_id, calculation_date)
);

-- ============================================================================
-- COHORT METRICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS cohort_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_month DATE NOT NULL,  -- First day of month
  cohort_size INTEGER NOT NULL,

  -- Period Metrics
  period_day INTEGER NOT NULL,  -- Day 0, 30, 60, 90...
  active_users INTEGER DEFAULT 0,
  retained_percentage DECIMAL(5,2) DEFAULT 0,

  -- Revenue Metrics
  revenue_cumulative DECIMAL(12,2) DEFAULT 0,
  arpu DECIMAL(10,2) DEFAULT 0,  -- Average Revenue Per User

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(cohort_month, period_day)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_revenue_snapshots_date ON revenue_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_roi_calculations_license ON roi_calculations(license_id);
CREATE INDEX IF NOT EXISTS idx_roi_calculations_date ON roi_calculations(calculation_date DESC);
CREATE INDEX IF NOT EXISTS idx_cohort_metrics_month ON cohort_metrics(cohort_month, period_day);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE revenue_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_metrics ENABLE ROW LEVEL SECURITY;

-- Admin can read all revenue data
CREATE POLICY IF NOT EXISTS admin_read_revenue ON revenue_snapshots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS admin_read_roi ON roi_calculations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS admin_read_cohort ON cohort_metrics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

-- Users can read their own ROI
CREATE POLICY IF NOT EXISTS user_read_own_roi ON roi_calculations
  FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- DAILY SNAPSHOT FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION capture_daily_revenue_snapshot()
RETURNS void AS $$
BEGIN
  INSERT INTO revenue_snapshots (
    gmv_total, gmv_subscription, gmv_usage_based,
    mrr_total, mrr_new, mrr_expansion, mrr_contraction, mrr_churn,
    arr_total, total_customers, new_customers, churned_customers,
    tier_breakdown
  )
  SELECT
    -- GMV from payment_intents (last 30 days)
    COALESCE(SUM(pi.amount), 0) as gmv_total,
    COALESCE(SUM(CASE WHEN pi.metadata->>'type' = 'subscription' THEN pi.amount ELSE 0 END), 0) as gmv_subscription,
    COALESCE(SUM(CASE WHEN pi.metadata->>'type' = 'usage' THEN pi.amount ELSE 0 END), 0) as gmv_usage_based,

    -- MRR calculation from active licenses
    COALESCE((
      SELECT SUM(
        CASE rl.tier
          WHEN 'basic' THEN 10000  -- ₫10,000/month
          WHEN 'premium' THEN 50000  -- ₫50,000/month
          WHEN 'enterprise' THEN 200000  -- ₫200,000/month
          WHEN 'master' THEN 1000000  -- ₫1,000,000/month
          ELSE 0
        END
      )
      FROM raas_licenses rl
      WHERE rl.status = 'active'
    ), 0) as mrr_total,

    0 as mrr_new,  -- Would need historical comparison
    0 as mrr_expansion,
    0 as mrr_contraction,
    0 as mrr_churn,

    -- ARR = MRR × 12
    COALESCE((
      SELECT SUM(
        CASE rl.tier
          WHEN 'basic' THEN 10000 * 12
          WHEN 'premium' THEN 50000 * 12
          WHEN 'enterprise' THEN 200000 * 12
          WHEN 'master' THEN 1000000 * 12
          ELSE 0
        END
      )
      FROM raas_licenses rl
      WHERE rl.status = 'active'
    ), 0) as arr_total,

    -- Customer counts
    COUNT(DISTINCT rl.id) as total_customers,
    0 as new_customers,
    0 as churned_customers,

    -- Tier breakdown
    jsonb_build_object(
      'free', COUNT(CASE WHEN rl.tier = 'free' THEN 1 END),
      'basic', COUNT(CASE WHEN rl.tier = 'basic' THEN 1 END),
      'premium', COUNT(CASE WHEN rl.tier = 'premium' THEN 1 END),
      'enterprise', COUNT(CASE WHEN rl.tier = 'enterprise' THEN 1 END),
      'master', COUNT(CASE WHEN rl.tier = 'master' THEN 1 END)
    ) as tier_breakdown

  FROM raas_licenses rl
  LEFT JOIN payment_intents pi ON rl.user_id = pi.user_id
    AND pi.created_at >= CURRENT_DATE - INTERVAL '30 days'
  WHERE rl.status = 'active'
  ON CONFLICT (snapshot_date) DO UPDATE SET
    gmv_total = EXCLUDED.gmv_total,
    gmv_subscription = EXCLUDED.gmv_subscription,
    gmv_usage_based = EXCLUDED.gmv_usage_based,
    mrr_total = EXCLUDED.mrr_total,
    arr_total = EXCLUDED.arr_total,
    total_customers = EXCLUDED.total_customers,
    tier_breakdown = EXCLUDED.tier_breakdown,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROI CALCULATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_license_roi(
  p_license_id UUID,
  p_calculation_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  roi_absolute DECIMAL,
  roi_percentage DECIMAL,
  margin_percentage DECIMAL
) AS $$
DECLARE
  v_revenue DECIMAL := 0;
  v_cost_api DECIMAL := 0;
  v_cost_tokens DECIMAL := 0;
  v_cost_compute DECIMAL := 0;
  v_cost_total DECIMAL := 0;
BEGIN
  -- Get revenue from license tier
  SELECT
    CASE rl.tier
      WHEN 'basic' THEN 10000
      WHEN 'premium' THEN 50000
      WHEN 'enterprise' THEN 200000
      WHEN 'master' THEN 1000000
      ELSE 0
    END
  INTO v_revenue
  FROM raas_licenses rl
  WHERE rl.id = p_license_id;

  -- Get costs from usage records
  SELECT
    COALESCE(SUM(CASE WHEN ur.feature = 'api_call' THEN ur.quantity * 0.001 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN ur.feature = 'tokens' THEN ur.quantity * 0.002 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN ur.feature = 'compute_ms' THEN ur.quantity * 0.05 / 60000 ELSE 0 END), 0)
  INTO v_cost_api, v_cost_tokens, v_cost_compute
  FROM usage_records ur
  WHERE ur.license_id = p_license_id
    AND DATE(ur.recorded_at) = p_calculation_date;

  v_cost_total := v_cost_api + v_cost_tokens + v_cost_compute;

  -- Return ROI metrics
  RETURN QUERY SELECT
    (v_revenue - v_cost_total) AS roi_absolute,
    CASE WHEN v_cost_total > 0
      THEN ((v_revenue - v_cost_total) / v_cost_total * 100)
      ELSE 0
    END AS roi_percentage,
    CASE WHEN v_revenue > 0
      THEN ((v_revenue - v_cost_total) / v_revenue * 100)
      ELSE 0
    END AS margin_percentage;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_license_roi IS 'Calculate ROI for a specific license key';
