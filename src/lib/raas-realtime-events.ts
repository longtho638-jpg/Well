/**
 * RaaS Realtime Events - Phase 6.1
 *
 * Supabase Realtime subscription for RaaS analytics events.
 * Enables real-time dashboard updates and live event streaming.
 *
 * Features:
 * - Supabase Realtime channel: raas_analytics_events:*
 * - Batch aggregation: 5s window, max 20 events
 * - Automatic reconnection with exponential backoff
 * - Event filtering by org_id and event_type
 * - Integration with raas-event-emitter
 *
 * Usage:
 *   import { raasRealtimeEvents } from '@/lib/raas-realtime-events'
 *
 *   // Subscribe to all events
 *   const unsubscribe = await raasRealtimeEvents.subscribe((event) => {
 *     console.log('New event:', event)
 *   })
 *
 *   // Subscribe to specific org
 *   const unsubscribe = await raasRealtimeEvents.subscribe(
 *     (event) => console.log('Org event:', event),
 *     { orgId: 'org_123' }
 *   )
 */

import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { analyticsLogger } from '../utils/logger'
import { raasEventEmitter, type RaasEvent, type RaasEventType } from './raas-event-emitter'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Subscription options
 */
export interface RealtimeSubscriptionOptions {
  /** Filter by organization ID */
  orgId?: string
  /** Filter by event type */
  eventType?: RaasEventType
  /** Enable batch aggregation (default: true) */
  enableBatching?: boolean
  /** Batch window in ms (default: 5000) */
  batchWindowMs?: number
  /** Max batch size (default: 20) */
  maxBatchSize?: number
}

/**
 * Batched events payload
 */
export interface BatchedEventsPayload {
  /** Batch ID */
  batch_id: string
  /** Events in batch */
  events: RaasEvent[]
  /** Batch timestamp */
  timestamp: string
  /** Org ID (if filtered) */
  org_id?: string
}

/**
 * Realtime event handler
 */
export type RealtimeEventHandler = (event: RaasEvent) => void | Promise<void>

/**
 * Batch handler
 */
export type BatchEventHandler = (payload: BatchedEventsPayload) => void | Promise<void>

// ============================================================================
// REALTIME MANAGER
// ============================================================================

export class RaasRealtimeEvents {
  private channel: RealtimeChannel | null = null
  private subscribers: Map<string, Set<RealtimeEventHandler>> = new Map()
  private batchSubscribers: Set<BatchEventHandler> = new Set()
  private eventBuffer: Map<string, RaasEvent[]> = new Map()
  private batchTimers: Map<string, ReturnType<typeof setTimeout>> = new Map()
  private isSubscribed = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private baseReconnectDelay = 1000
  private subscriptionOptions: RealtimeSubscriptionOptions | null = null

  /**
   * Subscribe to realtime events
   */
  async subscribe(
    handler: RealtimeEventHandler,
    options: RealtimeSubscriptionOptions = {}
  ): Promise<() => void> {
    const subscriberId = this.generateSubscriberId()
    this.subscriptionOptions = options

    // Initialize channel if not exists
    if (!this.channel) {
      await this.initializeChannel(options)
    }

    // Add subscriber
    if (!this.subscribers.has(subscriberId)) {
      this.subscribers.set(subscriberId, new Set())
    }
    this.subscribers.get(subscriberId)!.add(handler)

    analyticsLogger.info('[RaasRealtime] Subscriber added', {
      subscriberId,
      orgId: options.orgId,
      eventType: options.eventType,
    })

    // Return unsubscribe function
    return () => {
      this.unsubscribe(subscriberId, handler)
    }
  }

  /**
   * Subscribe to batched events
   */
  subscribeToBatches(handler: BatchEventHandler): () => void {
    this.batchSubscribers.add(handler)
    analyticsLogger.debug('[RaasRealtime] Batch subscriber added')

    return () => {
      this.batchSubscribers.delete(handler)
    }
  }

  /**
   * Unsubscribe a specific handler
   */
  private unsubscribe(subscriberId: string, handler: RealtimeEventHandler): void {
    const subscribers = this.subscribers.get(subscriberId)
    if (subscribers) {
      subscribers.delete(handler)
      if (subscribers.size === 0) {
        this.subscribers.delete(subscriberId)
      }
    }

    analyticsLogger.debug('[RaasRealtime] Subscriber removed', { subscriberId })

    // Cleanup channel if no subscribers
    if (this.subscribers.size === 0 && this.channel) {
      this.cleanupChannel()
    }
  }

  /**
   * Initialize Supabase Realtime channel
   */
  private async initializeChannel(options: RealtimeSubscriptionOptions): Promise<void> {
    try {
      // Build channel topic with filters
      let topic = 'raas_analytics_events:*'

      if (options.orgId) {
        topic = `raas_analytics_events:org_id=eq.${options.orgId}`
      }

      if (options.eventType) {
        const filter = options.orgId ? 'and' : 'filter'
        topic = options.orgId
          ? `${topic},event_type=eq.${options.eventType}`
          : `raas_analytics_events:${filter}=event_type,eq,${options.eventType}`
      }

      analyticsLogger.info('[RaasRealtime] Creating channel', { topic })

      this.channel = supabase.channel(topic, {
        config: {
          broadcast: {
            self: true,
          },
        },
      })

      // Subscribe to broadcast events
      this.channel.on(
        'broadcast',
        { event: 'raas_analytics_event' },
        async (payload) => {
          await this.handleBroadcastEvent(payload.payload)
        }
      )

      // Subscribe and handle status
      this.channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.isSubscribed = true
          this.reconnectAttempts = 0
          analyticsLogger.info('[RaasRealtime] Channel subscribed', { topic })
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.isSubscribed = false
          analyticsLogger.warn('[RaasRealtime] Channel error', { status, topic })
          this.attemptReconnect(options)
        } else if (status === 'CLOSED') {
          this.isSubscribed = false
          analyticsLogger.debug('[RaasRealtime] Channel closed', { topic })
        }
      })
    } catch (error) {
      analyticsLogger.error('[RaasRealtime] Channel initialization failed:', error)
      throw error
    }
  }

  /**
   * Handle broadcast event from Supabase
   */
  private async handleBroadcastEvent(payload: unknown): Promise<void> {
    const event = payload as RaasEvent

    analyticsLogger.debug('[RaasRealtime] Broadcast received', {
      eventType: event.event_type,
      eventId: event.event_id,
      orgId: event.org_id,
    })

    // Notify individual subscribers
    for (const handlers of Array.from(this.subscribers.values())) {
      for (const handler of Array.from(handlers)) {
        try {
          await Promise.resolve(handler(event))
        } catch (err) {
          analyticsLogger.error('[RaasRealtime] Handler error:', err)
        }
      }
    }

    // Handle batching
    if (this.subscriptionOptions?.enableBatching !== false) {
      this.addToBatch(event)
    }

    // Also emit via event emitter for local listeners
    await raasEventEmitter.emit(event)
  }

  /**
   * Add event to batch buffer
   */
  private addToBatch(event: RaasEvent): void {
    const batchKey = event.org_id || 'global'
    const batchWindowMs = this.subscriptionOptions?.batchWindowMs || 5000
    const maxBatchSize = this.subscriptionOptions?.maxBatchSize || 20

    // Initialize buffer if not exists
    if (!this.eventBuffer.has(batchKey)) {
      this.eventBuffer.set(batchKey, [])
    }

    const buffer = this.eventBuffer.get(batchKey)!
    buffer.push(event)

    // Clear existing timer
    const existingTimer = this.batchTimers.get(batchKey)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // Flush if batch size reached
    if (buffer.length >= maxBatchSize) {
      this.flushBatch(batchKey)
      return
    }

    // Set timer for window-based flush
    const timer = setTimeout(() => {
      this.flushBatch(batchKey)
    }, batchWindowMs)

    this.batchTimers.set(batchKey, timer)
  }

  /**
   * Flush batch to subscribers
   */
  private flushBatch(batchKey: string): void {
    const buffer = this.eventBuffer.get(batchKey)
    if (!buffer || buffer.length === 0) return

    // Clear timer
    const timer = this.batchTimers.get(batchKey)
    if (timer) {
      clearTimeout(timer)
      this.batchTimers.delete(batchKey)
    }

    const payload: BatchedEventsPayload = {
      batch_id: `batch_${Date.now()}_${batchKey}`,
      events: [...buffer],
      timestamp: new Date().toISOString(),
      org_id: batchKey !== 'global' ? batchKey : undefined,
    }

    analyticsLogger.debug('[RaasRealtime] Batch flushed', {
      batchId: payload.batch_id,
      eventCount: payload.events.length,
      orgId: payload.org_id,
    })

    // Notify batch subscribers
    for (const handler of Array.from(this.batchSubscribers)) {
      try {
        Promise.resolve(handler(payload)).catch((err) => {
          analyticsLogger.error('[RaasRealtime] Batch handler error:', err)
        })
      } catch (err) {
        analyticsLogger.error('[RaasRealtime] Batch handler sync error:', err)
      }
    }

    // Clear buffer
    this.eventBuffer.delete(batchKey)
  }

  /**
   * Attempt to reconnect on channel error
   */
  private async attemptReconnect(options: RealtimeSubscriptionOptions): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      analyticsLogger.error('[RaasRealtime] Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    analyticsLogger.info('[RaasRealtime] Reconnecting', {
      attempt: this.reconnectAttempts,
      delay,
    })

    setTimeout(async () => {
      try {
        await this.initializeChannel(options)
      } catch (error) {
        analyticsLogger.error('[RaasRealtime] Reconnect failed:', error)
      }
    }, delay)
  }

  /**
   * Cleanup channel resources
   */
  private cleanupChannel(): void {
    // Flush remaining batches
    for (const batchKey of Array.from(this.batchTimers.keys())) {
      this.flushBatch(batchKey)
    }

    // Clear timers
    for (const timer of Array.from(this.batchTimers.values())) {
      clearTimeout(timer)
    }
    this.batchTimers.clear()
    this.eventBuffer.clear()

    // Unsubscribe from channel
    if (this.channel) {
      supabase.removeChannel(this.channel)
      this.channel = null
      this.isSubscribed = false
      analyticsLogger.debug('[RaasRealtime] Channel cleaned up')
    }
  }

  /**
   * Unsubscribe from all events
   */
  async unsubscribeAll(): Promise<void> {
    this.subscribers.clear()
    this.batchSubscribers.clear()
    this.cleanupChannel()
    analyticsLogger.info('[RaasRealtime] All subscriptions removed')
  }

  /**
   * Generate unique subscriber ID
   */
  private generateSubscriberId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }

  /**
   * Check if currently subscribed
   */
  getIsSubscribed(): boolean {
    return this.isSubscribed
  }

  /**
   * Get current buffer size
   */
  getBufferSize(): number {
    let total = 0
    for (const events of Array.from(this.eventBuffer.values())) {
      total += events.length
    }
    return total
  }

  /**
   * Get subscriber count
   */
  getSubscriberCount(): number {
    let count = 0
    for (const handlers of Array.from(this.subscribers.values())) {
      count += handlers.size
    }
    return count + this.batchSubscribers.size
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const raasRealtimeEvents = new RaasRealtimeEvents()

// Re-export types from event emitter for convenience
export type { RaasEvent, RaasEventType } from './raas-event-emitter'

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Subscribe to realtime events (shortcut)
 */
export async function subscribeRaasEvents(
  handler: RealtimeEventHandler,
  options?: RealtimeSubscriptionOptions
): Promise<() => void> {
  return raasRealtimeEvents.subscribe(handler, options)
}

/**
 * Subscribe to batched events (shortcut)
 */
export function subscribeRaasBatches(
  handler: BatchEventHandler
): () => void {
  return raasRealtimeEvents.subscribeToBatches(handler)
}

export default raasRealtimeEvents
