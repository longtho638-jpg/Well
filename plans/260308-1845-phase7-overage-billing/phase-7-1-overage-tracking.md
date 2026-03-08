---
title: "Phase 7.1: Overage Tracking"
description: "Track usage exceeding licensed quotas and calculate overage costs"
status: pending
priority: P1
effort: 2h
---

# Phase 7.1: Overage Tracking

## Context Links

- Related: `./plan.md` - Phase 7 overview
- Related: `../260308-1049-overage-billing-dunning/plan.md` - Previous overage billing research
- Files: `src/lib/usage-metering.ts`, `src/lib/stripe-billing-client.ts`

## Overview

Track usage that exceeds licensed quotas and calculate overage costs based on metric type.

## Key Insights

From Phase 6 research:
- Overage = Usage - Effective Quota (Base + Overrides + Grace)
- Different metrics need different overage rates (API calls vs AI calls vs Storage)
- Stripe Usage Records API supports both `increment` and `set` actions

## Requirements

### Functional
1. Track usage per metric type (api_calls, ai_calls, storage_gb, emails)
2. Calculate overage units when usage > quota
3. Apply metric-specific overage rates
4. Store overage records with timestamp and metadata

### Non-Functional
- Sub-100ms latency for overage calculation
- Atomic operations to prevent double-counting
- Audit trail for all overage events

## Architecture

```
Usage Event → Track Usage → Check Quota → Calculate Overage → Store Record
                                                          ↓
                                                    Sync to Stripe
```

## Database Schema

```sql
-- Overage tracking table
CREATE TABLE overage_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  tenant_id UUID REFERENCES tenants(id),
  metric_type TEXT NOT NULL,
  billing_period TEXT NOT NULL,  -- '2026-03'

  -- Usage details
  total_usage BIGINT NOT NULL,
  included_quota BIGINT NOT NULL,
  overage_units BIGINT NOT NULL,

  -- Pricing
  rate_per_unit NUMERIC(10, 6) NOT NULL,
  total_cost NUMERIC(12, 2) NOT NULL,

  -- Stripe sync
  stripe_subscription_item_id TEXT,
  stripe_usage_record_id TEXT,
  stripe_synced_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_overage_org_period ON overage_transactions(org_id, billing_period);
CREATE INDEX idx_overage_stripe_sync ON overage_transactions(stripe_usage_record_id);
```

## Implementation Steps

1. Create database migration for overage_transactions
2. Add `calculateOverage()` function to usage-metering.ts
3. Create `trackOverage()` function with Stripe sync
4. Add `getOverageHistory()` for dashboard display

## Todo List

- [ ] Create Supabase migration
- [ ] Implement overage calculation logic
- [ ] Add Stripe usage record sync
- [ ] Create client-side hooks
- [ ] Write unit tests

## Success Criteria

1. Overage calculated correctly for each metric type
2. Stripe usage records created within 5 minutes
3. No duplicate overage records (idempotency)

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Double-charging due to race conditions | High | Use DB constraints + idempotency keys |
| Stripe sync fails silently | High | Retry with exponential backoff + alerts |

## Security Considerations

- RLS: Users can only view overages for their org
- Service role only: Stripe sync operations
- Audit logging: All overage calculations logged
