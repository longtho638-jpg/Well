# Phase 2: AGI Commerce Orchestrator

## Priority: HIGH | Status: COMPLETED | Depends: Phase 1

## Overview
Plan-Execute-Verify orchestrator for commerce flows. Extends existing worker-supervisor pattern.

## Files to Create

### 1. `src/lib/vibe-agent/agi-commerce-tools.ts`
- Concrete tool implementations for commerce domain
- `searchProducts` — query product catalog by category/price/health-benefit
- `createOrder` — validate stock, calculate total, create order record
- `checkDistributorRank` — lookup rank, commission rate, team size
- `calculateCommission` — compute MLM commission based on 8-level structure
- `getHealthRecommendation` — RAG over verified product health claims only

### 2. `src/lib/vibe-agent/agi-commerce-orchestrator.ts`
- `CommerceOrchestrator` class extending existing supervisor pattern
- `planAndExecute(goal: string)` — decomposes goal into tool calls
- Uses ReAct loop from Phase 1
- Emits domain events via existing `domainEventDispatcher`
- Human-in-the-loop for orders > threshold

## Files to Modify

### 3. `src/lib/vibe-agent/index.ts`
- Export new AGI modules

## Success Criteria
- [x] Commerce tools return typed results (5 functions + Zod schemas)
- [x] Orchestrator plans multi-step commerce flows via ReAct loop
- [x] Domain events emitted on order/commission actions
- [x] Human approval gate for orders > 50M VND
