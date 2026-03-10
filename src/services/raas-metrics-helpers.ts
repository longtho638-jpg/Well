/**
 * RaaS Metrics Service - Mock Data Helpers
 *
 * Mock data factory functions for testing.
 */

import type { UsageMetrics, QuotaStatus, OverageSummary, MetricData } from '@/lib/raas-gateway-metrics'

export function createMockUsageMetrics(): UsageMetrics {
  return {
    orgId: 'org-mock-123',
    period: '2026-03',
    lastSyncedAt: new Date().toISOString(),
    metrics: [
      {
        metricType: 'api_calls',
        currentUsage: 8500,
        quotaLimit: 10000,
        percentageUsed: 85,
        isOverLimit: false,
        overageUnits: 0,
        overageCost: 0,
        trend: 'up',
        dailyData: generateDailyData(30, 10000),
      },
      {
        metricType: 'ai_calls',
        currentUsage: 9200,
        quotaLimit: 10000,
        percentageUsed: 92,
        isOverLimit: false,
        overageUnits: 0,
        overageCost: 0,
        trend: 'up',
        dailyData: generateDailyData(30, 10000),
      },
      {
        metricType: 'tokens',
        currentUsage: 125000,
        quotaLimit: 100000,
        percentageUsed: 125,
        isOverLimit: true,
        overageUnits: 25000,
        overageCost: 12.5,
        trend: 'stable',
        dailyData: generateDailyData(30, 100000),
      },
      {
        metricType: 'compute_minutes',
        currentUsage: 45,
        quotaLimit: 100,
        percentageUsed: 45,
        isOverLimit: false,
        overageUnits: 0,
        overageCost: 0,
        trend: 'down',
        dailyData: generateDailyData(30, 100),
      },
    ],
  }
}

export function createMockQuotaStatus(): QuotaStatus {
  return {
    orgId: 'org-mock-123',
    tier: 'pro',
    metrics: {
      api_calls: {
        current: 8500,
        quota: 10000,
        percentageUsed: 85,
        remaining: 1500,
        isOverLimit: false,
        overageUnits: 0,
        overageCost: 0,
      },
      ai_calls: {
        current: 9200,
        quota: 10000,
        percentageUsed: 92,
        remaining: 800,
        isOverLimit: false,
        overageUnits: 0,
        overageCost: 0,
      },
      tokens: {
        current: 125000,
        quota: 100000,
        percentageUsed: 125,
        remaining: 0,
        isOverLimit: true,
        overageUnits: 25000,
        overageCost: 12.5,
      },
      compute_minutes: {
        current: 45,
        quota: 100,
        percentageUsed: 45,
        remaining: 55,
        isOverLimit: false,
        overageUnits: 0,
        overageCost: 0,
      },
    },
    billingPeriodStart: '2026-03-01',
    billingPeriodEnd: '2026-03-31',
    daysRemaining: 22,
  }
}

export function createMockOverageSummary(): OverageSummary {
  return {
    orgId: 'org-mock-123',
    period: '2026-03',
    totalOverageCost: 12.5,
    transactions: [
      {
        metricType: 'tokens',
        units: 25000,
        cost: 12.5,
        rate: 0.0005,
        timestamp: new Date().toISOString(),
      },
    ],
    breakdown: {
      tokens: {
        units: 25000,
        cost: 12.5,
        rate: 0.0005,
      },
    },
  }
}

export function generateDailyData(days: number, quota: number): MetricData['dailyData'] {
  const data: MetricData['dailyData'] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dailyQuota = quota / days
    const randomFactor = 0.5 + Math.random()
    const value = Math.round(dailyQuota * randomFactor)
    data.push({ date: date.toISOString().split('T')[0], value, quota: dailyQuota })
  }

  return data
}
