/**
 * Usage Instrumentation Service
 *
 * Main entry point - re-exports from split modules.
 * Coordinates auto-tracking via fetch interceptor.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { UsageInstrumentation } from './usage-instrumentation-core'
import { UsageTracker } from './usage-instrumentation-tracker'
import { analyticsLogger } from '@/utils/logger'
import type {
  InstrumentationConfig,
  ModelInferenceOptions,
  AgentExecutionOptions,
  ApiCallOptions,
  FeatureUsageOptions,
  ResourceConsumptionOptions,
} from './usage-instrumentation-types'

export * from './usage-instrumentation-types'

/**
 * Combined Usage Instrumentation - extends core with trackers
 */
export class UsageInstrumentationService extends UsageInstrumentation {
  private tracker: UsageTracker

  constructor(supabase: SupabaseClient, config: InstrumentationConfig) {
    super(supabase, config)
    this.tracker = new UsageTracker(supabase, config)
  }

  /**
   * Track AI model inference
   */
  async trackModelInference(options: ModelInferenceOptions): Promise<void> {
    await this.tracker.trackModelInference(options)
  }

  /**
   * Track agent execution
   */
  async trackAgentExecution(options: AgentExecutionOptions): Promise<void> {
    await this.tracker.trackAgentExecution(options)
  }

  /**
   * Track API call
   */
  async trackApiCall(options: ApiCallOptions): Promise<void> {
    await this.tracker.trackApiCall(options)
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsage(options: FeatureUsageOptions): Promise<void> {
    await this.tracker.trackFeatureUsage(options)
  }

  /**
   * Track resource consumption
   */
  async trackResourceConsumption(options: ResourceConsumptionOptions): Promise<void> {
    await this.tracker.trackResourceConsumption(options)
  }

  /**
   * Install fetch interceptor to auto-track all HTTP requests
   */
  installFetchInterceptor(): () => void {
    if (this.config.tracking?.apiCalls === false) return () => {}

    const originalFetch = globalThis.fetch

    const instrumentedFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const startTime = Date.now()
      const url = typeof input === 'string' ? input : (input as Request).url || (input as URL).toString()
      const method = init?.method || 'GET'

      try {
        const response = await originalFetch(input, init)
        const duration = Date.now() - startTime

        await this.trackApiCall({
          endpoint: url,
          method,
          duration_ms: duration,
          status_code: response.status,
          response_size_bytes: parseInt(response.headers.get('content-length') || '0'),
        }).catch(err => analyticsLogger.error('Track API call error:', err))

        return response
      } catch (error) {
        const duration = Date.now() - startTime

        await this.trackApiCall({
          endpoint: url,
          method,
          duration_ms: duration,
          status_code: 0,
          error_message: error instanceof Error ? error.message : 'Unknown error',
        }).catch(err => analyticsLogger.error('Track API call error:', err))

        throw error
      }
    }

    globalThis.fetch = instrumentedFetch

    analyticsLogger.warn('[UsageInstrumentation] Fetch interceptor installed')

    return () => {
      globalThis.fetch = originalFetch
      analyticsLogger.warn('[UsageInstrumentation] Fetch interceptor removed')
    }
  }
}

// Re-export for backward compatibility
export { UsageInstrumentation as UsageInstrumentationCore } from './usage-instrumentation-core'
export { UsageTracker } from './usage-instrumentation-tracker'
