# Phase 6 License Enforcement Implementation Plan - Created

**Date:** 2026-03-09
**Status:** Plan complete, ready for implementation
**Plan Directory:** `/Users/macbookprom1/mekong-cli/apps/well/plans/260309-1101-phase6-license-enforcement/`

---

## Executive Summary

Created comprehensive 6-phase implementation plan for Automated License Enforcement & Suspension system. Plan integrates RaaS Gateway, Stripe billing state, and analytics emission for complete revenue protection.

## Plan Overview

| Attribute | Value |
|-----------|-------|
| **Total Effort** | 12 hours |
| **Priority** | P1 (Critical for revenue) |
| **Phases** | 6 (6.1-6.6) |
| **Status** | ⏳ Pending |

## Phase Summary

| Phase | Title | Effort | Status |
|-------|-------|--------|--------|
| 6.1 | RaaS Gateway Worker Setup | 2h | ⏳ Pending |
| 6.2 | License Validation Middleware | 2h | ⏳ Pending |
| 6.3 | Stripe Billing State Sync | 2.5h | ⏳ Pending |
| 6.4 | Suspension Logic & 403 Responses | 2h | ⏳ Pending |
| 6.5 | Analytics Event Emission | 1.5h | ⏳ Pending |
| 6.6 | Testing & Verification | 2h | ⏳ Pending |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     API Request Flow                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. License Validation Middleware (raas-gate-quota.ts)          │
│     - Extract API key from headers                              │
│     - Check Cloudflare KV cache first                           │
│     - If miss → RaaS Gateway Worker                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. RaaS Gateway Worker (Cloudflare)                            │
│     - Validate license key format                               │
│     - Check license status from DB                              │
│     - Return validation result + features                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Stripe Billing State Check                                  │
│     - Query user_subscriptions table                            │
│     - Check status != 'active' → flag for suspension            │
│     - Check past_due + dunning_active → flag for suspension     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Enforcement Decision                                        │
│     - License invalid? → 403                                    │
│     - License expired? → 403                                    │
│     - Subscription not active? → 403                            │
│     - Dunning active + past threshold? → 403                    │
│     - All checks pass? → 200, continue request                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. Analytics Event Emission                                    │
│     - Log license_check event (success/failure)                 │
│     - Log suspension event (if applicable)                      │
│     - Emit to dashboard via Supabase realtime                   │
└─────────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Real-time License Validation
- Cloudflare Worker for edge caching
- KV storage for sub-50ms validation
- 5-minute TTL with webhook invalidation

### 2. Stripe Billing Integration
- Sync subscription status (active/past_due/canceled/expired)
- Dunning state awareness
- 48-hour grace period for past_due

### 3. Suspension Enforcement
- 403 responses with structured error body
- i18n support (VI + EN)
- Admin bypass for support scenarios

### 4. Analytics Integration
- License check events on every request
- Suspension events for churn tracking
- Dashboard visibility in real-time

### 5. Audit Logging
- All suspensions logged to `suspension_audit_log`
- Request tracking with unique IDs
- IP address and user agent capture

## Files Created

```
plans/260309-1101-phase6-license-enforcement/
├── plan.md                              # Overview plan
├── phase-01-raas-gateway-worker.md      # Cloudflare Worker setup
├── phase-02-license-validation-middleware.md  # Middleware implementation
├── phase-03-stripe-billing-sync.md      # Stripe state integration
├── phase-04-suspension-logic.md         # 403 response logic
├── phase-05-analytics-events.md         # Analytics emission
└── phase-06-testing-verification.md     # Tests & docs
```

## New Components to Create

| Component | File | Purpose |
|-----------|------|---------|
| Cloudflare Worker | `apps/raas-gateway-worker/` | Edge validation |
| LicenseEnforcementService | `src/services/license-enforcement-service.ts` | Core validation |
| BillingStateService | `src/services/billing-state-service.ts` | Stripe state |
| SuspensionResponse | `src/services/suspension-response.ts` | 403 builder |
| AdminBypass | `src/lib/admin-bypass.ts` | Support bypass |
| SuspensionAudit | `src/services/suspension-audit.ts` | Audit logging |
| LicenseAnalytics | `src/services/license-analytics.ts` | Event emitter |

## Database Changes

| Table | Purpose |
|-------|---------|
| `suspension_audit_log` | Audit trail for suspensions |
| `license_analytics_events` | Analytics event storage |

## Dependencies

| Dependency | Status |
|------------|--------|
| Phase 2: License Management UI | ✅ Complete |
| Phase 3: Stripe Integration | ✅ Complete |
| Phase 5: Analytics Dashboard | ✅ Complete |
| Phase 7: Quota Enforcement | ✅ Complete |
| Cloudflare Workers | ⏳ Setup needed |
| Cloudflare KV | ⏳ Setup needed |

## Success Criteria

| Criterion | Target |
|-----------|--------|
| License validation latency | < 50ms (cache hit) |
| 403 on invalid license | ✅ E2E test |
| 403 on expired subscription | ✅ E2E test |
| Analytics events visible | < 5 seconds |
| Zero false negatives | Valid license never blocked |
| Test coverage | 90%+ |

## Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| KV cache staleness | 5-min TTL + webhook invalidation |
| RaaS Gateway downtime | Fallback to DB validation |
| Stripe webhook delays | Poll state every 5min |
| False positive suspension | Admin bypass for support |

## Open Questions

1. **KV Provider**: Use Cloudflare KV or Supabase cache table?
2. **Grace Period**: Should suspended licenses have grace period before 403?
3. **Admin Bypass**: Should admin API keys bypass license checks?
4. **Analytics Volume**: Rate limit analytics events to prevent flood?

## Next Steps

1. **Start Phase 6.1**: Set up Cloudflare Worker infrastructure
2. **Deploy KV namespace**: Create Cloudflare KV storage
3. **Implement services**: Build enforcement stack
4. **Test thoroughly**: Run E2E tests before production
5. **Monitor**: Watch analytics dashboard for issues

---

**Plan Created:** 2026-03-09
**Location:** `/Users/macbookprom1/mekong-cli/apps/well/plans/260309-1101-phase6-license-enforcement/`
**Status:** Ready for implementation
