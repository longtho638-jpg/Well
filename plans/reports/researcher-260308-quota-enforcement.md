# Quota/Metering Infrastructure Research Report

**Date:** 2026-03-08
**Researcher:** AI Agent
**Project:** WellNexus (mekong-cli/apps/well)

---

## 1. Phase 4 Usage Metering Infrastructure

### 1.1 Database Schema

**Tables:**
| Table | Purpose | Status |
|-------|---------|--------|
| `usage_metrics` | Per-user/org usage tracking by period | 2026-03-04 |
| `usage_limits` | Quota limits per subscription plan | 2026-03-04 |
| `feature_flags` | Feature access control by plan | 2026-03-04 |
| `user_feature_access` | overrides feature access per user | 2026-03-04 |
| `usage_records` | Raw usage events with metadata | 2026-03-06 |
| `usage_events` | Idempotent usage events | 2026-03-06 |
| `daily_usage_rollup` | TimescaleDB materialized view | 2026-03-06 |

**Key Fields:**
- `metric_type`: `api_calls`, `tokens`, `compute_minutes`, `model_inferences`, `agent_executions`, `storage_gb`, `emails`
- `period_start/period_end`: Monthly billing periods
- `quantity`: usage count per event

### 1.2 TypeScript Services

| File | Purpose |
|------|---------|
| `src/lib/usage-metering.ts` | UsageMeter class - track API calls, tokens, compute units |
| `src/lib/quota-enforcer.ts` | QuotaEnforcer - hard/soft/hybrid enforcement modes |
| `src/lib/usage-alert-engine.ts` | AlertEngine - threshold alerts to AgencyOS webhook |
| `src/lib/overage-calculator.ts` | OverageCalculator - calculate overage costs |
| `src/lib/usage-metering-middleware.ts` | Express middleware for usage tracking |
| `src/hooks/use-usage-metering.tsx` | React hook for frontend usage status |
| `src/hooks/use-tenant-usage.ts` | Tenant usage tracking hook |

**Default Tier Limits (usage-metering.ts):**
```
free:     100 api_calls/day, 10 tokens/day
basic:    1,000 api_calls/day, 100 tokens/day
pro:      10,000 api_calls/day, 1,000 tokens/day
enterprise: 100,000 api_calls/day, 10,000 tokens/day
master:   unlimited (-1)
```

### 1.3 Helper Functions (SQL)
- `increment_usage()` - atomic usage counter
- `get_usage_status()` - current usage vs limits
- `user_has_feature()` - feature access check
- `get_user_features()` - list user's enabled features

---

## 2. Phase 3 Webhook Infrastructure

### 2.1 SMS Service (Twilio)

**Location:** `supabase/functions/send-sms/index.ts`

**Features:**
- Send SMS via Twilio API
- Idempotency via `idempotency_key`
- Rate limiting per org/user (DB-based)
- Support for templates (dunning, payment confirmation)
- Dual locale: Vietnamese/English

**Database Tables:**
| Table | Purpose |
|-------|---------|
| `sms_logs` | Audit log for all SMS sends |
| `sms_templates` | Localized message templates |
| `sms_rate_limits` | Hourly/daily sending limits |

**Key Functions:**
- `check_sms_rate_limit()` - verify rate limit
- `log_sms_send()` - log SMS attempt
- `update_sms_status()` - update delivery status
- `get_sms_template()` - fetch template with fallback

### 2.2 Dunning Management

**Location:** `supabase/migrations/260308-dunning-schema.sql`

**Tables:**
- `dunning_events` - track payment failures and stages
- `dunning_config` - per-org dunning configuration
- `failed_webhooks` - webhookretry queue

**Dunning Stages:**
```
initial (day 0) → reminder (day 2) → final (day 5) → cancel_notice (day 10)
```

**Auto-process Function:** `process_dunning_stages()` advances stages based on days_since_failure.

---

## 3. Phase 2 License Management

### 3.1 Subscription Plans

**Table:** `subscription_plans`
- Slugs: `free`, `basic`, `pro`, `agency`
- Billing cycles: monthly/yearly
- Stripe/Polar integration via `payment_id`

### 3.2 RaaS Licenses

**Table:** `raas_licenses`
- License key format: `RAAS-{timestamp}-{hash}`
- Status: `active`, `expired`, `revoked`
- Features: JSONB feature flags
- Metadata: Stripe/Polar customer ID storage

**Client Services:**
- `src/services/license-service.ts` - activate/validate/revoke licenses
- `src/lib/raas-gate.ts` - license validation middleware
- `src/lib/tenant-license-client.ts` - tenant license operations

---

## 4. RaaS Gateway Rate Limiting

### 4.1 Multi-tier Rate Limiting

**Files:**
| File | Purpose |
|------|---------|
| `src/lib/rate-limiter.ts` | In-memory rate limiter (AgencyOS commands, API) |
| `src/lib/rate-limiter-cloudflare.ts` | Cloudflare KV rate limiter (production) |
| `src/utils/security-rate-limiter-with-sliding-window.ts` | Sliding window rate limiter |
| `src/hooks/use-tenant-rate-limit.ts` | React hook for tenant rate limits |

**Rate Limiters:**
- `commandRateLimiter`: 10 commands/minute
- `apiRateLimiter`: 30 requests/minute

### 4.2 Cloudflare KV Rate Limiter

**Features:**
- Per-customer limits by tier (basic/premium/enterprise/master)
- Sliding window algorithm
- Second/minute/hour/day windows
- Burst handling with concurrent request limits

**Tier Limits (requests per period):**
| Tier | Sec | Min | Hour | Day |
|------|-----|-----|------|-----|
| basic | 1 | 30 | 500 | 5,000 |
| premium | 10 | 300 | 5,000 | 50,000 |
| enterprise | 50 | 2,000 | 50,000 | 500,000 |
| master | 200 | 10,000 | 200,000 | 2,000,000 |

### 4.3 PostgreSQL Rate Limiting

**Location:** `supabase/migrations/20260305100201_server_side_rate_limiting.sql`

**Table:** `rate_limits`
- Atomic operations via `check_rate_limit()`
- Cleanup function: `cleanup_rate_limits()`
- Admin view: `admin_rate_limits`

---

## 5. Phase 5 Analytics Dashboard

### 5.1 Database Views

**Location:** `supabase/migrations/202603071400_analytics_views.sql`

| View | Purpose |
|------|---------|
| `analytics_daily_usage` | Daily usage aggregation |
| `analytics_hourly_usage` | Hourly trends (7 days) |
| `analytics_weekly_usage` | Weekly aggregates (12 weeks) |
| `analytics_monthly_usage` | Monthly aggregates (12 months) |
| `analytics_top_customers` | Top customers by usage |
| `analytics_quota_utilization` | Quota tracking per day |
| `analytics_model_usage` | AI model breakdown |
| `analytics_agent_usage` | Agent execution stats |

### 5.2 Analytics Functions

| Function | Purpose |
|----------|---------|
| `get_usage_trends()` | Custom date range + granularity |
| `get_top_customers()` | Top N customers by usage |
| `get_quota_utilization()` | Current quota status |
| `detect_usage_anomalies()` | 3-sigma anomaly detection |
| `get_billing_projection()` | Usage projection for period |
| `export_usage_data()` | Raw data export |

### 5.3 Frontend Components

| Component | Purpose |
|-----------|---------|
| `src/pages/UsageDashboard.tsx` | Main usage dashboard with tenant selector |
| `src/components/analytics/UsageGaugeGrid.tsx` | Quota utilization gauges |
| `src/components/analytics/UsageTrendsChart.tsx` | Usage trend chart |
| `src/components/analytics/TopConsumersTable.tsx` | Top consumers list |
| `src/components/analytics/RevenueByTierChart.tsx` | Revenue by tier |
| `src/pages/PolarAnalyticsDashboard.tsx` | Polar analytics page |
| `src/hooks/use-usage-analytics.ts` | Analytics data hook |

---

## 6. Phase 6 Multi-tenant Enhancements

### 6.1 Tenant License Policies

**Location:** `supabase/migrations/202603081746_tenant_license_policies.sql`

**Table:** `tenant_license_policies`
- Per-org license policies
- Quota limits per type (daily/weekly/monthly)
- Rate limits per minute/hour/day
- Feature allow/restrict lists (JSONB)
- Overage configuration (rate, hard limit)

**Functions:**
- `get_tenant_policy()` - Get active policy for org
- `check_feature_access()` - Check feature access
- `check_overage_allowed()` - Get overage settings

### 6.2 Grace Period Schema

**Location:** `supabase/migrations/2603081400_grace_period_schema.sql`

**Table:** `tenant_grace_periods`
- Grants temporary quota increases after license expiry
- Reduced `limited_quotas` during grace period
- Max 3 overrides per grace period
- Status: active/expired/terminated

### 6.3 Usage Alerts

**Location:** `supabase/migrations/202603081206_usage_alerts_schema.sql`

**Table:** `alert_webhook_events`
- Track webhook events for usage thresholds
- Thresholds: 80%, 90%, 100%
- Cooldown: 1 hour (idempotency)
- Auto-cleanup after 90 days

### 6.4 Tenant Feature Flags

**Location:** `supabase/migrations/202603081746_tenant_feature_flags.sql`

Similar to global feature_flags but per-tenant.

---

## 7. Phase 7 Compliance & Overages

### 7.1 License Compliance

**Location:** `supabase/migrations/202603081225_license_compliance_schema.sql`

**Table:** `license_compliance_logs`
- Audit license checks and enforcement
- Actions: none/warning/suspend/revoked
- Auto-suspend function via `suspend_organization()`

### 7.2 Overage Tracking

**Table:** `overage_transactions`
- Track overage units and costs
- Stripe sync status
- Idempotency key for reconciliation

### 7.3 Usage Reconciliation

**Location:** `supabase/migrations/2603081900_overage_billing.sql`

- Sync overage to Stripe usage records
- Reconciliation audit log

---

## 8. Infrastructure Summary

### Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (React)                           │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │UsageMeter   │  │QuotaEnforcer │  │UsageAlertEngine │   │
│  └─────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 API LAYER (Middleware)                      │
│  ┌──────────────────────┐  ┌──────────────────────────┐   │
│  │UsageMeteringMiddleware│  │CloudflareRateLimiter     │   │
│  └──────────────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              DATABASE (Supabase/PostgreSQL)                 │
│  ┌────────────┐ ┌──────────────┐ ┌────────────────────┐   │
│  │usage_records│ │rate_limits   │ │tenant_policies     │   │
│  │usage_events │ │usage_limits  │ │grace_periods       │   │
│  │sms_logs     │ │alert_events  │ │overage_transactions│   │
│  │analytics_*  │ │dunning_events│ │compliance_logs     │   │
│  └────────────┘ └──────────────┘ └────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                          │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  Twilio     │  │  Stripe      │  │ AgencyOS Webhook│   │
│  │  (SMS)      │  │  (Billing)   │  │  (Alerts)       │   │
│  └─────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Key Tables Reference

| Table | Primary Use |
|-------|-------------|
| `usage_records` | Core usage tracking |
| `usage_events` | Idempotent usage events |
| `usage_limits` | Plan-based quotas |
| `tenant_license_policies` | Per-tenant overrides |
| `tenant_grace_periods` | Grace period extensions |
| `sms_logs` | SMS audit trail |
| `dunning_events` | Payment recovery flow |
| `license_compliance_logs` | Enforcement audit |
| `overage_transactions` | Overage billing |
| `alert_webhook_events` | Threshold alerts |

### Missing / Incomplete Components

| Component | Status | Notes |
|-----------|--------|-------|
| Cloudflare KV integration | Partial | Schema exists, needs KV binding config |
| RaaS Gateway CF Worker | Missing | Not in codebase - may be external |
| Webhook handler (usage-alert-webhook) | Missing | Edge function not found |
| Stripe Edge Functions | Partial | stripe-usage-record referenced but not in repo |

---

## Unresolved Questions

1. **Cloudflare KV configuration**: Where is the CF KV namespace configured? Is it bound to Edge Functions?

2. **RaaS Gateway**: Is the Rate Limiting CF Worker deployed? The migration references it but the function source isn't in this repo.

3. **usage-alert-webhook edge function**: Migration references this but couldn't find the implementation.

4. **Stripe usage record sync**: How is `overage_transactions.stripe_subscription_item_id` populated? Where's the sync webhook?

5. **Tenant table relationship**: `tenant_grace_periods` references `tenants(id)` but `tenants` table schema not found in migrations.

6. **Rate limit middleware deployment**: Is `usage-metering-middleware.ts` actively used in API routes?

7. **TimescaleDB**: Is TimescaleDB extension enabled for `daily_usage_rollup` materialized views?

---

*End of Report*
