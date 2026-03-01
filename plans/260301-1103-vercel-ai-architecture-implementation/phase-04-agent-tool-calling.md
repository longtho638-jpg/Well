# Phase 4: Agent Tool Calling System

## Context
- Parent: [plan.md](./plan.md)
- Inspired by: Vercel AI SDK tool definitions — Zod params + execute functions

## Overview
- **Date:** 2026-03-01 | **Priority:** P2 | **Status:** pending

Give agents access to tools: query commissions, lookup products, get team metrics. LLM decides which tools to use based on user question. Multi-step reasoning.

## Architecture

```typescript
// supabase/functions/_shared/agent-tools.ts
const agentTools = {
  getCommissions: {
    description: 'Get distributor commission data for a period',
    parameters: z.object({ period: z.enum(['today','7d','30d']), userId: z.string() }),
    execute: async ({ period, userId }) => {
      // query Supabase, return commission data
    },
  },
  lookupProduct: {
    description: 'Search product catalog by name or category',
    parameters: z.object({ query: z.string() }),
    execute: async ({ query }) => { /* ... */ },
  },
  getTeamMetrics: {
    description: 'Get team performance metrics for a distributor',
    parameters: z.object({ userId: z.string(), depth: z.number().default(3) }),
    execute: async ({ userId, depth }) => { /* ... */ },
  },
};
```

## Implementation Steps
1. Define tool interface (description + Zod params + execute function)
2. Create tools: getCommissions, lookupProduct, getTeamMetrics, calculateTax
3. Integrate into Gemini Edge Function (function calling API)
4. Implement multi-step execution (LLM → tool → LLM → answer)
5. Tool result formatting for LLM consumption
6. Security: restrict tool access by agent type

## Todo
- [ ] Tool interface | - [ ] 4 agent tools
- [ ] Gemini function calling integration | - [ ] Multi-step execution
- [ ] Tool result formatting | - [ ] Access control | - [ ] Tests
