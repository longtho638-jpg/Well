/**
 * RaaS Real-time Usage Chart - Phase 6.3
 *
 * Live updating chart showing events per minute over time.
 * Built with Recharts for smooth animations.
 *
 * Features:
 * - Real-time data updates
 * - Smooth line chart with gradient fill
 * - Responsive design
 * - Aura Elite glassmorphism styling
 *
 * @example
 * ```tsx
 * <RaaSUsageChart events={events} eventsPerMinute={42} />
 * ```
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { RaasAnalyticsEvent } from '@/lib/raas-analytics-events'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

export interface RaaSUsageChartProps {
  /** Array of events for historical data */
  events: RaasAnalyticsEvent[]
  /** Current events per minute */
  eventsPerMinute: number
  /** Compact mode (default: false) */
  compact?: boolean
  /** Custom className */
  className?: string
  /** Time window in minutes (default: 30) */
  timeWindow?: number
}

/**
 * Chart data point
 */
interface ChartDataPoint {
  time: string
  events: number
  timestamp: number
}

/**
 * Generate chart data from events
 */
function generateChartData(
  events: RaasAnalyticsEvent[],
  timeWindowMinutes: number = 30
): ChartDataPoint[] {
  const now = Date.now()
  const windowMs = timeWindowMinutes * 60 * 1000
  const intervalMs = Math.max(1000, windowMs / 30) // 30 data points

  const data: ChartDataPoint[] = []

  for (let i = timeWindowMinutes; i >= 0; i--) {
    const bucketStart = now - i * 60 * 1000
    const bucketEnd = bucketStart + 60 * 1000

    const count = events.filter((event) => {
      const eventTime = new Date(event.timestamp).getTime()
      return eventTime >= bucketStart && eventTime < bucketEnd
    }).length

    data.push({
      time: i === 0 ? 'Now' : `${i}m`,
      events: count,
      timestamp: bucketStart,
    })
  }

  return data
}

/**
 * Custom tooltip component
 */
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="px-3 py-2 bg-gray-900/95 border border-white/10 rounded-lg shadow-xl backdrop-blur-sm">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-cyan-400">
          {payload[0].value} events
        </p>
      </div>
    )
  }
  return null
}

export function RaaSUsageChart({
  events,
  eventsPerMinute,
  compact = false,
  className,
  timeWindow = 30,
}: RaaSUsageChartProps) {
  const { t } = useTranslation('analytics')

  // Generate chart data
  const chartData = useMemo(
    () => generateChartData(events, timeWindow),
    [events, timeWindow]
  )

  // Calculate max events for Y-axis scaling
  const maxEvents = useMemo(() => {
    const max = Math.max(...chartData.map((d) => d.events), eventsPerMinute)
    return Math.ceil(max * 1.2) || 10
  }, [chartData, eventsPerMinute])

  return (
    <div
      className={cn(
        'relative rounded-xl border border-white/10 bg-gray-900/50 backdrop-blur-sm p-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-white">
            {t('realtime.usage_chart')}
          </h4>
          <p className="text-xs text-gray-400 mt-0.5">
            {t('realtime.events_per_minute')}
          </p>
        </div>

        {/* Current value badge */}
        <div
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-bold',
            'bg-gradient-to-r from-cyan-500/20 to-blue-500/20',
            'text-cyan-400 border border-cyan-500/20'
          )}
        >
          {eventsPerMinute}
        </div>
      </div>

      {/* Chart */}
      <div className={cn('w-full', compact ? 'h-32' : 'h-48')}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="eventsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="rgba(255,255,255,0.05)"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="time"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={20}
            />

            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[0, maxEvents]}
              tickCount={4}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="events"
              stroke="#06b6d4"
              strokeWidth={2}
              fill="url(#eventsGradient)"
              fillOpacity={1}
              animationDuration={300}
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
        <div className="flex items-center gap-4">
          {/* Current */}
          <div>
            <p className="text-xs text-gray-500">Current</p>
            <p className="text-sm font-semibold text-white">{eventsPerMinute}</p>
          </div>

          {/* Average */}
          <div>
            <p className="text-xs text-gray-500">Avg (30m)</p>
            <p className="text-sm font-semibold text-white">
              {Math.round(
                chartData.reduce((sum, d) => sum + d.events, 0) /
                  chartData.length
              ) || 0}
            </p>
          </div>

          {/* Peak */}
          <div>
            <p className="text-xs text-gray-500">Peak</p>
            <p className="text-sm font-semibold text-white">
              {Math.max(...chartData.map((d) => d.events), 0)}
            </p>
          </div>
        </div>

        {/* Trend indicator */}
        <div className="flex items-center gap-1">
          {eventsPerMinute > 0 && (
            <>
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs text-cyan-400">Live</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
