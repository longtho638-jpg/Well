/**
 * Usage Gauge Card - displays quota utilization as circular gauge
 */

import { PieChart } from 'recharts';
import { Pie } from 'recharts';
import { Cell } from 'recharts';
import { ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils'

interface UsageGaugeCardProps {
  metric: string
  label: string
  used: number
  limit: number
  percentage: number
  severity?: 'low' | 'medium' | 'high' | 'critical'
  className?: string
}

const SEVERITY_COLORS = {
  low: '#10b981',       // emerald-500
  medium: '#f59e0b',    // amber-500
  high: '#f97316',      // orange-500
  critical: '#ef4444',  // red-500
}

const SEVERITY_LABELS = {
  low: 'Ổn định',
  medium: 'Lưu ý',
  high: 'Cảnh báo',
  critical: 'Nguy hiểm',
}

export function UsageGaugeCard({
  metric,
  label,
  used,
  limit,
  percentage,
  severity = 'low',
  className,
}: UsageGaugeCardProps) {
  const data = [
    { name: 'Used', value: Math.min(used, limit), color: SEVERITY_COLORS[severity] },
    { name: 'Remaining', value: Math.max(0, limit - used), color: '#374151' }, // gray-700
  ]

  const displayPercentage = limit === -1 ? 0 : Math.min(100, percentage)

  return (
    <div className={cn(
      'relative p-4 rounded-xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm',
      className
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
          <p className="text-lg font-semibold text-white mt-1">{metric}</p>
        </div>
        <span className={cn(
          'px-2 py-0.5 text-xs rounded-full border',
          severity === 'low' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          severity === 'medium' && 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          severity === 'high' && 'bg-orange-500/10 text-orange-400 border-orange-500/30',
          severity === 'critical' && 'bg-red-500/10 text-red-400 border-red-500/30',
        )}>
          {SEVERITY_LABELS[severity]}
        </span>
      </div>

      {/* Gauge */}
      <div className="relative h-32">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">
            {limit === -1 ? '∞' : displayPercentage.toFixed(0)}%
          </span>
          <span className="text-xs text-gray-400 mt-0.5">
            {used.toLocaleString()} / {limit === -1 ? '∞' : limit.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-white/5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Đã dùng</span>
          <span className="text-white font-medium">{used.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-xs mt-1">
          <span className="text-gray-400">Còn lại</span>
          <span className="text-white font-medium">
            {limit === -1 ? 'Không giới hạn' : Math.max(0, limit - used).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}

export default UsageGaugeCard
