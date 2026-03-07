-- Usage Adjustments & Reconciliation Reports Tables
-- Migration for Phase 6: Dispute Resolution & Audit Trail

-- 1. Create usage_adjustments table
CREATE TABLE IF NOT EXISTS usage_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregation_id UUID REFERENCES usage_aggregations(id) ON DELETE CASCADE,
  adjustment_type TEXT NOT NULL,  -- 'credit', 'debit', 'write_off'
  quantity BIGINT NOT NULL,
  reason TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'approved', 'rejected', 'applied'
  applied_at TIMESTAMPTZ,
  applied_by TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create reconciliation_reports table
CREATE TABLE IF NOT EXISTS reconciliation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_item_id TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_local_quantity BIGINT NOT NULL,
  total_stripe_quantity BIGINT NOT NULL,
  total_difference BIGINT NOT NULL,
  status TEXT NOT NULL,  -- 'balanced', 'discrepancy_found', 'error'
  items JSONB NOT NULL,
  recommendations JSONB,
  errors JSONB,
  generated_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- 3. Indexes for usage_adjustments
CREATE INDEX idx_usage_adjustments_aggregation ON usage_adjustments(aggregation_id);
CREATE INDEX idx_usage_adjustments_type ON usage_adjustments(adjustment_type);
CREATE INDEX idx_usage_adjustments_status ON usage_adjustments(status);
CREATE INDEX idx_usage_adjustments_created_at ON usage_adjustments(created_at DESC);

-- 4. Indexes for reconciliation_reports
CREATE INDEX idx_reconciliation_reports_subscription ON reconciliation_reports(subscription_item_id);
CREATE INDEX idx_reconciliation_reports_period ON reconciliation_reports(period_start, period_end);
CREATE INDEX idx_reconciliation_reports_status ON reconciliation_reports(status);
CREATE INDEX idx_reconciliation_reports_generated_at ON reconciliation_reports(generated_at DESC);

-- 5. Create view for pending adjustments
CREATE OR REPLACE VIEW usage_adjustments_pending AS
SELECT
  a.id,
  a.aggregation_id,
  a.adjustment_type,
  a.quantity,
  a.reason,
  a.note,
  a.status,
  a.created_at,
  u.license_id,
  u.feature,
  u.total_quantity as aggregation_quantity
FROM usage_adjustments a
LEFT JOIN usage_aggregations u ON u.id = a.aggregation_id
WHERE a.status = 'pending'
ORDER BY a.created_at DESC;

-- 6. Create view for adjustment summary by license
CREATE OR REPLACE VIEW usage_adjustments_summary AS
SELECT
  u.license_id,
  COUNT(*) FILTER (WHERE a.status = 'pending') AS pending_count,
  COUNT(*) FILTER (WHERE a.status = 'approved') AS approved_count,
  COUNT(*) FILTER (WHERE a.status = 'applied') AS applied_count,
  SUM(a.quantity) FILTER (WHERE a.status = 'applied' AND a.adjustment_type = 'credit') AS total_credits,
  SUM(a.quantity) FILTER (WHERE a.status = 'applied' AND a.adjustment_type = 'debit') AS total_debits,
  SUM(a.quantity) FILTER (WHERE a.status = 'applied' AND a.adjustment_type = 'write_off') AS total_write_offs
FROM usage_adjustments a
LEFT JOIN usage_aggregations u ON u.id = a.aggregation_id
GROUP BY u.license_id;

-- 7. Create function to apply adjustment
CREATE OR REPLACE FUNCTION apply_usage_adjustment(
  p_adjustment_id UUID,
  p_applied_by TEXT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_adjustment RECORD;
BEGIN
  -- Get adjustment details
  SELECT * INTO v_adjustment
  FROM usage_adjustments
  WHERE id = p_adjustment_id;

  IF v_adjustment IS NULL THEN
    RAISE EXCEPTION 'Adjustment not found: %', p_adjustment_id;
  END IF;

  IF v_adjustment.status != 'pending' THEN
    RAISE EXCEPTION 'Adjustment already processed: %', v_adjustment.status;
  END IF;

  -- Apply adjustment based on type
  IF v_adjustment.adjustment_type = 'credit' THEN
    -- Credit: increase aggregation quantity
    UPDATE usage_aggregations
    SET total_quantity = total_quantity + v_adjustment.quantity
    WHERE id = v_adjustment.aggregation_id;

  ELSIF v_adjustment.adjustment_type = 'debit' THEN
    -- Debit: decrease aggregation quantity
    UPDATE usage_aggregations
    SET total_quantity = GREATEST(0, total_quantity - v_adjustment.quantity)
    WHERE id = v_adjustment.aggregation_id;

  ELSIF v_adjustment.adjustment_type = 'write_off' THEN
    -- Write-off: set quantity to zero (for disputes)
    UPDATE usage_aggregations
    SET total_quantity = 0
    WHERE id = v_adjustment.aggregation_id;
  END IF;

  -- Mark adjustment as applied
  UPDATE usage_adjustments
  SET
    status = 'applied',
    applied_at = NOW(),
    applied_by = p_applied_by,
    updated_at = NOW()
  WHERE id = p_adjustment_id;
END;
$$;

-- 8. Create function to approve adjustment
CREATE OR REPLACE FUNCTION approve_usage_adjustment(
  p_adjustment_id UUID,
  p_approved_by TEXT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE usage_adjustments
  SET
    status = 'approved',
    updated_at = NOW()
  WHERE id = p_adjustment_id;
END;
$$;

-- 9. Create function to reject adjustment
CREATE OR REPLACE FUNCTION reject_usage_adjustment(
  p_adjustment_id UUID,
  p_rejected_by TEXT,
  p_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE usage_adjustments
  SET
    status = 'rejected',
    note = COALESCE(note || ' | ', '') || 'Rejected: ' || p_reason,
    updated_at = NOW()
  WHERE id = p_adjustment_id;
END;
$$;

-- 10. Grant permissions
GRANT SELECT ON usage_adjustments TO authenticated;
GRANT SELECT ON usage_adjustments_pending TO authenticated;
GRANT SELECT ON usage_adjustments_summary TO authenticated;
GRANT SELECT ON reconciliation_reports TO authenticated;
GRANT EXECUTE ON FUNCTION apply_usage_adjustment TO authenticated;
GRANT EXECUTE ON FUNCTION approve_usage_adjustment TO authenticated;
GRANT EXECUTE ON FUNCTION reject_usage_adjustment TO authenticated;

-- 11. Enable RLS
ALTER TABLE usage_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view own adjustments
CREATE POLICY "Users can view own adjustments"
  ON usage_adjustments
  FOR SELECT
  TO authenticated
  USING (true);  -- TODO: Add license ownership check

-- Policy: Users can create own adjustments
CREATE POLICY "Users can create own adjustments"
  ON usage_adjustments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Users can view own reconciliation reports
CREATE POLICY "Users can view own reconciliation reports"
  ON reconciliation_reports
  FOR SELECT
  TO authenticated
  USING (true);  -- TODO: Add subscription ownership check

-- 12. Comments for documentation
COMMENT ON TABLE usage_adjustments IS 'Manual adjustments to usage aggregations for dispute resolution';
COMMENT ON TABLE reconciliation_reports IS 'Historical reconciliation reports comparing local vs Stripe records';
COMMENT ON VIEW usage_adjustments_pending IS 'Adjustments awaiting approval';
COMMENT ON VIEW usage_adjustments_summary IS 'Summary of adjustments by license';
COMMENT ON FUNCTION apply_usage_adjustment IS 'Apply pending adjustment to aggregation';
COMMENT ON FUNCTION approve_usage_adjustment IS 'Approve adjustment for application';
COMMENT ON FUNCTION reject_usage_adjustment IS 'Reject adjustment with reason';
