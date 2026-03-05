-- Phase 2C: Performance Bonus Pool
-- Created: 2026-03-05
-- Description: Monthly 2% bonus pool distributed to top 10 performers

-- Create bonus_pools table
CREATE TABLE IF NOT EXISTS bonus_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month INT NOT NULL, -- 1-12
    year INT NOT NULL,
    total_pool_amount DECIMAL(15,2) DEFAULT 0, -- 2% of monthly volume
    total_volume DECIMAL(15,2) DEFAULT 0, -- Total monthly volume for calculation
    status TEXT DEFAULT 'pending', -- pending, calculating, distributed
    distributed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(month, year)
);

-- Create bonus_pool_winners table (top 10 performers)
CREATE TABLE IF NOT EXISTS bonus_pool_winners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bonus_pool_id UUID NOT NULL REFERENCES bonus_pools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    rank INT NOT NULL, -- 1-10
    team_volume DECIMAL(15,2) NOT NULL, -- User's team volume for the month
    bonus_amount DECIMAL(15,2) NOT NULL, -- Calculated bonus
    percentage_share DECIMAL(5,2) NOT NULL, -- % of pool (e.g., 30% for 1st place)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(bonus_pool_id, user_id)
);

-- Enable RLS
ALTER TABLE bonus_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_pool_winners ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access"
    ON bonus_pools
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access"
    ON bonus_pool_winners
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to read bonus pools
CREATE POLICY "Users can read bonus pools"
    ON bonus_pools
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can read own winnings"
    ON bonus_pool_winners
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX idx_bonus_pools_month_year ON bonus_pools(month, year);
CREATE INDEX idx_bonus_pools_status ON bonus_pools(status);
CREATE INDEX idx_bonus_pool_winners_pool_id ON bonus_pool_winners(bonus_pool_id);
CREATE INDEX idx_bonus_pool_winners_user_id ON bonus_pool_winners(user_id);
CREATE INDEX idx_bonus_pool_winners_rank ON bonus_pool_winners(rank);

-- Create updated_at trigger for bonus_pools
CREATE TRIGGER update_bonus_pools_updated_at
    BEFORE UPDATE ON bonus_pools
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default bonus distribution percentages (top 10)
-- 1st: 30%, 2nd: 25%, 3rd: 15%, 4th: 10%, 5th: 7%, 6th: 5%, 7th: 4%, 8th: 3%, 9th: 2%, 10th: 1%
CREATE OR REPLACE FUNCTION get_bonus_percentage(rank INT)
RETURNS DECIMAL(5,2) AS $$
BEGIN
    RETURN CASE rank
        WHEN 1 THEN 30.00
        WHEN 2 THEN 25.00
        WHEN 3 THEN 15.00
        WHEN 4 THEN 10.00
        WHEN 5 THEN 7.00
        WHEN 6 THEN 5.00
        WHEN 7 THEN 4.00
        WHEN 8 THEN 3.00
        WHEN 9 THEN 2.00
        WHEN 10 THEN 1.00
        ELSE 0.00
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create view for monthly bonus pool status
CREATE OR REPLACE VIEW v_bonus_pool_summary AS
SELECT
    bp.month,
    bp.year,
    bp.total_pool_amount,
    bp.total_volume,
    bp.status,
    bp.distributed_at,
    COUNT(bpw.id) as winner_count,
    COALESCE(SUM(bpw.bonus_amount), 0) as total_distributed
FROM bonus_pools bp
LEFT JOIN bonus_pool_winners bpw ON bpw.bonus_pool_id = bp.id
GROUP BY bp.id
ORDER BY bp.year DESC, bp.month DESC;

COMMENT ON TABLE bonus_pools IS 'Phase 2C: Monthly performance bonus pool (2% of total volume)';
COMMENT ON TABLE bonus_pool_winners IS 'Phase 2C: Top 10 performers receiving bonus distribution';
