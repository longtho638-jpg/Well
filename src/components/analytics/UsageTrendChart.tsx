/**
 * Usage Trend Chart - Line Chart
 * Aura Elite Design System
 */

import { LineChart } from 'recharts'
import { Line } from 'recharts'
import { XAxis } from 'recharts'
import { YAxis } from 'recharts'
import { CartesianGrid } from 'recharts'
import { Tooltip } from 'recharts'
import { ResponsiveContainer } from 'recharts'
import { Legend } from 'recharts'
import { ChartCard } from './ChartCard'

interface UsageTrendChartProps {
  data: Array<{
    date: string
    api_calls: number
    tokens: number
  }>
  className?: string
}

export function UsageTrendChart({ data, className }: UsageTrendChartProps) {
  return (
    <ChartCard
      title="Xu Hướng Sử Dụng"
      description="API calls và tokens theo thời gian"
      className={className}
    >
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
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
            <Line
              type="monotone"
              dataKey="api_calls"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2 }}
              name="API Calls"
            />
            <Line
              type="monotone"
              dataKey="tokens"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
              name="Tokens"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
