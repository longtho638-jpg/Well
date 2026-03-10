/**
 * RaaS Metrics Service - Mockable service layer for RaaS Gateway metrics
 */

import { analyticsLogger } from '@/utils/logger'
import type { RaaSGatewayMetricsClient, UsageMetrics, QuotaStatus, OverageSummary } from '@/lib/raas-gateway-metrics'
import type { IRaaSMetricsService, RaaSMetricsServiceConfig } from './raas-metrics-types'
import { createMockUsageMetrics, createMockQuotaStatus, createMockOverageSummary } from './raas-metrics-helpers'

export class RaaSMetricsServiceImpl implements IRaaSMetricsService {
  private client: RaaSGatewayMetricsClient
  private useFallback: boolean
  private lastKnownMetrics: Map<string, UsageMetrics> = new Map()

  constructor(_config: RaaSMetricsServiceConfig, gatewayClient: RaaSGatewayMetricsClient) {
    this.client = gatewayClient
    this.useFallback = _config.useFallback ?? true
  }

  async getMetrics(orgId: string, period?: string): Promise<UsageMetrics> {
    try {
      const metrics = await this.client.getUsageMetrics(orgId, period)
      this.lastKnownMetrics.set(orgId, metrics)
      return metrics
    } catch (error) {
      analyticsLogger.error('[RaaSMetricsService] Failed to fetch metrics', error)
      const cached = this.lastKnownMetrics.get(orgId)
      if (cached) {
        analyticsLogger.warn('[RaaSMetricsService] Using cached metrics')
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
      await this.client.getQuotaStatus('health-check')
      return true
    } catch {
      return false
    }
  }

  getCachedMetrics(orgId: string): UsageMetrics | undefined {
    return this.lastKnownMetrics.get(orgId)
  }

  clearCache(): void {
    this.lastKnownMetrics.clear()
  }
}

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

  async getMetrics(_orgId: string, _period?: string): Promise<UsageMetrics> {
    if (this.shouldFail) throw new Error('Mock service error')
    return this.mockMetrics
  }

  async getQuotaStatus(_orgId: string): Promise<QuotaStatus> {
    if (this.shouldFail) throw new Error('Mock service error')
    return this.mockQuotaStatus
  }

  async getOverageSummary(_orgId: string, _period?: string): Promise<OverageSummary> {
    if (this.shouldFail) throw new Error('Mock service error')
    return this.mockOverageSummary
  }

  async isAvailable(): Promise<boolean> {
    return !this.shouldFail
  }

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail
  }

  setMetrics(metrics: Partial<UsageMetrics>): void {
    this.mockMetrics = { ...this.mockMetrics, ...metrics }
  }

  reset(): void {
    this.mockMetrics = createMockUsageMetrics()
    this.mockQuotaStatus = createMockQuotaStatus()
    this.mockOverageSummary = createMockOverageSummary()
    this.shouldFail = false
  }
}

export default RaaSMetricsServiceImpl
