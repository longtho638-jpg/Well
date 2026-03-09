# Phase 6 Deployment Checklist - Overage Billing & Quota Enforcement

**Date:** 2026-03-09
**Project:** WellNexus RaaS
**Work Context:** /Users/macbookprom1/mekong-cli/apps/well

---

## Pre-Deployment Verification ✅

### 1. Build Verification
- [x] `npm run build` passes (8.14s, 0 TypeScript errors)
- [x] All Phase 6 components compiled successfully

### 2. Code Quality
- [x] i18n keys synced (en/vi)
- [x] No console.log in production code
- [x] No `any` types introduced
- [x] No `@ts-ignore` directives

### 3. Test Coverage
- [x] Unit tests created for `quota-enforcer.test.ts`
- [x] Unit tests created for `overage-calculator.test.ts`
- [ ] Integration tests pending (E2E quota enforcement flow)

---

## Deployment Steps

### Step 1: Database Migrations

```bash
# Apply Phase 6 migrations
psql "$(npx supabase db url)" -f supabase/migrations/260309_phase6_billing_state.sql
psql "$(npx supabase db url)" -f supabase/migrations/260309_usage_events_v2.sql

# Verify tables
psql "$(npx supabase db url)" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%overage%';"
```

**Tables to verify:**
- [ ] `overage_transactions`
- [ ] `overage_rates`
- [ ] `tenant_quota_overrides`
- [ ] `tenant_grace_periods`
- [ ] `usage_records`
- [ ] `alert_events`

---

### Step 2: Edge Functions Deployment

```bash
# Deploy Polar webhook Edge Function
npx supabase functions deploy polar-webhook

# Verify deployment
npx supabase functions list
```

**Environment Variables to set:**
```bash
# In Supabase Dashboard → Edge Functions → polar-webhook
POLAR_OVERAGE_WEBHOOK_SECRET=whsec_[YOUR_SECRET]
AGENCYOS_WEBHOOK_URL=https://raas.agencyos.network/webhooks/polar-overage
POLAR_API_KEY=sk_live_[YOUR_KEY]
```

---

### Step 3: Polar.sh Configuration

**1. Create Overage Product (if not exists):**
- Login to Polar Dashboard: https://polar.sh/dashboard
- Navigate to Products → Create New
- Product Type: Usage-based Overage
- Metrics: api_calls, ai_calls, tokens, compute_minutes, storage_gb, emails, model_inferences, agent_executions

**2. Configure Webhooks:**
```
Webhook URL: https://[PROJECT-ID].supabase.co/functions/v1/polar-webhook
Events to subscribe:
  - usage.billing_sync
  - usage.overage_detected
  - subscription.active
  - subscription.inactive
Secret: whsec_[GENERATE_SECRET]
```

**3. Map Customer IDs:**
- Ensure all `user_subscriptions` records have `metadata.polar_customer_id`
- Run migration to backfill missing Polar customer IDs

---

### Step 4: Frontend Deployment

```bash
# Build and deploy via Vercel
git push origin main

# Wait for CI/CD (GitHub Actions → Vercel)
# Verify deployment: https://wellnexus-raas.vercel.app
```

**Routes to verify:**
- [ ] `/dashboard/quota` - QuotaTracker page
- [ ] `/dashboard/subscription` - Upgrade prompts
- [ ] `/dashboard/analytics` - Usage analytics

---

### Step 5: RaaS Gateway Integration

**Update raas-gate.ts to use new quota middleware:**

```typescript
// In raas-gate.ts route guard
import { checkLicenseAndQuota, quotaExceededResponse } from '@/lib/raas-gate-quota'

export async function GET(req: Request) {
  const apiKey = req.headers.get('X-API-Key')
  const result = await checkLicenseAndQuota(supabase, { apiKey })

  if (!result.allowed) {
    return quotaExceededResponse(result)
  }

  // Continue with request...
}
```

---

## Post-Deployment Verification

### 1. Smoke Tests

```bash
# Test quota endpoint
curl -H "X-API-Key: [TEST_KEY]" https://raas.agencyos.network/api/quota

# Test overage calculation
curl -X POST https://raas.agencyos.network/api/overage/calculate \
  -H "Content-Type: application/json" \
  -d '{"metricType":"api_calls","currentUsage":15000,"includedQuota":10000,"tier":"pro"}'
```

**Expected responses:**
- [ ] HTTP 200 for quota check under limit
- [ ] HTTP 403 with `Retry-After` header for over limit
- [ ] Correct overage cost calculation

---

### 2. Dashboard Verification

**Open browser to `/dashboard/quota`:**
- [ ] QuotaProgressBar renders with correct colors
  - Green: < 50%
  - Yellow: 50-79%
  - Orange: 80-89%
  - Red: 90%+
- [ ] OverageCostBreakdown shows transaction history
- [ ] Sync status indicators (pending/synced/failed)
- [ ] Upgrade prompts visible when near limit

---

### 3. Polar Webhook Verification

**In Polar Dashboard → Webhooks → Events:**
- [ ] Webhook delivery logs show successful 200 responses
- [ ] `usage.billing_sync` events delivered
- [ ] `usage.overage_detected` events delivered

**In Supabase Logs:**
```sql
-- Check webhook events
SELECT type, delivered_at, status
FROM polar_webhook_events
ORDER BY created_at DESC
LIMIT 10;

-- Check overage transactions
SELECT metric_type, COUNT(*) as transactions, SUM(total_cost) as revenue
FROM overage_transactions
WHERE billing_period = '2026-04'
GROUP BY metric_type;
```

---

## Monitoring Setup

### Grafana/Supabase Queries

```sql
-- Daily overage revenue
SELECT DATE_TRUNC('day', created_at) as date, SUM(total_cost) as revenue
FROM overage_transactions
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY 1
ORDER BY 1;

-- Quota violations by tier
SELECT lt.plan_slug, COUNT(*) as violations
FROM quota_enforcement_logs qel
JOIN licenses l ON qel.license_id = l.id
JOIN license_tiers lt ON l.tier_id = lt.id
WHERE qel.enforcement_action = 'hard_block'
  AND qel.created_at > NOW() - INTERVAL '7 days'
GROUP BY 1;

-- Overage sync status
SELECT stripe_sync_status, COUNT(*) as count
FROM overage_transactions
GROUP BY 1;
```

---

### Alert Thresholds

| Alert | Condition | Action |
|-------|-----------|--------|
| Overage Sync Failed | `stripe_sync_status = 'failed'` > 10 | Notify billing team |
| Quota Violation Spike | > 100 blocks/hour | Review tier limits |
| Webhook Delivery Failing | > 5 failed deliveries | Check Polar credentials |
| High Overage Rate | Overage/Base > 50% | Review pricing |

---

## Rollback Plan

**If issues detected:**

1. **Disable Quota Enforcement:**
```typescript
// In raas-gate-quota.ts
enforcementMode: 'soft' // Change from 'hard' to 'soft'
```

2. **Revert Edge Function:**
```bash
npx supabase functions rollback polar-webhook --version-previous
```

3. **Disable Polar Webhooks:**
- Polar Dashboard → Webhooks → Disable

---

## Success Criteria

| Criteria | Target | Status |
|----------|--------|--------|
| Build passes | ✅ exit code 0 | ✅ Complete |
| TypeScript errors | ✅ 0 errors | ✅ Complete |
| i18n keys synced | ✅ All keys present | ✅ Complete |
| Unit tests | ⚠️ Some failing (logic, not syntax) | ⚠️ In Progress |
| E2E tests | 🔲 Pending | 🔲 Pending |
| Database migrations | 🔲 Pending | 🔲 Pending |
| Edge Functions deployed | 🔲 Pending | 🔲 Pending |
| Polar webhooks configured | 🔲 Pending | 🔲 Pending |
| Production smoke test | 🔲 Pending | 🔲 Pending |

---

## Unresolved Questions

1. **Polar.sh Overage API:** Cần confirm Polar.sh có endpoint chính thức cho overage billing không?
2. **Overage Pricing:** Ai set overage rates? (Admin dashboard hay hardcoded?)
3. **Grace Period Duration:** Nên set grace period bao lâu? (5 phút, 1 giờ, 24 giờ?)
4. **Multi-tenant Quota:** Quota enforce per-org hay per-tenant?
5. **Admin Dashboard:** Có cần admin UI để quản lý overage rates không?

---

**Deployment Owner:** [TBD]
**Deployment Date:** [TBD]
**Approved By:** [TBD]
