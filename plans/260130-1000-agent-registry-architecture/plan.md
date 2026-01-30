---
title: "Agent Registry & Core Architecture"
description: "Phase 2 of Agent-OS integration: BaseAgent, Registry, and ClaudeKit Adapter."
status: in-progress
priority: P1
effort: 2h
branch: main
tags: [agent-os, architecture, backend]
created: 2026-01-30
---

# Agent Registry & Core Architecture Plan

## Overview
This plan implements Phase 2 of the Agent-OS integration for WellNexus. It establishes the core agent architecture, including the abstract `BaseAgent` class, the centralized `AgentRegistry`, and adapters for ClaudeKit agents.

## Objectives
1.  Establish the core agent class hierarchy.
2.  Implement a singleton registry for managing all agents.
3.  Integrate existing ClaudeKit agents via an adapter pattern.

## Phases

- [x] **[Phase 1: Directory Structure & Base Class](./phase-01-base-structure.md)**
    - Create `src/agents/` directory structure.
    - Implement `src/agents/core/BaseAgent.ts`.
- [x] **[Phase 2: ClaudeKit Adapter](./phase-02-claudekit-adapter.md)**
    - Implement `src/agents/claudekit/ClaudeKitAdapter.ts`.
- [x] **[Phase 3: Registry Implementation](./phase-03-registry.md)**
    - Implement `src/agents/registry.ts`.
    - Implement `src/agents/index.ts`.
- [x] **[Phase 4: Verification](./phase-04-verification.md)**
    - Verify build and exports.

## Additional Phases (Refactoring)
- [x] **Phase 5: Refactor Services to Agents**
    - Refactor `GeminiCoachAgent` and `SalesCopilotAgent`.
    - Update `geminiService` and `copilotService` to use agents.
- [x] **Phase 6: Store Integration**
    - Update `src/store.ts` to include Agent State and Actions.
    - Verified `src/store/slices/agentSlice.ts` implementation.


## Key Technical Decisions
- **Singleton Registry:** Ensures a single source of truth for agent state.
- **Adapter Pattern:** Allows integrating external/CLI-based agents (ClaudeKit) into the internal object model.
- **Abstract Base Class:** Enforces standard logging, policy checking, and KPI tracking across all agents.

## Related Files
- `src/types/agentic.ts` (Already created)
- `docs/tasks/GEMINI_CLI_TASK_PHASE2.md`
