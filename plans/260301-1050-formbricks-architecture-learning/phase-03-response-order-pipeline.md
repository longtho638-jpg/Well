# Phase 3: Response & Order Pipeline

## Context
- Parent: [plan.md](./plan.md)
- Inspired by: Formbricks' response pipeline — validate → store → notify → integrate

## Overview
- **Date:** 2026-03-01
- **Priority:** P1
- **Implementation:** pending
- **Review:** pending

Apply Formbricks' event-driven response pipeline to Well's order processing. Order → validate → store → notify distributor → notify admin → trigger commission calc → webhook dispatch.

## Key Insights

Formbricks: Response → validate → store → notify. Each step independent (fail doesn't block others). Webhooks for extensibility. Pipeline is event-driven, not synchronous.

## Requirements
- Event-driven order pipeline with independent steps
- Webhook dispatch for external integrations
- Failed steps retry independently
- Pipeline status tracking (which steps completed)

## Architecture

```typescript
// src/modules/orders/pipeline.ts
type PipelineStep = (ctx: PipelineContext) => Promise<StepResult>;

const orderPipeline: PipelineStep[] = [
  validateOrder,        // Zod validation
  calculateTax,         // Vietnamese tax rules
  storeOrder,           // Supabase insert
  calculateCommission,  // Commission engine
  notifyDistributor,    // In-app + push
  notifyAdmin,          // Admin dashboard alert
  dispatchWebhooks,     // External integrations
];

async function executePipeline(order: Order): Promise<PipelineResult> {
  const results: StepResult[] = [];
  for (const step of orderPipeline) {
    const result = await step(ctx);
    results.push(result);
    if (result.critical && result.status === 'failed') break; // stop on critical failure
  }
  return { steps: results, status: allPassed ? 'complete' : 'partial' };
}
```

## Implementation Steps
1. Define `PipelineStep`, `PipelineContext`, `StepResult` types
2. Create pipeline executor with independent step execution
3. Mark steps as critical (validate, store) vs non-critical (notify, webhook)
4. Implement retry logic for failed non-critical steps
5. Add pipeline status tracking (store step results in Supabase)
6. Create webhook dispatch step (configurable URLs in admin)
7. Add pipeline monitoring (which orders stuck, which steps failing)
8. Refactor current order creation to use pipeline

## Todo
- [ ] Define pipeline types
- [ ] Create pipeline executor
- [ ] Critical vs non-critical step classification
- [ ] Retry logic for non-critical steps
- [ ] Pipeline status tracking
- [ ] Webhook dispatch
- [ ] Monitoring dashboard widget
- [ ] Tests

## Success Criteria
- Orders processed through pipeline with all steps tracked
- Non-critical step failure doesn't block order completion
- Webhook dispatch configurable by admin
- Pipeline status visible in admin dashboard

## Risk Assessment
- **Medium:** Pipeline migration — ensure no orders lost during transition
- **Low:** Webhook delivery failures — retry with backoff

## Security Considerations
- Webhook URLs validated (no internal network access)
- Pipeline steps enforce auth context
- Order data sanitized before webhook dispatch (no PII to external)

## Next Steps
- Phase 5 (Action Tracking) feeds events into this pipeline
