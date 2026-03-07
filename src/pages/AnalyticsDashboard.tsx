/**
 * Analytics Dashboard Page - ROIaaS Phase 5
 * Dual-stream: Engineering ROI + Operational ROI
 */

import { useState } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import { RevenueDashboard } from '@/components/analytics/RevenueMetricsCards'
import { UserMetricsDashboard } from '@/components/analytics/UserMetricsDashboard'
import { ROICalculator } from '@/components/analytics/ROICalculator'
import { TopConsumersTable } from '@/components/analytics/TopConsumersTable'
import { UsageGaugeGrid } from '@/components/analytics/UsageGaugeGrid'
import { Download, RefreshCw, BarChart3, Cpu } from 'lucide-react'

// Mock data for demonstration (replace with real hooks in production)
const MOCK_REVENUE_DATA = {
  currentSnapshot: {
    id: '1',
    snapshot_date: '2026-03-07',
    gmv: {
      total: 150000000,
      subscription: 120000000,
      usage_based: 30000000,
    },
    mrr: {
      total: 150000000,
      new: 20000000,
      expansion: 10000000,
      contraction: 5000000,
      churn: 3000000,
    },
    arr: {
      total: 1800000000,
    },
    customers: {
      total: 250,
      new: 25,
      churned: 5,
    },
    tier_breakdown: {
      free: 100,
      basic: 80,
      premium: 50,
      enterprise: 15,
      master: 5,
    },
  },
  previousSnapshot: null,
  trend: {
    gmv: 15.5,
    mrr: 12.3,
    arr: 18.7,
    customers: 8.5,
  },
}

const MOCK_USER_METRICS = {
  dau: 1250,
  mau: 4500,
  dau_mau_ratio: 0.28,
  conversion_rate: 10.5,
  churn_rate: 2.1,
  retention_rate: 72.5,
}

const MOCK_TOP_CONSUMERS = [
  {
    license_id: 'lic_123',
    user_id: 'user_456',
    feature: 'api_call',
    total_usage: 50000,
    total_events: 1200,
    last_activity: '2026-03-07T10:30:00Z',
    avg_daily_usage: 1800,
  },
  {
    license_id: 'lic_124',
    user_id: 'user_789',
    feature: 'agent_execution',
    total_usage: 35000,
    total_events: 850,
    last_activity: '2026-03-07T09:15:00Z',
    avg_daily_usage: 1200,
  },
  {
    license_id: 'lic_125',
    user_id: 'user_012',
    feature: 'model_inference',
    total_usage: 28000,
    total_events: 650,
    last_activity: '2026-03-07T11:00:00Z',
    avg_daily_usage: 950,
  },
]

export function AnalyticsDashboardPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'operational' | 'engineering'>('operational')
  const [refreshing, setRefreshing] = useState(false)

  // Real hooks (uncomment in production)
  // const { data: revenueData, loading, refresh } = useRevenue({ autoRefresh: true })
  // const { data: userMetrics, loading: userLoading } = useUserMetrics()

  const handleRefresh = async () => {
    setRefreshing(true)
    // await refresh()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleExport = (format: 'pdf' | 'csv') => {
    console.warn(`Exporting analytics as ${format}...`)
    // Implement export logic
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {t('analytics.dashboard.title')}
            </h1>
            <p className="text-gray-400">
              {activeTab === 'operational'
                ? 'Operational ROI - Doanh thu & Người dùng'
                : 'Engineering ROI - Usage & ROI per License'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab Switcher */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
              <button
                onClick={() => setActiveTab('operational')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  activeTab === 'operational'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  {t('analytics.dashboard.operational_roi')}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('engineering')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  activeTab === 'engineering'
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  {t('analytics.dashboard.engineering_roi')}
                </div>
              </button>
            </div>

            {/* Actions */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all disabled:opacity-50"
            >
              <RefreshCw className={cn('w-5 h-5', refreshing && 'animate-spin')} />
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto space-y-6">
        {activeTab === 'operational' ? (
          <>
            {/* Revenue Dashboard */}
            <RevenueDashboard data={MOCK_REVENUE_DATA} />

            {/* User Metrics */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">{t('analytics.metrics.dau')}</h2>
              <UserMetricsDashboard metrics={MOCK_USER_METRICS} />
            </div>

            {/* Usage Gauges */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Usage Quotas</h2>
              <UsageGaugeGrid userId="demo-user" />
            </div>

            {/* Top Consumers */}
            <TopConsumersTable data={MOCK_TOP_CONSUMERS} />
          </>
        ) : (
          <>
            {/* Engineering ROI */}
            <ROICalculator
              revenue={MOCK_REVENUE_DATA.currentSnapshot.gmv.total}
              usage={{
                api_calls: 100000,
                tokens: 500000,
                compute_ms: 1000000,
                agent_executions: 5000,
              }}
            />

            {/* Per-Key Analytics */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Analytics Theo License Key</h2>
              {/* Add per-key analytics table here */}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/10">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{t('analytics.dashboard.last_updated')}: {new Date().toLocaleString('vi-VN')}</span>
          <span>ROIaaS Phase 5 - Analytics Dashboard</span>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsDashboardPage
