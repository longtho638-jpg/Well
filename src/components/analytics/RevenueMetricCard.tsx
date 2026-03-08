/**
 * Revenue Metric Card Component
 * Individual card displaying a revenue metric with trend
 */

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar } from 'lucide-react'

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
