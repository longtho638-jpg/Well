-- Fix registration: Allow authenticated users to create their own profile
-- Set search_path explicitly for Supabase migration runner
SET search_path TO public;

DROP POLICY IF EXISTS "users_insert_own" ON users;
CREATE POLICY "users_insert_own"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
