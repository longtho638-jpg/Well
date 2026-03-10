/**
 * Usage Forecast Service - Phase 6
 *
 * Predictive usage analytics based on historical trends.
 * Uses linear regression for trend analysis and confidence intervals.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { analyticsLogger } from '@/utils/logger'
import type { UsageForecast, OverageMetricType, ForecastOptions } from './usage-forecast-types'
import {
  getHistoricalUsage,
  calculateDailyRunRate,
  calculateLinearRegression,
  projectEndOfPeriod,
  calculateTrend,
  calculateConfidence,
  getQuotaLimit,
  getRatePerUnit,
  getEmptyForecast,
  getCurrentPeriod,
  getDaysRemainingInPeriod,
  getPeriodEndDate,
} from './usage-forecast-helpers'

export class UsageForecastService {
  private supabase: SupabaseClient
  private orgId: string
  private readonly DEFAULT_HISTORY_DAYS = 30

  constructor(supabase: SupabaseClient, orgId: string) {
    this.supabase = supabase
    this.orgId = orgId
  }

  async getForecast(
    metricType: string,
    options?: ForecastOptions
  ): Promise<UsageForecast | null> {
    try {
      const historyDays = options?.historyDays || this.DEFAULT_HISTORY_DAYS
      const period = options?.period || getCurrentPeriod()

      const dailyData = await getHistoricalUsage(this.supabase, this.orgId, metricType, historyDays)

      if (dailyData.length === 0) {
        return getEmptyForecast(metricType, period)
      }

      const currentUsage = dailyData[dailyData.length - 1]?.value || 0
      const recentData = dailyData.slice(-7)
      const dailyRunRate = calculateDailyRunRate(recentData)

      const quotaLimit = await getQuotaLimit(this.supabase, this.orgId, metricType)
      const daysRemaining = getDaysRemainingInPeriod(period)

      const regression = calculateLinearRegression(dailyData)
      const projectedEndOfMonth = projectEndOfPeriod(dailyData, regression, daysRemaining)

      const projectedOverageUnits = Math.max(0, projectedEndOfMonth - quotaLimit)

      const ratePerUnit = await getRatePerUnit(this.supabase, this.orgId, metricType)
      const projectedOverageCost = projectedOverageUnits * ratePerUnit

      const trend = calculateTrend(regression)
      const confidence = calculateConfidence(dailyData, regression)

      return {
        metricType,
        currentUsage,
        projectedEndOfMonth: Math.round(projectedEndOfMonth),
        quotaLimit,
        projectedOverageUnits: Math.round(projectedOverageUnits),
        projectedOverageCost: Math.round(projectedOverageCost * 100) / 100,
        confidence: Math.round(confidence * 100) / 100,
        trend,
        dailyRunRate: Math.round(dailyRunRate),
        daysRemaining,
        periodEnd: getPeriodEndDate(period),
      }
    } catch (error) {
      analyticsLogger.error('[UsageForecastService] getForecast error', error)
      return null
    }
  }

  async getAllForecasts(options?: ForecastOptions): Promise<Record<string, UsageForecast>> {
    const metrics: OverageMetricType[] = [
      'api_calls', 'ai_calls', 'tokens', 'compute_minutes',
      'storage_gb', 'emails', 'model_inferences', 'agent_executions',
    ]

    const forecasts: Record<string, UsageForecast> = {}

    for (const metric of metrics) {
      const forecast = await this.getForecast(metric, options)
      if (forecast) forecasts[metric] = forecast
    }

    return forecasts
  }
}

export default UsageForecastService
