/**
 * Usage Anomaly Detection Service
 *
 * Detects anomalous usage patterns (spikes, drops, unusual behavior) and sends alerts.
 * Uses statistical analysis with rolling baselines for accurate detection.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { analyticsLogger } from '@/utils/logger'
import type { AnomalyConfig, AnomalyResult, Anomaly } from './usage-anomaly-types'
import {
  detectUsageAnomalies,
  detectLicenseMismatches,
  detectJwtFailures,
  detectRateLimitBreaches,
  sendAnomalyAlert,
  logAnomalies,
} from './usage-anomaly-helpers'

export class UsageAnomalyDetector {
  private supabase: SupabaseClient
  private readonly DEFAULT_SPIKE_THRESHOLD = 3.0
  private readonly DEFAULT_DROP_THRESHOLD = 0.3
  private readonly DEFAULT_BASELINE_DAYS = 7

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

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

      const usageAnomalies = await detectUsageAnomalies(this.supabase, {
        orgId,
        metricType,
        windowHours,
        baselineDays,
        spikeThreshold,
        dropThreshold,
      })
      anomalies.push(...usageAnomalies)

      const licenseAnomalies = await detectLicenseMismatches(this.supabase, orgId)
      anomalies.push(...licenseAnomalies)

      const jwtAnomalies = await detectJwtFailures(this.supabase, orgId)
      anomalies.push(...jwtAnomalies)

      const rateLimitAnomalies = await detectRateLimitBreaches(this.supabase, orgId)
      anomalies.push(...rateLimitAnomalies)

      for (const anomaly of anomalies) {
        await sendAnomalyAlert(this.supabase, anomaly)
      }

      await logAnomalies(this.supabase, anomalies)

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
}

export default UsageAnomalyDetector
