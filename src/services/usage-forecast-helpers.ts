/**
 * Usage Forecast Service - Helper Functions
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { DailyUsage, LinearRegressionResult, UsageForecast } from './usage-forecast-types'
import { METRIC_TO_FEATURE, DEFAULT_RATES } from './usage-forecast-types'

export async function getHistoricalUsage(
  supabase: SupabaseClient,
  orgId: string,
  metricType: string,
  days: number
): Promise<DailyUsage[]> {
  const feature = METRIC_TO_FEATURE[metricType] || metricType
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('usage_records')
    .select('feature, quantity, recorded_at')
    .eq('org_id', orgId)
    .eq('feature', feature)
    .gte('recorded_at', startDate.toISOString())
    .order('recorded_at', { ascending: true })

  if (error) throw error
  if (!data || data.length === 0) return []
  return aggregateByDay(data)
}

export function aggregateByDay(
  records: Array<{ feature: string; quantity: number; recorded_at: string }>
): DailyUsage[] {
  const byDay = new Map<string, number>()
  records.forEach((record) => {
    const date = record.recorded_at.slice(0, 10)
    const current = byDay.get(date) || 0
    byDay.set(date, current + record.quantity)
  })
  return Array.from(byDay.entries()).map(([date, value]) => ({ date, value }))
}

export function calculateDailyRunRate(dailyData: DailyUsage[]): number {
  if (dailyData.length === 0) return 0
  const totalValue = dailyData.reduce((sum, d) => sum + d.value, 0)
  return totalValue / dailyData.length
}

export function calculateLinearRegression(data: DailyUsage[]): LinearRegressionResult {
  const n = data.length
  if (n < 2) return { slope: 0, intercept: 0, rSquared: 0 }

  const xValues = data.map((_, i) => i)
  const yValues = data.map(d => d.value)
  const xMean = (n - 1) / 2
  const yMean = yValues.reduce((sum, y) => sum + y, 0) / n

  let numerator = 0, denominator = 0
  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (yValues[i] - yMean)
    denominator += Math.pow(xValues[i] - xMean, 2)
  }

  const slope = denominator !== 0 ? numerator / denominator : 0
  const intercept = yMean - slope * xMean

  let ssTot = 0, ssRes = 0
  for (let i = 0; i < n; i++) {
    const predicted = slope * xValues[i] + intercept
    ssTot += Math.pow(yValues[i] - yMean, 2)
    ssRes += Math.pow(yValues[i] - predicted, 2)
  }

  const rSquared = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0
  return { slope, intercept, rSquared: Math.max(0, Math.min(1, rSquared)) }
}

export function projectEndOfPeriod(
  data: DailyUsage[],
  regression: LinearRegressionResult,
  daysRemaining: number
): number {
  if (data.length === 0) return 0
  const lastIndex = data.length - 1
  const lastValue = data[lastIndex].value

  if (data.length >= 7 && regression.rSquared > 0.5) {
    const projectedIndex = lastIndex + daysRemaining
    const regressionPrediction = regression.slope * projectedIndex + regression.intercept
    const weight = Math.min(daysRemaining / 30, 0.5)
    return lastValue + (regressionPrediction - lastValue) * weight
  }
  return lastValue + (regression.slope * daysRemaining)
}

export function calculateTrend(regression: LinearRegressionResult): 'up' | 'down' | 'stable' {
  const { slope, rSquared } = regression
  if (rSquared < 0.3) return 'stable'
  const dailyChangePercent = (slope / 1000) * 100
  if (dailyChangePercent > 2) return 'up'
  if (dailyChangePercent < -2) return 'down'
  return 'stable'
}

export function calculateConfidence(
  data: DailyUsage[],
  regression: LinearRegressionResult
): number {
  if (data.length < 3) return 0.3
  let confidence = regression.rSquared
  confidence += Math.min((data.length - 3) / 27, 0.2)

  const values = data.map(d => d.value)
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)
  const cv = mean > 0 ? stdDev / mean : 1

  if (cv > 0.5) confidence *= 0.8
  if (cv > 1.0) confidence *= 0.7
  return Math.max(0.1, Math.min(0.95, confidence))
}

export async function getQuotaLimit(
  supabase: SupabaseClient,
  orgId: string,
  metricType: string
): Promise<number> {
  const { data } = await supabase
    .from('billing_state')
    .select('quota_limit')
    .eq('org_id', orgId)
    .eq('metric_type', metricType)
    .single()
  return data?.quota_limit || 0
}

export async function getRatePerUnit(
  supabase: SupabaseClient,
  orgId: string,
  metricType: string
): Promise<number> {
  const tier = await getOrgTier(supabase, orgId)
  const { data } = await supabase
    .from('overage_rates')
    .select('*')
    .eq('metric_type', metricType)
    .single()
  if (!data) return getDefaultRate(metricType, tier)
  return parseFloat((data as any)[`${tier}_rate`] || '0')
}

export async function getOrgTier(supabase: SupabaseClient, orgId: string): Promise<string> {
  const { data } = await supabase
    .from('user_subscriptions')
    .select('plan_slug')
    .eq('org_id', orgId)
    .eq('status', 'active')
    .single()
  return data?.plan_slug || 'basic'
}

export function getDefaultRate(metricType: string, tier: string): number {
  const metricRates = DEFAULT_RATES[metricType]
  if (!metricRates) return 0
  return metricRates[tier] || metricRates.basic
}

export function getCurrentPeriod(): string {
  return new Date().toISOString().slice(0, 7)
}

export function getPeriodEndDate(period: string): string {
  const [year, month] = period.split('-').map(Number)
  return new Date(year, month, 0).toISOString().slice(0, 10)
}

export function getDaysRemainingInPeriod(period: string): number {
  const now = new Date()
  const [year, month] = period.split('-').map(Number)
  const lastDay = new Date(year, month, 0)
  const today = new Date(year, month - 1, now.getDate())
  const diffDays = Math.ceil((lastDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

export function getEmptyForecast(metricType: string, period: string): UsageForecast {
  return {
    metricType, currentUsage: 0, projectedEndOfMonth: 0, quotaLimit: 0,
    projectedOverageUnits: 0, projectedOverageCost: 0, confidence: 0,
    trend: 'stable', dailyRunRate: 0,
    daysRemaining: getDaysRemainingInPeriod(period),
    periodEnd: getPeriodEndDate(period),
  }
}
