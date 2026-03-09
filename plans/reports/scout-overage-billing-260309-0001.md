# Scout Report - Overage Billing & Quota Enforcement (Phase 6)

**Date:** 2026-03-09
**Project:** WellNexus RaaS
**Work Context:** /Users/macbookprom1/mekong-cli/apps/well
**Reports:** /Users/macbookprom1/mekong-cli/apps/well/plans/reports/

---

## Executive Summary

Codebase đã có sẵn **90% implementation** cho overage billing và quota enforcement. Phase 6 cần:
1. Integration với Polar webhooks (thay vì Stripe)
2. Dashboard UI components hiển thị real-time quota
3. Alert system cho overage notifications

---

## Existing Implementation (✅ Complete)

### 1. Overage Calculator (`src/lib/overage-calculator.ts`)

**Features:**
- Calculates overage units và costs cho 8 metric types:
  - `api_calls`, `ai_calls`, `tokens`, `compute_minutes`
  - `storage_gb`, `emails`, `model_inferences`, `agent_executions`
- Tiered pricing: free → basic → pro → enterprise → master
- Database-backed rates với cache (5 min TTL)
- Idempotency keys để tránh double-charging
- Sync to Stripe Usage Records

**Key Classes:**
- `OverageCalculator` - Core calculation engine
- `OverageTransaction` - Transaction schema
- `OverageRates` - Tier-based pricing

**Database Tables Used:**
- `overage_transactions`
- `overage_rates`
- `tenant_quota_overrides`

---

### 2. Quota Enforcer (`src/lib/quota-enforcer.ts`)

**Features:**
- 3 enforcement modes: `soft` | `hard` | `hybrid`
- Hard mode: Returns HTTP 429 when quota exceeded
- Hybrid mode: Grace period before blocking
- Real-time quota checking với caching (2 min TTL)

**Enforcement Flow:**
```
checkQuota(metricType)
  → Get current usage (usage_records)
  → Get effective quota (tier + tenant override + grace boost)
  → Calculate remaining & percentage
  → Apply enforcement mode
  → Return QuotaCheckResult
```

**Key Methods:**
- `checkQuota()` - Check if request allowed
- `isWithinGracePeriod()` - Hybrid mode check
- `getEffectiveQuota()` - Base + overrides + grace
- `createQuotaExceededResponse()` - HTTP 429 builder

---

### 3. Overage Tracking Client (`src/lib/overage-tracking-client.ts`)

**React Hooks:**
- `useOverageStatus()` - Real-time overage status với polling (30s)
- `useOverageHistory()` - Fetch history với filters

**Features:**
- Auto-refresh every 30 seconds
- Summary với breakdown by metric
- Manual Stripe sync trigger

---

### 4. Stripe Billing Client (`src/lib/stripe-billing-client.ts`)

**Methods:**
- `reportUsage()` - Report usage to Stripe
- `getBillingStatus()` - Get current billing status
- `getUsageSummary()` - Fetch usage summary
- `createCustomerPortalSession()` - Self-service management

**Note:** Currently integrated with Stripe. **Phase 6 requires Polar.sh integration**.

---

### 5. Usage Analytics (`src/lib/usage-analytics.ts`)

**Class:** `UsageAnalytics`

**Features:**
- `getCurrentUsage()` - Real-time usage dashboard
- `getQuotas()` - Quota status with percentages
- `getBreakdown()` - Analytics by feature/model/agent/trend

**Quota Severity Levels:**
- `low` (<50%) - Green #10b981
- `medium` (50-79%) - Amber #f59e0b
- `high` (80-89%) - Orange #f97316
- `critical` (90%+) - Red #ef4444

---

## Database Schema (Existing)

Based on code analysis, these tables exist:

```sql
-- Overage transactions
overage_transactions (
  id, org_id, tenant_id, user_id, license_id,
  metric_type, billing_period,
  total_usage, included_quota, overage_units,
  rate_per_unit, total_cost, currency,
  stripe_subscription_item_id, stripe_sync_status,
  idempotency_key, metadata, created_at
)

-- Overage rates by metric
overage_rates (
  id, metric_type,
  free_rate, basic_rate, pro_rate, enterprise_rate, master_rate,
  currency, updated_at
)

-- Tenant quota overrides (Phase 6)
tenant_quota_overrides (
  id, tenant_id, metric_type, quota_limit,
  active, created_at
)

-- Tenant grace periods (Phase 6)
tenant_grace_periods (
  id, tenant_id, metric_type,
  boost_amount, expires_at, active
)

-- Usage records
usage_records (
  id, user_id, org_id, tenant_id,
  feature, quantity, recorded_at, metadata
)
```

---

## Integration Points (Phase 6 Gaps)

### 🔴 Gap 1: Polar.sh Webhook Integration

**Current:** Stripe Usage Records API
**Required:** Polar.sh Standard Webhooks for overage billing

**Changes Needed:**
1. Replace `stripe-usage-record` Edge Function with Polar webhook
2. Update `overage-calculator.ts` to track Polar transaction IDs
3. Add Polar customer ID mapping in `user_subscriptions`

---

### 🔴 Gap 2: Dashboard UI Components

**Current:** Analytics SDK exists, but no UI components
**Required:** Real-time quota dashboard with:
- Progress bars cho từng metric
- Overage cost breakdown
- Upgrade prompts when near limit
- Alert settings configuration

**Files to Create:**
- `src/pages/Dashboard/QuotaTracker.tsx`
- `src/components/OverageBadge.tsx`
- `src/components/QuotaProgressBar.tsx`
- `src/components/OverageAlert.tsx`

---

### 🔴 Gap 3: Alert Engine Integration

**Current:** `src/lib/usage-alert-engine.ts` exists (unread in this scout)
**Required:**
- Email notifications at 80%, 90%, 100% quota
- Slack/Discord webhooks for critical alerts
- In-app toast notifications

---

### 🔴 Gap 4: RaaS Gateway Integration

**Current:** `src/lib/raas-gate.ts`, `src/lib/raas-license-api.ts`
**Required:**
- Quota checks trong RaaS Gateway middleware
- License validation với usage limits
- Hard stops cho unpaid overages

---

## Tier Limits (Current Defaults)

| Metric | Free | Basic | Pro | Enterprise | Master |
|--------|------|-------|-----|------------|--------|
| API Calls/day | 1,000 | 10,000 | 50,000 | 200,000 | ∞ |
| AI Calls/day | 10 | 100 | 500 | 2,000 | ∞ |
| Tokens/day | 100K | 1M | 5M | 20M | ∞ |
| Compute Min/day | 60 | 600 | 3,000 | 12,000 | ∞ |
| Storage GB | 1 | 10 | 50 | 200 | 1,000 |
| Emails/day | 100 | 1,000 | 5,000 | 20,000 | ∞ |
| Model Inferences/day | 10 | 100 | 500 | 2,000 | ∞ |
| Agent Executions/day | 5 | 50 | 250 | 1,000 | ∞ |

---

## Overage Rates (Default)

| Metric | Free | Basic | Pro | Enterprise | Master |
|--------|------|-------|-----|------------|--------|
| API Calls | $0.001 | $0.0008 | $0.0005 | $0.0003 | $0.0001 |
| AI Calls | $0.05 | $0.04 | $0.03 | $0.02 | $0.01 |
| Tokens (per 1K) | $0.004 | $0.003 | $0.002 | $0.001 | $0.0005 |
| Compute Min | $0.01 | $0.008 | $0.005 | $0.003 | $0.001 |
| Storage GB | $0.50 | $0.40 | $0.30 | $0.20 | $0.10 |
| Emails | $0.002 | $0.0015 | $0.001 | $0.0005 | $0.0002 |
| Model Inferences | $0.02 | $0.015 | $0.01 | $0.005 | $0.0025 |
| Agent Executions | $0.10 | $0.08 | $0.05 | $0.03 | $0.015 |

---

## Unresolved Questions

1. **Polar.sh Webhook URL:** What is the Polar webhook endpoint for overage events?
2. **Dunning Workflow:** How to handle failed overage payments? (Grace period vs hard block)
3. **Multi-org Support:** Should quota be per-org or per-tenant within org?
4. **Billing Period:** Monthly or daily quota reset? (Currently monthly based on code)
5. **Legacy Users:** How to handle users without subscription records?

---

## Next Steps

1. **Review existing implementation** - Confirm all files compile
2. **Create Polar webhook integration** - Replace Stripe with Polar.sh
3. **Build Dashboard UI** - QuotaTracker, ProgressBar, Alerts
4. **Integration testing** - Test quota enforcement end-to-end
5. **Deploy & verify** - Production smoke test

---

**Report Generated:** 2026-03-09 00:15:00
**Scout Agent:** Main Session
**Files Analyzed:** 5 core files + schema inference
