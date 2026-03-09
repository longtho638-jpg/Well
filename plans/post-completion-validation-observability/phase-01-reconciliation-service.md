---
title: "Phase 1: Automated Reconciliation Service"
description: "Daily reconciliation job between RaaS Gateway and Stripe/Polar with auto-heal capability"
status: pending
priority: P1
effort: 4h
branch: main
tags: [reconciliation, billing, raas-gateway, stripe, polar]
created: 2026-03-09
---

# Phase 1: Automated Reconciliation Service

## Overview

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 - Revenue integrity |
| **Effort** | 4 hours |
| **Status** | Pending |
| **Dependencies** | Phase 7 overage billing complete |

## Context Links

- Parent Plan: `../plan.md`
- Related Code: `src/services/raas-gateway-usage-sync.ts`
- Related Code: `src/lib/polar-overage-client.ts`
- Related Code: `src/lib/stripe-billing-webhook-handler.ts`
- Edge Functions: `supabase/functions/sync-gateway-usage/`
- Edge Functions: `supabase/functions/stripe-overage-invoice/`

## Key Insights

From Phase 7 implementation:
- Usage data flows: Local → RaaS Gateway → Stripe/Polar
- No reconciliation layer exists to verify consistency
- Billing discrepancies could go undetected
- Auto-heal capability reduces manual intervention

## Requirements

### Functional Requirements

1. **Daily Reconciliation Job**
   - Runs at 2 AM UTC daily
   - Compares usage between Gateway KV and Stripe/Polar
   - Logs reconciliation results to database

2. **Discrepancy Detection**
   - Tolerance threshold: 5% (configurable)
   - Alert threshold: 10% (requires manual review)
   - Track discrepancy trends over time

3. **Auto-Heal Capability**
   - Sync missing records automatically
   - Retry failed syncs with exponential backoff
   - Dead-letter queue for unresolvable discrepancies

4. **Audit Trail**
   - Log all reconciliation runs
   - Track healed records
   - Export reconciliation reports

### Non-Functional Requirements

- Reconciliation latency: <5 minutes for 1000 orgs
- Zero data loss during sync
- Idempotent operations (safe to retry)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Daily Cron Trigger (2 AM UTC)                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  ReconciliationService.reconcileAllOrgs()                    │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│  Fetch Gateway Usage    │     │  Fetch Stripe/Polar     │
│  GET /api/v2/usage      │     │  getBilledUsage()       │
│  (raas.agencyos.net)    │     │  (Stripe API)           │
└─────────────────────────┘     └─────────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Compare & Calculate Discrepancy                             │
│  discrepancy = |gateway - stripe| / gateway                 │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
    ┌─────────────────┐             ┌─────────────────┐
    │ discrepancy ≤5% │             │ discrepancy >5% │
    │ Status: matched │             │ Trigger heal    │
    └─────────────────┘             └─────────────────┘
                                              │
                              ┌───────────────┴───────────────┐
                              │                               │
                              ▼                               ▼
                    ┌─────────────────┐             ┌─────────────────┐
                    │ 5-10%: Auto-heal│             │ >10%: Alert +   │
                    │ Sync missing    │             │ Manual review   │
                    └─────────────────┘             └─────────────────┘
```

## Related Code Files

### Files to Create
- `src/services/usage-reconciliation-service.ts`
- `supabase/functions/reconcile-gateway-billing/index.ts`
- `supabase/migrations/260309-reconciliation-log.sql`
- `src/__tests__/usage-reconciliation-service.test.ts`
- `src/__tests__/e2e/reconciliation-flow.test.ts`

### Files to Modify
- `.github/workflows/daily-reconciliation.yml` - Add cron job
- `src/lib/raas-gateway-client.ts` - Add getBilledUsage method
- `src/services/payment-retry-scheduler.ts` - Integration point

## Implementation Steps

### Step 1: Database Schema (30 min)

Create migration for reconciliation log table:

```sql
-- supabase/migrations/260309-reconciliation-log.sql

CREATE TABLE reconciliation_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  period TEXT NOT NULL,  -- YYYY-MM format
  gateway_usage BIGINT DEFAULT 0,
  stripe_usage BIGINT DEFAULT 0,
  polar_usage BIGINT DEFAULT 0,
  discrepancy_percent DECIMAL(5,2) DEFAULT 0,
  status TEXT CHECK (status IN ('matched', 'discrepancy_healed', 'manual_review')),
  healed_records JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reconciliation_org_period ON reconciliation_log(org_id, period);
CREATE INDEX idx_reconciliation_status ON reconciliation_log(status);
CREATE INDEX idx_reconciliation_created_at ON reconciliation_log(created_at);

-- Store reconciliation settings
CREATE TABLE reconciliation_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID UNIQUE REFERENCES organizations(id),
  tolerance_percent DECIMAL(5,2) DEFAULT 5.00,
  alert_threshold_percent DECIMAL(5,2) DEFAULT 10.00,
  enabled BOOLEAN DEFAULT true,
  schedule_cron TEXT DEFAULT '0 2 * * *',  -- 2 AM UTC
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RPC function to create reconciliation entry
CREATE OR REPLACE FUNCTION create_reconciliation_entry(
  p_org_id UUID,
  p_period TEXT,
  p_gateway_usage BIGINT,
  p_stripe_usage BIGINT,
  p_polar_usage BIGINT
) RETURNS UUID AS $$
DECLARE
  v_discrepancy DECIMAL(5,2);
  v_status TEXT;
  v_result UUID;
BEGIN
  -- Calculate discrepancy percentage
  IF p_gateway_usage > 0 THEN
    v_discrepancy := ABS(p_gateway_usage - p_stripe_usage)::DECIMAL / p_gateway_usage * 100;
  ELSE
    v_discrepancy := 0;
  END IF;

  -- Determine status
  IF v_discrepancy <= 5 THEN
    v_status := 'matched';
  ELSIF v_discrepancy <= 10 THEN
    v_status := 'discrepancy_healed';
  ELSE
    v_status := 'manual_review';
  END IF;

  -- Insert entry
  INSERT INTO reconciliation_log (
    org_id, period, gateway_usage, stripe_usage, polar_usage,
    discrepancy_percent, status
  ) VALUES (
    p_org_id, p_period, p_gateway_usage, p_stripe_usage, p_polar_usage,
    v_discrepancy, v_status
  ) RETURNING id INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Step 2: Reconciliation Service (2h)

Implement the core reconciliation service:

```typescript
// src/services/usage-reconciliation-service.ts

import type { SupabaseClient } from '@supabase/supabase-js'
import { analyticsLogger } from '@/utils/logger'
import { RaaSGatewayClient } from '@/lib/raas-gateway-client'
import { PolarOverageClient } from '@/lib/polar-overage-client'
import Stripe from 'stripe'

export interface ReconciliationResult {
  orgId: string
  period: string
  gatewayUsage: number
  stripeUsage: number
  polarUsage: number
  discrepancyPercent: number
  status: 'matched' | 'discrepancy_healed' | 'manual_review'
  healedRecords?: ReconciliationRecord[]
  errors?: string[]
}

export interface ReconciliationRecord {
  metricType: string
  gatewayValue: number
  stripeValue: number
  difference: number
  synced: boolean
}

export interface ReconciliationSettings {
  tolerancePercent: number  // Default: 5%
  alertThresholdPercent: number  // Default: 10%
  enabled: boolean
  scheduleCron: string
}

export class UsageReconciliationService {
  private supabase: SupabaseClient
  private gatewayClient: RaaSGatewayClient
  private polarClient: PolarOverageClient
  private stripeClient: Stripe
  private readonly DEFAULT_TOLERANCE = 0.05  // 5%
  private readonly ALERT_THRESHOLD = 0.10  // 10%

  constructor(
    supabase: SupabaseClient,
    gatewayClient: RaaSGatewayClient,
    polarClient: PolarOverageClient,
    stripeClient: Stripe
  ) {
    this.supabase = supabase
    this.gatewayClient = gatewayClient
    this.polarClient = polarClient
    this.stripeClient = stripeClient
  }

  /**
   * Run reconciliation for all active organizations
   */
  async reconcileAllOrgs(period?: string): Promise<ReconciliationResult[]> {
    try {
      // Get all active orgs with billing enabled
      const { data: orgs } = await this.supabase
        .from('organizations')
        .select('id, slug')
        .eq('status', 'active')
        .eq('billing_enabled', true)

      if (!orgs || orgs.length === 0) {
        analyticsLogger.info('[Reconciliation] No active orgs found')
        return []
      }

      const results: ReconciliationResult[] = []

      for (const org of orgs) {
        const result = await this.reconcileOrg(org.id, period)
        results.push(result)
      }

      analyticsLogger.info('[Reconciliation] Completed', {
        totalOrgs: results.length,
        matched: results.filter(r => r.status === 'matched').length,
        healed: results.filter(r => r.status === 'discrepancy_healed').length,
        manualReview: results.filter(r => r.status === 'manual_review').length,
      })

      return results
    } catch (error) {
      analyticsLogger.error('[Reconciliation] reconcileAllOrgs error', error)
      return []
    }
  }

  /**
   * Run reconciliation for a single organization
   */
  async reconcileOrg(
    orgId: string,
    period?: string
  ): Promise<ReconciliationResult> {
    const targetPeriod = period || this.getCurrentPeriod()

    try {
      // Fetch usage from all sources
      const [gatewayUsage, stripeUsage, polarUsage] = await Promise.all([
        this.fetchGatewayUsage(orgId, targetPeriod),
        this.fetchStripeUsage(orgId, targetPeriod),
        this.fetchPolarUsage(orgId, targetPeriod),
      ])

      // Calculate discrepancy (use Stripe as primary, Polar as fallback)
      const billingUsage = stripeUsage > 0 ? stripeUsage : polarUsage
      const discrepancy = this.calculateDiscrepancy(gatewayUsage, billingUsage)

      // Determine status
      const status = this.determineStatus(discrepancy)

      // Auto-heal if discrepancy > tolerance
      let healedRecords: ReconciliationRecord[] = []
      if (discrepancy > this.DEFAULT_TOLERANCE && discrepancy <= this.ALERT_THRESHOLD) {
        healedRecords = await this.autoHeal(orgId, targetPeriod, gatewayUsage, billingUsage)
      }

      // Log reconciliation result
      await this.logReconciliation(orgId, targetPeriod, gatewayUsage, billingUsage, polarUsage, discrepancy, status, healedRecords)

      // Send alert if discrepancy > alert threshold
      if (discrepancy > this.ALERT_THRESHOLD) {
        await this.sendReconciliationAlert(orgId, discrepancy, gatewayUsage, billingUsage)
      }

      return {
        orgId,
        period: targetPeriod,
        gatewayUsage,
        stripeUsage,
        polarUsage,
        discrepancyPercent: Math.round(discrepancy * 10000) / 100,
        status,
        healedRecords,
      }
    } catch (error) {
      analyticsLogger.error('[Reconciliation] reconcileOrg error', { orgId, error })
      return {
        orgId,
        period: targetPeriod,
        gatewayUsage: 0,
        stripeUsage: 0,
        polarUsage: 0,
        discrepancyPercent: 0,
        status: 'manual_review',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      }
    }
  }

  /**
   * Fetch usage from RaaS Gateway KV
   */
  private async fetchGatewayUsage(orgId: string, period: string): Promise<number> {
    try {
      const { data } = await this.gatewayClient.getUsage({ orgId, period })
      return data?.totalUsage || 0
    } catch (error) {
      analyticsLogger.error('[Reconciliation] fetchGatewayUsage error', { orgId, error })
      return 0
    }
  }

  /**
   * Fetch billed usage from Stripe
   */
  private async fetchStripeUsage(orgId: string, period: string): Promise<number> {
    try {
      // Get Stripe customer ID for org
      const { data: billing } = await this.supabase
        .from('billing_subscriptions')
        .select('stripe_customer_id')
        .eq('org_id', orgId)
        .single()

      if (!billing?.stripe_customer_id) {
        return 0
      }

      // Fetch usage records from Stripe
      const usageRecords = await this.stripeClient.subscriptionItems.list({
        customer: billing.stripe_customer_id,
        limit: 100,
      })

      let totalUsage = 0
      for (const item of usageRecords.data) {
        const usage = await this.stripeClient.subscriptionItems.readUsageRecord(
          item.id,
          { period }
        )
        totalUsage += usage.data.reduce((sum, r) => sum + r.quantity, 0)
      }

      return totalUsage
    } catch (error) {
      analyticsLogger.error('[Reconciliation] fetchStripeUsage error', { orgId, error })
      return 0
    }
  }

  /**
   * Fetch billed usage from Polar
   */
  private async fetchPolarUsage(orgId: string, period: string): Promise<number> {
    try {
      const { data } = await this.polarClient.getBilledUsage({ orgId, period })
      return data?.totalUsage || 0
    } catch (error) {
      analyticsLogger.error('[Reconciliation] fetchPolarUsage error', { orgId, error })
      return 0
    }
  }

  /**
   * Calculate discrepancy percentage
   */
  private calculateDiscrepancy(gateway: number, billing: number): number {
    if (gateway === 0) return 0
    return Math.abs(gateway - billing) / gateway
  }

  /**
   * Determine reconciliation status based on discrepancy
   */
  private determineStatus(discrepancy: number): 'matched' | 'discrepancy_healed' | 'manual_review' {
    if (discrepancy <= this.DEFAULT_TOLERANCE) {
      return 'matched'
    }
    if (discrepancy <= this.ALERT_THRESHOLD) {
      return 'discrepancy_healed'
    }
    return 'manual_review'
  }

  /**
   * Auto-heal: Sync missing records
   */
  private async autoHeal(
    orgId: string,
    period: string,
    gatewayUsage: number,
    billingUsage: number
  ): Promise<ReconciliationRecord[]> {
    try {
      const difference = gatewayUsage - billingUsage

      if (difference > 0) {
        // Gateway has more usage - sync missing to Stripe/Polar
        analyticsLogger.info('[Reconciliation] Auto-healing missing records', {
          orgId,
          difference,
        })

        // Call Edge Function to sync missing usage
        await this.supabase.functions.invoke('sync-stripe-usage', {
          body: { orgId, period, source: 'gateway' },
        })
      }

      return [{
        metricType: 'api_calls',
        gatewayValue: gatewayUsage,
        stripeValue: billingUsage,
        difference,
        synced: true,
      }]
    } catch (error) {
      analyticsLogger.error('[Reconciliation] autoHeal error', { orgId, error })
      return []
    }
  }

  /**
   * Log reconciliation result to database
   */
  private async logReconciliation(
    orgId: string,
    period: string,
    gatewayUsage: number,
    billingUsage: number,
    polarUsage: number,
    discrepancy: number,
    status: string,
    healedRecords: ReconciliationRecord[]
  ): Promise<void> {
    try {
      await this.supabase.rpc('create_reconciliation_entry', {
        p_org_id: orgId,
        p_period: period,
        p_gateway_usage: gatewayUsage,
        p_stripe_usage: billingUsage,
        p_polar_usage: polarUsage,
      })

      // Insert healed records if any
      if (healedRecords.length > 0) {
        await this.supabase
          .from('reconciliation_log')
          .update({ healed_records: JSON.stringify(healedRecords) })
          .eq('org_id', orgId)
          .eq('period', period)
      }
    } catch (error) {
      analyticsLogger.error('[Reconciliation] logReconciliation error', error)
    }
  }

  /**
   * Send alert for high discrepancy
   */
  private async sendReconciliationAlert(
    orgId: string,
    discrepancy: number,
    gatewayUsage: number,
    billingUsage: number
  ): Promise<void> {
    try {
      await this.supabase.functions.invoke('send-anomaly-alert', {
        body: {
          type: 'reconciliation',
          orgId,
          severity: 'high',
          message: `Billing discrepancy ${(discrepancy * 100).toFixed(2)}%`,
          details: {
            gatewayUsage,
            billingUsage,
            difference: gatewayUsage - billingUsage,
          },
        },
      })
    } catch (error) {
      analyticsLogger.error('[Reconciliation] sendReconciliationAlert error', error)
    }
  }

  /**
   * Get current period in YYYY-MM format
   */
  private getCurrentPeriod(): string {
    return new Date().toISOString().slice(0, 7)
  }
}

export default UsageReconciliationService
```

### Step 3: Edge Function (1h)

Create Edge Function for serverless execution:

```typescript
// supabase/functions/reconcile-gateway-billing/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { UsageReconciliationService } from 'npm:/@well/services/usage-reconciliation-service'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { period } = await req.json()

    const reconciliationService = new UsageReconciliationService(
      supabaseClient,
      gatewayClient,
      polarClient,
      stripeClient
    )

    const results = await reconciliationService.reconcileAllOrgs(period)

    return new Response(JSON.stringify({
      success: true,
      results,
      summary: {
        total: results.length,
        matched: results.filter(r => r.status === 'matched').length,
        healed: results.filter(r => r.status === 'discrepancy_healed').length,
        manualReview: results.filter(r => r.status === 'manual_review').length,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in reconcile-gateway-billing:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
```

### Step 4: Tests (30 min)

```typescript
// src/__tests__/usage-reconciliation-service.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UsageReconciliationService } from '@/services/usage-reconciliation-service'

describe('UsageReconciliationService', () => {
  let service: UsageReconciliationService
  let mockSupabase: any
  let mockGatewayClient: any
  let mockPolarClient: any
  let mockStripeClient: any

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      rpc: vi.fn(),
      functions: { invoke: vi.fn() },
    }

    mockGatewayClient = { getUsage: vi.fn() }
    mockPolarClient = { getBilledUsage: vi.fn() }
    mockStripeClient = {
      subscriptionItems: {
        list: vi.fn(),
        readUsageRecord: vi.fn(),
      },
    }

    service = new UsageReconciliationService(
      mockSupabase,
      mockGatewayClient,
      mockPolarClient,
      mockStripeClient
    )
  })

  describe('calculateDiscrepancy', () => {
    it('returns 0 when gateway usage is 0', () => {
      // Test implementation
    })

    it('calculates correct discrepancy percentage', () => {
      // Test implementation
    })

    it('handles exact match (0% discrepancy)', () => {
      // Test implementation
    })
  })

  describe('determineStatus', () => {
    it('returns matched for discrepancy <= 5%', () => {
      // Test implementation
    })

    it('returns discrepancy_healed for 5-10%', () => {
      // Test implementation
    })

    it('returns manual_review for discrepancy > 10%', () => {
      // Test implementation
    })
  })
})
```

## Success Criteria

- [ ] Migration deployed and tested
- [ ] ReconciliationService reconciles all orgs daily
- [ ] Discrepancy detection with 5% tolerance
- [ ] Auto-heal syncs missing records
- [ ] Alerts sent for >10% discrepancy
- [ ] Audit trail in reconciliation_log table
- [ ] Unit tests pass (>90% coverage)
- [ ] E2E test validates full flow

## Todo List

- [ ] Create database migration
- [ ] Implement UsageReconciliationService
- [ ] Create Edge Function
- [ ] Write unit tests
- [ ] Write E2E test
- [ ] Configure daily cron (2 AM UTC)
- [ ] Deploy and validate

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| False positive discrepancies | Low | Configurable tolerance |
| Stripe API rate limits | Medium | Batch requests, caching |
| Auto-heal creates duplicates | High | Idempotency keys |

---

_Created: 2026-03-09 | Status: Pending | Priority: P1_
