# Portkey AI Gateway — Core Architecture Research

## 1. Universal LLM Gateway Pattern
**Problem:** Apps hardcode to one LLM provider. Switching providers = rewrite. No failover.
**Solution:** Single unified API (OpenAI-compatible) that translates to 250+ providers. One endpoint, provider specified in config. Request/response transformers per provider. Zero app-code changes to switch providers.
**Key decisions:** OpenAI API format as lingua franca. Provider-specific params mapped transparently. Streaming support universal. Single gateway URL replaces all provider URLs.
**Extensibility:** New provider = new transformer file. No gateway core changes.
**Well lesson:** AI service layer should abstract Gemini behind gateway pattern. Future-proof for switching to Claude/GPT/local models without touching agent code.

## 2. Fallback & Retry Strategy
**Problem:** LLM APIs have rate limits, outages, varying latency. Single provider = single point of failure.
**Solution:** Config-driven strategies: `single` (one provider), `fallback` (try A, fail → B, fail → C), `loadbalance` (round-robin/weighted), `conditional` (route by model/content). Retry with exponential backoff. Timeout per provider.
**Key decisions:** Strategy defined in JSON config, not code. Fallback chain unlimited depth. Health checks track provider status. Automatic failover transparent to caller.
**Well lesson:** Agent AI calls should have fallback config. Primary: Gemini Flash → Fallback: Gemini Pro → Fallback: cached response. Retry logic in service layer, not components.

## 3. Guardrails & Middleware Pipeline
**Problem:** LLM outputs need validation (no PII, no harmful content, format compliance).
**Solution:** Pre-request hooks (input validation, PII scrubbing) → LLM call → Post-response hooks (output validation, format check, content filter). Middleware pipeline composable per route.
**Key decisions:** Hooks are async functions receiving request/response. Can modify, reject, or pass through. Ordered execution. Each hook independent (can add/remove without affecting others).
**Well lesson:** Agent middleware pipeline: input sanitization → Gemini call → output validation → response formatting. Add guardrails for agent responses (no financial advice violations, Vietnamese compliance).

## 4. Caching Layer
**Problem:** Identical LLM queries waste tokens/money. Repeated questions = repeated cost.
**Solution:** Two modes: Simple cache (exact match on prompt hash) and Semantic cache (embedding-based similarity match). Configurable TTL. Cache key = hash(model + messages + params). Cost savings 40-60% on repeated queries.
**Key decisions:** Cache sits before provider call. Cache hit = skip LLM entirely. Semantic cache threshold configurable (0.0-1.0 similarity). Cache per virtual key (multi-tenant).
**Well lesson:** Cache frequent agent queries (product info, commission rules, common coaching Q&A). Simple cache for exact matches. Huge cost savings for distributor copilot — many ask same questions.

## 5. Virtual Keys & Budget Management
**Problem:** Direct API keys expose credentials. No per-team budget control. No usage tracking granularity.
**Solution:** Virtual keys map to real API keys server-side. Each virtual key has: rate limit, budget cap, usage tracking, team assignment. Revoke virtual key = no credential rotation needed.
**Key decisions:** Virtual key = abstraction layer. Real keys never leave server. Budget alerts at 80%/100%. Usage tracked per request (tokens, cost, latency). Team-level aggregation.
**Well lesson:** Agent usage quotas per distributor rank. Track AI token consumption per user. Budget caps prevent abuse. Usage analytics for admin dashboard — which agents used most, by whom.
