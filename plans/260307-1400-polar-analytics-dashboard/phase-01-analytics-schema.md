---
title: "Phase 1 - Analytics Database Schema"
description: "Create database tables for Polar events, cohort metrics, and analytics aggregations"
status: pending
priority: P1
effort: 2h
---

# Phase 1: Analytics Database Schema

## Overview

Create comprehensive database schema for tracking Polar.sh events and computing analytics.

## Context Links

- Existing schema: `supabase/migrations/202603071500_revenue_analytics_schema.sql`
- Existing views: `supabase/migrations/202603071400_analytics_views.sql`
- Research: `plans/reports/researcher-260307-polar-analytics-api.md`

## Key Insights

From research findings:
- Polar.sh has NO native analytics endpoints
- Must ingest ALL webhook events for historical analysis
- Need cohort tables for retention curve computation
- Need event storage for time-series revenue queries

## Requirements

### Functional

1. Store all Polar webhook events (immutable audit log)
2. Track customer lifecycle (created → subscribed → active → canceled → churned)
3. Compute cohort metrics (retention by signup month, D0/D30/D60/D90)
4. Store daily revenue snapshots (MRR, ARR, GMV)
5. Link events to license keys for ROI calculation

### Non-Functional

1. RLS enabled on all tables (admin read, user read own)
2. Indexes for common query patterns (date range, customer_id)
3. Idempotency handling (event_id unique constraint)

## Schema Design

### 1. Polar Webhook Events Table

```sql
CREATE TABLE polar_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,  -- Polar's event ID
  event_type TEXT NOT NULL,        -- checkout.succeeded, subscription.activated, etc.
  received_at TIMESTAMPTZ DEFAULT NOW(),

  -- Core Data
  customer_id UUID,
  subscription_id UUID,
  order_id UUID,
  product_id UUID,

  -- Amounts (in cents)
  amount_cents INTEGER,
  currency TEXT DEFAULT 'USD',

  -- Full payload for reprocessing
  payload JSONB NOT NULL,

  -- Processing status
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_polar_events_type ON polar_webhook_events(event_type);
CREATE INDEX idx_polar_events_customer ON polar_webhook_events(customer_id);
CREATE INDEX idx_polar_events_received ON polar_webhook_events(received_at DESC);
```

### 2. Customer Cohorts Table

```sql
CREATE TABLE customer_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID UNIQUE NOT NULL,
  cohort_month DATE NOT NULL,  -- First day of signup month

  -- Initial State
  initial_tier TEXT NOT NULL,  -- free/basic/premium/enterprise/master
  initial_mrr_cents INTEGER DEFAULT 0,

  -- Current State
  current_tier TEXT,
  current_mrr_cents INTEGER DEFAULT 0,
  status TEXT NOT NULL,  -- active/churned/trial/expired

  -- Lifecycle Dates
  first_purchase_date DATE,
  last_active_date DATE,
  churned_date DATE,

  -- Lifetime Value
  lifetime_revenue_cents INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cohorts_month ON customer_cohorts(cohort_month);
CREATE INDEX idx_cohorts_status ON customer_cohorts(status);
```

### 3. Cohort Retention Metrics Table

```sql
CREATE TABLE cohort_retention_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_month DATE NOT NULL,
  period_day INTEGER NOT NULL,  -- 0, 30, 60, 90...

  -- Metrics
  cohort_size INTEGER NOT NULL,
  active_users INTEGER DEFAULT 0,
  retained_percentage DECIMAL(5,2) DEFAULT 0,

  -- Revenue Metrics
  cumulative_revenue_cents INTEGER DEFAULT 0,
  arpu_cents INTEGER DEFAULT 0,  -- Average Revenue Per User

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(cohort_month, period_day)
);

-- Indexes
CREATE INDEX idx_cohort_metrics_month ON cohort_retention_metrics(cohort_month, period_day);
```

### 4. Daily Revenue Snapshots (Enhanced)

```sql
-- Enhance existing revenue_snapshots table with Polar-specific fields

ALTER TABLE revenue_snapshots
ADD COLUMN IF NOT EXISTS polar_orders INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS polar_subscriptions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stripe_orders INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stripe_subscriptions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS source_breakdown JSONB DEFAULT '{}';
```

## Related Code Files

### To Create

- `supabase/migrations/202603071600_polar_analytics_events.sql`
- `supabase/migrations/202603071630_cohort_metrics_tables.sql`

### To Modify

- `supabase/migrations/202603071500_revenue_analytics_schema.sql` (add Polar fields)

## Implementation Steps

### Step 1: Create Migration Files

Create two migration files:
1. `202603071600_polar_analytics_events.sql` - Event storage tables
2. `202603071630_cohort_metrics_tables.sql` - Cohort analytics tables

### Step 2: Implement RLS Policies

```sql
-- Admin can read all
CREATE POLICY admin_read_polar_events ON polar_webhook_events
  FOR SELECT USING (is_admin());

-- Users can read their own events
CREATE POLICY user_read_own_events ON polar_webhook_events
  FOR SELECT USING (customer_id = auth.uid());
```

### Step 3: Create Aggregation Functions

```sql
-- Nightly cohort metric computation
CREATE OR REPLACE FUNCTION compute_cohort_metrics()
RETURNS void AS $$
BEGIN
  -- Compute for each cohort/month
  INSERT INTO cohort_retention_metrics
  SELECT
    cohort_month,
    period_day,
    cohort_size,
    active_users,
    retained_percentage,
    cumulative_revenue_cents,
    arpu_cents
  FROM computed_cohort_view
  ON CONFLICT (cohort_month, period_day) DO UPDATE
  SET ...;
END;
$$ LANGUAGE plpgsql;
```

### Step 4: Deploy Migrations

```bash
npx supabase db push
```

## Todo List

- [ ] Create `polar_webhook_events` table migration
- [ ] Create `customer_cohorts` table migration
- [ ] Create `cohort_retention_metrics` table migration
- [ ] Add RLS policies for all tables
- [ ] Create aggregation function `compute_cohort_metrics()`
- [ ] Add indexes for query performance
- [ ] Test migration locally
- [ ] Deploy to production

## Success Criteria

- [ ] All tables created with proper constraints
- [ ] RLS policies allow admin read, user read-own
- [ ] Indexes exist for date range queries
- [ ] Migration runs without errors
- [ ] `compute_cohort_metrics()` function works

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Large event table grows fast | Add partitioning by received_at if >1M rows |
| Cohort computation slow | Run as nightly cron, not on-demand |
| Idempotency conflicts | Use event_id UNIQUE constraint |

## Next Steps

After schema is ready:
1. Update Polar webhook handler to insert events
2. Build React hooks to query cohort data
3. Create dashboard UI components
