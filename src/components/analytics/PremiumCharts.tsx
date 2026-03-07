/**
 * Premium Charts - Aura Elite Design System
 * ROIaaS Phase 5 - Premium Data Visualizations
 */

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface ChartCardProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function ChartCard({ title, description, children, className }: ChartCardProps) {
  return (
    <div className={cn(
      'relative p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm',
      'hover:border-white/20 transition-all duration-300',
      className
    )}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
      </div>
      {children}

      {/* Glassmorphism glow */}
      <div className="absolute -inset-px rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r from-white/5 via-white/5 to-white/5 blur-sm" />
    </div>
  )
}

/**
 * Revenue Trend Chart - Area Chart with gradient
 */
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

/**
 * Usage Trend Chart - Line Chart
 */
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

/**
 * Tier Distribution - Pie Chart
 */
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

/**
 * Cohort Retention Heatmap
 */
interface CohortHeatmapProps {
  data: Array<{
    cohort: string
    period: number
    retention: number
  }>
  className?: string
}

export function CohortHeatmap({ data, className }: CohortHeatmapProps) {
  const maxPeriod = Math.max(...data.map(d => d.period))
  const cohorts = [...new Set(data.map(d => d.cohort))]

  return (
    <ChartCard
      title="Phân Tích Giữ Chân"
      description="Tỷ lệ giữ chân theo nhóm và thời kỳ"
      className={className}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs text-gray-400">Cohort</th>
              {Array.from({ length: maxPeriod + 1 }).map((_, i) => (
                <th key={i} className="px-4 py-2 text-center text-xs text-gray-400">
                  Tháng {i}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohorts.map((cohort) => (
              <tr key={cohort}>
                <td className="px-4 py-2 text-sm text-white font-medium">{cohort}</td>
                {Array.from({ length: maxPeriod + 1 }).map((_, i) => {
                  const point = data.find(d => d.cohort === cohort && d.period === i)
                  const retention = point?.retention || 0
                  return (
                    <td key={i} className="px-4 py-2">
                      <div
                        className={cn(
                          'h-8 rounded transition-all',
                          retention >= 80 && 'bg-emerald-500/80',
                          retention >= 50 && retention < 80 && 'bg-amber-500/80',
                          retention < 50 && 'bg-red-500/80',
                        )}
                        style={{ opacity: retention / 100 }}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  )
}

/**
 * Export functionality
 */
export async function exportToCSV(data: any[], filename: string) {
  if (!data || !data.length) return

  const headers = Object.keys(data[0])
  const csv = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => JSON.stringify(row[header])).join(',')
    ),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

export async function exportToPDF(elementId: string, filename: string) {
  // In production, use a library like html2pdf or @react-pdf/renderer
  console.log(`Exporting ${elementId} to PDF as ${filename}`)
  // Implementation would depend on chosen PDF library
}
