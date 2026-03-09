# ROI Digest Worker - Phase 6: Anomaly Detection & Alerting

Cloudflare Worker for real-time usage anomaly detection and ROI reporting.

## Features

- **Anomaly Detection**: Z-score statistical analysis (>3σ = critical)
- **Multi-Metric Support**: api_calls, ai_calls, tokens, compute_minutes, etc.
- **Rolling Windows**: 1h, 24h, 7d statistical baselines
- **Real-Time Alerts**: Webhook to AgencyOS dashboard
- **Audit Logging**: R2 storage for compliance
- **RaaS Gateway Auth**: JWT + mk_ API key verification

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Cloudflare Worker                          │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │ Anomaly     │  │ ROI          │  │ Alert           │    │
│  │ Detector    │  │ Calculator   │  │ Delivery        │    │
│  └──────┬──────┘  └──────────────┘  └────────┬────────┘    │
│         │                                     │              │
│  ┌──────▼──────┐                       ┌─────▼────────┐    │
│  │ USAGE_KV    │                       │ ALERTS_R2    │    │
│  │ (cache)     │                       │ (audit log)  │    │
│  └─────────────┘                       └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
         │                                     │
         ▼                                     ▼
┌─────────────────┐                  ┌────────────────────────┐
│ Supabase        │                  │ AgencyOS Dashboard     │
│ - anomaly_alerts│                  │ - Webhook receiver     │
│ - roi_digests   │                  │ - Real-time alerts     │
│ - usage_metrics │                  └────────────────────────┘
└─────────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
cd workers/roi-digest-worker
pnpm install
```

### 2. Configure Secrets

```bash
# Set required secrets
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put RESEND_API_KEY
wrangler secret put JWT_SECRET

# Set KV and R2 bindings
wrangler kv:namespace create USAGE_KV
wrangler r2 bucket create anomaly-alerts-audit
```

### 3. Deploy

```bash
# Deploy to staging
wrangler deploy

# Deploy to production
wrangler deploy --env production
```

### 4. Verify Deployment

```bash
# Health check
curl https://roi-digest-worker.<subdomain>.workers.dev/health \
  -H "X-API-Key: mk_your_api_key"

# Trigger anomaly detection
curl -X POST https://roi-digest-worker.<subdomain>.workers.dev/anomaly/detect \
  -H "X-API-Key: mk_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"window": "1h", "metrics": ["api_calls", "ai_calls"]}'
```

## API Endpoints

### POST /anomaly/detect

Trigger anomaly detection for calling organization.

**Request:**
```json
{
  "window": "1h",
  "metrics": ["api_calls", "ai_calls", "tokens"]
}
```

**Response:**
```json
{
  "detected": 2,
  "alerts": [
    {
      "id": "uuid",
      "alert_level": "critical",
      "metric_name": "api_calls",
      "description": "CRITICAL: API calls spike of 250% detected (3.2σ from normal)"
    }
  ]
}
```

### POST /anomaly/:id/acknowledge

Acknowledge an alert.

**Response:**
```json
{ "success": true }
```

### GET /anomaly

List alerts for organization.

**Query Params:**
- `limit` (default: 20)
- `unacknowledged=true` (filter to unacked only)

**Response:**
```json
{
  "alerts": [
    {
      "id": "uuid",
      "alert_type": "usage_spike",
      "alert_level": "critical",
      "metric_name": "api_calls",
      "metric_value": 15000,
      "threshold_value": 5000,
      "z_score": 3.2,
      "acknowledged": false,
      "created_at": "2026-03-09T08:00:00Z"
    }
  ]
}
```

## Detection Algorithms

### Z-Score Detection

```typescript
Z = (X - μ) / σ

Where:
- X = current value
- μ = rolling mean
- σ = rolling stddev

Thresholds:
- |Z| > 2.0 → info
- |Z| > 2.5 → warning
- |Z| > 3.0 → critical
```

### IQR Outlier Detection

```typescript
IQR = Q3 - Q1

Lower Bound = Q1 - 1.5 * IQR
Upper Bound = Q3 + 1.5 * IQR

Outlier if: X < Lower Bound OR X > Upper Bound
```

## Alert Severity

| Level | Z-Score | Action |
|-------|---------|--------|
| info | > 2.0σ | Log only |
| warning | > 2.5σ or IQR outlier | Webhook + email |
| critical | > 3.0σ | Webhook + email + SMS |

## Cron Schedule

| Task | Schedule | Description |
|------|----------|-------------|
| Anomaly Detection | `*/5 * * * *` | Every 5 minutes |
| ROI Digest | `0 0 * * *` | Daily at midnight UTC |
| Cleanup Old Alerts | `0 3 * * *` | Daily at 3 AM (90-day retention) |

## Database Schema

See `supabase/migrations/2603090846_phase6_anomaly_detection_schema.sql`

Key tables:
- `anomaly_alerts` - Alert records with acknowledgment tracking
- `roi_digests` - Daily ROI metrics per organization

## Monitoring

### Worker Logs

```bash
wrangler tail roi-digest-worker
```

### Key Metrics

- **Detection Latency**: < 100ms per org
- **Alert Delivery**: < 1s to webhook
- **False Positive Rate**: < 5%
- **Coverage**: 100% of active orgs

## Troubleshooting

### Common Issues

**1. "API key not found"**
- Ensure API key starts with `mk_`
- Check key exists in `raas_licenses` table

**2. "KV namespace not found"**
- Run `wrangler kv:namespace create USAGE_KV`
- Update ID in wrangler.toml

**3. "R2 bucket access denied"**
- Run `wrangler r2 bucket create anomaly-alerts-audit`
- Check bucket permissions

## References

- Phase 4: Usage Metering (Cloudflare KV)
- Phase 5: Analytics Dashboard
- Phase 7: Overage Billing
- RaaS Gateway: Auth middleware

---

_Deployed: 2026-03-09 | Version: 6.0.0_
