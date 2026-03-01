# Phase 3: Scheduled Jobs System

## Context
- Parent: [plan.md](./plan.md) | Inspired by: QStash Schedules — managed CRON via HTTP

## Overview
- **Date:** 2026-03-01 | **Priority:** P2 | **Status:** pending

Scheduled jobs for daily commission aggregation, weekly reports, monthly cleanup. Using Supabase pg_cron or Vercel CRON.

## Architecture

```typescript
// vercel.json CRON config
{ "crons": [
  { "path": "/api/cron/daily-commission-aggregation", "schedule": "0 2 * * *" },
  { "path": "/api/cron/weekly-team-report", "schedule": "0 8 * * 1" },
  { "path": "/api/cron/monthly-cleanup", "schedule": "0 3 1 * *" }
]}
```

## Implementation Steps
1. Create CRON endpoint for daily commission aggregation
2. Create CRON endpoint for weekly team performance report
3. Create CRON endpoint for monthly data cleanup (old logs, expired sessions)
4. Configure in vercel.json or Supabase pg_cron
5. Add monitoring — log job execution results

## Todo
- [ ] Daily commission aggregation | - [ ] Weekly team report
- [ ] Monthly cleanup | - [ ] CRON config | - [ ] Job monitoring | - [ ] Tests
