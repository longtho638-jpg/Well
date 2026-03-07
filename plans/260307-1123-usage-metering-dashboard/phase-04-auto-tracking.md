---
phase: 4
title: Auto-Tracking Middleware
status: pending
effort: 2h
---

# Phase 4: Auto-Tracking Middleware

## Overview

Implement automatic usage tracking for all API calls and AI inferences using HTTP interceptors and middleware. No manual instrumentation required.

## Context Links

- **RaaS Interceptor:** `src/lib/raas-http-interceptor.ts` - Pattern reference
- **UsageMeter SDK:** `src/lib/usage-metering.ts` - SDK for tracking
- **API Client:** `src/utils/api.ts` - ApiClient to patch

## Key Insights

1. **Existing RaaS interceptor pattern** - patch `api.getHeaders()` method
2. **Track after response** - don't block request/response cycle
3. **Batch tracking** - buffer events, flush every 10s or 10 events
4. **AI tracking needs manual call** - can't auto-detect token usage

## Requirements

### Functional

- [ ] Auto-track all API calls (endpoint, method, status)
- [ ] Track AI token usage (manual call from AI services)
- [ ] Track agent executions (manual call from agent-runner)
- [ ] Batch events for performance
- [ ] Retry failed tracking requests

### Non-Functional

- Zero impact on request latency (async tracking)
- No tracking data loss (queue + retry)
- Graceful degradation (if tracking fails, request still succeeds)

## Architecture

### Middleware Flow

```
Request → ApiClient.get() → Supabase Edge Function → Response
              │                                              │
              │                                              ▼
              │                                      Track API Call
              │                                              │
              ▼                                              ▼
        (before)                                      (async, non-blocking)
```

### Batch Tracker

```typescript
class UsageBatchTracker {
  private queue: UsageEvent[] = []
  private flushTimer: NodeJS.Timeout | null = null

  add(event: UsageEvent) {
    this.queue.push(event)
    if (this.queue.length >= 10) {
      this.flush()
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), 10000)
    }
  }

  async flush() {
    if (this.queue.length === 0) return
    const events = [...this.queue]
    this.queue = []
    // Send to /usage-analytics endpoint
    await fetch('/functions/v1/usage-analytics', {
      method: 'POST',
      body: JSON.stringify({ events }),
    })
  }
}
```

## Implementation Steps

### Step 1: Create Usage HTTP Interceptor

**File:** `src/lib/usage-http-interceptor.ts`

```typescript
/**
 * Usage Tracking HTTP Interceptor
 *
 * Automatically tracks all API calls by patching the ApiClient.
 * Tracking is async and non-blocking.
 */

import { api } from '@/utils/api'
import { UsageMeter } from '@/lib/usage-metering'
import { createClient } from '@supabase/supabase-js'

// ============================================================================
// INTERCEPTOR STATE
// ============================================================================

let interceptorEnabled = false
let originalGet: typeof api.get | null = null
let originalPost: typeof api.post | null = null
let originalPut: typeof api.put | null = null
let originalDelete: typeof api.delete | null = null

// Batch tracker
const trackingQueue: Array<{ endpoint: string; method: string; status: number; timestamp: string }> = []
let flushTimer: NodeJS.Timeout | null = null

// ============================================================================
// BATCH FLUSH
// ============================================================================

async function flushTrackingQueue(userId: string): Promise<void> {
  if (trackingQueue.length === 0) return

  const events = [...trackingQueue]
  trackingQueue.length = 0 // Clear queue

  try {
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    )
    const meter = new UsageMeter(supabase, { userId })

    // Batch track all API calls
    await meter.trackBatch(
      events.map(e => ({
        metric: 'api_call' as const,
        quantity: 1,
        metadata: {
          endpoint: e.endpoint,
          method: e.method,
          status_code: e.status,
        },
        timestamp: e.timestamp,
      }))
    )
  } catch (error) {
    // Silently fail - tracking should not break app
    console.error('[UsageInterceptor] Flush failed:', error)
    // Re-add to queue for retry
    trackingQueue.unshift(...events)
  }
}

function scheduleFlush(userId: string): void {
  if (flushTimer) clearTimeout(flushTimer)

  // Flush after 10 seconds or when 10 events accumulated
  flushTimer = setTimeout(() => flushTrackingQueue(userId), 10000)

  if (trackingQueue.length >= 10) {
    flushTrackingQueue(userId)
  }
}

// ============================================================================
// INTERCEPTOR LOGIC
// ============================================================================

function createTrackingProxy(userId: string): void {
  // Wrap original GET
  if (originalGet) {
    // @ts-expect-error - runtime patching
    api.get = async function(url: string, options?: any) {
      const response = await originalGet.call(this, url, options)
      trackingQueue.push({
        endpoint: url,
        method: 'GET',
        status: response?.status || 200,
        timestamp: new Date().toISOString(),
      })
      scheduleFlush(userId)
      return response
    }
  }

  // Wrap original POST
  if (originalPost) {
    // @ts-expect-error - runtime patching
    api.post = async function(url: string, options?: any) {
      const response = await originalPost.call(this, url, options)
      trackingQueue.push({
        endpoint: url,
        method: 'POST',
        status: response?.status || 200,
        timestamp: new Date().toISOString(),
      })
      scheduleFlush(userId)
      return response
    }
  }

  // Similar for PUT and DELETE
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Enable usage tracking interceptor
 * Call once at app startup
 */
export function enableUsageInterceptor(userId: string): void {
  if (interceptorEnabled) {
    return
  }

  try {
    // Store original methods
    originalGet = api.get.bind(api)
    originalPost = api.post.bind(api)
    originalPut = api.put.bind(api)
    originalDelete = api.delete.bind(api)

    // Create tracking proxy
    createTrackingProxy(userId)

    interceptorEnabled = true
    console.warn('[UsageInterceptor] Enabled for user:', userId)
  } catch (error) {
    console.error('[UsageInterceptor] Failed to enable:', error)
    interceptorEnabled = false
  }
}

export function disableUsageInterceptor(): void {
  if (!interceptorEnabled) return

  try {
    if (originalGet) api.get = originalGet
    if (originalPost) api.post = originalPost
    if (originalPut) api.put = originalPut
    if (originalDelete) api.delete = originalDelete

    originalGet = null
    originalPost = null
    originalPut = null
    originalDelete = null
    interceptorEnabled = false

    if (flushTimer) {
      clearTimeout(flushTimer)
      flushTimer = null
    }

    console.warn('[UsageInterceptor] Disabled')
  } catch (error) {
    console.error('[UsageInterceptor] Failed to disable:', error)
  }
}

export function isUsageInterceptorEnabled(): boolean {
  return interceptorEnabled
}
```

### Step 2: Add Manual AI Tracking Helper

**File:** `src/lib/usage-manual-tracking.ts`

```typescript
/**
 * Manual Usage Tracking for AI Operations
 *
 * Call these functions manually for AI-specific tracking
 * that cannot be auto-detected.
 */

import { UsageMeter } from './usage-metering'
import { createClient } from '@supabase/supabase-js'

let _userId: string | null = null
let _meter: UsageMeter | null = null

export function initManualTracking(userId: string) {
  _userId = userId
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )
  _meter = new UsageMeter(supabase, { userId })
}

export async function trackModelInference(options: {
  model: string
  provider: string
  prompt_tokens: number
  completion_tokens: number
  agent_type?: string
}) {
  if (!_meter) throw new Error('Manual tracking not initialized')
  return _meter.trackModelInference(options)
}

export async function trackAgentExecution(agentType: string, metadata?: Record<string, unknown>) {
  if (!_meter) throw new Error('Manual tracking not initialized')
  return _meter.trackAgentExecution(agentType, metadata)
}

export async function trackTokens(count: number, metadata?: { model?: string; direction?: 'input' | 'output' }) {
  if (!_meter) throw new Error('Manual tracking not initialized')
  return _meter.trackTokens(count, metadata)
}
```

### Step 3: Integrate with AI Services

**File:** `src/agents/agent-runner.ts` (or wherever AI calls happen)

```typescript
import { trackModelInference, trackAgentExecution } from '@/lib/usage-manual-tracking'

// In your AI inference function
async function runAgent(agentType: string, prompt: string) {
  // Track agent execution start
  await trackAgentExecution(agentType, { prompt_length: prompt.length })

  // Call AI API
  const response = await fetch('https://api.anthropic.com/...')
  const data = await response.json()

  // Track token usage
  await trackModelInference({
    model: 'claude-sonnet-4',
    provider: 'anthropic',
    prompt_tokens: data.usage?.input_tokens || 0,
    completion_tokens: data.usage?.output_tokens || 0,
    agent_type: agentType,
  })

  return data
}
```

### Step 4: Enable Interceptor at App Startup

**File:** `src/main.tsx` or `src/App.tsx`

```typescript
import { useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { enableUsageInterceptor } from './lib/usage-http-interceptor'
import { initManualTracking } from './lib/usage-manual-tracking'

function App() {
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      enableUsageInterceptor(user.id)
      initManualTracking(user.id)
    }
  }, [user])

  return (/* ... */)
}
```

## Todo List

- [ ] Create `src/lib/usage-http-interceptor.ts`
- [ ] Create `src/lib/usage-manual-tracking.ts`
- [ ] Update `src/agents/agent-runner.ts` to call manual tracking
- [ ] Update AI service clients to call `trackModelInference()`
- [ ] Enable interceptor in `src/main.tsx` or `src/App.tsx`
- [ ] Run `npm run build` - verify 0 errors
- [ ] Test: Make API calls, verify they appear in `usage_records`

## Success Criteria

1. **Auto-Tracking Works:** API calls tracked without manual code
2. **AI Tracking Works:** Token usage appears in dashboard
3. **No Latency:** Request/response not blocked by tracking
4. **Batch Flushing:** Events sent in batches, not one-by-one

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tracking breaks API calls | High | Catch all errors, never throw |
| Memory leak from queue | Medium | Limit queue size, flush regularly |
| Duplicate tracking | Medium | Idempotency keys in Edge Function |

## Security Considerations

- Don't track sensitive data in metadata
- Anonymize PII in endpoints

## Next Steps

After Phase 4 complete:
1. Verify tracking in Supabase DB
2. Check dashboard shows real-time updates
3. Proceed to Phase 5 (Quota Enforcement)

---

_Phase: 4/7 | Effort: 2h_
