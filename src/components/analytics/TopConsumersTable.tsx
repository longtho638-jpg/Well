/**
 * Top Consumers Table - Leaderboard of top usage consumers
 */

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface TopConsumersTableProps {
  data: Array<{
    license_id: string
    user_id: string
    feature: string
    total_usage: number
    total_events: number
    last_activity: string
    avg_daily_usage: number
  }>
  className?: string
}

export function TopConsumersTable({ data, className }: TopConsumersTableProps) {
  const [sortBy, setSortBy] = useState<'total_usage' | 'total_events' | 'last_activity'>('total_usage')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const sortedData = [...data].sort((a, b) => {
    const aVal = a[sortBy]
    const bVal = b[sortBy]
    const order = sortOrder === 'asc' ? 1 : -1
    return aVal > bVal ? order : -order
  })

  const handleSort = (key: 'total_usage' | 'total_events' | 'last_activity') => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('desc')
    }
  }

  if (data.length === 0) {
    return (
      <div className={cn("p-8 rounded-xl border border-white/10 bg-gray-900/50", className)}>
        <p className="text-center text-gray-400">Không có dữ liệu người dùng</p>
      </div>
    )
  }

  return (
    <div className={cn("rounded-xl border border-white/10 bg-gray-900/50 overflow-hidden", className)}>
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white">Top người dùng</h3>
        <p className="text-sm text-gray-400 mt-1">Xếp hạng theo mức độ sử dụng</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                User ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Feature
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                onClick={() => handleSort('total_usage')}
              >
                Total Usage {sortBy === 'total_usage' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                onClick={() => handleSort('total_events')}
              >
                Events {sortBy === 'total_events' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                onClick={() => handleSort('last_activity')}
              >
                Last Activity {sortBy === 'last_activity' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedData.map((row, index) => (
              <tr key={`${row.user_id}-${row.feature}`} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                      index === 0 && 'bg-yellow-500/20 text-yellow-400',
                      index === 1 && 'bg-gray-400/20 text-gray-300',
                      index === 2 && 'bg-amber-600/20 text-amber-500',
                      index > 2 && 'bg-white/10 text-gray-400'
                    )}>
                      {index + 1}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-white font-mono">{row.user_id.slice(0, 12)}...</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                    {row.feature}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-sm text-white font-medium">
                    {row.total_usage.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-sm text-gray-400">
                    {row.total_events.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-sm text-gray-400">
                    {new Date(row.last_activity).toLocaleString('vi-VN')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TopConsumersTable
