---
title: "Overage Billing & Dunning Workflows - Complete Implementation"
description: "Research and detailed implementation plan for overage notifications, payment retry automation, RaaS Gateway sync, dashboard UI, and integration testing"
status: completed
priority: P1
effort: 24h
branch: main
tags: [billing, overage, dunning, raas-gateway, dashboard, phase-7]
created: 2026-03-09
completed: 2026-03-09
---

# Overage Billing & Dunning Workflows

## Overview

| Attribute | Value |
|-----------|-------|
| **Phase** | 7 (Billing & Monetization) + Phase 6 Integration |
| **Priority** | P1 - Critical for revenue collection |
| **Effort** | 24 hours total |
| **Status** | ✅ Completed |
| **Owner** | Fullstack Developer |

## Executive Summary

Build complete overage billing and dunning workflow system. Existing infrastructure provides dunning service, overage calculator, and Polar/Stripe clients. This plan completes: (1) threshold-based notification system, (2) automated payment retry scheduler, (3) RaaS Gateway usage sync, (4) dashboard UI components, (5) end-to-end integration testing.

## Current State Analysis

### ✅ Already Implemented

| Component | File | Status |
|-----------|------|--------|
| Dunning Service | `src/lib/dunning-service.ts` | ✅ Complete |
| Overage Calculator | `src/lib/overage-calculator.ts` | ✅ Complete |
| Polar Overage Client | `src/lib/polar-overage-client.ts` | ✅ Complete |
| Stripe Webhook Handler | `src/lib/stripe-billing-webhook-handler.ts` | ✅ Complete |
| Usage Alert Engine | `src/lib/usage-alert-engine.ts` | ✅ Complete |
| Usage Metering | `src/lib/usage-metering.ts` | ✅ Complete |
| RaaS Gateway Client | `src/lib/raas-gateway-client.ts` | ✅ Complete |
| E2E Tests | `src/__tests__/e2e/dunning-flow.test.ts` | ✅ Complete |
| Usage Meter UI | `src/components/billing/UsageMeter.tsx` | ✅ Complete |
| Alert Settings UI | `src/components/billing/UsageAlertSettings.tsx` | ✅ Complete |

### ❌ Gaps to Fill

| Gap | Impact | Priority |
|-----|--------|----------|
| No automated payment retry scheduler | Failed payments not retried systematically | P1 |
| RaaS Gateway usage sync incomplete | Usage data siloed, no bi-directional sync | P1 |
| Dashboard UI fragmented | Users cannot see overage/dunning status in one place | P2 |
| No 80%/90%/100% threshold notification automation | Users surprised by overages | P2 |
| No payment method update flow | Support burden for payment failures | P2 |
| Integration tests incomplete | Full flow not validated end-to-end | P1 |

---

## Implementation Phases

### Phase 1: Overage Notification System (5h)

**Goal:** Automated threshold-based warnings at 80%, 90%, 100% with email/SMS notifications

**Files to Create:**
- `src/services/usage-notification-service.ts` - Notification orchestration
- `supabase/functions/send-overage-alert/index.ts` - Edge Function for alerts
- `src/components/billing/RealtimeQuotaTracker.tsx` - Real-time UI component
- `src/__tests__/usage-notification-service.test.ts` - Unit tests

**Files to Modify:**
- `src/lib/usage-alert-engine.ts` - Add SMS support, enhance threshold logic
- `src/hooks/use-usage-alerts.ts` - Add real-time subscription
- `src/locales/vi/billing.ts` - Add notification translations
- `src/locales/en/billing.ts` - Add notification translations

**Architecture:**
```
UsageMeter.track() → UsageAlertEngine.checkAndEmitAlerts()
    ↓
UsageNotificationService (determines channel: email/SMS/webhook)
    ↓
Edge Functions: send-sms / send-dunning-email / usage-alert-webhook
    ↓
User receives notification at 80%/90%/100% thresholds
```

**Success Criteria:**
- [ ] Notifications sent at exactly 80%, 90%, 100% thresholds
- [ ] Email notifications work via Resend API
- [ ] SMS notifications work via Twilio
- [ ] Webhook notifications sent to AgencyOS
- [ ] No duplicate alerts within cooldown period (1 hour)
- [ ] i18n for Vietnamese and English

---

### Phase 2: Payment Retry Automation (4h)

**Goal:** Automated payment retry scheduler with exponential backoff (1h, 1d, 3d, 7d)

**Files to Create:**
- `src/services/payment-retry-scheduler.ts` - Retry orchestration
- `supabase/functions/process-payment-retry/index.ts` - Edge Function
- `supabase/migrations/260309-payment-retry-queue.sql` - Retry queue table

**Files to Modify:**
- `src/lib/dunning-service.ts` - Integrate retry scheduler
- `supabase/functions/stripe-dunning/index.ts` - Trigger retry on payment_failed

**Retry Schedule:**
| Attempt | Delay | Channel |
|---------|-------|---------|
| 1 | 1 hour | Email + SMS |
| 2 | 1 day | Email + SMS |
| 3 | 3 days | Email + SMS + Webhook |
| 4 | 7 days | Final notice |

**Smart Retry Logic:**
```typescript
// Detect transient vs permanent failures
function isTransientFailure(error: StripeError): boolean {
  return ['card_declined', 'insufficient_funds'].includes(error.code)
}

function isPermanentFailure(error: StripeError): boolean {
  return ['expired_card', 'incorrect_cvc', 'lost_card'].includes(error.code)
}
```

**Success Criteria:**
- [ ] Failed payments automatically scheduled for retry
- [ ] Exponential backoff implemented correctly
- [ ] Smart detection skips permanent failures
- [ ] Dead-letter queue for failed retries (max 5)
- [ ] Payment method update reminders sent

---

### Phase 3: RaaS Gateway Usage Sync (6h)

**Goal:** Bi-directional sync between local usage metering and RaaS Gateway

**Files to Create:**
- `src/services/raas-gateway-usage-sync.ts` - Sync orchestration
- `supabase/functions/sync-gateway-usage/index.ts` - Edge Function
- `src/lib/gateway-auth-client.ts` - JWT/mk_ API key auth
- `src/__tests__/raas-gateway-sync.test.ts` - Integration tests

**Files to Modify:**
- `src/lib/raas-gateway-client.ts` - Add usage sync methods
- `src/lib/usage-metering.ts` - Add Gateway sync hook

**Architecture:**
```
Local UsageMeter.track() → Supabase usage_records
    ↓
RaaS Gateway Sync Service (polling every 5min)
    ↓
JWT Auth → POST /api/v1/usage/report (RaaS Gateway)
    ↓
Cloudflare KV storage → AgencyOS Dashboard
```

**Authentication:**
```typescript
// JWT payload for Gateway auth
const payload = {
  iss: 'wellnexus.vn',
  aud: 'raas.agencyos.network',
  sub: orgId,
  license_id: licenseId,
  mk_key: mk_xxx,  // API key prefix
  exp: Date.now() + 3600,
}
```

**Idempotency:**
```typescript
// Deduplication using idempotency keys
const idempotencyKey = `sync_${orgId}_${metricType}_${timestamp}`
await gateway.reportUsage({ idempotencyKey, ... })
```

**Success Criteria:**
- [ ] JWT authentication working with mk_ API keys
- [ ] Bi-directional sync: local → Gateway → Stripe/Polar
- [ ] Idempotency prevents duplicate reporting
- [ ] Sync runs every 5 minutes via cron
- [ ] Error handling with retry queue

---

### Phase 4: Dashboard UI (6h)

**Goal:** Complete dashboard UI for overage status, dunning state, and payment management

**Files to Create:**
- `src/pages/dashboard/billing/overage-status.tsx` - Overage widget
- `src/pages/dashboard/billing/dunning-status.tsx` - Dunning state page
- `src/components/billing/UsageHistoryChart.tsx` - Historical chart
- `src/components/billing/PaymentMethodManager.tsx` - Payment form
- `src/components/billing/PlanUpgradeCTA.tsx` - Upgrade prompts

**Files to Modify:**
- `src/pages/dashboard/billing/index.tsx` - Integrate new components
- `src/hooks/use-billing-status.ts` - Add overage/dunning hooks
- `src/locales/vi/billing.ts` - UI translations
- `src/locales/en/billing.ts` - UI translations

**UI Components:**

1. **Overage Status Widget:**
   - Current usage vs quota (progress bars)
   - Overage cost breakdown by metric
   - Projection to end of period
   - Plan upgrade CTA when approaching limits

2. **Dunning Status Page:**
   - Current dunning stage (initial/reminder/final/cancel_notice)
   - Amount owed with due date
   - Payment retry countdown
   - Payment method update button

3. **Usage History Chart:**
   - 30-day usage trend
   - Quota vs actual
   - Overage events marked
   - Metric breakdown (stacked area)

4. **Payment Method Manager:**
   - Stripe Elements form
   - Current card display
   - Update/replace flow
   - Invoice history

**Success Criteria:**
- [ ] All UI components responsive and accessible
- [ ] Real-time updates via Supabase subscriptions
- [ ] i18n complete for Vietnamese and English
- [ ] Payment form validates correctly
- [ ] Usage charts render with Framer Motion animations

---

### Phase 5: Integration & Testing (3h)

**Goal:** End-to-end flow validation and load testing

**Files to Create:**
- `src/__tests__/e2e/overage-notification-flow.test.ts` - Notification E2E
- `src/__tests__/e2e/payment-retry-flow.test.ts` - Retry E2E
- `src/__tests__/e2e/raas-gateway-sync-flow.test.ts` - Gateway sync E2E
- `src/__tests__/load/usage-notification-load.test.ts` - Load tests

**Files to Modify:**
- `vitest.config.ts` - Add test configurations
- `.github/workflows/e2e-tests.yml` - CI/CD integration

**Test Scenarios:**

1. **Overage Notification Flow:**
   ```
   User API usage → 80% threshold → Email sent
   User API usage → 90% threshold → SMS sent
   User API usage → 100% threshold → Webhook + Email
   Verify no duplicates within cooldown
   ```

2. **Payment Retry Flow:**
   ```
   invoice.payment_failed → Retry scheduled (1h)
   Retry 1 fails → Retry scheduled (1d)
   Retry 2 fails → Retry scheduled (3d)
   User updates payment → Retry succeeds → Dunning resolved
   ```

3. **RaaS Gateway Sync Flow:**
   ```
   Local usage tracked → Sync trigger
   JWT auth → Gateway API call
   KV storage updated → Dashboard reflects usage
   Verify idempotency (duplicate blocked)
   ```

**Success Criteria:**
- [ ] All E2E tests pass (>95% success rate)
- [ ] Load test: 1000 concurrent notifications/sec
- [ ] Gateway sync latency < 30 seconds
- [ ] Payment retry recovery rate > 60%
- [ ] Zero data loss in sync

---

## Dependencies & Risks

### External Dependencies

| Service | Purpose | Fallback |
|---------|---------|----------|
| Stripe | Payment processing, invoicing | Manual invoicing |
| Polar.sh | Alternative billing backend | Stripe only |
| Twilio | SMS notifications | Email only |
| Resend | Email sending | SMTP fallback |
| RaaS Gateway | Usage aggregation | Local-only tracking |
| Cloudflare KV | Usage caching | Direct Supabase queries |

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Gateway rate limiting | Medium | High | Exponential backoff, request batching |
| SMS delivery failures | Medium | Medium | Email fallback, webhook notifications |
| JWT token expiry during sync | Low | Medium | Token refresh before expiry |
| Race conditions in usage sync | Medium | High | Optimistic locking, idempotency keys |
| Stripe API rate limits | Low | High | Batch requests, caching |

---

## Testing Strategy

### Unit Tests (Vitest)
- Notification service functions
- Payment retry scheduler logic
- Gateway auth token generation
- Rate limiter for notifications

### Integration Tests
- Stripe API calls (test mode)
- Twilio SMS delivery (sandbox)
- RaaS Gateway API integration
- Supabase Edge Functions

### E2E Tests (Playwright)
- Full notification flow
- Payment retry sequence
- Dashboard UI interactions
- Gateway sync verification

### Load Tests (k6)
- 1000 concurrent notifications
- Gateway sync under load
- Database query performance

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Notification delivery rate | >98% | Email/SMS/webhook success |
| Payment recovery rate | >60% | Dunning resolved / total |
| Gateway sync latency | <30s | Track to dashboard |
| User satisfaction | >4.5/5 | Post-implementation survey |
| Support ticket reduction | >50% | Billing-related tickets |

---

## Open Questions

1. **RaaS Gateway endpoint**: What is the exact API endpoint for usage reporting? (`/api/v1/usage/report`?)
2. **JWT secret**: Where is the Gateway JWT secret stored? (Supabase secrets management?)
3. **mk_ API key format**: What is the expected format/prefix for Gateway API keys?
4. **SMS provider**: Using Twilio or alternative for Vietnamese SMS delivery?
5. **Gateway sync frequency**: What is the optimal sync interval? (Currently 5 minutes)
6. **Polar vs Stripe priority**: Which billing backend takes precedence when both configured?

---

## Phase Files

| Phase | File | Status |
|-------|------|--------|
| 1 | `phase-01-overage-notifications.md` | Pending |
| 2 | `phase-02-payment-retry.md` | Pending |
| 3 | `phase-03-raas-gateway-sync.md` | Pending |
| 4 | `phase-04-dashboard-ui.md` | Pending |
| 5 | `phase-05-integration-testing.md` | Pending |

---

_Created: 2026-03-09 | Status: Pending | Priority: P1_
