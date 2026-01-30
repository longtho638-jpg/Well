-- Seed Data for Well Founder Admin Panel
-- Description: Inserts test founder, distributors, orders, and transactions with realistic Vietnamese data.

-- CLEANUP (Optional - be careful in production)
-- TRUNCATE TABLE profiles, distributors, orders, transactions, products, customers CASCADE;

-- VARIABLES (Simulated using direct UUIDs for seed)
-- Founder ID: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
-- Distributor 1: b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22 (Nguyen Van A)
-- Distributor 2: c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33 (Tran Thi B)
-- Distributor 3: d3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44 (Le Van C)
-- Distributor 4: e4eebc99-9c0b-4ef8-bb6d-6bb9bd380e55 (Pham Thi D)
-- Distributor 5: f5eebc99-9c0b-4ef8-bb6d-6bb9bd380f66 (Hoang Van E)

-- 1. Insert Users into auth.users (Requires specific permissions or local dev env)
-- Note: In a real Supabase seed, we might need to use the Supabase CLI helper or just insert into public tables if auth is mocked.
-- We will assume auth.users entries exist or we are strictly seeding public tables for testing where FKs are disabled or managed.
-- STRICTLY: We cannot insert into auth.users easily in SQL editor without superuser.
-- FOR SEED FILE: We often assume the users are created via Auth API, but for local dev `supabase db reset` runs this.
-- We will attempt to insert into auth.users if possible, otherwise we rely on the user creating them.
-- To make this safe and "just work", we'll insert into public tables using fixed UUIDs and user might need to create Auth users with matching IDs if they want to login.

-- NOTE: The following insert into auth.users is for local development convenience.
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'founder@wellnexus.vn', 'crypt($password)', NOW(), 'authenticated'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'nguyenvana@example.com', 'crypt($password)', NOW(), 'authenticated'),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'tranthib@example.com', 'crypt($password)', NOW(), 'authenticated'),
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'levanc@example.com', 'crypt($password)', NOW(), 'authenticated'),
  ('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380e55', 'phamthid@example.com', 'crypt($password)', NOW(), 'authenticated'),
  ('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380f66', 'hoangvane@example.com', 'crypt($password)', NOW(), 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Profiles
INSERT INTO users (id, name, email, rank, role, total_sales, team_volume, shop_balance, joined_at)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Nguyen Vu Founder', 'founder@wellnexus.vn', 1, 'founder', 1000000000, 5000000000, 100000000, NOW() - INTERVAL '1 year'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'Nguyen Van A', 'nguyenvana@example.com', 3, 'user', 150000000, 300000000, 5000000, NOW() - INTERVAL '6 months'),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Tran Thi B', 'tranthib@example.com', 4, 'user', 80000000, 100000000, 2500000, NOW() - INTERVAL '5 months'),
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'Le Van C', 'levanc@example.com', 5, 'user', 50000000, 50000000, 1000000, NOW() - INTERVAL '4 months'),
  ('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380e55', 'Pham Thi D', 'phamthid@example.com', 6, 'user', 20000000, 20000000, 500000, NOW() - INTERVAL '3 months'),
  ('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380f66', 'Hoang Van E', 'hoangvane@example.com', 8, 'user', 5000000, 5000000, 100000, NOW() - INTERVAL '1 month')
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  rank = EXCLUDED.rank;

-- 3. Insert Distributors Info
INSERT INTO distributors (id, distributor_level, region, contract_signed_at)
VALUES
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'Diamond', 'Ho Chi Minh', NOW() - INTERVAL '6 months'),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Gold', 'Ha Noi', NOW() - INTERVAL '5 months'),
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'Silver', 'Da Nang', NOW() - INTERVAL '4 months'),
  ('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380e55', 'Bronze', 'Can Tho', NOW() - INTERVAL '3 months'),
  ('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380f66', 'Collaborator', 'Hai Phong', NOW() - INTERVAL '1 month')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Products
INSERT INTO products (id, name, description, price, bonus_revenue, stock, image_url, category)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Combo Khoe Dep Toan Dien', 'Bo san pham ho tro suc khoe va sac dep', 2500000, 2000000, 100, 'https://example.com/combo1.jpg', 'Health'),
  ('22222222-2222-2222-2222-222222222222', 'My Pham Cao Cap Aura', 'Bo my pham duong da cao cap', 1500000, 1200000, 50, 'https://example.com/cosmetic1.jpg', 'Beauty'),
  ('33333333-3333-3333-3333-333333333333', 'Thuc Pham Chuc Nang Well', 'Tang cuong he mien dich', 800000, 600000, 200, 'https://example.com/supp1.jpg', 'Nutrition')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Orders & Transactions
-- Order 1: From Distributor A
INSERT INTO transactions (id, user_id, amount, type, status, created_at)
VALUES
  ('aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 2500000, 'sale', 'completed', NOW() - INTERVAL '2 days');

INSERT INTO orders (id, user_id, total_amount, status, transaction_id, items, shipping_address, created_at)
VALUES
  ('bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 2500000, 'completed', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '[{"product_id": "11111111-1111-1111-1111-111111111111", "quantity": 1, "price": 2500000}]'::jsonb,
  '{"address": "123 Le Loi, Quan 1, TP.HCM", "phone": "0901234567"}'::jsonb,
  NOW() - INTERVAL '2 days');

-- Order 2: From Distributor B
INSERT INTO transactions (id, user_id, amount, type, status, created_at)
VALUES
  ('aaaa2222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 1500000, 'sale', 'pending', NOW() - INTERVAL '1 day');

INSERT INTO orders (id, user_id, total_amount, status, transaction_id, items, shipping_address, created_at)
VALUES
  ('bbbb2222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 1500000, 'pending', 'aaaa2222-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '[{"product_id": "22222222-2222-2222-2222-222222222222", "quantity": 1, "price": 1500000}]'::jsonb,
  '{"address": "456 Tran Hung Dao, Hoan Kiem, Ha Noi", "phone": "0909876543"}'::jsonb,
  NOW() - INTERVAL '1 day');

-- 6. Insert Customers
INSERT INTO customers (id, name, email, phone, address, created_by)
VALUES
  (gen_random_uuid(), 'Khach Hang 1', 'khach1@gmail.com', '0912345678', 'Quan 1, HCM', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22'),
  (gen_random_uuid(), 'Khach Hang 2', 'khach2@gmail.com', '0912345679', 'Quan 3, HCM', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22'),
  (gen_random_uuid(), 'Khach Hang 3', 'khach3@gmail.com', '0912345680', 'Ba Dinh, HN', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33');
