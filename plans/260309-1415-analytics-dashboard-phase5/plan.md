---
title: "Analytics Dashboard Phase 5: Real-time Usage Analytics"
description: "RaaS Gateway integration, usage dashboard with charts, real-time sync, mockable hooks"
status: pending
priority: P1
effort: 8h
branch: main
tags: [analytics, dashboard, raas, phase-5]
created: 2026-03-09
---

# Analytics Dashboard Phase 5: Real-time Usage Analytics

## Overview

Build real-time usage analytics dashboard with RaaS Gateway integration, chart visualization, and mockable service layers.

**Status:** 🟡 In Progress - Phase 1 implementation

## Phases

| Phase | Component | Status | Effort |
|-------|-----------|--------|--------|
| 1 | RaaS Gateway Integration | 🟡 pending | 2h |
| 2 | Usage Dashboard UI | 🟡 pending | 2.5h |
| 3 | Chart Components | 🟡 pending | 2h |
| 4 | Data Hooks & Services | 🟡 pending | 1.5h |

## Dependencies

- ✅ RealtimeQuotaTracker component (Phase 7 complete)
- ✅ UsageNotificationService (Phase 7 complete)
- ✅ use-raas-analytics-stream hook (exists)
- ✅ use-usage-analytics hook (exists)
- ⏳ RaaS Gateway `/metrics` endpoints

## Related Files

**Existing:**
- `src/hooks/use-raas-analytics-stream.ts` - Real-time event streaming
- `src/hooks/use-usage-analytics.ts` - Usage trends & quota
- `src/components/billing/RealtimeQuotaTracker.tsx` - Quota display
- `src/services/usage-notification-service.ts` - Alert orchestration
- `src/lib/raas-http-interceptor.ts` - License header injection
- `supabase/functions/send-overage-alert/` - Email/SMS/Webhook delivery

**To Create:**
- `src/hooks/use-raas-metrics.ts` - RaaS Gateway metrics polling
- `src/components/analytics/UsageChart.tsx` - Recharts visualization
- `src/components/analytics/UsageDashboard.tsx` - Main dashboard container
- `src/services/raas-metrics-service.ts` - Metrics API client
- `src/lib/raas-gateway-metrics.ts` - Gateway sync logic

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    RaaS Gateway (raas.agencyos.network)          │
│  GET /v1/metrics/usage  →  JWT + mk_ API key auth               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS (polling 30s)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  src/services/raas-metrics-service.ts                            │
│  - Fetch metrics with license key                               │
│  - Transform to local schema                                    │
│  - Mock adapter for testing                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  src/hooks/use-raas-metrics.ts                                   │
│  - Polling with exponential backoff                            │
│  - Cache + deduplication                                       │
│  - Error handling + retry                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  src/components/analytics/UsageDashboard.tsx                     │
│  - UsageChart (Recharts)                                       │
│  - RealtimeQuotaTracker (existing)                             │
│  - Overage alerts display                                      │
│  - Historical trends                                           │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Steps

### Phase 1: RaaS Gateway Integration (2h)

**Goal:** Connect to RaaS Gateway metrics endpoints with JWT + API key auth.

**Tasks:**
- [ ] Create `src/lib/raas-gateway-metrics.ts` - Gateway client
- [ ] Implement JWT token exchange with `mk_` API key
- [ ] Add retry logic with exponential backoff
- [ ] Create mock adapter for local dev/testing
- [ ] Write unit tests for gateway client

**Success:** Gateway client fetches metrics, handles auth, has 90%+ test coverage.

---

### Phase 2: Usage Dashboard UI (2.5h)

**Goal:** Main dashboard container with metrics overview and alerts.

**Tasks:**
- [ ] Create `src/components/analytics/UsageDashboard.tsx`
- [ ] Add summary cards (API calls, AI calls, Storage, Compute)
- [ ] Integrate RealtimeQuotaTracker component
- [ ] Display overage alerts with i18n
- [ ] Add date range picker (7d/30d/90d)
- [ ] Loading skeletons and error states

**Success:** Dashboard renders, shows live quota, displays historical summary.

---

### Phase 3: Chart Components (2h)

**Goal:** Lightweight charts for usage trends visualization.

**Tasks:**
- [ ] Install Recharts: `npm install recharts`
- [ ] Create `src/components/analytics/UsageChart.tsx`
- [ ] Implement line chart for daily usage trends
- [ ] Add bar chart for quota utilization by tier
- [ ] Tooltip with i18n labels
- [ ] Responsive design (mobile/desktop)

**Success:** Charts render trends data, responsive, tooltips show details.

---

### Phase 4: Data Hooks & Services (1.5h)

**Goal:** Mockable service layer with unified hook API.

**Tasks:**
- [ ] Create `src/services/raas-metrics-service.ts`
- [ ] Implement `IRaaSMetricsService` interface for mocking
- [ ] Create `src/hooks/use-raas-metrics.ts` hook
- [ ] Add polling with configurable interval (default 30s)
- [ ] Write unit tests with mocked service
- [ ] Integration test with RealtimeQuotaTracker

**Success:** Hooks are mockable, tests pass, no hardcoded dependencies.

---

## Success Criteria

- [ ] RaaS Gateway metrics endpoint integrated with JWT auth
- [ ] Dashboard displays real-time quota + historical trends
- [ ] Charts render usage data with Recharts
- [ ] Service layer is mockable for unit tests
- [ ] All components have unit tests (80%+ coverage)
- [ ] i18n support (VI/EN) for all labels
- [ ] Zero TypeScript errors, zero `any` types
- [ ] Build passes in < 10s

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| RaaS Gateway API unstable | High | Mock adapter, retry logic, circuit breaker |
| Chart performance issues | Medium | Virtual scrolling, data sampling |
| Auth token expiration | Medium | Auto-refresh tokens, 401 handling |
| Rate limiting | Low | Polling interval >= 30s, caching |

## Unresolved Questions

1. What is the exact RaaS Gateway metrics endpoint URL structure?
2. Should we support WebSocket streaming or HTTP polling only?
3. What's the max data points for charts before performance degrades?
