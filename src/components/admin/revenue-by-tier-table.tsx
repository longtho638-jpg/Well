/**
 * Revenue by Tier Table - Phase 2.3
 * Table showing MRR/ARR by tier with MoM growth and churn rate
 */

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useLicenseAnalytics } from '@/hooks/use-license-analytics'
import { TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react'

const TIER_COLORS: Record<string, string> = {
  free: '#9ca3af',
  basic: '#3b82f6',
  premium: '#8b5cf6',
  enterprise: '#10b981',
  master: '#f59e0b',
}

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  basic: 'Basic',
  premium: 'Premium',
  enterprise: 'Enterprise',
  master: 'Master',
}

interface RevenueByTierTableProps {
  className?: string
}

export function RevenueByTierTable({ className }: RevenueByTierTableProps) {
  const { revenueByTier, loading, summaryMetrics } = useLicenseAnalytics({ days: 30 })

  const totalMrr = useMemo(() => {
    return revenueByTier.reduce((sum, t) => sum + t.mrr_cents, 0)
  }, [revenueByTier])

  const totalLicenses = useMemo(() => {
    return revenueByTier.reduce((sum, t) => sum + t.licenses, 0)
  }, [revenueByTier])

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(cents / 100)
  }

  if (loading) {
    return (
      <div className={cn('p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50', className)}>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 animate-pulse bg-gray-700/30 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (revenueByTier.length === 0) {
    return (
      <div className={cn('p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50', className)}>
        <p className="text-gray-400 text-center py-8">No revenue data available</p>
      </div>
    )
  }

  return (
    <div className={cn('p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50', className)}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Revenue Tracking by Tier
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          MRR, ARR, growth, and churn metrics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-300">Total MRR</span>
          </div>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(totalMrr)}</p>
        </div>

        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-blue-300">Total Licenses</span>
          </div>
          <p className="text-xl font-bold text-blue-400">{totalLicenses}</p>
        </div>

        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-purple-300">Total ARR</span>
          </div>
          <p className="text-xl font-bold text-purple-400">{formatCurrency(totalMrr * 12)}</p>
        </div>

        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-amber-300">Avg Utilization</span>
          </div>
          <p className="text-xl font-bold text-amber-400">
            {summaryMetrics?.avg_utilization || 0}%
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Tier</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Licenses</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">MRR</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">ARR</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">MoM Growth</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Churn Rate</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Avg/License</th>
            </tr>
          </thead>
          <tbody>
            {revenueByTier.map((tier, index) => (
              <tr
                key={tier.tier}
                className={cn(
                  'border-b border-white/5 hover:bg-white/5 transition-colors',
                  index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'
                )}
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: TIER_COLORS[tier.tier] || '#6b7280' }}
                    />
                    <span className="text-sm font-medium text-white">
                      {TIER_LABELS[tier.tier] || tier.tier}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-sm font-medium text-white">
                    {new Intl.NumberFormat('vi-VN').format(tier.licenses)}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-sm font-bold text-emerald-400">
                    {formatCurrency(tier.mrr_cents)}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-sm text-gray-300">
                    {formatCurrency(tier.arr_cents)}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {tier.mom_growth >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    <span className={cn(
                      'text-sm font-medium',
                      tier.mom_growth >= 0 ? 'text-emerald-400' : 'text-red-400'
                    )}>
                      {tier.mom_growth >= 0 ? '+' : ''}{tier.mom_growth.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className={cn(
                    'text-sm font-medium',
                    tier.churn_rate <= 3 ? 'text-emerald-400' :
                    tier.churn_rate <= 5 ? 'text-amber-400' : 'text-red-400'
                  )}>
                    {tier.churn_rate.toFixed(1)}%
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-sm text-gray-300">
                    {formatCurrency(tier.avg_revenue_per_license)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Note */}
      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-xs text-blue-300">
          Revenue calculated from Polar webhook events. MoM = Month-over-Month growth rate.
          Churn rate estimated based on license activity and renewal patterns.
        </p>
      </div>
    </div>
  )
}

export default RevenueByTierTable
