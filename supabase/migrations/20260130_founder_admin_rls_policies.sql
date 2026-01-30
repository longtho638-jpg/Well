-- Migration: 20260130_founder_admin_rls_policies
-- Description: Setup RLS policies for Founder Admin Panel and ensure tables exist

-- 1. Create helper function to check if user is founder
CREATE OR REPLACE FUNCTION is_founder()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the user has the 'founder' role in the users table
  -- We assume 'founder' or 'super_admin' qualifies as founder access
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (role = 'founder' OR role = 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create/Ensure tables exist (based on src/types.ts)

-- USERS (Public profile table, matches src/services expectations)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT,
  email TEXT,
  rank INTEGER, -- UserRank enum
  role_id INTEGER,
  role TEXT DEFAULT 'user', -- 'admin', 'super_admin', 'founder', 'user'
  total_sales NUMERIC DEFAULT 0,
  team_volume NUMERIC DEFAULT 0,
  avatar_url TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  kyc_status BOOLEAN DEFAULT FALSE,
  shop_balance NUMERIC DEFAULT 0,
  grow_balance NUMERIC DEFAULT 0,
  point_balance NUMERIC DEFAULT 0,
  pending_cashback NUMERIC DEFAULT 0,
  staked_grow_balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DISTRIBUTORS (Sub-table or View of users for specific ranks/roles)
-- For now, creating as a separate table if it needs distinct data,
-- or we can treat it as a placeholder if logic is in users.
-- Given the prompt asks for "distributors table", we create a placeholder table
-- linked to users, or assume it stores distributor-specific business info.
CREATE TABLE IF NOT EXISTS distributors (
  id UUID PRIMARY KEY REFERENCES users(id),
  distributor_level TEXT,
  region TEXT,
  contract_signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL, -- 'Direct Sale', 'Team Volume Bonus', 'Withdrawal', 'sale'
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  currency TEXT DEFAULT 'SHOP',
  tax_deducted NUMERIC DEFAULT 0,
  hash TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDERS
-- Code suggests orders are transactions with type 'sale', but prompt asks for orders table.
-- We create a dedicated orders table which might link to transactions or stand alone.
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  items JSONB, -- Store order items
  shipping_address JSONB,
  payment_proof_url TEXT,
  transaction_id UUID REFERENCES transactions(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_by UUID REFERENCES users(id), -- Distributor who owns this customer
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCTS (from productService.ts)
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  bonus_revenue NUMERIC DEFAULT 0,
  commission_rate NUMERIC DEFAULT 0.21,
  image_url TEXT,
  sales_count INTEGER DEFAULT 0,
  stock INTEGER DEFAULT 0,
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies

-- USERS: Founder has full access
CREATE POLICY "Founders can do everything on users"
ON users FOR ALL
TO authenticated
USING (is_founder());

-- USERS: Users can view/edit their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- DISTRIBUTORS: Founder has full access
CREATE POLICY "Founders can manage distributors"
ON distributors FOR ALL
TO authenticated
USING (is_founder());

-- DISTRIBUTORS: Distributors can view their own record
CREATE POLICY "Distributors can view own record"
ON distributors FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- TRANSACTIONS: Founder has full access
CREATE POLICY "Founders can manage transactions"
ON transactions FOR ALL
TO authenticated
USING (is_founder());

-- TRANSACTIONS: Users can view their own transactions
CREATE POLICY "Users can view own transactions"
ON transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ORDERS: Founder has full access
CREATE POLICY "Founders can manage orders"
ON orders FOR ALL
TO authenticated
USING (is_founder());

-- ORDERS: Users can view their own orders
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- CUSTOMERS: Founder has full access
CREATE POLICY "Founders can manage customers"
ON customers FOR ALL
TO authenticated
USING (is_founder());

-- CUSTOMERS: Users (Distributors) can manage their own customers
CREATE POLICY "Users can manage own customers"
ON customers FOR ALL
TO authenticated
USING (created_by = auth.uid());

-- PRODUCTS: Founder has full access
CREATE POLICY "Founders can manage products"
ON products FOR ALL
TO authenticated
USING (is_founder());

-- PRODUCTS: Public/Users can view active products
CREATE POLICY "Everyone can view active products"
ON products FOR SELECT
TO authenticated
USING (is_active = true);

-- 5. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON customers(created_by);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

