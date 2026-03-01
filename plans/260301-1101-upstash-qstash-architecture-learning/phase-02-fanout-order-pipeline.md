# Phase 2: Fanout Order Pipeline

## Context
- Parent: [plan.md](./plan.md) | Depends on: [Phase 1](./phase-01-async-event-bus.md)
- Inspired by: QStash Topics + Subscriptions — one event, multiple consumers

## Overview
- **Date:** 2026-03-01 | **Priority:** P1 | **Status:** pending

When order is placed → fanout to: commission calc, notification, analytics, webhook. Each consumer independent.

## Architecture

```typescript
// Fanout: one order event → multiple consumers
eventBus.subscribe('order.created', [
  calculateCommission,    // updates commission table
  notifyDistributor,      // sends push/in-app notification
  updateAnalytics,        // increments daily metrics
  dispatchWebhooks,       // external integrations
]);
// Each runs independently — one failure doesn't block others
```

## Implementation Steps
1. Create fanout mechanism in EventBus (parallel consumer execution)
2. Implement commission calculator consumer
3. Implement notification consumer
4. Implement analytics updater consumer
5. Implement webhook dispatcher consumer
6. Each consumer reports success/failure independently

## Todo
- [ ] Fanout mechanism | - [ ] Commission consumer
- [ ] Notification consumer | - [ ] Analytics consumer
- [ ] Webhook consumer | - [ ] Tests

## Success Criteria
- Order event triggers all 4 consumers in parallel
- One consumer failure doesn't affect others
- All consumer results tracked in event log
