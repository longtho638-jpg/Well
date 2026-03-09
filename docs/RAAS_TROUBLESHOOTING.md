# RaaS Gateway Troubleshooting Playbook

> Common issues, root causes, and resolution steps for RaaS Gateway integration.

---

## Quick Reference

| Symptom | Likely Cause | First Step |
|---------|--------------|------------|
| JWT token expired | Token cache stale | Check `getValidToken()` auto-refresh |
| Usage not syncing | Network/Gateway down | Check `gateway_sync_queue` table |
| Overage not calculated | Missing quota config | Verify `quotas` table |
| Dunning emails failing | Resend API key missing | Check `RESEND_API_KEY` env var |
| Rate limit breaches | KV storage issue | Check Cloudflare Worker logs |
| Reconciliation alerts | >5% Gateway vs Stripe | Check `reconciliation_log` |

---

## Issue 1: JWT Token Expired

### Symptoms
```
401 Unauthorized: JWT token expired
```

### Root Causes
1. Token cached beyond expiry time
2. Clock skew between server and client
3. Token not refreshed before API call

### Resolution

**Step 1: Verify auto-refresh logic**

```typescript
// ✅ Correct: Auto-refreshes if expired
const { token, refreshed } = authClient.getValidToken(orgId, licenseId)

// ❌ Wrong: Manual token management
const token = cachedToken  // May be expired
```

**Step 2: Check token expiry configuration**

```typescript
const authClient = new GatewayAuthClient({
  issuer: 'wellnexus.vn',
  audience: 'raas.agencyos.network',
  apiKey: 'mk_xxx',
  tokenExpirySeconds: 3600,  // 1 hour default
})
```

**Step 3: Verify server clock sync**

```bash
# Check server time
date

# Should be within 5 minutes of NTP
ntpdate -q pool.ntp.org
```

### Prevention
- Always use `getValidToken()` method
- Set `refreshBufferSeconds: 300` (refresh 5 min before expiry)
- Enable clock skew tolerance (60 seconds)

---

## Issue 2: Usage Not Syncing to Gateway

### Symptoms
- Local `usage_records` show data
- RaaS Gateway dashboard shows 0 or stale data
- `gateway_sync_queue` has pending items

### Root Causes
1. Gateway API down or rate limited
2. JWT auth failure
3. Network timeout
4. Idempotency key collision

### Resolution

**Step 1: Check sync queue**

```sql
SELECT * FROM gateway_sync_queue
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 10;
```

**Step 2: Verify Gateway connectivity**

```bash
curl -X GET https://raas.agencyos.network/health
# Expected: {"status":"ok","version":"2.0.0"}
```

**Step 3: Check recent sync attempts**

```sql
SELECT org_id, status, error_message, created_at
FROM gateway_sync_queue
WHERE org_id = 'YOUR_ORG_ID'
ORDER BY created_at DESC
LIMIT 10;
```

**Step 4: Manual sync trigger**

```typescript
import { RaaS GatewaySyncService } from '@/services/raas-gateway-usage-sync'

const syncService = new RaaS GatewaySyncService(supabase)

await syncService.forceSync({
  orgId: 'org_123',
  period: '2026-03-09',
})
```

### Prevention
- Enable retry queue with exponential backoff
- Monitor `gateway_sync_queue` table size
- Set up alerts for pending items > 100

---

## Issue 3: Overage Not Calculated

### Symptoms
- Usage exceeds quota
- No overage cost displayed
- `overage_events` table empty

### Root Causes
1. Missing quota configuration
2. Overage rate not set
3. Calculation cron job failed

### Resolution

**Step 1: Verify quota exists**

```sql
SELECT * FROM quotas
WHERE org_id = 'org_123'
  AND metric_type = 'api_calls';
```

**Step 2: Check overage rate**

```sql
SELECT * FROM overage_rates
WHERE org_id = 'org_123';
```

**Step 3: Manually calculate overage**

```typescript
import { OverageBillingEngine } from '@/lib/overage-billing-engine'

const overageEngine = new OverageBillingEngine(supabase)

const result = await overageEngine.calculateOverage({
  orgId: 'org_123',
  period: '2026-03',
})

console.log(result)  // Should show totalCost
```

**Step 4: Check cron job status**

```sql
SELECT * FROM cron.job_log
WHERE command LIKE '%overage%'
ORDER BY start_time DESC
LIMIT 5;
```

### Prevention
- Set up quotas when org is created
- Default overage rates in config table
- Alert on cron job failures

---

## Issue 4: Dunning Emails Not Sent

### Symptoms
- Payment fails
- No dunning email received
- `dunning_events` shows no records

### Root Causes
1. Resend API key not configured
2. Email template missing
3. User email preferences disabled
4. Edge Function deployment failed

### Resolution

**Step 1: Verify Resend API key**

```bash
# Check Edge Function env vars
curl -X GET https://YOUR_PROJECT.supabase.co/functions/v1/send-overage-alert \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Step 2: Check email template**

```typescript
import { UsageAlertEngine } from '@/lib/usage-alert-engine'

const alertEngine = new UsageAlertEngine(supabase)

const template = await alertEngine.getEmailTemplate({
  type: 'dunning_retry_1',
  locale: 'en',
})

console.log(template)  // Should not be null
```

**Step 3: Verify user preferences**

```sql
SELECT email_enabled, sms_enabled, email_address
FROM user_notification_preferences
WHERE user_id = 'USER_ID';
```

**Step 4: Check Edge Function logs**

```bash
# Supabase dashboard → Functions → send-overage-alert → Logs
# Look for: "Email sent" or error messages
```

### Prevention
- Test email flow in staging first
- Enable Resend webhook callbacks
- Log all email send attempts

---

## Issue 5: Reconciliation Alerts

### Symptoms
- Alert: "Reconciliation discrepancy detected"
- Gateway usage ≠ Stripe usage
- Discrepancy > 5%

### Root Causes
1. Timing difference in reporting
2. Missing usage records
3. Duplicate reporting
4. Currency conversion issues

### Resolution

**Step 1: Check discrepancy details**

```sql
SELECT org_id, period, gateway_usage, stripe_usage,
       discrepancy * 100 as discrepancy_percent,
       status
FROM reconciliation_log
WHERE status = 'alerted'
ORDER BY created_at DESC
LIMIT 10;
```

**Step 2: Compare source data**

```sql
-- Gateway usage (local)
SELECT SUM(quantity) as gateway_total
FROM usage_records
WHERE org_id = 'org_123'
  AND recorded_at >= '2026-03-01'
  AND recorded_at < '2026-04-01';

-- Stripe usage
SELECT SUM(quantity) as stripe_total
FROM stripe_usage_reconciliation
WHERE org_id = 'org_123'
  AND period = '2026-03';
```

**Step 3: Identify missing records**

```sql
-- Find usage records not synced to Stripe
SELECT ur.*
FROM usage_records ur
LEFT JOIN stripe_usage_reconciliation sr
  ON ur.org_id = sr.org_id
  AND ur.feature = sr.metric_type
  AND DATE(ur.recorded_at) = sr.period::date
WHERE sr.org_id IS NULL
  AND ur.org_id = 'org_123';
```

**Step 4: Manual reconciliation**

```typescript
import { UsageReconciliationService } from '@/services/usage-reconciliation-service'

const reconciliationService = new UsageReconciliationService(supabase)

const result = await reconciliationService.reconcile({
  orgId: 'org_123',
  period: '2026-03-09',
  tolerance: 0.10,  // 10% for manual
  autoHeal: true,
})

console.log(`Discrepancy: ${(result.discrepancy * 100).toFixed(2)}%`)
```

### Prevention
- Run reconciliation daily at 2 AM UTC
- Auto-heal discrepancies < 10%
- Alert only on > 10% discrepancies

---

## Issue 6: Anomaly Detection False Positives

### Symptoms
- Spike alerts for normal usage
- Drop alerts during maintenance
- Pattern deviation during holidays

### Root Causes
1. Baseline period too short
2. Seasonal patterns not accounted for
3. Maintenance windows not excluded

### Resolution

**Step 1: Adjust baseline period**

```typescript
const anomalyDetector = new UsageAnomalyDetector(supabase)

const result = await anomalyDetector.detectAnomalies({
  orgId: 'org_123',
  baselineDays: 30,  // Increase from 7 to 30
  spikeThreshold: 5.0,  // Increase from 3.0 to 5.0
  dropThreshold: 0.2,  // Decrease from 0.3 to 0.2
})
```

**Step 2: Exclude maintenance windows**

```sql
-- Mark maintenance periods
INSERT INTO maintenance_windows (org_id, start_time, end_time, reason)
VALUES ('org_123', '2026-03-10 02:00:00', '2026-03-10 04:00:00', 'Scheduled deployment');

-- Exclude from anomaly detection
SELECT * FROM anomaly_events ae
LEFT JOIN maintenance_windows mw
  ON ae.org_id = mw.org_id
  AND ae.detected_at BETWEEN mw.start_time AND mw.end_time
WHERE mw.id IS NULL;  -- Only non-maintenance anomalies
```

**Step 3: Add day-of-week awareness**

```typescript
// Weekend vs weekday baselines
const baselineDays = isWeekend ? 4 : 7  // Last 4 weekends or 7 weekdays
```

### Prevention
- Use 30-day rolling baseline
- Separate weekday/weekend baselines
- Maintain maintenance window calendar

---

## Issue 7: Rate Limit Breaches

### Symptoms
- 429 Too Many Requests errors
- KV storage rate limit exceeded
- Cloudflare Worker blocking requests

### Root Causes
1. Traffic spike (legitimate or attack)
2. KV storage limits reached
3. Insufficient rate limit configuration

### Resolution

**Step 1: Check rate limit events**

```sql
SELECT org_id, limit_type, breach_count, created_at
FROM rate_limit_events
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY breach_count DESC;
```

**Step 2: Identify top consumers**

```sql
SELECT org_id, SUM(quantity) as total_usage
FROM usage_records
WHERE recorded_at >= NOW() - INTERVAL '1 hour'
GROUP BY org_id
ORDER BY total_usage DESC
LIMIT 10;
```

**Step 3: Adjust rate limits**

```sql
-- Increase rate limit for specific org
UPDATE rate_limit_configs
SET requests_per_minute = 1000  -- Increase from default
WHERE org_id = 'org_123';
```

**Step 4: Enable burst allowance**

```typescript
// Cloudflare Worker configuration
const RATE_LIMIT_CONFIG = {
  requestsPerMinute: 100,
  burstAllowance: 50,  // Allow 50 extra requests in 10-second burst
  burstWindowSeconds: 10,
}
```

### Prevention
- Monitor rate limit events dashboard
- Set up alerts before hard limits
- Enable burst allowance for legitimate spikes

---

## Escalation Matrix

| Issue Severity | Response Time | Escalation Path |
|----------------|---------------|-----------------|
| Emergency (auth down, data loss) | Immediate | On-call → CTO |
| Critical (billing incorrect) | < 1 hour | Support → Engineering |
| Warning (anomaly detected) | < 4 hours | Support → L2 |
| Info (reconciliation < 10%) | < 24 hours | Auto-heal, no action |

---

## Contact

- **Support:** support@wellnexus.vn
- **Emergency:** on-call@wellnexus.vn
- **Documentation:** https://docs.wellnexus.vn/raas-gateway

---

_Last Updated: 2026-03-09_
_Version: 1.0.0_
