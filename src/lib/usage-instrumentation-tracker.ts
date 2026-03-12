/**
 * Usage Instrumentation - Trackers
 *
 * Tracking methods for different event types.
 * Split to stay under 200 lines limit.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { UsageMeter } from './usage-metering'
import { analyticsLogger } from '@/utils/logger'
import type {
  ModelInferenceOptions,
  AgentExecutionOptions,
  ApiCallOptions,
  FeatureUsageOptions,
  ResourceConsumptionOptions,
  InstrumentationConfig,
  DetailedUsageEvent,
} from './usage-instrumentation-types'

/**
 * Usage Tracker Service - tracks specific event types
 */
export class UsageTracker {
  private supabase: SupabaseClient
  private config: InstrumentationConfig
  private usageMeter: UsageMeter
  private eventBuffer: DetailedUsageEvent[] = []

  constructor(supabase: SupabaseClient, config: InstrumentationConfig) {
    this.supabase = supabase
    this.config = config
    this.usageMeter = new UsageMeter(supabase, {
      userId: config.userId,
      orgId: config.orgId,
      licenseId: config.licenseKey,
    })
  }

  /**
   * Track AI model inference
   */
  async trackModelInference(options: ModelInferenceOptions): Promise<void> {
    if (this.config.tracking?.modelInferences === false) return

    const event: DetailedUsageEvent = {
      event_type: 'model_inference',
      quantity: options.prompt_tokens + options.completion_tokens,
      timestamp: Date.now(),
      license_key: this.config.licenseKey,
      customer_id: this.config.customerId,
      user_id: this.config.userId,
      org_id: this.config.orgId,
      metadata: {
        model: options.model,
        provider: options.provider,
        prompt_tokens: options.prompt_tokens,
        completion_tokens: options.completion_tokens,
        total_tokens: options.prompt_tokens + options.completion_tokens,
        duration_ms: options.duration_ms,
        success: options.success !== false,
        error_message: options.error_message,
        agent_type: options.agent_type,
      },
    }

    this.eventBuffer.push(event)
    await this.usageMeter.trackModelInference({
      model: options.model,
      provider: options.provider,
      prompt_tokens: options.prompt_tokens,
      completion_tokens: options.completion_tokens,
      agent_type: options.agent_type,
    }).catch(err => analyticsLogger.error('Track model inference error:', err))
  }

  /**
   * Track agent execution
   */
  async trackAgentExecution(options: AgentExecutionOptions): Promise<void> {
    if (this.config.tracking?.agentExecutions === false) return

    const event: DetailedUsageEvent = {
      event_type: 'agent_execution',
      quantity: 1,
      timestamp: Date.now(),
      license_key: this.config.licenseKey,
      customer_id: this.config.customerId,
      user_id: this.config.userId,
      org_id: this.config.orgId,
      metadata: {
        agent_type: options.agent_type,
        agent_action: options.action,
        duration_ms: options.duration_ms,
        input_size: options.input_size,
        output_size: options.output_size,
        steps_executed: options.steps_executed,
        success: options.success !== false,
        error_message: options.error_message,
        ...options.metadata,
      },
    }

    this.eventBuffer.push(event)
    await this.usageMeter.trackAgentExecution(options.agent_type, options.metadata).catch(err => analyticsLogger.error('Track agent execution error:', err))
  }

  /**
   * Track API call
   */
  async trackApiCall(options: ApiCallOptions): Promise<void> {
    if (this.config.tracking?.apiCalls === false) return

    const event: DetailedUsageEvent = {
      event_type: 'api_call',
      quantity: 1,
      timestamp: Date.now(),
      license_key: this.config.licenseKey,
      customer_id: this.config.customerId,
      user_id: this.config.userId,
      org_id: this.config.orgId,
      metadata: {
        endpoint: options.endpoint,
        method: options.method,
        duration_ms: options.duration_ms,
        status_code: options.status_code,
        request_size_bytes: options.request_size_bytes,
        response_size_bytes: options.response_size_bytes,
        success: options.status_code >= 200 && options.status_code < 300,
        error_message: options.error_message,
      },
    }

    this.eventBuffer.push(event)
    await this.usageMeter.trackApiCall(options.endpoint, options.method).catch(err => analyticsLogger.error('Track API call error:', err))
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsage(options: FeatureUsageOptions): Promise<void> {
    if (this.config.tracking?.featureUsage === false) return

    this.eventBuffer.push({
      event_type: 'feature_usage',
      quantity: 1,
      timestamp: Date.now(),
      license_key: this.config.licenseKey,
      customer_id: this.config.customerId,
      user_id: this.config.userId,
      org_id: this.config.orgId,
      metadata: {
        feature_name: options.feature_name,
        action: options.action,
        duration_ms: options.duration_ms,
        ...options.metadata,
      },
    })
  }

  /**
   * Track resource consumption
   */
  async trackResourceConsumption(options: ResourceConsumptionOptions): Promise<void> {
    if (this.config.tracking?.resourceConsumption === false) return

    this.eventBuffer.push({
      event_type: 'resource_consumption',
      quantity: options.quantity,
      timestamp: Date.now(),
      license_key: this.config.licenseKey,
      customer_id: this.config.customerId,
      user_id: this.config.userId,
      org_id: this.config.orgId,
      metadata: {
        resource_type: options.resource_type,
        resource_unit: options.unit,
        resource_quantity: options.quantity,
        duration_ms: options.duration_ms,
        ...options.metadata,
      },
    })
  }

  /**
   * Get buffered events
   */
  getEvents(): DetailedUsageEvent[] {
    return [...this.eventBuffer]
  }

  /**
   * Clear buffer
   */
  clearBuffer(): void {
    this.eventBuffer = []
  }
}
