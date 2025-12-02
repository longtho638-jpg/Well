-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  rank TEXT NOT NULL DEFAULT 'Member',
  avatar_url TEXT,
  shop_balance BIGINT DEFAULT 0,
  grow_balance BIGINT DEFAULT 0,
  staked_grow_balance BIGINT DEFAULT 0,
  total_sales BIGINT DEFAULT 0,
  team_volume BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price BIGINT NOT NULL,
  commission_rate FLOAT DEFAULT 0,
  image_url TEXT,
  sales_count INT DEFAULT 0,
  stock INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ DEFAULT NOW(),
  amount BIGINT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'completed',
  tax_deducted BIGINT DEFAULT 0,
  hash TEXT,
  currency TEXT DEFAULT 'SHOP',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members table
CREATE TABLE team_members (
  id TEXT PRIMARY KEY,
  leader_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  rank TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  personal_sales BIGINT DEFAULT 0,
  team_volume BIGINT DEFAULT 0,
  active_downlines INT DEFAULT 0,
  monthly_growth FLOAT DEFAULT 0,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  sponsor_id TEXT
);

-- Agent logs table
CREATE TABLE agent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name TEXT NOT NULL,
  action TEXT NOT NULL,
  input JSONB,
  output JSONB,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent KPIs table
CREATE TABLE agent_kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name TEXT NOT NULL,
  kpi_name TEXT NOT NULL,
  current_value FLOAT DEFAULT 0,
  target_value FLOAT,
  unit TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_name, kpi_name)
);

-- Indexes for performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_agent_logs_user_id ON agent_logs(user_id);
CREATE INDEX idx_agent_logs_agent_name ON agent_logs(agent_name);
CREATE INDEX idx_agent_kpis_agent_name ON agent_kpis(agent_name);
CREATE INDEX idx_team_members_leader_id ON team_members(leader_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for agent logs
CREATE POLICY "Users can view own agent logs"
  ON agent_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agent logs"
  ON agent_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for agent KPIs (read-only for authenticated users for dashboard)
ALTER TABLE agent_kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view agent KPIs"
  ON agent_kpis FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for team members
CREATE POLICY "Users can view own team"
  ON team_members FOR SELECT
  USING (auth.uid() = leader_id);

-- Products are public (everyone can read)
CREATE POLICY "Public products read"
  ON products FOR SELECT
  TO authenticated, anon
  USING (true);

-- Insert seed products
INSERT INTO products (id, name, description, price, commission_rate, image_url, sales_count, stock)
VALUES
  ('PROD-119', 'Combo ANIMA 119', 'Energy & Focus Supplement. Boosts daily performance naturally.', 1500000, 0.25, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80', 124, 50),
  ('PROD-120', 'WellNexus Starter Kit', 'Business Starter Kit. Everything you need to launch.', 3500000, 0.20, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80', 85, 20),
  ('PROD-121', 'Immune Boost Pack', 'Daily Vitamin C+ for family health.', 900000, 0.15, 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?auto=format&fit=crop&w=400&q=80', 56, 100)
ON CONFLICT (id) DO NOTHING;
