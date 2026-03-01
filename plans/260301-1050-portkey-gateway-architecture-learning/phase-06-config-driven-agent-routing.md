# Phase 6: Config-Driven Agent Routing

## Context
- Parent: [plan.md](./plan.md)
- Depends on: All previous phases
- Inspired by: Portkey's JSON config system for runtime strategy switching

## Overview
- **Date:** 2026-03-01
- **Priority:** P3
- **Implementation:** pending
- **Review:** pending

Define agent routing strategies as JSON configs — which model, fallback chain, guardrails, cache TTL per agent type. Configs stored in Supabase, switchable at runtime. A/B testing different configs.

## Key Insights

Portkey's config: entire routing strategy in one JSON object. Runtime switchable via header. Versioned configs. Conditional routing based on request metadata.

**Applied to Well:** Each agent gets a config defining its AI behavior. Admin can tune configs without code deploy. A/B test: does Gemini Pro give better coaching than Flash? Config versioning for rollback.

## Requirements
- Agent config stored as JSON in Supabase
- Configs define: model, fallback chain, guardrails, cache TTL, temperature
- Admin UI to edit configs (no code deploy needed)
- Config versioning with rollback
- Conditional routing (different config by distributor rank)

## Architecture

```typescript
// src/shared/services/ai-agent-config.ts
interface AgentRoutingConfig {
  id: string;
  agentId: string;
  version: number;
  active: boolean;
  strategy: 'single' | 'fallback' | 'loadbalance';
  targets: ProviderTarget[];
  guardrails: { pre: string[]; post: string[] };
  cache: { enabled: boolean; ttlMs: number; scope: string };
  params: { temperature: number; maxTokens: number; topP: number };
  conditions?: {
    rankMin?: DistributorRank;    // Only for Partner+ distributors
    locale?: string;               // Different model for vi vs en
  };
}

// Example: Coach Agent config
const coachConfig: AgentRoutingConfig = {
  agentId: 'coach',
  strategy: 'fallback',
  targets: [
    { provider: 'gemini', model: 'gemini-2.0-flash', timeout: 10000 },
    { provider: 'gemini', model: 'gemini-2.0-pro', timeout: 20000 },
  ],
  guardrails: { pre: ['sanitize', 'pii'], post: ['compliance', 'format'] },
  cache: { enabled: true, ttlMs: 3600000, scope: 'agent' },
  params: { temperature: 0.7, maxTokens: 1024, topP: 0.9 },
};
```

## Implementation Steps
1. Create `agent_routing_configs` Supabase table with versioning
2. Define `AgentRoutingConfig` type
3. Create config loader service (fetch active config per agent)
4. Integrate config into AIGateway (override defaults with agent config)
5. Add conditional routing logic (rank-based, locale-based)
6. Create Admin UI for config editing (JSON editor with validation)
7. Implement config versioning (save history, rollback button)
8. Add config cache in-memory (refresh every 5min)
9. Seed default configs for existing agents (Coach, Copilot, Reward)

## Todo
- [ ] Create Supabase table for configs
- [ ] Define AgentRoutingConfig type
- [ ] Config loader service with caching
- [ ] Integrate into AIGateway
- [ ] Conditional routing logic
- [ ] Admin config editor UI
- [ ] Config versioning + rollback
- [ ] Seed default configs
- [ ] Tests

## Success Criteria
- Agent behavior changeable via config without code deploy
- Config changes take effect within 5 minutes (cache refresh)
- Version history maintained, rollback works
- Conditional routing correct (rank-based model selection)

## Risk Assessment
- **Medium:** Bad config = broken agent. Mitigate with JSON schema validation + preview mode
- **Low:** Config cache staleness — 5min TTL acceptable for non-critical changes

## Security Considerations
- Config editing restricted to admin role
- Config history audit trail (who changed what, when)
- API keys never in config JSON (stored separately in Supabase secrets)

## Next Steps
- This is the final phase — system complete
- Monitor via Phase 5 observability dashboard
- Iterate configs based on usage data
