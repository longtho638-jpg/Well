---
title: "Phase 6.4: Alerting Rules Engine"
description: "KV storage for alert configs, rules for quota_threshold/feature_blocked/spending_limit, webhooks"
status: pending
priority: P1
effort: 2h
---

# Phase 6.4: Alerting Rules Engine

## Overview

Build configurable alerting rules engine with KV storage for alert configurations, supporting multiple rule types and optional webhook notifications.

## Rule Types

| Rule Type | Trigger | Config |
|-----------|---------|--------|
| `quota_threshold` | Usage > X% | `threshold_percent`, `metric_type` |
| `feature_blocked` | Access denied N times | `count`, `window_minutes` |
| `spending_limit` | Overage cost > $X | `max_cost`, `currency` |
| `suspension_imminent` | Dunning active | `days_past_due` |

## Implementation Steps

### 1. Database Schema (`supabase/migrations/260309_alerting_rules.sql`)

```sql
-- Alert rules configuration table
CREATE TABLE raas_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert history (triggered alerts)
CREATE TABLE raas_alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES raas_alert_rules(id),
  org_id TEXT NOT NULL,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID
);

-- Webhook configurations
CREATE TABLE raas_webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_triggered_at TIMESTAMPTZ,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX idx_alert_rules_org ON raas_alert_rules(org_id, enabled);
CREATE INDEX idx_alert_history_org ON raas_alert_history(org_id, triggered_at DESC);
CREATE INDEX idx_webhooks_org ON raas_webhook_endpoints(org_id, enabled);

-- RLS Policies
ALTER TABLE raas_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE raas_alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE raas_webhook_endpoints ENABLE ROW LEVEL SECURITY;

-- Org members can read/write their rules
CREATE POLICY "Org members can manage alert rules"
  ON raas_alert_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_memberships m
      WHERE m.org_id = (SELECT id FROM organizations WHERE external_id = raas_alert_rules.org_id)
      AND m.user_id = auth.uid()
    )
  );

-- Service role can insert alerts
CREATE POLICY "Service role can insert alerts"
  ON raas_alert_history FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');
```

### 2. Rules Engine Service (`src/lib/raas-alerting-rules-engine.ts`)

```typescript
import { supabase } from '@/lib/supabase'

export interface AlertRule {
  id: string
  org_id: string
  rule_type: string
  rule_name: string
  enabled: boolean
  config: AlertConfig
}

export interface AlertConfig {
  threshold_percent?: number
  metric_type?: string
  count?: number
  window_minutes?: number
  max_cost?: number
  currency?: string
  days_past_due?: number
  webhook_url?: string
}

export interface TriggeredAlert {
  id: string
  rule_id: string
  org_id: string
  triggered_at: string
  severity: 'info' | 'warning' | 'critical'
  message: string
  metadata?: Record<string, any>
}

export class RaasAlertingRulesEngine {
  private readonly orgId: string
  private ruleCache: Map<string, AlertRule[]> = new Map()
  private readonly CACHE_TTL_MS = 60 * 1000 // 1 minute

  constructor(orgId: string) {
    this.orgId = orgId
  }

  /**
   * Check if alert should be triggered
   */
  async checkRules(context: AlertContext): Promise<TriggeredAlert[]> {
    const rules = await this.getActiveRules()
    const triggered: TriggeredAlert[] = []

    for (const rule of rules) {
      const result = await this.evaluateRule(rule, context)
      if (result.shouldTrigger) {
        const alert = await this.triggerAlert(rule, result)
        triggered.push(alert)
      }
    }

    return triggered
  }

  /**
   * Evaluate a single rule
   */
  private async evaluateRule(
    rule: AlertRule,
    context: AlertContext
  ): Promise<EvaluationResult> {
    switch (rule.rule_type) {
      case 'quota_threshold':
        return this.evaluateQuotaThreshold(rule, context)
      case 'feature_blocked':
        return this.evaluateFeatureBlocked(rule, context)
      case 'spending_limit':
        return this.evaluateSpendingLimit(rule, context)
      case 'suspension_imminent':
        return this.evaluateSuspensionImminent(rule, context)
      default:
        return { shouldTrigger: false }
    }
  }

  private evaluateQuotaThreshold(
    rule: AlertRule,
    context: AlertContext
  ): EvaluationResult {
    const { threshold_percent = 90, metric_type = 'api_calls' } = rule.config

    const currentUsage = context.usageMetrics?.[metric_type] || 0
    const quota = context.quotas?.[metric_type] || 0
    const percentageUsed = quota > 0 ? Math.round((currentUsage / quota) * 100) : 0

    if (percentageUsed >= threshold_percent) {
      return {
        shouldTrigger: true,
        severity: percentageUsed >= 95 ? 'critical' : 'warning',
        message: `Usage at ${percentageUsed}% for ${metric_type}`,
        metadata: { percentageUsed, threshold: threshold_percent, metric_type },
      }
    }

    return { shouldTrigger: false }
  }

  private async evaluateFeatureBlocked(
    rule: AlertRule,
    context: AlertContext
  ): Promise<EvaluationResult> {
    const { count = 3, window_minutes = 60 } = rule.config

    // Check access denied events in window
    const windowStart = new Date(Date.now() - window_minutes * 60 * 1000)

    const { data } = await supabase
      .from('raas_analytics_events')
      .select('id')
      .eq('org_id', this.orgId)
      .eq('event_type', 'access_denied')
      .gte('timestamp', windowStart.toISOString())

    const deniedCount = data?.length || 0

    if (deniedCount >= count) {
      return {
        shouldTrigger: true,
        severity: 'warning',
        message: `${deniedCount} access denials in last ${window_minutes} minutes`,
        metadata: { count: deniedCount, window: window_minutes },
      }
    }

    return { shouldTrigger: false }
  }

  private evaluateSpendingLimit(
    rule: AlertRule,
    context: AlertContext
  ): EvaluationResult {
    const { max_cost = 100, currency = 'USD' } = rule.config
    const currentCost = context.overageCost || 0

    if (currentCost >= max_cost) {
      return {
        shouldTrigger: true,
        severity: 'critical',
        message: `Overage cost $${currentCost} exceeds limit $${max_cost}`,
        metadata: { currentCost, max_cost, currency },
      }
    }

    return { shouldTrigger: false }
  }

  private evaluateSuspensionImminent(
    rule: AlertRule,
    context: AlertContext
  ): EvaluationResult {
    const { days_past_due = 5 } = rule.config
    const dunningDays = context.dunningDays || 0

    if (dunningDays >= days_past_due) {
      return {
        shouldTrigger: true,
        severity: 'critical',
        message: `Suspension imminent: ${dunningDays} days past due`,
        metadata: { dunningDays, threshold: days_past_due },
      }
    }

    return { shouldTrigger: false }
  }

  /**
   * Trigger alert and send webhook
   */
  private async triggerAlert(
    rule: AlertRule,
    result: EvaluationResult
  ): Promise<TriggeredAlert> {
    // Insert alert history
    const { data, error } = await supabase
      .from('raas_alert_history')
      .insert({
        rule_id: rule.id,
        org_id: this.orgId,
        severity: result.severity,
        message: result.message,
        metadata: result.metadata,
      })
      .select()
      .single()

    if (error) {
      console.error('[AlertingRules] Failed to insert alert:', error)
      throw error
    }

    // Send webhook notifications
    await this.sendWebhookNotifications(data as TriggeredAlert, rule)

    return data as TriggeredAlert
  }

  /**
   * Send webhook notifications
   */
  private async sendWebhookNotifications(
    alert: TriggeredAlert,
    rule: AlertRule
  ): Promise<void> {
    const { data: webhooks } = await supabase
      .from('raas_webhook_endpoints')
      .select('*')
      .eq('org_id', this.orgId)
      .eq('enabled', true)
      .contains('events', [rule.rule_type])

    if (!webhooks || webhooks.length === 0) return

    for (const webhook of webhooks) {
      try {
        await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(webhook.secret && {
              'X-Webhook-Signature': await this.signWebhook(alert, webhook.secret),
            }),
          },
          body: JSON.stringify({
            event: 'alert.triggered',
            alert,
            rule,
            timestamp: new Date().toISOString(),
          }),
        })

        // Update webhook stats
        await supabase
          .from('raas_webhook_endpoints')
          .update({
            last_triggered_at: new Date().toISOString(),
            success_count: webhook.success_count + 1,
          })
          .eq('id', webhook.id)
      } catch (err) {
        console.error('[AlertingRules] Webhook failed:', err)
        await supabase
          .from('raas_webhook_endpoints')
          .update({ failure_count: webhook.failure_count + 1 })
          .eq('id', webhook.id)
      }
    }
  }

  /**
   * Sign webhook payload
   */
  private async signWebhook(
    alert: TriggeredAlert,
    secret: string
  ): Promise<string> {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(JSON.stringify(alert))
    )
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  /**
   * Get active rules for org
   */
  private async getActiveRules(): Promise<AlertRule[]> {
    const cached = this.ruleCache.get(this.orgId)
    if (cached && Date.now() < this.CACHE_TTL_MS) {
      return cached
    }

    const { data, error } = await supabase
      .from('raas_alert_rules')
      .select('*')
      .eq('org_id', this.orgId)
      .eq('enabled', true)

    if (error) {
      console.error('[AlertingRules] Failed to fetch rules:', error)
      return []
    }

    const rules = (data as AlertRule[]) || []
    this.ruleCache.set(this.orgId, rules)

    return rules
  }

  /**
   * Create alert rule
   */
  async createRule(
    ruleType: string,
    ruleName: string,
    config: AlertConfig
  ): Promise<AlertRule> {
    const { data, error } = await supabase
      .from('raas_alert_rules')
      .insert({
        org_id: this.orgId,
        rule_type: ruleType,
        rule_name: ruleName,
        config,
      })
      .select()
      .single()

    if (error) throw error

    // Invalidate cache
    this.ruleCache.delete(this.orgId)

    return data as AlertRule
  }

  /**
   * Delete alert rule
   */
  async deleteRule(ruleId: string): Promise<void> {
    await supabase
      .from('raas_alert_rules')
      .delete()
      .eq('id', ruleId)
      .eq('org_id', this.orgId)

    this.ruleCache.delete(this.orgId)
  }
}

interface AlertContext {
  usageMetrics?: Record<string, number>
  quotas?: Record<string, number>
  overageCost?: number
  dunningDays?: number
}

interface EvaluationResult {
  shouldTrigger: boolean
  severity?: 'info' | 'warning' | 'critical'
  message?: string
  metadata?: Record<string, any>
}

export const raasAlertingRulesEngine = RaasAlertingRulesEngine
```

### 3. Default Rules Presets (`src/lib/raas-default-alert-rules.ts`)

```typescript
import type { AlertConfig } from './raas-alerting-rules-engine'

export const DEFAULT_ALERT_RULES: Array<{
  rule_type: string
  rule_name: string
  config: AlertConfig
}> = [
  {
    rule_type: 'quota_threshold',
    rule_name: '90% Usage Warning',
    config: { threshold_percent: 90, metric_type: 'api_calls' },
  },
  {
    rule_type: 'quota_threshold',
    rule_name: '95% Usage Critical',
    config: { threshold_percent: 95, metric_type: 'api_calls' },
  },
  {
    rule_type: 'feature_blocked',
    rule_name: 'Multiple Access Denials',
    config: { count: 3, window_minutes: 60 },
  },
  {
    rule_type: 'spending_limit',
    rule_name: 'Overage Cost Alert',
    config: { max_cost: 50, currency: 'USD' },
  },
  {
    rule_type: 'suspension_imminent',
    rule_name: 'Suspension Warning',
    config: { days_past_due: 5 },
  },
]
```

## Success Criteria

- [ ] 4 rule types implemented
- [ ] KV storage for configs working
- [ ] Webhook notifications functional
- [ ] Default rules presets available

## Related Files

- Create: `supabase/migrations/260309_alerting_rules.sql`
- Create: `src/lib/raas-alerting-rules-engine.ts`
- Create: `src/lib/raas-default-alert-rules.ts`
