/**
 * Usage Trends Chart - Time series visualization with Recharts
 */

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface UsageTrendsChartProps {
  data: Array<{
    period_start: string
    feature: string
    total_quantity: number
    event_count: number
  }>
  className?: string
}

const FEATURE_COLORS: Record<string, string> = {
  api_call: '#3b82f6',      // blue-500
  tokens: '#8b5cf6',        // purple-500
  model_inference: '#ec4899', // pink-500
  agent_execution: '#10b981', // emerald-500
  compute_ms: '#f59e0b',    // amber-500
}

const FEATURE_LABELS: Record<string, string> = {
  api_call: 'API Calls',
  tokens: 'Tokens',
  model_inference: 'Inferences',
  agent_execution: 'Agents',
  compute_ms: 'Compute (ms)',
}

export function UsageTrendsChart({ data, className }: UsageTrendsChartProps) {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['api_call', 'tokens'])

  // Transform data for chart
  const chartData = data.reduce((acc: Record<string, any>, item) => {
    const date = new Date(item.period_start).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    })
    if (!acc[date]) {
      acc[date] = { date }
    }
    acc[date][item.feature] = item.total_quantity
    return acc
  }, {})

  const transformedData = Object.values(chartData)

  const toggleFeature = (feature: string) => {
    setSelectedFeatures(prev =>
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    )
  }

  if (transformedData.length === 0) {
    return (
      <div className={cn("p-8 rounded-xl border border-white/10 bg-gray-900/50", className)}>
        <p className="text-center text-gray-400">Không có dữ liệu xu hướng</p>
      </div>
    )
  }

  return (
    <div className={cn("p-6 rounded-xl border border-white/10 bg-gray-900/50", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Xu hướng sử dụng</h3>

        {/* Feature Toggle */}
        <div className="flex gap-2">
          {Object.entries(FEATURE_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => toggleFeature(key)}
              className={cn(
                'px-3 py-1 text-xs rounded-full border transition-all',
                selectedFeatures.includes(key)
                  ? 'border-white/30 text-white bg-white/10'
                  : 'border-white/10 text-gray-400 hover:text-white'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={transformedData}>
            <defs>
              {Object.entries(FEATURE_COLORS).map(([key, color]) => (
                <defs key={key}>
                  <linearGradient id={`color-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#9ca3af"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#9ca3af', marginBottom: '8px' }}
              itemStyle={{ color: '#fff' }}
              formatter={(value: number) => [value.toLocaleString(), '']}
            />
            <Legend />
            {selectedFeatures.map((feature) => (
              <Area
                key={feature}
                type="monotone"
                dataKey={feature}
                stroke={FEATURE_COLORS[feature]}
                fillOpacity={1}
                fill={`url(#color-${feature})`}
                strokeWidth={2}
                name={FEATURE_LABELS[feature]}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default UsageTrendsChart
