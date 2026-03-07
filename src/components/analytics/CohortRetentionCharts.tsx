/**
 * Cohort Retention Charts - Premium Visualizations
 * ROIaaS Phase 5 - Polar Analytics Integration
 */

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, LineChart, Line } from 'recharts'
import type { CohortRetention } from '@/hooks/use-polar-analytics'
import { ChartCard } from './PremiumCharts'

interface CohortRetentionMatrixProps {
  data: CohortRetention[]
  className?: string
}

export function CohortRetentionMatrix({ data, className }: CohortRetentionMatrixProps) {
  const matrix = useMemo(() => {
    const cohorts = data.sort((a, b) => a.cohort_month.localeCompare(b.cohort_month))
    const periods = [0, 30, 60, 90]
    return {
      cohorts,
      periods,
      getValue: (cohortMonth: string, period: number) => {
        const cohort = data.find(c => c.cohort_month === cohortMonth)
        const periodData = cohort?.periods.find(p => p.day === period)
        return periodData?.retained_percentage || 0
      },
    }
  }, [data])

  const getRetentionColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-emerald-500'
    if (percentage >= 60) return 'bg-emerald-400'
    if (percentage >= 40) return 'bg-amber-500'
    if (percentage >= 20) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <ChartCard title="Phân Tích Giữ Chân Theo Nhóm" description="Tỷ lệ khách hàng ở lại theo thời gian" className={className}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Nhóm</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Quy Mô</th>
              {matrix.periods.map(period => (
                <th key={period} className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Ngày {period}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.cohorts.map((cohort) => (
              <tr key={cohort.cohort_month} className="border-t border-white/5">
                <td className="px-4 py-3 text-sm font-medium text-white">
                  {new Date(cohort.cohort_month).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short' })}
                </td>
                <td className="px-4 py-3 text-sm text-gray-400 text-center">{cohort.cohort_size}</td>
                {matrix.periods.map(period => {
                  const value = matrix.getValue(cohort.cohort_month, period)
                  return (
                    <td key={period} className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <div className={cn('w-16 h-8 rounded flex items-center justify-center text-xs font-medium text-white transition-all', getRetentionColor(value))} style={{ opacity: 0.3 + (value / 100) * 0.7 }}>
                          {value.toFixed(0)}%
                        </div>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center gap-4">
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-emerald-500" /><span className="text-xs text-gray-400">≥80%</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-amber-500" /><span className="text-xs text-gray-400">40-80%</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-500" /><span className="text-xs text-gray-400">&lt;40%</span></div>
      </div>
    </ChartCard>
  )
}

interface RetentionCurveChartProps {
  data: CohortRetention[]
  className?: string
}

export function RetentionCurveChart({ data, className }: RetentionCurveChartProps) {
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
    <ChartCard title="Đường Giữ Chân" description="So sánh tỷ lệ giữ chân giữa các nhóm" className={className}>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
            <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `D${v}`} />
            <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }} formatter={(value: any) => [`${value.toFixed(1)}%`, 'Retention']} />
            <Legend />
            {data.slice(0, 6).map((cohort, index) => {
              const cohortKey = new Date(cohort.cohort_month).toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' })
              return (
                <Line key={cohort.cohort_month} type="monotone" dataKey={cohortKey} stroke={colors[index % colors.length]} strokeWidth={2} dot={{ fill: colors[index % colors.length], strokeWidth: 2 }} name={cohortKey} />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}

interface MonthlyActiveLicensesProps {
  data: Array<{ month: string; active: number; new: number; churned: number }>
  className?: string
}

export function MonthlyActiveLicenses({ data, className }: MonthlyActiveLicensesProps) {
  return (
    <ChartCard title="Giấy Phép Hoạt Động Hàng Tháng" description="Số lượng giấy phép hoạt động theo tháng" className={className}>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
            <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }} />
            <Legend />
            <Bar dataKey="active" fill="#10b981" name="Hoạt Động" />
            <Bar dataKey="new" fill="#3b82f6" name="Mới" />
            <Bar dataKey="churned" fill="#ef4444" name="Hủy" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}

interface RevenueAttributionProps {
  data: Array<{ date: string; subscription: number; usage: number }>
  className?: string
}

export function RevenueAttribution({ data, className }: RevenueAttributionProps) {
  return (
    <ChartCard title="Phân Bổ Doanh Thu" description="Doanh thu theo nguồn (Subscription vs Usage)" className={className}>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="subscriptionGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
              <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
            <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }} />
            <Legend />
            <Area type="monotone" dataKey="subscription" stroke="#3b82f6" fillOpacity={1} fill="url(#subscriptionGradient)" name="Subscription" />
            <Area type="monotone" dataKey="usage" stroke="#8b5cf6" fillOpacity={1} fill="url(#usageGradient)" name="Usage-Based" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
