/**
 * RaaS 403 Response Builder - Phase 6.3
 *
 * Builds standardized 403 Forbidden responses for license/billing suspension.
 * Includes i18n support (vi/en) and detailed error metadata.
 *
 * Usage:
 *   import { build403Response, get403Message } from '@/lib/raas-403-response'
 *
 *   const response = build403Response(suspensionStatus, locale)
 *   return response
 */

import type { SuspensionStatus, SuspensionReason } from '@/lib/raas-suspension-logic'

/**
 * i18n message catalog for 403 responses
 */
const messages = {
  vi: {
    title: 'Yêu cầu bị từ chối',
    subscription_canceled: 'Gói đăng ký đã bị hủy',
    subscription_expired: 'Gói đăng ký đã hết hạn',
    payment_past_due: 'Thanh toán quá hạn',
    dunning_active: 'Quá trình nhắc nợ đang hoạt động',
    grace_period_expired: 'Thời gian ân hạn đã hết',
    license_revoked: 'Giấy phép đã bị thu hồi',
    license_expired: 'Giấy phép đã hết hạn',
    non_payment: 'Không nhận được thanh toán',
    default: 'Yêu cầu bị từ chối do vấn đề thanh toán',
    daysPastDue: 'Số ngày quá hạn',
    amountOwed: 'Số tiền nợ',
    gracePeriodRemaining: 'Thời gian ân hạn còn lại',
    hours: 'giờ',
    upgradeUrl: '/dashboard/billing',
    documentationUrl: '/docs/billing/suspension',
    retryAfter: 'Vui lòng thử lại sau',
    contactSupport: 'Liên hệ hỗ trợ',
    upgradePlan: 'Nâng cấp gói',
    resolvePayment: 'Giải quyết thanh toán',
  },
  en: {
    title: 'Request Forbidden',
    subscription_canceled: 'Subscription has been canceled',
    subscription_expired: 'Subscription has expired',
    payment_past_due: 'Payment is past due',
    dunning_active: 'Dunning process is active',
    grace_period_expired: 'Grace period has expired',
    license_revoked: 'License has been revoked',
    license_expired: 'License has expired',
    non_payment: 'Payment not received',
    default: 'Request forbidden due to billing issue',
    daysPastDue: 'Days past due',
    amountOwed: 'Amount owed',
    gracePeriodRemaining: 'Grace period remaining',
    hours: 'hours',
    upgradeUrl: '/dashboard/billing',
    documentationUrl: '/docs/billing/suspension',
    retryAfter: 'Please try again after',
    contactSupport: 'Contact Support',
    upgradePlan: 'Upgrade Plan',
    resolvePayment: 'Resolve Payment',
  },
} as const

/**
 * Get localized message for suspension reason
 */
export function get403Message(
  reason: SuspensionReason | null,
  locale: 'vi' | 'en' = 'en'
): string {
  const lang = messages[locale]

  if (!reason) {
    return lang.default
  }

  return lang[reason] || lang.default
}

/**
 * Get action button text for suspension reason
 */
export function get403ActionText(
  reason: SuspensionReason | null,
  locale: 'vi' | 'en' = 'en'
): string {
  const lang = messages[locale]

  switch (reason) {
    case 'license_revoked':
    case 'license_expired':
    case 'subscription_canceled':
    case 'subscription_expired':
      return locale === 'vi' ? lang.upgradePlan : lang.upgradePlan
    case 'payment_past_due':
    case 'dunning_active':
    case 'grace_period_expired':
    case 'non_payment':
      return locale === 'vi' ? lang.resolvePayment : lang.resolvePayment
    default:
      return locale === 'vi' ? lang.contactSupport : lang.contactSupport
  }
}

/**
 * Build 403 Forbidden response for suspension
 *
 * @param status - Suspension status from checkSuspensionStatus()
 * @param locale - Locale for i18n messages ('vi' | 'en')
 * @param options - Optional response configuration
 * @returns HTTP Response with 403 status and JSON body
 */
export function build403Response(
  status: SuspensionStatus,
  locale: 'vi' | 'en' = 'en',
  options?: {
    /** Include detailed metadata (default: true) */
    includeDetails?: boolean
    /** Custom upgrade URL */
    upgradeUrl?: string
    /** Custom documentation URL */
    documentationUrl?: string
  }
): Response {
  const lang = messages[locale]
  const includeDetails = options?.includeDetails ?? true

  // Build response body
  const body: Record<string, unknown> = {
    error: 'forbidden',
    error_code: `billing_${status.reason || 'unknown'}`,
    title: lang.title,
    message: get403Message(status.reason, locale),
    locale,
  }

  // Add detailed metadata
  if (includeDetails) {
    const details: Record<string, unknown> = {
      reason: status.reason,
      subscriptionStatus: status.subscriptionStatus,
      daysPastDue: status.daysPastDue,
      amountOwed: status.amountOwed,
      dunningStage: status.dunningStage,
      gracePeriodRemainingHours: status.gracePeriodRemainingHours
        ? `${Math.round(status.gracePeriodRemainingHours)} ${lang.hours}`
        : undefined,
      adminBypassAvailable: status.adminBypassAvailable,
    }

    // Remove undefined fields
    Object.keys(details).forEach((key) => {
      if (details[key] === undefined) {
        delete details[key]
      }
    })

    body.details = details
  }

  // Add action buttons
  body.actions = [
    {
      text: get403ActionText(status.reason, locale),
      url: options?.upgradeUrl || lang.upgradeUrl,
      primary: true,
    },
    {
      text: locale === 'vi' ? lang.contactSupport : lang.contactSupport,
      url: '/support',
      primary: false,
    },
  ]

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-RaaS-Error': 'billing_suspension',
    'X-RaaS-Reason': status.reason || 'unknown',
    'X-RaaS-Status': status.subscriptionStatus,
    'Accept-Language': locale,
  }

  // Add retry-after if grace period is active
  if (status.gracePeriodRemainingHours && status.gracePeriodRemainingHours > 0) {
    const retrySeconds = Math.round(status.gracePeriodRemainingHours * 3600)
    headers['Retry-After'] = String(retrySeconds)
  }

  // Add documentation link
  if (options?.documentationUrl || locale) {
    headers['Link'] = `<${options?.documentationUrl || lang.documentationUrl}>; rel="help"`
  }

  return new Response(JSON.stringify(body, null, 2), {
    status: 403,
    headers,
  })
}

/**
 * Build 403 response for license-specific errors
 */
export function buildLicense403Response(
  reason: 'revoked' | 'expired' | 'invalid',
  locale: 'vi' | 'en' = 'en'
): Response {
  const suspensionReason: SuspensionReason =
    reason === 'revoked' ? 'license_revoked' :
    reason === 'expired' ? 'license_expired' : 'license_revoked'

  const status: SuspensionStatus = {
    shouldSuspend: true,
    reason: suspensionReason,
    message: get403Message(suspensionReason, locale),
    daysPastDue: 0,
    amountOwed: 0,
    subscriptionStatus: 'none',
    adminBypassAvailable: false,
  }

  return build403Response(status, locale)
}

/**
 * Build 403 response for billing-specific errors
 */
export function buildBilling403Response(
  reason: SuspensionReason,
  details: {
    daysPastDue?: number
    amountOwed?: number
    dunningStage?: string
    gracePeriodRemainingHours?: number
  },
  locale: 'vi' | 'en' = 'en'
): Response {
  const status: SuspensionStatus = {
    shouldSuspend: true,
    reason,
    message: get403Message(reason, locale),
    daysPastDue: details.daysPastDue || 0,
    amountOwed: details.amountOwed || 0,
    subscriptionStatus: 'past_due',
    dunningStage: details.dunningStage,
    gracePeriodRemainingHours: details.gracePeriodRemainingHours,
    adminBypassAvailable: false,
  }

  return build403Response(status, locale)
}

/**
 * Get i18n labels for UI components
 */
export function get403Labels(locale: 'vi' | 'en' = 'en') {
  return messages[locale]
}

/**
 * Format amount for display
 */
export function formatAmount(amount: number, currency: string = 'USD', locale: 'vi' | 'en' = 'en'): string {
  const localeMap = { vi: 'vi-VN', en: 'en-US' }
  return new Intl.NumberFormat(localeMap[locale], {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * 403 Response Builder Service
 */
export const raas403Response = {
  build403Response,
  buildLicense403Response,
  buildBilling403Response,
  get403Message,
  get403ActionText,
  get403Labels,
  formatAmount,
}

export default raas403Response
