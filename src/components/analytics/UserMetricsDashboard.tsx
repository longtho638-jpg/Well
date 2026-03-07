/**
 * User Metrics Dashboard - DAU/MAU, Conversion, Churn
 * ROIaaS Phase 5 - User Analytics
 */

import { cn } from '@/lib/utils'
import { Users, UserCheck, UserPlus, TrendingUp } from 'lucide-react'
import type { UserMetrics } from '@/types/revenue-analytics'

interface UserMetricCardProps {
  title: string
  value: number
  icon?: 'users' | 'active' | 'conversion' | 'retention'
  format?: 'number' | 'percent' | 'ratio'
  className?: string
}

const ICONS = {
  users: Users,
  active: UserCheck,
  conversion: UserPlus,
  retention: TrendingUp,
}

export function UserMetricCard({
  title,
  value,
  icon = 'users',
  format = 'number',
  className,
}: UserMetricCardProps) {
  const Icon = ICONS[icon]

  const formatValue = (val: number) => {
    switch (format) {
      case 'number':
        return new Intl.NumberFormat('vi-VN').format(val)
      case 'percent':
        return `${val.toFixed(1)}%`
      case 'ratio':
        return val.toFixed(2)
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
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-400">{title}</span>
        <div className={cn(
          'p-2 rounded-lg',
          icon === 'users' && 'bg-blue-500/10',
          icon === 'active' && 'bg-emerald-500/10',
          icon === 'conversion' && 'bg-amber-500/10',
          icon === 'retention' && 'bg-purple-500/10',
        )}>
          <Icon className={cn(
            'w-5 h-5',
            icon === 'users' && 'text-blue-400',
            icon === 'active' && 'text-emerald-400',
            icon === 'conversion' && 'text-amber-400',
            icon === 'retention' && 'text-purple-400',
          )} />
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{formatValue(value)}</p>
    </div>
  )
}

/**
 * User Metrics Dashboard
 */
interface UserMetricsDashboardProps {
  metrics: UserMetrics
  className?: string
}

export function UserMetricsDashboard({ metrics, className }: UserMetricsDashboardProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      <UserMetricCard
        title="DAU"
        value={metrics.dau}
        icon="users"
        format="number"
      />
      <UserMetricCard
        title="MAU"
        value={metrics.mau}
        icon="active"
        format="number"
      />
      <UserMetricCard
        title="DAU/MAU Ratio"
        value={metrics.dau_mau_ratio}
        icon="retention"
        format="ratio"
      />
      <UserMetricCard
        title="Conversion Rate"
        value={metrics.conversion_rate}
        icon="conversion"
        format="percent"
      />
    </div>
  )
}

/**
 * Cohort Retention Table
 */
interface CohortRow {
  cohort: string
  size: number
  periods: { day: number; retained: number; percentage: number }[]
}

interface CohortRetentionTableProps {
  data: CohortRow[]
  className?: string
}

export function CohortRetentionTable({ data, className }: CohortRetentionTableProps) {
  const maxPeriods = Math.max(...data.map(d => d.periods.length))

  return (
    <div className={cn('rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 overflow-hidden', className)}>
      <div className="p-6 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white">Phân Tích Giữ Chân Theo Nhóm</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Nhóm
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">
                Quy Mô
              </th>
              {Array.from({ length: Math.min(maxPeriods, 4) }).map((_, i) => (
                <th key={i} className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">
                  Ngày {i * 30}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((row) => (
              <tr key={row.cohort} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                  {row.cohort}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-400">
                  {row.size}
                </td>
                {row.periods.slice(0, 4).map((period, i) => (
                  <td key={i} className="px-6 py-4 whitespace-nowrap text-right">
                    <span className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      period.percentage >= 80 && 'bg-emerald-500/10 text-emerald-400',
                      period.percentage >= 50 && period.percentage < 80 && 'bg-amber-500/10 text-amber-400',
                      period.percentage < 50 && 'bg-red-500/10 text-red-400',
                    )}>
                      {period.percentage.toFixed(0)}%
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
