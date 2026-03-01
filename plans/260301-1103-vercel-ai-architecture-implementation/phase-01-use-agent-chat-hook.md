# Phase 1: useAgentChat Hook

## Context
- Parent: [plan.md](./plan.md)
- Inspired by: Vercel AI SDK `useChat()` — streaming chat state management in one hook

## Overview
- **Date:** 2026-03-01 | **Priority:** P1 | **Status:** pending

Create `useAgentChat()` hook that manages entire agent conversation: message history, streaming responses, loading/error states, submit handler. One hook = complete agent UI state.

## Key Insights
Vercel's `useChat()`: messages array auto-updates as tokens stream. Optimistic UI. Custom fetch for auth. Callbacks: onFinish, onError. Abort support.

## Architecture

```typescript
// src/shared/hooks/use-agent-chat.ts
interface UseAgentChatOptions {
  agentId: string;           // 'coach' | 'copilot' | 'reward'
  systemPrompt?: string;
  onFinish?: (message: AgentMessage) => void;
  onError?: (error: Error) => void;
}

interface UseAgentChatReturn {
  messages: AgentMessage[];
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e?: FormEvent) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  stop: () => void;          // abort streaming
  reload: () => Promise<void>; // retry last message
  clearMessages: () => void;
}

function useAgentChat(opts: UseAgentChatOptions): UseAgentChatReturn;
```

## Implementation Steps
1. Define `AgentMessage` type (role, content, timestamp, agentId)
2. Create `useAgentChat` hook with useState for messages/input/loading/error
3. Implement submit handler — calls Supabase Edge Function, streams response
4. Parse SSE stream — append tokens to last message incrementally
5. Implement abort via AbortController
6. Implement reload (retry last user message)
7. Add optimistic UI (user message appears immediately)
8. Persist conversation history to Zustand

## Todo
- [ ] AgentMessage type | - [ ] useAgentChat hook core
- [ ] SSE stream parsing | - [ ] Abort support | - [ ] Reload/retry
- [ ] Optimistic UI | - [ ] Zustand persistence | - [ ] Tests
