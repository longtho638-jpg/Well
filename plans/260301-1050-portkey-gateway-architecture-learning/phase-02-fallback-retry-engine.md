# Phase 2: Fallback & Retry Engine

## Context
- Parent: [plan.md](./plan.md)
- Depends on: [Phase 1](./phase-01-ai-gateway-service-layer.md)
- Inspired by: Portkey's fallback chains + load balancing strategies

## Overview
- **Date:** 2026-03-01
- **Priority:** P1 — Resilience for production AI
- **Implementation:** pending
- **Review:** pending

Add config-driven fallback and retry strategies to the AI gateway. When Gemini Flash fails → try Gemini Pro → try cached response. No more hard failures for users.

## Key Insights

Portkey defines strategies in JSON: `fallback` (sequential try), `loadbalance` (weighted distribution), `conditional` (route by criteria). Strategy = data, not code. Unlimited fallback depth. Health tracking per provider.

**Applied to Well:** Agent calls should NEVER hard-fail. Fallback chain: Gemini Flash (fast, cheap) → Gemini Pro (powerful, expensive) → cached similar response → graceful degradation message. Retry with exponential backoff for transient errors.

## Requirements
- Config-driven fallback chain (JSON, not hardcoded)
- Retry with exponential backoff (max 3 retries)
- Provider health tracking (success/fail rate)
- Graceful degradation — user always gets a response
- Timeout per provider (configurable)

## Architecture

```typescript
// src/shared/services/ai-gateway-strategy.ts
type StrategyType = 'single' | 'fallback' | 'loadbalance';

interface FallbackConfig {
  strategy: 'fallback';
  targets: Array<{
    provider: string;
    model: string;
    timeout: number;       // ms
    weight?: number;       // for loadbalance
  }>;
  retryConfig: {
    maxRetries: number;
    backoffMs: number;     // base delay
    backoffMultiplier: number;
  };
}

// Example config for Well agents
const agentFallbackConfig: FallbackConfig = {
  strategy: 'fallback',
  targets: [
    { provider: 'gemini', model: 'gemini-2.0-flash', timeout: 10000 },
    { provider: 'gemini', model: 'gemini-2.0-pro', timeout: 20000 },
    { provider: 'cache', model: 'semantic-cache', timeout: 1000 },
  ],
  retryConfig: { maxRetries: 2, backoffMs: 500, backoffMultiplier: 2 }
};
```

## Related Code Files
- `src/shared/services/ai-gateway.ts` → from Phase 1
- Supabase Edge Functions → retry logic needed here too
- Agent components → benefit from resilience transparently

## Implementation Steps
1. Define `FallbackConfig` and `RetryConfig` types
2. Create `FallbackStrategy` class — iterates targets on failure
3. Create `RetryHandler` with exponential backoff
4. Add provider health tracker (rolling window success/fail rate)
5. Integrate strategy into `AIGateway.chat()` — wrap provider call with strategy
6. Add `CacheProvider` as last-resort fallback (returns cached similar answer)
7. Create default configs per agent type (coaching=aggressive retry, copilot=fast fail)
8. Add timeout handling with AbortController
9. Log fallback events for observability (Phase 5)

## Todo
- [ ] Define FallbackConfig and RetryConfig types
- [ ] Implement FallbackStrategy class
- [ ] Implement RetryHandler with exponential backoff
- [ ] Add provider health tracking
- [ ] Integrate into AIGateway
- [ ] CacheProvider as fallback target
- [ ] Default configs per agent type
- [ ] Timeout with AbortController
- [ ] Tests (simulate provider failures, verify fallback)

## Success Criteria
- Agent calls succeed even when primary model fails (fallback kicks in)
- Retry respects exponential backoff (no API hammering)
- Health tracker disables unhealthy providers temporarily
- User never sees raw "Gemini API error" — always graceful message

## Risk Assessment
- **Low:** Fallback adds latency on failure — acceptable tradeoff for reliability
- **Medium:** Cache fallback quality — responses may be stale. Mitigate with TTL + similarity threshold

## Security Considerations
- Fallback must not expose different API keys to client
- Rate limiting still applies across fallback chain
- Health tracker data not exposed to client

## Next Steps
- Phase 4 (Caching) provides the CacheProvider used as last fallback target
- Phase 5 (Observability) tracks fallback events
