/**
 * Usage by License Chart - Phase 2.3
 * Bar chart showing API calls per license (last 7/30/90 days)
 * Groups by tier with color coding
 */

import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { cn } from '@/lib/utils'
import { useLicenseAnalytics, type UsageByLicense } from '@/hooks/use-license-analytics'

const TIER_COLORS: Record<string, string> = {
  free: '#9ca3af',
  basic: '#3b82f6',
  premium: '#8b5cf6',
  enterprise: '#10b981',
  master: '#f59e0b',
}

interface UsageByLicenseChartProps {
  className?: string
  title?: string
}

export function UsageByLicenseChart({ className, title }: UsageByLicenseChartProps) {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')
  const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
  const { usageByLicense, loading } = useLicenseAnalytics({ days })

  const chartData = useMemo(() => {
    if (!usageByLicense || usageByLicense.length === 0) return []

    // Group by tier and sum API calls
    const tierMap = new Map<string, { name: string; value: number; licenses: number }>()

    usageByLicense.forEach((usage: UsageByLicense) => {
      const existing = tierMap.get(usage.tier) || {
        name: usage.tier.charAt(0).toUpperCase() + usage.tier.slice(1),
        value: 0,
        licenses: 0,
      }
      existing.value += usage.total_api_calls
      existing.licenses++
      tierMap.set(usage.tier, existing)
    })

    return Array.from(tierMap.values()).sort((a, b) => b.value - a.value)
  }, [usageByLicense])

  const totalApiCalls = useMemo(() => {
    return usageByLicense.reduce((sum, u) => sum + u.total_api_calls, 0)
  }, [usageByLicense])

  if (loading) {
    return (
      <div className={cn('p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50', className)}>
        <div className="h-64 animate-pulse bg-gray-700/30 rounded-xl" />
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className={cn('p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50', className)}>
        <p className="text-gray-400 text-center py-8">No usage data available</p>
      </div>
    )
  }

  return (
    <div className={cn('p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">{title || 'API Calls by License Tier'}</h3>
          <p className="text-sm text-gray-400 mt-1">
            Total: {new Intl.NumberFormat('vi-VN').format(totalApiCalls)} API calls ({days} days)
          </p>
        </div>

        {/* Date Range Picker */}
        <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-1 border border-white/10">
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

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
            <XAxis type="number" stroke="#9ca3af" fontSize={12} />
            <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={12} width={80} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
              }}
              formatter={(value: number) => [new Intl.NumberFormat('vi-VN').format(value), 'API Calls']}
            />
            <Legend />
            <Bar dataKey="value" name="API Calls" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={TIER_COLORS[entry.name.toLowerCase()] || '#6b7280'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        {chartData.map((tier) => (
          <div
            key={tier.name}
            className="p-3 bg-gray-800/30 rounded-lg border border-white/5"
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: TIER_COLORS[tier.name.toLowerCase()] || '#6b7280' }}
              />
              <span className="text-xs text-gray-400">{tier.name}</span>
            </div>
            <p className="text-lg font-bold text-white">
              {new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(tier.value)}
            </p>
            <p className="text-xs text-gray-500">{tier.licenses} licenses</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default UsageByLicenseChart
