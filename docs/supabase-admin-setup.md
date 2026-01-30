# Supabase Founder Admin Setup Guide

This guide details the setup process for the Well Founder Admin Panel database, including RLS policies, table structures, and initial seed data.

## 1. Prerequisites

- **Supabase Project**: You need a Supabase project created.
- **Supabase CLI**: Installed locally (`brew install supabase/tap/supabase`).
- **Access**: Database credentials or access to the Supabase Dashboard SQL Editor.

## 2. Migration: Schema & RLS Policies

The migration file sets up the necessary tables and Row Level Security (RLS) policies to ensure only Founders/Admins can access sensitive data, while Distributors can only see their own data.

### File Location
`supabase/migrations/20260130_founder_admin_rls_policies.sql`

### What it does
1. **Creates/Ensures Tables**: `users`, `distributors`, `transactions`, `orders`, `customers`, `products`.
2. **Helper Function**: `is_founder()` - checks if the current user has `role = 'founder'` or `'super_admin'`.
3. **RLS Policies**:
   - **Founder**: Full CRUD access to all tables.
   - **User/Distributor**:
     - View own profile (`users`).
     - View own transactions & orders.
     - Manage own customers.
     - View active products.
     - CANNOT view other users' data or system-wide stats.

### How to Run

#### Option A: Supabase Dashboard (Easiest)
1. Go to your Supabase Project Dashboard -> **SQL Editor**.
2. Open the migration file content.
3. Paste it into the SQL Editor.
4. Click **Run**.

#### Option B: Supabase CLI
```bash
supabase db push
# OR if applying specific migration
supabase db reset # WARNING: This resets the DB
```

## 3. Seed Data

The seed file populates the database with a Founder account, test Distributors, Orders, Transactions, and Products.

### File Location
`supabase/seed.sql`

### Data Included
- **Founder**: `founder@wellnexus.vn` (Role: founder, Rank: Thien Long)
- **Distributors**: 5 users with various ranks (Diamond to Collaborator)
- **Products**: 3 sample products (Health, Beauty, Nutrition)
- **Transactions**: Sales & Bonuses
- **Orders**: Linked to transactions
- **Customers**: Sample end-customers linked to distributors

### How to Run

#### Option A: Supabase Dashboard
1. Go to **SQL Editor**.
2. Paste content from `supabase/seed.sql`.
3. Click **Run**.

#### Option B: Supabase CLI
```bash
supabase db seed
```

> **Note on Auth Users**: The seed script attempts to insert into `auth.users` for local development. In a hosted Supabase project, you cannot insert into `auth.users` via SQL Editor easily. You should create the users manually in the **Authentication** tab with the emails/IDs specified in the seed file (or update the seed file with real UUIDs from your Auth users).

## 4. Testing RLS Policies

To verify the security, you can run these SQL queries in the Dashboard to impersonate users.

### Test 1: Verify Founder Access
```sql
-- Switch to Founder context
SET request.jwt.claim.sub = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; -- Founder ID
SET ROLE authenticated;

-- Should return ALL users
SELECT count(*) FROM users;
-- Should see all transactions
SELECT count(*) FROM transactions;
```

### Test 2: Verify Distributor Access
```sql
-- Switch to Distributor A context
SET request.jwt.claim.sub = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22'; -- Distributor A ID
SET ROLE authenticated;

-- Should return ONLY their own profile (Count = 1)
SELECT count(*) FROM users;
-- Should return ONLY their own transactions
SELECT * FROM transactions;
-- Attempt to read others' data (Should return empty or error)
SELECT * FROM users WHERE id = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33';
```

## 5. Troubleshooting

### Issue: "permission denied for table users"
- **Cause**: RLS is enabled but no policy allows access.
- **Fix**: Ensure the migration ran successfully and policies exist. Check `is_founder()` function logic.

### Issue: "new row violates row-level security policy"
- **Cause**: Trying to insert data that the policy doesn't allow (e.g., a User trying to create a Product).
- **Fix**: Check the `USING` (for SELECT/DELETE) and `WITH CHECK` (for INSERT/UPDATE) clauses in policies.

### Issue: "duplicate key value violates unique constraint" during seed
- **Cause**: Seed ran twice or data already exists.
- **Fix**: The seed script uses `ON CONFLICT DO NOTHING/UPDATE` to handle this, but manual clean up might be needed:
  ```sql
  TRUNCATE TABLE transactions, orders, customers, distributors, products, users CASCADE;
  ```

## 6. Next Steps for Development
1. Integrate `supabase-js` client in the frontend.
2. Use the `useAuth()` hook to get the current user ID.
3. Test the Admin Dashboard UI with the Founder account.
