-- ============================================================================
-- WellNexus RaaS — Multi-Org Subscription Support
-- Migration: 20260301_multi_org_subscriptions.sql
-- Purpose: Add organization layer for multi-tenant subscription billing
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ORGANIZATIONS — Tổ chức / đại lý sở hữu subscription
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  logo_url    TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- Trigger cập nhật updated_at
CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_subscription_updated_at();

-- ----------------------------------------------------------------------------
-- 2. ORG MEMBERS — Thành viên trong tổ chức
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS org_members (
  id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role     TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON org_members(org_id);

-- ----------------------------------------------------------------------------
-- 3. ADD org_id TO EXISTING TABLES
-- ----------------------------------------------------------------------------

-- user_subscriptions: thêm org_id (nullable for backward compat)
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_org ON user_subscriptions(org_id);

-- subscription_payment_intents: thêm org_id
ALTER TABLE subscription_payment_intents
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sub_intents_org ON subscription_payment_intents(org_id);

-- ----------------------------------------------------------------------------
-- 4. RLS POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

-- Organizations: đọc nếu là member, ghi nếu là owner/admin
CREATE POLICY "org_read_member"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = organizations.id
        AND org_members.user_id = auth.uid()
    )
    OR owner_id = auth.uid()
  );

CREATE POLICY "org_write_owner"
  ON organizations FOR ALL
  USING (owner_id = auth.uid());

-- Org members: đọc nếu cùng org, ghi nếu owner/admin
CREATE POLICY "org_members_read"
  ON org_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = org_members.org_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "org_members_write"
  ON org_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = org_members.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

-- ----------------------------------------------------------------------------
-- 5. HELPER: Lấy org subscription hiện tại
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_org_active_plan(p_org_id UUID)
RETURNS TABLE (
  plan_slug     TEXT,
  plan_name     TEXT,
  status        TEXT,
  period_end    TIMESTAMPTZ,
  max_members   INTEGER
) AS $$
  SELECT
    sp.slug,
    sp.name,
    us.status,
    us.current_period_end,
    sp.max_members
  FROM user_subscriptions us
  JOIN subscription_plans sp ON sp.id = us.plan_id
  WHERE us.org_id = p_org_id
    AND us.status IN ('active', 'trialing')
    AND us.current_period_end > NOW()
  ORDER BY us.created_at DESC
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 6. HELPER: Auto-tạo org khi user đăng ký lần đầu (optional trigger)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_default_org_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Chỉ tạo nếu user chưa có org nào
  IF NOT EXISTS (SELECT 1 FROM org_members WHERE user_id = NEW.id) THEN
    INSERT INTO organizations (name, slug, owner_id)
    VALUES (
      COALESCE(NEW.full_name, 'My Organization'),
      'org-' || REPLACE(NEW.id::text, '-', '') || '-' || EXTRACT(EPOCH FROM NOW())::int,
      NEW.id
    );
    -- Thêm user vào org với role owner
    INSERT INTO org_members (org_id, user_id, role)
    VALUES (
      (SELECT id FROM organizations WHERE owner_id = NEW.id ORDER BY created_at DESC LIMIT 1),
      NEW.id,
      'owner'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
