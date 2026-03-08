---
title: "Over-Quota Enforcement & Hard Usage Limits"
description: "Implement real-time quota enforcement with soft warnings, hard limits, and self-serve upgrade flows for RaaS Gateway"
status: pending
priority: P1
effort: 12h
branch: main
tags: [quota, enforcement, raas, billing, cloudflare]
created: 2026-03-08
---

# Over-Quota Enforcement & Hard Usage Limits - Implementation Plan

## Overview

Implement comprehensive quota enforcement for RaaS Gateway that detects when customers exceed licensed usage quotas, triggers soft-limit warnings via email/SMS, enforces hard limits by blocking API requests, and provides self-serve upgrade/downgrade flows.

## Strategic Context (ROIaaS)

| Stream | Implementation |
|--------|----------------|
| **Engineering ROI** | Hard limits protect infrastructure costs; overage billing captures incremental revenue |
| **Operational ROI** | Self-serve upgrade flows reduce support burden; dashboard transparency builds trust |

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT (React)                               │
│  ┌──────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │UsageDashboard│  │LicenseManager│  │UpgradeDowngradeFlow │   │
│  └──────────────┘  └─────────────┘  └─────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              RaaS GATEWAY (Cloudflare Worker)                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │QuotaMiddleware  │  │RateLimiter      │  │403+KV Logger    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  DATABASE (Supabase)                            │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────────────┐ │
│  │usage_records │ │quota_enforcement_logs│  │overage_transactions│ │
│  │usage_limits  │ │alert_events  │  │tenant_license_policies │ │
│  └──────────────┘ └──────────────┘ └─────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EDGE FUNCTIONS                                │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────────────┐ │
│  │check-quota   │ │usage-alert   │ │license-compliance       │ │
│  │              │ │send-sms      │ │                         │ │
│  └──────────────┘ └──────────────┘ └─────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │Twilio (SMS)  │  │Stripe/Polar  │  │AgencyOS Webhook      │  │
│  │Resend(Email) │  │(Billing)     │  │(Alerts)              │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

## Key Insights from Research

1. **Existing Infrastructure Ready**: `QuotaEnforcer` class (src/lib/quota-enforcer.ts) supports soft/hard/hybrid modes
2. **SMS/Email Ready**: `send-sms` edge function with templates; Resend integration for emails
3. **Rate Limiting Ready**: `CloudflareRateLimiter` with tier-based limits
4. **Webhook Ready**: `usage-alert-webhook` sends JWT-signed events to AgencyOS at 80%/90%/100%
5. **Gap**: RaaS Gateway middleware not integrated with quota enforcement
6. **Gap**: Dashboard bypass for billing pages when quota exceeded
7. **Gap**: Self-serve upgrade/downgrade UI flow

---

## Phase 1: Cloudflare Worker Setup for RaaS Gateway

**Status:** pending | **Effort:** 1.5h

### Overview

Create Cloudflare Worker that serves as RaaS Gateway with quota enforcement middleware.

### Requirements

- Worker deployment via `wrangler.toml` config
- KV namespace bindings for rate limiting + audit logs
- Environment variables for Supabase, Stripe, Polar
- Middleware architecture compatible with existing rate limiter

### Implementation Steps

1. **Create Worker Entry Point**
   - File: `workers/raas-gateway/src/index.ts`
   - Routes: `/api/v1/*` → quota check → origin

2. **Configure Wrangler**
   - File: `workers/raas-gateway/wrangler.toml`
   - KV bindings: `rate_limits`, `quota_audit_logs`
   - Secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `POLAR_API_KEY`

3. **Deploy Worker**
   - Command: `npx wrangler deploy`
   - Verify: `curl -I https://raas-gateway.<subdomain>.workers.dev`

### Related Files

- Create: `workers/raas-gateway/`
- Create: `workers/raas-gateway/src/index.ts`
- Create: `workers/raas-gateway/wrangler.toml`
- Create: `workers/raas-gateway/package.json`

### Todo List

- [ ] Create Cloudflare Worker project structure
- [ ] Configure wrangler.toml with KV bindings
- [ ] Implement basic request forwarding
- [ ] Deploy and verify worker responds

### Success Criteria

- Worker deploys successfully
- KV namespaces bound correctly
- Request forwarding works to origin

---

## Phase 2: Real-Time Quota Check Middleware

**Status:** pending | **Effort:** 2h

### Overview

Implement middleware that checks quota before forwarding requests to origin.

### Architecture

```
Request → Extract API Key → Get License → Check Quota → Allow/Block
                                                        │
                                                        ▼
                                          ┌─────────────────────────┐
                                          │ Allowed: Forward        │
                                          │ Blocked: Return 403     │
                                          └─────────────────────────┘
```

### Implementation Steps

1. **Create Quota Middleware**
   - File: `workers/raas-gateway/src/middleware/quota-check.ts`
   - Extract `mk_*` API key from headers
   - Lookup license in `raas_licenses` via Supabase Edge Function
   - Call `check-quota` function for real-time status

2. **Integrate with QuotaEnforcer**
   - Import: `src/lib/quota-enforcer.ts`
   - Use `checkQuota()` method for each metric type
   - Cache results (2min TTL) to avoid DB spam

3. **Handle Bypass Routes**
   - Bypass quota check for: `/billing/*`, `/usage/*`, `/subscription/*`
   - Allow these routes even when quota exceeded

### Related Files

- Modify: `src/lib/quota-enforcer.ts` (export for Worker)
- Create: `workers/raas-gateway/src/middleware/quota-check.ts`
- Modify: `supabase/functions/check-quota/index.ts` (add API key auth)

### Todo List

- [ ] Create quota check middleware
- [ ] Integrate QuotaEnforcer class
- [ ] Add bypass routes for billing/usage pages
- [ ] Add caching layer (2min TTL)

### Success Criteria

- Middleware checks quota before allowing requests
- Bypass routes work correctly
- Cache reduces DB queries

---

## Phase 3: Soft-Limit Warning Triggers (Email/SMS)

**Status:** pending | **Effort:** 1.5h

### Overview

Trigger warnings at 80%, 90%, 100% thresholds via email and SMS.

### Threshold Configuration

| Threshold | Action | Channel |
|-----------|--------|---------|
| 80% | Warning | Email |
| 90% | Critical Warning | Email + SMS |
| 100% | Quota Exhausted | Email + SMS + Hard Block |

### Implementation Steps

1. **Update usage-alert-webhook**
   - File: `supabase/functions/usage-alert-webhook/index.ts`
   - Add email sending via Resend at 80%
   - Add SMS via Twilio at 90%+

2. **Create SMS Templates**
   - File: `supabase/functions/send-sms/templates/quota-warning.ts`
   - Templates: `quota_80`, `quota_90`, `quota_exhausted`
   - Locales: vi, en

3. **Create Email Templates**
   - File: `supabase/functions/send-email/templates/quota-warning.ts`
   - Templates: `quota_warning_80`, `quota_warning_90`, `quota_exhausted`
   - Include upgrade link

### Related Files

- Modify: `supabase/functions/usage-alert-webhook/index.ts`
- Create: `supabase/functions/send-sms/templates/quota-warning.ts`
- Create: `supabase/functions/send-email/templates/quota-warning.ts`
- Modify: `supabase/migrations/202603081206_usage_alerts_schema.sql` (add email_sent, sms_sent flags)

### Todo List

- [ ] Add email sending to usage-alert-webhook
- [ ] Add SMS sending to usage-alert-webhook
- [ ] Create SMS templates (vi/en)
- [ ] Create email templates (vi/en)
- [ ] Test warning delivery at each threshold

### Success Criteria

- Email sent at 80%, 90%, 100%
- SMS sent at 90%, 100%
- Templates localized vi/en
- Idempotency prevents spam

---

## Phase 4: Hard Limit Enforcement (403 + KV Logging)

**Status:** pending | **Effort:** 1.5h

### Overview

Block requests with 403 errors when quota exceeded and log violations to KV.

### Response Format

```json
{
  "error": "quota_exceeded",
  "message": "Monthly API call quota exceeded",
  "details": {
    "metric_type": "api_calls",
    "current_usage": 10543,
    "quota_limit": 10000,
    "overage_units": 543,
    "percentage_used": 105
  },
  "enforcement_mode": "hard",
  "reset_at": "2026-04-01T00:00:00Z",
  "upgrade_url": "https://wellnexus.vn/dashboard/subscription"
}
```

### Implementation Steps

1. **Update QuotaEnforcer Response**
   - File: `src/lib/quota-enforcer.ts`
   - Change status from 429 to 403 (per requirement)
   - Add `quota_exceeded` error code

2. **Create KV Audit Logger**
   - File: `workers/raas-gateway/src/lib/kv-logger.ts`
   - Log: timestamp, customer_id, metric_type, usage, limit
   - TTL: 90 days

3. **Update check-quota Function**
   - File: `supabase/functions/check-quota/index.ts`
   - Return 403 with `quota_exceeded` code
   - Include upgrade URL in response

### Related Files

- Modify: `src/lib/quota-enforcer.ts`
- Modify: `supabase/functions/check-quota/index.ts`
- Create: `workers/raas-gateway/src/lib/kv-logger.ts`

### Todo List

- [ ] Change enforcement status to 403
- [ ] Add `quota_exceeded` error code
- [ ] Create KV audit logger
- [ ] Update check-quota response format

### Success Criteria

- Requests blocked with 403 status
- Error code `quota_exceeded` returned
- Violations logged to KV
- Response includes upgrade URL

---

## Phase 5: Dashboard Bypass for Billing/Usage Pages

**Status:** pending | **Effort:** 1h

### Overview

Ensure users can always access billing and usage dashboards even when quota exceeded.

### Bypass Routes

| Route | Purpose |
|-------|---------|
| `/dashboard/billing` | View invoices, payment methods |
| `/dashboard/usage` | View usage analytics |
| `/dashboard/subscription` | Upgrade/downgrade plans |
| `/api/usage/*` | Usage data endpoints |
| `/api/billing/*` | Billing endpoints |

### Implementation Steps

1. **Update Quota Middleware**
   - File: `workers/raas-gateway/src/middleware/quota-check.ts`
   - Add bypass list
   - Check route before quota validation

2. **Verify Frontend Routes**
   - Check: `src/pages/Dashboard/Billing.tsx`
   - Check: `src/pages/Dashboard/Usage.tsx`
   - Ensure no client-side quota blocks

### Related Files

- Modify: `workers/raas-gateway/src/middleware/quota-check.ts`
- Check: `src/pages/Dashboard/Billing.tsx`
- Check: `src/pages/Dashboard/Usage.tsx`

### Todo List

- [ ] Add bypass routes to middleware
- [ ] Verify frontend routes accessible
- [ ] Test access when quota exceeded

### Success Criteria

- Billing page accessible when blocked
- Usage page accessible when blocked
- Subscription page accessible when blocked

---

## Phase 6: Self-Serve Upgrade/Downgrade UI Flow

**Status:** pending | **Effort:** 2h

### Overview

Build UI flow for users to upgrade or downgrade their subscription when quota exceeded.

### UI Components

1. **Quota Exhausted Banner**
   - Shows on all pages when quota exceeded
   - CTA: "Upgrade Plan" or "Wait for Reset"
   - Displays reset countdown

2. **Plan Comparison Modal**
   - Compare Free/Basic/Pro/Enterprise
   - Show current usage vs new limits
   - Instant upgrade button

3. **Downgrade Confirmation**
   - Warning about reduced limits
   - Effective date (next billing cycle)
   - Confirmation required

### Implementation Steps

1. **Create Quota Exhausted Banner**
   - File: `src/components/QuotaExhaustedBanner.tsx`
   - Hook: `use-quota-status`
   - Shows upgrade CTA

2. **Create Upgrade Modal**
   - File: `src/components/UpgradePlanModal.tsx`
   - Integrate Stripe/Polar checkout
   - Instant activation

3. **Create Downgrade Flow**
   - File: `src/components/DowngradePlanModal.tsx`
   - Warning dialog
   - Scheduled downgrade

4. **Update Subscription Page**
   - File: `src/pages/Dashboard/Subscription.tsx`
   - Add upgrade/downgrade buttons
   - Show current usage

### Related Files

- Create: `src/components/QuotaExhaustedBanner.tsx`
- Create: `src/components/UpgradePlanModal.tsx`
- Create: `src/components/DowngradePlanModal.tsx`
- Modify: `src/pages/Dashboard/Subscription.tsx`
- Create: `src/hooks/use-quota-status.ts`

### Todo List

- [ ] Create quota exhausted banner component
- [ ] Create upgrade modal with Stripe/Polar
- [ ] Create downgrade flow with confirmation
- [ ] Update subscription page
- [ ] Add i18n keys (vi/en)

### Success Criteria

- Banner shows when quota exceeded
- Upgrade works instantly
- Downgrade scheduled for next cycle
- Localized vi/en

---

## Phase 7: Stripe/Polar Subscription Sync

**Status:** pending | **Effort:** 1.5h

### Overview

Sync quota enforcement with Stripe/Polar subscription states.

### Sync Flow

```
Subscription Change → Webhook → Update raas_licenses → Clear Quota Cache
```

### Implementation Steps

1. **Update stripe-webhook**
   - File: `supabase/functions/stripe-webhook/index.ts`
   - Handle: `customer.subscription.updated`, `customer.subscription.deleted`
   - Update `raas_licenses.tier` and `metadata.stripe_subscription_id`

2. **Update polar-webhook**
   - File: `supabase/functions/polar-webhook/index.ts`
   - Handle: `subscription.active`, `subscription.cancelled`
   - Update `raas_licenses.tier` and `metadata.polar_subscription_id`

3. **Create Subscription Sync Function**
   - File: `supabase/functions/sync-subscription/index.ts`
   - Fetch current subscription from Stripe/Polar
   - Reconcile with database

### Related Files

- Modify: `supabase/functions/stripe-webhook/index.ts`
- Modify: `supabase/functions/polar-webhook/index.ts`
- Create: `supabase/functions/sync-subscription/index.ts`

### Todo List

- [ ] Update Stripe webhook handlers
- [ ] Update Polar webhook handlers
- [ ] Create subscription sync function
- [ ] Test subscription change flow

### Success Criteria

- Subscription updates reflect in `raas_licenses`
- Tier changes update quota limits
- Webhooks idempotent

---

## Phase 8: Analytics Dashboard Integration

**Status:** pending | **Effort:** 1h

### Overview

Integrate quota enforcement data into usage analytics dashboard.

### Dashboard Enhancements

1. **Quota Utilization Gauge**
   - Real-time percentage used
   - Color-coded (green < 80%, yellow 80-90%, red > 90%)
   - Reset countdown

2. **Enforcement History**
   - Table of quota violations
   - Date, metric type, overage units
   - Export to CSV

3. **Projected Overage Cost**
   - Based on current usage rate
   - End-of-month projection
   - Compare to plan cost

### Implementation Steps

1. **Update UsageDashboard**
   - File: `src/pages/UsageDashboard.tsx`
   - Add quota gauges
   - Add enforcement history table

2. **Create Quota Gauge Component**
   - File: `src/components/analytics/QuotaGauge.tsx`
   - Props: current, limit, metricType
   - Color coding

3. **Add Projection Calculation**
   - File: `src/lib/usage-projection.ts`
   - Calculate end-of-month projection
   - Based on daily average

### Related Files

- Modify: `src/pages/UsageDashboard.tsx`
- Create: `src/components/analytics/QuotaGauge.tsx`
- Create: `src/lib/usage-projection.ts`

### Todo List

- [ ] Add quota gauges to dashboard
- [ ] Add enforcement history table
- [ ] Create usage projection calculator
- [ ] Test with real data

### Success Criteria

- Dashboard shows real-time quota status
- Enforcement history visible
- Projection accurate

---

## Phase 9: Testing + Documentation

**Status:** pending | **Effort:** 1.5h

### Overview

Comprehensive testing and documentation for quota enforcement system.

### Test Coverage

1. **Unit Tests**
   - `src/lib/__tests__/quota-enforcer.test.ts`
   - Test soft/hard/hybrid modes
   - Test bypass routes

2. **Integration Tests**
   - `supabase/functions/__tests__/check-quota.test.ts`
   - Test quota check flow
   - Test warning triggers

3. **E2E Tests**
   - `src/__tests__/e2e/quota-enforcement.test.ts`
   - Test full flow: usage → warning → block → upgrade
   - Test dashboard bypass

### Documentation

1. **User Guide**
   - File: `docs/quota-enforcement-guide.md`
   - How warnings work
   - How to upgrade/downgrade
   - FAQs

2. **Developer Guide**
   - File: `docs/quota-enforcement-architecture.md`
   - System architecture
   - API reference
   - Troubleshooting

### Related Files

- Create: `src/lib/__tests__/quota-enforcer.test.ts`
- Create: `supabase/functions/__tests__/check-quota.test.ts`
- Create: `src/__tests__/e2e/quota-enforcement.test.ts`
- Create: `docs/quota-enforcement-guide.md`
- Create: `docs/quota-enforcement-architecture.md`

### Todo List

- [ ] Write unit tests for QuotaEnforcer
- [ ] Write integration tests for check-quota
- [ ] Write E2E tests for full flow
- [ ] Write user guide
- [ ] Write developer documentation
- [ ] Run `npm run build` - verify 0 errors
- [ ] Run `npm run test:run` - verify all pass

### Success Criteria

- All tests pass
- Build succeeds
- Documentation complete

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| False positive blocks | Critical | Admin bypass keys, monitoring alerts, instant rollback |
| Warning spam | High | Idempotency keys, 1hr cooldown per threshold |
| Upgrade flow breaks | High | Test with Stripe/Polar test mode, fallback manual upgrade |
| Dashboard bypass blocked | Critical | Test bypass routes explicitly, add emergency bypass |
| KV rate limit exceeded | Medium | Batch writes, TTL optimization |
| Subscription sync fails | High | Webhook retry logic, manual sync endpoint |

---

## Security Considerations

1. **API Key Security**: Never expose service role key in frontend
2. **JWT Signing**: Use RAAS_JWT_SECRET for webhook auth
3. **Idempotency**: All webhooks must be idempotent
4. **Audit Logging**: Log all enforcement actions to KV
5. **RLS**: Ensure RLS policies on `usage_records`, `alert_webhook_events`

---

## Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| Supabase | Backend | Ready |
| Stripe | Billing | Ready |
| Polar | Billing | Ready |
| Twilio | SMS | Ready |
| Resend | Email | Ready |
| Cloudflare Workers | Gateway | Phase 1 |
| Cloudflare KV | Rate Limiting | Ready |

---

## Unresolved Questions

1. **RaaS Gateway URL**: What is the production URL for `raas.agencyos.network`? Is it deployed already?

2. **Cloudflare KV Namespace**: What is the KV namespace ID for `quota_audit_logs`? Need to create or use existing?

3. **Overage Pricing**: What is the per-unit overage rate for each metric type (api_calls, tokens, etc.)?

4. **Grace Period**: Should there be a grace period (e.g., 5 minutes) before hard enforcement kicks in at 100%?

5. **Admin Bypass**: Should admin API keys bypass quota enforcement? If so, how to identify admin keys?

6. **Reset Time**: Do quotas reset on calendar month (1st) or billing cycle anniversary?

---

## Appendix: Database Schema Changes

### New Table: `quota_enforcement_logs`

```sql
CREATE TABLE quota_enforcement_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  license_id UUID NOT NULL,
  user_id UUID NOT NULL,
  metric_type TEXT NOT NULL,
  current_usage INTEGER NOT NULL,
  quota_limit INTEGER NOT NULL,
  enforcement_action TEXT NOT NULL, -- 'warning', 'soft_block', 'hard_block'
  response_status INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quota_logs_org ON quota_enforcement_logs(org_id, created_at);
CREATE INDEX idx_quota_logs_license ON quota_enforcement_logs(license_id, created_at);
```

---

_Phase Count: 9 | Total Effort: 12h | Priority: P1_
