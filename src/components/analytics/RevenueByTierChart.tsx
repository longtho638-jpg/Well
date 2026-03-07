/**
 * Revenue by Tier Chart Component
 * Visualizes revenue breakdown by license tier (Free, Basic, Premium, Enterprise, Master)
 * Phase 5 - Analytics Dashboard Enhancement
 */

import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { DollarSign, TrendingUp } from 'lucide-react'
import { useRevenueByTier } from '@/hooks/use-polar-analytics'
import { cn } from '@/lib/utils'

const TIER_COLORS: Record<string, string> = {
  free: '#9ca3af',      // gray-400
  basic: '#3b82f6',     // blue-500
  premium: '#8b5cf6',   // purple-500
  enterprise: '#10b981',// emerald-500
  master: '#f59e0b',    // amber-500
}

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  basic: 'Basic',
  premium: 'Premium',
  enterprise: 'Enterprise',
  master: 'Master',
}

export function RevenueByTierChart({ className }: { className?: string }) {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')
  const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
  const { data: tierData, loading } = useRevenueByTier({ days })

  if (loading) {
    return (
      <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
        <div className="h-80 animate-pulse bg-gray-700/30 rounded-xl" />
      </div>
    )
  }

  if (!tierData || tierData.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
        <p className="text-gray-400 text-center py-8">No revenue data available</p>
      </div>
    )
  }

  const totalMrr = tierData.reduce((sum, t) => sum + t.mrr_cents, 0)
  const totalLicenses = tierData.reduce((sum, t) => sum + t.license_count, 0)

  const chartData = tierData.map((tier) => ({
    name: TIER_LABELS[tier.tier] || tier.tier,
    value: tier.mrr_cents,
    licenseCount: tier.license_count,
    percentage: tier.percentage_of_total,
    color: TIER_COLORS[tier.tier] || '#6b7280',
  }))

  return (
    <div className={cn('p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Revenue by License Tier
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            MRR breakdown by tier ({days} days)
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

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <p className="text-xs text-emerald-300 mb-1">Total MRR</p>
          <p className="text-xl font-bold text-emerald-400">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(totalMrr / 100)}
          </p>
        </div>
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <p className="text-xs text-blue-300 mb-1">Total Licenses</p>
          <p className="text-xl font-bold text-blue-400">{totalLicenses}</p>
        </div>
        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
          <p className="text-xs text-purple-300 mb-1">Avg Revenue/License</p>
          <p className="text-xl font-bold text-purple-400">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(
              totalLicenses > 0 ? (totalMrr / totalLicenses) / 100 : 0
            )}
          </p>
        </div>
      </div>

      {/* Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percentage }) => `${name} ${percentage.toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                }}
                formatter={(value: any) => [
                  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(value / 100),
                  'MRR',
                ]}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className="text-gray-300">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tier Stats Table */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Tier Performance
          </h4>
          {chartData.map((tier, _index) => (
            <div
              key={tier.name}
              className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-white/5"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tier.color }}
                />
                <div>
                  <p className="text-sm font-medium text-white">{tier.name}</p>
                  <p className="text-xs text-gray-400">{tier.licenseCount} licenses</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(tier.value / 100)}
                </p>
                <p className="text-xs text-gray-400">{tier.percentage.toFixed(1)}% of total</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RevenueByTierChart
