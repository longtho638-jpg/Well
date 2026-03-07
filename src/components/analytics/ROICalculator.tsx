/**
 * ROI Calculator - Calculate and display ROI metrics
 * ROIaaS Phase 5 - Engineering ROI Dashboard
 */

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Calculator, TrendingUp, DollarSign, Percent } from 'lucide-react'
import { useROICalculator } from '@/hooks/use-revenue-analytics'
import type { CostConfig } from '@/types/revenue-analytics'
import { DEFAULT_COST_CONFIG } from '@/types/revenue-analytics'

interface ROICalculatorProps {
  revenue: number
  usage: {
    api_calls: number
    tokens: number
    compute_ms: number
    agent_executions: number
  }
  costConfig?: CostConfig
  className?: string
}

export function ROICalculator({
  revenue,
  usage,
  costConfig = DEFAULT_COST_CONFIG,
  className,
}: ROICalculatorProps) {
  const roi = useROICalculator(revenue, usage, costConfig)

  if (!roi) return null

  const isProfitable = roi.absolute >= 0

  return (
    <div className={cn(
      'relative p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm',
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-purple-500/10">
          <Calculator className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">ROI Calculator</h3>
          <p className="text-sm text-gray-400">Tính toán lợi nhuận trên chi phí</p>
        </div>
      </div>

      {/* Main ROI Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Absolute ROI */}
        <div className="p-4 rounded-xl bg-white/5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">ROI Tuyệt Đối</span>
          </div>
          <p className={cn(
            'text-2xl font-bold',
            isProfitable ? 'text-emerald-400' : 'text-red-400'
          )}>
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
              minimumFractionDigits: 0,
            }).format(roi.absolute)}
          </p>
        </div>

        {/* ROI Percentage */}
        <div className="p-4 rounded-xl bg-white/5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">ROI %</span>
          </div>
          <p className={cn(
            'text-2xl font-bold',
            isProfitable ? 'text-emerald-400' : 'text-red-400'
          )}>
            {roi.percentage.toFixed(1)}%
          </p>
        </div>

        {/* Margin */}
        <div className="p-4 rounded-xl bg-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Biên Lợi Nhuận</span>
          </div>
          <p className={cn(
            'text-2xl font-bold',
            isProfitable ? 'text-emerald-400' : 'text-red-400'
          )}>
            {roi.margin.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-400">Phân Tích Chi Phí</h4>
        {Object.entries(roi.breakdown).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-gray-300 capitalize">
              {key.replace(/_/g, ' ')}
            </span>
            <span className="text-sm font-medium text-white">
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                minimumFractionDigits: 0,
              }).format(value)}
            </span>
          </div>
        ))}
        <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Tổng Chi Phí</span>
          <span className="text-lg font-bold text-white">
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
              minimumFractionDigits: 0,
            }).format(roi.costs)}
          </span>
        </div>
      </div>

      {/* Revenue vs Cost Visualization */}
      <div className="mt-6 p-4 rounded-xl bg-white/5">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-400">Doanh Thu</span>
          <span className="text-sm font-medium text-emerald-400">
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
              minimumFractionDigits: 0,
            }).format(revenue)}
          </span>
        </div>
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
            style={{ width: '100%' }}
          />
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-400">Chi Phí</span>
          <span className="text-sm font-medium text-red-400">
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
              minimumFractionDigits: 0,
            }).format(roi.costs)}
          </span>
        </div>
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-500 to-orange-500"
            style={{
              width: `${revenue > 0 ? (roi.costs / revenue) * 100 : 0}%`
            }}
          />
        </div>
      </div>

      {/* Profitability Status */}
      <div className={cn(
        'mt-4 p-4 rounded-xl border text-center',
        isProfitable
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-red-500/10 border-red-500/30'
      )}>
        <p className={cn(
          'text-sm font-medium',
          isProfitable ? 'text-emerald-400' : 'text-red-400'
        )}>
          {isProfitable ? '✓ Có Lời' : '✗ Thua Lỗ'}
        </p>
      </div>
    </div>
  )
}

/**
 * Engineering ROI Dashboard - Per License Key Analytics
 */
interface EngineeringROIProps {
  licenseId?: string
  userId?: string
  className?: string
}

export function EngineeringROIDashboard({ licenseId, userId, className }: EngineeringROIProps) {
  const [revenue] = useState(50000) // Example: Premium tier
  const [usage, setUsage] = useState({
    api_calls: 10000,
    tokens: 500000,
    compute_ms: 300000,
    agent_executions: 50,
  })

  // Simulate usage updates (would come from real data in production)
  useMemo(() => {
    // In real app, this would fetch from API
  }, [licenseId, userId])

  return (
    <div className={cn('space-y-6', className)}>
      {/* Usage Input (for demo) */}
      <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
        <h3 className="text-lg font-semibold text-white mb-4">Usage Metrics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400">API Calls</label>
            <input
              type="number"
              value={usage.api_calls}
              onChange={(e) => setUsage({ ...usage, api_calls: parseInt(e.target.value) || 0 })}
              className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">Tokens</label>
            <input
              type="number"
              value={usage.tokens}
              onChange={(e) => setUsage({ ...usage, tokens: parseInt(e.target.value) || 0 })}
              className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">Compute (ms)</label>
            <input
              type="number"
              value={usage.compute_ms}
              onChange={(e) => setUsage({ ...usage, compute_ms: parseInt(e.target.value) || 0 })}
              className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">Agent Executions</label>
            <input
              type="number"
              value={usage.agent_executions}
              onChange={(e) => setUsage({ ...usage, agent_executions: parseInt(e.target.value) || 0 })}
              className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
        </div>
      </div>

      {/* ROI Calculator */}
      <ROICalculator revenue={revenue} usage={usage} />
    </div>
  )
}
