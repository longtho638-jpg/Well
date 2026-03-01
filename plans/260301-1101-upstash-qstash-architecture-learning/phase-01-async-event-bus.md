# Phase 1: Async Event Bus

## Context
- Parent: [plan.md](./plan.md)
- Inspired by: QStash HTTP-based messaging — fire-and-forget, guaranteed delivery

## Overview
- **Date:** 2026-03-01 | **Priority:** P1 | **Status:** pending

Create event bus for async operations. Events published via HTTP, processed by Edge Functions. Non-blocking — publisher doesn't wait for all consumers.

## Architecture

```typescript
// src/shared/services/event-bus.ts
type EventType = 'order.created' | 'order.paid' | 'commission.calculated' | 'team.member_joined';

interface BusinessEvent<T = unknown> {
  id: string;
  type: EventType;
  data: T;
  timestamp: Date;
  idempotencyKey: string;
}

class EventBus {
  async publish(event: BusinessEvent): Promise<void>;      // fire-and-forget
  async subscribe(type: EventType, handler: EventHandler): void;
}
```

## Implementation Steps
1. Define BusinessEvent interface with idempotency key
2. Create EventBus using Supabase Database triggers + Edge Functions
3. Create `business_events` table for event persistence
4. Implement publish (insert to table → trigger Edge Function)
5. Implement subscription registry (event type → handler mapping)
6. Create idempotency check (skip duplicate events)

## Todo
- [ ] BusinessEvent types | - [ ] EventBus class
- [ ] business_events Supabase table | - [ ] Publish mechanism
- [ ] Subscription registry | - [ ] Idempotency check | - [ ] Tests

## Success Criteria
- Events published asynchronously (publisher not blocked)
- Events delivered at-least-once to all subscribers
- Duplicate events detected and skipped
