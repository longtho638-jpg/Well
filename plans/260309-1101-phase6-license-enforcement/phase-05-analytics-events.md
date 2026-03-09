---
phase: 6.5
title: "Analytics Event Emission"
description: "Emit suspension and license validation events to Analytics dashboard for visibility and churn tracking"
status: pending
priority: P2
effort: 1.5h
---

# Phase 6.5: Analytics Event Emission

## Context Links

- Parent Plan: [./plan.md](./plan.md)
- Previous: [./phase-04-suspension-logic.md](./phase-04-suspension-logic.md)
- Next: [./phase-06-testing-verification.md](./phase-06-testing-verification.md)
- Existing: `src/lib/analytics.ts` - Analytics logger
- Existing: `src/hooks/analytics/use-license-usage.ts` - License usage analytics

## Overview

| Attribute | Value |
|-----------|-------|
| **Priority** | P2 - Visibility & insights |
| **Effort** | 1.5 hours |
| **Status** | ⏳ Pending |

## Key Insights

- Analytics infrastructure already exists
- Need to emit events on license checks and suspensions
- Events should flow to dashboard in real-time
- Enable churn analysis and revenue protection metrics

## Requirements

### Functional

1. Emit `license_check` event on every validation
2. Emit `license_suspended` event on 403
3. Emit `subscription_warning` when approaching limits
4. Events visible in Analytics dashboard
5. Support filtering by org, user, reason

### Non-Functional

- Event emission async (non-blocking)
- Batch events for high-traffic endpoints
- Retain events for 90 days

## Event Types

| Event Name | Trigger | Payload |
|------------|---------|---------|
| `license_check` | Every API request | `{ orgId, userId, licenseKey, valid: boolean, tier, source }` |
| `license_suspended` | 403 response | `{ orgId, userId, reason, licenseStatus, subscriptionStatus }` |
| `subscription_warning` | Approaching limit | `{ orgId, daysRemaining, amountOwed, dunningStage }` |
| `grace_period_used` | Grace period access | `{ orgId, gracePeriodRemaining, subscriptionStatus }` |
| `admin_bypass_used` | Admin bypass | `{ adminId, targetOrgId, path, reason }` |

## Implementation Steps

### Step 1: Create License Analytics Types

**Files to Create:**
- `src/types/license-analytics.ts` - Event types

```typescript
export interface LicenseCheckEvent {
  event_type: 'license_check'
  org_id: string
  user_id?: string
  license_key: string
  valid: boolean
  tier?: string
  source: 'api' | 'dashboard' | 'webhook'
  response_time_ms?: number
  cached: boolean
  timestamp: string
  request_id: string
  path: string
}

export interface LicenseSuspensionEvent {
  event_type: 'license_suspension'
  org_id: string
  user_id?: string
  license_key?: string
  reason: string
  license_status?: string
  subscription_status?: string
  days_past_due?: number
  amount_owed?: number
  dunning_stage?: string
  timestamp: string
  request_id: string
  path: string
  ip_address?: string
}

export interface SubscriptionWarningEvent {
  event_type: 'subscription_warning'
  org_id: string
  user_id?: string
  warning_type: 'approaching_limit' | 'past_due' | 'dunning_started' | 'cancellation_pending'
  days_remaining?: number
  amount_owed?: number
  dunning_stage?: string
  quota_percentage?: number
  timestamp: string
}

export type LicenseAnalyticsEvent =
  | LicenseCheckEvent
  | LicenseSuspensionEvent
  | SubscriptionWarningEvent
```

### Step 2: Create License Analytics Emitter

**Files to Create:**
- `src/services/license-analytics.ts` - Event emitter

```typescript
import { supabase } from '@/lib/supabase'
import type {
  LicenseCheckEvent,
  LicenseSuspensionEvent,
  SubscriptionWarningEvent,
} from '@/types/license-analytics'

export class LicenseAnalyticsEmitter {
  private eventQueue: Array<LicenseCheckEvent | LicenseSuspensionEvent | SubscriptionWarningEvent> = []
  private readonly BATCH_SIZE = 50
  private readonly FLUSH_INTERVAL_MS = 5000

  constructor() {
    // Auto-flush every 5 seconds
    setInterval(() => this.flush(), this.FLUSH_INTERVAL_MS)
  }

  async emitLicenseCheck(event: Omit<LicenseCheckEvent, 'timestamp' | 'event_type'>): Promise<void> {
    const fullEvent: LicenseCheckEvent = {
      ...event,
      event_type: 'license_check',
      timestamp: new Date().toISOString(),
    }

    this.eventQueue.push(fullEvent)

    // Flush if batch size reached
    if (this.eventQueue.length >= this.BATCH_SIZE) {
      await this.flush()
    }
  }

  async emitSuspension(event: Omit<LicenseSuspensionEvent, 'timestamp' | 'event_type'>): Promise<void> {
    const fullEvent: LicenseSuspensionEvent = {
      ...event,
      event_type: 'license_suspension',
      timestamp: new Date().toISOString(),
    }

    // Insert immediately (not batched) for real-time alerts
    await this.insertEvent(fullEvent)
  }

  async emitSubscriptionWarning(event: Omit<SubscriptionWarningEvent, 'timestamp' | 'event_type'>): Promise<void> {
    const fullEvent: SubscriptionWarningEvent = {
      ...event,
      event_type: 'subscription_warning',
      timestamp: new Date().toISOString(),
    }

    this.eventQueue.push(fullEvent)

    if (this.eventQueue.length >= this.BATCH_SIZE) {
      await this.flush()
    }
  }

  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return

    const events = [...this.eventQueue]
    this.eventQueue = []

    try {
      await this.insertBatch(events)
    } catch (error) {
      console.error('[LicenseAnalytics] Flush failed:', error)
      // Re-queue events for retry
      this.eventQueue = [...events, ...this.eventQueue]
    }
  }

  private async insertBatch(
    events: Array<LicenseCheckEvent | SubscriptionWarningEvent>
  ): Promise<void> {
    const { error } = await supabase
      .from('license_analytics_events')
      .insert(
        events.map((e) => ({
          event_type: e.event_type,
          org_id: e.org_id,
          user_id: e.user_id,
          license_key: (e as LicenseCheckEvent).license_key,
          valid: (e as LicenseCheckEvent).valid,
          tier: (e as LicenseCheckEvent).tier,
          source: (e as LicenseCheckEvent).source,
          reason: (e as LicenseSuspensionEvent).reason,
          license_status: (e as LicenseSuspensionEvent).license_status,
          subscription_status: (e as LicenseSuspensionEvent).subscription_status,
          warning_type: (e as SubscriptionWarningEvent).warning_type,
          days_remaining: (e as SubscriptionWarningEvent).days_remaining,
          amount_owed: (e as SubscriptionWarningEvent).amount_owed,
          timestamp: e.timestamp,
          request_id: e.request_id,
          path: e.path,
        }))
      )

    if (error) throw error
  }

  private async insertEvent(event: LicenseSuspensionEvent): Promise<void> {
    const { error } = await supabase
      .from('license_analytics_events')
      .insert({
        event_type: event.event_type,
        org_id: event.org_id,
        user_id: event.user_id,
        reason: event.reason,
        license_status: event.license_status,
        subscription_status: event.subscription_status,
        days_past_due: event.days_past_due,
        amount_owed: event.amount_owed,
        dunning_stage: event.dunning_stage,
        timestamp: event.timestamp,
        request_id: event.request_id,
        path: event.path,
        ip_address: event.ip_address,
      })

    if (error) {
      console.error('[LicenseAnalytics] Insert failed:', error)
    }
  }
}

export const licenseAnalytics = new LicenseAnalyticsEmitter()
```

### Step 3: Create Database Table

**Files to Create:**
- `supabase/migrations/260309-license-analytics-table.sql`

```sql
CREATE TABLE IF NOT EXISTS license_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  org_id UUID NOT NULL,
  user_id UUID,
  license_key TEXT,
  valid BOOLEAN,
  tier TEXT,
  source TEXT,
  reason TEXT,
  license_status TEXT,
  subscription_status TEXT,
  warning_type TEXT,
  days_remaining INTEGER,
  amount_owed NUMERIC,
  dunning_stage TEXT,
  days_past_due INTEGER,
  quota_percentage INTEGER,
  timestamp TIMESTAMPTZ NOT NULL,
  request_id TEXT,
  path TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_license_analytics_org ON license_analytics_events(org_id, timestamp DESC);
CREATE INDEX idx_license_analytics_event_type ON license_analytics_events(event_type, timestamp DESC);
CREATE INDEX idx_license_analytics_request ON license_analytics_events(request_id);

-- Create view for dashboard
CREATE VIEW license_analytics_summary AS
SELECT
  org_id,
  event_type,
  DATE_TRUNC('hour', timestamp) as hour,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(CASE WHEN event_type = 'license_check' THEN (valid::int) END) as validity_rate
FROM license_analytics_events
WHERE timestamp > NOW() - INTERVAL '90 days'
GROUP BY org_id, event_type, DATE_TRUNC('hour', timestamp);
```

### Step 4: Integrate with Middleware

**Files to Modify:**
- `src/lib/raas-gate-quota.ts` - Add analytics emission

```typescript
import { licenseAnalytics } from '@/services/license-analytics'

// In license validation middleware
export async function licenseValidationMiddleware(request: Request) {
  const startTime = Date.now()
  const requestId = generateRequestId()
  const path = new URL(request.url).pathname
  const apiKey = request.headers.get('X-API-Key') || ''

  try {
    const result = await validateLicense(apiKey)

    // Emit license check event
    await licenseAnalytics.emitLicenseCheck({
      orgId: result.license?.orgId || 'unknown',
      userId: result.license?.userId,
      licenseKey: apiKey.substring(0, 12) + '...',
      valid: result.allowed,
      tier: result.license?.tier,
      source: 'api',
      response_time_ms: Date.now() - startTime,
      cached: result.cached || false,
      request_id: requestId,
      path,
    })

    if (!result.allowed) {
      // Emit suspension event
      await licenseAnalytics.emitSuspension({
        orgId: result.license?.orgId || 'unknown',
        userId: result.license?.userId,
        licenseKey: apiKey.substring(0, 12) + '...',
        reason: result.error || 'license_denied',
        license_status: result.license?.status,
        subscription_status: result.license?.subscriptionStatus,
        request_id: requestId,
        path,
      })
    }

    return result
  } catch (error) {
    // Log error event
    await licenseAnalytics.emitSuspension({
      orgId: 'unknown',
      reason: 'validation_error',
      license_status: 'error',
      request_id: requestId,
      path,
    })
    throw error
  }
}
```

### Step 5: Create Dashboard Hook

**Files to Create:**
- `src/hooks/analytics/use-license-analytics.ts` - Dashboard data hook

```typescript
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useLicenseAnalytics(orgId?: string, timeRange: '24h' | '7d' | '30d' = '7d') {
  return useQuery({
    queryKey: ['license-analytics', orgId, timeRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('license_analytics_events')
        .select('*')
        .eq('org_id', orgId || '')
        .gte('timestamp', getTimeRangeStart(timeRange))
        .order('timestamp', { ascending: false })
        .limit(1000)

      if (error) throw error
      return data
    },
  })
}

export function useLicenseSuspensionSummary(orgId?: string) {
  return useQuery({
    queryKey: ['license-suspension-summary', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_license_suspension_summary', { p_org_id: orgId })

      if (error) throw error
      return data
    },
  })
}

function getTimeRangeStart(range: string): string {
  const now = new Date()
  switch (range) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  }
}
```

## Todo List

- [ ] Create license analytics types
- [ ] Create LicenseAnalyticsEmitter class
- [ ] Implement batch flush mechanism
- [ ] Create database migration for events table
- [ ] Create summary view
- [ ] Integrate emission with middleware
- [ ] Create dashboard hook
- [ ] Add unit tests for emitter
- [ ] Test event visibility in dashboard

## Success Criteria

- [ ] License check events emitted on every request
- [ ] Suspension events emitted on 403
- [ ] Events visible in Analytics dashboard within 5 seconds
- [ ] Batch flush working (no event loss)
- [ ] Dashboard shows suspension trends
- [ ] Can filter by org, event type, date range

## Dashboard Queries

```sql
-- Suspensions by day
SELECT
  DATE_TRUNC('day', timestamp) as day,
  COUNT(*) as suspension_count,
  reason,
  subscription_status
FROM license_analytics_events
WHERE event_type = 'license_suspension'
  AND timestamp > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', timestamp), reason, subscription_status
ORDER BY day DESC;

-- License validity rate
SELECT
  DATE_TRUNC('hour', timestamp) as hour,
  AVG(valid::int) * 100 as validity_percentage,
  COUNT(*) as total_checks
FROM license_analytics_events
WHERE event_type = 'license_check'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour DESC;
```

## Next Steps

After analytics emission is implemented, proceed to [Phase 6.6](./phase-06-testing-verification.md) for testing.

---

_Created: 2026-03-09_
