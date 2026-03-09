---
title: "Phase 6.5: i18n 403 UI Messages"
description: "Translation keys for over-quota messages, Vietnamese/English component, upgrade page links"
status: pending
priority: P1
effort: 1.5h
---

# Phase 6.5: i18n 403 UI Messages

## Overview

Add comprehensive i18n translation keys for 403 error states (quota exceeded, subscription suspended, license denied) with Vietnamese/English support and upgrade CTAs.

## Translation Structure

```
raas.403.*         - 403 error messages
raas.quota.*       - Quota-related messages
raas.suspension.*  - Suspension messages
raas.license.*     - License error messages
```

## Implementation Steps

### 1. Vietnamese Translations (`src/locales/vi/raas.ts`)

Add to existing `raas.ts`:

```typescript
export const raas = {
  // ... existing keys ...

  // 403 Error Messages
  403: {
    title: "Yêu cầu bị từ chối",
    description: "Không thể truy cập tài nguyên này",
    back_to_dashboard: "Quay lại Dashboard",
    contact_support: "Liên hệ hỗ trợ",
  },

  // Quota Exceeded
  quota: {
    exceeded: {
      title: "Vượt quá giới hạn",
      message: "Bạn đã vượt quá giới hạn quota của gói hiện tại",
      current_usage: "Mức dùng hiện tại",
      quota_limit: "Giới hạn gói",
      overage: "Vượt quá",
      reset_time: "Đặt lại sau",
      upgrade_cta: "Nâng cấp để tăng giới hạn",
      view_pricing: "Xem bảng giá",
    },
    warning: {
      title: "Cảnh báo giới hạn",
      message: "Bạn đã dùng {{percentage}}% giới hạn",
      remaining: "Còn lại",
      upgrade_recommended: "Nâng cấp để tránh gián đoạn",
    },
    metrics: {
      api_calls: "API Calls",
      ai_calls: "AI Calls",
      tokens: "Tokens",
      storage_gb: "Storage (GB)",
      emails: "Emails",
      compute_minutes: "Compute Minutes",
    },
  },

  // Suspension Messages
  suspension: {
    active: {
      title: "Tạm ngưng dịch vụ",
      message: "Tài khoản của bạn đang bị tạm ngưng",
      reason: "Lý do",
      subscription_status: "Trạng thái gói",
      days_past_due: "Số ngày quá hạn",
      amount_owed: "Số tiền nợ",
      resolve_payment: "Thanh toán để khôi phục",
      contact_billing: "Liên hệ phòng toán",
    },
    grace_period: {
      title: "Thời gian ân hạn",
      message: "Bạn đang trong thời gian ân hạn",
      remaining_hours: "Còn lại {{hours}} giờ",
      resolve_before: "Thanh toán trước khi hết hạn",
    },
    dunning: {
      title: "Nhắc nhở thanh toán",
      message: "Quá trình nhắc nợ đang hoạt động",
      stage: "Giai đoạn",
      stages: {
        soft: "Nhẹ nhàng",
        medium: "Vừa phải",
        hard: "Nghiêm khắc",
      },
    },
  },

  // License Errors
  license: {
    expired: {
      title: "License hết hạn",
      message: "License của bạn đã hết hạn",
      days_expired: "Đã hết hạn {{days}} ngày",
      renew_now: "Gia hạn ngay",
    },
    revoked: {
      title: "License bị thu hồi",
      message: "License đã bị thu hồi",
      contact_admin: "Liên hệ quản trị viên",
    },
    invalid: {
      title: "License không hợp lệ",
      message: "License key không hợp lệ",
      check_key: "Kiểm tra lại license key",
    },
    features: {
      not_included: "Tính năng không bao gồm trong gói",
      upgrade_required: "Yêu cầu nâng cấp gói",
      current_tier: "Gói hiện tại",
      required_tier: "Gói yêu cầu",
    },
  },

  // Upgrade CTAs
  upgrade: {
    title: "Nâng cấp gói",
    description: "Chọn gói phù hợp với nhu cầu của bạn",
    current_plan: "Gói hiện tại",
    recommended_plan: "Gói đề xuất",
    features_included: "Tính năng bao gồm",
    start_trial: "Bắt đầu dùng thử",
    talk_to_sales: "Nói chuyện với sales",
  },
}
```

### 2. English Translations (`src/locales/en/raas.ts`)

```typescript
export const raas = {
  // ... existing keys ...

  // 403 Error Messages
  403: {
    title: "Request Forbidden",
    description: "Cannot access this resource",
    back_to_dashboard: "Back to Dashboard",
    contact_support: "Contact Support",
  },

  // Quota Exceeded
  quota: {
    exceeded: {
      title: "Quota Exceeded",
      message: "You've exceeded your plan quota limit",
      current_usage: "Current Usage",
      quota_limit: "Quota Limit",
      overage: "Overage",
      reset_time: "Resets in",
      upgrade_cta: "Upgrade to increase limits",
      view_pricing: "View Pricing",
    },
    warning: {
      title: "Quota Warning",
      message: "You've used {{percentage}}% of your quota",
      remaining: "Remaining",
      upgrade_recommended: "Upgrade to avoid interruption",
    },
    metrics: {
      api_calls: "API Calls",
      ai_calls: "AI Calls",
      tokens: "Tokens",
      storage_gb: "Storage (GB)",
      emails: "Emails",
      compute_minutes: "Compute Minutes",
    },
  },

  // Suspension Messages
  suspension: {
    active: {
      title: "Service Suspended",
      message: "Your account has been suspended",
      reason: "Reason",
      subscription_status: "Subscription Status",
      days_past_due: "Days Past Due",
      amount_owed: "Amount Owed",
      resolve_payment: "Pay to restore service",
      contact_billing: "Contact Billing",
    },
    grace_period: {
      title: "Grace Period",
      message: "You're in grace period",
      remaining_hours: "{{hours}} hours remaining",
      resolve_before: "Resolve before expiration",
    },
    dunning: {
      title: "Payment Reminder",
      message: "Dunning process is active",
      stage: "Stage",
      stages: {
        soft: "Gentle",
        medium: "Moderate",
        hard: "Aggressive",
      },
    },
  },

  // License Errors
  license: {
    expired: {
      title: "License Expired",
      message: "Your license has expired",
      days_expired: "Expired {{days}} days ago",
      renew_now: "Renew Now",
    },
    revoked: {
      title: "License Revoked",
      message: "License has been revoked",
      contact_admin: "Contact Administrator",
    },
    invalid: {
      title: "Invalid License",
      message: "License key is invalid",
      check_key: "Check your license key",
    },
    features: {
      not_included: "Feature not included in plan",
      upgrade_required: "Plan upgrade required",
      current_tier: "Current Tier",
      required_tier: "Required Tier",
    },
  },

  // Upgrade CTAs
  upgrade: {
    title: "Upgrade Plan",
    description: "Choose a plan that fits your needs",
    current_plan: "Current Plan",
    recommended_plan: "Recommended Plan",
    features_included: "Features Included",
    start_trial: "Start Trial",
    talk_to_sales: "Talk to Sales",
  },
}
```

### 3. 403 Error Page Component (`src/pages/error/403-page.tsx`)

```typescript
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ForbiddenPageProps {
  errorCode?: string
  reason?: string
  details?: {
    daysPastDue?: number
    amountOwed?: number
    gracePeriodRemainingHours?: number
    percentageUsed?: number
    currentUsage?: number
    quotaLimit?: number
    licenseKey?: string
  }
}

export default function ForbiddenPage({
  errorCode,
  reason,
  details,
}: ForbiddenPageProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const locale = i18n.language === 'vi' ? 'vi' : 'en'

  const getPageContent = () => {
    switch (errorCode) {
      case 'quota_exceeded':
        return renderQuotaExceeded()
      case 'subscription_suspended':
        return renderSuspension()
      case 'license_expired':
      case 'license_revoked':
        return renderLicenseError()
      default:
        return renderGeneric()
    }
  }

  const renderQuotaExceeded = () => {
    const percentage = details?.percentageUsed || 100

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="text-3xl">⚠️</span>
            <h1 className="text-2xl font-bold">
              {t('raas.quota.exceeded.title')}
            </h1>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {t('raas.quota.exceeded.message')}
          </p>

          {details && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-sm text-muted-foreground">
                  {t('raas.quota.metrics.api_calls')}
                </div>
                <div className="text-2xl font-bold">
                  {details.currentUsage?.toLocaleString()} / {details.quotaLimit?.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-sm text-muted-foreground">
                  {t('raas.quota.exceeded.overage')}
                </div>
                <div className="text-2xl font-bold text-red-500">
                  {percentage}%
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-sm text-muted-foreground">
                  {t('raas.quota.exceeded.reset_time')}
                </div>
                <div className="text-2xl font-bold">
                  29 {locale === 'vi' ? 'ngày' : 'days'}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={() => navigate('/dashboard/subscription')}>
              {t('raas.quota.exceeded.upgrade_cta')}
            </Button>
            <Button variant="outline" onClick={() => navigate('/pricing')}>
              {t('raas.quota.exceeded.view_pricing')}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderSuspension = () => {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="text-3xl">🚫</span>
            <h1 className="text-2xl font-bold">
              {t('raas.suspension.active.title')}
            </h1>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {t('raas.suspension.active.message')}
          </p>

          {details && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t('raas.suspension.active.reason')}:
                </span>
                <Badge>{reason}</Badge>
              </div>
              {details.daysPastDue !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t('raas.suspension.active.days_past_due')}:
                  </span>
                  <span className="font-medium">{details.daysPastDue}</span>
                </div>
              )}
              {details.amountOwed !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t('raas.suspension.active.amount_owed')}:
                  </span>
                  <span className="font-medium">
                    ${details.amountOwed.toFixed(2)}
                  </span>
                </div>
              )}
              {details.gracePeriodRemainingHours !== undefined && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500">
                  <span className="text-yellow-600">
                    {t('raas.suspension.grace_period.remaining_hours', {
                      hours: Math.round(details.gracePeriodRemainingHours),
                    })}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={() => navigate('/dashboard/billing')}>
              {t('raas.suspension.active.resolve_payment')}
            </Button>
            <Button variant="outline" onClick={() => navigate('/support')}>
              {t('raas.suspension.active.contact_billing')}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderLicenseError = () => {
    const isExpired = errorCode === 'license_expired'

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="text-3xl">🔑</span>
            <h1 className="text-2xl font-bold">
              {t(`raas.license.${isExpired ? 'expired' : 'revoked'}.title`)}
            </h1>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {t(`raas.license.${isExpired ? 'expired' : 'revoked'}.message`)}
          </p>

          {details?.licenseKey && (
            <div className="p-3 rounded-lg bg-mono text-sm font-mono">
              {details.licenseKey.substring(0, 16)}...
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={() => navigate('/dashboard/licenses')}>
              {t('raas.license.expired.renew_now')}
            </Button>
            <Button variant="outline" onClick={() => navigate('/support')}>
              {t('raas.license.revoked.contact_admin')}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderGeneric = () => {
    return (
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">{t('raas.403.title')}</h1>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {t('raas.403.description')}
          </p>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/dashboard')}>
              {t('raas.403.back_to_dashboard')}
            </Button>
            <Button variant="outline" onClick={() => navigate('/support')}>
              {t('raas.403.contact_support')}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {getPageContent()}
      </div>
    </div>
  )
}
```

### 4. Update 403 Response Builder (`src/lib/raas-403-response.ts`)

Enhance existing builder to include translation keys:

```typescript
// Add to existing build403Response function
const body: Record<string, unknown> = {
  error: 'forbidden',
  error_code: `billing_${status.reason || 'unknown'}`,

  // i18n keys for frontend use
  i18n: {
    title_key: getTranslationKey(status.reason, 'title'),
    message_key: getTranslationKey(status.reason, 'message'),
    action_key: getTranslationKey(status.reason, 'action'),
  },

  // Fallback messages (for API clients)
  title: lang.title,
  message: get403Message(status.reason, locale),

  // Details for UI rendering
  details: {
    ...status,
    ...options?.details,
  },

  // Navigation
  actions: [
    {
      text: get403ActionText(status.reason, locale),
      url: getUpgradeUrl(status.reason),
      primary: true,
    },
  ],
}

function getTranslationKey(reason: string, type: string): string {
  const keys: Record<string, Record<string, string>> = {
    subscription_canceled: { title: 'raas.suspension.active.title', message: 'raas.suspension.active.message' },
    subscription_expired: { title: 'raas.license.expired.title', message: 'raas.license.expired.message' },
    payment_past_due: { title: 'raas.suspension.active.title', message: 'raas.suspension.active.message' },
    grace_period_expired: { title: 'raas.suspension.grace_period.title', message: 'raas.suspension.grace_period.message' },
    license_revoked: { title: 'raas.license.revoked.title', message: 'raas.license.revoked.message' },
    license_expired: { title: 'raas.license.expired.title', message: 'raas.license.expired.message' },
    quota_exceeded: { title: 'raas.quota.exceeded.title', message: 'raas.quota.exceeded.message' },
  }
  return keys[reason]?.[type] || `raas.403.${type}`
}

function getUpgradeUrl(reason: string): string {
  const urls: Record<string, string> = {
    subscription_canceled: '/dashboard/subscription',
    subscription_expired: '/dashboard/subscription',
    payment_past_due: '/dashboard/billing',
    grace_period_expired: '/dashboard/billing',
    license_revoked: '/dashboard/licenses',
    license_expired: '/dashboard/licenses',
    quota_exceeded: '/dashboard/subscription',
  }
  return urls[reason] || '/dashboard'
}
```

## Success Criteria

- [ ] All 403 error states have translation keys
- [ ] Vietnamese/English translations complete
- [ ] 403 page component renders with i18n
- [ ] Upgrade CTAs link to correct pages

## Related Files

- Modify: `src/locales/vi/raas.ts`
- Modify: `src/locales/en/raas.ts`
- Create: `src/pages/error/403-page.tsx`
- Modify: `src/lib/raas-403-response.ts`
