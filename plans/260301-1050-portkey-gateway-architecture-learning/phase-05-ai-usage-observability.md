# Phase 5: AI Usage Observability

## Context
- Parent: [plan.md](./plan.md)
- Depends on: [Phase 1](./phase-01-ai-gateway-service-layer.md)
- Inspired by: Portkey's request logging, cost tracking, usage analytics dashboard

## Overview
- **Date:** 2026-03-01
- **Priority:** P2
- **Implementation:** pending
- **Review:** pending

Add comprehensive logging and analytics for every AI call — tokens, cost, latency, agent, user, cache status. Admin dashboard shows AI usage trends, cost per distributor, agent performance.

## Key Insights

Portkey logs every request: input/output, tokens (prompt+completion), cost, latency, provider, model, metadata. Dashboard: requests/min, avg latency, error rate, cost/day. Custom metadata tags filterable.

**Applied to Well:** Track AI costs per distributor (who uses AI most). Monitor agent performance (which agents are slow/expensive). Budget alerts when usage spikes. Admin dashboard for AI analytics.

## Requirements
- Log every AI gateway call to Supabase `ai_usage_logs` table
- Track: tokens, estimated cost, latency, agent_id, user_id, cache_hit, model
- Admin dashboard widget for AI usage analytics
- Budget alerts (configurable thresholds)
- No PII in logs (strip conversation content, keep metadata)

## Architecture

```typescript
// src/shared/services/ai-observability.ts
interface AIUsageLog {
  id: string;
  timestamp: Date;
  agentId: string;
  userId: string;
  model: string;
  tokensPrompt: number;
  tokensCompletion: number;
  tokensTotal: number;
  estimatedCostUsd: number;
  latencyMs: number;
  cacheHit: boolean;
  fallbackUsed: boolean;
  guardrailBlocked: boolean;
  status: 'success' | 'error' | 'blocked';
}

// Admin dashboard queries
interface AIUsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCostUsd: number;
  avgLatencyMs: number;
  cacheHitRate: number;
  topAgents: Array<{ agentId: string; requests: number; cost: number }>;
  topUsers: Array<{ userId: string; requests: number; cost: number }>;
  dailyTrend: Array<{ date: string; requests: number; cost: number }>;
}
```

## Implementation Steps
1. Create `ai_usage_logs` table in Supabase (migration)
2. Define `AIUsageLog` type and logging service
3. Integrate logger into AIGateway (log after every call, including failures)
4. Add cost estimation per model (Gemini Flash vs Pro pricing)
5. Create `getAIUsageStats()` Edge Function for admin queries
6. Add AI Usage widget to Admin Dashboard (Recharts line/bar charts)
7. Implement budget alert system (threshold-based notifications)
8. Add RLS — distributors see own usage, admins see all
9. Periodic aggregation job (daily summaries for fast dashboard queries)

## Todo
- [ ] Create ai_usage_logs Supabase table
- [ ] Implement logging service
- [ ] Integrate into AIGateway
- [ ] Cost estimation per model
- [ ] Admin Edge Function for stats queries
- [ ] Admin Dashboard AI Usage widget
- [ ] Budget alert system
- [ ] RLS policies
- [ ] Tests

## Success Criteria
- Every AI call logged with full metadata
- Admin dashboard shows real-time AI usage trends
- Cost tracking accurate within 5% of actual billing
- Cache hit rate visible and trending upward
- Zero PII in logs (content stripped, only metadata)

## Risk Assessment
- **Low:** Logging overhead — async insert, non-blocking
- **Medium:** Log volume — implement daily aggregation, retention policy (90 days raw, 1y aggregated)

## Security Considerations
- NEVER log conversation content — only metadata (tokens, cost, latency)
- RLS ensures distributors only see own usage data
- Admin access required for team/global analytics
- Cost data is business-sensitive — admin-only access

## Next Steps
- Feeds data to Phase 6 (Config Routing) for intelligent model selection
