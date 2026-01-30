-- Enable RLS on transactions table if not already enabled
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users (guests) to insert orders
-- Note: We restrict this to 'sale' type and 'pending' status for security
CREATE POLICY "Allow public insert for guest orders"
ON transactions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  type = 'sale' AND
  status = 'pending' AND
  (auth.uid() IS NULL OR auth.uid() = user_id)
);

-- Allow users to view their own transactions (based on ID or maybe session?)
-- For guests, they can't "view" list of orders easily without auth,
-- but they get a success page. Retaining existing policies is key.
-- This policy allows the inserted row to be returned to the client immediately after insert.
CREATE POLICY "Allow reading own inserted order"
ON transactions
FOR SELECT
TO anon, authenticated
USING (
  (auth.uid() = user_id) OR
  (auth.uid() IS NULL AND created_at > now() - interval '1 minute') -- Temp access for guest confirmation?
  -- Better: The INSERT ... SELECT returning works if the INSERT policy allows it,
  -- but strictly speaking SELECT usually needs its own policy.
  -- Often for guest checkout, we rely on the backend response or just don't query it back
  -- except for the immediate return which Supabase handles if you have permission.
);
