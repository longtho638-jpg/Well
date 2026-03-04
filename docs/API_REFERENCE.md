# WellNexus API Reference

> Complete API documentation for WellNexus RaaS platform. All APIs are RESTful and return JSON responses.

**Base URL:** `https://wellnexus.vn/api` (production) or `http://localhost:5173/api` (development)

---

## 🔐 Authentication

All authenticated endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <your-supabase-jwt-token>
```

Tokens are automatically managed by the `useAuth` hook.

---

## 📦 Subscriptions API

### Get Available Plans

```http
GET /api/subscriptions/plans
```

**Response:**
```json
[
  {
    "id": "uuid",
    "slug": "free",
    "name": "Miễn Phí",
    "price_monthly": 0,
    "price_yearly": 0,
    "max_members": 50,
    "features": ["dashboard", "marketplace", "basic_commission"],
    "is_active": true
  }
]
```

### Get User Active Plan

```http
GET /api/subscriptions/me
```

**Response:**
```json
{
  "plan_slug": "pro",
  "plan_name": "Chuyên Nghiệp",
  "status": "active",
  "period_end": "2026-04-04T00:00:00Z",
  "max_members": 1000
}
```

### Create Subscription

```http
POST /api/subscriptions
Content-Type: application/json

{
  "plan_id": "uuid",
  "billing_cycle": "monthly"
}
```

**Response:**
```json
{
  "checkout_url": "https://payos.vn/checkout/xxx",
  "order_code": 123456
}
```

### Cancel Subscription

```http
DELETE /api/subscriptions/:id
```

---

## 🚩 Feature Flags API

### Get User Features

```http
GET /api/features/me
```

**Response:**
```json
[
  {
    "flag_key": "ai_copilot",
    "flag_name": "AI Copilot",
    "is_enabled": true,
    "granted_at": "2026-03-04T00:00:00Z"
  }
]
```

### Check Feature Access

```http
GET /api/features/check/:flag_key
```

**Response:**
```json
{
  "has_access": true,
  "reason": "granted_by_plan"
}
```

---

## 📊 Usage Metering API

### Get Usage Status

```http
GET /api/usage/:metric_type
```

**Parameters:**
- `metric_type`: `ai_calls`, `api_calls`, `storage_mb`, `email_sends`

**Response:**
```json
{
  "current_value": 500,
  "limit_value": 1000,
  "percentage_used": 50.00,
  "is_exceeded": false,
  "period_end": "2026-04-01T00:00:00Z"
}
```

### Track Usage

```http
POST /api/usage/track
Content-Type: application/json

{
  "feature": "ai_copilot",
  "quantity": 1,
  "metadata": {
    "action": "generate_content"
  }
}
```

**Response:**
```json
{
  "current_value": 501,
  "limit_value": 1000,
  "is_exceeded": false
}
```

---

## 🏢 Organizations API

### Get User Organizations

```http
GET /api/orgs
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "My Organization",
    "slug": "my-org",
    "owner_id": "uuid",
    "is_active": true
  }
]
```

### Create Organization

```http
POST /api/orgs
Content-Type: application/json

{
  "name": "My Agency",
  "slug": "my-agency"
}
```

### Get Organization Members

```http
GET /api/orgs/:id/members
```

### Get Organization Plan

```http
GET /api/orgs/:id/plan
```

---

## 💰 Commission API

### Get Commission History

```http
GET /api/commissions?level=1&limit=20&offset=0
```

**Response:**
```json
{
  "total": 150,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "amount": 50000,
      "level": 1,
      "from_order_id": "uuid",
      "created_at": "2026-03-04T00:00:00Z"
    }
  ]
}
```

### Get Network Tree

```http
GET /api/network/tree?user_id=uuid&depth=8
```

**Response:**
```json
{
  "user": { "id": "uuid", "full_name": "John Doe" },
  "referrals": [
    {
      "id": "uuid",
      "full_name": "Jane Doe",
      "level": 1,
      "total_volume": 1000000,
      "referrals": [...]
    }
  ]
}
```

---

## 👛 Wallet API

### Get Wallet Balance

```http
GET /api/wallet/balance
```

**Response:**
```json
{
  "shop_balance": 1000000,
  "grow_balance": 500000,
  "total_value_vnd": 1500000
}
```

### Transfer Tokens

```http
POST /api/wallet/transfer
Content-Type: application/json

{
  "to_user_id": "uuid",
  "token_type": "SHOP",
  "amount": 100000,
  "message": "Payment for services"
}
```

---

## 📦 Products API

### List Products

```http
GET /api/products?category=health&limit=20&offset=0
```

**Response:**
```json
{
  "total": 100,
  "data": [
    {
      "id": "uuid",
      "name": "Health Supplement",
      "price": 500000,
      "category": "health",
      "stock": 50
    }
  ]
}
```

### Get Product Details

```http
GET /api/products/:id
```

### Create Product (Admin)

```http
POST /api/products
Content-Type: application/json

{
  "name": "New Product",
  "price": 500000,
  "category": "health",
  "description": "Product description"
}
```

---

## 🛒 Orders API

### Create Order

```http
POST /api/orders
Content-Type: application/json

{
  "items": [
    {
      "product_id": "uuid",
      "quantity": 2,
      "price": 500000
    }
  ],
  "shipping_address": {
    "full_name": "John Doe",
    "phone": "0901234567",
    "address": "123 Main St"
  }
}
```

### Get Order Details

```http
GET /api/orders/:id
```

### List User Orders

```http
GET /api/orders/me?status=pending&limit=20
```

---

## 🤖 AI Agents API

### Trigger AI Agent

```http
POST /api/agents/:agent_id/run
Content-Type: application/json

{
  "input": {
    "user_id": "uuid",
    "context": "sales_followup"
  }
}
```

**Response:**
```json
{
  "status": "completed",
  "output": {
    "message": "Follow-up email sent",
    "metadata": {
      "tokens_used": 150
    }
  }
}
```

### Get Agent Logs

```http
GET /api/agents/logs?user_id=uuid&limit=50
```

---

## 📧 Email API

### Send Email (Edge Function)

```http
POST https://jcbahdioqoepvoliplqy.supabase.co/functions/v1/send-email
Authorization: Bearer <service-role-key>
Content-Type: application/json

{
  "type": "welcome",
  "to": "user@example.com",
  "data": {
    "userName": "John Doe"
  }
}
```

---

## 🔗 Webhooks

### Subscription Webhooks

WellNexus sends webhooks to your configured endpoint on subscription events:

```json
{
  "event": "subscription.created",
  "data": {
    "user_id": "uuid",
    "plan_id": "uuid",
    "status": "active"
  },
  "timestamp": "2026-03-04T00:00:00Z"
}
```

**Supported events:**
- `subscription.created`
- `subscription.activated`
- `subscription.canceled`
- `subscription.expired`

---

## 🚨 Error Handling

All errors follow this format:

```json
{
  "error": {
    "code": "SUBSCRIPTION_NOT_FOUND",
    "message": "No active subscription found for user",
    "details": {}
  }
}
```

**Common error codes:**

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid auth token |
| `FORBIDDEN` | 403 | User lacks permission |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMITED` | 429 | Too many requests |
| `QUOTA_EXCEEDED` | 402 | Usage quota exceeded |

---

## 📄 Rate Limits

| Tier | API Calls/hour | AI Calls/day |
|------|----------------|--------------|
| Free | 100 | 10 |
| Pro | 1,000 | 100 |
| Enterprise | 10,000 | 1,000 |

Rate limit headers included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1677932400
```

---

## 🧪 Testing

Use these test credentials for sandbox testing:

```
Test User Email: test@wellnexus.vn
Test User Password: Test1234!
```

---

## 📞 Support

Need help? Contact us:
- 📧 Email: support@wellnexus.vn
- 💬 Discord: [Join our server](https://discord.gg/xxxxx)
- 📚 Docs: [Full documentation](./docs/)
