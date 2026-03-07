---
title: Phase 5 - ROI Calculator Engine
description: ROI calculation engine with cost calculator, margins, and LTV/CAC
status: pending
priority: P1
effort: 2h
blockedBy: ['phase-02-revenue-hooks']
---

# Phase 5: ROI Calculator Engine

## Overview

Build ROI calculation engine that computes ROI per license, cost breakdown, profit margins, LTV, and CAC.

## Requirements

### ROI Engine
- Revenue - Cost = Absolute ROI
- (Revenue - Cost) / Cost = ROI %
- (Revenue - Cost) / Revenue = Margin %

### Cost Calculator
- API call costs
- Token costs
- Compute time costs
- Agent execution costs

### Business Metrics
- LTV (Lifetime Value)
- CAC (Customer Acquisition Cost)
- Payback Period

## Implementation Steps

### 5.1 Create ROI Calculator

File: `src/lib/roi-calculator.ts`

```typescript
/**
 * ROI Calculator Engine - ROIaaS Phase 5
 * Calculate ROI, margins, LTV, CAC for RaaS business
 */

import type { ROICalculation, CostConfig } from '@/types/revenue-analytics'
import { DEFAULT_COST_CONFIG } from '@/types/revenue-analytics'

export interface ROIBreakdown {
  revenue: {
    subscription: number
    usage_based: number
    total: number
  }
  costs: {
    api_calls: number
    tokens: number
    compute: number
    agent_executions: number
    total: number
  }
  roi: {
    absolute: number
    percentage: number
    margin: number
  }
  metrics: {
    ltv: number           // Lifetime Value
    cac: number           // Customer Acquisition Cost
    payback_months: number
  }
}

export interface UsageData {
  api_calls: number
  tokens: number
  compute_minutes: number
  agent_executions: number
}

export class ROICalculator {
  private costConfig: CostConfig

  constructor(costConfig: CostConfig = DEFAULT_COST_CONFIG) {
    this.costConfig = costConfig
  }

  /**
   * Calculate full ROI breakdown for a license
   */
  calculate(
    revenue: { subscription: number; usage_based: number },
    usage: UsageData,
    customerSinceMonths: number
  ): ROIBreakdown {
    // Calculate costs
    const costs = this.calculateCosts(usage)

    // Calculate ROI
    const roiAbsolute = revenue.total - costs.total
    const roiPercentage = costs.total > 0
      ? ((revenue.total - costs.total) / costs.total) * 100
      : 0
    const marginPercentage = revenue.total > 0
      ? ((revenue.total - costs.total) / revenue.total) * 100
      : 0

    // Calculate LTV, CAC, Payback
    const ltv = this.calculateLTV(revenue.total, customerSinceMonths)
    const cac = this.calculateCAC()
    const paybackMonths = this.calculatePaybackPeriod(revenue.total, cac)

    return {
      revenue,
      costs,
      roi: {
        absolute: roiAbsolute,
        percentage: roiPercentage,
        margin: marginPercentage,
      },
      metrics: {
        ltv,
        cac,
        payback_months: paybackMonths,
      },
    }
  }

  /**
   * Calculate costs from usage
   */
  private calculateCosts(usage: UsageData) {
    return {
      api_calls: (usage.api_calls / 1000) * this.costConfig.cost_per_1k_api_calls,
      tokens: (usage.tokens / 1000) * this.costConfig.cost_per_1k_tokens,
      compute: usage.compute_minutes * this.costConfig.cost_per_minute_compute,
      agent_executions: usage.agent_executions * this.costConfig.cost_per_agent_execution,
      total:
        (usage.api_calls / 1000) * this.costConfig.cost_per_1k_api_calls +
        (usage.tokens / 1000) * this.costConfig.cost_per_1k_tokens +
        usage.compute_minutes * this.costConfig.cost_per_minute_compute +
        usage.agent_executions * this.costConfig.cost_per_agent_execution,
    }
  }

  /**
   * Calculate Lifetime Value
   * LTV = Average Monthly Revenue × Average Customer Lifespan (months)
   */
  private calculateLTV(monthlyRevenue: number, months: number): number {
    if (months <= 0) return 0
    const avgMonthly = monthlyRevenue / months
    // Assume average lifespan of 12 months for SaaS
    const avgLifespan = 12
    return avgMonthly * avgLifespan
  }

  /**
   * Calculate Customer Acquisition Cost
   * CAC = Total Sales & Marketing / New Customers Acquired
   * For simplicity, use fixed estimate
   */
  private calculateCAC(): number {
    // This would normally come from marketing spend data
    // Default: $100 per customer (adjust based on actual data)
    return 100
  }

  /**
   * Calculate Payback Period
   * Payback = CAC / Monthly Revenue
   */
  private calculatePaybackPeriod(monthlyRevenue: number, cac: number): number {
    if (monthlyRevenue <= 0) return Infinity
    return cac / monthlyRevenue
  }

  /**
   * Calculate ROI for entire org (aggregate all licenses)
   */
  calculateOrgROI(licenses: ROICalculation[]): ROIBreakdown {
    const totals = licenses.reduce(
      (acc, lic) => ({
        subscription: acc.subscription + lic.revenue.subscription,
        usage_based: acc.usage_based + lic.revenue.usage_based,
        total: acc.total + lic.revenue.total,
      }),
      { subscription: 0, usage_based: 0, total: 0 }
    )

    const usage = licenses.reduce(
      (acc, lic) => ({
        api_calls: acc.api_calls + lic.usage.api_calls,
        tokens: acc.tokens + lic.usage.tokens,
        compute_minutes: acc.compute_minutes + (lic.usage.compute_minutes || 0),
        agent_executions: acc.agent_executions + lic.usage.agent_executions,
      }),
      { api_calls: 0, tokens: 0, compute_minutes: 0, agent_executions: 0 }
    )

    const avgCustomerSince =
      licenses.reduce((acc, lic) => acc + this.getMonthsSince(lic.calculation_date), 0) /
      licenses.length

    return this.calculate(totals, usage, avgCustomerSince)
  }

  private getMonthsSince(date: string): number {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    return diffMs / (1000 * 60 * 60 * 24 * 30)
  }

  /**
   * Get cost breakdown for display
   */
  getCostBreakdown(usage: UsageData) {
    return {
      api_calls: {
        quantity: usage.api_calls.toLocaleString(),
        cost: (usage.api_calls / 1000) * this.costConfig.cost_per_1k_api_calls,
        unit: 'calls',
      },
      tokens: {
        quantity: (usage.tokens / 1000).toFixed(0) + 'K',
        cost: (usage.tokens / 1000) * this.costConfig.cost_per_1k_tokens,
        unit: 'tokens',
      },
      compute: {
        quantity: usage.compute_minutes.toFixed(0),
        cost: usage.compute_minutes * this.costConfig.cost_per_minute_compute,
        unit: 'min',
      },
      agents: {
        quantity: usage.agent_executions.toLocaleString(),
        cost: usage.agent_executions * this.costConfig.cost_per_agent_execution,
        unit: 'executions',
      },
    }
  }
}

/**
 * Format ROI for display
 */
export function formatROI(roi: number, type: 'percentage' | 'absolute'): string {
  if (type === 'percentage') {
    return `${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`
  }
  if (Math.abs(roi) >= 1000) {
    return `${roi >= 0 ? '+' : ''}$${(Math.abs(roi) / 1000).toFixed(1)}K`
  }
  return `${roi >= 0 ? '+' : ''}$${roi.toFixed(0)}`
}

/**
 * Get ROI health status
 */
export function getROIHealth(roiPercentage: number): 'excellent' | 'good' | 'warning' | 'danger' {
  if (roiPercentage >= 100) return 'excellent'
  if (roiPercentage >= 50) return 'good'
  if (roiPercentage >= 0) return 'warning'
  return 'danger'
}

/**
 * Get health color
 */
export function getHealthColor(health: string): string {
  const colors: Record<string, string> = {
    excellent: '#10b981',   // emerald-500
    good: '#3b82f6',        // blue-500
    warning: '#f59e0b',     // amber-500
    danger: '#ef4444',      // red-500
  }
  return colors[health] || colors.warning
}
```

### 5.2 Create ROI Dashboard Card

File: `src/components/analytics/ROICard.tsx`

```typescript
/**
 * ROI Card - displays ROI metrics with health status
 */

import { cn } from '@/lib/utils'
import { TrendingUp, DollarSign, Clock } from 'lucide-react'
import type { ROIBreakdown } from '@/lib/roi-calculator'
import { getROIHealth, getHealthColor, formatROI } from '@/lib/roi-calculator'

interface ROICardProps {
  roi: ROIBreakdown
  className?: string
}

export function ROICard({ roi, className }: ROICardProps) {
  const health = getROIHealth(roi.roi.percentage)
  const healthColor = getHealthColor(health)

  const formatCurrency = (val: number) => {
    if (Math.abs(val) >= 1000000) return `$${(val / 1000000).toFixed(1)}M`
    if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(1)}K`
    return `$${val.toFixed(0)}`
  }

  return (
    <div className={cn(
      'p-6 rounded-xl border border-white/10',
      'bg-gradient-to-br from-gray-800/50 to-gray-900/50',
      'backdrop-blur-sm',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            health === 'excellent' || health === 'good'
              ? 'bg-emerald-500/10'
              : 'bg-amber-500/10'
          )}>
            <TrendingUp className={cn('w-5 h-5', healthColor)} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-400">ROI Analytics</h3>
            <p className="text-xs text-gray-500 capitalize">{health}</p>
          </div>
        </div>
      </div>

      {/* Main ROI */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">
            {formatROI(roi.roi.percentage, 'percentage')}
          </span>
          <span className="text-sm text-gray-500">ROI</span>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          {formatROI(roi.roi.absolute, 'absolute')} profit
        </p>
      </div>

      {/* Revenue & Cost */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-xs text-emerald-400 mb-1">Revenue</p>
          <p className="text-lg font-semibold text-white">
            {formatCurrency(roi.revenue.total)}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-red-400 mb-1">Costs</p>
          <p className="text-lg font-semibold text-white">
            {formatCurrency(roi.costs.total)}
          </p>
        </div>
      </div>

      {/* LTV & CAC */}
      <div className="pt-4 border-t border-white/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">LTV</span>
          </div>
          <span className="text-sm font-medium text-white">
            {formatCurrency(roi.metrics.ltv)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Payback</span>
          </div>
          <span className="text-sm font-medium text-white">
            {roi.metrics.payback_months.toFixed(1)} months
          </span>
        </div>
      </div>
    </div>
  )
}
```

### 5.3 Create Cost Breakdown Table

File: `src/components/analytics/CostBreakdownTable.tsx`

```typescript
/**
 * Cost Breakdown Table - shows cost per usage type
 */

import { cn } from '@/lib/utils'
import type { ROIBreakdown } from '@/lib/roi-calculator'

interface CostBreakdownTableProps {
  roi: ROIBreakdown
  className?: string
}

export function CostBreakdownTable({ roi, className }: CostBreakdownTableProps) {
  const formatCost = (cost: number) => `$${cost.toFixed(4)}`

  const costItems = [
    { name: 'API Calls', cost: roi.costs.api_calls, percentage: roi.costs.total ? (roi.costs.api_calls / roi.costs.total) * 100 : 0 },
    { name: 'Tokens', cost: roi.costs.tokens, percentage: roi.costs.total ? (roi.costs.tokens / roi.costs.total) * 100 : 0 },
    { name: 'Compute', cost: roi.costs.compute, percentage: roi.costs.total ? (roi.costs.compute / roi.costs.total) * 100 : 0 },
    { name: 'Agents', cost: roi.costs.agent_executions, percentage: roi.costs.total ? (roi.costs.agent_executions / roi.costs.total) * 100 : 0 },
  ]

  return (
    <div className={cn(
      'p-6 rounded-xl border border-white/10',
      'bg-gradient-to-br from-gray-800/50 to-gray-900/50',
      'backdrop-blur-sm',
      className
    )}>
      <h3 className="text-lg font-semibold text-white mb-4">Cost Breakdown</h3>

      <div className="space-y-4">
        {costItems.map(item => (
          <div key={item.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-400">{item.name}</span>
              <span className="text-sm font-medium text-white">
                {formatCost(item.cost)}
              </span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-base font-medium text-white">Total Costs</span>
          <span className="text-xl font-bold text-white">
            {formatCost(roi.costs.total)}
          </span>
        </div>
      </div>
    </div>
  )
}
```

### 5.4 Create ROI Page

File: `src/pages/dashboard/ROIPage.tsx`

```typescript
/**
 * ROI Page - /dashboard/roi
 */

import { useROI } from '@/hooks/use-revenue-analytics'
import { ROICalculator } from '@/lib/roi-calculator'
import { ROICard } from '@/components/analytics/ROICard'
import { CostBreakdownTable } from '@/components/analytics/CostBreakdownTable'

export function ROIPage() {
  const { roi, calculate } = useROI()

  const calculator = new ROICalculator()

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">ROI Analytics</h1>
        <p className="text-gray-400 mt-1">
          Calculate return on investment and customer metrics
        </p>
      </div>

      {roi && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ROICard roi={calculator.calculate(roi.revenue, roi.usage, 6)} />
            <CostBreakdownTable roi={calculator.calculate(roi.revenue, roi.usage, 6)} />
          </div>
        </>
      )}
    </div>
  )
}
```

## Todo List

- [ ] Create `src/lib/roi-calculator.ts`
- [ ] Create `ROICard.tsx`
- [ ] Create `CostBreakdownTable.tsx`
- [ ] Create `ROIPage.tsx`
- [ ] Add route `/dashboard/roi`
- [ ] Test calculations with sample data

## Success Criteria

- [ ] ROI calculations accurate
- [ ] LTV/CAC formulas correct
- [ ] Health status displays properly
- [ ] All TypeScript compiles (0 errors)

## Dependencies

- **Blocked by:** Phase 2 (Revenue Hooks)
- **Blocks:** Phase 6 (Premium Visualizations)

---

_Effort: 2h | Priority: P1 | Status: Ready_
