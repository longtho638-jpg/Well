# Phase 1: AGI Core Engine

## Priority: HIGH | Status: PENDING

## Overview
Create AGI reasoning layer on top of existing Vibe Agent SDK. ReAct pattern + typed tool registry + tiered model routing.

## Key Insights
- Vercel AI SDK 5/6 has built-in `tool()` + agent loop — use directly
- Existing `agentLLMRouter` handles multi-provider — extend for tiered routing
- ReAct loop: Thought → Action → Observation → repeat until done

## Files to Create

### 1. `src/lib/vibe-agent/agi-tool-registry.ts`
- Typed tool definitions using Vercel AI SDK `tool()` pattern
- Commerce tools: searchProducts, getProductDetails, createOrder, calculateCommission, checkDistributorRank
- Each tool has: description, parameters (zod schema), execute function
- Export `agiToolRegistry` singleton

### 2. `src/lib/vibe-agent/agi-react-reasoning-loop.ts`
- ReAct reasoning engine using `streamText` with `maxSteps`
- Thought → Action → Observation cycle
- Configurable max iterations (default: 5)
- Emits events via existing `agentEventBus`
- Returns structured `ReasoningTrace` with all steps

### 3. `src/lib/vibe-agent/agi-model-tier-router.ts`
- Extends existing LLM router with tiered selection
- Tiers: fast (flash-lite) → balanced (flash) → powerful (pro)
- Auto-selects based on task complexity (tool count, conversation length)
- Cost tracking per tier

## Files to Modify

### 4. `src/lib/vibe-agent/agent-vercel-ai-adapter.ts`
- Add `streamVibeAgent()` function — wraps ReAct loop with tool-use
- Support `onStepFinish` callback for UI streaming
- Keep existing `streamVibeText()` backward compatible

## Implementation Steps
1. Create tool registry with zod schemas
2. Create ReAct loop using `streamText({ maxSteps })`
3. Create tier router extending existing router
4. Add `streamVibeAgent()` to adapter
5. Export all from `index.ts`

## Success Criteria
- [ ] Tool registry has 5 commerce tools with typed schemas
- [ ] ReAct loop runs Thought→Action→Observation cycle
- [ ] Tier router selects model based on complexity
- [ ] `streamVibeAgent()` streams reasoning steps
- [ ] 0 TypeScript errors
