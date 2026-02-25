-- ============================================================================
-- WellNexus Security Fixes - 2026-02-25
-- Fixes: Critical Privilege Escalation via Unrestricted INSERT on users table
-- ============================================================================

-- 1. Create a secure function to handle new user creation
-- This function runs with SECURITY DEFINER privileges (as the database owner)
-- preventing users from manipulating the insertion logic.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role_id INTEGER;
  v_sponsor_id UUID;
  v_name TEXT;
BEGIN
  -- Extract role_id from metadata, default to 8 (CTV/Member)
  -- We use COALESCE to safely handle nulls or missing keys
  v_role_id := COALESCE((new.raw_user_meta_data->>'role_id')::INTEGER, 8);

  -- SECURITY CHECK: Restrict allowed roles for self-registration / invites
  -- Only allow roles 6 (Kỹ sư), 7 (Khởi nghiệp), 8 (CTV)
  -- Force any other role (especially Admin/1) to default to 8
  IF v_role_id NOT IN (6, 7, 8) THEN
    v_role_id := 8;
  END IF;

  -- Extract other metadata
  v_name := COALESCE(new.raw_user_meta_data->>'name', new.email);

  -- Handle sponsor_id safely (ensure it's a valid UUID if present)
  BEGIN
    v_sponsor_id := (new.raw_user_meta_data->>'sponsor_id')::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_sponsor_id := NULL;
  END;

  -- Insert the new user into public.users
  INSERT INTO public.users (
    id,
    email,
    name,
    role_id,
    role,
    sponsor_id,
    created_at,
    updated_at
  ) VALUES (
    new.id,
    new.email,
    v_name,
    v_role_id,
    'user', -- Default text role is always 'user' for safety
    v_sponsor_id,
    NOW(),
    NOW()
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the Trigger on auth.users
-- This ensures that every time a user signs up (via any method),
-- a public.users record is created automatically and securely.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. DROP the Insecure Policy
-- Now that the trigger handles insertion, we MUST remove the ability
-- for users to insert their own records directly.
DROP POLICY IF EXISTS "users_insert_own" ON public.users;

-- 4. Verify Policy Drop (Optional, ensures it's gone)
-- If the policy existed, it is now dropped. If not, no harm done.

-- ============================================================================
-- VERIFY
-- ============================================================================
SELECT 'Security fixes applied successfully.' AS message;
