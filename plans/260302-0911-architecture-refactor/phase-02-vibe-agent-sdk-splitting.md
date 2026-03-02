---
phase: 2
title: "Vibe Agent SDK Splitting — 10 Files Over 200 LOC"
status: pending
priority: P1
effort: 4h
parallel: [3, 4, 5, 6]
depends_on: [1]
owns: ["src/lib/vibe-agent/**"]
---

## Context Links
- Research: [researcher-01-component-splitting.md](research/researcher-01-component-splitting.md)
- Barrel: `src/lib/vibe-agent/index.ts` (382 LOC — re-exports)

## Overview
Vibe Agent SDK has 40 files, 10 exceed 200 LOC (8,108 total LOC). Internal library with no React components — pure TypeScript classes/functions. Strategy: extract types to dedicated files, split large classes into composable modules, slim the barrel file.

## Key Insights
- Barrel `index.ts` (382 LOC) is pure re-exports — split into category-specific barrels
- Largest files are pattern implementations (metrics, memory, heartbeat) — split by concern
- No React hooks/components — pure TS, so Container/Presenter pattern does NOT apply
- Strategy: Extract interfaces/types to `types/`, split class methods into helper modules

## File Inventory (10 files, by priority)

| File | LOC | Split Strategy |
|------|-----|----------------|
| `agent-metrics-collector-netdata-pattern.ts` | 447 | Extract metric types + collector helpers |
| `agent-memory-store-mem0-pattern.ts` | 440 | Extract memory types + CRUD operations |
| `index.ts` | 382 | Split into category barrels |
| `agent-heartbeat-monitor.ts` | 362 | Extract heartbeat types + health-check logic |
| `notification-dispatcher.ts` | 286 | Extract channel handlers |
| `agent-error-workflow-n8n-pattern.ts` | 272 | Extract error types + recovery strategies |
| `workflow-execution-context.ts` | 260 | Extract context types + state machine |
| `workflow-node-graph-engine-n8n-pattern.ts` | 256 | Extract node types + graph traversal |
| `agent-expression-resolver-n8n-pattern.ts` | 241 | Extract expression types + evaluator |
| `agent-status-page.ts` | 236 | Extract status types + renderer |

## Architecture — Splitting Pattern

For each oversized file, apply this decomposition:

```
Before:
  agent-metrics-collector-netdata-pattern.ts (447 LOC)

After:
  agent-metrics-collector-netdata-pattern.ts (150 LOC) — main class, delegates
  agent-metrics-collector-types.ts (80 LOC) — interfaces, enums
  agent-metrics-collector-helpers.ts (120 LOC) — pure functions
```

For `index.ts` barrel:
```
Before:
  index.ts (382 LOC) — all exports

After:
  index.ts (80 LOC) — re-exports from category barrels
  exports-agent-patterns.ts (80 LOC)
  exports-workflow-engine.ts (60 LOC)
  exports-monitoring.ts (60 LOC)
  exports-communication.ts (50 LOC)
```

## Implementation Steps

### Step 1: Split `index.ts` barrel (382 -> ~80 LOC)
1. Group current exports by domain (agents, workflows, monitoring, communication)
2. Create 4 category barrel files: `exports-agent-patterns.ts`, `exports-workflow-engine.ts`, `exports-monitoring.ts`, `exports-communication.ts`
3. `index.ts` re-exports from these 4 files only

### Step 2: Split metrics collector (447 -> 3 files)
1. Extract `AgentMetricDefinition`, `MetricSample`, config types -> `agent-metrics-collector-types.ts`
2. Extract pure calculation/aggregation functions -> `agent-metrics-collector-helpers.ts`
3. Keep main class in original file, import from new modules

### Step 3: Split memory store (440 -> 3 files)
1. Extract `MemoryEntry`, `MemoryQuery`, store config types -> `agent-memory-store-types.ts`
2. Extract CRUD operations (search, upsert, delete) -> `agent-memory-store-operations.ts`
3. Keep main class orchestration in original file

### Step 4: Split heartbeat monitor (362 -> 3 files)
1. Extract `HeartbeatConfig`, `HealthStatus` types -> `agent-heartbeat-monitor-types.ts`
2. Extract health-check logic/circuit-breaker -> `agent-heartbeat-health-check-logic.ts`
3. Keep monitor lifecycle in original file

### Step 5: Split remaining 6 files (236-286 LOC each -> 2 files each)
For each: extract types/interfaces into `*-types.ts` companion file.
- `notification-dispatcher.ts` -> + `notification-dispatcher-types.ts`
- `agent-error-workflow-n8n-pattern.ts` -> + `agent-error-workflow-types.ts`
- `workflow-execution-context.ts` -> + `workflow-execution-context-types.ts`
- `workflow-node-graph-engine-n8n-pattern.ts` -> + `workflow-node-graph-types.ts`
- `agent-expression-resolver-n8n-pattern.ts` -> + `agent-expression-resolver-types.ts`
- `agent-status-page.ts` -> + `agent-status-page-types.ts`

### Step 6: Verify
```bash
pnpm build && pnpm test
```

## Todo List
- [ ] Create 4 category barrel files, slim `index.ts`
- [ ] Split `agent-metrics-collector-netdata-pattern.ts` (447 LOC)
- [ ] Split `agent-memory-store-mem0-pattern.ts` (440 LOC)
- [ ] Split `agent-heartbeat-monitor.ts` (362 LOC)
- [ ] Extract types for `notification-dispatcher.ts` (286 LOC)
- [ ] Extract types for `agent-error-workflow-n8n-pattern.ts` (272 LOC)
- [ ] Extract types for `workflow-execution-context.ts` (260 LOC)
- [ ] Extract types for `workflow-node-graph-engine-n8n-pattern.ts` (256 LOC)
- [ ] Extract types for `agent-expression-resolver-n8n-pattern.ts` (241 LOC)
- [ ] Extract types for `agent-status-page.ts` (236 LOC)
- [ ] Build passes
- [ ] Tests pass

## Success Criteria
- All 10 files under 200 LOC
- `pnpm build` exits 0 (no TS errors)
- All existing imports resolve (barrel re-exports preserved)
- No behavior change — pure structural refactor

## Conflict Prevention
- **Exclusive ownership**: only this phase touches `src/lib/vibe-agent/**`
- No other phase imports new things from vibe-agent during refactor
- Barrel `index.ts` public API must remain identical (re-export everything)

## Risk Assessment
- LOW: Pure type/function extraction — no logic changes
- MEDIUM: Barrel changes could break imports if not re-exported correctly
  - Mitigation: grep all `from '@/lib/vibe-agent'` imports, verify each still resolves
- LOW: No React components, so no rendering regressions
