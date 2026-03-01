---
title: "Binh Phap Ch.7 軍爭: Railway/Nixpacks → Well RaaS AGI"
status: in_progress
priority: P1
effort: 8h
branch: main
tags: [architecture, railway, nixpacks, raas-agi, agents, binh-phap, ch7]
created: 2026-03-01
---

# Binh Phap Ch.7 軍爭: Railway/Nixpacks → Well RaaS AGI

> *"Quân tranh chi nan giả, dĩ vu vi trực"* — Make the devious route direct.

## Research Sources

- [Railway/Nixpacks Architecture](../reports/researcher-260301-1132-railway-nixpacks-architecture.md)
- [RaaS AGI Agent Patterns](../reports/researcher-260301-1132-raas-agi-agent-patterns.md)
- [Vercel AI SDK Implementation (completed)](../260301-1103-vercel-ai-architecture-implementation/plan.md)

## Architecture Mapping: Railway/Nixpacks → Well Agent-OS

| Nixpacks Pattern | Well Implementation | Status |
|---|---|---|
| Plan→Build→Deploy | Agent Orchestrator (detect intent → compose pipeline → execute) | Phase 1 |
| Auto-detection | Agent intent classifier (route to health-coach/sales-copilot) | Phase 2 |
| Provider system | AI Provider abstraction (already done Phase 3 Vercel plan) | ✅ |
| Service composition | Tool executor registry (already done Phase 4 Vercel plan) | ✅ |
| Streaming | SSE streaming UI (already done Phase 5 Vercel plan) | ✅ |

## Implementation Phases

| # | Phase | Effort | Status |
|---|---|---|---|
| 1 | Agent Orchestrator (Supervisor Pattern) | 2h | 🔄 |
| 2 | Agent Intent Router | 1h | pending |
| 3 | Production Code Audit & Fixes | 1h | 🔄 |
| 4 | Build + Test + GREEN GOLIVE | 1h | pending |

## What's Already Done (from Vercel AI Plan)

- ✅ useAgentChat hook (streaming SSE)
- ✅ Structured agent responses (Zod schemas)
- ✅ AI Provider abstraction
- ✅ Tool calling system (commission, product, team metrics)
- ✅ Streaming UI components
