-- ROIaaS Phase 3: RaaS Licenses Table
-- Create license management table for Revenue as a Service implementation
-- Reference: plans/260305-2326-roiaas-phase2-license-api/phase2-summary.md

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- RaaS Licenses Table
CREATE TABLE IF NOT EXISTS raas_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('active', 'expired', 'revoked', 'pending')) DEFAULT 'pending',
  features JSONB NOT NULL DEFAULT '{
    "adminDashboard": false,
    "payosWebhook": false,
    "commissionDistribution": false,
    "policyEngine": false
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_raas_licenses_license_key ON raas_licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_raas_licenses_user_id ON raas_licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_raas_licenses_status ON raas_licenses(status);
CREATE INDEX IF NOT EXISTS idx_raas_licenses_expires_at ON raas_licenses(expires_at);

-- Row Level Security (RLS)
ALTER TABLE raas_licenses ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Users can view their own licenses
CREATE POLICY "Users can view own licenses"
  ON raas_licenses
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Only admins can insert licenses (via service role)
CREATE POLICY "Service role can manage licenses"
  ON raas_licenses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN (
        SELECT unnest(current_setting('app.admin_emails', true)::text[])
      )
    )
    OR current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
  );

-- Function to auto-expire licenses
CREATE OR REPLACE FUNCTION expire_old_licenses()
RETURNS void AS $$
BEGIN
  UPDATE raas_licenses
  SET status = 'expired'
  WHERE status = 'active'
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule daily expiration check (requires pg_cron extension)
-- SELECT cron.schedule('expire-licenses', '0 0 * * *', 'SELECT expire_old_licenses()');

-- Trigger to log license changes
CREATE TABLE IF NOT EXISTS raas_license_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID REFERENCES raas_licenses(id) ON DELETE CASCADE,
  action TEXT CHECK (action IN ('created', 'activated', 'expired', 'revoked', 'updated')) NOT NULL,
  old_status TEXT,
  new_status TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_license_audit_license_id ON raas_license_audit_logs(license_id);
CREATE INDEX IF NOT EXISTS idx_license_audit_created_at ON raas_license_audit_logs(created_at);

-- RLS for audit logs
ALTER TABLE raas_license_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage audit logs"
  ON raas_license_audit_logs
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
  );

-- Function to auto-audit license changes
CREATE OR REPLACE FUNCTION audit_license_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO raas_license_audit_logs (license_id, action, new_status, metadata)
    VALUES (NEW.id, 'created', NEW.status, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO raas_license_audit_logs (license_id, action, old_status, new_status)
      VALUES (NEW.id,
        CASE
          WHEN NEW.status = 'active' AND OLD.status = 'pending' THEN 'activated'
          WHEN NEW.status = 'expired' THEN 'expired'
          WHEN NEW.status = 'revoked' THEN 'revoked'
          ELSE 'updated'
        END,
        OLD.status,
        NEW.status
      );
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO raas_license_audit_logs (license_id, action, old_status)
    VALUES (OLD.id, 'revoked', OLD.status);
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Attach audit trigger
CREATE TRIGGER trg_audit_license_changes
  AFTER INSERT OR UPDATE OR DELETE ON raas_licenses
  FOR EACH ROW EXECUTE FUNCTION audit_license_changes();

-- Grant permissions
GRANT SELECT ON raas_licenses TO authenticated;
GRANT ALL ON raas_licenses TO service_role;
GRANT SELECT ON raas_license_audit_logs TO authenticated;
GRANT ALL ON raas_license_audit_logs TO service_role;

COMMENT ON TABLE raas_licenses IS 'RaaS (Revenue as a Service) license management table';
COMMENT ON TABLE raas_license_audit_logs IS 'Audit trail for RaaS license lifecycle events';
