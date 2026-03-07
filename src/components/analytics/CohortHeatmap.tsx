/**
 * Cohort Retention Heatmap
 * Aura Elite Design System
 */

import { cn } from '@/lib/utils'
import { ChartCard } from './ChartCard'

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
