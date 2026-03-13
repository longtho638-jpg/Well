-- ============================================================
-- Phase 3: Overage Charges with PayOS Integration
-- Description: Track overage charges and PayOS payment links
-- Created: 2026-03-13
-- ============================================================

-- ============================================================
-- Table: overage_charges
-- Stores calculated overage charges with PayOS order tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS overage_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Billing period
  billing_period TEXT NOT NULL, -- 'YYYY-MM' format

  -- Overage breakdown (USD)
  api_overage NUMERIC(12, 2) NOT NULL DEFAULT 0,
  bookings_overage NUMERIC(12, 2) NOT NULL DEFAULT 0,
  reports_overage NUMERIC(12, 2) NOT NULL DEFAULT 0,
  email_overage NUMERIC(12, 2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0,

  -- PayOS integration
  order_code INTEGER,
  payment_link TEXT,
  checkout_url TEXT,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending',
  CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'expired')),

  -- Payment timestamps
  paid_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_overage_charges_org_period ON overage_charges(org_id, billing_period);
CREATE INDEX idx_overage_charges_status ON overage_charges(status) WHERE status != 'paid';
CREATE INDEX idx_overage_charges_order_code ON overage_charges(order_code) WHERE order_code IS NOT NULL;
CREATE INDEX idx_overage_charges_created ON overage_charges(created_at DESC);

-- Comment
COMMENT ON TABLE overage_charges IS 'Phase 3: Tracks overage charges with PayOS payment integration';

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS
ALTER TABLE overage_charges ENABLE ROW LEVEL SECURITY;

-- Users can view their org's charges
CREATE POLICY "Users can view org overage charges"
  ON overage_charges
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Service role can manage charges
CREATE POLICY "Service role manages overage charges"
  ON overage_charges
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================
-- Functions
-- ============================================================

-- Function: Get pending overage charges for org
CREATE OR REPLACE FUNCTION get_pending_overage_charges(
  p_org_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  billing_period TEXT,
  grand_total NUMERIC,
  status TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    oc.id,
    oc.billing_period,
    oc.grand_total,
    oc.status,
    oc.created_at
  FROM overage_charges oc
  WHERE oc.org_id = p_org_id
    AND oc.status = 'pending'
  ORDER BY oc.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get overage charges summary by period
CREATE OR REPLACE FUNCTION get_overage_charges_summary(
  p_org_id UUID
)
RETURNS TABLE (
  billing_period TEXT,
  total_charges NUMERIC,
  paid_amount NUMERIC,
  pending_amount NUMERIC,
  charge_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    oc.billing_period,
    SUM(oc.grand_total) as total_charges,
    COALESCE(SUM(oc.grand_total) FILTER (WHERE oc.status = 'paid'), 0) as paid_amount,
    COALESCE(SUM(oc.grand_total) FILTER (WHERE oc.status = 'pending'), 0) as pending_amount,
    COUNT(*) as charge_count
  FROM overage_charges oc
  WHERE oc.org_id = p_org_id
  GROUP BY oc.billing_period
  ORDER BY oc.billing_period DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- View: Overage charges dashboard
-- ============================================================
CREATE OR REPLACE VIEW overage_charges_dashboard AS
SELECT
  oc.id,
  oc.org_id,
  oc.billing_period,
  oc.api_overage,
  oc.bookings_overage,
  oc.reports_overage,
  oc.email_overage,
  oc.grand_total,
  oc.order_code,
  oc.checkout_url,
  oc.status,
  oc.paid_at,
  oc.created_at,
  CASE
    WHEN oc.status = 'pending' THEN 'Chờ thanh toán'
    WHEN oc.status = 'paid' THEN 'Đã thanh toán'
    WHEN oc.status = 'failed' THEN 'Thất bại'
    WHEN oc.status = 'refunded' THEN 'Đã hoàn tiền'
    WHEN oc.status = 'expired' THEN 'Hết hạn'
    ELSE 'Không rõ'
  END as status_label
FROM overage_charges oc
ORDER BY oc.created_at DESC;

-- ============================================================
-- End of Migration
-- ============================================================
