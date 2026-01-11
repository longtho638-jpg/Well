# WellNexus Scalable Architecture (1M Users)

## Overview
This document outlines the architectural shift from Client-side Agents (v1) to Server-side Event-Driven Agents (v2) to handle **1,000,000 concurrent users**.

## 1. The "Thundering Herd" Problem
With 1M users, running agents in the browser is impossible because:
- **Security:** API keys are exposed.
- **Performance:** Client devices act as "bots", DDOS-ing our own API.
- **Consistency:** Network failures cause lost rewards.

## 2. The Solution: Outbox Pattern & Worker Queues

### A. Data Flow
1. **User Action:** User buys product -> Frontend calls Supabase `insert into transactions`.
2. **Database Trigger:** Postgres detects insertion -> Fires `trigger_the_bee_reward`.
3. **Job Queue:** Trigger inserts a row into `agent_jobs` table (status: `pending`).
4. **Worker (Edge Function):** A background worker polls `agent_jobs` every second.
5. **Execution:** Worker picks up the job, calculates reward, and executes `distribute_reward` RPC.
6. **Completion:** Job marked as `completed`, User balance updated atomically.

### B. Database Schema (Hardened)
- **`agent_jobs`:** Acts as a persistent message queue inside Postgres.
- **`agent_logs_partitioned`:** Partitioned by month to store billions of logs without slowing down writes.
- **Indexes:** Heavy indexing on `user_id` and `status` fields.

### C. Worker Logic (The Bee)
- Located in: `supabase/functions/agent-worker/index.ts`
- Runtime: Deno (Serverless V8)
- Logic:
  - Fetches pending jobs in batches (batch size: 100).
  - Processes concurrently.
  - Uses Optimistic Locking to prevent double-processing.

## 3. Deployment Strategy
1. **Apply Migration:** Run `supabase/migrations/20241204_scalable_architecture.sql`.
2. **Deploy Function:** `supabase functions deploy agent-worker`.
3. **Set Cron:** Use `pg_cron` or a simple uptime monitor to hit the `agent-worker` endpoint every 1s.

## 4. Future Scaling (10M+ Users)
- Move `agent_jobs` to **Redis/BullMQ**.
- Use **Temporal.io** for long-running agent workflows (e.g. "Coach checks in after 3 days").
- Read Replicas for Dashboard SELECT queries.
