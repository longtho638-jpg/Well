---
title: "Phase 6: Real-time Analytics Event Streaming & Alerting"
description: "Supabase Realtime pipeline, RaaS Gateway event emission, dashboard widgets, alerting rules, i18n 403 messages, audit trail"
status: in-progress
priority: P1
effort: 12h
branch: main
tags: [raas, analytics, realtime, alerting, phase-6]
created: 2026-03-09
---

# Phase 6: Real-time Analytics Event Streaming & Alerting

## Overview

Implementation plan for real-time analytics event streaming, alerting infrastructure, and enhanced 403 UI with i18n support.

## Phases

| Phase | Component | Status | Effort |
|-------|-----------|--------|--------|
| 1 | Supabase Realtime Pipeline | pending | 2h |
| 2 | RaaS Gateway Event Emission | pending | 2h |
| 3 | Dashboard Real-time Widget | pending | 3h |
| 4 | Alerting Rules Engine | pending | 2h |
| 5 | i18n 403 UI Messages | pending | 1.5h |
| 6 | Audit Trail & Export | pending | 1.5h |

## Dependencies

- Phase 6.1 → Phase 6.2 (events need emission layer)
- Phase 6.2 → Phase 6.3 (emission feeds dashboard)
- Phase 6.4 → Phase 6.3 (alerting rules power dashboard badges)
- Phase 6.5 → Phase 6.2 (i18n messages used in 403 responses)
- Phase 6.6 → All (audit trail aggregates all events)

## Related Files

- `src/lib/raas-analytics-events.ts` - Event emitter (existing)
- `src/lib/raas-gateway-client.ts` - Gateway client (existing)
- `src/lib/raas-suspension-logic.ts` - Suspension logic (existing)
- `src/lib/raas-403-response.ts` - 403 response builder (existing)
- `supabase/migrations/260309_raas_analytics_events.sql` - Analytics table (existing)

## Success Criteria

- [ ] Real-time event streaming via Supabase Realtime
- [ ] Event emission from RaaS Gateway (4 event types)
- [ ] Dashboard widget with live feed + usage chart
- [ ] Alerting rules engine with KV storage
- [ ] i18n messages for 403 UI (VI/EN)
- [ ] Audit trail with export capability

## Unresolved Questions

1. Should we use Supabase Realtime broadcasts or database changes for event streaming?
2. What's the optimal batch size for event aggregation (5s recommended)?
3. Should webhook notifications be configured per-org or globally?
