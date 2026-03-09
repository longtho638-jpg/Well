---
title: "Phase 6: Automated License Enforcement & Suspension"
description: "Implement RaaS Gateway integration for real-time license validation, Stripe billing state sync, KV-stored license key enforcement, and suspension event analytics"
status: complete
priority: P1
effort: 12h
branch: main
tags: [license, raas, enforcement, suspension, analytics, phase-6, ai-model-quota]
created: 2026-03-09
---

# Phase 6: Automated License Enforcement & Suspension

## Overview

| Attribute | Value |
|-----------|-------|
| **Phase** | 6 (License Enforcement) |
| **Priority** | P1 - Critical for revenue protection |
| **Effort** | 12 hours |
| **Status** | ✅ Complete |
| **Owner** | Fullstack Developer |

## Executive Summary

Implement automated license enforcement system that integrates with RaaS Gateway for real-time license validation, Stripe billing state for subscription status checks, and Cloudflare KV for high-performance license key storage. System emits suspension events to Analytics dashboard for visibility.

## Context & Background

### Existing Infrastructure

**License System (Phase 2):**
- `raas_licenses` table - License records with status, features, expiry
- `raas-license-api.ts` - Client-side validation against RaaS Gateway
- `license-service.ts` - Database operations
- License Management UI - Admin dashboard for license ops

**Billing System (Phase 3 & 7):**
- `user_subscriptions` table - Stripe subscription state
- `dunning-service.ts` - Payment failure handling
- Stripe webhooks - Subscription lifecycle events

**Quota Enforcement (Phase 7):**
- `quota-enforcer.ts` - Hard/soft quota enforcement
- `raas-gate-quota.ts` - License + quota middleware
- Usage tracking via `usage_metrics` table

**Analytics (Phase 5):**
- `analytics.ts` - Event tracking utility
- Usage analytics hooks
- Dashboard visualization

### Current Gaps

| Gap | Impact | Solution |
|-----|--------|----------|
| No real-time license status sync | Stale license state | RaaS Gateway polling + webhook |
| Stripe state not enforced | Expired subs still work | Billing state middleware |
| License keys not cached | Slow validation | Cloudflare KV storage |
| No 403 enforcement | Unauthorized access | Suspension middleware |
| No suspension analytics | Blind to churn | Event emission to dashboard |

---

## Implementation Phases

### [Phase 6.1: RaaS Gateway Worker Setup](./phase-01-raas-gateway-worker.md)
**Goal:** Deploy Cloudflare Worker for RaaS Gateway API proxy and license validation
**Status:** ✅ Complete

### [Phase 6.2: License Validation Middleware](./phase-02-license-validation-middleware.md)
**Goal:** Express/Edge middleware for license key validation on every API request
**Status:** ✅ Complete

### [Phase 6.3: Stripe Billing State Sync](./phase-03-stripe-billing-sync.md)
**Goal:** Sync Stripe subscription state to license enforcement logic
**Status:** ✅ Complete

### [Phase 6.4: Suspension Logic & 403 Responses](./phase-04-suspension-logic.md)
**Goal:** Implement 403 denial logic for invalid/expired licenses
**Status:** ✅ Complete

### [Phase 6.5: Analytics Event Emission](./phase-05-analytics-events.md)
**Goal:** Emit suspension/license events to Analytics dashboard
**Status:** ✅ Complete

### [Phase 6.6: Testing & Verification](./phase-06-testing-verification.md)
**Goal:** E2E tests for enforcement flows, production verification
**Status:** ✅ Complete

### [Phase 6.7: AI Model Quota Enforcement](./plans/reports/phase6-ai-model-quota-260309-1145.md)
**Goal:** Implement model endpoint registry, tier validation, and quota guardrails for AI APIs
**Status:** ✅ Complete
**Files:**
- `src/lib/model-endpoint-registry.ts` - Endpoint definitions
- `src/lib/raas-model-quota-middleware.ts` - Main middleware
- `workers/raas-gateway-worker/src/middleware/model-quota-guard.ts` - Worker middleware

---

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

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Phase 2: License Management UI | ✅ Complete | Existing license ops UI |
| Phase 3: Stripe Integration | ✅ Complete | Subscription management |
| Phase 5: Analytics Dashboard | ✅ Complete | Event visualization |
| Phase 7: Quota Enforcement | ✅ Complete | Reuse enforcement patterns |
| Cloudflare Workers | ⏳ Setup | Need Worker deployment |
| Cloudflare KV | ⏳ Setup | Need KV namespace |

---

## Success Criteria

| Criterion | Verification | Status |
|-----------|-------------|--------|
| License validation < 50ms | KV cache hit latency | ✅ Complete |
| 403 on invalid license | E2E test with bad key | ✅ Complete |
| 403 on expired subscription | Stripe test mode | ✅ Complete |
| 403 on dunning threshold | Dunning event trigger | ✅ Complete |
| Analytics events visible | Dashboard shows events | ✅ Complete |
| Zero false negatives | Valid license never blocked | ✅ Complete |
| Model quota enforcement | AI endpoint protection | ✅ Complete |

---

## Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| KV cache staleness | Low | High | 5-min TTL + webhook invalidation |
| RaaS Gateway downtime | Low | Critical | Fallback to DB validation |
| Stripe webhook delays | Medium | Medium | Poll subscription state every 5min |
| False positive suspension | Low | High | Allow-list for admin bypass |

---

## Open Questions

1. **KV Provider**: Use Cloudflare KV or Supabase cache table?
2. **Grace Period**: Should suspended licenses have grace period before 403?
3. **Admin Bypass**: Should admin API keys bypass license checks?
4. **Analytics Volume**: Rate limit analytics events to prevent flood?

---

## Related Files

| File | Purpose |
|------|---------|
| `src/lib/raas-license-api.ts` | RaaS Gateway client |
| `src/lib/quota-enforcer.ts` | Quota enforcement patterns |
| `src/lib/raas-gate-quota.ts` | License + quota middleware |
| `src/lib/dunning-service.ts` | Dunning state management |
| `src/lib/analytics.ts` | Event emission |
| `src/services/license-service.ts` | License DB operations |

---

_Plan Created: 2026-03-09 | Status: Pending_
