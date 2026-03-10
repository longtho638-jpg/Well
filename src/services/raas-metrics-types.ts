/**
 * RaaS Metrics Service - Type Definitions
 *
 * Type definitions for RaaS metrics service.
 */

import type {
  UsageMetrics,
  QuotaStatus,
  OverageSummary,
} from '@/lib/raas-gateway-metrics'

// ============================================================
// Service Interfaces
// ============================================================

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

// ============================================================
// Mock Data Factory Functions
// ============================================================

export declare function createMockUsageMetrics(): UsageMetrics
export declare function createMockQuotaStatus(): QuotaStatus
export declare function createMockOverageSummary(): OverageSummary
export declare function generateDailyData(days: number, quota: number): any
