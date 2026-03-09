/**
 * License Enforcement Library
 *
 * Core license validation logic for RaaS Gateway proxy layer.
 * Provides enforcement decisions based on license status and usage.
 *
 * Features:
 * - License expiry validation
 * - Quota limit checking
 * - Feature access verification
 * - Enforcement action determination (ALLOW, BLOCK, WARN)
 * - Configurable enforcement modes
 *
 * Usage:
 *   const enforcement = new LicenseEnforcement({
 *     mode: 'strict' | 'permissive' | 'warn_only'
 *   })
 *
 *   const action = enforcement.getAction(license, usage)
 *   if (action === 'BLOCK') {
 *     // Deny request
 *   }
 */

export interface License {
  id: string
  orgId: string
  tier: string
  status: 'active' | 'revoked' | 'expired' | 'suspended' | 'trial'
  features: Record<string, boolean>
  issuedAt: string
  expiresAt?: string
  metadata?: Record<string, any>
}

export interface TierLimits {
  rateLimitPerMinute: number
  monthlyTokenQuota: number
  overageAllowed: boolean
  overageRatePerUnit: number
  allowedFeatures: string[]
  maxConcurrentRequests?: number
  maxDailyRequests?: number
}

export interface UsageStatus {
  currentUsage: number
  quotaLimit: number
  remaining: number
  percentageUsed: number
  isOverLimit: boolean
  overageUnits: number
  overageCost: number
  dailyUsage?: number
  concurrentRequests?: number
}

export type EnforcementAction = 'ALLOW' | 'BLOCK' | 'WARN'

export interface EnforcementDecision {
  action: EnforcementAction
  reason: string
  code?: string
  retryAfter?: number
  metadata?: Record<string, any>
}

export interface LicenseEnforcementConfig {
  mode?: 'strict' | 'permissive' | 'warn_only'
  overageBlockThreshold?: number // Block at X% over quota (default: 150%)
  warnThreshold?: number // Warn at X% quota used (default: 80%)
  gracePeriodHours?: number // Grace period after expiry (default: 24h)
}

export class LicenseEnforcement {
  private readonly mode: 'strict' | 'permissive' | 'warn_only'
  private readonly overageBlockThreshold: number
  private readonly warnThreshold: number
  private readonly gracePeriodHours: number

  private readonly tierLimits: Record<string, TierLimits> = {
    free: {
      rateLimitPerMinute: 10,
      monthlyTokenQuota: 10_000,
      overageAllowed: false,
      overageRatePerUnit: 0,
      allowedFeatures: ['basic_agents', 'community_support'],
      maxConcurrentRequests: 2,
      maxDailyRequests: 100,
    },
    basic: {
      rateLimitPerMinute: 60,
      monthlyTokenQuota: 100_000,
      overageAllowed: false,
      overageRatePerUnit: 0,
      allowedFeatures: ['basic_agents', 'premium_agents', 'email_support'],
      maxConcurrentRequests: 5,
      maxDailyRequests: 1000,
    },
    pro: {
      rateLimitPerMinute: 300,
      monthlyTokenQuota: 1_000_000,
      overageAllowed: true,
      overageRatePerUnit: 0.0005,
      allowedFeatures: ['basic_agents', 'premium_agents', 'advanced_analytics', 'priority_support'],
      maxConcurrentRequests: 20,
      maxDailyRequests: 10000,
    },
    enterprise: {
      rateLimitPerMinute: 1000,
      monthlyTokenQuota: 10_000_000,
      overageAllowed: true,
      overageRatePerUnit: 0.0003,
      allowedFeatures: ['basic_agents', 'premium_agents', 'advanced_analytics', 'custom_integrations', 'dedicated_support'],
      maxConcurrentRequests: 100,
      maxDailyRequests: 100000,
    },
    master: {
      rateLimitPerMinute: 5000,
      monthlyTokenQuota: 100_000_000,
      overageAllowed: true,
      overageRatePerUnit: 0.0001,
      allowedFeatures: ['all'],
      maxConcurrentRequests: 500,
      maxDailyRequests: 1000000,
    },
  }

  constructor(config: LicenseEnforcementConfig = {}) {
    this.mode = config.mode || 'strict'
    this.overageBlockThreshold = config.overageBlockThreshold || 150
    this.warnThreshold = config.warnThreshold || 80
    this.gracePeriodHours = config.gracePeriodHours || 24
  }

  /**
   * Check if license is expired
   *
   * @param license - License to check
   * @returns true if expired
   */
  isExpired(license: License): boolean {
    if (!license.expiresAt) {
      // No expiry date = never expires (unless revoked)
      return license.status === 'expired'
    }

    const now = new Date()
    const expiresAt = new Date(license.expiresAt)

    // Apply grace period
    const gracePeriodEnd = new Date(expiresAt.getTime() + (this.gracePeriodHours * 60 * 60 * 1000))

    return now > gracePeriodEnd || license.status === 'expired'
  }

  /**
   * Check if license is revoked or suspended
   *
   * @param license - License to check
   * @returns true if revoked or suspended
   */
  isRevoked(license: License): boolean {
    return license.status === 'revoked' || license.status === 'suspended'
  }

  /**
   * Check if over quota
   *
   * @param usage - Current usage status
   * @param limits - Tier limits
   * @returns true if over quota
   */
  isOverQuota(usage: UsageStatus, limits: TierLimits): boolean {
    // Check if usage exceeds quota
    if (usage.isOverLimit) {
      // If overage is allowed, check if within threshold
      if (limits.overageAllowed) {
        const overagePercentage = ((usage.currentUsage - usage.quotaLimit) / usage.quotaLimit) * 100
        return overagePercentage > this.overageBlockThreshold
      }
      // Overage not allowed - any over limit is blocked
      return true
    }
    return false
  }

  /**
   * Check if feature access is allowed
   *
   * @param license - License to check
   * @param feature - Feature name to check
   * @returns true if feature is allowed
   */
  hasFeature(license: License, feature: string): boolean {
    // Check if feature is explicitly enabled
    if (license.features[feature]) {
      return true
    }

    // Check if feature is in tier's allowed features
    const tierLimits = this.tierLimits[license.tier]
    if (tierLimits?.allowedFeatures?.includes('all')) {
      return true // Master tier has all features
    }

    if (tierLimits?.allowedFeatures?.includes(feature)) {
      return true
    }

    // Check if feature is a basic feature (always allowed)
    const basicFeatures = ['basic_agents', 'community_support']
    if (basicFeatures.includes(feature)) {
      return true
    }

    return false
  }

  /**
   * Check rate limit
   *
   * @param usage - Current usage status
   * @param limits - Tier limits
   * @returns true if rate limit exceeded
   */
  isRateLimitExceeded(usage: UsageStatus, limits: TierLimits): boolean {
    // Check concurrent requests
    if (limits.maxConcurrentRequests && usage.concurrentRequests) {
      if (usage.concurrentRequests > limits.maxConcurrentRequests) {
        return true
      }
    }

    // Check daily requests
    if (limits.maxDailyRequests && usage.dailyUsage) {
      if (usage.dailyUsage > limits.maxDailyRequests) {
        return true
      }
    }

    return false
  }

  /**
   * Get enforcement action based on license and usage
   *
   * Decision tree:
   * 1. Revoked/Suspended → BLOCK
   * 2. Expired (past grace period) → BLOCK
   * 3. Over quota (no overage allowed) → BLOCK
   * 4. Over quota (overage allowed but exceeds threshold) → BLOCK
   * 5. Rate limit exceeded → BLOCK
   * 6. Quota usage >= warn threshold → WARN
   * 7. All checks pass → ALLOW
   *
   * @param license - License to validate
   * @param usage - Current usage status
   * @returns EnforcementDecision with action and reason
   */
  getAction(license: License, usage: UsageStatus): EnforcementDecision {
    const limits = this.tierLimits[license.tier] || this.tierLimits['basic']

    // Mode: warn_only - always allow, just warn
    if (this.mode === 'warn_only') {
      if (this.isExpired(license)) {
        return {
          action: 'WARN',
          reason: 'License đã hết hạn (warn-only mode)',
          code: 'license_expired_warn',
          metadata: { expiresAt: license.expiresAt },
        }
      }
      if (this.isOverQuota(usage, limits)) {
        return {
          action: 'WARN',
          reason: 'Đã vượt quota sử dụng (warn-only mode)',
          code: 'quota_exceeded_warn',
          metadata: { ...usage },
        }
      }
      return {
        action: 'ALLOW',
        reason: 'All checks passed (warn-only mode)',
      }
    }

    // Mode: permissive - allow overage more generously
    const effectiveOverageThreshold = this.mode === 'permissive'
      ? this.overageBlockThreshold * 1.5
      : this.overageBlockThreshold

    // Check 1: Revoked/Suspended → BLOCK
    if (this.isRevoked(license)) {
      return {
        action: 'BLOCK',
        reason: `License đã bị ${license.status === 'revoked' ? 'thu hồi' : 'đình chỉ'}`,
        code: 'license_revoked',
        retryAfter: undefined, // No retry - contact support
      }
    }

    // Check 2: Expired → BLOCK
    if (this.isExpired(license)) {
      const hoursUntilGraceEnd = this.getHoursUntilGraceEnd(license)
      return {
        action: 'BLOCK',
        reason: `License đã hết hạn ${hoursUntilGraceEnd > 0 ? `(còn ${hoursUntilGraceEnd.toFixed(1)}h gia hạn)` : ''}`,
        code: 'license_expired',
        retryAfter: hoursUntilGraceEnd > 0 ? hoursUntilGraceEnd * 3600 : undefined,
        metadata: { expiresAt: license.expiresAt, gracePeriodHours: this.gracePeriodHours },
      }
    }

    // Check 3: Over quota (no overage allowed) → BLOCK
    if (this.isOverQuota(usage, limits) && !limits.overageAllowed) {
      return {
        action: 'BLOCK',
        reason: `Đã vượt quota (${usage.percentageUsed.toFixed(1)}%). Vui lòng nâng cấp gói.`,
        code: 'quota_exceeded_no_overage',
        retryAfter: 2592000, // 30 days (next billing cycle)
        metadata: { ...usage, tier: license.tier },
      }
    }

    // Check 4: Over quota exceeds threshold → BLOCK
    if (this.isOverQuota(usage, limits) && limits.overageAllowed) {
      const overagePercentage = ((usage.currentUsage - usage.quotaLimit) / usage.quotaLimit) * 100
      if (overagePercentage > effectiveOverageThreshold) {
        return {
          action: 'BLOCK',
          reason: `Đã vượt quá ngưỡng overage cho phép (${overagePercentage.toFixed(1)}% > ${effectiveOverageThreshold}%)`,
          code: 'overage_threshold_exceeded',
          retryAfter: 86400, // 24 hours
          metadata: { ...usage, overagePercentage, threshold: effectiveOverageThreshold },
        }
      }
    }

    // Check 5: Rate limit exceeded → BLOCK
    if (this.isRateLimitExceeded(usage, limits)) {
      return {
        action: 'BLOCK',
        reason: 'Vượt quá giới hạn rate limit',
        code: 'rate_limit_exceeded',
        retryAfter: 60, // 1 minute
        metadata: {
          concurrentRequests: usage.concurrentRequests,
          maxConcurrent: limits.maxConcurrentRequests,
          dailyUsage: usage.dailyUsage,
          maxDaily: limits.maxDailyRequests,
        },
      }
    }

    // Check 6: Quota usage >= warn threshold → WARN
    if (usage.percentageUsed >= this.warnThreshold) {
      const retryAfter = usage.isOverLimit ? (usage.remaining > 0 ? 3600 : 86400) : undefined
      return {
        action: 'WARN',
        reason: `Cảnh báo: Đã sử dụng ${usage.percentageUsed.toFixed(1)}% quota (${usage.currentUsage.toLocaleString()} / ${usage.quotaLimit.toLocaleString()})`,
        code: 'quota_warning',
        retryAfter,
        metadata: { ...usage, warnThreshold: this.warnThreshold },
      }
    }

    // Check 7: All checks pass → ALLOW
    return {
      action: 'ALLOW',
      reason: 'All checks passed',
      metadata: {
        tier: license.tier,
        quotaRemaining: usage.remaining,
        features: Object.keys(license.features).filter(f => license.features[f]),
      },
    }
  }

  /**
   * Get tier limits
   */
  getTierLimits(tier: string): TierLimits {
    return this.tierLimits[tier] || this.tierLimits['basic']
  }

  /**
   * Get hours until grace period ends
   */
  private getHoursUntilGraceEnd(license: License): number {
    if (!license.expiresAt) return 0

    const expiresAt = new Date(license.expiresAt)
    const gracePeriodEnd = new Date(expiresAt.getTime() + (this.gracePeriodHours * 60 * 60 * 1000))
    const now = new Date()

    const hoursLeft = (gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60)
    return Math.max(0, hoursLeft)
  }

  /**
   * Calculate overage cost
   */
  calculateOverageCost(usage: UsageStatus, tier: string): number {
    const limits = this.tierLimits[tier]
    if (!limits.overageAllowed) return 0

    return usage.overageUnits * limits.overageRatePerUnit
  }

  /**
   * Get enforcement summary for dashboard
   */
  getEnforcementSummary(license: License, usage: UsageStatus): {
    status: 'healthy' | 'warning' | 'critical' | 'blocked'
    action: EnforcementAction
    issues: string[]
    recommendations: string[]
  } {
    const decision = this.getAction(license, usage)
    const issues: string[] = []
    const recommendations: string[] = []

    // Determine status
    let status: 'healthy' | 'warning' | 'critical' | 'blocked' = 'healthy'

    if (decision.action === 'BLOCK') {
      status = 'blocked'
      issues.push(decision.reason)

      if (decision.code === 'license_expired') {
        recommendations.push('Gia hạn license để tiếp tục sử dụng')
      } else if (decision.code?.includes('quota')) {
        recommendations.push(`Nâng cấp gói ${license.tier === 'free' ? 'lên Basic' : license.tier === 'basic' ? 'lên Pro' : 'của bạn'}`)
      }
    } else if (decision.action === 'WARN') {
      status = 'warning'
      issues.push(decision.reason)

      if (usage.percentageUsed >= this.warnThreshold) {
        recommendations.push('Theo dõi sát sao usage để tránh vượt quota')
        if (!this.tierLimits[license.tier].overageAllowed) {
          recommendations.push('Xem xét nâng cấp gói để được overage')
        }
      }
    } else if (usage.percentageUsed >= 50) {
      status = 'healthy'
      if (usage.percentageUsed >= 70) {
        status = 'warning'
      }
    }

    return {
      status,
      action: decision.action,
      issues,
      recommendations,
    }
  }
}

/**
 * Default enforcement instance (strict mode)
 */
export const defaultEnforcement = new LicenseEnforcement({ mode: 'strict' })

export default LicenseEnforcement
