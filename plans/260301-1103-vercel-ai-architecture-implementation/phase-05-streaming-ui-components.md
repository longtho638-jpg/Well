# Phase 5: Streaming UI Components

## Context
- Parent: [plan.md](./plan.md) | Depends on: [Phase 1](./phase-01-use-agent-chat-hook.md)
- Inspired by: Vercel AI SDK streaming UI — token-by-token rendering

## Overview
- **Date:** 2026-03-01 | **Priority:** P2 | **Status:** pending

Render agent responses token-by-token with markdown support. Immediate feedback. Cancel button. Typing indicator. Structured response cards.

## Architecture

```typescript
// src/modules/agents/components/streaming-message.tsx
const StreamingMessage = ({ content, isStreaming }: Props) => (
  <div className="glass-card p-4">
    <ReactMarkdown>{content}</ReactMarkdown>
    {isStreaming && <TypingIndicator />}
  </div>
);

// src/modules/agents/components/agent-chat-panel.tsx
const AgentChatPanel = ({ agentId }: Props) => {
  const { messages, input, setInput, handleSubmit, isLoading, stop } = useAgentChat({ agentId });
  return (
    <div>
      {messages.map(m => <StreamingMessage key={m.id} content={m.content} isStreaming={m.isStreaming} />)}
      <ChatInput value={input} onChange={setInput} onSubmit={handleSubmit} disabled={isLoading} />
      {isLoading && <button onClick={stop}>{t('agents.cancel')}</button>}
    </div>
  );
};
```

## Implementation Steps
1. Create `StreamingMessage` component with ReactMarkdown
2. Create `TypingIndicator` animation component
3. Create `ChatInput` component with submit handling
4. Create `AgentChatPanel` combining all pieces
5. Add cancel button (calls stop() from useAgentChat)
6. Add structured response renderer (for CoachResponse cards)
7. Apply Aura Elite glassmorphism styling
8. i18n all UI strings

## Todo
- [ ] StreamingMessage | - [ ] TypingIndicator
- [ ] ChatInput | - [ ] AgentChatPanel
- [ ] Cancel button | - [ ] Structured response cards
- [ ] Aura Elite styling | - [ ] i18n | - [ ] Tests
