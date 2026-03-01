# Phase 4: Response Caching Layer

## Context
- Parent: [plan.md](./plan.md)
- Depends on: [Phase 1](./phase-01-ai-gateway-service-layer.md)
- Inspired by: Portkey's simple + semantic caching for LLM responses

## Overview
- **Date:** 2026-03-01
- **Priority:** P2
- **Implementation:** pending
- **Review:** pending

Add caching layer to AI gateway — exact-match cache for identical queries + fuzzy match for similar questions. Target 40-60% cache hit rate on agent queries, significant token cost reduction.

## Key Insights

Portkey's caching: simple cache (hash match) + semantic cache (embedding similarity). Cache sits BEFORE provider call. Cache key = hash(model + messages + params). TTL per cache entry. Multi-tenant via virtual keys.

**Applied to Well:** Distributors ask similar questions repeatedly ("how to recruit?", "what's my commission rate?", product info). Cache these responses. Huge cost savings. Faster response time.

## Requirements
- Simple cache: exact prompt hash match
- Semantic cache: embedding-based similarity (threshold configurable)
- TTL per cache entry (default 1h for coaching, 24h for product info)
- Cache scoping: per-agent, per-user, or global
- Cache invalidation on data changes (new products, commission updates)

## Architecture

```typescript
// src/shared/services/ai-cache.ts
interface CacheEntry {
  key: string;              // hash of messages + model
  response: AIResponse;
  embedding?: number[];     // for semantic matching
  createdAt: number;
  ttlMs: number;
  agentId: string;
  scope: 'global' | 'agent' | 'user';
}

class AICache {
  async get(messages: AIMessage[], opts: CacheOpts): Promise<AIResponse | null>;
  async set(messages: AIMessage[], response: AIResponse, opts: CacheOpts): void;
  async invalidate(pattern: string): void;
  async getStats(): Promise<CacheStats>;  // hit rate, size, savings
}

// Cache integrated into gateway flow:
// Request → Guardrails(pre) → Cache.get() → [HIT: return] / [MISS: Provider.chat()] → Cache.set() → Guardrails(post) → Response
```

## Implementation Steps
1. Define `CacheEntry`, `CacheOpts`, `CacheStats` types
2. Create `AICache` with in-memory Map + Supabase persistence
3. Implement exact-match cache (SHA-256 hash of normalized messages)
4. Add TTL management (check expiry on get, periodic cleanup)
5. Implement semantic cache using Gemini embeddings (similarity threshold 0.92)
6. Add cache scope logic (global for product FAQ, per-user for personal coaching)
7. Integrate into AIGateway flow (check cache before provider call)
8. Create cache stats method (hit rate, token savings, entry count)
9. Add cache invalidation hooks (when products/commissions update)
10. Wire CacheProvider as fallback target for Phase 2

## Todo
- [ ] Define cache types
- [ ] Implement in-memory cache with hash matching
- [ ] Add TTL management
- [ ] Implement semantic cache with embeddings
- [ ] Cache scope logic (global/agent/user)
- [ ] Integrate into AIGateway
- [ ] Cache stats and analytics
- [ ] Invalidation hooks
- [ ] Tests (hit/miss/expiry/semantic matching)

## Success Criteria
- Cache hit rate >40% for coaching agent (many similar questions)
- Response time <100ms for cache hits (vs 1-3s for provider)
- Token cost reduced by measurable amount (track via observability)
- Cache invalidated when underlying data changes

## Risk Assessment
- **Medium:** Semantic cache returns stale/wrong answers — mitigate with high similarity threshold (0.92+)
- **Low:** Memory usage — cap cache size, evict LRU

## Security Considerations
- Cache entries scoped — user A cannot see user B's cached conversations
- Sensitive conversations (financial data) excluded from global cache
- Cache stored in Supabase with RLS per user scope

## Next Steps
- Phase 5 (Observability) tracks cache hit rates and cost savings
- Phase 2 uses CacheProvider as last-resort fallback
