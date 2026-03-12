-- ROIaaS Phase 2.1: License Tiers & Quota Management
-- Add tier classification, quota tracking, and suspension controls

-- 1. Add tier column with validation
ALTER TABLE raas_licenses
ADD COLUMN tier TEXT CHECK (tier IN ('basic', 'premium', 'enterprise', 'master')) DEFAULT 'basic';

-- 2. Add quota management columns
ALTER TABLE raas_licenses
ADD COLUMN quota_api_calls INTEGER DEFAULT 10000,
ADD COLUMN quota_tokens INTEGER DEFAULT 100000,
ADD COLUMN used_api_calls INTEGER DEFAULT 0,
ADD COLUMN used_tokens INTEGER DEFAULT 0;

-- 3. Add suspension tracking columns
ALTER TABLE raas_licenses
ADD COLUMN is_suspended BOOLEAN DEFAULT FALSE,
ADD COLUMN suspended_at TIMESTAMPTZ,
ADD COLUMN suspended_reason TEXT,
ADD COLUMN suspended_by TEXT REFERENCES auth.users(id);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_raas_licenses_tier ON raas_licenses(tier);
CREATE INDEX IF NOT EXISTS idx_raas_licenses_suspended ON raas_licenses(is_suspended);

-- 5. Update audit trigger to track tier/quota changes
CREATE OR REPLACE FUNCTION audit_license_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO raas_license_audit_logs (license_id, action, new_status, metadata)
    VALUES (NEW.id, 'created', NEW.status, jsonb_build_object(
      'tier', NEW.tier,
      'quota_api_calls', NEW.quota_api_calls,
      'quota_tokens', NEW.quota_tokens
    ));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Status change audit
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

    -- Tier change audit
    IF OLD.tier IS DISTINCT FROM NEW.tier THEN
      INSERT INTO raas_license_audit_logs (license_id, action, old_status, new_status, metadata)
      VALUES (NEW.id, 'updated', OLD.tier, NEW.tier,
        jsonb_build_object('tier_change', jsonb_build_object('from', OLD.tier, 'to', NEW.tier)));
    END IF;

    -- Suspension audit
    IF OLD.is_suspended IS DISTINCT FROM NEW.is_suspended THEN
      INSERT INTO raas_license_audit_logs (license_id, action, metadata)
      VALUES (NEW.id, 'updated',
        jsonb_build_object('suspension', jsonb_build_object(
          'suspended', NEW.is_suspended,
          'reason', NEW.suspended_reason,
          'suspended_by', NEW.suspended_by
        )));
    END IF;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO raas_license_audit_logs (license_id, action, old_status)
    VALUES (OLD.id, 'revoked', OLD.status);
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON COLUMN raas_licenses.tier IS 'License tier: basic, premium, enterprise, master';
COMMENT ON COLUMN raas_licenses.quota_api_calls IS 'Monthly API call quota limit';
COMMENT ON COLUMN raas_licenses.quota_tokens IS 'Monthly token usage quota limit';
COMMENT ON COLUMN raas_licenses.used_api_calls IS 'API calls used in current period';
COMMENT ON COLUMN raas_licenses.used_tokens IS 'Tokens used in current period';
COMMENT ON COLUMN raas_licenses.is_suspended IS 'Whether license is temporarily suspended';
COMMENT ON COLUMN raas_licenses.suspended_reason IS 'Reason for suspension';
COMMENT ON COLUMN raas_licenses.suspended_by IS 'User ID who suspended the license';
