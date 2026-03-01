# Phase 2: Structured Agent Responses

## Context
- Parent: [plan.md](./plan.md)
- Inspired by: Vercel AI SDK `generateObject()` with Zod schemas

## Overview
- **Date:** 2026-03-01 | **Priority:** P1 | **Status:** pending

Agent responses as typed objects (not raw text). Coach = { advice, actionItems, confidence }. Copilot = { suggestion, objectionHandler, nextStep }. Zod-validated, type-safe throughout.

## Architecture

```typescript
// src/modules/agents/schemas/coach-response.ts
const CoachResponseSchema = z.object({
  advice: z.string(),
  actionItems: z.array(z.object({ task: z.string(), priority: z.enum(['high','medium','low']) })),
  confidence: z.number().min(0).max(1),
  relatedTopics: z.array(z.string()).optional(),
});
type CoachResponse = z.infer<typeof CoachResponseSchema>;

// src/modules/agents/schemas/copilot-response.ts
const CopilotResponseSchema = z.object({
  suggestion: z.string(),
  objectionHandler: z.string().optional(),
  nextStep: z.string(),
  productRecommendations: z.array(z.string()).optional(),
});
```

## Implementation Steps
1. Define Zod schemas for each agent response type
2. Create Edge Function wrapper that enforces JSON output format
3. Add Gemini system prompt suffix: "Respond in JSON matching this schema: ..."
4. Parse + validate response with Zod on client
5. Fallback: if JSON parse fails, wrap raw text as { advice: text }
6. Type-safe rendering components per schema

## Todo
- [ ] Coach response schema | - [ ] Copilot response schema
- [ ] Reward response schema | - [ ] Edge Function JSON enforcement
- [ ] Client-side Zod validation | - [ ] Fallback handling | - [ ] Tests
