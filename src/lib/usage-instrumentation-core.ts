/**
 * Usage Instrumentation Service - Core Implementation
 *
 * Auto-tracks usage metrics with batch insert and idempotency.
 * Split from usage-instrumentation.ts to stay under 200 lines.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { UsageMeter } from './usage-metering'
import type {
  DetailedUsageEvent,
  InstrumentationConfig,
} from './usage-instrumentation-types'

/**
 * Enhanced Usage Instrumentation Service
 */
export class UsageInstrumentation {
  private supabase: SupabaseClient
  protected config: InstrumentationConfig
   
  private usageMeter: UsageMeter
  private eventBuffer: DetailedUsageEvent[] = []
  private flushTimer: ReturnType<typeof setTimeout> | null = null
  private isFlushing = false

  constructor(supabase: SupabaseClient, config: InstrumentationConfig) {
    this.supabase = supabase
    this.config = config
    this.usageMeter = new UsageMeter(supabase, {
      userId: config.userId,
      orgId: config.orgId,
      licenseId: config.licenseKey,
    })

    if (config.debug) {
      console.warn('[UsageInstrumentation] Initialized:', {
        licenseKey: config.licenseKey ? '***' : 'none',
        customerId: config.customerId ? '***' : 'none',
        userId: config.userId,
      })
    }
  }

  /**
   * Track a detailed usage event
   */
  async trackEvent(event: DetailedUsageEvent): Promise<void> {
    const normalizedEvent: DetailedUsageEvent = {
      ...event,
      license_key: event.license_key || this.config.licenseKey,
      customer_id: event.customer_id || this.config.customerId,
      user_id: event.user_id || this.config.userId,
      org_id: event.org_id || this.config.orgId,
      timestamp: event.timestamp || Date.now(),
      idempotency_key: event.idempotency_key || this.generateIdempotencyKey(event),
    }

    if (this.config.debug) {
      console.warn('[UsageInstrumentation] Tracking event:', normalizedEvent)
    }

    this.eventBuffer.push(normalizedEvent)

    if (this.eventBuffer.length >= (this.config.batchSize || 100)) {
      await this.flush()
    }
  }

  /**
   * Flush buffered events to Supabase
   */
  async flush(): Promise<void> {
    if (this.isFlushing || this.eventBuffer.length === 0) return

    this.isFlushing = true

    try {
      const events = [...this.eventBuffer]
      this.eventBuffer = []

      const records = events.map(event => ({
        org_id: event.org_id,
        user_id: event.user_id,
        license_id: event.license_key,
        feature: event.event_type,
        quantity: event.quantity,
        metadata: {
          ...event.metadata,
          customer_id: event.customer_id,
          idempotency_key: event.idempotency_key,
          timestamp: event.timestamp,
        },
        recorded_at: new Date(event.timestamp).toISOString(),
      }))

      const { error } = await this.supabase
        .from('usage_records')
        .insert(records)

      if (error) {
        console.error('[UsageInstrumentation] Flush error:', error)
        this.eventBuffer.unshift(...events)
        throw error
      }

      if (this.config.debug) {
        console.warn('[UsageInstrumentation] Flushed', records.length, 'events')
      }
    } finally {
      this.isFlushing = false
    }
  }

  /**
   * Start auto-flush timer
   */
  startAutoFlush(): void {
    const interval = this.config.flushIntervalMs || 10000

    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error)
    }, interval)

    console.warn(`[UsageInstrumentation] Auto-flush started (every ${interval}ms)`)
  }

  /**
   * Stop auto-flush timer
   */
  stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
      console.warn('[UsageInstrumentation] Auto-flush stopped')
    }
  }

  /**
   * Cleanup - flush remaining events before shutdown
   */
  async cleanup(): Promise<void> {
    this.stopAutoFlush()
    await this.flush()
    console.warn('[UsageInstrumentation] Cleanup complete')
  }

  /**
   * Generate unique idempotency key
   */
  private generateIdempotencyKey(event: DetailedUsageEvent): string {
    const parts = [
      event.event_type,
      event.user_id,
      event.timestamp,
      Math.random().toString(36).substring(2, 8),
    ]
    return `evt_${parts.join('_')}`
  }

  /**
   * Get buffer size
   */
  getBufferSize(): number {
    return this.eventBuffer.length
  }

  /**
   * Get instrumentation stats
   */
  getStats(): {
    bufferSize: number
    isFlushing: boolean
    config: Partial<InstrumentationConfig>
  } {
    return {
      bufferSize: this.eventBuffer.length,
      isFlushing: this.isFlushing,
      config: {
        licenseKey: this.config.licenseKey ? '***' : 'none',
        customerId: this.config.customerId ? '***' : 'none',
        userId: this.config.userId,
        tracking: this.config.tracking,
      },
    }
  }
}
