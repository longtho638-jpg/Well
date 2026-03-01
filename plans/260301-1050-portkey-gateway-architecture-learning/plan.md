---
title: "Portkey AI Gateway Patterns → Well RaaS AGI"
description: "Learn & apply Portkey's gateway, fallback, guardrails, caching, and observability patterns to Well AI agent ecosystem"
status: pending
priority: P2
effort: 18h
branch: main
tags: [architecture, portkey, gateway, ai, raas, agi, binh-phap, ch6]
created: 2026-03-01
---

# Binh Phap Ch.6 虛實: Portkey AI Gateway → Well RaaS AGI

> *"Tỵ thực nhi kích hư"* — Avoid strength, strike weakness. Master the flow of AI resources.

## Objective

Deep learn architectural patterns from Portkey AI Gateway (open-source LLM gateway for 250+ providers). Apply concepts to Well's AI agent ecosystem — building resilient, observable, cost-efficient AI infrastructure.

## Research

- [Core: Gateway, Fallback, Guardrails, Caching, Virtual Keys](./research/researcher-01-portkey-core-gateway.md)
- [Config: Routing, Observability, Plugins, Multimodal, Edge](./research/researcher-02-portkey-observability-config.md)

## Implementation Phases

| # | Phase | Effort | Status |
|---|-------|--------|--------|
| 1 | [AI Gateway Service Layer](./phase-01-ai-gateway-service-layer.md) | 4h | pending |
| 2 | [Fallback & Retry Engine](./phase-02-fallback-retry-engine.md) | 3h | pending |
| 3 | [Agent Guardrails Pipeline](./phase-03-agent-guardrails-pipeline.md) | 3h | pending |
| 4 | [Response Caching Layer](./phase-04-response-caching-layer.md) | 3h | pending |
| 5 | [AI Usage Observability](./phase-05-ai-usage-observability.md) | 3h | pending |
| 6 | [Config-Driven Agent Routing](./phase-06-config-driven-agent-routing.md) | 2h | pending |

## Key Portkey Patterns Applied

1. **Universal Gateway** → Abstract Gemini behind provider-agnostic service layer
2. **Fallback chains** → Gemini Flash → Pro → cached response fallback
3. **Guardrails middleware** → Pre/post hooks for input sanitization + output validation
4. **Semantic caching** → Cache repeated agent queries, reduce token cost 40-60%
5. **Observability** → Log every AI call with tokens, cost, latency, user context
6. **Config routing** → JSON-defined agent routing strategies, runtime switchable

## Dependencies

- Current: Supabase Edge Functions for Gemini calls
- No new providers needed — patterns apply to existing Gemini integration
- Supabase DB for cache storage + usage logging
