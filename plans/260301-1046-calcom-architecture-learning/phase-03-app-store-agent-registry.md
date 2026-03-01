# Phase 3: App Store Agent Registry

## Context
- Parent: [plan.md](./plan.md)
- Depends on: [Phase 1](./phase-01-modular-package-architecture.md), [Phase 2](./phase-02-type-safe-service-layer.md)
- Inspired by: Cal.com's App Store architecture (40+ integrations with standard interface)
- Docs: [project-overview-pdr.md](../../docs/project-overview-pdr.md) — Agent System section

## Overview
- **Date:** 2026-03-01
- **Priority:** P1 — Core AGI feature
- **Implementation:** pending
- **Review:** pending

Transform Well's flat agent system (Coach, Sales Copilot, Reward Engine) into a plugin-based App Store model inspired by Cal.com. Each agent = installable "app" with metadata, standard interface, credentials, and lifecycle.

## Key Insights

Cal.com's App Store: each integration implements a standard interface (`createMeeting`, `getAvailability`). Apps have metadata (name, description, category, logo), credentials per user, install/uninstall lifecycle. `AppCategoryType` enum categorizes apps.

**Applied to Well:** Each AI agent implements standard interface (`plan`, `execute`, `verify`). Agents discoverable via registry. Agents installable per distributor. Category system (coaching, sales, analytics, automation).

## Requirements
- Standard `AgentPlugin` interface all agents implement
- Agent registry with metadata, categories, status
- Dynamic agent loading (lazy import)
- Agent config stored per user (Zustand + Supabase)
- Agent activity logging

## Architecture

```typescript
// modules/agents/types.ts
interface AgentPlugin {
  id: string;
  metadata: AgentMetadata;
  initialize(ctx: AgentContext): Promise<void>;
  execute(input: AgentInput): Promise<AgentOutput>;
  destroy(): void;
}

interface AgentMetadata {
  name: string;
  description: string;
  category: AgentCategory;
  icon: string;
  version: string;
  requiredRank: DistributorRank; // Feature gating (→ Phase 6)
}

type AgentCategory = 'coaching' | 'sales' | 'analytics' | 'automation';

// modules/agents/registry.ts
class AgentRegistry {
  private agents: Map<string, AgentPlugin> = new Map();
  register(agent: AgentPlugin): void;
  get(id: string): AgentPlugin | undefined;
  listByCategory(cat: AgentCategory): AgentPlugin[];
  getInstalled(userId: string): AgentPlugin[];
}
```

## Related Code Files
- `src/components/` → current agent components (find with grep "agent")
- `src/services/gemini*` → current Gemini integration
- `src/modules/agents/` → NEW: agent module
- `src/modules/agents/plugins/` → individual agent implementations

## Implementation Steps
1. Define `AgentPlugin` interface and `AgentMetadata` type
2. Create `AgentRegistry` class with register/get/list methods
3. Create `AgentContext` with user info, Gemini client, locale
4. Refactor Coach Agent to implement `AgentPlugin` interface
5. Refactor Sales Copilot to implement `AgentPlugin` interface
6. Refactor Reward Engine to implement `AgentPlugin` interface
7. Create Agent Dashboard UI (grid of installed agents, categories)
8. Add agent install/uninstall flow (per-user preferences in Zustand)
9. Create agent activity log (who used which agent, when, result)
10. Lazy-load agent implementations via dynamic import

## Todo
- [ ] Define AgentPlugin interface + AgentMetadata
- [ ] Create AgentRegistry singleton
- [ ] Refactor Coach Agent → plugin
- [ ] Refactor Sales Copilot → plugin
- [ ] Refactor Reward Engine → plugin
- [ ] Create Agent Dashboard UI (card grid)
- [ ] Implement install/uninstall per user
- [ ] Add agent activity logging
- [ ] Dynamic import for lazy loading
- [ ] Tests for registry + each agent plugin

## Success Criteria
- All agents implement `AgentPlugin` interface
- `AgentRegistry.listByCategory()` works correctly
- Agent Dashboard shows all available agents with install/uninstall
- Lazy loading — agent code only loaded when accessed
- Agent activity log records all executions

## Risk Assessment
- **Medium:** Refactoring existing agents may break current functionality — test each agent individually
- **Low:** Lazy loading complexity — React.lazy + Suspense handles this well

## Security Considerations
- Agent execution sandboxed (no direct DOM access from agent logic)
- Gemini API calls only through Edge Function (no client-side API keys)
- Activity log for audit trail (who did what, when)
- Agent permissions respect distributor rank (Phase 6)

## Next Steps
- Phase 4 (Workflow Engine) can trigger agents as workflow steps
- Phase 6 (Feature Gating) gates agent access by rank
