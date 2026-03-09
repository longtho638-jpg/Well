# Research Report: Billing Infrastructure Current State

**Date:** 2026-03-09
**Project:** WellNexus RaaS - Phase 6 Overage Billing & Dunning

---

## Executive Summary

**Readiness Score: 85/100** - Foundation solid, needs integration work

| Component | Status | Completeness |
|-----------|--------|--------------|
| Dunning Service | ✅ Existing | 90% |
| Overage Calculator | ✅ Existing | 95% |
| Usage Metering | ✅ Existing | 90% |
| Usage Alert Engine | ✅ Existing | 85% |
| RaaS Gateway Client | ✅ Existing | 80% |
| Stripe Webhooks | ✅ Existing | 90% |
| Payment Retry Scheduler | ⚠️ Partial | 60% |
| Gateway Usage Sync | ⚠️ Partial | 50% |
| Notification System | ⚠️ Partial | 40% |
| Dashboard UI | ⚠️ Partial | 30% |

---

## Component Analysis

### 1. Dunning Service (`src/lib/dunning-service.ts`)

**Capabilities:**
- `handlePaymentFailed()` - logs dunning events via RPC
- `sendDunningEmail()` - invokes Edge Function
- `resolveDunning()` - marks dunning resolved
- `processDunningStages()` - cron job for stage advancement
- `getActiveDunningEvents()` - dashboard query
- `getDunningStatistics()` - analytics

**Gaps:**
- ❌ No payment retry scheduler integration
- ❌ No smart failure detection (transient vs permanent)
- ❌ No exponential backoff logic

### 2. Overage Calculator (`src/lib/overage-calculator.ts`)

**Capabilities:**
- `calculateOverage()` - calculates units + cost
- `trackOverage()` - persists to `overage_transactions`
- `syncToStripe()` - invokes `stripe-usage-record` Edge Function
- Idempotency keys prevent duplicates
- Tiered pricing (free/basic/pro/enterprise/master)
- Caching with 5-min TTL

**Gaps:**
- ✅ Complete - no critical gaps

### 3. Usage Metering (`src/lib/usage-metering.ts`)

**Capabilities:**
- `track()` - track usage per metric
- `getUsageStatus()` - current usage vs limits
- `trackModelInference()` - AI usage tracking
- `trackAgentExecution()` - agent usage tracking
- Tier limits: free/basic/premium/enterprise/master

**Gaps:**
- ❌ No Gateway sync hook (TODO comment exists)
- ❌ No real-time subscription for live updates

### 4. Usage Alert Engine (`src/lib/usage-alert-engine.ts`)

**Capabilities:**
- `checkAndEmitAlerts()` - threshold monitoring (80/90/100%)
- `emitAlert()` - invokes `usage-alert-webhook` Edge Function
- Cooldown: 1 hour between alerts
- Multi-metric: api_calls/tokens/compute_minutes/model_inferences/agent_executions

**Gaps:**
- ❌ No email notification (webhook only)
- ❌ No SMS notification
- ❌ No multi-channel orchestration

### 5. RaaS Gateway Client (`src/lib/raas-gateway-client.ts`)

**Capabilities:**
- `validateLicenseKey()` - KV-cached validation
- LRU cache with 5-min TTL
- Exponential backoff retry (max 3 attempts)
- Fail-open mode

**Gaps:**
- ❌ No usage sync methods (`reportUsageToGateway`, `fetchUsageFromGateway`)
- ❌ No JWT/mk_ API key auth client

### 6. Stripe Webhook Handler (`src/lib/stripe-billing-webhook-handler.ts`)

**Capabilities:**
- Handles: `invoice.payment_failed`, `invoice.payment_succeeded`, `subscription.updated/deleted`
- Idempotency checks
- Stripe Customer Portal URL generation
- Audit logging

**Gaps:**
- ❌ No retry scheduler trigger on `payment_failed`

### 7. Edge Functions Inventory

| Function | Status | Purpose |
|----------|--------|---------|
| `send-overage-alert` | ✅ Exists | Send overage notifications |
| `stripe-dunning` | ✅ Exists | Dunning email sequences |
| `process-payment-retry` | ⚠️ Partial | Retry scheduler (needs DB schema) |
| `sync-gateway-usage` | ⚠️ Partial | Gateway sync (needs auth) |
| `stripe-overage-invoice` | ✅ Exists | Create Stripe invoice |
| `stripe-usage-record` | ✅ Exists | Report usage to Stripe |
| `usage-alert-webhook` | ✅ Exists | AgencyOS webhook |
| `send-sms` | ✅ Exists | Twilio SMS |
| `send-email` | ✅ Exists | Resend email |

---

## Database Schema (Existing)

```sql
-- Dunning
dunning_events          -- payment failure tracking
dunning_statistics      -- aggregated metrics

-- Overage
overage_transactions    -- overage usage records
overage_rates           -- tiered pricing

-- Usage
usage_records           -- raw usage events
usage_limits            -- license-specific limits
usage_alert_events      -- alert history

-- Subscription
user_subscriptions      -- Stripe/Polar subscriptions
subscription_plans      -- plan definitions

-- Billing (needed for Phase 6)
payment_retry_queue     -- TODO: Create migration
payment_retry_dead_letter  -- TODO: Create migration
```

---

## RaaS Gateway API Reference

**Base URL:** `https://raas.agencyos.network`

### Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/health` | GET | None | Health check |
| `/v1/validate-license` | POST | Optional API key | License validation |
| `/v1/log-suspension` | POST | API key | Log suspension |
| `/v1/check-model-quota` | POST | API key | Quota check |
| `/api/v1/usage/report` | POST | JWT | Report usage |
| `/api/v1/usage/{orgId}` | GET | JWT | Fetch usage |

### JWT Payload Format

```typescript
{
  iss: "wellnexus.vn",
  aud: "raas.agencyos.network",
  sub: orgId,
  license_id: licenseId,
  mk_key: "mk_xxx",  // API key prefix
  exp: Date.now() + 3600,
}
```

---

## Critical Gaps for Phase 6

### Phase 1: Overage Notification System

| Gap | Files to Create | Files to Modify |
|-----|-----------------|-----------------|
| Notification service | `src/services/usage-notification-service.ts` | - |
| SMS/Email orchestration | - | `src/lib/usage-alert-engine.ts` |
| Real-time UI | `src/components/billing/RealtimeQuotaTracker.tsx` | `src/hooks/use-usage-alerts.ts` |
| Translations | - | `src/locales/vi/billing.ts`, `src/locales/en/billing.ts` |

### Phase 2: Payment Retry Automation

| Gap | Files to Create | Files to Modify |
|-----|-----------------|-----------------|
| Retry scheduler | `src/services/payment-retry-scheduler.ts` | `src/lib/dunning-service.ts` |
| Retry Edge Function | `supabase/functions/process-payment-retry/index.ts` | `supabase/functions/stripe-dunning/index.ts` |
| DB schema | `supabase/migrations/260309-payment-retry-queue.sql` | - |

### Phase 3: RaaS Gateway Usage Sync

| Gap | Files to Create | Files to Modify |
|-----|-----------------|-----------------|
| Sync service | `src/services/raas-gateway-usage-sync.ts` | `src/lib/raas-gateway-client.ts` |
| Auth client | `src/lib/gateway-auth-client.ts` | `src/lib/usage-metering.ts` |
| Sync Edge Function | `supabase/functions/sync-gateway-usage/index.ts` | - |

### Phase 4: Dashboard UI

| Gap | Files to Create | Files to Modify |
|-----|-----------------|-----------------|
| Overage status page | `src/pages/dashboard/billing/overage-status.tsx` | `src/pages/dashboard/billing/index.tsx` |
| Dunning status page | `src/pages/dashboard/billing/dunning-status.tsx` | - |
| Usage history chart | `src/components/billing/UsageHistoryChart.tsx` | - |
| Payment method manager | `src/components/billing/PaymentMethodManager.tsx` | - |

---

## Recommendations

1. **Start with Phase 1** (Notifications) - foundation for all other phases
2. **Reuse existing Edge Functions** - `send-email`, `send-sms` already exist
3. **Leverage Overage Calculator** - already has idempotency, Stripe sync
4. **Build on Usage Alert Engine** - already has threshold logic
5. **Gateway Auth First** - create JWT client before sync service

---

## Open Questions

1. **RaaS Gateway endpoint** - Is `/api/v1/usage/report` the exact path?
2. **JWT secret location** - Where is Gateway JWT secret stored?
3. **mk_ API key format** - What is expected format?
4. **SMS provider** - Twilio sandbox or production?
5. **Gateway sync frequency** - 5 minutes optimal?

---

**Next Step:** Proceed with Phase 1 implementation per `phase-01-overage-notifications.md`
