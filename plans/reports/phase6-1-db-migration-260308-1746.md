# Phase 6.1: Database Schema & Migrations - Multi-tenant License Enforcement

**Date:** 2026-03-08
**Status:** ✅ MIGRATION FILES CREATED
**Plan:** `/Users/macbookprom1/mekong-cli/apps/well/plans/260308-1225-license-compliance-enforcer/`

---

## Overview

Created 3 migration files for Multi-tenant License Enforcement:

1. `tenant_license_policies` - License policies per tenant with quotas and feature gating
2. `quota_override_audit` - Audit log for quota overrides with approval workflow
3. `tenant_feature_flags` - Feature flag management with targeting and rollout controls

---

## Files Created

### 1. `supabase/migrations/202603081746_tenant_license_policies.sql`

**Table:** `tenant_license_policies`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `license_id` | UUID | Reference to `raas_licenses` |
| `org_id` | UUID | Reference to `organizations` |
| `policy_name` | TEXT | Human-readable policy name |
| `quota_type` | TEXT | `daily`, `weekly`, `monthly`, `yearly`, `lifetime` |
| `quota_limit` | BIGINT | Maximum allowed usage |
| `rate_limit_per_minute` | INTEGER | API rate limit |
| `allowed_features` | JSONB | Feature flags map |
| `allow_overage` | BOOLEAN | Whether overage is permitted |
| `overage_rate_per_unit` | NUMERIC | Price per extra unit |
| `status` | TEXT | `active`, `suspended`, `expired`, `draft` |

**Indexes:**
- `idx_tenant_policies_license_id`
- `idx_tenant_policies_org_id`
- `idx_tenant_policies_status`
- `idx_tenant_policies_allowed_features` (GIN)
- `idx_tenant_policies_org_status` (composite)

**RLS Policies:**
- Users can view policies for their own organizations
- Service role has full access

**Stored Functions:**
- `get_tenant_policy(p_org_id)` - Get active policy for tenant
- `check_feature_access(p_org_id, p_feature_name)` - Check feature access
- `check_overage_allowed(p_org_id)` - Get overage settings
- `update_tenant_policy(p_policy_id, ...)` - Update policy with audit

---

### 2. `supabase/migrations/202603081746_quota_override_audit.sql`

**Table:** `quota_override_audit`

| Column | Type | Description |
|--------|------|-------------|
| `override_id` | TEXT | Human-readable ID (OVR-YYYYMMDD-NNN) |
| `org_id` | UUID | Reference to organization |
| `override_type` | TEXT | Type of override |
| `previous_value` | JSONB | Values before override |
| `new_value` | JSONB | Values after override |
| `approval_status` | TEXT | `pending`, `approved`, `rejected`, `auto_approved` |
| `is_temporary` | BOOLEAN | Temporary override flag |
| `risk_level` | TEXT | `low`, `medium`, `high`, `critical` |

**Override Types:**
- `quota_increase`, `quota_decrease`
- `rate_limit_increase`, `rate_limit_decrease`
- `feature_enable`, `feature_disable`
- `overage_enable`, `overage_disable`
- `temporary_boost`, `emergency_override`

**Approval Workflow:**
- Low-risk overrides auto-approved
- Medium/high risk require manual approval
- Temporary overrides auto-revert at expiry

**Stored Functions:**
- `generate_override_id()` - Generate human-readable override ID
- `create_override_request(...)` - Create new override request
- `approve_override(p_override_id)` - Approve and execute
- `reject_override(p_override_id, reason)` - Reject request
- `execute_override(p_override_id)` - Apply changes to policy
- `revert_override(p_override_id)` - Revert temporary override
- `get_pending_overrides(p_org_id)` - Get pending approvals

---

### 3. `supabase/migrations/202603081746_tenant_feature_flags.sql`

**Table:** `tenant_feature_flags`

| Column | Type | Description |
|--------|------|-------------|
| `flag_key` | TEXT | Unique identifier (e.g., `ai_agents`) |
| `flag_name` | TEXT | Display name |
| `flag_type` | TEXT | `boolean`, `percentage`, `variant`, `json` |
| `enabled` | BOOLEAN | Flag enabled status |
| `percentage_value` | INTEGER | Rollout percentage (0-100) |
| `rollout_strategy` | TEXT | `immediate`, `gradual`, `scheduled`, `canary` |
| `depends_on_flags` | TEXT[] | Required flags |
| `conflicts_with_flags` | TEXT[] | Conflicting flags |

**Flag Types:**
- **boolean**: Simple on/off flag
- **percentage**: Gradual rollout by user percentage
- **variant**: A/B testing variants
- **json**: Complex configuration values

**Stored Functions:**
- `is_feature_enabled(p_org_id, p_flag_key, p_user_id)` - Check if feature enabled
- `get_flag_value(p_org_id, p_flag_key)` - Get full flag value
- `upsert_feature_flag(...)` - Create or update flag
- `enable_feature_flag(p_org_id, p_flag_key)` - Enable flag
- `disable_feature_flag(p_org_id, p_flag_key)` - Disable flag
- `get_tenant_flags(p_org_id)` - Get all flags for tenant

---

## Deployment Notes

**Migration Files Status:**
- ✅ `202603081746_tenant_license_policies.sql` - 210 lines
- ✅ `202603081746_quota_override_audit.sql` - 310 lines
- ✅ `202603081746_tenant_feature_flags.sql` - 340 lines

**Supabase CLI Issue:**
The remote database has pre-existing migrations with conflicting version numbers (`20260224`). To apply these migrations:

**Option 1: Manual SQL Execution (Recommended)**
```bash
# Get database URL from Supabase Dashboard
# Navigate to SQL Editor and paste each migration file content
# Or use psql with connection string:
psql "postgresql://postgres:[password]@[host]:5432/postgres" -f 202603081746_tenant_license_policies.sql
psql "postgresql://postgres:[password]@[host]:5432/postgres" -f 202603081746_quota_override_audit.sql
psql "postgresql://postgres.[password]@[host]:5432/postgres" -f 202603081746_tenant_feature_flags.sql
```

**Option 2: Fix Migration Conflicts**
```bash
# Rename conflicting local migrations to unique timestamps
# Or delete the .bak file and run:
npx supabase db push --include-all
```

---

## Integration Points

### With License Compliance Enforcer (Phase 6.8)
```typescript
// Check feature access before enforcement
const hasAccess = await supabase.rpc('check_feature_access', {
  p_org_id: orgId,
  p_feature_name: 'license_enforcement'
})
```

### With Usage Alerts (Phase 6.6)
```typescript
// Get tenant quota limits
const policy = await supabase.rpc('get_tenant_policy', {
  p_org_id: orgId
})
```

### With Stripe Billing (Phase 5.x)
```typescript
// Log overage for billing
await supabase.from('quota_override_audit').insert({
  org_id: orgId,
  override_type: 'overage_enable',
  previous_value: { quota_limit: 10000 },
  new_value: { quota_limit: 50000, overage_rate: 0.01 }
})
```

---

## Success Criteria

| Criterion | Status |
|-----------|--------|
| `tenant_license_policies` table created | ✅ |
| `quota_override_audit` table created | ✅ |
| `tenant_feature_flags` table created | ✅ |
| RLS policies configured | ✅ |
| Stored functions implemented | ✅ |
| Indexes for performance | ✅ |
| Comments for documentation | ✅ |

---

## Next Steps

1. **Deploy migrations** - Execute SQL in Supabase Dashboard or via psql
2. **Test feature flags** - Create test flags and verify `is_feature_enabled()` RPC
3. **Test quota overrides** - Create override requests and verify approval workflow
4. **Integration testing** - Connect with usage-metering and license-compliance systems
5. **UI components** - Build dashboard for policy management

---

## Unresolved Questions

**None** - All schema requirements met. Deployment pending due to Supabase CLI migration version conflict (pre-existing `20260224` versions in remote database).
