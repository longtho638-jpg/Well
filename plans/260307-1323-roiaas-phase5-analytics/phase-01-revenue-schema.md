---
title: Phase 1 - Revenue Schema & Types
description: Database schema for revenue tracking, ROI types, and i18n keys
status: pending
priority: P1
effort: 2h
blockedBy: []
---

# Phase 1: Revenue Schema & Types

## Overview

Create database schema for revenue tracking and ROI analytics.

## Requirements

### Revenue Tables
- `revenue_snapshots` - Daily GMV/MRR/ARR snapshots
- `roi_calculations` - ROI per license key
- `cohort_metrics` - User cohort analysis

### Types & Interfaces
- Revenue analytics types
- ROI calculation interfaces
- i18n translation keys

## Implementation Steps

### 1.1 Create Migration File

File: `supabase/migrations/202603071500_revenue_analytics_schema.sql`

```sql
-- Revenue Snapshots Table
CREATE TABLE revenue_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- GMV Metrics
  gmv_total DECIMAL(12,2) DEFAULT 0,
  gmv_subscription DECIMAL(12,2) DEFAULT 0,
  gmv_usage_based DECIMAL(12,2) DEFAULT 0,

  -- MRR Metrics
  mrr_total DECIMAL(12,2) DEFAULT 0,
  mrr_new DECIMAL(12,2) DEFAULT 0,
  mrr_expansion DECIMAL(12,2) DEFAULT 0,
  mrr_contraction DECIMAL(12,2) DEFAULT 0,
  mrr_churn DECIMAL(12,2) DEFAULT 0,

  -- ARR Metrics
  arr_total DECIMAL(12,2) DEFAULT 0,

  -- Customer Metrics
  total_customers INTEGER DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  churned_customers INTEGER DEFAULT 0,

  -- Tier Breakdown
  tier_breakdown JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(snapshot_date)
);

-- ROI Calculations Table
CREATE TABLE roi_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID REFERENCES raas_licenses(id),
  user_id UUID REFERENCES auth.users(id),
  org_id UUID REFERENCES organizations(id),

  calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Revenue
  revenue_subscription DECIMAL(12,2) DEFAULT 0,
  revenue_usage_based DECIMAL(12,2) DEFAULT 0,
  revenue_total DECIMAL(12,2) DEFAULT 0,

  -- Costs
  cost_api_calls DECIMAL(12,2) DEFAULT 0,
  cost_tokens DECIMAL(12,2) DEFAULT 0,
  cost_compute DECIMAL(12,2) DEFAULT 0,
  cost_total DECIMAL(12,2) DEFAULT 0,

  -- ROI Metrics
  roi_absolute DECIMAL(12,2) DEFAULT 0,  -- Revenue - Cost
  roi_percentage DECIMAL(5,2) DEFAULT 0,  -- (Revenue - Cost) / Cost * 100
  margin_percentage DECIMAL(5,2) DEFAULT 0,  -- (Revenue - Cost) / Revenue * 100

  -- Usage Metrics
  api_calls INTEGER DEFAULT 0,
  tokens INTEGER DEFAULT 0,
  agent_executions INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(license_id, calculation_date)
);

-- Cohort Metrics Table
CREATE TABLE cohort_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_month DATE NOT NULL,  -- First day of month
  cohort_size INTEGER NOT NULL,

  -- Period Metrics
  period_day INTEGER NOT NULL,  -- Day 0, 30, 60, 90...
  active_users INTEGER DEFAULT 0,
  retained_percentage DECIMAL(5,2) DEFAULT 0,

  -- Revenue Metrics
  revenue_cumulative DECIMAL(12,2) DEFAULT 0,
  arpu DECIMAL(10,2) DEFAULT 0,  -- Average Revenue Per User

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(cohort_month, period_day)
);

-- Indexes for Performance
CREATE INDEX idx_revenue_snapshots_date ON revenue_snapshots(snapshot_date DESC);
CREATE INDEX idx_roi_calculations_license ON roi_calculations(license_id);
CREATE INDEX idx_roi_calculations_date ON roi_calculations(calculation_date DESC);
CREATE INDEX idx_cohort_metrics_month ON cohort_metrics(cohort_month, period_day);

-- RLS Policies
ALTER TABLE revenue_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_metrics ENABLE ROW LEVEL SECURITY;

-- Admin can read all revenue data
CREATE POLICY admin_read_revenue ON revenue_snapshots
  FOR SELECT USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY admin_read_roi ON roi_calculations
  FOR SELECT USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY admin_read_cohort ON cohort_metrics
  FOR SELECT USING (auth.jwt()->>'role' = 'admin');

-- Users can read their own ROI
CREATE POLICY user_read_own_roi ON roi_calculations
  FOR SELECT USING (user_id = auth.uid());

-- Daily snapshot function
CREATE OR REPLACE FUNCTION capture_daily_revenue_snapshot()
RETURNS void AS $$
BEGIN
  INSERT INTO revenue_snapshots (
    gmv_total, gmv_subscription, gmv_usage_based,
    mrr_total, mrr_new, mrr_expansion, mrr_contraction, mrr_churn,
    arr_total, total_customers, new_customers, churned_customers,
    tier_breakdown
  )
  SELECT
    -- GMV from payment_intents
    COALESCE(SUM(amount), 0) as gmv_total,
    COALESCE(SUM(CASE WHEN type = 'subscription' THEN amount ELSE 0 END), 0) as gmv_subscription,
    COALESCE(SUM(CASE WHEN type = 'usage' THEN amount ELSE 0 END), 0) as gmv_usage_based,

    -- MRR calculation
    COALESCE(SUM(CASE WHEN status = 'active' THEN monthly_amount ELSE 0 END), 0) as mrr_total,
    0 as mrr_new,  -- Would need historical comparison
    0 as mrr_expansion,
    0 as mrr_contraction,
    0 as mrr_churn,

    -- ARR
    COALESCE(SUM(CASE WHEN status = 'active' THEN monthly_amount * 12 ELSE 0 END), 0) as arr_total,

    -- Customer counts
    COUNT(DISTINCT user_id) as total_customers,
    0 as new_customers,
    0 as churned_customers,

    -- Tier breakdown
    jsonb_build_object(
      'free', COUNT(CASE WHEN tier = 'free' THEN 1 END),
      'basic', COUNT(CASE WHEN tier = 'basic' THEN 1 END),
      'premium', COUNT(CASE WHEN tier = 'premium' THEN 1 END),
      'enterprise', COUNT(CASE WHEN tier = 'enterprise' THEN 1 END),
      'master', COUNT(CASE WHEN tier = 'master' THEN 1 END)
    ) as tier_breakdown

  FROM raas_licenses rl
  LEFT JOIN payment_intents pi ON rl.user_id = pi.user_id
    AND pi.created_at >= CURRENT_DATE - INTERVAL '30 days'
  WHERE rl.status = 'active';
END;
$$ LANGUAGE plpgsql;
```

### 1.2 Create TypeScript Types

File: `src/types/revenue-analytics.ts`

```typescript
/**
 * Revenue Analytics Types - ROIaaS Phase 5
 */

export interface RevenueSnapshot {
  id: string
  snapshot_date: string
  gmv: {
    total: number
    subscription: number
    usage_based: number
  }
  mrr: {
    total: number
    new: number
    expansion: number
    contraction: number
    churn: number
  }
  arr: {
    total: number
  }
  customers: {
    total: number
    new: number
    churned: number
  }
  tier_breakdown: Record<string, number>
}

export interface ROICalculation {
  id: string
  license_id: string
  user_id: string
  calculation_date: string
  revenue: {
    subscription: number
    usage_based: number
    total: number
  }
  costs: {
    api_calls: number
    tokens: number
    compute: number
    total: number
  }
  metrics: {
    roi_absolute: number
    roi_percentage: number
    margin_percentage: number
  }
  usage: {
    api_calls: number
    tokens: number
    agent_executions: number
  }
}

export interface CohortMetric {
  id: string
  cohort_month: string
  cohort_size: number
  period_day: number
  active_users: number
  retained_percentage: number
  revenue_cumulative: number
  arpu: number
}

export interface RevenueDashboardData {
  currentSnapshot: RevenueSnapshot
  previousSnapshot: RevenueSnapshot | null
  trend: {
    gmv: number  // percentage change
    mrr: number
    arr: number
  }
}

// Cost configuration for ROI calculations
export interface CostConfig {
  cost_per_1k_api_calls: number
  cost_per_1k_tokens: number
  cost_per_minute_compute: number
  cost_per_inference: number
  cost_per_agent_execution: number
}

// Default cost configuration
export const DEFAULT_COST_CONFIG: CostConfig = {
  cost_per_1k_api_calls: 0.001,      // $0.001 per 1K calls
  cost_per_1k_tokens: 0.002,         // $0.002 per 1K tokens
  cost_per_minute_compute: 0.05,     // $0.05 per minute
  cost_per_inference: 0.01,          // $0.01 per inference
  cost_per_agent_execution: 0.10,    // $0.10 per execution
}
```

### 1.3 Add i18n Keys

File: `src/locales/en/analytics.ts` (create)
File: `src/locales/vi/analytics.ts` (create)

```typescript
// English
export const analytics = {
  revenue: {
    gmv: 'GMV',
    mrr: 'MRR',
    arr: 'ARR',
    total: 'Total Revenue',
    subscription: 'Subscription',
    usage_based: 'Usage-Based',
  },
  roi: {
    title: 'ROI Analytics',
    absolute: 'Absolute ROI',
    percentage: 'ROI %',
    margin: 'Margin %',
    costs: 'Total Costs',
  },
  metrics: {
    dau: 'Daily Active Users',
    mau: 'Monthly Active Users',
    conversion: 'Conversion Rate',
    churn: 'Churn Rate',
    retention: 'Retention Rate',
  },
}
```

## Todo List

- [ ] Create migration file
- [ ] Run migration on Supabase
- [ ] Create TypeScript types
- [ ] Create i18n files (en/vi)
- [ ] Verify tables created
- [ ] Test RLS policies

## Success Criteria

- [ ] All 3 tables created with indexes
- [ ] RLS policies working
- [ ] TypeScript types compile (0 errors)
- [ ] i18n keys available in both languages

## Next Steps

After schema complete → Phase 2 (Revenue Hooks)

---

_Effort: 2h | Priority: P1 | Status: Ready_
