/**
 * Conversion Funnel Chart Component
 * Visualizes user progression through license activation → API usage → paying customer
 */

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Calendar, TrendingDown } from 'lucide-react'
import { useConversionFunnel } from '@/hooks/use-polar-analytics'

const FUNNEL_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']

export function ConversionFunnelChart() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')
  const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
  const { data: funnelData, loading, error } = useConversionFunnel({ days })

  if (loading) {
    return (
      <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
        <div className="h-64 animate-pulse bg-gray-700/30 rounded-xl" />
      </div>
    )
  }

  if (error || !funnelData) {
    return (
      <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
        <p className="text-red-400 text-center">Error loading funnel data</p>
      </div>
    )
  }

  const chartData = funnelData.steps.map((step, index) => ({
    name: step.name,
    count: step.count,
    drop_off: step.drop_off_rate,
    color: FUNNEL_COLORS[index % FUNNEL_COLORS.length],
  }))

  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Conversion Funnel
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            License activation → API usage → Paying customer
          </p>
        </div>

        {/* Date Range Picker */}
        <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-1 border border-white/10">
          <Calendar className="w-4 h-4 text-gray-400 ml-2" />
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                dateRange === range
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-white border border-transparent'
              }`}
            >
              {range === '7d' ? '7 days' : range === '30d' ? '30 days' : '90 days'}
            </button>
          ))}
        </div>
      </div>

      {/* Overall Conversion Rate */}
      <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
        <div className="flex items-center justify-between">
          <span className="text-sm text-emerald-300">Overall Conversion Rate</span>
          <span className="text-2xl font-bold text-emerald-400">
            {funnelData.overall_conversion_rate.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Funnel Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="horizontal"
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <XAxis
              type="number"
              stroke="#9ca3af"
              fontSize={12}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <YAxis
              dataKey="name"
              type="category"
              stroke="#9ca3af"
              fontSize={11}
              width={120}
              tick={{ fill: '#9ca3af' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'Count') {
                  return [value.toLocaleString(), 'Users']
                }
                if (name === 'Drop-off') {
                  return [`${value}%`, 'Drop-off Rate']
                }
                return [value, name]
              }}
              labelFormatter={(label) => `Step: ${label}`}
            />
            <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]} barSize={40}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Drop-off Rates */}
      <div className="mt-6 grid grid-cols-5 gap-2">
        {funnelData.steps.map((step, index) => (
          <div
            key={step.step}
            className="p-3 bg-gray-800/50 rounded-lg border border-white/10 text-center"
          >
            <div
              className="w-3 h-3 rounded-full mx-auto mb-2"
              style={{ backgroundColor: FUNNEL_COLORS[index % FUNNEL_COLORS.length] }}
            />
            <p className="text-xs text-gray-400 mb-1 truncate">{step.name}</p>
            <p className="text-lg font-bold text-white">{step.count.toLocaleString()}</p>
            {step.drop_off_rate > 0 && (
              <p className="text-xs text-red-400 mt-1">-{step.drop_off_rate}%</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
