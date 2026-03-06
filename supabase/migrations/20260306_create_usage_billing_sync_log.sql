-- Migration: Usage Billing Sync Log Table
-- Created: 2026-03-06
-- Purpose: Track usage billing sync events to Polar.sh

-- Create usage_billing_sync_log table
CREATE TABLE IF NOT EXISTS usage_billing_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL,
    license_id TEXT NOT NULL REFERENCES raas_licenses(id),
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    polar_usage_id TEXT,
    calculated_cost DECIMAL(10,2) DEFAULT 0,
    error_message TEXT,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_usage_billing_sync_log_org_id ON usage_billing_sync_log(org_id);
CREATE INDEX IF NOT EXISTS idx_usage_billing_sync_log_license_id ON usage_billing_sync_log(license_id);
CREATE INDEX IF NOT EXISTS idx_usage_billing_sync_log_period ON usage_billing_sync_log(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_usage_billing_sync_log_status ON usage_billing_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_usage_billing_sync_log_synced_at ON usage_billing_sync_log(synced_at DESC);

-- Add RLS (Row Level Security)
ALTER TABLE usage_billing_sync_log ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
CREATE POLICY "Service role has full access" ON usage_billing_sync_log
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Policy: Authenticated users can only read their own org's logs
CREATE POLICY "Users can view own org logs" ON usage_billing_sync_log
    FOR SELECT USING (
        org_id = (
            SELECT org_id FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            LIMIT 1
        )
    );

-- Comment for documentation
COMMENT ON TABLE usage_billing_sync_log IS 'Tracks usage billing sync events to Polar.sh or other billing providers';
COMMENT ON COLUMN usage_billing_sync_log.polar_usage_id IS 'External billing provider usage record ID';
COMMENT ON COLUMN usage_billing_sync_log.calculated_cost IS 'Total calculated cost for overage in USD';
