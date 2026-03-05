-- Phase 2B: Partner Split Rules
-- Created: 2026-03-05
-- Description: Tracks referrer/sponsor relationships and 60/40 commission splits

-- Create partner_splits table
CREATE TABLE IF NOT EXISTS partner_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sponsor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    split_percentage DECIMAL(5,2) NOT NULL DEFAULT 60.00, -- Referrer gets 60%, sponsor gets 40%
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(referrer_id, sponsor_id)
);

-- Enable RLS
ALTER TABLE partner_splits ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access"
    ON partner_splits
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to read their own splits
CREATE POLICY "Users can read own splits"
    ON partner_splits
    FOR SELECT
    TO authenticated
    USING (
        referrer_id = auth.uid() OR
        sponsor_id = auth.uid()
    );

-- Create indexes for faster lookups
CREATE INDEX idx_partner_splits_referrer ON partner_splits(referrer_id);
CREATE INDEX idx_partner_splits_sponsor ON partner_splits(sponsor_id);

-- Create updated_at trigger
CREATE TRIGGER update_partner_splits_updated_at
    BEFORE UPDATE ON partner_splits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default split config for existing users
-- Referrer (person who invited) gets 60%, Sponsor (upline) gets 40%
INSERT INTO partner_splits (referrer_id, sponsor_id, split_percentage)
SELECT
    u.id as referrer_id,
    u.sponsor_id as sponsor_id,
    60.00 as split_percentage
FROM users u
WHERE u.sponsor_id IS NOT NULL
ON CONFLICT (referrer_id, sponsor_id) DO NOTHING;

-- Create view for quick split lookup
CREATE OR REPLACE VIEW v_partner_splits AS
SELECT
    ps.referrer_id,
    ps.sponsor_id,
    ps.split_percentage,
    (100.00 - ps.split_percentage) as sponsor_percentage,
    r.email as referrer_email,
    s.email as sponsor_email
FROM partner_splits ps
JOIN users r ON r.id = ps.referrer_id
JOIN users s ON s.id = ps.sponsor_id;

COMMENT ON TABLE partner_splits IS 'Phase 2B: Partner split rules for 60/40 referrer/sponsor commission distribution';
