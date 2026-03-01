# Phase 3: AI Provider Abstraction

## Context
- Parent: [plan.md](./plan.md)
- Inspired by: Vercel AI SDK provider factory — `google('gemini-2.0-flash')`

## Overview
- **Date:** 2026-03-01 | **Priority:** P2 | **Status:** pending

Abstract Gemini behind provider interface. Switch models/providers = one config change. Unified generateText/streamText API in Edge Functions.

## Architecture

```typescript
// supabase/functions/_shared/ai-provider.ts
interface AIProvider {
  generateText(params: GenerateParams): Promise<GenerateResult>;
  streamText(params: GenerateParams): ReadableStream<string>;
}

function createProvider(name: 'gemini' | 'openai'): AIProvider;

// Usage in Edge Function:
const provider = createProvider('gemini');
const result = await provider.generateText({
  model: 'gemini-2.0-flash',
  messages, systemPrompt, temperature: 0.7,
});
```

## Implementation Steps
1. Define `AIProvider` interface and `GenerateParams`/`GenerateResult` types
2. Create `GeminiProvider` implementing interface
3. Create `createProvider()` factory function
4. Refactor all Edge Functions to use provider abstraction
5. Add model selection via config (env var `AI_MODEL`)

## Todo
- [ ] AIProvider interface | - [ ] GeminiProvider
- [ ] createProvider factory | - [ ] Refactor Edge Functions
- [ ] Config-based model selection | - [ ] Tests
