/**
 * Usage Gauge Grid - Grid layout of gauge cards
 */

import { UsageGaugeCard } from './UsageGaugeCard'
import { useUsageAnalytics } from '@/hooks/use-usage-analytics'
import { getQuotaSeverity } from '@/lib/usage-analytics'

interface UsageGaugeGridProps {
  userId: string
  licenseId?: string
  className?: string
}

export function UsageGaugeGrid({ userId, licenseId, className }: UsageGaugeGridProps) {
  const { usageStatus, loading, error } = useUsageAnalytics({
    userId,
    licenseId,
    enabled: true,
  })

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 rounded-xl bg-gray-800/30 animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
        <p>Không thể tải dữ liệu sử dụng: {error}</p>
      </div>
    )
  }

  if (!usageStatus) {
    return (
      <div className="p-8 text-center text-gray-400">
        <p>Không có dữ liệu sử dụng</p>
      </div>
    )
  }

  const gauges = [
    {
      metric: 'API Calls',
      label: 'API Calls',
      used: usageStatus.api_calls?.used || 0,
      limit: usageStatus.api_calls?.limit || 100,
      percentage: usageStatus.api_calls?.percentage || 0,
    },
    {
      metric: 'Tokens',
      label: 'AI Tokens',
      used: usageStatus.tokens?.used || 0,
      limit: usageStatus.tokens?.limit || 10000,
      percentage: usageStatus.tokens?.percentage || 0,
    },
    {
      metric: 'Inferences',
      label: 'Model Inferences',
      used: usageStatus.model_inferences?.used || 0,
      limit: usageStatus.model_inferences?.limit || 100,
      percentage: usageStatus.model_inferences?.percentage || 0,
    },
    {
      metric: 'Agents',
      label: 'Agent Executions',
      used: usageStatus.agent_executions?.used || 0,
      limit: usageStatus.agent_executions?.limit || 50,
      percentage: usageStatus.agent_executions?.percentage || 0,
    },
  ]

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {gauges.map((gauge) => (
          <UsageGaugeCard
            key={gauge.label}
            metric={gauge.metric}
            label={gauge.label}
            used={gauge.used}
            limit={gauge.limit}
            percentage={gauge.percentage}
            severity={getQuotaSeverity(gauge.percentage)}
          />
        ))}
      </div>
    </div>
  )
}

export default UsageGaugeGrid
