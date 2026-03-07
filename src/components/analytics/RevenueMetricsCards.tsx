/**
 * Revenue Metrics Cards - Display GMV, MRR, ARR with trends
 * ROIaaS Phase 5 - Operational ROI Dashboard
 */

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar } from 'lucide-react'
import type { RevenueSnapshot } from '@/types/revenue-analytics'

interface RevenueMetricCardProps {
  title: string
  value: number
  trend?: number
  icon?: 'gmv' | 'mrr' | 'arr' | 'customers'
  format?: 'currency' | 'number' | 'percent'
  className?: string
}

const ICONS = {
  gmv: DollarSign,
  mrr: Calendar,
  arr: Calendar,
  customers: Users,
}

export function RevenueMetricCard({
  title,
  value,
  trend = 0,
  icon = 'gmv',
  format = 'currency',
  className,
}: RevenueMetricCardProps) {
  const Icon = ICONS[icon]
  const isPositive = trend >= 0
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val)
      case 'number':
        return new Intl.NumberFormat('vi-VN').format(val)
      case 'percent':
        return `${val.toFixed(1)}%`
      default:
        return val.toString()
    }
  }

  return (
    <div className={cn(
      'relative p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm',
      'hover:border-white/20 transition-all duration-300',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-400">{title}</span>
        <div className={cn(
          'p-2 rounded-lg',
          icon === 'gmv' && 'bg-emerald-500/10',
          icon === 'mrr' && 'bg-blue-500/10',
          icon === 'arr' && 'bg-purple-500/10',
          icon === 'customers' && 'bg-amber-500/10',
        )}>
          <Icon className={cn(
            'w-5 h-5',
            icon === 'gmv' && 'text-emerald-400',
            icon === 'mrr' && 'text-blue-400',
            icon === 'arr' && 'text-purple-400',
            icon === 'customers' && 'text-amber-400',
          )} />
        </div>
      </div>

      {/* Value */}
      <div className="mb-3">
        <p className="text-3xl font-bold text-white">{formatValue(value)}</p>
      </div>

      {/* Trend */}
      {trend !== undefined && (
        <div className="flex items-center gap-2">
          <TrendIcon className={cn(
            'w-4 h-4',
            isPositive ? 'text-emerald-400' : 'text-red-400'
          )} />
          <span className={cn(
            'text-sm font-medium',
            isPositive ? 'text-emerald-400' : 'text-red-400'
          )}>
            {isPositive ? '+' : ''}{trend.toFixed(1)}%
          </span>
          <span className="text-xs text-gray-500">so với kỳ trước</span>
        </div>
      )}

      {/* Glassmorphism glow effect */}
      <div className={cn(
        'absolute -inset-px rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none',
        'bg-gradient-to-r from-white/5 via-white/5 to-white/5 blur-sm'
      )} />
    </div>
  )
}

/**
 * Revenue Dashboard - Main Operational ROI View
 */
interface RevenueDashboardProps {
  data: {
    currentSnapshot: RevenueSnapshot
    previousSnapshot: RevenueSnapshot | null
    trend: { gmv: number; mrr: number; arr: number; customers: number }
  }
  className?: string
}

export function RevenueDashboard({ data, className }: RevenueDashboardProps) {
  const { currentSnapshot, trend } = data

  return (
    <div className={cn('space-y-6', className)}>
      {/* Main Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <RevenueMetricCard
          title="GMV"
          value={currentSnapshot.gmv.total}
          trend={trend.gmv}
          icon="gmv"
          format="currency"
        />
        <RevenueMetricCard
          title="MRR"
          value={currentSnapshot.mrr.total}
          trend={trend.mrr}
          icon="mrr"
          format="currency"
        />
        <RevenueMetricCard
          title="ARR"
          value={currentSnapshot.arr.total}
          trend={trend.arr}
          icon="arr"
          format="currency"
        />
        <RevenueMetricCard
          title="Khách Hàng"
          value={currentSnapshot.customers.total}
          trend={trend.customers}
          icon="customers"
          format="number"
        />
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Subscription vs Usage */}
        <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
          <h3 className="text-lg font-semibold text-white mb-4">Phân Tích Doanh Thu</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">Subscription</span>
                <span className="text-sm font-medium text-white">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                    minimumFractionDigits: 0,
                  }).format(currentSnapshot.gmv.subscription)}
                </span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                  style={{
                    width: `${currentSnapshot.gmv.total > 0
                      ? (currentSnapshot.gmv.subscription / currentSnapshot.gmv.total) * 100
                      : 0}%`
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">Usage-Based</span>
                <span className="text-sm font-medium text-white">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                    minimumFractionDigits: 0,
                  }).format(currentSnapshot.gmv.usage_based)}
                </span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                  style={{
                    width: `${currentSnapshot.gmv.total > 0
                      ? (currentSnapshot.gmv.usage_based / currentSnapshot.gmv.total) * 100
                      : 0}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tier Breakdown */}
        <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
          <h3 className="text-lg font-semibold text-white mb-4">Phân Bố Gói Dịch Vụ</h3>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(currentSnapshot.tier_breakdown || {}).map(([tier, count]) => (
              <div key={tier} className="text-center">
                <div className={cn(
                  'w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2',
                  tier === 'free' && 'bg-gray-500/20',
                  tier === 'basic' && 'bg-blue-500/20',
                  tier === 'premium' && 'bg-purple-500/20',
                  tier === 'enterprise' && 'bg-amber-500/20',
                  tier === 'master' && 'bg-emerald-500/20',
                )}>
                  <span className={cn(
                    'text-sm font-bold',
                    tier === 'free' && 'text-gray-400',
                    tier === 'basic' && 'text-blue-400',
                    tier === 'premium' && 'text-purple-400',
                    tier === 'enterprise' && 'text-amber-400',
                    tier === 'master' && 'text-emerald-400',
                  )}>
                    {count}
                  </span>
                </div>
                <p className="text-xs text-gray-500 capitalize">{tier}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
