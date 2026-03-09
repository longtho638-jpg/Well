/**
 * RaaS Live Event Feed - Phase 6.3
 *
 * Auto-scrolling live feed for real-time analytics events.
 * Displays event stream with timestamps, types, and status indicators.
 *
 * Features:
 * - Auto-scroll to latest event
 * - Event type icons and colors
 * - Relative time formatting
 * - Pause/resume support
 * - Aura Elite glassmorphism design
 *
 * @example
 * ```tsx
 * <RaaSLiveFeed events={events} isPaused={false} />
 * ```
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { RaasAnalyticsEvent } from '@/lib/raas-analytics-events'
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Clock,
  Zap,
  AlertCircle,
  Trash2,
} from 'lucide-react'

export interface RaaSLiveFeedProps {
  /** Array of events to display */
  events: RaasAnalyticsEvent[]
  /** Feed is paused */
  isPaused: boolean
  /** Enable auto-scroll (default: true) */
  enableAutoScroll?: boolean
  /** Clear events callback */
  onClear?: () => void
  /** Compact mode (default: false) */
  compact?: boolean
  /** Custom className */
  className?: string
}

/**
 * Event type configuration
 */
interface EventTypeConfig {
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
}

/**
 * Event type configurations
 */
const EVENT_TYPE_CONFIGS: Record<string, EventTypeConfig> = {
  license_validated: {
    icon: CheckCircle,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
  license_expired: {
    icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
  },
  suspension_created: {
    icon: AlertTriangle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
  },
  suspension_cleared: {
    icon: CheckCircle,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
  subscription_warning: {
    icon: AlertCircle,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
  },
  admin_bypass_used: {
    icon: Shield,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
  api_request: {
    icon: Zap,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
  },
  quota_exceeded: {
    icon: AlertTriangle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
  },
}

/**
 * Format relative time
 */
function formatRelativeTime(timestamp: string): string {
  const now = Date.now()
  const eventTime = new Date(timestamp).getTime()
  const diff = now - eventTime

  if (diff < 1000) return 'just now'
  if (diff < 60000) return `${Math.floor(diff / 1000)}s`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
  return `${Math.floor(diff / 86400000)}d`
}

/**
 * Get event display name
 */
function getEventDisplayName(eventType: string, t: (key: string) => string): string {
  const key = `event_types.${eventType}`
  const translated = t(key)

  // If translation returns the key itself, use fallback
  if (translated === key) {
    return eventType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  return translated
}

export function RaaSLiveFeed({
  events,
  isPaused,
  enableAutoScroll = true,
  onClear,
  compact = false,
  className,
}: RaaSLiveFeedProps) {
  const { t } = useTranslation('analytics')
  const feedRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(enableAutoScroll)

  // Auto-scroll to top when new events arrive
  useEffect(() => {
    if (autoScroll && !isPaused && feedRef.current && events.length > 0) {
      feedRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [events.length, autoScroll, isPaused])

  // Toggle auto-scroll
  const toggleAutoScroll = useCallback(() => {
    setAutoScroll((prev) => !prev)
  }, [])

  // Get event config
  const getEventConfig = useCallback((eventType: string): EventTypeConfig => {
    return (
      EVENT_TYPE_CONFIGS[eventType] || {
        icon: Activity,
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/10',
      }
    )
  }, [])

  return (
    <div
      className={cn(
        'relative rounded-xl border border-white/10 bg-gray-900/50 backdrop-blur-sm overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h4 className="text-sm font-semibold text-white">
            {t('realtime.live_feed')}
          </h4>
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-xs',
              isPaused
                ? 'bg-orange-500/20 text-orange-400'
                : 'bg-emerald-500/20 text-emerald-400'
            )}
          >
            {isPaused ? t('realtime.paused') : t('realtime.watching')}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Auto-scroll toggle */}
          <button
            onClick={toggleAutoScroll}
            className={cn(
              'px-2 py-1 rounded text-xs transition-colors',
              autoScroll
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'bg-gray-700/50 text-gray-400'
            )}
            title={t('realtime.auto_scroll')}
          >
            {t('realtime.auto_scroll')}
          </button>

          {/* Clear button */}
          {onClear && (
            <button
              onClick={onClear}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title={t('realtime.clear')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Feed Content */}
      <div
        ref={feedRef}
        className={cn(
          'overflow-y-auto',
          compact ? 'h-48' : 'h-64'
        )}
      >
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <Activity className="w-8 h-8 text-gray-600 mb-3" />
            <p className="text-sm text-gray-500">{t('realtime.no_events')}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {events.map((event, index) => {
              const config = getEventConfig(event.event_type)
              const Icon = config.icon
              const displayName = getEventDisplayName(event.event_type, t)

              return (
                <div
                  key={`${event.timestamp}-${index}`}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 transition-colors',
                    'hover:bg-white/5'
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      'flex-shrink-0 p-1.5 rounded-lg',
                      config.bgColor
                    )}
                  >
                    <Icon className={cn('w-4 h-4', config.color)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {displayName}
                      </span>
                      {event.user_id && (
                        <span className="text-xs text-gray-500">
                          • {event.user_id.substring(0, 8)}...
                        </span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-2 mt-1">
                      {/* Reason/Status */}
                      {'reason' in event && event.reason && (
                        <span className="text-xs text-gray-400">
                          {event.reason.replace(/_/g, ' ')}
                        </span>
                      )}

                      {/* Quota percentage */}
                      {'quota_percentage' in event &&
                        event.quota_percentage && (
                          <span
                            className={cn(
                              'text-xs font-medium',
                              event.quota_percentage > 95
                                ? 'text-red-400'
                                : event.quota_percentage > 90
                                ? 'text-orange-400'
                                : 'text-yellow-400'
                            )}
                          >
                            {event.quota_percentage}% quota
                          </span>
                        )}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="flex-shrink-0 text-xs text-gray-500">
                    {formatRelativeTime(event.timestamp)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom gradient overlay for scroll indication */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 h-8 pointer-events-none',
          'bg-gradient-to-t from-gray-900/80 to-transparent'
        )}
      />
    </div>
  )
}
