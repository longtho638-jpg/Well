---
title: "Phase 2: Anomaly Detection & Alerting"
description: "Detect usage spikes, drops, and unusual patterns with multi-channel alerting"
status: pending
priority: P1
effort: 4h
branch: main
tags: [anomaly-detection, alerting, monitoring, observability]
created: 2026-03-09
---

# Phase 2: Anomaly Detection & Alerting

## Overview

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 - Security & fraud detection |
| **Effort** | 4 hours |
| **Status** | Pending |
| **Dependencies** | Usage metering, notification service |

## Context Links

- Parent Plan: `../plan.md`
- Related Code: `src/services/usage-notification-service.ts`
- Related Code: `src/lib/usage-alert-engine.ts`
- Related Code: `src/services/usage-forecast-service.ts`

## Key Insights

From existing alert system:
- Threshold alerts at 80%/90%/100% work well
- Need proactive anomaly detection (spikes, drops)
- Multi-channel alerts (email/SMS/webhook) proven
- Admin dashboard needed for visibility

## Requirements

### Functional Requirements

1. **Spike Detection**
   - Detect usage >3x baseline (7-day rolling avg)
   - Configurable threshold per org
   - Alert within 5 minutes of detection

2. **Drop Detection**
   - Detect usage <0.3x baseline
   - Could indicate service issues
   - Alert for significant drops

3. **License Key Mismatch Alerts**
   - Track failed license validations
   - Alert after 5 failures in 1 hour
   - Include IP, key prefix in alert

4. **JWT Auth Failure Monitoring**
   - Track JWT validation failures
   - Alert after 10 failures in 5 minutes
   - Detect potential brute force attacks

5. **KV Rate Limit Breach**
   - Monitor Gateway KV rate limits
   - Alert when >100 requests/min
   - Auto-throttle if breach continues

6. **Multi-Channel Notifications**
   - Email via Resend
   - SMS via Twilio
   - Webhook to AgencyOS

### Non-Functional Requirements

- Detection latency: <5 minutes
- False positive rate: <5%
- Alert deduplication (cooldown period)
- Configurable rules via UI (future)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Usage Event (API call, AI call, token usage, etc.)          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  AnomalyDetectionService.check()                             │
│  - Update rolling baseline (7-day avg)                       │
│  - Calculate z-score for current value                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Alert Rules Engine                                          │
│  - Evaluate against configured rules                         │
│  - Check cooldown period                                     │
│  - Determine action (alert/throttle/suspend)                 │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│  Send Alert             │     │  Take Action            │
│  - Email (Resend)       │     │  - Throttle request     │
│  - SMS (Twilio)         │     │  - Suspend temporarily  │
│  - Webhook (AgencyOS)   │     │  - Log for review       │
└─────────────────────────┘     └─────────────────────────┘
```

## Alert Rules Configuration

```typescript
interface AnomalyRule {
  id: string
  name: string
  metricType: AlertMetricType
  condition: 'spike' | 'drop' | 'threshold_breach' | 'pattern_anomaly'
  threshold: number
  window: '1m' | '5m' | '1h' | '6h' | '24h'
  baseline: '1h_avg' | '6h_avg' | '24h_avg' | '7d_avg'
  action: 'alert' | 'throttle' | 'suspend' | 'log'
  channels: ('email' | 'sms' | 'webhook')[]
  cooldownMinutes: number
  enabled: boolean
}

const defaultRules: AnomalyRule[] = [
  // Usage spike detection
  {
    id: 'usage_spike',
    name: 'Usage Spike Detection',
    metricType: 'all',
    condition: 'spike',
    threshold: 3.0,  // 3x baseline
    window: '1h',
    baseline: '7d_avg',
    action: 'alert',
    channels: ['email', 'webhook'],
    cooldownMinutes: 60,
    enabled: true,
  },
  // Usage drop detection
  {
    id: 'usage_drop',
    name: 'Usage Drop Detection',
    metricType: 'all',
    condition: 'drop',
    threshold: 0.3,  // 0.3x baseline
    window: '6h',
    baseline: '7d_avg',
    action: 'alert',
    channels: ['email'],
    cooldownMinutes: 120,
    enabled: true,
  },
  // License key mismatch
  {
    id: 'license_mismatch',
    name: 'License Key Mismatch',
    metricType: 'license_validations',
    condition: 'threshold_breach',
    threshold: 5,  // 5 failures
    window: '1h',
    baseline: 'count',
    action: 'alert',
    channels: ['sms', 'webhook'],
    cooldownMinutes: 30,
    enabled: true,
  },
  // JWT auth failures
  {
    id: 'jwt_auth_failures',
    name: 'JWT Auth Failures',
    metricType: 'auth_failures',
    condition: 'threshold_breach',
    threshold: 10,  // 10 failures
    window: '5m',
    baseline: 'count',
    action: 'alert',
    channels: ['email', 'sms'],
    cooldownMinutes: 15,
    enabled: true,
  },
  // KV rate limit breach
  {
    id: 'kv_rate_limit',
    name: 'KV Rate Limit Breach',
    metricType: 'gateway_requests',
    condition: 'threshold_breach',
    threshold: 100,  // 100 requests/min
    window: '1m',
    baseline: 'count',
    action: 'throttle',
    channels: ['webhook'],
    cooldownMinutes: 5,
    enabled: true,
  },
]
```

## Related Code Files

### Files to Create
- `src/services/anomaly-detection-service.ts`
- `src/lib/alert-rules-engine.ts`
- `supabase/functions/send-anomaly-alert/index.ts`
- `src/components/admin/AnomalyDashboard.tsx`
- `src/__tests__/anomaly-detection-service.test.ts`
- `src/__tests__/alert-rules-engine.test.ts`
- `supabase/migrations/260309-anomaly-rules.sql`

### Files to Modify
- `src/lib/usage-alert-engine.ts` - Integrate anomaly detection
- `src/services/usage-notification-service.ts` - Add anomaly channel

## Implementation Steps

### Step 1: Database Schema (30 min)

```sql
-- supabase/migrations/260309-anomaly-rules.sql

-- Anomaly detection rules
CREATE TABLE anomaly_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  condition TEXT CHECK (condition IN ('spike', 'drop', 'threshold_breach', 'pattern_anomaly')),
  threshold DECIMAL(10,4) NOT NULL,
  window TEXT CHECK (window IN ('1m', '5m', '1h', '6h', '24h')),
  baseline TEXT,
  action TEXT CHECK (action IN ('alert', 'throttle', 'suspend', 'log')),
  channels TEXT[] DEFAULT '{}',
  cooldown_minutes INTEGER DEFAULT 60,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Anomaly events (audit trail)
CREATE TABLE anomaly_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  user_id UUID,
  rule_id UUID REFERENCES anomaly_rules(id),
  metric_type TEXT NOT NULL,
  detected_value DECIMAL(20,4) NOT NULL,
  baseline_value DECIMAL(20,4),
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  action_taken TEXT,
  channels_sent TEXT[],
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_anomaly_events_org_created ON anomaly_events(org_id, created_at DESC);
CREATE INDEX idx_anomaly_events_severity ON anomaly_events(severity);
CREATE INDEX idx_anomaly_events_resolved ON anomaly_events(resolved);

-- Insert default rules
INSERT INTO anomaly_rules (name, metric_type, condition, threshold, window, baseline, action, channels, cooldown_minutes) VALUES
  ('Usage Spike Detection', 'api_calls', 'spike', 3.0, '1h', '7d_avg', 'alert', '{"email","webhook"}', 60),
  ('Usage Drop Detection', 'api_calls', 'drop', 0.3, '6h', '7d_avg', 'alert', '{"email"}', 120),
  ('License Key Mismatch', 'license_validations', 'threshold_breach', 5, '1h', 'count', 'alert', '{"sms","webhook"}', 30),
  ('JWT Auth Failures', 'auth_failures', 'threshold_breach', 10, '5m', 'count', 'alert', '{"email","sms"}', 15),
  ('KV Rate Limit Breach', 'gateway_requests', 'threshold_breach', 100, '1m', 'count', 'throttle', '{"webhook"}', 5);
```

### Step 2: Anomaly Detection Service (2h)

```typescript
// src/services/anomaly-detection-service.ts

import type { SupabaseClient } from '@supabase/supabase-js'
import { analyticsLogger } from '@/utils/logger'

export type AnomalyCondition = 'spike' | 'drop' | 'threshold_breach' | 'pattern_anomaly'
export type AnomalyAction = 'alert' | 'throttle' | 'suspend' | 'log'
export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical'

export interface AnomalyRule {
  id: string
  name: string
  metricType: string
  condition: AnomalyCondition
  threshold: number
  window: string
  baseline: string
  action: AnomalyAction
  channels: string[]
  cooldownMinutes: number
  enabled: boolean
}

export interface AnomalyEvent {
  orgId: string
  userId?: string
  ruleId: string
  metricType: string
  detectedValue: number
  baselineValue?: number
  severity: AnomalySeverity
  actionTaken: string
  channelsSent: string[]
  metadata?: Record<string, unknown>
}

export interface AnomalyDetectionResult {
  anomalyDetected: boolean
  rule?: AnomalyRule
  severity?: AnomalySeverity
  action?: AnomalyAction
  baseline?: number
  zScore?: number
}

export class AnomalyDetectionService {
  private supabase: SupabaseClient
  private readonly DEFAULT_BASELINE_DAYS = 7
  private readonly SPIKE_THRESHOLD = 3.0
  private readonly DROP_THRESHOLD = 0.3

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  /**
   * Check if current usage is anomalous
   */
  async checkAnomaly(
    orgId: string,
    metricType: string,
    currentValue: number
  ): Promise<AnomalyDetectionResult> {
    try {
      // Get historical baseline
      const baseline = await this.getBaseline(orgId, metricType)

      if (baseline === 0) {
        return { anomalyDetected: false }
      }

      // Calculate z-score
      const zScore = this.calculateZScore(currentValue, baseline)

      // Check for spike
      if (currentValue / baseline >= this.SPIKE_THRESHOLD) {
        return {
          anomalyDetected: true,
          severity: 'high',
          action: 'alert',
          baseline,
          zScore,
        }
      }

      // Check for drop
      if (currentValue / baseline <= this.DROP_THRESHOLD) {
        return {
          anomalyDetected: true,
          severity: 'medium',
          action: 'alert',
          baseline,
          zScore,
        }
      }

      return { anomalyDetected: false, baseline, zScore }
    } catch (error) {
      analyticsLogger.error('[AnomalyDetection] checkAnomaly error', error)
      return { anomalyDetected: false }
    }
  }

  /**
   * Check against configured rules
   */
  async checkRules(
    orgId: string,
    metricType: string,
    value: number,
    windowValue: number
  ): Promise<AnomalyRule[]> {
    try {
      // Fetch active rules for org
      const { data: rules } = await this.supabase
        .from('anomaly_rules')
        .select('*')
        .eq('org_id', orgId)
        .eq('enabled', true)
        .or(`metric_type.eq.${metricType},metric_type.eq.all`)

      if (!rules || rules.length === 0) {
        return []
      }

      const triggeredRules: AnomalyRule[] = []

      for (const rule of rules) {
        if (this.evaluateRule(rule, value, windowValue)) {
          triggeredRules.push(rule)
        }
      }

      return triggeredRules
    } catch (error) {
      analyticsLogger.error('[AnomalyDetection] checkRules error', error)
      return []
    }
  }

  /**
   * Evaluate a single rule
   */
  private evaluateRule(
    rule: AnomalyRule,
    currentValue: number,
    windowValue: number
  ): boolean {
    const { condition, threshold, baseline } = rule

    switch (condition) {
      case 'spike':
        return currentValue >= baseline * threshold
      case 'drop':
        return currentValue <= baseline * threshold
      case 'threshold_breach':
        return windowValue >= threshold
      case 'pattern_anomaly':
        // More complex pattern detection (future)
        return false
      default:
        return false
    }
  }

  /**
   * Get rolling baseline average
   */
  private async getBaseline(
    orgId: string,
    metricType: string,
    days: number = this.DEFAULT_BASELINE_DAYS
  ): Promise<number> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data } = await this.supabase
        .from('usage_records')
        .select('quantity, recorded_at')
        .eq('org_id', orgId)
        .eq('feature', this.mapMetricToFeature(metricType))
        .gte('recorded_at', startDate.toISOString())

      if (!data || data.length === 0) {
        return 0
      }

      // Calculate daily averages, then average those
      const byDay = new Map<string, number>()
      data.forEach((r) => {
        const date = r.recorded_at.slice(0, 10)
        byDay.set(date, (byDay.get(date) || 0) + r.quantity)
      })

      const dailyValues = Array.from(byDay.values())
      const avg = dailyValues.reduce((s, v) => s + v, 0) / dailyValues.length

      return avg
    } catch (error) {
      analyticsLogger.error('[AnomalyDetection] getBaseline error', error)
      return 0
    }
  }

  /**
   * Calculate z-score
   */
  private calculateZScore(value: number, baseline: number): number {
    if (baseline === 0) return 0
    return (value - baseline) / baseline
  }

  /**
   * Log anomaly event
   */
  async logAnomalyEvent(event: AnomalyEvent): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('anomaly_events')
        .insert({
          org_id: event.orgId,
          user_id: event.userId,
          rule_id: event.ruleId,
          metric_type: event.metricType,
          detected_value: event.detectedValue,
          baseline_value: event.baselineValue,
          severity: event.severity,
          action_taken: event.actionTaken,
          channels_sent: event.channelsSent,
          metadata: event.metadata,
        })
        .select('id')
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      analyticsLogger.error('[AnomalyDetection] logAnomalyEvent error', error)
      return ''
    }
  }

  /**
   * Map metric type to feature name
   */
  private mapMetricToFeature(metricType: string): string {
    const mapping: Record<string, string> = {
      api_calls: 'api_call',
      ai_calls: 'ai_call',
      tokens: 'tokens',
      compute_minutes: 'compute_ms',
    }
    return mapping[metricType] || metricType
  }
}

export default AnomalyDetectionService
```

### Step 3: Alert Rules Engine (1h)

```typescript
// src/lib/alert-rules-engine.ts

import { AnomalyRule, AnomalyEvent, AnomalyDetectionResult } from '@/services/anomaly-detection-service'
import { UsageNotificationService } from '@/services/usage-notification-service'
import { analyticsLogger } from '@/utils/logger'

export interface AlertContext {
  orgId: string
  userId?: string
  metricType: string
  currentValue: number
  baseline?: number
  rule?: AnomalyRule
  detectionResult: AnomalyDetectionResult
}

export interface AlertResult {
  alertSent: boolean
  channels: string[]
  eventId?: string
  actionTaken?: string
}

export class AlertRulesEngine {
  private notificationService: UsageNotificationService
  private readonly COOLDOWN_CHECK_WINDOW = 60  // minutes

  constructor(notificationService: UsageNotificationService) {
    this.notificationService = notificationService
  }

  /**
   * Process anomaly and trigger alerts/actions
   */
  async processAnomaly(context: AlertContext): Promise<AlertResult> {
    const { orgId, userId, metricType, currentValue, baseline, rule, detectionResult } = context

    try {
      // Check cooldown period
      const canAlert = await this.checkCooldown(orgId, metricType)
      if (!canAlert) {
        analyticsLogger.debug('[AlertRulesEngine] Cooldown active', { orgId, metricType })
        return { alertSent: false, channels: [] }
      }

      // Determine severity
      const severity = detectionResult.severity || 'medium'

      // Determine action
      const action = detectionResult.action || 'alert'

      // Execute action
      let actionTaken: string | undefined
      if (action === 'throttle') {
        actionTaken = await this.throttleOrg(orgId)
      } else if (action === 'suspend') {
        actionTaken = await this.suspendOrg(orgId)
      }

      // Send alert
      const channels = rule?.channels || ['email']
      const alertSent = await this.sendAlert({
        orgId,
        userId,
        metricType,
        currentValue,
        baseline,
        severity,
        channels,
      })

      // Log event
      const eventId = await this.logEvent({
        orgId,
        userId,
        ruleId: rule?.id || '',
        metricType,
        detectedValue: currentValue,
        baselineValue: baseline,
        severity,
        actionTaken: actionTaken || action,
        channelsSent: alertSent ? channels : [],
      })

      return {
        alertSent,
        channels: alertSent ? channels : [],
        eventId,
        actionTaken,
      }
    } catch (error) {
      analyticsLogger.error('[AlertRulesEngine] processAnomaly error', error)
      return { alertSent: false, channels: [] }
    }
  }

  /**
   * Check cooldown period
   */
  private async checkCooldown(orgId: string, metricType: string): Promise<boolean> {
    try {
      const { data } = await this.supabase
        .from('anomaly_events')
        .select('created_at')
        .eq('org_id', orgId)
        .eq('metric_type', metricType)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!data) return true

      const lastAlert = new Date(data.created_at).getTime()
      const cooldownEnd = lastAlert + (this.COOLDOWN_CHECK_WINDOW * 60 * 1000)

      return Date.now() >= cooldownEnd
    } catch (error) {
      return true
    }
  }

  /**
   * Send multi-channel alert
   */
  private async sendAlert(params: {
    orgId: string
    userId?: string
    metricType: string
    currentValue: number
    baseline?: number
    severity: string
    channels: string[]
  }): Promise<boolean> {
    // Build alert message
    const message = this.buildAlertMessage(params)

    // Send via configured channels
    for (const channel of params.channels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmail(params.orgId, message)
            break
          case 'sms':
            await this.sendSMS(params.orgId, message)
            break
          case 'webhook':
            await this.sendWebhook(params.orgId, message)
            break
        }
      } catch (error) {
        analyticsLogger.error('[AlertRulesEngine] sendAlert channel error', { channel, error })
      }
    }

    return true
  }

  /**
   * Build alert message
   */
  private buildAlertMessage(params: {
    metricType: string
    currentValue: number
    baseline?: number
    severity: string
  }): string {
    const { metricType, currentValue, baseline, severity } = params

    if (baseline && baseline > 0) {
      const changePercent = ((currentValue - baseline) / baseline * 100).toFixed(1)
      return `ANOMALY ALERT [${severity.toUpperCase()}]: ${metricType} spike detected - ${currentValue} (${changePercent}% above baseline ${baseline})`
    }

    return `ANOMALY ALERT [${severity.toUpperCase()}]: ${metricType} threshold breached - ${currentValue}`
  }

  /**
   * Throttle organization API access
   */
  private async throttleOrg(orgId: string): Promise<string> {
    try {
      await this.supabase
        .from('organizations')
        .update({
          rate_limit_override: 50,  // Reduce to 50 req/min
          rate_limit_until: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        })
        .eq('id', orgId)

      return 'throttled_to_50_rpm'
    } catch (error) {
      analyticsLogger.error('[AlertRulesEngine] throttleOrg error', error)
      return 'throttle_failed'
    }
  }

  /**
   * Suspend organization access
   */
  private async suspendOrg(orgId: string): Promise<string> {
    try {
      await this.supabase
        .from('organizations')
        .update({ status: 'suspended' })
        .eq('id', orgId)

      return 'suspended'
    } catch (error) {
      analyticsLogger.error('[AlertRulesEngine] suspendOrg error', error)
      return 'suspend_failed'
    }
  }

  /**
   * Log anomaly event
   */
  private async logEvent(event: AnomalyEvent): Promise<string> {
    // Implementation similar to AnomalyDetectionService.logAnomalyEvent
    return ''
  }

  /**
   * Send email alert
   */
  private async sendEmail(orgId: string, message: string): Promise<void> {
    // Get org admin email
    const { data: org } = await this.supabase
      .from('organizations')
      .select('admin_email')
      .eq('id', orgId)
      .single()

    if (org?.admin_email) {
      await this.notificationService.sendViaEmail({
        to: org.admin_email,
        // ... other params
      })
    }
  }

  /**
   * Send SMS alert
   */
  private async sendSMS(orgId: string, message: string): Promise<void> {
    // Implementation
  }

  /**
   * Send webhook alert
   */
  private async sendWebhook(orgId: string, message: string): Promise<void> {
    // Get org webhook URL from metadata
    const { data: org } = await this.supabase
      .from('organizations')
      .select('metadata')
      .eq('id', orgId)
      .single()

    const webhookUrl = org?.metadata?.webhook_url

    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'anomaly_alert', message, orgId }),
      })
    }
  }
}

export default AlertRulesEngine
```

## Success Criteria

- [ ] Spike detection working (>3x baseline triggers)
- [ ] Drop detection working (<0.3x baseline triggers)
- [ ] License mismatch alerts working
- [ ] JWT auth failure alerts working
- [ ] KV rate limit alerts working
- [ ] Multi-channel notifications (email/SMS/webhook)
- [ ] Admin dashboard displays anomalies
- [ ] Cooldown prevents alert spam
- [ ] Unit tests pass (>90% coverage)

## Todo List

- [ ] Create database schema for rules and events
- [ ] Implement AnomalyDetectionService
- [ ] Implement AlertRulesEngine
- [ ] Create Edge Function for alerts
- [ ] Build AnomalyDashboard component
- [ ] Write unit tests
- [ ] Configure default rules

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| False positive alerts | Medium | Configurable thresholds, cooldown |
| Alert fatigue | Medium | Severity levels, deduplication |
| Baseline calculation expensive | Low | Cache baseline, incremental update |

---

_Created: 2026-03-09 | Status: Pending | Priority: P1_
