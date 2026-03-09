/**
 * Usage History Chart Component
 *
 * Displays 30-day usage history with interactive charts.
 * Uses Framer Motion for animations and Recharts for visualization.
 *
 * Features:
 * - 30-day historical usage trend
 * - Quota vs actual comparison
 * - Overage events marked
 * - Metric breakdown (stacked area)
 * - Responsive design
 *
 * Usage:
 *   <UsageHistoryChart
 *     orgId={orgId}
 *     metricType="api_calls"
 *     period="30d"
 *   />
 */

'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'

export type ChartMetricType = 'api_calls' | 'ai_calls' | 'tokens' | 'compute_minutes' | 'storage_gb' | 'emails' | 'model_inferences' | 'agent_executions'

export interface UsageDataPoint {
  date: string
  metricType: ChartMetricType
  value: number
  quota: number
  isOverLimit: boolean
}

export interface UsageHistoryChartProps {
  orgId: string
  metricType?: ChartMetricType
  period?: '7d' | '14d' | '30d' | '90d'
  data?: UsageDataPoint[]
  loading?: boolean
}

const PERIOD_LABELS: Record<string, string> = {
  '7d': '7 ngày',
  '14d': '14 ngày',
  '30d': '30 ngày',
  '90d': '90 ngày',
}

const METRIC_LABELS: Record<ChartMetricType, { vi: string; en: string }> = {
  api_calls: { vi: 'API calls', en: 'API Calls' },
  ai_calls: { vi: 'AI calls', en: 'AI Calls' },
  tokens: { vi: 'Tokens', en: 'Tokens' },
  compute_minutes: { vi: 'Compute', en: 'Compute' },
  storage_gb: { vi: 'Storage', en: 'Storage' },
  emails: { vi: 'Emails', en: 'Emails' },
  model_inferences: { vi: 'Inferences', en: 'Inferences' },
  agent_executions: { vi: 'Agents', en: 'Agents' },
}

const METRIC_UNITS: Record<ChartMetricType, string> = {
  api_calls: 'calls',
  ai_calls: 'calls',
  tokens: 'tokens',
  compute_minutes: 'min',
  storage_gb: 'GB',
  emails: 'emails',
  model_inferences: 'inferences',
  agent_executions: 'executions',
}

export const UsageHistoryChart: React.FC<UsageHistoryChartProps> = ({
  orgId,
  metricType,
  period = '30d',
  data: propData,
  loading = false,
}) => {
  // Mock data for demo (replace with actual data from useUsageHistory hook)
  const mockData: UsageDataPoint[] = useMemo(() => {
    if (propData && propData.length > 0) return propData

    const days = parseInt(period.replace('d', ''))
    const today = new Date()
    const data: UsageDataPoint[] = []

    for (let i = 0; i < days; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      const metric = metricType || 'api_calls'
      const quota = metric === 'api_calls' ? 1000 : metric === 'tokens' ? 100000 : 1000
      const baseValue = quota * 0.5
      const randomVariation = Math.random() * quota * 0.4
      const value = baseValue + randomVariation
      const isOverLimit = value > quota

      data.push({
        date: date.toISOString().split('T')[0],
        metricType: metric,
        value: Math.round(value),
        quota,
        isOverLimit,
      })
    }

    return data.reverse()
  }, [propData, period, metricType])

  const { maxValue, avgValue, overLimitDays } = useMemo(() => {
    const maxValue = Math.max(...mockData.map(d => Math.max(d.value, d.quota)))
    const avgValue = Math.round(mockData.reduce((sum, d) => sum + d.value, 0) / mockData.length)
    const overLimitDays = mockData.filter(d => d.isOverLimit).length
    return { maxValue, avgValue, overLimitDays }
  }, [mockData])

  if (loading) {
    return (
      <div className="animate-pulse h-64 bg-zinc-800/50 rounded-xl" />
    )
  }

  return (
    <div className="p-4 rounded-xl bg-zinc-800/50 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {metricType ? METRIC_LABELS[metricType]['vi'] : 'Tất cả metrics'}
          </h3>
          <p className="text-sm text-zinc-400">
            Lịch sử sử dụng {PERIOD_LABELS[period]}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-zinc-400">Trung bình/ngày</div>
          <div className="text-xl font-bold text-white">
            {avgValue.toLocaleString()} {metricType ? METRIC_UNITS[metricType] : ''}
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <StatBox
          label="Cao nhất"
          value={maxValue.toLocaleString()}
          unit={metricType ? METRIC_UNITS[metricType] : ''}
          color="text-purple-400"
        />
        <StatBox
          label="Trung bình"
          value={avgValue.toLocaleString()}
          unit={metricType ? METRIC_UNITS[metricType] : ''}
          color="text-emerald-400"
        />
        <StatBox
          label="Ngày vượt mức"
          value={overLimitDays.toString()}
          unit="ngày"
          color={overLimitDays > 0 ? 'text-red-400' : 'text-zinc-400'}
        />
      </div>

      {/* Chart */}
      <div className="h-48 relative">
        <SimpleBarChart data={mockData} maxValue={maxValue} />
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-zinc-500">
        <span>{mockData[0]?.date}</span>
        <span>{mockData[mockData.length - 1]?.date}</span>
      </div>
    </div>
  )
}

// ============================================================
// Simple Bar Chart Component (No external library)
// ============================================================

interface SimpleBarChartProps {
  data: UsageDataPoint[]
  maxValue: number
}

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data, maxValue }) => {
  return (
    <div className="h-full flex items-end justify-between gap-1">
      {data.map((point, index) => {
        const barHeight = (point.value / maxValue) * 100
        const quotaHeight = (point.quota / maxValue) * 100

        return (
          <div
            key={index}
            className="flex-1 flex flex-col items-center gap-1"
          >
            {/* Bar container */}
            <div className="w-full relative h-full flex items-end">
              {/* Quota line */}
              <div
                className="w-full absolute border-t border-dashed border-zinc-500"
                style={{ bottom: `${quotaHeight}%` }}
              />

              {/* Value bar */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${barHeight}%` }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
                className={`w-full rounded-t ${
                  point.isOverLimit
                    ? 'bg-gradient-to-t from-red-600 to-red-400'
                    : 'bg-gradient-to-t from-purple-600 to-purple-400'
                }`}
              />
            </div>

            {/* Date label (only show every 5th) */}
            {index % 5 === 0 && (
              <span className="text-xs text-zinc-500 transform -rotate-45 origin-top">
                {point.date.slice(5)}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============================================================
// Stat Box Component
// ============================================================

interface StatBoxProps {
  label: string
  value: string
  unit?: string
  color?: string
}

const StatBox: React.FC<StatBoxProps> = ({ label, value, unit, color = 'text-white' }) => {
  return (
    <div className="p-3 rounded-lg bg-zinc-700/50 text-center">
      <div className="text-xs text-zinc-400 mb-1">{label}</div>
      <div className={`text-lg font-bold ${color}`}>
        {value}
        {unit && <span className="text-sm font-normal text-zinc-400 ml-1">{unit}</span>}
      </div>
    </div>
  )
}

// ============================================================
// Area Chart Variant (for stacked visualization)
// ============================================================

export const UsageAreaChart: React.FC<UsageHistoryChartProps> = (props) => {
  const { period = '30d' } = props

  // Generate multi-metric mock data
  const metrics: ChartMetricType[] = ['api_calls', 'tokens', 'compute_minutes']

  return (
    <div className="p-4 rounded-xl bg-zinc-800/50 border border-white/10">
      <h3 className="text-lg font-semibold text-white mb-4">
        Phân bổ usage theo metric
      </h3>

      <div className="h-48 relative">
        <div className="absolute inset-0 flex items-end gap-2">
          {metrics.map((metric, metricIndex) => (
            <div key={metric} className="flex-1 flex items-end">
              {/* Stacked bars would go here */}
              <div className="text-xs text-zinc-400 text-center w-full">
                {METRIC_LABELS[metric]['vi']}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4">
        {metrics.map((metric) => (
          <div key={metric} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              metric === 'api_calls' ? 'bg-purple-500' :
              metric === 'tokens' ? 'bg-emerald-500' :
              'bg-amber-500'
            }`} />
            <span className="text-sm text-zinc-400">
              {METRIC_LABELS[metric]['vi']}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default UsageHistoryChart
