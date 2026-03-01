# Phase 1: AI Gateway Service Layer

## Context
- Parent: [plan.md](./plan.md)
- Inspired by: Portkey's universal gateway — single API abstracting 250+ providers
- Docs: [system-architecture.md](../../docs/system-architecture.md)

## Overview
- **Date:** 2026-03-01
- **Priority:** P1 — Foundation for all AI-related phases
- **Implementation:** pending
- **Review:** pending

Create a unified AI gateway service that abstracts the Gemini provider behind a standard interface. Future-proofs for provider switching without touching agent code.

## Key Insights

Portkey uses OpenAI-compatible API as lingua franca. All 250+ providers mapped to ONE format. Apps call gateway, never provider directly. Provider = implementation detail.

**Applied to Well:** All agent code calls `AIGateway.chat()`, never Gemini SDK directly. Gateway handles: provider selection, request formatting, response normalization, error handling. Switching from Gemini to Claude = change gateway config, zero agent code changes.

## Requirements
- All AI calls routed through gateway service (no direct Gemini calls in components)
- Provider-agnostic interface: `chat()`, `embed()`, `classify()`
- Streaming support for real-time responses
- Error normalization (Gemini errors → standard format)

## Architecture

```typescript
// src/shared/services/ai-gateway.ts
interface AIGatewayConfig {
  provider: 'gemini' | 'openai' | 'anthropic';
  model: string;
  maxTokens: number;
  temperature: number;
}

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  content: string;
  tokens: { prompt: number; completion: number; total: number };
  latencyMs: number;
  model: string;
  cached: boolean;
}

class AIGateway {
  private config: AIGatewayConfig;
  private provider: AIProvider;

  async chat(messages: AIMessage[], opts?: ChatOpts): Promise<AIResponse>;
  async chatStream(messages: AIMessage[], opts?: ChatOpts): AsyncIterable<string>;
  async embed(text: string): Promise<number[]>;
}

// Provider interface (Portkey-inspired)
interface AIProvider {
  chat(params: ProviderChatParams): Promise<ProviderResponse>;
  chatStream(params: ProviderChatParams): AsyncIterable<ProviderChunk>;
  transformRequest(messages: AIMessage[]): ProviderChatParams;
  transformResponse(raw: ProviderResponse): AIResponse;
  normalizeError(error: unknown): AIGatewayError;
}
```

## Related Code Files
- `src/services/gemini*` → current direct Gemini calls
- Supabase Edge Functions → `gemini-chat` function
- Agent components using Gemini → to refactor through gateway

## Implementation Steps
1. Define `AIGateway`, `AIProvider`, `AIMessage`, `AIResponse` interfaces
2. Create `GeminiProvider` implementing `AIProvider` (wrap existing Gemini logic)
3. Create `AIGateway` class with provider injection
4. Add streaming support (`chatStream` using async iterables)
5. Implement error normalization (Gemini error codes → standard `AIGatewayError`)
6. Create gateway singleton with config from env vars
7. Refactor all agent services to use `AIGateway.chat()` instead of direct Gemini
8. Update Supabase Edge Function to use gateway pattern
9. Add provider health check endpoint

## Todo
- [ ] Define core interfaces (AIGateway, AIProvider, AIMessage, AIResponse)
- [ ] Implement GeminiProvider with request/response transformers
- [ ] Create AIGateway class with singleton pattern
- [ ] Add streaming support (AsyncIterable)
- [ ] Error normalization layer
- [ ] Refactor agent services to use gateway
- [ ] Update Edge Function
- [ ] Tests for gateway + provider

## Success Criteria
- `grep -r "gemini" src/modules/agents/` = 0 (agents never call Gemini directly)
- All AI calls flow through `AIGateway`
- Streaming works for real-time agent responses
- Error messages consistent regardless of provider

## Risk Assessment
- **Low:** Wrapping existing Gemini calls — additive, not destructive
- **Low:** Streaming complexity — Gemini already supports SSE, just normalize format

## Security Considerations
- API keys ONLY in Edge Function (never client-side) — unchanged
- Gateway adds no new attack surface — same Supabase proxy pattern
- Request logging must NOT include PII or sensitive conversation content

## Next Steps
- Phase 2 builds fallback/retry on top of this gateway
- Phase 3 adds guardrails as middleware to this gateway
- Phase 4 adds caching layer before gateway provider call
