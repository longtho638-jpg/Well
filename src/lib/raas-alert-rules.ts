/**
 * RaaS Alert Rules Engine - Phase 6.4
 *
 * Configurable alert rules for RaaS monitoring with KV storage.
 * Supports quota thresholds, feature blocks, and spending limits.
 *
 * Features:
 * - Alert rules: quota_threshold (>90%, >95%), feature_blocked, spending_limit
 * - KV storage for alert configs (TTL: 1 year)
 * - Per-organization alert configuration
 * - Real-time alert evaluation
 * - Alert history tracking
 *
 * Usage:
 *   import { raasAlertRules, checkAlertRules } from '@/lib/raas-alert-rules'
 *
 *   const alert = await raasAlertRules.evaluateQuotaAlert({ orgId, currentUsage, quotaLimit })
 *   if (alert.triggered) {
 *     // Handle alert
 *   }
 */

import { supabase } from '@/lib/supabase'
import { analyticsLogger } from '@/utils/logger'

// ============================================================================
// ALERT TYPES
// ============================================================================

/**
 * Alert rule types
 */
export type AlertRuleType =
  | 'quota_threshold'
  | 'feature_blocked'
  | 'spending_limit'
  | 'license_expiring'
  | 'suspension_warning'

/**
 * Alert severity levels
 */
export type AlertSeverity = 'info' | 'warning' | 'critical'

/**
 * Alert rule configuration
 */
export interface AlertRuleConfig {
  /** Unique rule ID */
  id?: string
  /** Organization ID */
  org_id: string
  /** Rule type */
  rule_type: AlertRuleType
  /** Rule name */
  name: string
  /** Rule description */
  description?: string
  /** Severity level */
  severity: AlertSeverity
  /** Threshold value */
  threshold: number
  /** Threshold operator */
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq'
  /** Whether rule is enabled */
  enabled: boolean
  /** Alert cooldown period (seconds) */
  cooldown_seconds?: number
  /** Notification channels */
  notification_channels?: string[]
  /** Custom message template */
  message_template?: string
  /** Metadata */
  metadata?: Record<string, unknown>
  /** Created timestamp */
  created_at?: string
  /** Updated timestamp */
  updated_at?: string
  /** TTL expiry timestamp */
  expires_at?: string
}

/**
 * Alert evaluation result
 */
export interface AlertEvaluationResult {
  /** Whether alert was triggered */
  triggered: boolean
  /** Rule that triggered alert */
  rule?: AlertRuleConfig
  /** Current value being evaluated */
  currentValue: number
  /** Threshold value */
  threshold: number
  /** Alert message */
  message?: string
  /** Timestamp when triggered */
  triggeredAt?: string
}

/**
 * Alert event for tracking
 */
export interface AlertEvent {
  /** Event ID */
  id?: string
  /** Organization ID */
  org_id: string
  /** Rule ID */
  rule_id?: string
  /** Rule type */
  rule_type: AlertRuleType
  /** Whether alert was triggered */
  triggered: boolean
  /** Current value */
  current_value: number
  /** Threshold value */
  threshold_value: number
  /** Severity */
  severity: AlertSeverity
  /** Message */
  message?: string
  /** Metadata */
  metadata?: Record<string, unknown>
  /** Created timestamp */
  created_at?: string
}

/**
 * Quota alert evaluation input
 */
export interface QuotaAlertInput {
  /** Organization ID */
  orgId: string
  /** Current usage value */
  currentUsage: number
  /** Quota limit */
  quotaLimit: number
  /** Feature name (optional) */
  featureName?: string
}

/**
 * Spending alert evaluation input
 */
export interface SpendingAlertInput {
  /** Organization ID */
  orgId: string
  /** Current spending */
  currentSpending: number
  /** Spending limit */
  spendingLimit: number
}

/**
 * Feature block alert input
 */
export interface FeatureBlockInput {
  /** Organization ID */
  orgId: string
  /** Feature name */
  featureName: string
  /** Whether feature is blocked */
  isBlocked: boolean
  /** Block reason */
  blockReason?: string
}

// ============================================================================
// DEFAULT RULES
// ============================================================================

/**
 * Default alert rules for new organizations
 */
export const DEFAULT_ALERT_RULES: Omit<AlertRuleConfig, 'org_id' | 'id'>[] = [
  {
    rule_type: 'quota_threshold',
    name: 'Quota 90% Warning',
    description: 'Alert when quota usage exceeds 90%',
    severity: 'warning',
    threshold: 90,
    operator: 'gte',
    enabled: true,
    cooldown_seconds: 3600, // 1 hour
    message_template: 'Quota usage at {{percentage}}% - approaching limit',
    metadata: { threshold_type: 'percentage' },
  },
  {
    rule_type: 'quota_threshold',
    name: 'Quota 95% Critical',
    description: 'Critical alert when quota usage exceeds 95%',
    severity: 'critical',
    threshold: 95,
    operator: 'gte',
    enabled: true,
    cooldown_seconds: 1800, // 30 minutes
    message_template: 'Quota usage at {{percentage}}% - critical limit',
    metadata: { threshold_type: 'percentage' },
  },
  {
    rule_type: 'spending_limit',
    name: 'Spending 80% Warning',
    description: 'Alert when spending reaches 80% of limit',
    severity: 'warning',
    threshold: 80,
    operator: 'gte',
    enabled: true,
    cooldown_seconds: 7200, // 2 hours
    message_template: 'Spending at {{percentage}}% of limit',
    metadata: { threshold_type: 'percentage' },
  },
  {
    rule_type: 'feature_blocked',
    name: 'Feature Blocked',
    description: 'Alert when a feature access is blocked',
    severity: 'info',
    threshold: 1,
    operator: 'eq',
    enabled: true,
    cooldown_seconds: 300, // 5 minutes
    message_template: 'Feature {{featureName}} access blocked: {{reason}}',
  },
]

// ============================================================================
// KV STORAGE HELPERS
// ============================================================================

const KV_ALERT_PREFIX = 'raas:alert:'
const KV_TTL_SECONDS = 365 * 24 * 60 * 60 // 1 year

/**
 * Generate KV key for alert config
 */
function getAlertKey(orgId: string, ruleId: string): string {
  return `${KV_ALERT_PREFIX}${orgId}:${ruleId}`
}

/**
 * Get expiry timestamp
 */
function getExpiryTimestamp(): string {
  const expiry = new Date(Date.now() + KV_TTL_SECONDS * 1000)
  return expiry.toISOString()
}

// ============================================================================
// ALERT RULES ENGINE
// ============================================================================

export class RaasAlertRulesEngine {
  /**
   * Get all alert rules for an organization
   */
  async getAlertRules(orgId: string): Promise<AlertRuleConfig[]> {
    try {
      const { data, error } = await supabase
        .from('raas_alert_rules')
        .select('*')
        .eq('org_id', orgId)
        .eq('enabled', true)
        .order('created_at', { ascending: false })

      if (error) {
        analyticsLogger.error('[RaasAlertRules] Fetch error:', error)
        return []
      }

      return data as unknown as AlertRuleConfig[]
    } catch (err) {
      analyticsLogger.error('[RaasAlertRules] Get rules error:', err)
      return []
    }
  }

  /**
   * Create a new alert rule
   */
  async createAlertRule(rule: AlertRuleConfig): Promise<{ success: boolean; ruleId?: string }> {
    try {
      const { data, error } = await supabase
        .from('raas_alert_rules')
        .insert({
          org_id: rule.org_id,
          rule_type: rule.rule_type,
          name: rule.name,
          description: rule.description,
          severity: rule.severity,
          threshold: rule.threshold,
          operator: rule.operator,
          enabled: rule.enabled,
          cooldown_seconds: rule.cooldown_seconds,
          notification_channels: rule.notification_channels,
          message_template: rule.message_template,
          metadata: rule.metadata,
          expires_at: rule.expires_at || getExpiryTimestamp(),
        })
        .select('id')
        .single()

      if (error) {
        analyticsLogger.error('[RaasAlertRules] Create error:', error)
        return { success: false }
      }

      // Cache in KV
      await this.cacheRuleInKV(rule.org_id, data.id, data)

      return { success: true, ruleId: data.id }
    } catch (err) {
      analyticsLogger.error('[RaasAlertRules] Create error:', err)
      return { success: false }
    }
  }

  /**
   * Update an existing alert rule
   */
  async updateAlertRule(
    ruleId: string,
    updates: Partial<AlertRuleConfig>
  ): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase
        .from('raas_alert_rules')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ruleId)

      if (error) {
        analyticsLogger.error('[RaasAlertRules] Update error:', error)
        return { success: false }
      }

      return { success: true }
    } catch (err) {
      analyticsLogger.error('[RaasAlertRules] Update error:', err)
      return { success: false }
    }
  }

  /**
   * Delete an alert rule
   */
  async deleteAlertRule(ruleId: string): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase
        .from('raas_alert_rules')
        .delete()
        .eq('id', ruleId)

      if (error) {
        analyticsLogger.error('[RaasAlertRules] Delete error:', error)
        return { success: false }
      }

      return { success: true }
    } catch (err) {
      analyticsLogger.error('[RaasAlertRules] Delete error:', err)
      return { success: false }
    }
  }

  /**
   * Evaluate quota alert rules
   */
  async evaluateQuotaAlert(input: QuotaAlertInput): Promise<AlertEvaluationResult> {
    const { orgId, currentUsage, quotaLimit, featureName } = input

    if (quotaLimit <= 0) {
      return { triggered: false, currentValue: currentUsage, threshold: quotaLimit }
    }

    const usagePercentage = (currentUsage / quotaLimit) * 100

    // Get quota threshold rules
    const rules = await this.getRulesByType(orgId, 'quota_threshold')

    for (const rule of rules) {
      const triggered = this.evaluateThreshold(usagePercentage, rule)

      if (triggered) {
        const message = this.formatMessage(
          rule.message_template || `Quota usage at ${usagePercentage.toFixed(1)}%`,
          { percentage: usagePercentage.toFixed(1), featureName, currentUsage, quotaLimit }
        )

        // Log alert event
        await this.logAlertEvent({
          org_id: orgId,
          rule_id: rule.id,
          rule_type: 'quota_threshold',
          triggered: true,
          current_value: usagePercentage,
          threshold_value: rule.threshold,
          severity: rule.severity,
          message,
        })

        return {
          triggered: true,
          rule,
          currentValue: usagePercentage,
          threshold: rule.threshold,
          message,
          triggeredAt: new Date().toISOString(),
        }
      }
    }

    return { triggered: false, currentValue: usagePercentage, threshold: 100 }
  }

  /**
   * Evaluate spending limit alert rules
   */
  async evaluateSpendingAlert(input: SpendingAlertInput): Promise<AlertEvaluationResult> {
    const { orgId, currentSpending, spendingLimit } = input

    if (spendingLimit <= 0) {
      return { triggered: false, currentValue: currentSpending, threshold: spendingLimit }
    }

    const spendingPercentage = (currentSpending / spendingLimit) * 100

    // Get spending limit rules
    const rules = await this.getRulesByType(orgId, 'spending_limit')

    for (const rule of rules) {
      const triggered = this.evaluateThreshold(spendingPercentage, rule)

      if (triggered) {
        const message = this.formatMessage(
          rule.message_template || `Spending at ${spendingPercentage.toFixed(1)}% of limit`,
          {
            percentage: spendingPercentage.toFixed(1),
            currentSpending,
            spendingLimit,
          }
        )

        await this.logAlertEvent({
          org_id: orgId,
          rule_id: rule.id,
          rule_type: 'spending_limit',
          triggered: true,
          current_value: spendingPercentage,
          threshold_value: rule.threshold,
          severity: rule.severity,
          message,
        })

        return {
          triggered: true,
          rule,
          currentValue: spendingPercentage,
          threshold: rule.threshold,
          message,
          triggeredAt: new Date().toISOString(),
        }
      }
    }

    return { triggered: false, currentValue: spendingPercentage, threshold: 100 }
  }

  /**
   * Evaluate feature block alert rules
   */
  async evaluateFeatureBlock(input: FeatureBlockInput): Promise<AlertEvaluationResult> {
    const { orgId, featureName, isBlocked, blockReason } = input

    if (!isBlocked) {
      return { triggered: false, currentValue: 0, threshold: 1 }
    }

    // Get feature blocked rules
    const rules = await this.getRulesByType(orgId, 'feature_blocked')

    for (const rule of rules) {
      if (!rule.enabled) continue

      const message = this.formatMessage(
        rule.message_template || `Feature ${featureName} access blocked`,
        { featureName, reason: blockReason || 'unknown' }
      )

      await this.logAlertEvent({
        org_id: orgId,
        rule_id: rule.id,
        rule_type: 'feature_blocked',
        triggered: true,
        current_value: 1,
        threshold_value: rule.threshold,
        severity: rule.severity,
        message,
        metadata: { featureName, blockReason },
      })

      return {
        triggered: true,
        rule,
        currentValue: 1,
        threshold: rule.threshold,
        message,
        triggeredAt: new Date().toISOString(),
      }
    }

    return { triggered: false, currentValue: 0, threshold: 1 }
  }

  /**
   * Get alert rules by type
   */
  private async getRulesByType(
    orgId: string,
    ruleType: AlertRuleType
  ): Promise<AlertRuleConfig[]> {
    try {
      const { data, error } = await supabase
        .from('raas_alert_rules')
        .select('*')
        .eq('org_id', orgId)
        .eq('rule_type', ruleType)
        .eq('enabled', true)
        .order('severity', { ascending: false })

      if (error) {
        analyticsLogger.error('[RaasAlertRules] Get rules by type error:', error)
        return []
      }

      return data as unknown as AlertRuleConfig[]
    } catch (err) {
      analyticsLogger.error('[RaasAlertRules] Get rules error:', err)
      return []
    }
  }

  /**
   * Evaluate threshold based on operator
   */
  private evaluateThreshold(value: number, rule: AlertRuleConfig): boolean {
    switch (rule.operator) {
      case 'gt':
        return value > rule.threshold
      case 'gte':
        return value >= rule.threshold
      case 'lt':
        return value < rule.threshold
      case 'lte':
        return value <= rule.threshold
      case 'eq':
        return value === rule.threshold
      default:
        return false
    }
  }

  /**
   * Format message with template variables
   */
  private formatMessage(template: string, variables: Record<string, unknown>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return String(variables[key] ?? match)
    })
  }

  /**
   * Log alert event to database
   */
  async logAlertEvent(event: Omit<AlertEvent, 'created_at'>): Promise<void> {
    try {
      await supabase.from('raas_alert_events').insert({
        org_id: event.org_id,
        rule_id: event.rule_id,
        rule_type: event.rule_type,
        triggered: event.triggered,
        current_value: event.current_value,
        threshold_value: event.threshold_value,
        severity: event.severity,
        message: event.message,
        metadata: event.metadata,
      })
    } catch (err) {
      analyticsLogger.error('[RaasAlertRules] Log event error:', err)
    }
  }

  /**
   * Get recent alert events for organization
   */
  async getAlertEvents(
    orgId: string,
    limit = 100
  ): Promise<AlertEvent[]> {
    try {
      const { data, error } = await supabase
        .from('raas_alert_events')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        analyticsLogger.error('[RaasAlertRules] Get events error:', error)
        return []
      }

      return data as unknown as AlertEvent[]
    } catch (err) {
      analyticsLogger.error('[RaasAlertRules] Get events error:', err)
      return []
    }
  }

  /**
   * Cache rule in KV storage (for edge functions)
   */
  private async cacheRuleInKV(
    orgId: string,
    ruleId: string,
    rule: AlertRuleConfig
  ): Promise<void> {
    // This would use Cloudflare KV in production
    // For now, just log for debugging
    analyticsLogger.debug('[RaasAlertRules] Caching rule in KV', {
      key: getAlertKey(orgId, ruleId),
      ruleId,
      orgId,
    })
  }

  /**
   * Initialize default rules for new organization
   */
  async initializeDefaultRules(orgId: string): Promise<void> {
    const existingRules = await this.getAlertRules(orgId)

    if (existingRules.length === 0) {
      for (const defaultRule of DEFAULT_ALERT_RULES) {
        await this.createAlertRule({
          ...defaultRule,
          org_id: orgId,
        })
      }
      analyticsLogger.info('[RaasAlertRules] Initialized default rules', { orgId })
    }
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Check alert rules for quota usage
 */
export async function checkAlertRules(
  orgId: string,
  currentUsage: number,
  quotaLimit: number
): Promise<AlertEvaluationResult> {
  return raasAlertRules.evaluateQuotaAlert({
    orgId,
    currentUsage,
    quotaLimit,
  })
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const raasAlertRules = new RaasAlertRulesEngine()

export default raasAlertRules
