/**
 * Use RaaS Analytics Stream Hook
 * React hook for real-time analytics event streaming
 *
 * Features:
 * - Real-time event subscription via Supabase Realtime
 * - Batch event handling for high-frequency updates
 * - Automatic cleanup on unmount
 * - Event filtering by org_id and event_type
 * - Optimized re-renders with event deduplication
 *
 * Usage:
 *   const { events, batch, loading, error, isConnected } = useRaasAnalyticsStream({
 *     orgId: 'org_123',
 *     enableBatching: true,
 *   })
 *
 *   // Subscribe to individual events
 *   useEffect(() => {
 *     if (events.length > 0) {
 *       const latestEvent = events[events.length - 1]
 *       // Process latest event
 *     }
 *   }, [events])
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  raasRealtimeEvents,
  type RealtimeSubscriptionOptions,
  type RaasEvent,
  type BatchedEventsPayload,
} from '../lib/raas-realtime-events'
import { analyticsLogger } from '../utils/logger'

// ============================================================================
// TYPES
// ============================================================================

export interface UseRaasAnalyticsStreamOptions extends RealtimeSubscriptionOptions {
  /** Maximum events to keep in memory (default: 100) */
  maxEvents?: number
  /** Enable individual event tracking (default: true) */
  enableIndividualEvents?: boolean
  /** Enable batch event tracking (default: false) */
  enableBatchEvents?: boolean
  /** Auto-connect on mount (default: true) */
  autoConnect?: boolean
}

export interface UseRaasAnalyticsStreamReturn {
  /** Individual events (if enabled) */
  events: RaasEvent[]
  /** Latest batch (if batching enabled) */
  batch: BatchedEventsPayload | null
  /** Loading state */
  loading: boolean
  /** Error state */
  error: string | null
  /** Connection status */
  isConnected: boolean
  /** Event count */
  eventCount: number
  /** Manual connect function */
  connect: () => Promise<void>
  /** Manual disconnect function */
  disconnect: () => Promise<void>
  /** Clear events */
  clearEvents: () => void
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useRaasAnalyticsStream(
  options: UseRaasAnalyticsStreamOptions = {}
): UseRaasAnalyticsStreamReturn {
  const {
    orgId: optionsOrgId,
    eventType: optionsEventType,
    enableBatching = true,
    batchWindowMs = 5000,
    maxBatchSize = 20,
    maxEvents = 100,
    enableIndividualEvents = true,
    enableBatchEvents = false,
    autoConnect = true,
  } = options

   
  const [_orgId, _setOrgId] = useState(optionsOrgId)
   
  const [_eventType, _setEventType] = useState(optionsEventType)

  // State
  const [events, setEvents] = useState<RaasEvent[]>([])
  const [batch, setBatch] = useState<BatchedEventsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Refs for cleanup
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const unsubscribeBatchRef = useRef<(() => void) | null>(null)
  const eventIdsRef = useRef<Set<string>>(new Set())

  // Event handler
  const handleEvent = useCallback((event: RaasEvent) => {
    analyticsLogger.debug('[useRaasAnalyticsStream] Event received', {
      eventType: event.event_type,
      eventId: event.event_id,
      orgId: event.org_id,
    })

    if (!enableIndividualEvents) return

    // Deduplicate by event ID
    if (eventIdsRef.current.has(event.event_id)) {
      analyticsLogger.debug('[useRaasAnalyticsStream] Duplicate event skipped', {
        eventId: event.event_id,
      })
      return
    }

    eventIdsRef.current.add(event.event_id)

    setEvents((prev) => {
      const newEvents = [...prev, event]

      // Trim to max size
      if (newEvents.length > maxEvents) {
        const trimmed = newEvents.slice(newEvents.length - maxEvents)
        // Clean up old event IDs
        const removedIds = newEvents.slice(0, newEvents.length - maxEvents)
        for (const e of removedIds) {
          eventIdsRef.current.delete(e.event_id)
        }
        return trimmed
      }

      return newEvents
    })
  }, [enableIndividualEvents, maxEvents])

  // Batch handler
  const handleBatch = useCallback((payload: BatchedEventsPayload) => {
    analyticsLogger.debug('[useRaasAnalyticsStream] Batch received', {
      batchId: payload.batch_id,
      eventCount: payload.events.length,
      orgId: payload.org_id,
    })

    if (!enableBatchEvents) return

    setBatch(payload)
  }, [enableBatchEvents])

  // Connect function
  const connect = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Subscribe to individual events
      if (enableIndividualEvents) {
        unsubscribeRef.current = await raasRealtimeEvents.subscribe(
          handleEvent,
          {
            orgId: optionsOrgId,
            eventType: optionsEventType,
            enableBatching,
            batchWindowMs,
            maxBatchSize,
          }
        )
      }

      // Subscribe to batches
      if (enableBatchEvents) {
        unsubscribeBatchRef.current = raasRealtimeEvents.subscribeToBatches(
          handleBatch
        )
      }

      setIsConnected(true)
      analyticsLogger.info('[useRaasAnalyticsStream] Connected', {
        orgId: optionsOrgId,
        eventType: optionsEventType,
        enableIndividualEvents,
        enableBatchEvents,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect'
      setError(errorMessage)
      analyticsLogger.error('[useRaasAnalyticsStream] Connection failed:', err)
    } finally {
      setLoading(false)
    }
  }, [
    optionsOrgId,
    optionsEventType,
    enableIndividualEvents,
    enableBatchEvents,
    enableBatching,
    batchWindowMs,
    maxBatchSize,
    handleEvent,
    handleBatch,
  ])

  // Disconnect function
  const disconnect = useCallback(async () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }
    if (unsubscribeBatchRef.current) {
      unsubscribeBatchRef.current()
      unsubscribeBatchRef.current = null
    }

    setIsConnected(false)
    analyticsLogger.info('[useRaasAnalyticsStream] Disconnected')
  }, [])

  // Clear events
  const clearEvents = useCallback(() => {
    setEvents([])
    setBatch(null)
    eventIdsRef.current.clear()
    analyticsLogger.debug('[useRaasAnalyticsStream] Events cleared')
  }, [])

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect().catch((err) => {
        analyticsLogger.error('[useRaasAnalyticsStream] Auto-connect failed:', err)
      })
    }

    // Cleanup on unmount
    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  // Return hook API
  return {
    events,
    batch,
    loading,
    error,
    isConnected,
    eventCount: events.length,
    connect,
    disconnect,
    clearEvents,
  }
}

// ============================================================================
// HOOK VARIANTS
// ============================================================================

/**
 * Hook variant for org-specific events only
 */
export function useOrgAnalyticsStream(
  orgId: string,
  options: Omit<UseRaasAnalyticsStreamOptions, 'orgId'> = {}
): UseRaasAnalyticsStreamReturn {
  return useRaasAnalyticsStream({
    ...options,
    orgId: orgId,
  })
}

/**
 * Hook variant for event-type specific streaming
 */
export function useEventTypeStream(
  eventType: UseRaasAnalyticsStreamOptions['eventType'],
  options: Omit<UseRaasAnalyticsStreamOptions, 'eventType'> = {}
): UseRaasAnalyticsStreamReturn {
  return useRaasAnalyticsStream({
    ...options,
    eventType: eventType,
  })
}

/**
 * Hook variant for batch-only consumption
 */
export function useRaasBatchStream(
  options: Omit<UseRaasAnalyticsStreamOptions, 'enableBatchEvents'> = {}
): Pick<UseRaasAnalyticsStreamReturn, 'batch' | 'loading' | 'error' | 'isConnected'> {
  const { batch, loading, error, isConnected } = useRaasAnalyticsStream({
    ...options,
    enableBatchEvents: true,
    enableIndividualEvents: false,
  })

  return { batch, loading, error, isConnected }
}

// ============================================================================
// UTILS
// ============================================================================

/**
 * Get events by type from stream
 */
export function getEventsByType(events: RaasEvent[], type: RaasEvent['event_type']): RaasEvent[] {
  return events.filter((e) => e.event_type === type)
}

/**
 * Get events by org from stream
 */
export function getEventsByOrg(events: RaasEvent[], orgId: string): RaasEvent[] {
  return events.filter((e) => e.org_id === orgId)
}

/**
 * Get recent events (last N)
 */
export function getRecentEvents(events: RaasEvent[], limit: number): RaasEvent[] {
  return events.slice(-limit)
}

export default useRaasAnalyticsStream
