# Overage Billing & Dunning Workflow Implementation Report

**Date:** 2026-03-08
**Phase:** Phase 7 - Overage Billing & Dunning
**Project:** WellNexus (mekong-cli/apps/well)

---

## Executive Summary

Implemented complete overage billing and dunning workflow with:
- Stripe Billing Metered Usage integration
- Automated email/SMS alerts via Resend/Twilio
- Stripe Customer Portal for self-service upgrades/downgrades
- Usage threshold alerts (90%, 100%, 125%)

---

## Implementation Summary

### 1. Overage Calculator Service

**File:** `src/services/overage-calculator.ts`
**Types:** `src/types/overage.ts`
**Tests:** `src/services/__tests__/overage-calculator.test.ts`

**Features:**
- Calculate overage units from usage vs quota
- Get tier-based overage rates from database
- Create overage transaction records
- Generate idempotency keys for Stripe sync

**Key Functions:**
```typescript
calculateOverageUnits(totalUsage, quotaLimit) // Returns excess units
calculateOverageCost(overageUnits, ratePerUnit) // Returns cost
getOverageRate(metricType, tier, tenantId) // DB lookup
createOverageTransaction(transaction) // DB insert
```

---

### 2. Stripe Usage Sync Engine

**Service:** `src/services/stripe-usage-sync.ts`
**Edge Function:** `supabase/functions/sync-stripe-usage/index.ts`

**Features:**
- Sync pending overages to Stripe Usage Records
- Retry logic with exponential backoff
- Idempotency support
- Sync log audit trail

**Tables Used:**
- `overage_transactions` - Main overage records
- `stripe_usage_sync_log` - Sync attempt history

**Flow:**
```
1. Get pending transactions (stripe_sync_status = 'pending')
2. Group by subscription_item_id
3. Call stripe-usage-record Edge Function
4. Update transaction status (synced/failed)
5. Retry failed synces with backoff
```

---

### 3. Dunning Email/SMS Sequence

**Edge Function:** `supabase/functions/stripe-dunning/index.ts`
**Migration:** `supabase/migrations/2603082040_add_sms_tracking_to_dunning.sql`

**Dunning Stages:**
| Stage | Day | Email | SMS |
|-------|-----|-------|-----|
| Initial | 0 | ✅ | ✅ |
| Reminder | 2 | ✅ | ✅ |
| Final | 5 | ✅ | ✅ |
| Cancel Notice | 10 | ✅ | ❌ |

**SMS Templates (Vietnamese):**
```
⚠️ WellNexus: Thanh toan that bai {{amount}} cho goi {{plan_name}}.
Cap nhat phuong thuc thanh toan: {{payment_url}}
```

**New Fields in dunning_events:**
- `sms_sent` - SMS sent flag
- `sms_template` - Template used
- `sms_sid` - Twilio message SID
- `sms_clicked` - Click tracking

---

### 4. Usage Alerts Webhook

**Edge Function:** `supabase/functions/usage-alert-webhook/index.ts`

**Thresholds:** 90%, 100%, 125%

**Features Added:**
- Email notifications via Resend
- SMS notifications via Twilio
- Idempotency (1 hour cooldown)
- RaaS Gateway sync for license state

**Notification Flow:**
```
1. Receive usage alert webhook
2. Check idempotency (1hr cooldown)
3. Send email to user/org
4. Send SMS if enabled
5. Update alert_webhook_events table
6. Sync to RaaS Gateway
```

---

### 5. Stripe Customer Portal

**Service:** `src/lib/stripe-billing-client.ts`
**Edge Function:** `supabase/functions/stripe-customer-portal/index.ts`
**Component:** `src/components/billing/CustomerPortalButton.tsx`

**Features:**
- Self-service subscription management
- Upgrade/downgrade plans
- Update payment methods
- View billing history

**API:**
```typescript
createCustomerPortalSession(customerId, returnUrl)
getCustomerPortalUrl(customerId) // With localStorage caching
```

**Portal URL Caching:**
- Cached in localStorage for 1 hour
- Prevents excessive session creation
- Auto-refresh on expiry

---

### 6. Unpaid Invoice Detection Cron

**Migration:** `supabase/migrations/2603082045_unpaid_invoice_cron.sql`

**Functions:**
- `process_dunning_notifications()` - Process dunning stages
- `process_notification_queue()` - Send queued notifications
- `send_notification_email()` - Email helper
- `send_notification_sms()` - SMS helper

**Tables:**
- `notification_queue` - Notification job queue
- `notification_logs` - Send attempt audit

**Cron Schedule (pg_cron):**
```sql
-- Process dunning stages every hour
SELECT cron.schedule('process-dunning', '0 * * * *',
  'SELECT * FROM process_dunning_notifications()');

-- Process notification queue every 5 minutes
SELECT cron.schedule('process-notifications', '*/5 * * * *',
  'SELECT process_notification_queue()');
```

---

## Database Schema Changes

### New Tables:
| Table | Purpose |
|-------|---------|
| `overage_rates` | Per-metric rate configuration |
| `overage_transactions` | Overage billing records |
| `stripe_usage_sync_log` | Stripe sync audit trail |
| `notification_queue` | Email/SMS job queue |
| `notification_logs` | Notification send history |

### Modified Tables:
| Table | New Columns |
|-------|-------------|
| `dunning_events` | `sms_sent`, `sms_template`, `sms_sid`, `sms_clicked` |
| `dunning_config` | `auto_send_sms`, `sms_sequence` |
| `alert_webhook_events` | `notification_type`, `notified_at` |

---

## Edge Functions Created/Updated

| Function | Status | Purpose |
|----------|--------|---------|
| `stripe-dunning` | Updated | Added SMS notifications |
| `sync-stripe-usage` | New | Sync overages to Stripe |
| `usage-alert-webhook` | Updated | Added email/SMS alerts |
| `stripe-customer-portal` | New | Customer Portal sessions |
| `send-sms` | Existing | Twilio SMS gateway |
| `send-email` | Existing | Resend email gateway |

---

## Frontend Components

| Component | Purpose |
|-----------|---------|
| `CustomerPortalButton.tsx` | Stripe Portal button |
| `UsageAlertBanner.tsx` | Existing - Usage warnings |
| `UsageAlertSettings.tsx` | Existing - Alert preferences |
| `BillingStatusCard.tsx` | Existing - Billing status |

---

## Integration Points

### RaaS Gateway Sync
All critical events sync to RaaS Gateway:
- Payment failures → License state update
- Usage alerts → Compliance check
- Subscription recovery → License restore

### Stripe Webhooks
Handled events:
- `invoice.payment_failed` → Trigger dunning
- `customer.subscription.updated` → Sync status
- `invoice.paid` → Resolve dunning
- `payment_intent.payment_failed` → Notify user

---

## Testing

### Unit Tests
```bash
# Overage Calculator
src/services/__tests__/overage-calculator.test.ts
- calculateOverageUnits
- calculateOverageCost
- calculatePercentageUsed
- generateOverageIdempotencyKey
```

### Manual Testing Checklist
- [ ] Deploy migrations to Supabase
- [ ] Test Stripe webhook signature verification
- [ ] Test Twilio SMS delivery
- [ ] Test Resend email delivery
- [ ] Test Customer Portal URL generation
- [ ] Test Stripe usage record sync
- [ ] Test dunning stage advancement

---

## Deployment Steps

### 1. Deploy Migrations
```bash
supabase db push
```

### 2. Deploy Edge Functions
```bash
supabase functions deploy stripe-customer-portal
supabase functions deploy sync-stripe-usage
supabase functions deploy usage-alert-webhook
```

### 3. Configure Environment Variables
```bash
# Supabase project
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
RESEND_API_KEY=re_...
RAAS_GATEWAY_URL=https://raas.agencyos.network
RAAS_GATEWAY_API_KEY=...
```

### 4. Test Webhook Endpoints
```bash
# Stripe CLI for local testing
stripe listen --forward-to localhost:54321/functions/v1/stripe-dunning
```

---

## Unresolved Questions

1. **Stripe Subscription Item ID**: How is `stripe_subscription_item_id` populated in `overage_transactions`? Need to verify Stripe webhook populates this correctly.

2. **Twilio Phone Numbers**: Are user phone numbers stored in E.164 format in `user_profiles.phone`?

3. **Email Templates**: Do Resend email templates (`usage-alert`, `dunning-*`) exist in `supabase/functions/send-email/templates/`?

4. **Cron Configuration**: Is pg_cron extension enabled in Supabase project for scheduled jobs?

5. **RaaS Gateway Endpoints**: Verify `/api/v1/license/sync-billing` and `/api/v1/license/sync-usage` endpoints are deployed and accepting requests.

---

## Next Steps

1. **Deploy to Staging**: Test full dunning flow in staging environment
2. **Configure Stripe Products**: Set up metered billing products with usage-based pricing
3. **Email Template Design**: Create branded email templates for dunning sequences
4. **SMS Template Localization**: Review Vietnamese SMS templates for tone/clarity
5. **Monitor Sync Failures**: Set up alerts for Stripe sync failures
6. **Documentation**: Update user-facing billing docs with new features

---

*End of Report*
