-- Verify and Fix Row Level Security (RLS) Policies
-- Date: 2026-03-05
-- Security Audit: Critical

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Policy 1: Users can SELECT their own data only
CREATE POLICY "Users can view own data" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Policy 2: Users can UPDATE their own data only
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE
    USING (auth.uid() = id);

-- Policy 3: Admins can SELECT all users
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.email IN (
                COALESCE(current_setting('app.settings.admin_emails', true), '')
            )
        )
    );

-- Policy 4: Admins can manage all users (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage all users" ON users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.email IN (
                COALESCE(current_setting('app.settings.admin_emails', true), '')
            )
        )
    );

-- ============================================================================
-- 2. PRODUCTS TABLE
-- ============================================================================

-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Vendors can view own products" ON products;
DROP POLICY IF EXISTS "Vendors can create own products" ON products;
DROP POLICY IF EXISTS "Vendors can update own products" ON products;
DROP POLICY IF EXISTS "Vendors can delete own products" ON products;
DROP POLICY IF EXISTS "Admins can manage all products" ON products;

-- Policy 1: Everyone can view active products (read-only)
CREATE POLICY "Products are viewable by everyone" ON products
    FOR SELECT
    USING (status = 'active');

-- Policy 2: Vendors can view their own products (including drafts)
CREATE POLICY "Vendors can view own products" ON products
    FOR SELECT
    USING (vendor_id = auth.uid());

-- Policy 3: Vendors can INSERT their own products
CREATE POLICY "Vendors can create own products" ON products
    FOR INSERT
    WITH CHECK (vendor_id = auth.uid());

-- Policy 4: Vendors can UPDATE their own products only
CREATE POLICY "Vendors can update own products" ON products
    FOR UPDATE
    USING (vendor_id = auth.uid());

-- Policy 5: Vendors can DELETE their own products only
CREATE POLICY "Vendors can delete own products" ON products
    FOR DELETE
    USING (vendor_id = auth.uid());

-- Policy 6: Admins can manage all products
CREATE POLICY "Admins can manage all products" ON products
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.email IN (
                COALESCE(current_setting('app.settings.admin_emails', true), '')
            )
        )
    );

-- ============================================================================
-- 3. ORDERS TABLE
-- ============================================================================

-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Vendors can view orders for their products" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;

-- Policy 1: Users can SELECT their own orders
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy 2: Users can INSERT their own orders
CREATE POLICY "Users can create own orders" ON orders
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Policy 3: Vendors can view orders for their products
CREATE POLICY "Vendors can view orders for their products" ON orders
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM products p
            WHERE p.id = orders.product_id
            AND p.vendor_id = auth.uid()
        )
    );

-- Policy 4: Admins can view all orders
CREATE POLICY "Admins can view all orders" ON orders
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.email IN (
                COALESCE(current_setting('app.settings.admin_emails', true), '')
            )
        )
    );

-- Policy 5: Admins can manage all orders
CREATE POLICY "Admins can manage all orders" ON orders
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.email IN (
                COALESCE(current_setting('app.settings.admin_emails', true), '')
            )
        )
    );

-- ============================================================================
-- 4. AUDIT_LOGS TABLE
-- ============================================================================

-- Enable RLS on audit_logs table
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Service can insert audit logs" ON audit_logs;

-- Policy 1: Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs" ON audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.email IN (
                COALESCE(current_setting('app.settings.admin_emails', true), '')
            )
        )
    );

-- Policy 2: Users can view their own audit logs
CREATE POLICY "Users can view own audit logs" ON audit_logs
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy 3: Anyone authenticated can insert audit logs (for logging)
CREATE POLICY "Service can insert audit logs" ON audit_logs
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'products', 'orders', 'audit_logs');

-- Verify policies exist
SELECT tablename, policyname, cmd, roles, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('users', 'products', 'orders', 'audit_logs')
ORDER BY tablename, policyname;
