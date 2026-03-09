# Phase 6: Real-time Analytics Event Streaming & Alerting - Implementation Plan

**Date:** 2026-03-09
**Author:** Planner Agent
**Status:** Ready for Implementation
**Effort:** 12 hours total

---

## Executive Summary

This plan implements comprehensive real-time analytics event streaming and alerting for the WellNexus RaaS platform. The implementation covers 6 phases:

1. **Supabase Realtime Pipeline** - Database triggers and realtime subscriptions
2. **RaaS Gateway Event Emission** - Event emission for 4 key operation types
3. **Dashboard Real-time Widget** - Live event feed, usage charts, alert badges
4. **Alerting Rules Engine** - Configurable rules with KV storage and webhooks
5. **i18n 403 UI Messages** - Vietnamese/English translations for error states
6. **Audit Trail & Export** - API key linking, JWT tracking, JSON/CSV export

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         RaaS Gateway / Worker                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ quota_check  │  │ feature_used │  │access_denied │  │quota_warning│ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │
│         │                 │                 │                 │        │
│         └─────────────────┴─────────────────┴─────────────────┘        │
│                                   │                                     │
│                           Event Emitter                                 │
│                                   │                                     │
└───────────────────────────────────┼─────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
        ┌───────────────┐ ┌───────────────┐ ┌──────────────┐
        │  Supabase     │ │  KV Storage   │ │  Webhook    │
        │  Realtime     │ │  (30d TTL)    │ │  Endpoints  │
        │  (triggers)   │ │  (events)     │ │  (alerts)   │
        └───────┬───────┘ └───────────────┘ └──────────────┘
                │
                ▼
        ┌───────────────┐
        │  Dashboard    │
        │  Components   │
        │  - Event Feed │
        │  - Usage Chart│
        │  - Alert Badge│
        └───────────────┘
```

---

## Phase Details

### Phase 6.1: Supabase Realtime Pipeline (2h)

**Goal:** Enable real-time event streaming from database to dashboard.

**Key Components:**
- Database migration with triggers
- Realtime channel subscriptions
- 5-second event aggregation

**Files:**
- `supabase/migrations/260309_realtime_pipeline.sql`
- `src/hooks/use-raas-realtime-analytics.ts`
- `src/lib/raas-event-aggregator.ts`

**Dependencies:** None (foundational)

---

### Phase 6.2: RaaS Gateway Event Emission (2h)

**Goal:** Emit analytics events from gateway for key operations.

**Event Types:**
| Event | Trigger | Metadata |
|-------|---------|----------|
| `feature_used` | API feature access | `mk_api_key`, `feature_name`, `quota_remaining` |
| `quota_check` | Quota validation | `mk_api_key`, `metric_type`, `current_usage` |
| `access_denied` | 403 response | `mk_api_key`, `jwt_session`, `reason` |
| `quota_warning` | >90% usage | `mk_api_key`, `percentage_used`, `threshold` |

**Files:**
- `src/lib/raas-gateway-event-emitter.ts`
- `workers/raas-gateway-worker/src/event-logging.ts`
- Modify: `src/lib/raas-analytics-events.ts`

**Dependencies:** Phase 6.1 (analytics table)

---

### Phase 6.3: Dashboard Real-time Widget (3h)

**Goal:** Build React components for real-time visualization.

**Components:**
- `RealtimeEventFeed` - Live event stream
- `UsageChart` - Recharts-based usage graph
- `AlertBadge` - Quota warning indicators
- `AnalyticsDashboard` - Composite view

**Files:**
- `src/components/analytics/realtime-event-feed.tsx`
- `src/components/analytics/usage-chart.tsx`
- `src/components/analytics/alert-badge.tsx`
- `src/pages/dashboard/analytics.tsx`

**Dependencies:** Phase 6.1 (realtime subscription)

---

### Phase 6.4: Alerting Rules Engine (2h)

**Goal:** Configurable alerting with KV storage and webhooks.

**Rule Types:**
- `quota_threshold` - Usage > X%
- `feature_blocked` - Access denied N times
- `spending_limit` - Overage cost > $X
- `suspension_imminent` - Dunning active

**Files:**
- `supabase/migrations/260309_alerting_rules.sql`
- `src/lib/raas-alerting-rules-engine.ts`
- `src/lib/raas-default-alert-rules.ts`

**Dependencies:** Phase 6.2 (event emission)

---

### Phase 6.5: i18n 403 UI Messages (1.5h)

**Goal:** Comprehensive i18n for 403 error states.

**Translation Keys:**
- `raas.403.*` - Generic 403 messages
- `raas.quota.*` - Quota exceeded/warning
- `raas.suspension.*` - Suspension states
- `raas.license.*` - License errors

**Files:**
- Modify: `src/locales/vi/raas.ts`
- Modify: `src/locales/en/raas.ts`
- Create: `src/pages/error/403-page.tsx`
- Modify: `src/lib/raas-403-response.ts`

**Dependencies:** None (parallel implementation)

---

### Phase 6.6: Audit Trail & Export (1.5h)

**Goal:** Full audit trail with API key linking and export.

**Features:**
- API key hash linking (mk_*)
- JWT session tracking
- Correlation IDs for event linking
- JSON/CSV export
- 90-day retention policy

**Files:**
- `supabase/migrations/260309_audit_trail.sql`
- `src/lib/raas-audit-trail.ts`
- `src/lib/raas-audit-export-api.ts`
- `src/components/analytics/audit-export-panel.tsx`

**Dependencies:** All previous phases (aggregates events)

---

## Implementation Order

```
Day 1:
├── Phase 6.1: Realtime Pipeline (2h)
├── Phase 6.2: Event Emission (2h)
└── Phase 6.5: i18n Messages (1.5h)

Day 2:
├── Phase 6.3: Dashboard Widget (3h)
├── Phase 6.4: Alerting Rules (2h)
└── Phase 6.6: Audit Trail (1.5h)
```

---

## Testing Strategy

| Phase | Test Type | Coverage |
|-------|-----------|----------|
| 6.1 | Integration | Realtime subscription receives events |
| 6.2 | Unit | Each event type emits correctly |
| 6.3 | Visual/E2E | Dashboard renders, updates in real-time |
| 6.4 | Integration | Rules trigger at correct thresholds |
| 6.5 | i18n | All keys exist in VI/EN |
| 6.6 | Security | API keys properly hashed, exports authorized |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Realtime connection drops | High | Auto-reconnect, fallback polling |
| Event volume overwhelms DB | Medium | Rate limiting, batch aggregation |
| Webhook failures | Low | Retry logic, failure tracking |
| i18n key mismatches | Medium | Automated validation script |
| Audit export performance | Low | Pagination, async processing |

---

## Success Metrics

- [ ] Real-time latency < 2 seconds
- [ ] Event emission success rate > 99%
- [ ] Dashboard renders 100 events without lag
- [ ] Alert rules trigger within 5 seconds
- [ ] i18n coverage 100% (VI/EN)
- [ ] Export handles 10,000 events

---

## Unresolved Questions

1. **KV Storage:** Should we use Cloudflare KV or Supabase JSONB for event logging?
2. **Webhook Security:** Implement HMAC signing or use Supabase secrets?
3. **Retention Policy:** 90 days default - should this be configurable per-org?

---

## Related Reports

- Phase 6.4 Analytics Events: `plans/reports/phase6-4-analytics-events-260309.md`
- Phase 6 License Enforcement: `plans/reports/phase6-license-enforcement-complete-260309.md`

---

**Plan Location:** `/Users/macbookprom1/mekong-cli/apps/well/plans/260309-1202-realtime-analytics-streaming/`

**Next Step:** Begin Phase 6.1 implementation (Supabase Realtime Pipeline)
