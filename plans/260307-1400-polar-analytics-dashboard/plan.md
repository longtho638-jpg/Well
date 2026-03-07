---
title: "Polar Analytics Dashboard"
description: "Build analytics dashboard with cohort retention, revenue tracking, and Polar.sh webhook integration"
status: pending
priority: P2
effort: 12h
branch: main
tags: [analytics, polar, dashboard, roi, cohort]
created: 2026-03-07
---

# Polar Analytics Dashboard - Implementation Plan

## Overview

Build comprehensive analytics dashboard tracking revenue, cohort retention, and license usage from Polar.sh webhooks.

**Research Finding:** Polar.sh has NO native analytics API. Must build internal tracking via webhooks → Edge Functions → Analytics Tables → Dashboard UI.

## Architecture

```
Polar.sh Webhooks → Edge Functions → Analytics Tables → Dashboard UI
                         ↓
                   Aggregations (nightly cron)
                   - Revenue snapshots
                   - Cohort metrics
                   - ROI calculations
```

## Phases

| #   | Phase | Status | Effort |
|-----|-------|--------|--------|
| 01  | [Analytics Schema](./phase-01-analytics-schema.md) | pending | 2h |
| 02  | [Polar Webhook Handler](./phase-02-polar-webhook-handler.md) | pending | 3h |
| 03  | [Analytics Hooks](./phase-03-analytics-hooks.md) | pending | 2h |
| 04  | [Dashboard UI](./phase-04-dashboard-ui.md) | pending | 4h |
| 05  | [Backfill Migration](./phase-05-backfill-migration.md) | pending | 1h |

## Dependencies

- Existing: `usage_records`, `raas_licenses`, `revenue_snapshots` tables
- Existing: `polar-webhook` Edge Function (needs enhancement)
- Existing: `use-revenue-analytics.ts`, `use-usage-analytics.ts` hooks

## Deliverables

1. Database schema for analytics aggregations (cohort_metrics, polar_events)
2. Enhanced Edge Function for Polar webhook (ingest all events)
3. React hooks for fetching analytics data (cohort retention, revenue trends)
4. Dashboard UI with charts (retention curves, revenue bars, usage trends)
5. Backfill migration script (Stripe → local analytics tables)

## Success Criteria

- [ ] Cohort retention chart shows D0/D30/D60/D90 retention by signup month
- [ ] Revenue trends show MRR/ARR/GMV over time with tier breakdown
- [ ] License usage trends display API calls, tokens, inferences per tier
- [ ] Date range filter (7d/30d/90d/custom) works on all charts
- [ ] Plan tier filter (free/basic/premium/enterprise/master) filters data
- [ ] Backfill script migrates historical Stripe data to analytics tables

## Unresolved Questions

| Question | Status |
|----------|--------|
| How to map existing Stripe subscriptions to Polar for historical data? | Research needed |
| Can Polar webhooks provide customer segment info (B2B vs B2C)? | Check Polar dashboard |
| What's the webhook event retention limit in Polar? | Low priority |
