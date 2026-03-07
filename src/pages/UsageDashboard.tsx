/**
 * Usage Dashboard Page - Main analytics dashboard
 */

import { useState, useEffect } from 'react'
import { useUsageAnalytics } from '@/hooks/use-usage-analytics'
import { useStore } from '@/store'
import { UsageGaugeGrid } from '@/components/analytics/UsageGaugeGrid'
import { UsageTrendsChart } from '@/components/analytics/UsageTrendsChart'
import { TopConsumersTable } from '@/components/analytics/TopConsumersTable'
import { Helmet } from 'react-helmet-async'

export function UsageDashboardPage() {
  const { user } = useStore()
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week')
  const [trendsData, setTrendsData] = useState<any[]>([])
  const [topConsumers, setTopConsumers] = useState<any[]>([])
  const [loadingTrends, setLoadingTrends] = useState(true)

  const { getTrends, getTopConsumers } = useUsageAnalytics({
    userId: user?.id,
    enabled: !!user,
  })

  // Fetch trends
  useEffect(() => {
    if (!user || !getTrends) return

    const fetchTrends = async () => {
      try {
        setLoadingTrends(true)
        const days = period === 'day' ? 1 : period === 'week' ? 7 : 30
        const data = await getTrends({ granularity: period === 'day' ? 'hour' : 'day', days })
        setTrendsData(data)
      } catch (error) {
        console.error('Failed to fetch trends:', error)
      } finally {
        setLoadingTrends(false)
      }
    }

    fetchTrends()
  }, [user, period, getTrends])

  // Fetch top consumers (admin only)
  useEffect(() => {
    if (!getTopConsumers) return

    const fetchTopConsumers = async () => {
      try {
        const data = await getTopConsumers({ limit: 10, periodDays: 30 })
        setTopConsumers(data)
      } catch (error) {
        console.error('Failed to fetch top consumers:', error)
      }
    }

    fetchTopConsumers()
  }, [getTopConsumers])

  return (
    <>
      <Helmet>
        <title>Analytics Dashboard - Usage Metrics</title>
        <meta name="description" content="Real-time usage analytics and quota monitoring" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        {/* Header */}
        <div className="border-b border-white/10 bg-gray-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
                <p className="text-sm text-gray-400 mt-1">Theo dõi usage và quota theo thời gian thực</p>
              </div>

              {/* Period Selector */}
              <div className="flex gap-2">
                {(['day', 'week', 'month'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={cn(
                      'px-4 py-2 text-sm rounded-lg border transition-all',
                      period === p
                        ? 'border-white/30 text-white bg-white/10'
                        : 'border-white/10 text-gray-400 hover:text-white'
                    )}
                  >
                    {p === 'day' ? 'Ngày' : p === 'week' ? 'Tuần' : 'Tháng'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Usage Gauges */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Quota Utilization</h2>
            {user && <UsageGaugeGrid userId={user.id} />}
          </section>

          {/* Usage Trends */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Usage Trends</h2>
            {loadingTrends ? (
              <div className="h-72 rounded-xl bg-gray-800/30 animate-pulse" />
            ) : (
              <UsageTrendsChart data={trendsData} />
            )}
          </section>

          {/* Top Consumers (Admin) */}
          {topConsumers.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Top Consumers</h2>
              <TopConsumersTable data={topConsumers} />
            </section>
          )}
        </div>
      </div>
    </>
  )
}

// Simple cn utility if not available
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export default UsageDashboardPage
