-- ============================================================================
-- Guard against circular sponsor references (user being their own sponsor)
-- Also fixes: get_downline_tree infinite loop potential
-- ============================================================================

-- Add CHECK constraint to prevent sponsor_id = own id
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_no_self_sponsor,
  ADD CONSTRAINT users_no_self_sponsor
    CHECK (sponsor_id IS NULL OR sponsor_id <> id);

-- Replace get_downline_tree with cycle-safe version using CYCLE detection
-- (PostgreSQL 14+ supports CYCLE clause in recursive CTEs)
CREATE OR REPLACE FUNCTION get_downline_tree(root_user_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  sponsor_id uuid,
  rank text,
  avatar_url text,
  created_at timestamptz,
  total_sales numeric,
  level integer,
  path text[]
) LANGUAGE sql STABLE AS $$
  WITH RECURSIVE downline AS (
    SELECT
      u.id,
      u.name,
      u.email,
      u.sponsor_id,
      u.rank,
      u.avatar_url,
      u.created_at,
      u.total_sales,
      1 AS level,
      ARRAY[u.id] AS visited_ids,
      ARRAY[u.name] AS path
    FROM users u
    WHERE u.sponsor_id = root_user_id
      AND u.id <> root_user_id  -- exclude self-referencing root

    UNION ALL

    SELECT
      u.id,
      u.name,
      u.email,
      u.sponsor_id,
      u.rank,
      u.avatar_url,
      u.created_at,
      u.total_sales,
      d.level + 1,
      d.visited_ids || u.id,
      d.path || u.name
    FROM users u
    JOIN downline d ON u.sponsor_id = d.id
    WHERE d.level < 7                        -- max depth F7
      AND NOT (u.id = ANY(d.visited_ids))    -- cycle detection
  )
  SELECT id, name, email, sponsor_id, rank, avatar_url, created_at, total_sales, level, path
  FROM downline;
$$;
