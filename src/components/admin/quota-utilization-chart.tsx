/**
 * Quota Utilization Chart - Phase 2.3
 * Pie chart showing licenses by utilization tier
 * - Low (<50%)
 * - Medium (50-80%)
 * - High (>80%)
 */

import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'
import { useLicenseAnalytics, type QuotaUtilization } from '@/hooks/use-license-analytics'
import { AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react'

const UTILIZATION_COLORS = {
  low: '#10b981',      // emerald-500
  medium: '#f59e0b',   // amber-500
  high: '#ef4444',     // red-500
}

const UTILIZATION_LABELS = {
  low: 'Low (<50%)',
  medium: 'Medium (50-80%)',
  high: 'High (>80%)',
}

interface QuotaUtilizationChartProps {
  className?: string
}

export function QuotaUtilizationChart({ className }: QuotaUtilizationChartProps) {
  const { quotaUtilization, loading } = useLicenseAnalytics({ days: 30 })

  const chartData = useMemo(() => {
    if (!quotaUtilization || quotaUtilization.length === 0) return []

    // Group by utilization tier
    const tierMap = new Map<string, { name: string; value: number; licenseIds: string[] }>()

    quotaUtilization.forEach((quota: QuotaUtilization) => {
      const tier = quota.tier_category
      const existing = tierMap.get(tier) || {
        name: UTILIZATION_LABELS[tier],
        value: 0,
        licenseIds: [] as string[],
      }
      existing.value++
      existing.licenseIds.push(quota.license_id)
      tierMap.set(tier, existing)
    })

    return Array.from(tierMap.values())
  }, [quotaUtilization])

  const stats = useMemo(() => {
    if (!quotaUtilization || quotaUtilization.length === 0) return null

    const highUtilization = quotaUtilization.filter((q) => q.tier_category === 'high')
    const avgUtilization = Math.round(
      quotaUtilization.reduce((sum, q) => sum + q.utilization_percentage, 0) / quotaUtilization.length
    )

    return {
      total: quotaUtilization.length,
      highUtilization: highUtilization.length,
      avgUtilization,
      atRisk: highUtilization.map((q) => q.license_id).slice(0, 3),
    }
  }, [quotaUtilization])

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
        <p className="text-gray-400 text-center py-8">No quota data available</p>
      </div>
    )
  }

  return (
    <div className={cn('p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50', className)}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Quota Utilization Distribution
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          Licenses grouped by quota usage percentage
        </p>
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
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={UTILIZATION_COLORS[entry.name.split(' ')[0].toLowerCase() as keyof typeof UTILIZATION_COLORS] || '#6b7280'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                }}
                formatter={(value: number) => [`${value} licenses`, 'Count']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Panel */}
        <div className="space-y-4">
          {stats && (
            <>
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-300">Average Utilization</span>
                </div>
                <p className="text-2xl font-bold text-emerald-400">{stats.avgUtilization}%</p>
                <p className="text-xs text-emerald-500 mt-1">Across {stats.total} licenses</p>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-amber-300">High Utilization</span>
                </div>
                <p className="text-2xl font-bold text-amber-400">{stats.highUtilization}</p>
                <p className="text-xs text-amber-500 mt-1">
                  Licenses at &gt;80% capacity
                </p>
              </div>

              {stats.atRisk.length > 0 && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-xs text-red-300 mb-1">Licenses needing attention:</p>
                  <div className="flex flex-wrap gap-1">
                    {stats.atRisk.map((id) => (
                      <span
                        key={id}
                        className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded"
                      >
                        {id.slice(0, 8)}...
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Legend Cards */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {chartData.map((tier) => (
          <div
            key={tier.name}
            className="p-3 bg-gray-800/30 rounded-lg border border-white/5"
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: UTILIZATION_COLORS[tier.name.split(' ')[0].toLowerCase() as keyof typeof UTILIZATION_COLORS] || '#6b7280' }}
              />
              <span className="text-xs text-gray-400">{tier.name.split(' ')[0]}</span>
            </div>
            <p className="text-lg font-bold text-white">{tier.value}</p>
            <p className="text-xs text-gray-500">licenses</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default QuotaUtilizationChart
