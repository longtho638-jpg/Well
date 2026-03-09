/**
 * Usage Forecast Service - Phase 6
 *
 * Predictive usage analytics based on historical trends.
 * Uses linear regression for trend analysis and confidence intervals.
 *
 * Features:
 * - Linear regression trend analysis
 * - End-of-month usage projection
 * - Overage cost forecasting
 * - Confidence interval calculation
 * - Daily run-rate calculation
 *
 * Usage:
 *   const forecastService = new UsageForecastService(supabase, orgId);
 *
 *   const forecast = await forecastService.getForecast('tokens');
 *   console.log(`Projected end-of-month usage: ${forecast.projectedEndOfMonth}`);
 *   console.log(`Projected overage cost: $${forecast.projectedOverageCost}`);
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { analyticsLogger } from '@/utils/logger'
import type { OverageMetricType } from './overage-calculator'

export interface UsageForecast {
  metricType: string
  currentUsage: number
  projectedEndOfMonth: number
  quotaLimit: number
  projectedOverageUnits: number
  projectedOverageCost: number
  confidence: number // 0-1
  trend: 'up' | 'down' | 'stable'
  dailyRunRate: number
  daysRemaining: number
  periodEnd: string
}

export interface DailyUsage {
  date: string // YYYY-MM-DD
  value: number
}

export interface LinearRegressionResult {
  slope: number
  intercept: number
  rSquared: number // Coefficient of determination
}

export class UsageForecastService {
  private supabase: SupabaseClient
  private orgId: string
  private readonly DEFAULT_HISTORY_DAYS = 30

  constructor(supabase: SupabaseClient, orgId: string) {
    this.supabase = supabase
    this.orgId = orgId
  }

  /**
   * Get usage forecast for a metric type
   */
  async getForecast(
    metricType: string,
    options?: {
      historyDays?: number
      period?: string // YYYY-MM format
    }
  ): Promise<UsageForecast | null> {
    try {
      const historyDays = options?.historyDays || this.DEFAULT_HISTORY_DAYS
      const period = options?.period || this.getCurrentPeriod()

      // Get historical usage data
      const dailyData = await this.getHistoricalUsage(metricType, historyDays)

      if (dailyData.length === 0) {
        return this.getEmptyForecast(metricType, period)
      }

      // Get current usage (latest data point)
      const currentUsage = dailyData[dailyData.length - 1]?.value || 0

      // Calculate daily run rate (average of last 7 days or all available data)
      const recentData = dailyData.slice(-7)
      const dailyRunRate = this.calculateDailyRunRate(recentData)

      // Get quota limit
      const quotaLimit = await this.getQuotaLimit(metricType)

      // Calculate days remaining in period
      const daysRemaining = this.getDaysRemainingInPeriod(period)

      // Project end of month usage using linear regression
      const regression = this.calculateLinearRegression(dailyData)
      const projectedEndOfMonth = this.projectEndOfPeriod(dailyData, regression, daysRemaining)

      // Calculate projected overage
      const projectedOverageUnits = Math.max(0, projectedEndOfMonth - quotaLimit)

      // Get rate per unit for cost calculation
      const ratePerUnit = await this.getRatePerUnit(metricType)
      const projectedOverageCost = projectedOverageUnits * ratePerUnit

      // Calculate trend direction
      const trend = this.calculateTrend(regression)

      // Calculate confidence based on R-squared and data consistency
      const confidence = this.calculateConfidence(dailyData, regression)

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
        periodEnd: this.getPeriodEndDate(period),
      }
    } catch (error) {
      analyticsLogger.error('[UsageForecastService] getForecast error', error)
      return null
    }
  }

  /**
   * Get forecasts for all metric types
   */
  async getAllForecasts(options?: {
    historyDays?: number
    period?: string
  }): Promise<Record<string, UsageForecast>> {
    const metrics: OverageMetricType[] = [
      'api_calls',
      'ai_calls',
      'tokens',
      'compute_minutes',
      'storage_gb',
      'emails',
      'model_inferences',
      'agent_executions',
    ]

    const forecasts: Record<string, UsageForecast> = {}

    for (const metric of metrics) {
      const forecast = await this.getForecast(metric, options)
      if (forecast) {
        forecasts[metric] = forecast
      }
    }

    return forecasts
  }

  /**
   * Get historical usage data by day
   */
  private async getHistoricalUsage(
    metricType: string,
    days: number
  ): Promise<DailyUsage[]> {
    try {
      const feature = this.mapMetricToFeature(metricType)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await this.supabase
        .from('usage_records')
        .select('feature, quantity, recorded_at')
        .eq('org_id', this.orgId)
        .eq('feature', feature)
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: true })

      if (error) {
        throw error
      }

      if (!data || data.length === 0) {
        return []
      }

      // Aggregate by day
      return this.aggregateByDay(data)
    } catch (error) {
      analyticsLogger.error('[UsageForecastService] getHistoricalUsage error', error)
      return []
    }
  }

  /**
   * Aggregate usage records by day
   */
  private aggregateByDay(
    records: Array<{ feature: string; quantity: number; recorded_at: string }>
  ): DailyUsage[] {
    const byDay = new Map<string, number>()

    records.forEach((record) => {
      const date = record.recorded_at.slice(0, 10) // YYYY-MM-DD
      const current = byDay.get(date) || 0
      byDay.set(date, current + record.quantity)
    })

    return Array.from(byDay.entries()).map(([date, value]) => ({
      date,
      value,
    }))
  }

  /**
   * Calculate daily run rate from recent data
   */
  private calculateDailyRunRate(dailyData: DailyUsage[]): number {
    if (dailyData.length === 0) return 0

    const totalValue = dailyData.reduce((sum, d) => sum + d.value, 0)
    return totalValue / dailyData.length
  }

  /**
   * Calculate linear regression for trend analysis
   */
  private calculateLinearRegression(data: DailyUsage[]): LinearRegressionResult {
    const n = data.length

    if (n < 2) {
      return { slope: 0, intercept: 0, rSquared: 0 }
    }

    // Convert dates to numeric indices (0, 1, 2, ...)
    const xValues = data.map((_, i) => i)
    const yValues = data.map(d => d.value)

    // Calculate means
    const xMean = (n - 1) / 2
    const yMean = yValues.reduce((sum, y) => sum + y, 0) / n

    // Calculate slope and intercept
    let numerator = 0
    let denominator = 0

    for (let i = 0; i < n; i++) {
      numerator += (xValues[i] - xMean) * (yValues[i] - yMean)
      denominator += Math.pow(xValues[i] - xMean, 2)
    }

    const slope = denominator !== 0 ? numerator / denominator : 0
    const intercept = yMean - slope * xMean

    // Calculate R-squared (coefficient of determination)
    let ssTot = 0
    let ssRes = 0

    for (let i = 0; i < n; i++) {
      const predicted = slope * xValues[i] + intercept
      ssTot += Math.pow(yValues[i] - yMean, 2)
      ssRes += Math.pow(yValues[i] - predicted, 2)
    }

    const rSquared = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0

    return {
      slope,
      intercept,
      rSquared: Math.max(0, Math.min(1, rSquared)), // Clamp to [0, 1]
    }
  }

  /**
   * Project end of period usage
   */
  private projectEndOfPeriod(
    data: DailyUsage[],
    regression: LinearRegressionResult,
    daysRemaining: number
  ): number {
    if (data.length === 0) return 0

    const lastIndex = data.length - 1
    const lastValue = data[lastIndex].value

    // Use regression prediction if we have enough data and good fit
    if (data.length >= 7 && regression.rSquared > 0.5) {
      const projectedIndex = lastIndex + daysRemaining
      const regressionPrediction = regression.slope * projectedIndex + regression.intercept

      // Weight regression prediction with current value
      const weight = Math.min(daysRemaining / 30, 0.5) // Max 50% weight
      return lastValue + (regressionPrediction - lastValue) * weight
    }

    // Simple projection: current + (slope * daysRemaining)
    return lastValue + (regression.slope * daysRemaining)
  }

  /**
   * Calculate trend direction from regression
   */
  private calculateTrend(regression: LinearRegressionResult): 'up' | 'down' | 'stable' {
    const { slope, rSquared } = regression

    // If R-squared is too low, trend is unreliable
    if (rSquared < 0.3) {
      return 'stable'
    }

    // Calculate percentage change per day (assuming avg value of 1000 for scaling)
    const avgValue = 1000 // Normalize slope interpretation
    const dailyChangePercent = (slope / avgValue) * 100

    if (dailyChangePercent > 2) return 'up'
    if (dailyChangePercent < -2) return 'down'
    return 'stable'
  }

  /**
   * Calculate forecast confidence
   */
  private calculateConfidence(
    data: DailyUsage[],
    regression: LinearRegressionResult
  ): number {
    if (data.length < 3) return 0.3

    // Base confidence on R-squared
    let confidence = regression.rSquared

    // Boost confidence with more data points
    const dataBoost = Math.min((data.length - 3) / 27, 0.2) // Max +0.2 for 30 days
    confidence += dataBoost

    // Reduce confidence for high variance
    const values = data.map(d => d.value)
    const mean = values.reduce((s, v) => s + v, 0) / values.length
    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)
    const coefficientOfVariation = mean > 0 ? stdDev / mean : 1

    // Reduce confidence for high CV
    if (coefficientOfVariation > 0.5) {
      confidence *= 0.8
    }
    if (coefficientOfVariation > 1.0) {
      confidence *= 0.7
    }

    return Math.max(0.1, Math.min(0.95, confidence))
  }

  /**
   * Get quota limit for metric type
   */
  private async getQuotaLimit(metricType: string): Promise<number> {
    try {
      const { data } = await this.supabase
        .from('billing_state')
        .select('quota_limit')
        .eq('org_id', this.orgId)
        .eq('metric_type', metricType)
        .single()

      return data?.quota_limit || 0
    } catch {
      return 0
    }
  }

  /**
   * Get rate per unit for cost calculation
   */
  private async getRatePerUnit(metricType: string): Promise<number> {
    try {
      const tier = await this.getOrgTier()

      const { data } = await this.supabase
        .from('overage_rates')
        .select('*')
        .eq('metric_type', metricType)
        .single()

      if (!data) {
        return this.getDefaultRate(metricType, tier)
      }

      const rateField = `${tier}_rate`
      return parseFloat((data as any)[rateField] || '0')
    } catch {
      return this.getDefaultRate(metricType, 'basic')
    }
  }

  /**
   * Get default rate if database not available
   */
  private getDefaultRate(metricType: string, tier: string): number {
    const rates: Record<string, Record<string, number>> = {
      api_calls: { free: 0.001, basic: 0.0008, pro: 0.0005, enterprise: 0.0003, master: 0.0001 },
      tokens: { free: 0.000004, basic: 0.000003, pro: 0.000002, enterprise: 0.000001, master: 0.0000005 },
      compute_minutes: { free: 0.01, basic: 0.008, pro: 0.005, enterprise: 0.003, master: 0.001 },
    }

    const metricRates = rates[metricType]
    if (!metricRates) return 0

    return metricRates[tier] || metricRates.basic
  }

  /**
   * Get org tier from subscription
   */
  private async getOrgTier(): Promise<string> {
    try {
      const { data } = await this.supabase
        .from('user_subscriptions')
        .select('plan_slug')
        .eq('org_id', this.orgId)
        .eq('status', 'active')
        .single()

      return data?.plan_slug || 'basic'
    } catch {
      return 'basic'
    }
  }

  /**
   * Get current period (YYYY-MM format)
   */
  private getCurrentPeriod(): string {
    return new Date().toISOString().slice(0, 7)
  }

  /**
   * Get period end date
   */
  private getPeriodEndDate(period: string): string {
    const [year, month] = period.split('-').map(Number)
    const lastDay = new Date(year, month, 0) // Day 0 of next month = last day of current month
    return lastDay.toISOString().slice(0, 10)
  }

  /**
   * Get days remaining in period
   */
  private getDaysRemainingInPeriod(period: string): number {
    const now = new Date()
    const [year, month] = period.split('-').map(Number)
    const lastDay = new Date(year, month, 0)

    const today = new Date(year, month - 1, now.getDate())
    const diffTime = lastDay.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return Math.max(0, diffDays)
  }

  /**
   * Get empty forecast (no data available)
   */
  private getEmptyForecast(metricType: string, period: string): UsageForecast {
    return {
      metricType,
      currentUsage: 0,
      projectedEndOfMonth: 0,
      quotaLimit: 0,
      projectedOverageUnits: 0,
      projectedOverageCost: 0,
      confidence: 0,
      trend: 'stable',
      dailyRunRate: 0,
      daysRemaining: this.getDaysRemainingInPeriod(period),
      periodEnd: this.getPeriodEndDate(period),
    }
  }

  /**
   * Map metric type to usage_records feature name
   */
  private mapMetricToFeature(metricType: string): string {
    const mapping: Record<string, string> = {
      api_calls: 'api_call',
      tokens: 'tokens',
      compute_minutes: 'compute_ms',
      model_inferences: 'model_inference',
      agent_executions: 'agent_execution',
    }
    return mapping[metricType] || metricType
  }
}

export default UsageForecastService
