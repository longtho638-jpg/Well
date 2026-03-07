/**
 * Revenue Trend Chart - Area Chart with gradient
 * Aura Elite Design System
 */

import { AreaChart } from 'recharts'
import { Area } from 'recharts'
import { XAxis } from 'recharts'
import { YAxis } from 'recharts'
import { CartesianGrid } from 'recharts'
import { Tooltip } from 'recharts'
import { ResponsiveContainer } from 'recharts'
import { Legend } from 'recharts'
import { ChartCard } from './ChartCard'

interface RevenueTrendChartProps {
  data: Array<{
    date: string
    revenue: number
    costs: number
  }>
  className?: string
}

export function RevenueTrendChart({ data, className }: RevenueTrendChartProps) {
  return (
    <ChartCard
      title="Xu Hướng Doanh Thu"
      description="Doanh thu và chi phí theo thời gian"
      className={className}
    >
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="costsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
            <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#revenueGradient)"
              name="Doanh Thu"
            />
            <Area
              type="monotone"
              dataKey="costs"
              stroke="#ef4444"
              fillOpacity={1}
              fill="url(#costsGradient)"
              name="Chi Phí"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
