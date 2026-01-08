-- ============================================================================
-- Policy Engine v3.0 Configuration Table
-- ============================================================================
-- This table stores dynamic policy configurations that can be updated 
-- by admins in real-time without requiring code deployments.
-- ============================================================================

-- Drop table if exists (for idempotency during development)
DROP TABLE IF EXISTS policy_config CASCADE;

-- Create policy_config table
CREATE TABLE IF NOT EXISTS policy_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Insert default Bee 3.0 configuration
INSERT INTO policy_config (key, value, updated_by) VALUES (
  'global_policy',
  '{
    "commissions": {
      "retailComm": 25,
      "agencyBonus": 10,
      "elitePool": 3
    },
    "rules": {
      "activationThreshold": 6000000,
      "whiteLabelGMV": 1000000000,
      "whiteLabelPartners": 50
    },
    "beeAgentPolicy": {
      "ctvCommission": 21,
      "startupCommission": 25,
      "sponsorBonus": 8,
      "rankUpThreshold": 9900000
    }
  }'::jsonb,
  NULL
) ON CONFLICT (key) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE policy_config ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read (for Edge Functions/Service Role)
CREATE POLICY "Anyone can read policy config"
  ON policy_config
  FOR SELECT
  USING (true);

-- RLS Policy: Only admins (Đại Sứ rank 6 or higher) can update
CREATE POLICY "Admins can update policy config"
  ON policy_config
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role_id <= 6  -- Đại Sứ or higher
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_policy_config_key ON policy_config(key);

-- Comment on table
COMMENT ON TABLE policy_config IS 'Stores dynamic policy configurations for Bee 3.0 (commission rates, thresholds, etc.)';
