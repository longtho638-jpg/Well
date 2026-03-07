/**
 * Top Endpoints Chart Component
 * Visualizes top API endpoints by call volume
 * Phase 5 - Analytics Dashboard Enhancement
 */

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Activity, Calendar } from 'lucide-react'
import { useTopEndpoints } from '@/hooks/use-top-endpoints'
import { cn } from '@/lib/utils'

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

export function TopEndpointsChart({ className }: { className?: string }) {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')
  const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
  const { data: endpointsData, loading } = useTopEndpoints({ limit: 10, days })

  if (loading) {
    return (
      <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
        <div className="h-80 animate-pulse bg-gray-700/30 rounded-xl" />
      </div>
    )
  }

  if (!endpointsData || endpointsData.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
        <p className="text-gray-400 text-center py-8">No endpoint data available</p>
      </div>
    )
  }

  const chartData = endpointsData.map((endpoint, index) => ({
    name: `${endpoint.method} ${endpoint.endpoint.length > 30 ? endpoint.endpoint.slice(0, 30) + '...' : endpoint.endpoint}`,
    calls: endpoint.total_calls,
    avgDaily: endpoint.avg_daily_calls,
    color: COLORS[index % COLORS.length],
  }))

  return (
    <div className={cn('p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Top Endpoints by Call Volume
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Most called API endpoints ({days} days)
          </p>
        </div>

        {/* Date Range Picker */}
        <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-1 border border-white/10">
          <Calendar className="w-4 h-4 text-gray-400 ml-2" />
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                dateRange === range
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-white border border-transparent'
              )}
            >
              {range === '7d' ? '7 days' : range === '30d' ? '30 days' : '90 days'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <p className="text-xs text-emerald-300 mb-1">Total API Calls</p>
          <p className="text-xl font-bold text-emerald-400">
            {endpointsData.reduce((sum, e) => sum + e.total_calls, 0).toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <p className="text-xs text-blue-300 mb-1">Unique Endpoints</p>
          <p className="text-xl font-bold text-blue-400">{endpointsData.length}</p>
        </div>
        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
          <p className="text-xs text-purple-300 mb-1">Avg Daily (Top)</p>
          <p className="text-xl font-bold text-purple-400">
            {endpointsData[0]?.avg_daily_calls.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="horizontal"
            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
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
              fontSize={10}
              width={180}
              tick={{ fill: '#9ca3af' }}
              interval={0}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
              }}
              formatter={(value: any, name: string) => {
                if (name === 'Calls') {
                  return [value.toLocaleString(), 'Total Calls']
                }
                if (name === 'Avg Daily') {
                  return [value.toLocaleString(), 'Avg Daily Calls']
                }
                return [value, name]
              }}
            />
            <Bar dataKey="calls" name="Calls" radius={[0, 4, 4, 0]} barSize={36}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Endpoint List */}
      <div className="mt-6 space-y-2">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Detailed Stats</h4>
        {endpointsData.map((endpoint, index) => (
          <div
            key={`${endpoint.method}-${endpoint.endpoint}`}
            className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-white/5"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <div>
                <p className="text-sm font-medium text-white">
                  <span className="text-gray-400 mr-2">{endpoint.method}</span>
                  {endpoint.endpoint}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <span className="text-gray-400">
                {endpoint.total_calls.toLocaleString()} calls
              </span>
              <span className="text-gray-400">
                {endpoint.avg_daily_calls.toLocaleString()}/day
              </span>
              <span className="text-gray-400">
                {endpoint.unique_users} users
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TopEndpointsChart
