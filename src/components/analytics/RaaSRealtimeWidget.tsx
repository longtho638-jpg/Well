/**
 * RaaS Real-time Analytics Widget - Phase 6.3
 *
 * Main widget component for real-time analytics dashboard.
 * Integrates Supabase Realtime for live event streaming.
 *
 * Features:
 * - Real-time event feed with auto-scroll
 * - Live usage chart with Recharts
 * - Alert badges for quota/suspension warnings
 * - i18n support (vi/en)
 * - Aura Elite glassmorphism design
 *
 * @example
 * ```tsx
 * <RaaSRealtimeWidget orgId="org_123" />
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { RaaSLiveFeed } from './RaaSLiveFeed'
import { RaaSUsageChart } from './RaaSUsageChart'
import { RaaSAlertBadge } from './RaaSAlertBadge'
import {
  type RaasAnalyticsEvent,
  fetchRaasAnalyticsEvents,
} from '@/lib/raas-analytics-events'
import { Activity, Wifi, WifiOff, Pause, Play } from 'lucide-react'

export interface RaaSRealtimeWidgetProps {
  /** Organization ID to monitor */
  orgId: string
  /** Time range for historical data (default: '24h') */
  timeRange?: '24h' | '7d' | '30d'
  /** Enable auto-scroll in live feed (default: true) */
  enableAutoScroll?: boolean
  /** Compact mode for smaller widget (default: false) */
  compact?: boolean
  /** Custom className */
  className?: string
}

/**
 * Real-time event data from Supabase channel
 */
interface RealtimePayload {
  new: RaasAnalyticsEvent
}

export function RaaSRealtimeWidget({
  orgId,
  timeRange = '24h',
  enableAutoScroll = true,
  compact = false,
  className,
}: RaaSRealtimeWidgetProps) {
  const { t } = useTranslation('analytics')

  // State
  const [events, setEvents] = useState<RaasAnalyticsEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [eventsPerMinute, setEventsPerMinute] = useState(0)
  const [alertLevel, setAlertLevel] = useState<'normal' | 'warning' | 'critical'>('normal')
  const [error, setError] = useState<string | null>(null)

  // Refs
  const eventsRef = useRef<RaasAnalyticsEvent[]>([])
  const eventCountsRef = useRef<Map<string, number>>(new Map())
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Calculate events per minute
  const calculateEventsPerMinute = useCallback(() => {
    const now = Date.now()
    const oneMinuteAgo = now - 60 * 1000
    let count = 0

    eventsRef.current.forEach((event) => {
      const eventTime = new Date(event.timestamp).getTime()
      if (eventTime >= oneMinuteAgo) {
        count++
      }
    })

    setEventsPerMinute(count)
  }, [])

  // Update alert level based on events
  const updateAlertLevel = useCallback((event: RaasAnalyticsEvent) => {
    // Critical alerts
    if (
      event.event_type === 'suspension_created' ||
      event.event_type === 'license_expired'
    ) {
      setAlertLevel('critical')
      return
    }

    // Warning alerts
    if (event.event_type === 'subscription_warning') {
      setAlertLevel('warning')
      return
    }

    // Gradually decay alert level
    setTimeout(() => {
      setAlertLevel('normal')
    }, 10000)
  }, [])

  // Handle new event from realtime
  const handleNewEvent = useCallback(
    (payload: RealtimePayload) => {
      if (isPaused) return

      const newEvent = payload.new as RaasAnalyticsEvent

      // Validate event belongs to this org
      if (newEvent.org_id !== orgId) return

      // Add to events
      setEvents((prev) => {
        const updated = [newEvent, ...prev].slice(0, 100) // Keep last 100 events
        eventsRef.current = updated
        return updated
      })

      // Update metrics
      updateAlertLevel(newEvent)
      calculateEventsPerMinute()
    },
    [orgId, isPaused, updateAlertLevel, calculateEventsPerMinute]
  )

  // Setup Supabase Realtime subscription
  useEffect(() => {
    if (!orgId) return

    // Create realtime channel
    channelRef.current = supabase
      .channel(`raas-analytics:${orgId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'raas_analytics_events',
          filter: `org_id=eq.${orgId}`,
        },
        handleNewEvent
      )
      .on('system', { event: '*' }, (payload) => {
        setIsConnected(payload.type === 'SYSTEM_UPDATE')
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          setError(null)
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false)
          setError('Connection error')
        }
      })

    // Fetch historical events
    const fetchHistorical = async () => {
      try {
        const historicalEvents = await fetchRaasAnalyticsEvents({
          orgId,
          timeRange,
        })
        setEvents(historicalEvents.slice(0, 100))
        eventsRef.current = historicalEvents
        calculateEventsPerMinute()
      } catch (err) {
        setError('Failed to load historical events')
      }
    }

    fetchHistorical()

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [orgId, timeRange, handleNewEvent, calculateEventsPerMinute])

  // Auto-calculate events per minute interval
  useEffect(() => {
    const interval = setInterval(calculateEventsPerMinute, 1000)
    return () => clearInterval(interval)
  }, [calculateEventsPerMinute])

  // Toggle pause/resume
  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev)
  }, [])

  // Clear events
  const clearEvents = useCallback(() => {
    setEvents([])
    eventsRef.current = []
    setEventsPerMinute(0)
  }, [])

  return (
    <div
      className={cn(
        'relative p-6 rounded-2xl border border-white/10',
        'bg-gradient-to-br from-gray-800/50 via-gray-900/50 to-gray-800/50',
        'backdrop-blur-sm shadow-2xl',
        'hover:border-white/20 transition-all duration-300',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'p-2 rounded-lg',
              alertLevel === 'critical' && 'bg-red-500/20 text-red-400',
              alertLevel === 'warning' && 'bg-orange-500/20 text-orange-400',
              alertLevel === 'normal' && 'bg-cyan-500/20 text-cyan-400'
            )}
          >
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {t('realtime.title')}
            </h3>
            <p className="text-sm text-gray-400">
              {t('realtime.events_per_minute')}: {eventsPerMinute}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Connection Status */}
          <div
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
              isConnected
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-red-500/20 text-red-400'
            )}
          >
            {isConnected ? (
              <Wifi className="w-3.5 h-3.5" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" />
            )}
            {isConnected
              ? t('realtime.connected')
              : t('realtime.reconnecting')}
          </div>

          {/* Pause/Resume */}
          <button
            onClick={togglePause}
            className={cn(
              'p-2 rounded-lg transition-colors',
              isPaused
                ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
            )}
            title={isPaused ? t('realtime.resume') : t('realtime.pause')}
          >
            {isPaused ? (
              <Play className="w-4 h-4" />
            ) : (
              <Pause className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Alert Badge */}
      {alertLevel !== 'normal' && (
        <div className="mb-4">
          <RaaSAlertBadge
            level={alertLevel}
            orgId={orgId}
            onDismiss={() => setAlertLevel('normal')}
          />
        </div>
      )}

      {/* Content Grid */}
      <div
        className={cn(
          'grid gap-4',
          compact ? 'grid-cols-1' : 'lg:grid-cols-2'
        )}
      >
        {/* Usage Chart */}
        <RaaSUsageChart
          events={events}
          eventsPerMinute={eventsPerMinute}
          compact={compact}
        />

        {/* Live Feed */}
        <RaaSLiveFeed
          events={events}
          isPaused={isPaused}
          enableAutoScroll={enableAutoScroll}
          onClear={clearEvents}
          compact={compact}
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Glassmorphism glow effect */}
      <div
        className={cn(
          'absolute -inset-px rounded-2xl opacity-0 hover:opacity-100',
          'transition-opacity duration-500 pointer-events-none',
          'bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5 blur-sm'
        )}
      />
    </div>
  )
}
