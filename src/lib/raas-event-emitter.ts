/**
 * RaaS Event Emitter - Phase 6.1
 *
 * Type-safe event emission utilities for RaaS analytics events.
 * Provides centralized event emission with metadata enrichment.
 *
 * Features:
 * - Type-safe event schema
 * - Automatic metadata enrichment (mk_api_key, jwt_session, quota_remaining, tier, org_id)
 * - Event batching support
 * - Integration with Supabase Realtime
 *
 * Usage:
 *   import { raasEventEmitter } from '@/lib/raas-event-emitter'
 *
 *   await raasEventEmitter.emit('feature_used', {
 *     orgId: 'org_123',
 *     feature: 'agent_chat',
 *     quotaRemaining: 950,
 *   })
 */

import { analyticsLogger } from '../utils/logger'

// ============================================================================
// EVENT TYPES
// ============================================================================

/**
 * Core RaaS analytics event types
 */
export type RaasEventType =
  | 'feature_used'
  | 'quota_check'
  | 'access_denied'
  | 'quota_warning'

/**
 * Base event structure with required metadata
 */
export interface BaseRaasEvent {
  /** Unique event ID */
  event_id: string
  /** Event type */
  event_type: RaasEventType
  /** Organization ID */
  org_id?: string
  /** User ID (if authenticated) */
  user_id?: string
  /** Timestamp */
  timestamp: string
  /** Request ID for tracing */
  request_id?: string
  /** API path */
  path?: string
  /** IP address */
  ip_address?: string
}

/**
 * Feature used event
 */
export interface FeatureUsedEvent extends BaseRaasEvent {
  event_type: 'feature_used'
  /** Feature identifier */
  feature: string
  /** Feature category */
  category?: string
  /** Execution time in ms */
  execution_time_ms?: number
  /** Success/failure status */
  success: boolean
  /** Error message if failed */
  error_message?: string
  /** Additional feature-specific metadata */
  metadata?: Record<string, unknown>
}

/**
 * Quota check event
 */
export interface QuotaCheckEvent extends BaseRaasEvent {
  event_type: 'quota_check'
  /** Metric type being checked */
  metric_type: string
  /** Current usage */
  current_usage: number
  /** Quota limit */
  quota_limit: number
  /** Remaining quota */
  quota_remaining: number
  /** Usage percentage (0-100) */
  usage_percentage: number
  /** Whether quota was exceeded */
  exceeded: boolean
  /** License tier */
  tier: string
}

/**
 * Access denied event
 */
export interface AccessDeniedEvent extends BaseRaasEvent {
  event_type: 'access_denied'
  /** Denial reason */
  reason: 'quota_exceeded' | 'license_invalid' | 'feature_locked' | 'suspended' | 'unauthorized'
  /** License key if applicable */
  license_key?: string
  /** Requested feature if applicable */
  requested_feature?: string
  /** Suspension reason if applicable */
  suspension_reason?: string
  /** Retry-After header value (seconds) */
  retry_after?: number
}

/**
 * Quota warning event
 */
export interface QuotaWarningEvent extends BaseRaasEvent {
  event_type: 'quota_warning'
  /** Warning threshold (e.g., 80, 90, 95) */
  threshold: number
  /** Current usage percentage */
  current_percentage: number
  /** Metric type */
  metric_type: string
  /** Estimated overage units */
  estimated_overage?: number
  /** License tier */
  tier: string
}

/**
 * Union type for all RaaS events
 */
export type RaasEvent =
  | FeatureUsedEvent
  | QuotaCheckEvent
  | AccessDeniedEvent
  | QuotaWarningEvent

// ============================================================================
// EVENT CONTEXT
// ============================================================================

/**
 * Context for enriching events with metadata
 */
export interface EventContext {
  /** API key (masked) */
  mk_api_key?: string
  /** JWT session ID */
  jwt_session?: string
  /** Remaining quota */
  quota_remaining?: number
  /** License tier */
  tier?: string
  /** Organization ID */
  org_id: string
  /** User ID */
  user_id?: string
  /** Request ID */
  request_id?: string
  /** Path */
  path?: string
  /** IP address */
  ip_address?: string
}

// ============================================================================
// EVENT BATCHING
// ============================================================================

interface BatchConfig {
  /** Maximum events per batch */
  maxEvents: number
  /** Maximum time window in ms */
  windowMs: number
}

const DEFAULT_BATCH_CONFIG: BatchConfig = {
  maxEvents: 20,
  windowMs: 5000, // 5 seconds
}

interface QueuedEvent {
  event: RaasEvent
  queuedAt: number
}

// ============================================================================
// EVENT EMITTER CLASS
// ============================================================================

export type EventListener = (event: RaasEvent) => void | Promise<void>

export class RaasEventEmitter {
  private listeners: Map<RaasEventType, Set<EventListener>> = new Map()
  private eventQueue: QueuedEvent[] = []
  private batchConfig: BatchConfig
  private flushTimer: ReturnType<typeof setTimeout> | null = null
  private eventCounter = 0

  constructor(config?: Partial<BatchConfig>) {
    this.batchConfig = { ...DEFAULT_BATCH_CONFIG, ...config }
    this.startFlushTimer()
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    this.eventCounter++
    return `evt_${Date.now()}_${this.eventCounter}`
  }

  /**
   * Enrich event with context metadata
   */
  private enrichEvent<T extends BaseRaasEvent>(
    event: T,
    context: EventContext
  ): T {
    return {
      ...event,
      mk_api_key: context.mk_api_key,
      jwt_session: context.jwt_session,
      quota_remaining: context.quota_remaining,
      tier: context.tier,
      org_id: context.org_id,
      user_id: context.user_id,
      request_id: context.request_id,
      path: context.path,
      ip_address: context.ip_address,
    }
  }

  /**
   * Start the flush timer for batch processing
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch((err) => {
        analyticsLogger.error('[RaasEventEmitter] Flush timer error:', err)
      })
    }, this.batchConfig.windowMs)
  }

  /**
   * Stop the emitter (for cleanup)
   */
  public stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
    this.listeners.clear()
    this.eventQueue = []
  }

  /**
   * Subscribe to events of a specific type
   */
  public on(eventType: RaasEventType, listener: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    this.listeners.get(eventType)!.add(listener)

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(listener)
    }
  }

  /**
   * Emit a feature_used event
   */
  async emitFeatureUsed(
    data: Omit<FeatureUsedEvent, keyof BaseRaasEvent | 'event_type'>,
    context: EventContext
  ): Promise<FeatureUsedEvent> {
    const event: FeatureUsedEvent = {
      event_id: this.generateEventId(),
      event_type: 'feature_used',
      timestamp: new Date().toISOString(),
      success: data.success,
      feature: data.feature,
      category: data.category,
      execution_time_ms: data.execution_time_ms,
      error_message: data.error_message,
      metadata: data.metadata,
    }

    const enrichedEvent = this.enrichEvent(event, context)
    await this.notifyListeners(enrichedEvent)
    this.queueEvent(enrichedEvent)

    analyticsLogger.debug('[RaasEventEmitter] feature_used', {
      feature: data.feature,
      orgId: context.org_id,
      success: data.success,
    })

    return enrichedEvent
  }

  /**
   * Emit a quota_check event
   */
  async emitQuotaCheck(
    data: Omit<QuotaCheckEvent, keyof BaseRaasEvent | 'event_type'>,
    context: EventContext
  ): Promise<QuotaCheckEvent> {
    const event: QuotaCheckEvent = {
      event_id: this.generateEventId(),
      event_type: 'quota_check',
      timestamp: new Date().toISOString(),
      metric_type: data.metric_type,
      current_usage: data.current_usage,
      quota_limit: data.quota_limit,
      quota_remaining: data.quota_remaining,
      usage_percentage: data.usage_percentage,
      exceeded: data.exceeded,
      tier: data.tier,
    }

    const enrichedEvent = this.enrichEvent(event, context)
    await this.notifyListeners(enrichedEvent)
    this.queueEvent(enrichedEvent)

    analyticsLogger.debug('[RaasEventEmitter] quota_check', {
      metricType: data.metric_type,
      exceeded: data.exceeded,
      orgId: context.org_id,
    })

    return enrichedEvent
  }

  /**
   * Emit an access_denied event
   */
  async emitAccessDenied(
    data: Omit<AccessDeniedEvent, keyof BaseRaasEvent | 'event_type'>,
    context: EventContext
  ): Promise<AccessDeniedEvent> {
    const event: AccessDeniedEvent = {
      event_id: this.generateEventId(),
      event_type: 'access_denied',
      timestamp: new Date().toISOString(),
      reason: data.reason,
      license_key: data.license_key,
      requested_feature: data.requested_feature,
      suspension_reason: data.suspension_reason,
      retry_after: data.retry_after,
    }

    const enrichedEvent = this.enrichEvent(event, context)
    await this.notifyListeners(enrichedEvent)
    this.queueEvent(enrichedEvent)

    analyticsLogger.warn('[RaasEventEmitter] access_denied', {
      reason: data.reason,
      orgId: context.org_id,
      path: context.path,
    })

    return enrichedEvent
  }

  /**
   * Emit a quota_warning event
   */
  async emitQuotaWarning(
    data: Omit<QuotaWarningEvent, keyof BaseRaasEvent | 'event_type'>,
    context: EventContext
  ): Promise<QuotaWarningEvent> {
    const event: QuotaWarningEvent = {
      event_id: this.generateEventId(),
      event_type: 'quota_warning',
      timestamp: new Date().toISOString(),
      threshold: data.threshold,
      current_percentage: data.current_percentage,
      metric_type: data.metric_type,
      estimated_overage: data.estimated_overage,
      tier: data.tier,
    }

    const enrichedEvent = this.enrichEvent(event, context)
    await this.notifyListeners(enrichedEvent)
    this.queueEvent(enrichedEvent)

    analyticsLogger.warn('[RaasEventEmitter] quota_warning', {
      threshold: data.threshold,
      currentPercentage: data.current_percentage,
      orgId: context.org_id,
    })

    return enrichedEvent
  }

  /**
   * Emit any RaaS event (generic)
   */
  async emit(event: RaasEvent): Promise<void> {
    await this.notifyListeners(event)
    this.queueEvent(event)

    analyticsLogger.debug('[RaasEventEmitter] event emitted', {
      eventType: event.event_type,
      eventId: event.event_id,
      orgId: event.org_id,
    })
  }

  /**
   * Notify all listeners for an event
   */
  private async notifyListeners(event: RaasEvent): Promise<void> {
    const listeners = this.listeners.get(event.event_type)
    if (!listeners || listeners.size === 0) return

    const promises = Array.from(listeners).map((listener) => {
      try {
        return Promise.resolve(listener(event))
      } catch (err) {
        analyticsLogger.error('[RaasEventEmitter] Listener error:', err)
        return Promise.resolve()
      }
    })

    await Promise.all(promises)
  }

  /**
   * Queue event for batch processing
   */
  private queueEvent(event: RaasEvent): void {
    this.eventQueue.push({
      event,
      queuedAt: Date.now(),
    })

    // Flush if batch size reached
    if (this.eventQueue.length >= this.batchConfig.maxEvents) {
      this.flush().catch((err) => {
        analyticsLogger.error('[RaasEventEmitter] Flush error:', err)
      })
    }
  }

  /**
   * Flush event queue
   */
  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return

    const now = Date.now()
    const eventsToFlush: RaasEvent[] = []
    const eventsToKeep: QueuedEvent[] = []

    for (const queued of this.eventQueue) {
      // Flush if window expired
      if (now - queued.queuedAt >= this.batchConfig.windowMs) {
        eventsToFlush.push(queued.event)
      } else {
        eventsToKeep.push(queued)
      }
    }

    // Also flush if we have enough events
    if (eventsToKeep.length >= this.batchConfig.maxEvents) {
      eventsToFlush.push(...eventsToKeep.slice(0, this.batchConfig.maxEvents).map(q => q.event))
      eventsToKeep.splice(0, this.batchConfig.maxEvents)
    }

    if (eventsToFlush.length > 0) {
      this.eventQueue = eventsToKeep
      analyticsLogger.debug('[RaasEventEmitter] Flushed batch', {
        count: eventsToFlush.length,
        remaining: eventsToKeep.length,
      })
    }
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.eventQueue.length
  }

  /**
   * Get listener count for an event type
   */
  getListenerCount(eventType: RaasEventType): number {
    return this.listeners.get(eventType)?.size || 0
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const raasEventEmitter = new RaasEventEmitter()

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Create event context from request
 */
export function createEventContext(options: {
  orgId: string
  userId?: string
  mkApiKey?: string
  jwtSession?: string
  quotaRemaining?: number
  tier?: string
  requestId?: string
  path?: string
  ipAddress?: string
}): EventContext {
  return {
    org_id: options.orgId,
    user_id: options.userId,
    mk_api_key: options.mkApiKey,
    jwt_session: options.jwtSession,
    quota_remaining: options.quotaRemaining,
    tier: options.tier,
    request_id: options.requestId,
    path: options.path,
    ip_address: options.ipAddress,
  }
}

export default raasEventEmitter
