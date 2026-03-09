---
title: "Phase 6.3: Dashboard Real-time Widget"
description: "Live event feed component, usage chart with Supabase charts, alert badges"
status: pending
priority: P1
effort: 3h
---

# Phase 6.3: Dashboard Real-time Widget

## Overview

Build React dashboard components for real-time analytics visualization including event feed, usage charts, and alert badges.

## Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `RealtimeEventFeed` | Live event stream list | `src/components/analytics/` |
| `UsageChart` | Usage over time chart | `src/components/analytics/` |
| `AlertBadge` | Quota warning indicators | `src/components/analytics/` |
| `AnalyticsDashboard` | Composite dashboard | `src/pages/dashboard/` |

## Implementation Steps

### 1. Real-time Event Feed Component (`src/components/analytics/realtime-event-feed.tsx`)

```typescript
import React from 'react'
import { useRaasRealtimeAnalytics } from '@/hooks/use-raas-realtime-analytics'
import { formatDistanceToNow } from 'date-fns'
import { vi, enUS } from 'date-fns/locale'

interface RealtimeEventFeedProps {
  orgId: string
  locale?: 'vi' | 'en'
  maxEvents?: number
}

const eventIcons: Record<string, string> = {
  suspension_created: '⚠️',
  suspension_cleared: '✅',
  license_expired: '⛔',
  license_validated: '🔑',
  subscription_warning: '⚡',
  feature_used: '🚀',
  quota_check: '📊',
  access_denied: '🚫',
  quota_warning: '🔔',
}

const eventColors: Record<string, string> = {
  suspension_created: 'bg-red-500/20 border-red-500',
  suspension_cleared: 'bg-green-500/20 border-green-500',
  license_expired: 'bg-orange-500/20 border-orange-500',
  license_validated: 'bg-blue-500/20 border-blue-500',
  subscription_warning: 'bg-yellow-500/20 border-yellow-500',
  feature_used: 'bg-purple-500/20 border-purple-500',
  quota_check: 'bg-gray-500/20 border-gray-500',
  access_denied: 'bg-red-500/20 border-red-500',
  quota_warning: 'bg-amber-500/20 border-amber-500',
}

export function RealtimeEventFeed({
  orgId,
  locale = 'en',
  maxEvents = 50,
}: RealtimeEventFeedProps) {
  const { events, connected, error } = useRaasRealtimeAnalytics({
    orgId,
    enabled: true,
  })

  const dateLocale = locale === 'vi' ? vi : enUS

  if (!connected) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full" />
        <span className="ml-2 text-muted-foreground">
          {locale === 'vi' ? 'Đang kết nối...' : 'Connecting...'}
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-500/10 rounded-lg">
        {locale === 'vi' ? 'Lỗi kết nối realtime' : 'Realtime connection error'}
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-[600px] overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-sm text-muted-foreground">
          {locale === 'vi' ? 'Trực tiếp' : 'Live'}
        </span>
      </div>

      {events.slice(0, maxEvents).map((event, index) => (
        <div
          key={event.id || index}
          className={`p-3 rounded-lg border ${
            eventColors[event.event_type] || 'bg-gray-500/10 border-gray-500'
          } transition-all`}
        >
          <div className="flex items-start gap-3">
            <span className="text-xl">{eventIcons[event.event_type] || '📝'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {formatEventType(event.event_type, locale)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(event.timestamp), {
                    addSuffix: true,
                    locale: dateLocale,
                  })}
                </span>
              </div>
              <EventDetails event={event} locale={locale} />
            </div>
          </div>
        </div>
      ))}

      {events.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {locale === 'vi'
            ? 'Chưa có sự kiện nào'
            : 'No events yet'}
        </div>
      )}
    </div>
  )
}

function EventDetails({ event, locale }: { event: any; locale: string }) {
  const details = []

  if (event.reason) {
    details.push(event.reason)
  }
  if (event.feature_name) {
    details.push(`${locale === 'vi' ? 'Tính năng' : 'Feature'}: ${event.feature_name}`)
  }
  if (event.percentage_used) {
    details.push(`${locale === 'vi' ? 'Đã dùng' : 'Used'}: ${event.percentage_used}%`)
  }

  if (details.length === 0) return null

  return (
    <div className="text-xs text-muted-foreground mt-1">
      {details.join(' • ')}
    </div>
  )
}

function formatEventType(type: string, locale: string): string {
  const labels: Record<string, Record<string, string>> = {
    suspension_created: { vi: 'Tạm ngưng', en: 'Suspension Created' },
    suspension_cleared: { vi: 'Khôi phục', en: 'Suspension Cleared' },
    license_expired: { vi: 'Hết hạn license', en: 'License Expired' },
    license_validated: { vi: 'Xác thực license', en: 'License Validated' },
    subscription_warning: { vi: 'Cảnh báo', en: 'Subscription Warning' },
    feature_used: { vi: 'Sử dụng tính năng', en: 'Feature Used' },
    quota_check: { vi: 'Kiểm tra quota', en: 'Quota Check' },
    access_denied: { vi: 'Bị từ chối', en: 'Access Denied' },
    quota_warning: { vi: 'Cảnh báo quota', en: 'Quota Warning' },
  }

  return labels[type]?.[locale] || type
}
```

### 2. Usage Chart Component (`src/components/analytics/usage-chart.tsx`)

```typescript
import React, { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'

interface UsageChartProps {
  data: Array<{
    timestamp: string
    api_calls: number
    ai_calls: number
    tokens: number
  }>
  metricType?: 'api_calls' | 'ai_calls' | 'tokens'
  locale?: 'vi' | 'en'
}

export function UsageChart({
  data,
  metricType = 'api_calls',
  locale = 'en',
}: UsageChartProps) {
  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      time: new Date(d.timestamp).toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }))
  }, [data, locale])

  const labels = {
    api_calls: { vi: 'API Calls', en: 'API Calls' },
    ai_calls: { vi: 'AI Calls', en: 'AI Calls' },
    tokens: { vi: 'Tokens', en: 'Tokens' },
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Area
            type="monotone"
            dataKey={metricType}
            stroke="#8884d8"
            fillOpacity={1}
            fill="url(#colorUsage)"
            name={labels[metricType][locale]}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
```

### 3. Alert Badge Component (`src/components/analytics/alert-badge.tsx`)

```typescript
import React from 'react'

interface AlertBadgeProps {
  percentageUsed: number
  thresholds?: {
    warning: number
    critical: number
  }
  locale?: 'vi' | 'en'
}

export function AlertBadge({
  percentageUsed,
  thresholds = { warning: 90, critical: 95 },
  locale = 'en',
}: AlertBadgeProps) {
  const getStatus = () => {
    if (percentageUsed >= thresholds.critical) return 'critical'
    if (percentageUsed >= thresholds.warning) return 'warning'
    return 'normal'
  }

  const status = getStatus()

  const labels = {
    normal: { vi: 'Bình thường', en: 'Normal' },
    warning: { vi: 'Cảnh báo', en: 'Warning' },
    critical: { vi: 'Nguy hiểm', en: 'Critical' },
  }

  const colors = {
    normal: 'bg-green-500/20 text-green-500 border-green-500',
    warning: 'bg-yellow-500/20 text-yellow-500 border-yellow-500',
    critical: 'bg-red-500/20 text-red-500 border-red-500',
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${colors[status]}`}
    >
      <span className="text-sm font-medium">
        {percentageUsed}%
      </span>
      <span className="text-xs">
        {labels[status][locale]}
      </span>
      {status !== 'normal' && (
        <span className="animate-pulse">●</span>
      )}
    </div>
  )
}
```

### 4. Composite Dashboard (`src/pages/dashboard/analytics.tsx`)

```typescript
import React from 'react'
import { RealtimeEventFeed } from '@/components/analytics/realtime-event-feed'
import { UsageChart } from '@/components/analytics/usage-chart'
import { AlertBadge } from '@/components/analytics/alert-badge'
import { useSubscriptionHealth } from '@/hooks/use-subscription-health'
import { useRaasRealtimeAnalytics } from '@/hooks/use-raas-realtime-analytics'

export default function AnalyticsDashboard() {
  const { health } = useSubscriptionHealth({ orgId: 'current-org' })
  const { events } = useRaasRealtimeAnalytics({ orgId: 'current-org' })

  const latestQuotaWarning = events.find(e => e.event_type === 'quota_warning')

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 rounded-lg bg-card border">
          <h3 className="text-sm font-medium mb-2">
            Usage Health
          </h3>
          <AlertBadge
            percentageUsed={health?.apiCallsPercentage || 0}
          />
        </div>
        {/* More stat cards... */}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Usage Chart */}
        <div className="p-4 rounded-lg bg-card border">
          <h3 className="text-lg font-semibold mb-4">
            Usage Over Time
          </h3>
          <UsageChart data={health?.usageData || []} />
        </div>

        {/* Real-time Feed */}
        <div className="p-4 rounded-lg bg-card border">
          <h3 className="text-lg font-semibold mb-4">
            Live Events
          </h3>
          <RealtimeEventFeed orgId="current-org" />
        </div>
      </div>
    </div>
  )
}
```

## Success Criteria

- [ ] Real-time event feed displays events
- [ ] Usage chart renders with Supabase data
- [ ] Alert badges show correct colors
- [ ] i18n Vietnamese/English support

## Related Files

- Create: `src/components/analytics/realtime-event-feed.tsx`
- Create: `src/components/analytics/usage-chart.tsx`
- Create: `src/components/analytics/alert-badge.tsx`
- Modify: `src/pages/dashboard/analytics.tsx`
