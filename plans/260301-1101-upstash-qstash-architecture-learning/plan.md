---
title: "Upstash QStash Patterns → Well RaaS AGI"
description: "Learn & apply QStash's HTTP messaging, scheduled jobs, fanout, and retry patterns to Well async processing"
status: pending
priority: P2
effort: 10h
branch: main
tags: [architecture, qstash, messaging, async, serverless, binh-phap, ch2]
created: 2026-03-01
---

# Binh Phap Ch.2 作戰: Upstash QStash → Well RaaS AGI

> *"Binh quý thắng, bất quý cửu"* — Speed is essence. Async processing = non-blocking victory.

## Objective

Learn HTTP-based messaging, scheduled jobs, fanout, and retry patterns from QStash. Apply to Well's async order processing, commission calculation, and notification dispatch.

## Research

- [Core: HTTP Queue, CRON, Fanout, Retry/DLQ, Idempotency](./research/researcher-01-upstash-qstash.md)

## Implementation Phases

| # | Phase | Effort | Status |
|---|-------|--------|--------|
| 1 | [Async Event Bus](./phase-01-async-event-bus.md) | 3h | pending |
| 2 | [Fanout Order Pipeline](./phase-02-fanout-order-pipeline.md) | 3h | pending |
| 3 | [Scheduled Jobs System](./phase-03-scheduled-jobs.md) | 2h | pending |
| 4 | [Retry & Dead Letter Queue](./phase-04-retry-dead-letter-queue.md) | 2h | pending |

## Key QStash Patterns Applied

1. **HTTP messaging** → Supabase Edge Functions as async workers
2. **Fanout** → One order event triggers commission + notification + analytics
3. **CRON schedules** → Daily aggregation, weekly reports, monthly cleanup
4. **Retry + DLQ** → Automatic retry with dead letter investigation
5. **Idempotency** → All handlers safe to replay
