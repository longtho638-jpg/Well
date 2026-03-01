---
title: "Cal.com Architecture Patterns → Well RaaS AGI"
description: "Learn & apply Cal.com's monorepo, tRPC, app store, workflow engine, and embed patterns to Well distributor ecosystem"
status: pending
priority: P2
effort: 20h
branch: main
tags: [architecture, calcom, raas, agi, binh-phap, ch12]
created: 2026-03-01
---

# Binh Phap Ch.12 火攻: Cal.com → Well RaaS AGI

> *"Phát hỏa hữu thời, khởi hỏa hữu nhật"* — Strike with fire at the right time, on the right day.

## Objective

Deep learn 10 architectural patterns from Cal.com's open-source scheduling platform. Apply concepts (NOT code) to Well's distributor portal + admin panel + agent system.

## Research

- [Backend: Monorepo, tRPC, App Store, Multi-tenancy](./research/researcher-01-calcom-backend.md)
- [Frontend: UI System, Embed SDK, Billing, Workflows](./research/researcher-02-calcom-frontend-platform.md)

## Implementation Phases

| # | Phase | Effort | Status |
|---|-------|--------|--------|
| 1 | [Modular Package Architecture](./phase-01-modular-package-architecture.md) | 4h | pending |
| 2 | [Type-Safe Service Layer](./phase-02-type-safe-service-layer.md) | 4h | pending |
| 3 | [App Store Agent Registry](./phase-03-app-store-agent-registry.md) | 4h | pending |
| 4 | [Workflow Automation Engine](./phase-04-workflow-automation-engine.md) | 4h | pending |
| 5 | [Compound UI Component System](./phase-05-compound-ui-component-system.md) | 2h | pending |
| 6 | [Feature Gating & Rank System](./phase-06-feature-gating-rank-system.md) | 2h | pending |

## Key Cal.com Patterns Applied

1. **Monorepo thinking** → Modular src/ with clear package boundaries
2. **tRPC router pattern** → Type-safe service layer with Zod validation
3. **App Store model** → Plugin-based agent registry with standard interfaces
4. **Workflow engine** → Trigger→Step automation for distributor events
5. **@calcom/ui** → Compound components + design tokens for Aura Elite
6. **Feature gating** → Rank-based access control (Member→Partner→Founder)

## Dependencies

- Current codebase: React 19, Vite 7, TypeScript 5.7+, Zustand, Supabase
- No new external dependencies required (pattern application, not library migration)
