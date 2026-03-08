# Billing Setup Guide - WellNexus RaaS

Comprehensive setup guide for configuring Stripe, Twilio, and Resend for overage billing and dunning workflow.

---

## Table of Contents

1. [Overview](#overview)
2. [Stripe Setup](#stripe-setup)
3. [Twilio Setup](#twilio-setup)
4. [Resend Setup](#resend-setup)
5. [Environment Variables](#environment-variables)
6. [Webhook Configuration](#webhook-configuration)
7. [Database Migrations](#database-migrations)
8. [Edge Functions Deployment](#edge-functions-deployment)
9. [Testing Checklist](#testing-checklist)

---

## Overview

The WellNexus RaaS platform uses a three-service architecture for billing and dunning:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Billing Architecture                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌────────────────┐    │
│  │   Stripe    │───▶│ Overage     │───▶│  Stripe Usage  │    │
│  │  (Billing)  │    │ Calculator  │    │   Sync Engine  │    │
│  └─────────────┘    └─────────────┘    └────────────────┘    │
│         │                   │                    │             │
│         │                   ▼                    ▼             │
│         │            ┌────────────────┐    ┌──────────────┐   │
│         │            │  Dunning       │    │   SMS/Email  │   │
│         │            │   Engine       │    │  Notifications│  │
│         │            └────────────────┘    └──────────────┘   │
│         │                   │                    │             │
│         ▼                   ▼                    ▼             │
│  ┌─────────────┐    ┌─────────────┐    ┌────────────────┐    │
│  │  Stripe     │    │   Twilio    │    │   Resend       │    │
│  │ Webhooks    │    │   (SMS)     │    │   (Email)      │    │
│  └─────────────┘    └─────────────┘    └────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### System Features

| Feature | Description |
|---------|-------------|
| Metered Billing | Track usage exceeding quotas in real-time |
| Overage Calculation | Dynamic cost calculation based on tier and metric type |
| Dunning Sequence | Multi-channel (email + SMS) payment failure follow-up |
| Auto-Sync | Periodic sync of overages to Stripe for invoicing |
| Grace Period | Configurable grace period before enforcement |

---

## Stripe Setup

### Step 1: Create Stripe Account

1. Navigate to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create a new account or use existing credentials
3. Switch to **Test Mode** for development

### Step 2: Configure Products and Prices

Create the following Stripe products for your pricing tiers:

```bash
# Create products
stripe products create --name="WellNexus Starter Tier" --description="Basic plan for individuals"
stripe products create --name="WellNexus Growth Tier" --description="For growing teams"
stripe products create --name="WellNexus Premium Tier" --description="Advanced features forScale"
stripe products create --name="WellNexus Enterprise Tier" --description="Custom solutions"
stripe products create --name="WellNexus Master Tier" --description="Unlimited resources"
```

### Step 3: Set Up Metered Billing

For metered billing, create prices with `billing_scheme=tiered`:

```bash
# Starter Tier - Metered
stripe prices create \
  --product=prod_starter \
  --currency=usd \
  --billing-scheme=tiered \
  --usage-type=metered \
  --tiers='[{"up_to": 10000, "amount": 0}, {"up_to": "inf", "amount": 1}]'

# Growth Tier - Metered
stripe prices create \
  --product=prod_growth \
  --currency=usd \
  --billing-scheme=tiered \
  --usage-type=metered \
  --tiers='[{"up_to": 50000, "amount": 0}, {"up_to": "inf", "amount": 0.5}]'

# Premium Tier - Metered
stripe prices create \
  --product=prod_premium \
  --currency=usd \
  --billing-scheme=tiered \
  --usage-type=metered \
  --tiers='[{"up_to": 200000, "amount": 0}, {"up_to": "inf", "amount": 0.25}]'
```

### Step 4: Configure Invoice Settings

In Stripe Dashboard → Billing → Settings:

| Setting | Value |
|---------|-------|
| Invoice Schedule | At end of billing period |
| Invoice Period | Monthly |
| Invoice Numbering | System-managed |
| Auto-invoice | Enabled |

### Step 5: Set Up Webhook Endpoints

Navigate to Developers → Webhooks → Add endpoint:

**Endpoint URL:**
```
https://your-domain.com/functions/v1/stripe-webhook
```

**Select events to send:**
- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `invoice.created`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `payment_intent.payment_failed`

---

## Twilio Setup

### Step 1: Create Twilio Account

1. Navigate to [Twilio Console](https://www.twilio.com/console)
2. Create a new account or sign in
3. Get your **Account SID** and **Auth Token** from the dashboard

### Step 2: Purchase Phone Number

Purchase a phone number for SMS notifications:

```bash
# Using Twilio CLI
twilio phone-numbers:buy:local --country-code US --area-code <area-code>

# Or search for available numbers
twilio phone-numbers:search:local --country-code US --area-code <area-code>
```

### Step 3: Configure SMS Templates

Twilio requires pre-approved templates for SMS notifications. Create the following templates in Twilio Console → Messaging → Template Library:

**Template 1: Dunning Initial**
```
{{account}}: Payment failed for ${{amount}}. Update payment method at {{payment_url}}.
```

**Template 2: Dunning Reminder**
```
{{account}}: Payment reminder - ${{amount}} overdue. Update at {{payment_url}}.
```

**Template 3: Dunning Final**
```
{{account}}: Final notice - ${{amount}} overdue. Subscription suspended in {{days}} days. {{payment_url}}
```

**Template 4: Dunning Cancel**
```
{{account}}: Your subscription has been canceled due to non-payment. Recover at {{payment_url}}.
```

**Template 5: Payment Confirmation**
```
{{account}}: Payment of ${{amount}} received. Thank you!
```

### Step 4: Rate Limiting Configuration

Configure rate limits in Twilio Dashboard → Messaging → Settings:

| Setting | Value |
|---------|-------|
| SMS Rate Limit | 10 SMS/hour per user |
| Daily Limit | 50 SMS/day per user |
|optgroup Label | WellNexus |
| A2P 10DLC Registration | Completed |

---

## Resend Setup

### Step 1: Create Resend Account

1. Navigate to [Resend](https://resend.com/)
2. Create an account
3. Get your **API Key** from the dashboard

### Step 2: Verify Domain

To send emails from your domain:

1. In Resend Dashboard → Domains → Add Domain
2. Add your domain (e.g., `wellnexus.vn` or `agencyos.network`)
3. Follow DNS verification steps:
   - Add CNAME record for SPF
   - Add MX record for DKIM
   - Add TXT record for DMARC

### Step 3: Create Email Templates

Create the following templates in Resend Dashboard → Emails → Templates:

**Template 1: dunning-initial**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>WellNexus - Payment Failed</title>
</head>
<body>
  <h2>⚠️ Payment Failed</h2>
  <p>Hello {{userName}},</p>
  <p>您的支付失败，金额：{{amount}}。</p>
  <p>Invoice ID: {{invoiceId}}</p>
  <p>Plan: {{planName}}</p>
  <a href="{{paymentUrl}}">点击更新付款方式</a>
  <p>您还有 {{daysUntilSuspension}} 天来解决这个问题，否则您的订阅将被暂停。</p>
</body>
</html>
```

**Template 2: dunning-reminder**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>WellNexus - Payment Reminder</title>
</head>
<body>
  <h2>🔔 Payment Reminder</h2>
  <p>Hello {{userName}},</p>
  <p>这是对我们上一次付款失败的提醒。金额：{{amount}}。</p>
  <p>请尽快更新您的付款方式以避免服务中断。</p>
  <a href="{{paymentUrl}}">点击更新付款方式</a>
</body>
</html>
```

**Template 3: dunning-final**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>WellNexus - Final Notice</title>
</head>
<body>
  <h2>🚨 Final Notice - Payment Overdue</h2>
  <p>Hello {{userName}},</p>
  <p>这是您最后一次付款提醒。金额：{{amount}}。</p>
  <p>您的订阅将在 {{daysUntilSuspension}} 天后被暂停，除非您更新付款方式。</p>
  <a href="{{paymentUrl}}">点击更新付款方式</a>
</body>
</html>
```

**Template 4: dunning-cancel**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>WellNexus - Subscription Canceled</title>
</head>
<body>
  <h2>❌ Subscription Canceled</h2>
  <p>Hello {{userName}},</p>
  <p>由于未支付账单，您的订阅已被取消。金额：{{amount}}。</p>
  <p>如需恢复订阅，请更新付款方式并联系支持团队。</p>
  <a href="{{paymentUrl}}">点击更新付款方式</a>
</body>
</html>
```

**Template 5: payment-confirmation**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>WellNexus - Payment Received</title>
</head>
<body>
  <h2>✅ Payment Received</h2>
  <p>Hello {{userName}},</p>
  <p>我们已收到您的付款。金额：{{amount}}。</p>
  <p>Invoice ID: {{invoiceId}}</p>
  <p>感谢您的付款！您的服务将继续正常运行。</p>
</body>
</html>
```

### Step 4: Email Config

In Resend Dashboard → Settings → Emails:

| Setting | Value |
|---------|-------|
| Default From Name | WellNexus |
| Default From Email | billing@wellnexus.vn |
| Reply To | support@wellnexus.vn |
| BCC | billing-alerts@wellnexus.vn |

---

## Environment Variables

Create a `.env.local` file in your project root:

### Stripe Configuration

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_51XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_PUBLISHABLE_KEY=pk_test_51XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Stripe Test Mode (optional, defaults to true)
STRIPE_TEST_MODE=true
```

### Twilio Configuration

```bash
# Twilio
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_PHONE_NUMBER=+1234567890

# Twilio Options
TWILIO_MESSAGE_SERVICE_SID=MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIOłam_ENABLE_LBV=true
```

### Resend Configuration

```bash
# Resend
RESEND_API_KEY=re_XXXXXXXXXXXXXXXXXXXXXXXX
RESEND_DEFAULT_FROM=billing@wellnexus.vn
RESEND_DEFAULT_NAME=WellNexus
```

### Application Configuration

```bash
# Application
APP_URL=http://localhost:5173
RAAS_GATEWAY_URL=https://raas.agencyos.network
RAAS_GATEWAY_API_KEY=your-gateway-api-key
```

### Database Configuration

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### SMS Rate Limiting

```bash
# SMS Rate Limiting
SMS_MAX_PER_HOUR=10
SMS_MAX_PER_DAY=50
SMS_RATE_LIMIT_WINDOW_MS=3600000
```

### Dunning Configuration

```bash
# Dunning Settings
DUNNING_ENABLED=true
DUNNING_MAX_RETRY_DAYS=14
DUNNING_RETRY_INTERVAL_DAYS=2
DUNNING_GRACE_PERIOD_DAYS=5
DUNNING_AUTO_SUSPEND=true
DUNNING_SUSPEND_AFTER_DAYS=14
```

---

## Webhook Configuration

### Stripe Webhook Setup

1. **Create Webhook Endpoint**
   - Navigate to Developers → Webhooks
   - Click "Add endpoint"
   - Enter your endpoint URL: `https://your-domain.com/functions/v1/stripe-webhook`

2. **Select Events**
   - `invoice.paid` - Payment successful
   - `invoice.payment_failed` - Payment failed
   - `invoice.created` - Invoice generated
   - `customer.subscription.created` - New subscription
   - `customer.subscription.updated` - Subscription update
   - `customer.subscription.deleted` - Cancellation
   - `payment_intent.payment_failed` - Payment intent failed

3. **Signatures**
   - Enable webhook signatures
   - Copy the signing secret for your `.env`

### Webhook Handler Endpoints

| Endpoint | Function | Purpose |
|----------|----------|---------|
| `/functions/v1/stripe-webhook` | stripe-webhook | License provisioning |
| `/functions/v1/stripe-dunning` | stripe-dunning | Dunning workflow |
| `/functions/v1/stripe-usage-record` | stripe-usage-record | Usage sync |
| `/functions/v1/stripe-customer-portal` | stripe-customer-portal | Payment update |

### Testing Webhooks

Use Stripe CLI to test webhook delivery:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local dev
stripe listen --forward-to localhost:5173/functions/v1/stripe-webhook

# Trigger test events
stripe trigger invoice.created
stripe trigger invoice.payment_failed
```

---

## Database Migrations

### Apply Migrations

Run all billing-related migrations:

```bash
# Using Supabase CLI
npx supabase db push --local

# Or apply migrations manually
psql "$(npx supabase db url)" -f supabase/migrations/260308-dunning-schema.sql
psql "$(npx supabase db url)" -f supabase/migrations/260308194421_sms_service_schema.sql
psql "$(npx supabase db url)" -f supabase/migrations/2603082040_add_sms_tracking_to_dunning.sql
psql "$(npx supabase db url)" -f supabase/migrations/2603082045_unpaid_invoice_cron.sql
psql "$(npx supabase db url)" -f supabase/migrations/2603082100_cron_schedules.sql
```

### Migration Details

#### 1. Dunning Schema

File: `260308-dunning-schema.sql`

Creates:
- `dunning_events` - Tracks payment failures and dunning progress
- `dunning_config` - Per-org configuration
- `failed_webhooks` - Audit log for webhook failures

#### 2. SMS Service Schema

File: `260308194421_sms_service_schema.sql`

Creates:
- `sms_logs` - SMS delivery tracking
- `sms_templates` - Template definitions
- `sms_rate_limits` - Rate limiting counters

#### 3. Unpaid Invoice Cron

File: `2603082045_unpaid_invoice_cron.sql`

Creates:
- `process_unpaid_invoices()` - Detects unpaid invoices
- `detect_unpaid_invoices` - Cron job schedule

#### 4. Cron Schedules

File: `2603082100_cron_schedules.sql`

Creates scheduled jobs:
- `process-dunning-stages` - Runs every 6 hours
- `detect-unpaid-invoices` - Runs daily at 9 AM
- `sync-pending-overages` - Runs hourly

---

## Edge Functions Deployment

### Deploy with Supabase CLI

```bash
# Deploy all edge functions
npx supabase functions deploy stripe-webhook --project-ref your-project-ref
npx supabase functions deploy stripe-dunning --project-ref your-project-ref
npx supabase functions deploy stripe-usage-record --project-ref your-project-ref
npx supabase functions deploy send-sms --project-ref your-project-ref
npx supabase functions deploy process-unpaid-invoices --project-ref your-project-ref
npx supabase functions deploy send-email --project-ref your-project-ref
npx supabase functions deploy stripe-customer-portal --project-ref your-project-ref
```

### Function Configuration

Each function requires the following environment variables:

**stripe-dunning:**
```bash
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
APP_URL=...
RAAS_GATEWAY_URL=...
```

**send-sms:**
```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SMS_MAX_PER_HOUR=10
SMS_MAX_PER_DAY=50
```

**process-unpaid-invoices:**
```bash
STRIPE_SECRET_KEY=sk_...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
RAAS_GATEWAY_URL=...
```

### Local Testing

```bash
# Test function locally
npx supabase functions serve stripe-dunning

# Invoke function (new terminal)
curl -X POST http://localhost:54321/functions/v1/stripe-dunning \
  -H "Authorization: Bearer ey..." \
  -H "Content-Type: application/json" \
  -d '{"event_type": "invoice.payment_failed", ...}'
```

---

## Testing Checklist

### Pre-Deployment Checklist

- [ ] Stripe test mode enabled
- [ ] All products and prices created
- [ ] Webhook endpoints configured
- [ ] Twilio phone number purchased
- [ ] SMS templates pre-approved
- [ ] Resend domain verified
- [ ] Email templates created
- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] Edge functions deployed
- [ ] RLS policies configured

### Unit Tests

```bash
# Run unit tests
npm test -- overage-calculator
npm test -- stripe-usage-sync
npm test -- payment-client

# Run with coverage
npm run test:coverage
```

### Integration Tests

```bash
# Run integration tests
npm test -- phase7-overage-tracking
npm test -- phase6-webhooks-usage-metering
```

### E2E Tests

```bash
# Run dunning flow E2E tests
npm test -- dunning-flow
```

### Manual Testing

#### 1. Test Payment Flow

1. Create a test subscription via Stripe Checkout
2. Verify subscription created in database
3. Test usage metering
4. Generate overage
5. Verify invoice generated

#### 2. Test Dunning Flow

1. Simulate payment failure (Stripe Dashboard → Billing → Invoices)
2. Verify dunning event created
3. Check email received
4. Check SMS received
5. Advance dunning stage manually
6. Verify email/SMS sent at each stage

#### 3. Test Resolution Flow

1. Create dunning event
2. Pay invoice via Stripe Portal
3. Verify dunning resolved
4. Verify subscription status back to active

#### 4. Test Overage Sync

1. Generate some overage usage
2. Run sync cron job
3. Verify usage records in Stripe
4. Check sync log for errors

### Test Data Seeding

```sql
-- Seed test customers
INSERT INTO auth.users (id, email, phone) VALUES
  ('test-customer-1', 'test+customer1@wellnexus.vn', '+1234567890'),
  ('test-customer-2', 'test+customer2@wellnexus.vn', '+1987654321');

-- Seed test organizations
INSERT INTO organizations (id, name, plan_tier) VALUES
  ('org-test-1', 'Test Customer 1', 'pro'),
  ('org-test-2', 'Test Customer 2', 'enterprise');

-- Seed test subscriptions
INSERT INTO user_subscriptions (stripe_subscription_id, org_id, status, plan_tier) VALUES
  ('sub_test_1', 'org-test-1', 'active', 'pro'),
  ('sub_test_2', 'org-test-2', 'active', 'enterprise');

-- Seed default dunning config
INSERT INTO dunning_config (org_id, enabled, auto_send_emails, auto_send_sms) VALUES
  ('org-test-1', true, true, true),
  ('org-test-2', true, true, true);
```

---

## Troubleshooting

### Common Issues

#### 1. Webhook Signature Verification Failed

**Error:** `Invalid webhook signature`

**Fix:**
```bash
# Verify webhook secret matches
echo $STRIPE_WEBHOOK_SECRET

# Regenerate secret if needed
stripe api post /webhook_endpoints/:id \
  -d "enabled_events[]:invoice.payment_failed" \
  -d "enabled_events[]:invoice.paid"
```

#### 2. SMS Delivery Failed

**Error:** `Unauthorized` or `Status 401`

**Fix:**
```bash
# Verify Twilio credentials
echo "Account SID: $TWILIO_ACCOUNT_SID"
echo "Auth Token: ${TWILIO_AUTH_TOKEN:0:8}..."

# Check Twilio console for any blocking
# Verify phone number format (+1234567890)
```

#### 3. Email Not Sending

**Error:** `Failed to invoke send-email function`

**Fix:**
```bash
# Verify Resend API key
echo $RESEND_API_KEY

# Check Resend dashboard for delivery issues
# Verify email templates exist and are approved
```

#### 4. Dunning Not Advancing Stages

**Issue:** Dunning events not progressing

**Fix:**
```sql
-- Check if cron job is running
SELECT * FROM cron.job WHERE jobname = 'process-dunning-stages';

-- Manually run stages
SELECT process_dunning_stages();

-- Check dunning config
SELECT * FROM dunning_config WHERE org_id = 'your-org-id';
```

#### 5. Overage Sync Not Working

**Issue:** Overages not syncing to Stripe

**Fix:**
```sql
-- Check pending overages
SELECT * FROM overage_transactions WHERE stripe_sync_status = 'pending';

-- Check sync log
SELECT * FROM stripe_usage_sync_log ORDER BY created_at DESC LIMIT 10;

-- Retry failed syncs
SELECT retry_failed_synces();
```

### Debug Commands

```bash
# Check function logs
npx supabase functions logs stripe-dunning

# Check database state
psql "$(npx supabase db url)" -c "SELECT * FROM dunning_events ORDER BY created_at DESC LIMIT 10;"

# Check cron jobs
psql "$(npx supabase db url)" -c "SELECT * FROM cron.job;"

# View unsent emails
psql "$(npx supabase db url)" -c "SELECT * FROM get_pending_dunning_emails();"
```

---

## Production Deployment

### Pre-Launch Checklist

- [ ] Switch from test mode to live mode
- [ ] Update all webhook endpoints to production URLs
- [ ] Verify domain verification in Resend
- [ ] Confirm Twilio A2P 10DLC approval
- [ ] Set up production monitoring
- [ ] Configure error alerts (Sentry)
- [ ] Enable detailed logging
- [ ] Load test with production-like data
- [ ] Backup production database
- [ ] Document runbook for incident response

### Go-Live Steps

1. **Switch to Live Mode**
   ```bash
   # In Stripe Dashboard
   - Copy live API keys
   - Update environment variables
   - Remove test mode flags
   ```

2. **Update Webhooks**
   ```bash
   # Update webhook endpoints to production
   stripe update webhook_endpoint <endpoint-id> \
     --url https://api.wellnexus.vn/functions/v1/stripe-webhook
   ```

3. **Monitor First 24 Hours**
   - Watch webhook delivery status
   - Check email/SMS delivery
   - Monitor for errors
   - Verify billing accuracy

4. **Deactivate Test Mode**
   ```bash
   # Update .env
   STRIPE_TEST_MODE=false
   ```

---

## Support

For issues or questions:
- Documentation: [WellNexus Docs](https://docs.wellnexus.vn)
- Support Email: support@wellnexus.vn
- Status Page: [status.wellnexus.vn](https://status.wellnexus.vn)

---

**Last Updated:** 2026-03-08
**Version:** 1.0.0
**Author:** WellNexus Engineering Team
