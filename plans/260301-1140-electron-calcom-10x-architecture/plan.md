---
title: "Electron + Cal.com 10x Architecture for Well RaaS AGI"
description: "Map Electron IPC/security and Cal.com webhook/multi-tenancy patterns onto Well's existing agent system"
status: pending
priority: P1
effort: 12h
branch: main
tags: [architecture, agents, security, performance, webhooks]
created: 2026-03-01
---

# Electron + Cal.com 10x Architecture for Well RaaS AGI

## Strategy

Map battle-tested patterns from Electron (IPC, sandboxing, crash recovery) and Cal.com (webhooks, feature modules, tRPC type safety) onto Well's **existing** agent architecture. All changes are INCREMENTAL -- extend vibe-* SDKs, never restructure.

## Current Architecture Strengths (Keep)

- `BaseAgent` + `AgentRegistry` singleton + orchestration (intent classifier + supervisor)
- `vibe-*` SDK pattern (8 SDKs: auth, agent, i18n, payment, subscription, supabase, tenant, ui)
- Agent tools with Zod validation (commission, product, team-metrics)
- ErrorBoundary with Sentry integration
- Security headers in vercel.json (CSP, HSTS, X-Frame-Options)
- Route-based lazy loading already in 5 pages

## Phases

| # | Phase | Effort | Key Deliverable |
|---|-------|--------|-----------------|
| 1 | [Agent Event Bus & IPC](./phase-01-agent-event-bus-ipc.md) | 3h | `vibe-event-bus` SDK + typed EventEmitter for inter-agent comms |
| 2 | [Agent Security Sandbox](./phase-02-agent-security-sandbox.md) | 2h | Permission model + context isolation for agent execution |
| 3 | [Webhook Dispatcher](./phase-03-webhook-dispatcher.md) | 3h | Event-driven webhook system for orders/commissions/agents |
| 4 | [Agent Error Boundaries & Recovery](./phase-04-agent-error-boundaries.md) | 2h | Per-agent error isolation + crash recovery + circuit breaker |
| 5 | [Performance & Code Splitting](./phase-05-performance-optimization.md) | 2h | Deep code splitting, prefetch, Web Workers, CSP tightening |

## Dependencies

```
Phase 1 (Event Bus) -----> Phase 3 (Webhooks use event bus)
Phase 2 (Sandbox)  -----> Phase 4 (Recovery uses permission model)
Phase 5 (Performance) --- Independent, can run parallel
```

## Research Reports

- [Electron Architecture Patterns](../reports/researcher-260301-1140-electron-architecture-patterns.md)
- [Electron Security & Perf](../reports/researcher-260301-1140-electron-security-perf-patterns.md)
- [Cal.com Core Architecture](../reports/researcher-260301-1140-calcom-core-architecture.md)

## Success Criteria

- [ ] All 349+ existing tests pass
- [ ] Event bus enables agent-to-agent communication without direct imports
- [ ] Agent sandbox prevents unauthorized tool/data access
- [ ] Webhook dispatcher fires on order/commission/agent events
- [ ] Agent errors isolated -- one agent crash doesn't break others
- [ ] Bundle size per route < 100KB gzipped
- [ ] Build passes with 0 TypeScript errors

## Unresolved Questions

1. Should webhook delivery use Supabase Edge Functions or client-side queue?
2. Web Worker overhead vs inline for commission calculations -- needs profiling
3. Agent state persistence strategy (Zustand persist vs Supabase) for crash recovery
