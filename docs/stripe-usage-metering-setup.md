# Stripe Usage Metering - Configuration Guide

## Environment Variables

Add these to your `.env` or Supabase Edge Function secrets:

### Required

```bash
# Stripe API Credentials
STRIPE_SECRET_KEY=sk_test_xxx  # or sk_live_xxx for production

# Stripe Price IDs for Metered Billing
# Create these in Stripe Dashboard: Products → Add Product → Pricing → Metered
STRIPE_PRICE_ID_API_CALLS=price_xxx      # For API calls tracking
STRIPE_PRICE_ID_TOKENS=price_xxx         # For AI tokens tracking
STRIPE_PRICE_ID_INFERENCES=price_xxx     # For model inferences tracking
STRIPE_PRICE_ID_AGENTS=price_xxx         # For agent executions tracking
STRIPE_PRICE_ID_COMPUTE=price_xxx        # For compute time tracking

# Default Price ID (fallback if feature not mapped)
STRIPE_PRICE_ID_DEFAULT=price_xxx

# Supabase Configuration
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
```

### Optional

```bash
# Stripe Configuration
STRIPE_WEBHOOK_SECRET=whsec_xxx          # For webhook verification
STRIPE_METERED_BILLING_ENABLED=true       # Feature flag

# Logging
LOG_LEVEL=info                            # debug, info, warn, error
```

---

## Stripe Dashboard Setup

### Step 1: Create Metered Products

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/products)
2. Click "Add Product"
3. Create products for each usage type:

**Product: API Calls**
- Name: `API Calls`
- Pricing: `Metered` → `$0.01 per 1,000 calls`
- Billing period: `Month`
- Aggregate: `Sum`

**Product: AI Tokens**
- Name: `AI Tokens`
- Pricing: `Metered` → `$0.002 per 1,000 tokens`
- Billing period: `Month`
- Aggregate: `Sum`

**Product: Model Inferences**
- Name: `Model Inferences`
- Pricing: `Metered` → `$0.05 per inference`
- Billing period: `Month`
- Aggregate: `Sum`

### Step 2: Add Prices to Subscriptions

For each subscription that needs metered billing:

1. Go to the Subscription in Stripe Dashboard
2. Click "Add subscription item"
3. Select the metered price you created
4. Note the `subscription_item_id` (starts with `si_`)

### Step 3: Configure Webhooks (Optional)

For usage-based billing notifications:

1. Go to [Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://xxx.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `customer.subscription.updated`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

---

## Deployment

### Deploy Edge Function

```bash
# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref xxx

# Deploy the function
npx supabase functions deploy stripe-usage-record

# Set secrets (one-time)
npx supabase functions secrets set \
  STRIPE_SECRET_KEY=sk_test_xxx \
  STRIPE_PRICE_ID_API_CALLS=price_xxx \
  STRIPE_PRICE_ID_TOKENS=price_xxx \
  --project-ref xxx
```

### Run Migrations

```bash
# Push migrations to Supabase
npx supabase db push

# Or deploy to production
npx supabase db push --db-url postgresql://xxx
```

---

## Usage Examples

### Example 1: Report API Usage

```bash
curl -X POST "https://xxx.supabase.co/functions/v1/stripe-usage-record" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "subscription_item_id": "si_xxx",
    "feature": "api_call",
    "usage_records": [
      {
        "subscription_item": "si_xxx",
        "quantity": 1000,
        "timestamp": 1709856000,
        "action": "increment",
        "idempotency_key": "api-calls-2026-03-07-user-123"
      }
    ]
  }'
```

### Example 2: Report AI Token Usage

```bash
curl -X POST "https://xxx.supabase.co/functions/v1/stripe-usage-record" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "subscription_item_id": "si_xxx",
    "feature": "tokens",
    "usage_records": [
      {
        "subscription_item": "si_xxx",
        "quantity": 50000,
        "timestamp": 1709856000,
        "action": "set"
      }
    ]
  }'
```

### Example 3: Dry Run (Testing)

```bash
curl -X POST "https://xxx.supabase.co/functions/v1/stripe-usage-record" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "subscription_item_id": "si_xxx",
    "feature": "api_call",
    "usage_records": [
      {
        "subscription_item": "si_xxx",
        "quantity": 100,
        "action": "increment"
      }
    ],
    "dry_run": true
  }'
```

Response:
```json
{
  "success": true,
  "records_created": 1,
  "records_failed": 0,
  "audit_log_ids": ["uuid-x"],
  "stripe_response": {
    "dry_run": true,
    "records": [...]
  }
}
```

---

## Integration with Application

### Frontend (React/TypeScript)

```typescript
// src/lib/stripe-usage-reporter.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export async function reportUsage(options: {
  subscriptionItemId: string
  feature: string
  quantity: number
  timestamp?: number
  action?: 'set' | 'increment' | 'clear'
}) {
  const response = await supabase.functions.invoke('stripe-usage-record', {
    body: {
      subscription_item_id: options.subscriptionItemId,
      feature: options.feature,
      usage_records: [{
        subscription_item: options.subscriptionItemId,
        quantity: options.quantity,
        timestamp: options.timestamp || Math.floor(Date.now() / 1000),
        action: options.action || 'increment',
      }],
    },
  })

  if (!response.ok) {
    throw new Error(`Usage reporting failed: ${response.error}`)
  }

  return response.data
}

// Usage in application
await reportUsage({
  subscriptionItemId: 'si_xxx',
  feature: 'api_call',
  quantity: 1,  // Track 1 API call
})
```

### Backend (Edge Function Trigger)

```typescript
// In your API endpoint that handles user requests
import { reportUsage } from '@/lib/stripe-usage-reporter'

async function handleUserRequest(userId: string) {
  // ... process request ...

  // Track usage for billing
  await reportUsage({
    subscriptionItemId: getUserSubscriptionItem(userId),
    feature: 'api_call',
    quantity: 1,
  })
}
```

---

## Monitoring & Alerts

### Query Usage Audit Logs

```sql
-- Recent submissions
SELECT *
FROM stripe_usage_audit_log
ORDER BY created_at DESC
LIMIT 100;

-- Failed submissions
SELECT event_id, error_message, retry_count
FROM stripe_usage_audit_log
WHERE status = 'failed'
ORDER BY created_at DESC;

-- Daily usage summary
SELECT *
FROM stripe_usage_daily_summary
WHERE usage_date >= CURRENT_DATE - INTERVAL '7 days';
```

### Setup Alerts

Use Supabase Edge Function logs + monitoring:

```bash
# Watch function logs in real-time
supabase functions logs stripe-usage-record --format json

# Alert on high failure rate (>10% failures)
# Configure in Supabase Dashboard → Monitoring → Alerts
```

---

## Troubleshooting

### Error: "No Price ID configured"

**Solution:** Set `STRIPE_PRICE_ID_DEFAULT` or provide `price_id` in request body.

### Error: "Invalid subscription item"

**Solution:** Ensure the `subscription_item_id` (si_xxx) exists in Stripe and is associated with a metered price.

### Error: "Idempotency key conflict"

**Solution:** Use unique idempotency keys for each distinct usage event. Reuse keys only for retries of the same event.

### Usage not appearing in Stripe Dashboard

**Check:**
1. Function logs for errors
2. Audit log table for failed submissions
3. Stripe subscription has metered pricing configured
4. Usage timestamp is within current billing period

---

## Security Notes

- **Never expose `STRIPE_SECRET_KEY` to frontend**
- Use Supabase Edge Functions (server-side) for all Stripe API calls
- Enable RLS on `stripe_usage_audit_log` table
- Rotate Stripe keys periodically
- Use Stripe webhook signatures for verification

---

_Last Updated: 2026-03-07_
_Version: 1.0.0_
