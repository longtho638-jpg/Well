 
/**
 * Usage Anomaly Detector - Helper Functions
 *
 * Helper functions for usage anomaly detection.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { analyticsLogger } from '@/utils/logger'

export async function detectUsageAnomalies(
  supabase: SupabaseClient,
  params: {
    orgId: string
    metricType?: string
    windowHours: number
    baselineDays: number
    spikeThreshold: number
    dropThreshold: number
  }
): Promise<Anomaly[]> {
  const { orgId, metricType, windowHours, baselineDays, spikeThreshold, dropThreshold } = params
  const anomalies: Anomaly[] = []

  try {
    const now = new Date()
    const currentStart = new Date(now.getTime() - windowHours * 60 * 60 * 1000)
    const baselineStart = new Date(now.getTime() - (baselineDays + 1) * 24 * 60 * 60 * 1000)
    const baselineEnd = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    let query = supabase
      .from('usage_records')
      .select('feature, quantity, recorded_at')
      .eq('org_id', orgId)

    if (metricType) query = query.eq('feature', metricType)

    const { data: currentData } = await query
      .gte('recorded_at', currentStart.toISOString())
      .lte('recorded_at', now.toISOString())

    const { data: baselineData } = await supabase
      .from('usage_records')
      .select('feature, quantity, recorded_at')
      .eq('org_id', orgId)
      .gte('recorded_at', baselineStart.toISOString())
      .lte('recorded_at', baselineEnd.toISOString())

    if (!currentData || !baselineData) return anomalies

    const currentTotals = aggregateByMetric(currentData)
    const baselineTotals = aggregateByMetric(baselineData)

    const baselineDailyAvg = Object.entries(baselineTotals).reduce((acc, [metric, total]) => {
      acc[metric] = total / baselineDays
      return acc
    }, {} as Record<string, number>)

    for (const [metric, currentValue] of Object.entries(currentTotals)) {
      const baselineValue = baselineDailyAvg[metric] || 0
      if (baselineValue === 0) continue

      const ratio = currentValue / baselineValue

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

export async function detectLicenseMismatches(supabase: SupabaseClient, orgId: string): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = []

  try {
    const { data: licenses } = await supabase
      .from('license_keys')
      .select('key, status, expires_at, metadata')
      .eq('org_id', orgId)
      .in('status', ['active', 'expired', 'revoked'])

    if (!licenses) return anomalies

    const now = new Date()
    for (const license of licenses) {
      if (license.status === 'expired' || license.status === 'revoked') {
        const { data: recentUsage } = await supabase
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

export async function detectJwtFailures(supabase: SupabaseClient, orgId: string): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = []

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const { data: failures } = await supabase
      .from('auth_logs')
      .select('error_type, count')
      .eq('org_id', orgId)
      .gte('created_at', oneHourAgo.toISOString())
      .in('error_type', ['token_expired', 'invalid_signature', 'invalid_issuer', 'invalid_audience'])

    if (!failures || failures.length === 0) return anomalies

    const totalFailures = failures.reduce((sum, f) => sum + (f.count || 1), 0)

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

export async function detectRateLimitBreaches(supabase: SupabaseClient, orgId: string): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = []

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const { data: breaches } = await supabase
      .from('rate_limit_events')
      .select('breach_count, limit_type')
      .eq('org_id', orgId)
      .gte('created_at', oneHourAgo.toISOString())

    if (!breaches || breaches.length === 0) return anomalies

    const totalBreaches = breaches.reduce((sum, b) => sum + (b.breach_count || 1), 0)

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

export async function sendAnomalyAlert(supabase: SupabaseClient, anomaly: Anomaly): Promise<void> {
  try {
    const { data: orgData } = await supabase
      .from('organizations')
      .select('metadata, owner_id')
      .eq('id', anomaly.orgId)
      .single()

    const adminEmail = orgData?.metadata?.admin_email

    if (adminEmail) {
      await supabase.functions.invoke('send-overage-alert', {
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

export async function logAnomalies(supabase: SupabaseClient, anomalies: Anomaly[]): Promise<void> {
  try {
    if (anomalies.length === 0) return

    await supabase
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

function aggregateByMetric(data: { feature: string; quantity: number }[]): Record<string, number> {
  return data.reduce((acc, record) => {
    acc[record.feature] = (acc[record.feature] || 0) + record.quantity
    return acc
  }, {} as Record<string, number>)
}
