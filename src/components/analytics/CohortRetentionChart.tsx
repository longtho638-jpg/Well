/**
 * Cohort Retention Chart - Line Chart
 * Aura Elite Design System
 */

import { useMemo } from 'react'
import { LineChart } from 'recharts'
import { Line } from 'recharts'
import { XAxis } from 'recharts'
import { YAxis } from 'recharts'
import { CartesianGrid } from 'recharts'
import { Tooltip } from 'recharts'
import { ResponsiveContainer } from 'recharts'
import { Legend } from 'recharts'
import { type CohortRetention } from '@/hooks/analytics/use-cohort-retention'
import { ChartCard } from './ChartCard'

interface CohortRetentionChartProps {
  data: CohortRetention[]
  className?: string
}

export function CohortRetentionChart({ data, className }: CohortRetentionChartProps) {
  const chartData = useMemo(() => {
    const periods = [0, 30, 60, 90]
    return periods.map(period => {
      const point: Record<string, any> = { day: period }
      data.forEach(cohort => {
        const periodData = cohort.periods.find(p => p.day === period)
        const cohortKey = new Date(cohort.cohort_month).toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' })
        point[cohortKey] = periodData?.retained_percentage || 0
      })
      return point
    })
  }, [data])

  const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4']

  return (
    <ChartCard
      title="Đường Giữ Chân"
      description="So sánh tỷ lệ giữ chân giữa các nhóm"
      className={className}
    >
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
            <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `D${v}`} />
            <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
              }}
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Retention']}
            />
            <Legend />
            {data.slice(0, 6).map((cohort, index) => {
              const cohortKey = new Date(cohort.cohort_month).toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' })
              return (
                <Line
                  key={cohort.cohort_month}
                  type="monotone"
                  dataKey={cohortKey}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ fill: colors[index % colors.length], strokeWidth: 2 }}
                  name={cohortKey}
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
