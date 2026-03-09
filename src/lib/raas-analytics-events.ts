/**
 * RaaS Analytics Event Emission - Phase 6.4
 *
 * Emits suspension and license validation events to Analytics dashboard
 * for visibility, churn tracking, and revenue protection metrics.
 *
 * Features:
 * - Event emission for suspension, license, and billing events
 * - Rate limiting (max 100 events/min/org)
 * - Batch flush mechanism for high-traffic scenarios
 * - Integration with Supabase analytics tables
 *
 * Usage:
 *   import { raasAnalyticsEvents } from '@/lib/raas-analytics-events'
 *
 *   await raasAnalyticsEvents.emitSuspensionCreated({ orgId, userId, reason })
 *   await raasAnalyticsEvents.emitLicenseValidated({ orgId, valid, tier })
 */

import { supabase } from '@/lib/supabase'
import { analyticsLogger } from '@/utils/logger'

// ============================================================================
// EVENT TYPES
// ============================================================================

/**
 * Base analytics event structure
 */
export interface BaseAnalyticsEvent {
  event_type: string
  org_id: string
  user_id?: string
  timestamp: string
  request_id?: string
  path?: string
  ip_address?: string
}

/**
 * Suspension created event
 */
export interface SuspensionCreatedEvent extends BaseAnalyticsEvent {
  event_type: 'suspension_created'
  reason: string
  subscription_status: string
  days_past_due?: number
  amount_owed?: number
  dunning_stage?: string
  grace_period_hours?: number
  metadata?: Record<string, unknown>
}

/**
 * Suspension cleared event
 */
export interface SuspensionClearedEvent extends BaseAnalyticsEvent {
  event_type: 'suspension_cleared'
  reason: string
  subscription_status: string
  cleared_by?: 'payment' | 'admin' | 'grace_period'
  metadata?: Record<string, unknown>
}

/**
 * License expired event
 */
export interface LicenseExpiredEvent extends BaseAnalyticsEvent {
  event_type: 'license_expired'
  license_key?: string
  tier?: string
  days_expired?: number
  was_in_grace_period?: boolean
  metadata?: Record<string, unknown>
}

/**
 * License validated event
 */
export interface LicenseValidatedEvent extends BaseAnalyticsEvent {
  event_type: 'license_validated'
  license_key?: string
  valid: boolean
  tier?: string
  source: 'api' | 'dashboard' | 'webhook'
  response_time_ms?: number
  cached?: boolean
  metadata?: Record<string, unknown>
}

/**
 * Subscription warning event
 */
export interface SubscriptionWarningEvent extends BaseAnalyticsEvent {
  event_type: 'subscription_warning'
  warning_type: 'approaching_limit' | 'past_due' | 'dunning_started' | 'cancellation_pending'
  days_remaining?: number
  amount_owed?: number
  dunning_stage?: string
  quota_percentage?: number
  metadata?: Record<string, unknown>
}

/**
 * Admin bypass used event
 */
export interface AdminBypassUsedEvent extends BaseAnalyticsEvent {
  event_type: 'admin_bypass_used'
  admin_id: string
  target_org_id: string
  path: string
  reason?: string
  metadata?: Record<string, unknown>
}

/**
 * Union type for all RaaS analytics events
 */
export type RaasAnalyticsEvent =
  | SuspensionCreatedEvent
  | SuspensionClearedEvent
  | LicenseExpiredEvent
  | LicenseValidatedEvent
  | SubscriptionWarningEvent
  | AdminBypassUsedEvent

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitState {
  count: number
  windowStart: number
}

const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_EVENTS = 100 // max 100 events per minute per org

class RateLimiter {
  private limits: Map<string, RateLimitState> = new Map()

  /**
   * Check if event is within rate limit
   * @param orgId - Organization ID to check
   * @returns true if allowed, false if rate limited
   */
  checkLimit(orgId: string): boolean {
    const now = Date.now()
    const state = this.limits.get(orgId)

    if (!state) {
      // First event for this org
      this.limits.set(orgId, { count: 1, windowStart: now })
      return true
    }

    // Check if window has expired
    if (now - state.windowStart >= RATE_LIMIT_WINDOW_MS) {
      // Reset window
      this.limits.set(orgId, { count: 1, windowStart: now })
      return true
    }

    // Within window - check count
    if (state.count >= RATE_LIMIT_MAX_EVENTS) {
      analyticsLogger.warn('[RateLimiter] Rate limit exceeded', {
        orgId,
        count: state.count,
        windowMs: RATE_LIMIT_WINDOW_MS,
      })
      return false
    }

    // Increment count
    state.count++
    return true
  }

  /**
   * Get current rate limit status for org
   */
  getStatus(orgId: string): { count: number; remaining: number; resetInMs: number } {
    const now = Date.now()
    const state = this.limits.get(orgId)

    if (!state) {
      return { count: 0, remaining: RATE_LIMIT_MAX_EVENTS, resetInMs: 0 }
    }

    const elapsed = now - state.windowStart
    if (elapsed >= RATE_LIMIT_WINDOW_MS) {
      return { count: 0, remaining: RATE_LIMIT_MAX_EVENTS, resetInMs: 0 }
    }

    return {
      count: state.count,
      remaining: Math.max(0, RATE_LIMIT_MAX_EVENTS - state.count),
      resetInMs: RATE_LIMIT_WINDOW_MS - elapsed,
    }
  }

  /**
   * Clear rate limit state (for testing)
   */
  clear(): void {
    this.limits.clear()
  }
}

// ============================================================================
// ANALYTICS EMITTER
// ============================================================================

export class RaasAnalyticsEmitter {
  private eventQueue: RaasAnalyticsEvent[] = []
  private readonly BATCH_SIZE = 20
  private readonly FLUSH_INTERVAL_MS = 5000
  private readonly rateLimiter = new RateLimiter()
  private flushTimer: ReturnType<typeof setTimeout> | null = null

  constructor() {
    // Auto-flush every 5 seconds
    this.startFlushTimer()
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch((err) => {
        analyticsLogger.error('[RaasAnalytics] Flush timer error:', err)
      })
    }, this.FLUSH_INTERVAL_MS)
  }

  /**
   * Stop the flush timer (for cleanup)
   */
  public stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
  }

  /**
   * Emit suspension created event
   */
  async emitSuspensionCreated(
    event: Omit<SuspensionCreatedEvent, 'timestamp' | 'event_type'>
  ): Promise<boolean> {
    if (!this.rateLimiter.checkLimit(event.org_id)) {
      analyticsLogger.warn('[RaasAnalytics] Suspension event rate limited', {
        orgId: event.org_id,
      })
      return false
    }

    const fullEvent: SuspensionCreatedEvent = {
      ...event,
      event_type: 'suspension_created',
      timestamp: new Date().toISOString(),
    }

    analyticsLogger.info('[RaasAnalytics] Emitting suspension_created', {
      orgId: event.org_id,
      reason: event.reason,
    })

    // Suspension events are high-priority - flush immediately
    await this.insertEvent(fullEvent)
    return true
  }

  /**
   * Emit suspension cleared event
   */
  async emitSuspensionCleared(
    event: Omit<SuspensionClearedEvent, 'timestamp' | 'event_type'>
  ): Promise<boolean> {
    if (!this.rateLimiter.checkLimit(event.org_id)) {
      return false
    }

    const fullEvent: SuspensionClearedEvent = {
      ...event,
      event_type: 'suspension_cleared',
      timestamp: new Date().toISOString(),
    }

    analyticsLogger.info('[RaasAnalytics] Emitting suspension_cleared', {
      orgId: event.org_id,
      reason: event.reason,
    })

    await this.insertEvent(fullEvent)
    return true
  }

  /**
   * Emit license expired event
   */
  async emitLicenseExpired(
    event: Omit<LicenseExpiredEvent, 'timestamp' | 'event_type'>
  ): Promise<boolean> {
    if (!this.rateLimiter.checkLimit(event.org_id)) {
      return false
    }

    const fullEvent: LicenseExpiredEvent = {
      ...event,
      event_type: 'license_expired',
      timestamp: new Date().toISOString(),
    }

    analyticsLogger.info('[RaasAnalytics] Emitting license_expired', {
      orgId: event.org_id,
      licenseKey: event.license_key?.substring(0, 8) + '...',
    })

    await this.insertEvent(fullEvent)
    return true
  }

  /**
   * Emit license validated event (batched for high-traffic)
   */
  async emitLicenseValidated(
    event: Omit<LicenseValidatedEvent, 'timestamp' | 'event_type'>
  ): Promise<boolean> {
    if (!this.rateLimiter.checkLimit(event.org_id)) {
      return false
    }

    const fullEvent: LicenseValidatedEvent = {
      ...event,
      event_type: 'license_validated',
      timestamp: new Date().toISOString(),
    }

    this.eventQueue.push(fullEvent)

    // Flush if batch size reached
    if (this.eventQueue.length >= this.BATCH_SIZE) {
      await this.flush()
    }

    return true
  }

  /**
   * Emit subscription warning event
   */
  async emitSubscriptionWarning(
    event: Omit<SubscriptionWarningEvent, 'timestamp' | 'event_type'>
  ): Promise<boolean> {
    if (!this.rateLimiter.checkLimit(event.org_id)) {
      return false
    }

    const fullEvent: SubscriptionWarningEvent = {
      ...event,
      event_type: 'subscription_warning',
      timestamp: new Date().toISOString(),
    }

    analyticsLogger.info('[RaasAnalytics] Emitting subscription_warning', {
      orgId: event.org_id,
      warningType: event.warning_type,
    })

    await this.insertEvent(fullEvent)
    return true
  }

  /**
   * Emit admin bypass used event
   */
  async emitAdminBypassUsed(
    event: Omit<AdminBypassUsedEvent, 'timestamp' | 'event_type'>
  ): Promise<boolean> {
    if (!this.rateLimiter.checkLimit(event.org_id)) {
      return false
    }

    const fullEvent: AdminBypassUsedEvent = {
      ...event,
      event_type: 'admin_bypass_used',
      timestamp: new Date().toISOString(),
    }

    analyticsLogger.info('[RaasAnalytics] Emitting admin_bypass_used', {
      orgId: event.org_id,
      adminId: event.admin_id,
    })

    await this.insertEvent(fullEvent)
    return true
  }

  /**
   * Flush event queue
   */
  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return

    const events = [...this.eventQueue]
    this.eventQueue = []

    try {
      await this.insertBatch(events)
      analyticsLogger.debug('[RaasAnalytics] Flushed batch', {
        count: events.length,
      })
    } catch (error) {
      analyticsLogger.error('[RaasAnalytics] Flush failed:', error)
      // Re-queue events for retry
      this.eventQueue = [...events, ...this.eventQueue]
    }
  }

  /**
   * Insert single event
   */
  private async insertEvent(event: RaasAnalyticsEvent): Promise<void> {
    try {
      const { error } = await supabase
        .from('raas_analytics_events')
        .insert(this.mapEventToRow(event))

      if (error) {
        analyticsLogger.error('[RaasAnalytics] Insert failed:', error)
        throw error
      }

      analyticsLogger.debug('[RaasAnalytics] Event inserted', {
        eventType: event.event_type,
        orgId: event.org_id,
      })
    } catch (error) {
      analyticsLogger.error('[RaasAnalytics] Insert error:', error)
    }
  }

  /**
   * Insert batch of events
   */
  private async insertBatch(events: RaasAnalyticsEvent[]): Promise<void> {
    if (events.length === 0) return

    const rows = events.map((e) => this.mapEventToRow(e))

    const { error } = await supabase.from('raas_analytics_events').insert(rows)

    if (error) {
      analyticsLogger.error('[RaasAnalytics] Batch insert failed:', error)
      throw error
    }
  }

  /**
   * Map event to database row
   */
  private mapEventToRow(event: RaasAnalyticsEvent): Record<string, unknown> {
    return {
      event_type: event.event_type,
      org_id: event.org_id,
      user_id: event.user_id,
      timestamp: event.timestamp,
      request_id: event.request_id,
      path: event.path,
      ip_address: event.ip_address,
      // Suspension events
      reason: (event as SuspensionCreatedEvent | SuspensionClearedEvent).reason,
      subscription_status:
        (event as SuspensionCreatedEvent | SuspensionClearedEvent).subscription_status,
      days_past_due: (event as SuspensionCreatedEvent).days_past_due,
      amount_owed: (event as SuspensionCreatedEvent | SubscriptionWarningEvent).amount_owed,
      dunning_stage: (event as SuspensionCreatedEvent | SubscriptionWarningEvent).dunning_stage,
      // License events
      license_key: (event as LicenseExpiredEvent | LicenseValidatedEvent).license_key,
      tier: (event as LicenseExpiredEvent | LicenseValidatedEvent).tier,
      valid: (event as LicenseValidatedEvent).valid,
      source: (event as LicenseValidatedEvent).source,
      response_time_ms: (event as LicenseValidatedEvent).response_time_ms,
      cached: (event as LicenseValidatedEvent).cached,
      // Warning events
      warning_type: (event as SubscriptionWarningEvent).warning_type,
      days_remaining: (event as SubscriptionWarningEvent).days_remaining,
      quota_percentage: (event as SubscriptionWarningEvent).quota_percentage,
      // Admin bypass
      admin_id: (event as AdminBypassUsedEvent).admin_id,
      target_org_id: (event as AdminBypassUsedEvent).target_org_id,
      // Metadata
      metadata: event.metadata,
    }
  }

  /**
   * Get rate limit status for org
   */
  getRateLimitStatus(orgId: string): {
    count: number
    remaining: number
    resetInMs: number
  } {
    return this.rateLimiter.getStatus(orgId)
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const raasAnalyticsEvents = new RaasAnalyticsEmitter()

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Emit suspension event from middleware result
 */
export async function emitSuspensionFromMiddleware(
  orgId: string,
  userId: string | null,
  suspensionStatus: import('@/lib/raas-suspension-logic').SuspensionStatus,
  path?: string
): Promise<boolean> {
  return raasAnalyticsEvents.emitSuspensionCreated({
    org_id: orgId,
    user_id: userId || undefined,
    reason: suspensionStatus.reason || 'unknown',
    subscription_status: suspensionStatus.subscription_status,
    days_past_due: suspensionStatus.daysPastDue,
    amount_owed: suspensionStatus.amountOwed,
    dunning_stage: suspensionStatus.dunningStage,
    grace_period_hours: suspensionStatus.gracePeriodRemainingHours,
    path,
  })
}

// ============================================================================
// REACT HOOK FOR DASHBOARD
// ============================================================================

/**
 * Hook for fetching RaaS analytics events (for dashboard)
 * This is a placeholder - actual implementation would use react-query
 */
export interface UseRaasAnalyticsOptions {
  orgId?: string
  eventType?: string
  timeRange?: '24h' | '7d' | '30d' | '90d'
}

export async function fetchRaasAnalyticsEvents(
  options: UseRaasAnalyticsOptions
): Promise<RaasAnalyticsEvent[]> {
  const { orgId, eventType, timeRange = '7d' } = options

  if (!orgId) {
    return []
  }

  const now = new Date()
  const startTime = new Date(
    now.getTime() - getTimeRangeMs(timeRange)
  ).toISOString()

  const query = supabase
    .from('raas_analytics_events')
    .select('*')
    .eq('org_id', orgId)
    .gte('timestamp', startTime)
    .order('timestamp', { ascending: false })
    .limit(1000)

  if (eventType) {
    query.eq('event_type', eventType)
  }

  const { data, error } = await query

  if (error) {
    analyticsLogger.error('[RaasAnalytics] Fetch failed:', error)
    return []
  }

  return data as unknown as RaasAnalyticsEvent[]
}

function getTimeRangeMs(range: string): number {
  const ranges: Record<string, number> = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
  }
  return ranges[range] || ranges['7d']
}

export default raasAnalyticsEvents
