/**
 * Usage Anomaly Detection Service
 *
 * Detects anomalous usage patterns (spikes, drops, unusual behavior) and sends alerts.
 * Uses statistical analysis with rolling baselines for accurate detection.
 *
 * Features:
 * - Spike detection (>3x baseline)
 * - Drop detection (<0.3x baseline)
 * - License key mismatch detection
 * - JWT auth failure monitoring
 * - KV rate limit breach alerts
 * - Multi-channel notifications
 *
 * Usage:
 *   const anomalyDetector = new UsageAnomalyDetector(supabase)
 *
 *   // Check for anomalies
 *   const anomalies = await anomalyDetector.detectAnomalies({
 *     orgId,
 *     metricType: 'api_calls',
 *     windowHours: 24,
 *   })
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { analyticsLogger } from '@/utils/logger'

export type AnomalyType =
  | 'spike'
  | 'drop'
  | 'license_mismatch'
  | 'jwt_failure'
  | 'rate_limit_breach'
  | 'pattern_deviation'

export type AlertLevel = 'warning' | 'critical' | 'emergency'

export interface AnomalyConfig {
  orgId: string
  metricType?: string
  windowHours?: number  // Default: 24
  baselineDays?: number  // Default: 7
  spikeThreshold?: number  // Default: 3.0 (3x baseline)
  dropThreshold?: number  // Default: 0.3 (30% of baseline)
}

export interface AnomalyResult {
  detected: boolean
  anomalies: Anomaly[]
  checkedAt: string
}

export interface Anomaly {
  id?: string
  type: AnomalyType
  level: AlertLevel
  orgId: string
  metricType?: string
  currentValue: number
  baselineValue: number
  deviationPercent: number
  description: string
  metadata?: Record<string, unknown>
  detectedAt: string
}

export interface UsageDataPoint {
  timestamp: string
  value: number
  metricType: string
}

export class UsageAnomalyDetector {
  private supabase: SupabaseClient
  private readonly DEFAULT_SPIKE_THRESHOLD = 3.0
  private readonly DEFAULT_DROP_THRESHOLD = 0.3
  private readonly DEFAULT_BASELINE_DAYS = 7

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  /**
   * Detect anomalies for an org
   */
  async detectAnomalies(config: AnomalyConfig): Promise<AnomalyResult> {
    const {
      orgId,
      metricType,
      windowHours = 24,
      baselineDays = this.DEFAULT_BASELINE_DAYS,
      spikeThreshold = this.DEFAULT_SPIKE_THRESHOLD,
      dropThreshold = this.DEFAULT_DROP_THRESHOLD,
    } = config

    const anomalies: Anomaly[] = []

    try {
      analyticsLogger.info(`[AnomalyDetection] Starting for org=${orgId}`)

      // 1. Detect usage spikes and drops
      const usageAnomalies = await this.detectUsageAnomalies({
        orgId,
        metricType,
        windowHours,
        baselineDays,
        spikeThreshold,
        dropThreshold,
      })
      anomalies.push(...usageAnomalies)

      // 2. Detect license key mismatches
      const licenseAnomalies = await this.detectLicenseMismatches(orgId)
      anomalies.push(...licenseAnomalies)

      // 3. Detect JWT auth failures
      const jwtAnomalies = await this.detectJwtFailures(orgId)
      anomalies.push(...jwtAnomalies)

      // 4. Detect KV rate limit breaches
      const rateLimitAnomalies = await this.detectRateLimitBreaches(orgId)
      anomalies.push(...rateLimitAnomalies)

      // 5. Send alerts for detected anomalies
      for (const anomaly of anomalies) {
        await this.sendAnomalyAlert(anomaly)
      }

      // 6. Log anomalies to database
      await this.logAnomalies(anomalies)

      return {
        detected: anomalies.length > 0,
        anomalies,
        checkedAt: new Date().toISOString(),
      }
    } catch (error) {
      analyticsLogger.error(`[AnomalyDetection] Error for org=${orgId}:`, error)
      return {
        detected: false,
        anomalies: [],
        checkedAt: new Date().toISOString(),
      }
    }
  }

  /**
   * Detect usage spikes and drops
   */
  private async detectUsageAnomalies(params: {
    orgId: string
    metricType?: string
    windowHours: number
    baselineDays: number
    spikeThreshold: number
    dropThreshold: number
  }): Promise<Anomaly[]> {
    const { orgId, metricType, windowHours, baselineDays, spikeThreshold, dropThreshold } = params
    const anomalies: Anomaly[] = []

    try {
      // Calculate current period start
      const now = new Date()
      const currentStart = new Date(now.getTime() - windowHours * 60 * 60 * 1000)

      // Calculate baseline period start
      const baselineStart = new Date(now.getTime() - (baselineDays + 1) * 24 * 60 * 60 * 1000)
      const baselineEnd = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      // Build query
      let query = this.supabase
        .from('usage_records')
        .select('feature, quantity, recorded_at')
        .eq('org_id', orgId)

      if (metricType) {
        query = query.eq('feature', metricType)
      }

      const { data: currentData } = await query
        .gte('recorded_at', currentStart.toISOString())
        .lte('recorded_at', now.toISOString())

      const { data: baselineData } = await this.supabase
        .from('usage_records')
        .select('feature, quantity, recorded_at')
        .eq('org_id', orgId)
        .gte('recorded_at', baselineStart.toISOString())
        .lte('recorded_at', baselineEnd.toISOString())

      if (!currentData || !baselineData) {
        return anomalies
      }

      // Aggregate by metric type
      const currentTotals = this.aggregateByMetric(currentData)
      const baselineTotals = this.aggregateByMetric(baselineData)

      // Calculate daily averages for baseline
      const baselineDailyAvg = Object.entries(baselineTotals).reduce((acc, [metric, total]) => {
        acc[metric] = total / baselineDays
        return acc
      }, {} as Record<string, number>)

      // Detect anomalies
      for (const [metric, currentValue] of Object.entries(currentTotals)) {
        const baselineValue = baselineDailyAvg[metric] || 0

        if (baselineValue === 0) continue

        const ratio = currentValue / baselineValue

        // Spike detection
        if (ratio >= spikeThreshold) {
          const deviationPercent = ((currentValue - baselineValue) / baselineValue) * 100
          anomalies.push({
            type: 'spike',
            level: ratio >= spikeThreshold * 2 ? 'critical' : 'warning',
            orgId,
            metricType: metric,
            currentValue,
            baselineValue,
            deviationPercent,
            description: `Usage spike detected: ${metric} increased ${ratio.toFixed(1)}x from baseline`,
            detectedAt: new Date().toISOString(),
            metadata: { ratio, windowHours, baselineDays },
          })
        }

        // Drop detection
        if (ratio <= dropThreshold && ratio > 0) {
          const deviationPercent = ((baselineValue - currentValue) / baselineValue) * 100
          anomalies.push({
            type: 'drop',
            level: ratio <= dropThreshold / 2 ? 'critical' : 'warning',
            orgId,
            metricType: metric,
            currentValue,
            baselineValue,
            deviationPercent,
            description: `Usage drop detected: ${metric} decreased to ${(ratio * 100).toFixed(0)}% of baseline`,
            detectedAt: new Date().toISOString(),
            metadata: { ratio, windowHours, baselineDays },
          })
        }
      }
    } catch (error) {
      analyticsLogger.error(`[AnomalyDetection] Usage anomaly error:`, error)
    }

    return anomalies
  }

  /**
   * Detect license key mismatches
   */
  private async detectLicenseMismatches(orgId: string): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = []

    try {
      // Get active licenses for org
      const { data: licenses } = await this.supabase
        .from('license_keys')
        .select('key, status, expires_at, metadata')
        .eq('org_id', orgId)
        .in('status', ['active', 'expired', 'revoked'])

      if (!licenses) return anomalies

      // Check for expired or revoked licenses still in use
      const now = new Date()
      for (const license of licenses) {
        if (license.status === 'expired' || license.status === 'revoked') {
          // Check if there are recent API calls with this license
          const { data: recentUsage } = await this.supabase
            .from('usage_records')
            .select('id')
            .eq('org_id', orgId)
            .eq('license_key', license.key)
            .gte('recorded_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
            .limit(1)

          if (recentUsage && recentUsage.length > 0) {
            anomalies.push({
              type: 'license_mismatch',
              level: 'critical',
              orgId,
              currentValue: recentUsage.length,
              baselineValue: 0,
              deviationPercent: 100,
              description: `License key ${license.key.substring(0, 8)}... is ${license.status} but still being used`,
              detectedAt: new Date().toISOString(),
              metadata: { licenseKey: license.key.substring(0, 8), status: license.status },
            })
          }
        }
      }
    } catch (error) {
      analyticsLogger.error(`[AnomalyDetection] License mismatch error:`, error)
    }

    return anomalies
  }

  /**
   * Detect JWT auth failures
   */
  private async detectJwtFailures(orgId: string): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = []

    try {
      // Count JWT failures in last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

      const { data: failures } = await this.supabase
        .from('auth_logs')
        .select('error_type, count')
        .eq('org_id', orgId)
        .gte('created_at', oneHourAgo.toISOString())
        .in('error_type', ['token_expired', 'invalid_signature', 'invalid_issuer', 'invalid_audience'])

      if (!failures || failures.length === 0) return anomalies

      const totalFailures = failures.reduce((sum, f) => sum + (f.count || 1), 0)

      // Alert if > 10 failures in an hour
      if (totalFailures >= 10) {
        anomalies.push({
          type: 'jwt_failure',
          level: totalFailures >= 50 ? 'critical' : 'warning',
          orgId,
          currentValue: totalFailures,
          baselineValue: 0,
          deviationPercent: 100,
          description: `${totalFailures} JWT authentication failures in the last hour`,
          detectedAt: new Date().toISOString(),
          metadata: { failures: failures.map(f => f.error_type) },
        })
      }
    } catch (error) {
      analyticsLogger.error(`[AnomalyDetection] JWT failure error:`, error)
    }

    return anomalies
  }

  /**
   * Detect KV rate limit breaches
   */
  private async detectRateLimitBreaches(orgId: string): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = []

    try {
      // Check rate limit breaches in last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

      const { data: breaches } = await this.supabase
        .from('rate_limit_events')
        .select('breach_count, limit_type')
        .eq('org_id', orgId)
        .gte('created_at', oneHourAgo.toISOString())

      if (!breaches || breaches.length === 0) return anomalies

      const totalBreaches = breaches.reduce((sum, b) => sum + (b.breach_count || 1), 0)

      // Alert if any breaches detected
      anomalies.push({
        type: 'rate_limit_breach',
        level: totalBreaches >= 100 ? 'critical' : 'warning',
        orgId,
        currentValue: totalBreaches,
        baselineValue: 0,
        deviationPercent: 100,
        description: `${totalBreaches} rate limit breaches in the last hour`,
        detectedAt: new Date().toISOString(),
        metadata: { limitTypes: breaches.map(b => b.limit_type) },
      })
    } catch (error) {
      analyticsLogger.error(`[AnomalyDetection] Rate limit breach error:`, error)
    }

    return anomalies
  }

  /**
   * Send alert for detected anomaly
   */
  private async sendAnomalyAlert(anomaly: Anomaly): Promise<void> {
    try {
      // Get org admin email
      const { data: orgData } = await this.supabase
        .from('organizations')
        .select('metadata, owner_id')
        .eq('id', anomaly.orgId)
        .single()

      const adminEmail = orgData?.metadata?.admin_email

      if (adminEmail) {
        await this.supabase.functions.invoke('send-overage-alert', {
          body: {
            type: 'email',
            to: adminEmail,
            user_id: orgData?.owner_id,
            org_id: anomaly.orgId,
            metric_type: `anomaly_${anomaly.type}`,
            threshold_percentage: Math.min(100, Math.round(anomaly.deviationPercent)),
            current_usage: anomaly.currentValue,
            quota_limit: anomaly.baselineValue,
            locale: 'en',
          },
        })
      }

      analyticsLogger.info(`[AnomalyDetection] Alert sent for ${anomaly.type}`)
    } catch (error) {
      analyticsLogger.error(`[AnomalyDetection] Alert send error:`, error)
    }
  }

  /**
   * Log anomalies to database
   */
  private async logAnomalies(anomalies: Anomaly[]): Promise<void> {
    try {
      if (anomalies.length === 0) return

      await this.supabase
        .from('anomaly_events')
        .insert(
          anomalies.map(a => ({
            org_id: a.orgId,
            anomaly_type: a.type,
            alert_level: a.level,
            metric_type: a.metricType,
            current_value: a.currentValue,
            baseline_value: a.baselineValue,
            deviation_percent: a.deviationPercent,
            description: a.description,
            metadata: a.metadata,
            detected_at: a.detectedAt,
          }))
        )
    } catch (error) {
      analyticsLogger.error(`[AnomalyDetection] Log error:`, error)
    }
  }

  /**
   * Helper: Aggregate usage data by metric type
   */
  private aggregateByMetric(data: { feature: string; quantity: number }[]): Record<string, number> {
    return data.reduce((acc, record) => {
      acc[record.feature] = (acc[record.feature] || 0) + record.quantity
      return acc
    }, {} as Record<string, number>)
  }
}

export default UsageAnomalyDetector
