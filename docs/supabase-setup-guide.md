# Supabase Setup Guide for WellNexus

This guide walks you through setting up Supabase for authentication and database.

---

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"New project"**
3. Fill in:
   - **Project name**: `wellnexus` (or your preferred name)
   - **Database Password**: (Generate a strong password - save it securely)
   - **Region**: Choose closest to your users (e.g., `Southeast Asia (Singapore)`)
4. Click **"Create new project"**
5. Wait 2-3 minutes for project initialization

---

## Step 2: Get API Credentials

1. In your Supabase project dashboard, go to **Settings** (gear icon) → **API**
2. Find these two values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **Project API keys → anon public** (starts with `eyJ...`)

3. Copy both values

---

## Step 3: Configure Environment Variables

1. Open `/Users/macbookprom1/Well/.env.local`
2. Add these lines (replace with your actual values):

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Save the file
4. Restart your dev server: `npm run dev`

---

## Step 4: Create Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Paste this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role_id INTEGER DEFAULT 8, -- CTV rank by default
  sponsor_id UUID REFERENCES public.users(id),
  total_sales BIGINT DEFAULT 0,
  team_volume BIGINT DEFAULT 0,
  shop_balance BIGINT DEFAULT 0,
  grow_balance BIGINT DEFAULT 0,
  pending_cashback BIGINT DEFAULT 0,
  point_balance INTEGER DEFAULT 0,
  staked_grow_balance BIGINT DEFAULT 0,
  avatar_url TEXT,
  accumulated_bonus_revenue BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own data
CREATE POLICY "Users can view own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Anyone can insert (for signup)
CREATE POLICY "Anyone can insert during signup"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

4. Click **"Run"** (or press `Ctrl+Enter`)
5. Verify success (should see "Success. No rows returned")

---

## Step 5: Configure Email Templates (CRITICAL)

### 5.1 Enable Email Confirmations

1. Go to **Authentication** → **Settings**
2. Under **Email Auth**:
   - ✅ **Enable email confirmations** (must be ON)
   - **Confirmation** → **Secure email change**
3. Scroll to **Email Templates**

### 5.2 Update Confirmation Email Template

1. Click **Confirm signup** template
2. Update the HTML to include this redirect URL:

```html
<a href="{{ .ConfirmationURL }}&redirect_to={{ .SiteURL }}/confirm-email">
  Confirm your email
</a>
```

3. Or use this complete template:

```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your account:</p>
<p><a href="{{ .ConfirmationURL }}&redirect_to={{ .SiteURL }}/confirm-email">Confirm your email</a></p>
```

4. Click **Save**

### 5.3 Configure Site URL

1. Still in **Authentication** → **Settings**
2. Find **Site URL** field
3. Set to:
   - **Development**: `http://localhost:5173`
   - **Production**: `https://wellnexus.vn`
4. Under **Redirect URLs**, add:
   - `http://localhost:5173/confirm-email`
   - `https://wellnexus.vn/confirm-email`
5. Click **Save**

---

## Step 6: Test Authentication Flow

### Test Signup:

1. Start dev server: `npm run dev`
2. Go to `http://localhost:5173/signup`
3. Fill form with test email (use real email you can access)
4. Submit form
5. ✅ Should see "Check Your Email" message
6. Check email inbox for confirmation link
7. Click confirmation link
8. ✅ Should redirect to `/confirm-email` with success message
9. Go to `/login` and log in with the credentials

### Test Login:

1. Go to `http://localhost:5173/login`
2. Enter email and password
3. ✅ Should redirect to `/dashboard` (or `/admin` if admin)

### Verify Database:

1. In Supabase dashboard, go to **Table Editor**
2. Select **users** table
3. ✅ Should see your new user record with correct data

---

## Step 7: Production Deployment

### Update Vercel Environment Variables:

```bash
# In Vercel dashboard or CLI
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
```

### Update Supabase Site URL:

1. In Supabase **Authentication** → **Settings**
2. Update **Site URL** to: `https://wellnexus.vn`
3. Add to **Redirect URLs**:
   - `https://wellnexus.vn/confirm-email`
   - `https://wellnexus.vn/login`

---

## Troubleshooting

### Issue: "Invalid login credentials"

**Cause:** User hasn't confirmed email yet

**Fix:** Check email and click confirmation link, or disable email confirmation in Supabase settings (not recommended for production)

### Issue: "Failed to create user profile"

**Cause:** Database schema not created or RLS policy blocking insert

**Fix:**
1. Run the SQL schema from Step 4
2. Verify policy: `"Anyone can insert during signup"` exists

### Issue: Confirmation email not received

**Possible causes:**
1. Email in spam folder → Check spam
2. Invalid email provider → Try different email
3. Supabase email rate limit → Wait 60 seconds between attempts
4. Email template broken → Re-save template in Supabase dashboard

**Quick test:**
```bash
# In Supabase SQL Editor
SELECT * FROM auth.users WHERE email = 'your-test-email@example.com';
# If user exists but email_confirmed_at is NULL, they need to confirm
```

### Issue: "email_confirmed_at is NULL" after clicking link

**Cause:** Redirect URL mismatch

**Fix:**
1. Verify `/confirm-email` route exists in App.tsx ✅
2. Verify component handles token correctly ✅
3. Check Supabase Redirect URLs include your domain

### Issue: "User created in auth.users but not in public.users"

**Cause:** Silent error in useAuth.ts insert (now fixed) ✅

**Fix:** Run this cleanup query:

```sql
-- Find orphaned auth users
SELECT auth.users.id, auth.users.email
FROM auth.users
LEFT JOIN public.users ON auth.users.id = public.users.id
WHERE public.users.id IS NULL;

-- Manually insert missing users (replace values)
INSERT INTO public.users (id, email, name, role_id)
VALUES (
  'user-id-from-above',
  'user-email-from-above',
  'User Name',
  8
);
```

---

## Security Checklist

Before going to production:

- [ ] Row Level Security (RLS) enabled on all tables
- [ ] Email confirmation required (enabled in Auth settings)
- [ ] Strong database password used
- [ ] Anon key is PUBLIC (safe to expose in client code)
- [ ] Service role key is PRIVATE (never in client code)
- [ ] HTTPS enforced in production
- [ ] Redirect URLs whitelist configured
- [ ] Test all auth flows end-to-end

---

## Quick Reference

### Environment Variables:

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### Key Files Modified:

- ✅ `src/hooks/useAuth.ts` - Fixed rank type, error throwing
- ✅ `src/hooks/useSignup.ts` - Added email confirmation flow
- ✅ `src/pages/confirm-email.tsx` - NEW confirmation page
- ✅ `src/components/auth/SignupForm.tsx` - Success message overlay
- ✅ `src/App.tsx` - Added `/confirm-email` route

### Admin Emails:

To make a user admin, add their email to:

`src/utils/admin-check.ts`:

```typescript
const ADMIN_EMAILS = [
  'your-email@example.com',
  'admin@wellnexus.vn'
];
```

---

## Support

If you encounter issues:

1. Check Supabase logs: **Logs** → **Auth Logs** in dashboard
2. Check browser console for errors
3. Verify environment variables loaded: `console.log(import.meta.env.VITE_SUPABASE_URL)`
4. Check user's email status in **Authentication** → **Users** table

---

_Last updated: 2026-02-05_
_WellNexus Authentication Setup_
