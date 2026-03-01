---
title: "NiceGUI Architecture Patterns → Well RaaS AGI"
description: "Learn & apply NiceGUI's reactive binding, component composition, storage tiers, and theming patterns to Well ecosystem"
status: pending
priority: P2
effort: 14h
branch: main
tags: [architecture, nicegui, reactive, components, raas, agi, binh-phap, ch10]
created: 2026-03-01
---

# Binh Phap Ch.10 地形: NiceGUI → Well RaaS AGI

> *"Tri bỉ tri kỷ, thắng nãi bất đãi"* — Know terrain, know self; victory is certain.

## Objective

Deep learn architectural patterns from NiceGUI (Python UI framework). Apply reactive binding, component composition, tiered storage, and theming concepts to Well's React/TypeScript distributor portal.

## Research

- [Core: Reactive Binding, Components, WebSocket, Pages, Deployment](./research/researcher-01-nicegui-core.md)
- [DX: Tailwind/Theming, Events, Storage, Custom Elements, Auto-Docs](./research/researcher-02-nicegui-dx.md)

## Implementation Phases

| # | Phase | Effort | Status |
|---|-------|--------|--------|
| 1 | [Reactive Dashboard Binding](./phase-01-reactive-dashboard-binding.md) | 3h | pending |
| 2 | [Compound Widget Components](./phase-02-compound-widget-components.md) | 3h | pending |
| 3 | [Three-Tier Storage Architecture](./phase-03-three-tier-storage.md) | 3h | pending |
| 4 | [Design Token Theme System](./phase-04-design-token-theme-system.md) | 3h | pending |
| 5 | [Event Pipeline & Scheduling](./phase-05-event-pipeline-scheduling.md) | 2h | pending |

## Key NiceGUI Patterns Applied

1. **Reactive binding** → Fine-grained Zustand selectors, auto-refresh widgets
2. **Compound components** → Self-contained widgets with data+loading+error
3. **Three-tier storage** → Supabase (persist) + Zustand (session) + localStorage (UI prefs)
4. **CSS variable theming** → Aura Elite tokens as CSS vars, runtime theme switching
5. **Event debounce/timer** → Throttled search, periodic commission refresh

## Dependencies

- Current stack sufficient (React, Zustand, Tailwind, Supabase)
- No new libraries needed — pattern application only
