/**
 * RaaS Alert Badge - Phase 6.3
 *
 * Alert badge component for displaying quota, suspension, and license warnings.
 * Supports multiple severity levels with appropriate styling.
 *
 * Features:
 * - Multiple alert levels (warning, critical)
 * - Pulse animation for attention
 * - Dismissible option
 * - i18n support
 * - Aura Elite glassmorphism design
 *
 * @example
 * ```tsx
 * <RaaSAlertBadge level="critical" orgId="org_123" onDismiss={handleDismiss} />
 * ```
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  AlertCircle,
  X,
  ChevronRight,
  Zap,
  ShieldAlert,
  Clock,
} from 'lucide-react'

export interface RaaSAlertBadgeProps {
  /** Alert severity level */
  level: 'warning' | 'critical'
  /** Organization ID for context */
  orgId: string
  /** Optional custom message */
  message?: string
  /** Optional quota percentage (0-100) */
  quotaPercentage?: number
  /** Show dismiss button */
  dismissible?: boolean
  /** Dismiss callback */
  onDismiss?: () => void
  /** View details callback */
  onViewDetails?: () => void
  /** Custom className */
  className?: string
}

/**
 * Alert configuration by level
 */
const ALERT_CONFIGS = {
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    textColor: 'text-orange-400',
    pulseColor: 'animate-pulse-orange',
    label: 'alerts.warning',
  },
  critical: {
    icon: AlertTriangle,
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-400',
    pulseColor: 'animate-pulse-red',
    label: 'alerts.critical',
  },
} as const

export function RaaSAlertBadge({
  level,
  orgId,
  message,
  quotaPercentage,
  dismissible = true,
  onDismiss,
  onViewDetails,
  className,
}: RaaSAlertBadgeProps) {
  const { t } = useTranslation('analytics')
  const [isDismissed, setIsDismissed] = useState(false)

  const config = ALERT_CONFIGS[level]
  const Icon = config.icon

  // Handle dismiss
  const handleDismiss = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setIsDismissed(true)
      onDismiss?.()
    },
    [onDismiss]
  )

  // Get alert message based on context
  const getAlertMessage = useCallback(() => {
    if (message) return message

    if (quotaPercentage) {
      if (quotaPercentage >= 100) {
        return t('alerts.over_quota')
      } else if (quotaPercentage >= 95) {
        return t('alerts.critical') + ` - ${quotaPercentage}%`
      } else if (quotaPercentage >= 90) {
        return t('alerts.approaching_limit') + ` - ${quotaPercentage}%`
      }
    }

    return t('alerts.suspension_warning')
  }, [message, quotaPercentage, t])

  // Don't render if dismissed
  if (isDismissed) {
    return null
  }

  return (
    <div
      className={cn(
        'relative flex items-center gap-3 px-4 py-3 rounded-xl',
        'border backdrop-blur-sm',
        config.bgColor,
        config.borderColor,
        'transition-all duration-300',
        className
      )}
    >
      {/* Icon with pulse effect */}
      <div className="relative">
        <div
          className={cn(
            'absolute inset-0 rounded-full opacity-30',
            config.pulseColor,
            'animate-ping'
          )}
        />
        <div
          className={cn(
            'relative p-2 rounded-lg',
            config.bgColor,
            config.borderColor,
            'border'
          )}
        >
          <Icon className={cn('w-5 h-5', config.textColor)} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-semibold', config.textColor)}>
            {t(config.label)}
          </span>

          {/* Quota indicator bar */}
          {quotaPercentage !== undefined && (
            <div className="flex-1 max-w-[100px] h-1.5 rounded-full bg-gray-700 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  quotaPercentage >= 100 && 'bg-red-500',
                  quotaPercentage >= 95 && 'bg-orange-500',
                  quotaPercentage >= 90 && 'bg-yellow-500',
                  quotaPercentage < 90 && 'bg-emerald-500'
                )}
                style={{ width: `${Math.min(quotaPercentage, 100)}%` }}
              />
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-0.5">
          {getAlertMessage()}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* View details button */}
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium',
              'transition-colors',
              level === 'critical'
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
            )}
          >
            {t('alerts.view_details')}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Dismiss button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              'text-gray-400 hover:text-white hover:bg-white/10'
            )}
            title={t('alerts.dismiss')}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Subtle glow effect */}
      <div
        className={cn(
          'absolute -inset-px rounded-xl opacity-0 hover:opacity-100',
          'transition-opacity duration-500 pointer-events-none',
          level === 'critical'
            ? 'bg-gradient-to-r from-red-500/10 to-orange-500/10 blur-sm'
            : 'bg-gradient-to-r from-orange-500/10 to-yellow-500/10 blur-sm'
        )}
      />
    </div>
  )
}

/**
 * Multi-alert badge container for displaying multiple alerts
 */
export interface RaaSAlertGroupProps {
  /** Organization ID */
  orgId: string
  /** Active alerts configuration */
  alerts: Array<{
    level: 'warning' | 'critical'
    message?: string
    quotaPercentage?: number
    id: string
  }>
  /** Custom className */
  className?: string
}

export function RaaSAlertGroup({
  orgId,
  alerts,
  className,
}: RaaSAlertGroupProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(
    new Set()
  )

  const handleDismiss = useCallback((alertId: string) => {
    setDismissedAlerts((prev) => new Set(prev).add(alertId))
  }, [])

  const visibleAlerts = alerts.filter((alert) => !dismissedAlerts.has(alert.id))

  if (visibleAlerts.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-2', className)}>
      {visibleAlerts.map((alert, index) => (
        <RaaSAlertBadge
          key={alert.id}
          level={alert.level}
          orgId={orgId}
          message={alert.message}
          quotaPercentage={alert.quotaPercentage}
          dismissible
          onDismiss={() => handleDismiss(alert.id)}
        />
      ))}
    </div>
  )
}
