/**
 * Usage Instrumentation Types
 *
 * Shared types for usage instrumentation module.
 * Keep under 200 lines for maintainability.
 */

/**
 * Detailed usage event with enriched metadata
 */
export interface DetailedUsageEvent {
  /** Event type: api_call, model_inference, agent_execution, feature_usage, resource_consumption */
  event_type: string
  /** Quantity (e.g., token count, compute ms, bytes) */
  quantity: number
  /** Unix timestamp in milliseconds */
  timestamp: number
  /** License key for tenant isolation */
  license_key?: string
  /** Customer ID for Stripe mapping */
  customer_id?: string
  /** User ID who triggered the event */
  user_id: string
  /** Resource/org ID */
  org_id?: string
  /** Detailed metadata */
  metadata: EventMetadata
  /** Idempotency key for deduplication */
  idempotency_key?: string
}

/**
 * Event metadata - flexible schema for different event types
 */
export interface EventMetadata {
  // Common fields
  duration_ms?: number
  status_code?: number
  success?: boolean
  error_message?: string

  // API call fields
  endpoint?: string
  method?: string
  request_size_bytes?: number
  response_size_bytes?: number

  // AI inference fields
  model?: string
  provider?: 'openai' | 'anthropic' | 'google' | 'dashscope' | 'azure'
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
  model_tier?: 'standard' | 'premium' | 'enterprise'

  // Agent execution fields
  agent_type?: string
  agent_action?: string
  input_size?: number
  output_size?: number
  steps_executed?: number

  // Resource consumption
  resource_type?: 'cpu' | 'memory' | 'disk' | 'bandwidth' | 'gpu'
  resource_unit?: string
  resource_quantity?: number

  // Custom fields
  [key: string]: unknown
}

/**
 * Model inference tracking options
 */
export interface ModelInferenceOptions {
  model: string
  provider: 'openai' | 'anthropic' | 'google' | 'dashscope' | 'azure'
  prompt_tokens: number
  completion_tokens: number
  duration_ms?: number
  agent_type?: string
  success?: boolean
  error_message?: string
}

/**
 * Agent execution tracking options
 */
export interface AgentExecutionOptions {
  agent_type: 'planner' | 'researcher' | 'developer' | 'reviewer' | 'tester' | 'debugger' | string
  action: string
  duration_ms: number
  input_size?: number
  output_size?: number
  steps_executed?: number
  success?: boolean
  error_message?: string
  metadata?: Record<string, unknown>
}

/**
 * API call tracking options
 */
export interface ApiCallOptions {
  endpoint: string
  method: string
  duration_ms: number
  status_code: number
  request_size_bytes?: number
  response_size_bytes?: number
  error_message?: string
}

/**
 * Feature usage tracking options
 */
export interface FeatureUsageOptions {
  feature_name: string
  action: string
  duration_ms?: number
  metadata?: Record<string, unknown>
}

/**
 * Resource consumption tracking options
 */
export interface ResourceConsumptionOptions {
  resource_type: 'cpu' | 'memory' | 'disk' | 'bandwidth' | 'gpu'
  quantity: number
  unit: string
  duration_ms?: number
  metadata?: Record<string, unknown>
}

/**
 * Instrumentation configuration
 */
export interface InstrumentationConfig {
  licenseKey?: string
  customerId?: string
  userId: string
  orgId?: string
  /** Enable/disable specific tracking types */
  tracking?: {
    apiCalls?: boolean
    modelInferences?: boolean
    agentExecutions?: boolean
    featureUsage?: boolean
    resourceConsumption?: boolean
  }
  /** Batch size for bulk inserts */
  batchSize?: number
  /** Flush interval in ms */
  flushIntervalMs?: number
  /** Enable debug logging */
  debug?: boolean
}
