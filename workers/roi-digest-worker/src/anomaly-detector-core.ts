/**
 * Anomaly Detector Core - Phase 6
 *
 * Statistical anomaly detection using Z-score and IQR methods.
 * Split from anomaly-detector.ts for file size compliance (<200 lines).
 */

export interface AnomalyResult {
  isAnomaly: boolean
  metricType: string
  orgId: string
  currentValue: number
  expectedValue: number
  deviation: number
  zScore?: number
  iqrLower?: number
  iqrUpper?: number
  severity: 'info' | 'warning' | 'critical'
  window: '1h' | '24h' | '7d'
  timestamp: string
  alertPayload: AlertPayload
}

export interface AlertPayload {
  project_id: string
  metric_type: string
  deviation_severity: 'info' | 'warning' | 'critical'
  timestamp: string
  raw_value: number
  expected_value: number
  z_score?: number
  description: string
}

export interface RollingStats {
  mean: number
  stddev: number
  q1: number
  q3: number
  iqr: number
  min: number
  max: number
  count: number
}

export class AnomalyDetectorCore {
  private static readonly ZSCORE_INFO = 2.0
  private static readonly ZSCORE_WARNING = 2.5
  private static readonly ZSCORE_CRITICAL = 3.0
  private static readonly IQR_MULTIPLIER = 1.5

  constructor(
    private kvStore: KVNamespace,
    private supabaseUrl: string,
    private supabaseKey: string
  ) {}

  async detectAnomalies(
    orgId: string,
    metricType: string = 'api_calls',
    window: '1h' | '24h' | '7d' = '1h'
  ): Promise<AnomalyResult | null> {
    const currentValue = await this.getCurrentUsage(orgId, metricType)
    if (currentValue === null) return null

    const historicalData = await this.getHistoricalUsage(orgId, metricType, window)
    if (historicalData.length < 10) return null

    const stats = this.calculateRollingStats(historicalData)
    const zScore = this.calculateZScore(currentValue, stats.mean, stats.stddev)
    const { iqrLower, iqrUpper } = this.calculateIQRBounds(stats.q1, stats.q3)

    const isZScoreAnomaly = Math.abs(zScore) > AnomalyDetectorCore.ZSCORE_INFO
    const isIQROutlier = currentValue < iqrLower || currentValue > iqrUpper

    if (!isZScoreAnomaly && !isIQROutlier) return null

    const severity = this.calculateSeverity(zScore, isIQROutlier)
    const result: AnomalyResult = {
      isAnomaly: true,
      metricType,
      orgId,
      currentValue,
      expectedValue: stats.mean,
      deviation: currentValue - stats.mean,
      zScore,
      iqrLower,
      iqrUpper,
      severity,
      window,
      timestamp: new Date().toISOString(),
      alertPayload: {
        project_id: orgId,
        metric_type: metricType,
        deviation_severity: severity,
        timestamp: new Date().toISOString(),
        raw_value: currentValue,
        expected_value: Math.round(stats.mean),
        z_score: zScore,
        description: this.generateDescription(metricType, currentValue, stats.mean, zScore, severity),
      },
    }

    await this.kvStore.put(`anomaly:${orgId}:${metricType}:${window}`, JSON.stringify(result), { expirationTtl: 300 })
    return result
  }

  private async getCurrentUsage(orgId: string, metricType: string): Promise<number | null> {
    const cached = await this.kvStore.get<number>(`usage:${orgId}:${metricType}`)
    if (cached !== null) return cached

    const hourAgo = new Date(Date.now() - 3600 * 1000).toISOString()
    const url = `${this.supabaseUrl}/rest/v1/usage_metrics?select=usage_value&org_id=eq.${orgId}&metric_type=eq.${metricType}&recorded_at=gte.${hourAgo}`

    const response = await fetch(url, {
      headers: { 'apikey': this.supabaseKey, 'Authorization': `Bearer ${this.supabaseKey}`, 'Prefer': 'sum(usage_value)' },
    })

    if (response.ok) {
      const data = await response.json() as number
      return data || 0
    }
    return null
  }

  private async getHistoricalUsage(orgId: string, metricType: string, window: '1h' | '24h' | '7d'): Promise<number[]> {
    const cached = await this.kvStore.get<number[]>(`history:${orgId}:${metricType}:${window}`)
    if (cached !== null) return cached

    const now = new Date()
    const startTime = new Date(now.getTime() - (window === '1h' ? 3600 : window === '24h' ? 86400 : 604800) * 1000).toISOString()
    const url = `${this.supabaseUrl}/rest/v1/usage_metrics?select=usage_value&org_id=eq.${orgId}&metric_type=eq.${metricType}&recorded_at=gte.${startTime}&recorded_at=lt.${now.toISOString()}`

    const response = await fetch(url, { headers: { 'apikey': this.supabaseKey, 'Authorization': `Bearer ${this.supabaseKey}` } })
    if (response.ok) {
      const data = await response.json() as any[]
      const values = data.map(row => row.usage_value || 0)
      await this.kvStore.put(`history:${orgId}:${metricType}:${window}`, JSON.stringify(values), { expirationTtl: 300 })
      return values
    }
    return []
  }

  private calculateRollingStats(data: number[]): RollingStats {
    const n = data.length
    if (n === 0) return { mean: 0, stddev: 0, q1: 0, q3: 0, iqr: 0, min: 0, max: 0, count: 0 }

    const mean = data.reduce((a, b) => a + b, 0) / n
    const stddev = Math.sqrt(data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n)
    const sorted = [...data].sort((a, b) => a - b)

    return { mean, stddev, q1: sorted[Math.floor(n * 0.25)], q3: sorted[Math.floor(n * 0.75)], iqr: 0, min: sorted[0], max: sorted[n - 1], count: n }
  }

  private calculateZScore(value: number, mean: number, stddev: number): number {
    return stddev === 0 ? 0 : (value - mean) / stddev
  }

  private calculateIQRBounds(q1: number, q3: number): { iqrLower: number; iqrUpper: number } {
    const iqr = q3 - q1
    return { iqrLower: q1 - AnomalyDetectorCore.IQR_MULTIPLIER * iqr, iqrUpper: q3 + AnomalyDetectorCore.IQR_MULTIPLIER * iqr }
  }

  private calculateSeverity(zScore: number, isIQROutlier: boolean): 'info' | 'warning' | 'critical' {
    const absZ = Math.abs(zScore)
    if (absZ >= AnomalyDetectorCore.ZSCORE_CRITICAL || (isIQROutlier && absZ >= 3)) return 'critical'
    if (absZ >= AnomalyDetectorCore.ZSCORE_WARNING || isIQROutlier) return 'warning'
    return 'info'
  }

  private generateDescription(metricType: string, current: number, expected: number, zScore: number, severity: string): string {
    const direction = current > expected ? 'spike' : 'drop'
    const percentage = Math.round(Math.abs((current - expected) / expected) * 100)
    const metricNames: Record<string, string> = { api_calls: 'API calls', ai_calls: 'AI inferences', tokens: 'Token usage', compute_minutes: 'Compute minutes', storage_gb: 'Storage (GB)', emails: 'Emails sent', model_inferences: 'Model inferences', agent_executions: 'Agent executions' }
    return `${severity.toUpperCase()}: ${metricNames[metricType] || metricType} ${direction} of ${percentage}% detected (${Math.round(zScore)}σ from normal)`
  }

  async detectAllMetrics(orgId: string, metrics: string[] = ['api_calls', 'ai_calls', 'tokens'], window: '1h' | '24h' | '7d' = '1h'): Promise<AnomalyResult[]> {
    const results: AnomalyResult[] = []
    for (const metric of metrics) {
      const result = await this.detectAnomalies(orgId, metric, window)
      if (result) results.push(result)
    }
    return results
  }
}
