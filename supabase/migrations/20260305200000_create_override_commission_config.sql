-- Phase 2A: Multi-Level Override Commission Configuration
-- Created: 2026-03-05
-- Description: Stores F1-F5 commission override config with rank requirements and team volume thresholds

-- Create override_commission_config table
CREATE TABLE IF NOT EXISTS override_commission_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level INT NOT NULL UNIQUE, -- F1-F5 (1-5)
    min_rank_id INT NOT NULL, -- Minimum rank ID required (1=Thien Long, 6=Dai Su)
    override_percent DECIMAL(5,2) NOT NULL, -- Override percentage (e.g., 8.00 for 8%)
    team_volume_threshold DECIMAL(15,2) DEFAULT 0, -- Minimum team volume required (VND)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE override_commission_config ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access"
    ON override_commission_config
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to read config (needed for Edge Functions)
CREATE POLICY "Authenticated users can read config"
    ON override_commission_config
    FOR SELECT
    TO authenticated
    USING (true);

-- Create index for faster lookups
CREATE INDEX idx_override_commission_level ON override_commission_config(level);

-- Insert default F1-F5 config
-- F1: 8% for Dai Su (rank 6+) - no team volume threshold
-- F2: 5% for Dai Su Gold (rank 4+) - 50M team vol
-- F3: 3% for Dai Su Diamond (rank 3+) - 200M team vol
-- F4: 2% for Phuong Hoang (rank 2+) - 500M team vol
-- F5: 1% for Thien Long (rank 1+) - 1B team vol
INSERT INTO override_commission_config (id, level, min_rank_id, override_percent, team_volume_threshold)
VALUES
    (gen_random_uuid(), 1, 6, 8.00, 0), -- F1: Dai Su+ gets 8%
    (gen_random_uuid(), 2, 4, 5.00, 50000000), -- F2: Dai Su Gold+ gets 5% with 50M vol
    (gen_random_uuid(), 3, 3, 3.00, 200000000), -- F3: Dai Su Diamond+ gets 3% with 200M vol
    (gen_random_uuid(), 4, 2, 2.00, 500000000), -- F4: Phuong Hoang gets 2% with 500M vol
    (gen_random_uuid(), 5, 1, 1.00, 1000000000) -- F5: Thien Long gets 1% with 1B vol
ON CONFLICT (level) DO NOTHING;

-- Create updated_at trigger for auto-update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_override_commission_config_updated_at
    BEFORE UPDATE ON override_commission_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE override_commission_config IS 'Phase 2A: Multi-level override commission configuration (F1-F5)';
