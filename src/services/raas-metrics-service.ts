/**
 * RaaS Metrics Service
 *
 * Mockable service layer for RaaS Gateway metrics.
 * Provides interface-based abstraction for easy unit testing.
 *
 * Features:
 * - Interface-based design for mocking
 * - Real implementation delegates to RaaSGatewayMetricsClient
 * - Mock adapter for local dev and testing
 * - Fallback to local storage when Gateway unavailable
 *
 * Usage:
 *   const service = new RaaSMetricsServiceImpl(config)
 *   const metrics = await service.getMetrics(orgId)
 *
 *   // For testing:
 *   const mockService = new MockRaaSMetricsService()
 */

import type {
  RaaSGatewayMetricsClient,
  UsageMetrics,
  QuotaStatus,
  OverageSummary,
  MetricData,
} from '@/lib/raas-gateway-metrics'

export interface IRaaSMetricsService {
  getMetrics(orgId: string, period?: string): Promise<UsageMetrics>
  getQuotaStatus(orgId: string): Promise<QuotaStatus>
  getOverageSummary(orgId: string, period?: string): Promise<OverageSummary>
  isAvailable(): Promise<boolean>
}

export interface RaaSMetricsServiceConfig {
  apiKey: string
  licenseId: string
  baseUrl?: string
  useFallback?: boolean
}

export class RaaSMetricsServiceImpl implements IRaaSMetricsService {
  private client: RaaSGatewayMetricsClient
  private useFallback: boolean
  private lastKnownMetrics: Map<string, UsageMetrics> = new Map()

  constructor(config: RaaSMetricsServiceConfig, gatewayClient: RaaSGatewayMetricsClient) {
    this.client = gatewayClient
    this.useFallback = config.useFallback ?? true
  }

  async getMetrics(orgId: string, period?: string): Promise<UsageMetrics> {
    try {
      const metrics = await this.client.getUsageMetrics(orgId, period)
      this.lastKnownMetrics.set(orgId, metrics)
      return metrics
    } catch (error) {
      console.error('[RaaSMetricsService] Failed to fetch metrics', error)

      // Return cached metrics on failure
      const cached = this.lastKnownMetrics.get(orgId)
      if (cached) {
        console.warn('[RaaSMetricsService] Using cached metrics')
        return cached
      }

      throw error
    }
  }

  async getQuotaStatus(orgId: string): Promise<QuotaStatus> {
    return this.client.getQuotaStatus(orgId)
  }

  async getOverageSummary(orgId: string, period?: string): Promise<OverageSummary> {
    return this.client.getOverageSummary(orgId, period)
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Quick health check
      await this.client.getQuotaStatus('health-check')
      return true
    } catch {
      return false
    }
  }

  /**
   * Get cached metrics (for offline scenarios)
   */
  getCachedMetrics(orgId: string): UsageMetrics | undefined {
    return this.lastKnownMetrics.get(orgId)
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.lastKnownMetrics.clear()
  }
}

/**
 * Mock implementation for testing
 */
export class MockRaaSMetricsService implements IRaaSMetricsService {
  private mockMetrics: UsageMetrics
  private mockQuotaStatus: QuotaStatus
  private mockOverageSummary: OverageSummary
  private shouldFail = false

  constructor() {
    this.mockMetrics = createMockUsageMetrics()
    this.mockQuotaStatus = createMockQuotaStatus()
    this.mockOverageSummary = createMockOverageSummary()
  }

  async getMetrics(orgId: string, period?: string): Promise<UsageMetrics> {
    if (this.shouldFail) {
      throw new Error('Mock service error')
    }
    return this.mockMetrics
  }

  async getQuotaStatus(orgId: string): Promise<QuotaStatus> {
    if (this.shouldFail) {
      throw new Error('Mock service error')
    }
    return this.mockQuotaStatus
  }

  async getOverageSummary(orgId: string, period?: string): Promise<OverageSummary> {
    if (this.shouldFail) {
      throw new Error('Mock service error')
    }
    return this.mockOverageSummary
  }

  async isAvailable(): Promise<boolean> {
    return !this.shouldFail
  }

  /**
   * Configure mock to fail (for error testing)
   */
  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail
  }

  /**
   * Set custom metrics
   */
  setMetrics(metrics: Partial<UsageMetrics>): void {
    this.mockMetrics = { ...this.mockMetrics, ...metrics }
  }

  /**
   * Reset to defaults
   */
  reset(): void {
    this.mockMetrics = createMockUsageMetrics()
    this.mockQuotaStatus = createMockQuotaStatus()
    this.mockOverageSummary = createMockOverageSummary()
    this.shouldFail = false
  }
}

// ============================================================
// Mock Data Factories
// ============================================================

function createMockUsageMetrics(): UsageMetrics {
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

function createMockQuotaStatus(): QuotaStatus {
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

function createMockOverageSummary(): OverageSummary {
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

function generateDailyData(days: number, quota: number): MetricData['dailyData'] {
  const data: MetricData['dailyData'] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // Random usage between 50-150% of daily quota
    const dailyQuota = quota / days
    const randomFactor = 0.5 + Math.random()
    const value = Math.round(dailyQuota * randomFactor)

    data.push({
      date: date.toISOString().split('T')[0],
      value,
      quota: dailyQuota,
    })
  }

  return data
}
