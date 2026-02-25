-- Migration: Add team_volume trigger and tree RPC
-- Fixes: Rank upgrade bug (team_volume not updating) and LeaderDashboard N+1 query

-- 1. Create a function to update team_volume of all uplines when an order is completed
CREATE OR REPLACE FUNCTION update_upline_team_volume()
RETURNS TRIGGER AS $$
DECLARE
    current_sponsor UUID;
BEGIN
    -- Only process completed orders that have a user_id and total_amount > 0
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.user_id IS NOT NULL AND NEW.total_amount > 0 THEN
        -- Get the direct sponsor of the user who made the order
        SELECT sponsor_id INTO current_sponsor FROM public.users WHERE id = NEW.user_id;
        
        -- Walk up the tree and update team_volume for each upline
        -- Cap at 20 levels deep just as a fail-safe against infinite loops (though guarded elsewhere)
        FOR i IN 1..20 LOOP
            EXIT WHEN current_sponsor IS NULL;
            
            -- Add the order amount to the sponsor's team_volume
            UPDATE public.users 
            SET team_volume = COALESCE(team_volume, 0) + NEW.total_amount
            WHERE id = current_sponsor;
            
            -- Move up to the next sponsor
            SELECT sponsor_id INTO current_sponsor FROM public.users WHERE id = current_sponsor;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on the orders table
DROP TRIGGER IF EXISTS trigger_update_upline_team_volume ON public.orders;
CREATE TRIGGER trigger_update_upline_team_volume
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_upline_team_volume();


-- 2. Create RPC for fetching downline tree to fix N+1 query
CREATE OR REPLACE FUNCTION get_full_downline_tree(p_user_id UUID, p_max_depth INT DEFAULT 5)
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    sponsor_id UUID,
    created_at TIMESTAMPTZ,
    rank_id TEXT,
    direct_downlines INT,
    total_sales NUMERIC,
    team_volume NUMERIC,
    depth INT
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE downline_tree AS (
        -- Base case: direct children (F1)
        SELECT 
            u.id, u.email, u.full_name, u.phone, u.sponsor_id, u.created_at, 
            u.rank_id, COALESCE(u.direct_downlines, 0) as direct_downlines, 
            COALESCE(u.total_sales, 0) as total_sales, COALESCE(u.team_volume, 0) as team_volume,
            1 AS depth,
            ARRAY[u.id] AS visited_ids
        FROM public.users u
        WHERE u.sponsor_id = p_user_id

        UNION ALL

        -- Recursive case: children of children (F2, F3...)
        SELECT 
            c.id, c.email, c.full_name, c.phone, c.sponsor_id, c.created_at, 
            c.rank_id, COALESCE(c.direct_downlines, 0), 
            COALESCE(c.total_sales, 0), COALESCE(c.team_volume, 0),
            dt.depth + 1 AS depth,
            dt.visited_ids || c.id AS visited_ids
        FROM public.users c
        JOIN downline_tree dt ON c.sponsor_id = dt.id
        -- Guard against loops and depth limit
        WHERE dt.depth < p_max_depth AND NOT (c.id = ANY(dt.visited_ids))
    )
    SELECT 
        dt.id, dt.email, dt.full_name, dt.phone, dt.sponsor_id, dt.created_at, 
        dt.rank_id, dt.direct_downlines, dt.total_sales, dt.team_volume, dt.depth
    FROM downline_tree dt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
