---
title: "Phase 6.1: Supabase Realtime Pipeline"
description: "Database triggers, realtime channels, event aggregation"
status: pending
priority: P1
effort: 2h
---

# Phase 6.1: Supabase Realtime Pipeline

## Overview

Set up Supabase Realtime infrastructure for streaming analytics events to dashboard with 5-second batch aggregation.

## Architecture

```
raas_analytics_events (table)
       │
       ├── INSERT trigger → realtime channel
       │
       ├── Aggregation function (5s batch)
       │
       └── RLS policies for org isolation
```

## Implementation Steps

### 1. Database Migration (`supabase/migrations/260309_realtime_pipeline.sql`)

```sql
-- Enable realtime for analytics events table
ALTER PUBLICATION supabase_realtime ADD TABLE raas_analytics_events;

-- Create trigger function for realtime broadcast
CREATE OR REPLACE FUNCTION broadcast_analytics_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Broadcast to org-specific channel
  PERFORM pg_notify(
    'realtime:raas_analytics_events',
    json_build_object(
      'schema', NEW.schema,
      'table', 'raas_analytics_events',
      'commit_timestamp', to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
      'multitransaction_id', '',
      'operation', 'INSERT',
      'key', json_build_object('org_id', NEW.org_id),
      'record', row_to_json(NEW),
      'type', 'INSERT'
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER broadcast_analytics_event_trigger
  AFTER INSERT ON raas_analytics_events
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_analytics_event();

-- Create aggregation function (5s batch window)
CREATE OR REPLACE FUNCTION aggregate_analytics_events(
  p_org_id TEXT,
  p_window_seconds INTEGER DEFAULT 5
)
RETURNS TABLE (
  event_type TEXT,
  event_count BIGINT,
  window_start TIMESTAMPTZ,
  window_end TIMESTAMPTZ,
  aggregated_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.event_type,
    COUNT(*) as event_count,
    date_trunc('minute', e.timestamp) as window_start,
    date_trunc('minute', e.timestamp) + (p_window_seconds || ' seconds')::INTERVAL as window_end,
    jsonb_agg(row_to_json(e)) as aggregated_data
  FROM raas_analytics_events e
  WHERE e.org_id = p_org_id
    AND e.timestamp >= NOW() - (p_window_seconds || ' seconds')::INTERVAL
  GROUP BY e.event_type, window_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for aggregation performance
CREATE INDEX IF NOT EXISTS idx_analytics_aggregation
  ON raas_analytics_events(org_id, event_type, timestamp DESC);
```

### 2. Realtime Subscription Hook (`src/hooks/use-raas-realtime-analytics.ts`)

```typescript
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { RaasAnalyticsEvent } from '@/lib/raas-analytics-events'

interface UseRaasRealtimeAnalyticsOptions {
  orgId: string
  enabled?: boolean
  onEvent?: (event: RaasAnalyticsEvent) => void
}

export function useRaasRealtimeAnalytics(options: UseRaasRealtimeAnalyticsOptions) {
  const { orgId, enabled = true, onEvent } = options
  const [events, setEvents] = useState<RaasAnalyticsEvent[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEvent = useCallback((payload: any) => {
    const event = payload.record as RaasAnalyticsEvent
    setEvents(prev => [event, ...prev].slice(0, 100)) // Keep last 100
    onEvent?.(event)
  }, [onEvent])

  useEffect(() => {
    if (!orgId || !enabled) return

    const channel = supabase
      .channel(`raas_analytics:${orgId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'raas_analytics_events',
          filter: `org_id=eq.${orgId}`,
        },
        handleEvent
      )
      .on('system', { event: '*' }, (payload) => {
        if (payload.type === 'phx_reply') {
          setConnected(true)
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnected(true)
          setError(null)
        } else if (status === 'CHANNEL_ERROR') {
          setConnected(false)
          setError('Realtime connection failed')
        }
      })

    return () => {
      channel.unsubscribe()
      setConnected(false)
    }
  }, [orgId, enabled, handleEvent])

  const fetchRecentEvents = useCallback(async () => {
    const { data } = await supabase
      .from('raas_analytics_events')
      .select('*')
      .eq('org_id', orgId)
      .order('timestamp', { ascending: false })
      .limit(50)

    if (data) {
      setEvents(data as unknown as RaasAnalyticsEvent[])
    }
  }, [orgId])

  return {
    events,
    connected,
    error,
    fetchRecentEvents,
  }
}
```

### 3. Event Aggregation Service (`src/lib/raas-event-aggregator.ts`)

```typescript
import { supabase } from '@/lib/supabase'

export interface AggregatedEventBatch {
  event_type: string
  event_count: number
  window_start: string
  window_end: string
  aggregated_data: Record<string, any>[]
}

export class RaasEventAggregator {
  private readonly windowSeconds: number
  private batchBuffer: Map<string, AggregatedEventBatch> = new Map()
  private flushTimer: ReturnType<typeof setTimeout> | null = null

  constructor(windowSeconds: number = 5) {
    this.windowSeconds = windowSeconds
    this.startFlushTimer()
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error)
    }, this.windowSeconds * 1000)
  }

  async flush(): Promise<void> {
    if (this.batchBuffer.size === 0) return

    const batches = Array.from(this.batchBuffer.values())
    this.batchBuffer.clear()

    // Store aggregated batches
    for (const batch of batches) {
      await supabase
        .from('raas_event_aggregations')
        .insert({
          event_type: batch.event_type,
          event_count: batch.event_count,
          window_start: batch.window_start,
          window_end: batch.window_end,
          aggregated_data: batch.aggregated_data,
        })
    }
  }

  stop() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
  }
}

export const raasEventAggregator = new RaasEventAggregator(5)
```

## Success Criteria

- [ ] Migration deployed with triggers
- [ ] Realtime subscription working
- [ ] Events stream to dashboard in real-time
- [ ] 5s aggregation batching functional

## Related Files

- Create: `supabase/migrations/260309_realtime_pipeline.sql`
- Create: `src/hooks/use-raas-realtime-analytics.ts`
- Create: `src/lib/raas-event-aggregator.ts`
