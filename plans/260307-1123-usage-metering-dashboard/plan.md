---
title: Phase 5 - Usage Metering Dashboard & Core Integration
description: Real-time usage analytics dashboard, auto-tracking middleware, license enforcement, and billing sync webhooks
status: pending
priority: P1
effort: 12h
branch: main
tags: [usage-metering, raas, dashboard, quota-enforcement, billing]
created: 2026-03-07
---

# Phase 5: Usage Metering Dashboard & Core Integration

## Overview

Build real-time usage analytics dashboard and integrate usage tracking across the entire WellNexus RaaS platform. This phase leverages existing UsageMeter SDK (Phase 4 complete) and raas_licenses table (Phase 2 complete).

## Context

- **Phase 2 (License Entitlements):** ✅ Complete - `raas_licenses` table, `license-service.ts`
- **Phase 3 (Stripe/Polar Webhooks):** ✅ Complete - webhook handlers provision/revoke licenses
- **Phase 4 (Usage Metering Infrastructure):** ✅ Complete - `usage_records`, `usage_events`, `UsageMeter` SDK

## Phase 5 Scope

1. **Dashboard UI** - Real-time usage analytics dashboard at `/dashboard/usage`
2. **Core Integration** - Auto-track API calls, agent executions, AI inferences
3. **License Enforcement** - Block usage when quota exceeded based on license tier
4. **Billing Sync** - Usage events trigger billing updates to Stripe/Polar

## Deliverables

- [ ] Usage dashboard page (`/dashboard/usage`)
- [ ] Usage tracking hooks (`useUsage`, `useQuota`)
- [ ] Auto-tracking middleware for API calls
- [ ] Quota enforcement (block when exceeded)
- [ ] Billing sync webhooks to Stripe/Polar

## Phases

| # | Phase | Status | Deliverables |
|---|-------|--------|--------------|
| 1 | Database Schema & Types | pending | Usage types, i18n keys, schema updates |
| 2 | React Hooks & SDK Integration | pending | `useUsage`, `useQuota`, `UsageProvider` |
| 3 | Dashboard UI Components | pending | Usage cards, charts, quota meters |
| 4 | Auto-Tracking Middleware | pending | HTTP interceptor, API tracking |
| 5 | Quota Enforcement Layer | pending | 429 responses, warnings, blocks |
| 6 | Billing Sync Webhooks | pending | Stripe/Polar usage sync |
| 7 | Testing & Integration | pending | Unit tests, E2E, browser verify |

## Effort Breakdown

- Phase 1: 1.5h - Schema, types, i18n
- Phase 2: 2h - Hooks, context, SDK integration
- Phase 3: 3h - Dashboard UI components
- Phase 4: 2h - Auto-tracking middleware
- Phase 5: 2h - Quota enforcement
- Phase 6: 1.5h - Billing sync webhooks
- **Total: 12h**

## Dependencies

- **Blocks:** Phase 6 (Usage-based billing), Phase 7 (RaaS Monetization)
- **Blocked by:** None - existing SDK ready
- **Related:** `raas_licenses` table, `UsageMeter` SDK, Edge Functions

## Technical Architecture

```
┌─────────────────┐     ┌────────────────────┐     ┌──────────────────┐
│  React Frontend │────►│   Usage Hooks      │────►│  UsageMeter SDK  │
│  /dashboard/    │     │   useUsage/useQuota│     │  (Phase 4)       │
└─────────────────┘     └────────────────────┘     └──────────────────┘
         │                                              │
         │                                              ▼
         │                                   ┌────────────────────┐
         │                                   │  Edge Functions    │
         │                                   │  /check-quota      │
         │                                   │  /usage-analytics  │
         │                                   └────────────────────┘
         │                                              │
         ▼                                              ▼
┌─────────────────┐                          ┌────────────────────┐
│  Quota Guard    │◄─────────────────────────│  Supabase DB       │
│  (HTTP Interceptor)                        │  usage_records     │
└─────────────────┘                          │  raas_licenses     │
         │                                   └────────────────────┘
         ▼
┌─────────────────┐
│  Stripe/Polar   │
│  Billing Sync   │
└─────────────────┘
```

## Success Criteria

1. **Dashboard Live:** `/dashboard/usage` displays real-time usage with charts
2. **Quota Enforcement:** Users blocked at tier limits (429 responses)
3. **Auto-Tracking:** All API calls tracked without manual intervention
4. **Billing Sync:** Stripe/Polar receive usage events within 60s
5. **Zero Errors:** TypeScript 0 errors, all tests passing

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Performance impact from tracking | Medium | Batch inserts, async tracking |
| False-positive quota blocks | High | Grace period, cache DB limits |
| Webhook duplicate events | Medium | Idempotency keys implemented |
| Dashboard real-time lag | Low | Poll every 30s, optimistic updates |

## Security Considerations

- RLS policies on `usage_records` (user can only read own usage)
- HMAC signature verification for webhook ingestion
- Rate limiting on `/check-quota` endpoint
- License key validation before quota check

## Next Steps

1. Create Phase 1 detailed plan
2. Execute phases sequentially
3. Run tests after each phase
4. Verify production deployment

---

_Last Updated: 2026-03-07_
_Author: Planner Agent_
_Status: Ready for Implementation_
