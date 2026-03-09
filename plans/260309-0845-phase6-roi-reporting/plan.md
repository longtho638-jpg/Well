---
title: "Phase 6: Automated ROI Reporting & Alerting"
description: "Cloudflare Worker scheduled task for daily usage aggregation, ROI metrics calculation, email/webhook digests, and anomaly detection alerts"
status: in_progress
progress: 0%
priority: P1
effort: 4h
branch: main
tags: [roi, reporting, analytics, cloudflare-worker, phase-6]
created: 2026-03-09
---

# Phase 6: Automated ROI Reporting & Alerting

## Overview

| Attribute | Value |
|-----------|-------|
| **Phase** | 6 (Analytics & Observability) |
| **Priority** | P1 - Critical for customer retention |
| **Effort** | 4 hours |
| **Status** | 🟡 In Progress |
| **Owner** | Fullstack Developer |

## Executive Summary

Build automated ROI reporting system that:
1. Aggregates daily usage data from Cloudflare KV (Phase 4)
2. Computes ROI metrics using license-tier pricing from Stripe
3. Delivers digest reports via email/webhook to agency admins
4. Detects anomalies (usage spikes, negative ROI) with real-time alerts
5. Complies with RaaS Gateway auth (JWT + mk_ API key)
6. Reuses AgencyOS dashboard UI components

---

## Implementation Plan

### Phase 6.1: Cloudflare Worker Scheduled Task (1h)

**Goal:** Create cron-triggered Worker that aggregates daily usage

**Files to Create:**
- `workers/roi-digest-worker/src/index.ts` - Main Worker entry
- `workers/roi-digest-worker/wrangler.toml` - Worker config
- `workers/roi-digest-worker/src/aggregator.ts` - Usage aggregation logic

**Cron Schedule:**
```toml
# wrangler.toml
[triggers]
crons = ["0 0 * * *"]  # Daily at midnight UTC
```

**Key Functions:**
```typescript
// Aggregate daily usage per org
aggregateDailyUsage(orgId: string, date: string): Promise<DailyUsage>

// Get all active orgs with licenses
getActiveOrganizations(): Promise<Organization[]>
```

---

### Phase 6.2: ROI Metrics Calculator (1h)

**Goal:** Compute ROI from usage + Stripe pricing data

**Files to Create:**
- `workers/roi-digest-worker/src/roi-calculator.ts` - ROI computation
- `workers/roi-digest-worker/src/types.ts` - TypeScript interfaces

**ROI Formula:**
```typescript
ROI = (Revenue Generated - Platform Cost) / Platform Cost * 100

Where:
- Revenue Generated = API calls * $/call + AI calls * $/AI + etc.
- Platform Cost = Subscription tier + Overage charges
```

**Metrics to Calculate:**
| Metric | Formula | Target |
|--------|---------|--------|
| `roi_percentage` | (Revenue - Cost) / Cost * 100 | > 100% |
| `cost_per_api_call` | Total Cost / API Calls | < $0.001 |
| `revenue_per_user` | Total Revenue / Active Users | > $10/user |
| `utilization_rate` | Actual Usage / Quota | 70-90% |
| `anomaly_score` | Z-score of usage spike | < 2.0 |

---

### Phase 6.3: Email/Webhook Digest Delivery (1h)

**Goal:** Send daily ROI digest to agency admins

**Files to Create:**
- `workers/roi-digest-worker/src/email-template.tsx` - Email template
- `workers/roi-digest-worker/src/delivery.ts` - Send email/webhook

**Email Template Sections:**
1. **Header:** Org name, date, ROI score (color-coded)
2. **Key Metrics:** 4 tiles (ROI%, Cost/Call, Revenue/User, Utilization)
3. **Usage Trends:** 7-day chart (line graph)
4. **Anomalies:** Red flags if any detected
5. **CTA:** "View Full Dashboard" button

**Delivery Channels:**
- **Email:** Resend API (already configured)
- **Webhook:** POST to AgencyOS webhook endpoint
- **In-App:** Store in `roi_digests` table for dashboard display

---

### Phase 6.4: Anomaly Detection & Alerts (1h)

**Goal:** Detect and alert on unusual patterns

**Files to Create:**
- `workers/roi-digest-worker/src/anomaly-detector.ts` - Alert logic

**Detection Rules:**
| Rule | Threshold | Alert Level |
|------|-----------|-------------|
| Usage spike | > 3σ from 30-day avg | 🔴 Critical |
| Negative ROI | ROI < 0% for 3 days | 🟠 Warning |
| Quota breach | Usage > 95% of quota | 🟡 Info |
| Cost spike | Cost > 2x daily avg | 🟠 Warning |

**Alert Actions:**
- Email immediately (not batched)
- Webhook to incident management
- Log to `anomaly_alerts` table

---

## Database Schema

### `roi_digests` Table
```sql
CREATE TABLE roi_digests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  digest_date DATE NOT NULL,
  roi_percentage NUMERIC,
  cost_per_api_call NUMERIC,
  revenue_per_user NUMERIC,
  utilization_rate NUMERIC,
  anomaly_score NUMERIC,
  total_api_calls BIGINT,
  total_ai_calls BIGINT,
  total_cost NUMERIC,
  total_revenue NUMERIC,
  email_sent BOOLEAN DEFAULT FALSE,
  webhook_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, digest_date)
);

CREATE INDEX idx_roi_digests_org_date ON roi_digests(org_id, digest_date DESC);
```

### `anomaly_alerts` Table
```sql
CREATE TABLE anomaly_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  alert_type TEXT NOT NULL, -- 'usage_spike', 'negative_roi', 'quota_breach', 'cost_spike'
  alert_level TEXT NOT NULL, -- 'critical', 'warning', 'info'
  metric_name TEXT,
  metric_value NUMERIC,
  threshold_value NUMERIC,
  description TEXT,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_anomaly_alerts_org_created ON anomaly_alerts(org_id, created_at DESC);
CREATE INDEX idx_anomaly_alerts_unacked ON anomaly_alerts(org_id) WHERE acknowledged = FALSE;
```

---

## API Integration

### RaaS Gateway Auth

```typescript
// JWT + mk_ API key verification
const auth = {
  Authorization: `Bearer ${jwtToken}`,
  'X-API-Key': `mk_${apiKey}`
}

// Worker validates on incoming webhook triggers
function verifyAuth(request: Request): boolean {
  const apiKey = request.headers.get('X-API-Key')
  if (!apiKey?.startsWith('mk_')) return false
  // Validate against KV store
  return true
}
```

### Stripe Pricing Sync

```typescript
// Get org's subscription tier pricing
async function getTierPricing(orgId: string): Promise<TierPricing> {
  // Fetch from Stripe via Edge Function
  const response = await supabase.functions.invoke('get-stripe-pricing', {
    body: { org_id: orgId }
  })
  return response.data
}
```

---

## Success Criteria

- [ ] Worker runs daily at midnight UTC without errors
- [ ] ROI digests sent to 100% of active orgs
- [ ] Anomaly alerts triggered within 5 minutes of detection
- [ ] Email open rate > 40%
- [ ] Webhook delivery success rate > 99%
- [ ] False positive anomaly rate < 5%

---

## Testing Strategy

### Unit Tests
- ROI calculation formulas
- Anomaly detection thresholds
- Email template rendering

### Integration Tests
- Worker cron trigger (local Wrangler)
- Supabase insert/query
- Resend email sending

### E2E Tests
- Full daily digest flow
- Alert delivery end-to-end

---

## Deployment Checklist

- [ ] Worker deployed to Cloudflare
- [ ] Cron trigger configured
- [ ] Database migrations applied
- [ ] Resend API key configured
- [ ] Webhook endpoints tested
- [ ] First digest received successfully

---

## References

- **Phase 4:** Usage metering (Cloudflare KV)
- **Phase 3:** Stripe pricing sync
- **RaaS Gateway:** Auth middleware
- **AgencyOS Dashboard:** UI components

---

_Plan Created: 2026-03-09 | Status: 🟡 In Progress_
