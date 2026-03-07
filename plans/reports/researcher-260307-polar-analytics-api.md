# Polar.sh API Research Report

**Date:** 2026-03-07
**Project:** WellNexus RaaS (ROIaaS)
**Researcher:** a53e82010acd7b8fa

---

## Executive Summary

Polar.sh provides REST API access for subscriptions, revenue, customers, products, and checkout functionality. **Key finding:** Polar.sh API lacks native analytics/metrics endpoints with time-series data. Analytics and cohort retention must be built by ingesting webhook events and storing aggregated data internally. Stripe → Polar.sh backfill requires custom data modeling.

---

## API Foundation

### Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://api.polar.sh/v1` |
| Sandbox | `https://sandbox-api.polar.sh/v1` |

### Authentication

| Type | Header | Scope |
|------|--------|-------|
| Organization API | `Authorization: Bearer polar_oat_xxx` | `products:read`, `checkout_links:write`, etc. |
| Customer Portal | `Authorization: Bearer $POLAR_CUSTOMER_TOKEN` | `customer_portal:read` |

---

## Core API Endpoints

### 1. Products (GET /v1/products/)

**Purpose:** List and retrieve products (subscriptions, one-time purchases)

**Key Fields:**
- `id` (UUID), `name`, `description`
- `is_recurring` (boolean)
- `recurring_interval`: `day` | `week` | `month` | `year`
- `visibility`: `draft` | `private` | `public`
- `prices`: Array of price objects
- `benefits`: Custom, Discord, GitHub, License Keys, Feature Flags, etc.

**Price Types:**
- `fixed` - Fixed price
- `custom` - Pay-what-you-want
- `free` - Free tier
- `seat_based` - Per-seat pricing
- `metered_unit` - Usage-based pricing

### 2. Checkout Links (POST /v1/checkout-links/)

**Purpose:** Create shareable checkout sessions

**Key Parameters:**
- `payment_processor`: `"stripe"` (only)
- `products`: Array of product IDs
- `success_url`: Redirect after payment
- `allow_discount_codes`: boolean (default: true)
- `require_billing_address`: boolean (default: false)

**Response:** `CheckoutLink` with `url` and `client_secret`

### 3. Checkout Sessions (POST /v1/checkouts/)

**Purpose:** Embed checkout directly in application

**Key Parameters:**
- `product_ids`: Array of product IDs
- `trial_interval`, `trial_interval_count`: Trial configuration
- `customer_id` or `external_customer_id`: Pre-fill customer
- `discount_id`: Apply discount
- `embed_origin`: For embedded UI

**Session Flow:**
1. Create session → get `id`, `client_secret`, `url`
2. Redirect customer to `url`
3. Payment at Polar checkout
4. Success redirect to `success_url`
5. Session status: `open` → `confirmed`/`failed`/`expired` → `succeeded`

### 4. Customer Orders (GET /v1/customer-portal/orders/)

**Purpose:** Retrieve customer purchase history

**Key Fields:**
- `id`, `status`: `pending` | `paid` | `refunded` | `partially_refunded` | `void`
- `paid`: boolean
- Amounts (in cents): `subtotal_amount`, `discount_amount`, `tax_amount`, `total_amount`, `refunded_amount`
- `customer_id`, `product_id`, `subscription_id`
- `billing_address`, `invoice_number`

---

## Webhooks (Critical for Analytics)

**Endpoint:** Configure via Dashboard → Integrations → Webhooks

**Supported Events:**
- `checkout.succeeded` - Payment completed
- `subscription.updated` - Plan change, renewal
- `subscription.cancelled` - Cancellation
- `customer.created` - New customer
- `order.paid` - Order payment received
- `order.refunded` - Refund processed

**Security:** Cryptographically signed requests with secret validation

**CLI Testing:** `polar listen` for local development

---

## API Limitations

### Missing Native Analytics

| Feature | Status | Workaround Required |
|---------|--------|---------------------|
| Revenue time-series | ❌ No | Ingest webhooks → store in own DB |
| Cohort retention | ❌ No | Calculate from subscription lifecycle data |
| Usage per customer | ⚠️ Limited | Use webhooks + metered pricing |
| Custom metrics | ❌ No | Build custom aggregation pipeline |

### Rate Limits

| Endpoint Type | Limit |
|--------------|-------|
| General API | 300 requests/minute |
| License key validation | 3 requests/second |

### Pagination

- `page`: int (default: 1)
- `limit`: int (default: 10, max: 100)
- Response includes `pagination.total_count`, `pagination.max_page`

---

## Data Models Summary

### Product
```json
{
  "id": "uuid",
  "name": "string",
  "is_recurring": true,
  "recurring_interval": "month",
  "prices": [
    {
      "id": "uuid",
      "type": "fixed" | "custom" | "seat_based" | "metered_unit",
      "price_amount": 1000,  // in cents
      "currency": "usd"
    }
  ]
}
```

### Checkout Session
```json
{
  "id": "uuid",
  "url": "https://polar.sh/...",
  "product_id": "uuid",
  "subscription_id": "uuid",
  "customer_name": "string",
  "customer_email": "string",
  "total_amount": 1000,
  "status": "open" | "confirmed" | "succeeded" | "failed" | "expired",
  "expires_at": "2026-03-08T00:00:00Z"
}
```

### Customer Order
```json
{
  "id": "uuid",
  "status": "paid" | "pending" | "refunded",
  "paid": true,
  "customer_id": "uuid",
  "product_id": "uuid",
  "subtotal_amount": 1000,
  "discount_amount": 0,
  "tax_amount": 80,
  "total_amount": 1080,
  "refunded_amount": 0,
  "created_at": "2026-03-07T12:00:00Z"
}
```

---

## Integration Architecture

### For WellNexus Analytics Dashboard

```
┌─────────────────┐
│   Polar.sh      │
│   (Source)      │
└────────┬────────┘
         │ Webhooks
         ▼
┌─────────────────┐
│  WellNexus      │
│  Webhook        │
│  Receiver       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Analytics DB   │
│  - Events       │
│  - Aggregates   │
│  - Cohorts      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Dashboard     │
│   (UI Layer)    │
└─────────────────┘
```

### Backfill Strategy: Stripe → Polar.sh

**Challenge:** Polar.sh API doesn't expose Stripe data directly.

**Approach:**

1. **Extract** from existing Stripe data:
   - Customers
   - Subscriptions
   - Charges/InvoiceLineItems
   - Plans

2. **Transform** to Polar.sh data model:
   - Map Stripe `price_id` → Polar `product_id` + `price_id`
   - Map Stripe `customer_id` → Polar external reference
   - Convert Stripe amounts (dollars) → cents

3. **Load** via:
   - For new transactions: Use Polar API directly
   - For historical: Create `Order` records with `paid: true`
   - For subscriptions: Create subscriptions with original start date

**Limitations:**
- Historical Stripe subscriptions cannot be "backfilled" as active Polar subscriptions
- Customer payment method history won't transfer
- Use Polar's ** Customer Portal API** for new customer management going forward

---

## Recommendations

### Phase 1: Build Analytics Pipeline (Immediate)

1. **Set up webhook receiver** at `/api/webhooks/polar`
2. **Store raw events** in `polar_webhook_events` table
3. **Aggregate metrics** nightly:
   - `daily_revenue`
   - `new_customers`
   - `churned_customers`
   - `mrr_by_plan`
4. **Build cohort tables**:
   - `customer_cohorts` (acquisition date, plan, lifetime_value)
   - `retention_curves` (days_since_acquisition, retained_count)

### Phase 2: Dashboard (Week 1)

1. Build `/dashboard/analytics` with:
   - Revenue trends (line chart)
   - Customer acquisition (bar chart)
   - MRR by plan (pie chart)
   - Cohort retention (matrix)
2. Add filters:
   - Date range (last 30/90/180/365 days)
   - Plan type (tier filter)
   - Customer segment (custom tags)

### Phase 3: Metrics Expansion (Week 2)

1. Track license usage via Polar metered pricing
2. Integrate with existing usage analytics
3. Revenue attribution to specific plans/features

---

## Unresolved Questions

| Question | Priority |
|----------|----------|
| How to map existing Stripe subscriptions to Polar subscriptions for historical data? | High |
| Can Polar webhooks provide customer segment information? | Medium |
| Is there SDK support for TypeScript/Python for better type safety? | Medium |
| What's the limit on webhook event retention in Polar dashboard? | Low |
| Can we export Polar data to CSV/JSON for backup? | Low |

---

## Quick Reference: Polar.sh vs Stripe Comparison

| Feature | Polar.sh | Stripe | WellNexus Action |
|---------|----------|--------|------------------|
| Base URL | `https://api.polar.sh/v1` | `https://api.stripe.com/v1` | Use both |
| Auth | Bearer token (polar_oat_xxx) | Bearer token (sk_...) | Separate tokens |
| Checkout | Checkout Links + Sessions | Checkout Sessions | Use Polar for new |
| Webhooks | Yes (polar.sh webhook) | Yes (stripe webhook) | Subscribe to both |
| Analytics API | ❌ None | ❌ None | Build custom |
| SDKs | Python, TS, Go, PHP | Yes (all languages) | Use Polar SDK for Polar |

---

## Document Info

| Field | Value |
|-------|-------|
| Research Date | 2026-03-07 |
| API Version | v1 |
| Next Update | When Polar adds analytics endpoints |

---

**End of Report**
