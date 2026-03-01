# AGI RaaS Bootstrap — WellNexus

## Status: COMPLETED
## Branch: main

## Overview
Upgrade WellNexus from Agent-OS (static agent registry) to AGI RaaS (autonomous reasoning agents with tool-use, memory, planning). Extend existing infrastructure — DO NOT rewrite.

## Research Reports
- [Market Analysis](../reports/researcher-260302-0135-agi-raas-market-analysis.md)
- [Tech Architecture](../reports/researcher-260302-0135-agi-raas-tech-architecture.md)

## Existing Infrastructure (Keep)
- `agent-vercel-ai-adapter.ts` — Vercel AI SDK bridge
- `agent-llm-router-litellm-pattern.ts` — Multi-provider routing
- `agent-memory-store-mem0-pattern.ts` — Memory CRUD
- `agent-worker-supervisor-electron-pattern.ts` — Orchestration
- `base-agent-abstract.ts` — VibeBaseAgent class
- `event-bus.ts` + `workflow/automation-engine.ts`

## Architecture: AGI Layer Stack
```
┌─────────────────────────────────────────┐
│ UI: AGI Chat + Reasoning Visualizer     │ Phase 3
├─────────────────────────────────────────┤
│ AGI Orchestrator (Plan-Execute-Verify)  │ Phase 2
├─────────────────────────────────────────┤
│ Tool Registry (commerce tools)          │ Phase 1
│ ReAct Reasoning Loop                    │ Phase 1
├─────────────────────────────────────────┤
│ Existing: LLM Router, Memory, EventBus │ KEEP
└─────────────────────────────────────────┘
```

## Phases

### Phase 1: AGI Core Engine [COMPLETED]
- File: `phase-01-agi-core-engine.md`
- Create `agi-tool-registry.ts` — typed tool definitions via Vercel AI SDK `tool()`
- Create `agi-react-reasoning-loop.ts` — ReAct (Thought→Action→Observation) loop
- Create `agi-model-tier-router.ts` — tiered routing (flash-lite→flash→pro)
- Modify `agent-vercel-ai-adapter.ts` — add tool-use streaming support
- **Files:** 3 new + 1 modify = 4 files

### Phase 2: AGI Orchestrator [COMPLETED]
- File: `phase-02-agi-orchestrator.md`
- Create `agi-commerce-orchestrator.ts` — Plan-Execute-Verify for commerce flows
- Create `agi-commerce-tools.ts` — searchProducts, createOrder, checkRank, calculateCommission
- Wire into existing `agent-worker-supervisor-electron-pattern.ts`
- **Files:** 2 new + 1 modify = 3 files

### Phase 3: AGI Dashboard UI [COMPLETED]
- File: `phase-03-agi-dashboard-ui.md`
- Upgrade `AgentChat.tsx` — add reasoning step visualization, tool-use display
- Create `AgentReasoningView.tsx` — shows Thought→Action→Observation chain
- Create `AgentToolCallCard.tsx` — displays tool calls with inputs/outputs
- **Files:** 1 modify + 2 new = 3 files

### Phase 4: Tests + Review [COMPLETED]
- 34 new tests across 2 test files
- Code review: PASSED (0 critical issues)
- TypeScript: 0 errors
- Build: 9.09s (4030 modules)

## Dependency Graph
```
Phase 1 (Core) ──┬──→ Phase 2 (Orchestrator) ──→ Phase 4 (Tests)
                 └──→ Phase 3 (UI)          ──→ Phase 4 (Tests)
```

## Parallel Execution Strategy
- Phase 1 + Phase 3 (initial UI scaffolding) can run in parallel
- Phase 2 waits for Phase 1
- Phase 4 waits for all

## Success Criteria
- [x] ReAct loop executes Thought→Action→Observation cycle
- [x] Tool registry has 5 commerce tools + 5 standalone commerce functions
- [x] Model tier routing reduces cost by selecting appropriate model
- [x] UI shows reasoning steps in real-time (AgentReasoningView + AgentToolCallCard)
- [x] All 34 AGI tests pass
- [x] Build passes with 0 TS errors (9.09s)
- [x] Commerce orchestrator with domain event dispatch + human approval gate
