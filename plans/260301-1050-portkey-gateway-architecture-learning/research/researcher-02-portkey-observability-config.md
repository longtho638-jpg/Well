# Portkey AI Gateway — Observability & Config Research

## 1. Gateway Config System
**Problem:** Routing strategies hardcoded = inflexible. Changing provider/fallback = redeploy.
**Solution:** JSON config object defines entire routing strategy. Config types: `single`, `fallback`, `loadbalance`, `conditional`. Configs composable (nest loadbalance inside fallback). Runtime switchable via header (`x-portkey-config`).
**Key decisions:** Config is data, not code. Versioned configs. A/B testing via config switching. Conditional routing based on request metadata (model, content type, user tier).
**Well lesson:** Agent routing config as JSON. Different agent configs per distributor rank (basic → pro features). A/B test different AI models per user segment. Config versioning for rollback.

## 2. Observability & Logging
**Problem:** LLM calls are black boxes. No visibility into latency, cost, errors, quality.
**Solution:** Every request logged: input, output, latency, tokens (prompt + completion), cost, provider, model, status, metadata. Dashboard shows: requests/min, avg latency, error rate, cost/day, token usage trends. Traces link related calls.
**Key decisions:** Structured JSON logs. Custom metadata tags per request (user_id, agent_type, feature). Filterable by any dimension. Export to analytics. Real-time streaming of logs.
**Well lesson:** Log every Gemini call with: agent_id, user_id, tokens, latency, cost estimate. Admin dashboard: AI usage analytics (which agents, how much, who). Cost tracking per distributor. Performance monitoring per agent type.

## 3. Provider Plugin System
**Problem:** 250+ providers, each with different API format, auth, streaming, error codes.
**Solution:** Provider interface: `chatComplete(params)`, `embed(params)`, `complete(params)`. Each provider implements interface with request/response transformers. Header mapping. Error code normalization. Streaming adapter (SSE/WebSocket → unified stream).
**Key decisions:** Provider = folder with handler + transformer. OpenAI format as canonical. Transform inbound (OpenAI → provider-native) and outbound (provider-native → OpenAI). Provider auto-detected from model name.
**Well lesson:** Service adapter pattern for external APIs. Each integration (PayOS, Resend, Gemini) implements standard interface. Error normalization across services. Response transformation to unified format.

## 4. Multimodal Support
**Problem:** Different modalities (text, image, audio, embeddings) = different APIs, formats, costs.
**Solution:** Unified API handles all modalities. Route by endpoint: `/chat/completions` (text), `/images/generations` (image), `/embeddings` (vector), `/audio/transcriptions` (audio). Provider capabilities declared in config (supports_vision, supports_audio).
**Key decisions:** Capability-based routing (if provider doesn't support vision → fallback to one that does). Input format normalization (base64/URL for images). Token counting per modality.
**Well lesson:** Agent system should declare capabilities. Coach Agent: text-only. Product Agent: text + image (product photos). Future: voice agent for phone sales. Capability-based routing to correct Gemini model (Flash for text, Pro for multimodal).

## 5. Edge Deployment & Performance
**Problem:** Gateway = extra hop. Must not add significant latency.
**Solution:** Deploy on edge (Cloudflare Workers, Vercel Edge). Sub-5ms gateway overhead. Streaming passthrough (no buffering full response). Connection pooling to providers. Keep-alive connections.
**Key decisions:** Stateless gateway (all state in external store). Edge-first architecture. Response streaming critical for UX. Cache at edge for lowest latency. Worker-based (no cold start like serverless functions).
**Well lesson:** Supabase Edge Functions already edge-deployed. AI gateway logic in Edge Functions adds minimal latency. Stream Gemini responses through Edge Function to client. Cache at edge for repeated queries.
