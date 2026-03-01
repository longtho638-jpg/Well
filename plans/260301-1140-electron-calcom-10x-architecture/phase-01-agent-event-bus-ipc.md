---
phase: 1
title: "Agent Event Bus & IPC System"
status: pending
effort: 3h
priority: P1
---

# Phase 1: Agent Event Bus & IPC System

## Context Links

- [Electron IPC Pattern](../reports/researcher-260301-1140-electron-architecture-patterns.md#1-process-architecture)
- [Cal.com Webhook Dispatcher](../reports/researcher-260301-1140-calcom-core-architecture.md#part-5-webhook-system--event-triggers)
- Current orchestrator: `src/agents/orchestration/agent-supervisor-orchestrator.ts`
- Current registry: `src/agents/registry.ts`

## Overview

Create a typed EventEmitter-based event bus (inspired by Electron's IPC channels) enabling agents to communicate without direct imports. Currently, agents only communicate through the supervisor orchestrator. The event bus adds pub/sub for side-effect-driven workflows (e.g., "order placed" triggers commission calculation + notification agent).

## Key Insights

- Electron uses named IPC channels with `ipcMain.handle()` / `ipcRenderer.invoke()` for request-response
- Cal.com dispatches 15+ webhook event types after booking CRUD operations
- Well's orchestrator currently only supports request-response (user -> classifier -> agent -> response)
- Missing: agent-to-agent events, system events (auth, payment), side-effect triggers

## Requirements

### Functional
- F1: Typed event bus with publish/subscribe pattern
- F2: Event types for domain events: order, commission, agent-response, auth, error
- F3: Agents can subscribe to events without importing each other
- F4: Support both fire-and-forget (emit) and request-response (request) patterns
- F5: Event history buffer for debugging (last 50 events)

### Non-Functional
- NF1: Zero external dependencies (use native EventEmitter pattern)
- NF2: Type-safe event payloads via discriminated union
- NF3: Max 5ms overhead per event dispatch
- NF4: Memory-bounded event history (ring buffer, 50 entries max)

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  AgentEventBus                       │
│            (singleton, typed channels)               │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Gemini Coach ──publish──> "agent:response"          │
│                                                      │
│  Sales Copilot ──subscribe──> "agent:response"       │
│                                                      │
│  Orchestrator ──publish──> "order:created"            │
│       │                                              │
│       └──> Commission Tool subscribes                │
│       └──> Notification service subscribes           │
│       └──> Webhook dispatcher subscribes (Phase 3)   │
│                                                      │
│  Auth Flow ──publish──> "auth:login" / "auth:logout" │
│       └──> Agent context refresh subscribes          │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Related Code Files

### Files to Create
- `src/lib/vibe-event-bus/index.ts` -- SDK entry point
- `src/lib/vibe-event-bus/agent-event-bus-singleton.ts` -- EventBus class + singleton
- `src/lib/vibe-event-bus/agent-event-bus-types.ts` -- Event type definitions
- `src/lib/vibe-event-bus/agent-event-bus-history.ts` -- Ring buffer for event history

### Files to Modify
- `src/agents/orchestration/agent-supervisor-orchestrator.ts` -- Emit events after agent execution
- `src/agents/registry.ts` -- Wire event bus into agent lifecycle

## Implementation Steps

### Step 1: Define event types (agent-event-bus-types.ts)
1. Create discriminated union `AgentEventType` covering domains: `agent`, `order`, `commission`, `auth`, `error`, `system`
2. Define payload interfaces for each event (e.g., `OrderCreatedPayload`, `AgentResponsePayload`)
3. Create `AgentEventMap` mapping event names to payload types for type safety
4. Export `AgentEventHandler<T>` callback type

### Step 2: Implement ring buffer history (agent-event-bus-history.ts)
1. Create `EventHistoryBuffer` class with fixed capacity (default 50)
2. Methods: `push(event)`, `getAll()`, `getByType(eventType)`, `clear()`
3. Oldest events auto-evicted when buffer full
4. Include timestamp + event type + payload snapshot

### Step 3: Build AgentEventBus singleton (agent-event-bus-singleton.ts)
1. Create `AgentEventBus` class with Map<string, Set<Handler>> internally
2. Methods: `on(event, handler)`, `off(event, handler)`, `emit(event, payload)`, `once(event, handler)`
3. Add `request(event, payload): Promise<response>` for request-response pattern
4. Wire `EventHistoryBuffer` for all emitted events
5. Export singleton `agentEventBus` + factory `createAgentEventBus()` for testing

### Step 4: Create SDK entry point (index.ts)
1. Export types, bus singleton, history buffer
2. Follow existing vibe-* SDK pattern (see `vibe-agent/index.ts`)

### Step 5: Integrate with orchestrator
1. In `agent-supervisor-orchestrator.ts`, emit `agent:request-started` before execution
2. Emit `agent:response-completed` after successful execution with result
3. Emit `agent:execution-failed` on error with error details
4. Wire tool execution events: `tool:executed` with tool name + result

### Step 6: Wire auth events
1. In auth flow (login/logout), emit `auth:session-changed`
2. Agents can subscribe to refresh their context when user changes

## Todo Checklist

- [ ] Create `src/lib/vibe-event-bus/` directory structure
- [ ] Define `AgentEventMap` discriminated union with 10+ event types
- [ ] Implement `EventHistoryBuffer` ring buffer (capacity 50)
- [ ] Implement `AgentEventBus` singleton with typed pub/sub
- [ ] Add `request()` method for request-response pattern
- [ ] Create SDK entry point following vibe-* pattern
- [ ] Integrate event emission into orchestrator (3 events)
- [ ] Write unit tests for event bus (subscribe, emit, history, request-response)
- [ ] Write unit tests for ring buffer (capacity, eviction, getByType)
- [ ] Verify 0 TypeScript errors, build passes

## Success Criteria

- [ ] Agents communicate via events without direct imports
- [ ] Event types are fully typed -- incorrect payloads cause TS errors
- [ ] History buffer stores last 50 events with timestamps
- [ ] Request-response pattern works for synchronous agent queries
- [ ] All existing 349+ tests still pass
- [ ] New event bus tests cover: emit, subscribe, unsubscribe, once, request, history overflow

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Memory leak from unsubscribed handlers | Medium | High | WeakRef for handlers + cleanup on agent unregister |
| Event storm from circular subscriptions | Low | High | Max 10 handlers per event type + cycle detection |
| Performance overhead on hot paths | Low | Medium | Benchmark: emit must be < 5ms for 10 handlers |

## Security Considerations

- Event payloads should NOT contain raw credentials or tokens
- Sanitize user input before including in event payloads
- Event history buffer cleared on auth:logout to prevent data leakage
