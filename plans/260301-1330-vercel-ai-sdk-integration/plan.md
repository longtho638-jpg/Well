# Plan: Vercel AI SDK Integration in Well project

## Overview
Integrate Vercel AI SDK patterns (useChat, streamText, generative UI) into the `vibe-agent` architecture. This will provide a standardized, high-performance way to handle AI interactions and streaming responses.

## Phase 1: Dependency Setup
- [ ] Install `ai` (Vercel AI SDK core)
- [ ] Install `@ai-sdk/google` (Primary provider as per project context)
- [ ] Install `@ai-sdk/openai` (Secondary provider/fallback)

## Phase 2: Core Integration (vibe-agent adapter)
- [ ] Create `src/lib/vibe-agent/agent-vercel-ai-adapter.ts`
- [ ] Implement mapping between `vibe-agent` types and Vercel AI SDK types
- [ ] Integrate with `agentLLMRouter` for model selection

## Phase 3: Streaming Support
- [ ] Implement `streamText` pattern in `AgentService`
- [ ] Create a custom hook `useVibeChat` that wraps Vercel AI's `useChat` but integrates with `vibe-agent` registry and state.

## Phase 4: Generative UI Concepts
- [ ] Implement a pattern for "Tool-based UI" (Generative UI) where agents can return components or structured data that triggers UI changes.
- [ ] Create a demo component in `src/components/Agent/AgentChat.tsx`.

## Phase 5: Verification & Documentation
- [ ] Run build and tests
- [ ] Update `docs/system-architecture.md` with Vercel AI SDK integration details.

## Success Criteria
- [ ] Successful streaming of AI responses in the UI.
- [ ] `useChat` working seamlessly with `vibe-agent` registry.
- [ ] Zero TypeScript errors in new integration files.
