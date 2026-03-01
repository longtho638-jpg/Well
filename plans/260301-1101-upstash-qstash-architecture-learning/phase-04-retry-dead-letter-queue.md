# Phase 4: Retry & Dead Letter Queue

## Context
- Parent: [plan.md](./plan.md) | Depends on: [Phase 1](./phase-01-async-event-bus.md)
- Inspired by: QStash retry policies + DLQ inspection + replay

## Overview
- **Date:** 2026-03-01 | **Priority:** P2 | **Status:** pending

Automatic retry for failed event handlers. Dead Letter Queue for investigation. Admin UI for DLQ browsing and replay.

## Architecture

```typescript
// Retry policy per consumer
interface RetryPolicy {
  maxRetries: number;      // default 3
  backoffMs: number;       // default 1000
  backoffMultiplier: number; // default 2 (1s, 2s, 4s)
}

// DLQ entry — failed after all retries
interface DeadLetterEntry {
  event: BusinessEvent;
  consumer: string;
  error: string;
  attempts: number;
  lastAttempt: Date;
  status: 'pending' | 'replayed' | 'dismissed';
}
```

## Implementation Steps
1. Add retry logic to EventBus consumer execution
2. Create `dead_letter_queue` Supabase table
3. Move failed events to DLQ after max retries exhausted
4. Create Admin DLQ browser page (table with filter/search)
5. Add replay button (re-publish event from DLQ)
6. Add dismiss button (acknowledge and archive)

## Todo
- [ ] Retry logic with exponential backoff
- [ ] dead_letter_queue table | - [ ] DLQ insert on final failure
- [ ] Admin DLQ browser | - [ ] Replay/dismiss actions | - [ ] Tests

## Success Criteria
- Failed handlers retry automatically (max 3, with backoff)
- After all retries → event moves to DLQ
- Admin can browse, replay, and dismiss DLQ entries
