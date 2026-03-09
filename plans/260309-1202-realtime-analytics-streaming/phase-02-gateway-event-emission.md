---
title: "Phase 6.2: RaaS Gateway Event Emission"
description: "Emit events from gateway: feature_used, quota_check, access_denied, quota_warning"
status: pending
priority: P1
effort: 2h
---

# Phase 6.2: RaaS Gateway Event Emission

## Overview

Enhance RaaS Gateway Client to emit analytics events for key operations: feature usage, quota checks, access denials, and quota warnings.

## Event Types

| Event Type | Trigger | Metadata |
|------------|---------|----------|
| `feature_used` | API feature access | `mk_api_key`, `feature_name`, `quota_remaining`, `tier` |
| `quota_check` | Quota validation | `mk_api_key`, `metric_type`, `current_usage`, `effective_quota` |
| `access_denied` | 403 response | `mk_api_key`, `jwt_session`, `reason`, `path` |
| `quota_warning` | >90% usage | `mk_api_key`, `percentage_used`, `threshold`, `retry_after` |

## Implementation Steps

### 1. Extend Event Types (`src/lib/raas-analytics-events.ts`)

Add new event interfaces:

```typescript
export interface FeatureUsedEvent extends BaseAnalyticsEvent {
  event_type: 'feature_used'
  feature_name: string
  api_key_hash: string
  quota_remaining: number
  tier: string
  metadata?: Record<string, unknown>
}

export interface QuotaCheckEvent extends BaseAnalyticsEvent {
  event_type: 'quota_check'
  api_key_hash: string
  metric_type: string
  current_usage: number
  effective_quota: number
  allowed: boolean
  metadata?: Record<string, unknown>
}

export interface AccessDeniedEvent extends BaseAnalyticsEvent {
  event_type: 'access_denied'
  api_key_hash: string
  jwt_session?: string
  reason: string
  path: string
  ip_address: string
  metadata?: Record<string, unknown>
}

export interface QuotaWarningEvent extends BaseAnalyticsEvent {
  event_type: 'quota_warning'
  api_key_hash: string
  percentage_used: number
  threshold: number
  retry_after?: number
  metadata?: Record<string, unknown>
}

export type RaasGatewayEvent =
  | FeatureUsedEvent
  | QuotaCheckEvent
  | QuotaWarningEvent
  | AccessDeniedEvent
```

### 2. Gateway Event Emitter (`src/lib/raas-gateway-event-emitter.ts`)

```typescript
import { raasAnalyticsEvents } from './raas-analytics-events'
import type { RaasGatewayEvent } from './raas-analytics-events'

export interface GatewayEventContext {
  apiKey: string
  orgId: string
  userId?: string
  path?: string
  ipAddress?: string
}

export class RaasGatewayEventEmitter {
  private readonly context: GatewayEventContext

  constructor(context: GatewayEventContext) {
    this.context = context
  }

  /**
   * Hash API key for logging (first 8 chars + ***)
   */
  private hashApiKey(key: string): string {
    if (key.length <= 8) return key
    return `${key.substring(0, 8)}***`
  }

  /**
   * Emit feature_used event
   */
  async emitFeatureUsed(
    featureName: string,
    quotaRemaining: number,
    tier: string
  ): Promise<boolean> {
    return raasAnalyticsEvents.emit('feature_used', {
      org_id: this.context.orgId,
      user_id: this.context.userId,
      feature_name: featureName,
      api_key_hash: this.hashApiKey(this.context.apiKey),
      quota_remaining: quotaRemaining,
      tier,
      path: this.context.path,
      ip_address: this.context.ipAddress,
    })
  }

  /**
   * Emit quota_check event
   */
  async emitQuotaCheck(
    metricType: string,
    currentUsage: number,
    effectiveQuota: number,
    allowed: boolean
  ): Promise<boolean> {
    return raasAnalyticsEvents.emit('quota_check', {
      org_id: this.context.orgId,
      user_id: this.context.userId,
      api_key_hash: this.hashApiKey(this.context.apiKey),
      metric_type: metricType,
      current_usage: currentUsage,
      effective_quota: effectiveQuota,
      allowed,
      path: this.context.path,
    })
  }

  /**
   * Emit access_denied event
   */
  async emitAccessDenied(
    reason: string,
    jwtSession?: string
  ): Promise<boolean> {
    return raasAnalyticsEvents.emit('access_denied', {
      org_id: this.context.orgId,
      user_id: this.context.userId,
      api_key_hash: this.hashApiKey(this.context.apiKey),
      jwt_session: jwtSession,
      reason,
      path: this.context.path || '',
      ip_address: this.context.ipAddress || '',
    })
  }

  /**
   * Emit quota_warning event (>90% usage)
   */
  async emitQuotaWarning(
    percentageUsed: number,
    threshold: number = 90,
    retryAfter?: number
  ): Promise<boolean> {
    return raasAnalyticsEvents.emit('quota_warning', {
      org_id: this.context.orgId,
      user_id: this.context.userId,
      api_key_hash: this.hashApiKey(this.context.apiKey),
      percentage_used: percentageUsed,
      threshold,
      retry_after: retryAfter,
      path: this.context.path,
    })
  }
}

/**
 * Create emitter from request context
 */
export function createGatewayEmitter(
  apiKey: string,
  orgId: string,
  options?: {
    userId?: string
    path?: string
    ipAddress?: string
  }
): RaasGatewayEventEmitter {
  return new RaasGatewayEventEmitter({
    apiKey,
    orgId,
    ...options,
  })
}
```

### 3. Integrate with QuotaEnforcer (`src/lib/quota-enforcer.ts`)

Modify `checkQuota()` method to emit events:

```typescript
async checkQuota(metricType: OverageMetricType): Promise<QuotaCheckResult> {
  const result = await this._checkQuota(metricType)

  // Emit quota check event
  const emitter = createGatewayEmitter(this.apiKey || '', this.orgId, {
    userId: this.userId,
  })

  await emitter.emitQuotaCheck(
    metricType,
    result.currentUsage,
    result.effectiveQuota,
    result.allowed
  )

  // Emit warning if >90%
  if (result.percentageUsed >= 90) {
    await emitter.emitQuotaWarning(result.percentageUsed)
  }

  return result
}
```

### 4. KV Logging with TTL (`workers/raas-gateway-worker/src/event-logging.ts`)

```typescript
// KV namespace for event logging (30 day TTL)
interface EventKV {
  key: string
  value: {
    events: Array<{
      type: string
      timestamp: string
      data: Record<string, any>
    }>
  }
  expirationTtl: number // 30 days = 2592000 seconds
}

export class RaasEventKVLogger {
  constructor(private kv: KVNamespace) {}

  async logEvent(
    mkApiKey: string,
    eventType: string,
    eventData: Record<string, any>
  ): Promise<void> {
    const key = `events:${mkApiKey}:${Date.now()}`
    const ttl = 30 * 24 * 60 * 60 // 30 days

    await this.kv.put(key, JSON.stringify({
      type: eventType,
      timestamp: new Date().toISOString(),
      data: eventData,
    }), { expirationTtl: ttl })
  }

  async getEvents(
    mkApiKey: string,
    limit: number = 100
  ): Promise<Array<any>> {
    const keys = await this.kv.list({ prefix: `events:${mkApiKey}:` })
    const events = await Promise.all(
      keys.keys.slice(-limit).map(k => this.kv.get(k.name))
    )
    return events.filter(Boolean).map(e => JSON.parse(e as string))
  }
}
```

## Success Criteria

- [ ] 4 event types implemented
- [ ] Events emitted from quota checker
- [ ] KV logging with 30-day TTL
- [ ] API key hashing for security

## Related Files

- Modify: `src/lib/raas-analytics-events.ts`
- Create: `src/lib/raas-gateway-event-emitter.ts`
- Modify: `src/lib/quota-enforcer.ts`
- Create: `workers/raas-gateway-worker/src/event-logging.ts`
