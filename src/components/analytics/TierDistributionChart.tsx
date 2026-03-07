/**
 * Tier Distribution - Pie Chart
 * Aura Elite Design System
 */

import { useMemo } from 'react'
import { PieChart } from 'recharts'
import { Pie } from 'recharts'
import { Cell } from 'recharts'
import { Tooltip } from 'recharts'
import { ResponsiveContainer } from 'recharts'
import { ChartCard } from './ChartCard'

interface TierDistributionChartProps {
  data: Record<string, number>
  className?: string
}

const TIER_COLORS = {
  free: '#6b7280',
  basic: '#3b82f6',
  premium: '#8b5cf6',
  enterprise: '#f59e0b',
  master: '#10b981',
}

export function TierDistributionChart({ data, className }: TierDistributionChartProps) {
  const chartData = useMemo(() =>
    Object.entries(data).map(([name, value]) => ({
      name,
      value,
      color: TIER_COLORS[name as keyof typeof TIER_COLORS] || '#6b7280',
    })),
    [data]
  )

  return (
    <ChartCard
      title="Phân Bổ Gói Dịch Vụ"
      description="Tỷ lệ người dùng theo gói"
      className={className}
    >
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
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
