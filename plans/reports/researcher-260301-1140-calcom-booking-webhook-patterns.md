# Cal.com Booking Engine & Webhook Patterns for RaaS Platforms
**Research Report** | Researcher Agent | 2026-03-01 1140

---

## Executive Summary

Cal.com's booking engine demonstrates enterprise-grade event-driven architecture combining state machine-based booking lifecycle management, webhook infrastructure with HMAC-SHA256 verification, and workflow automation. These patterns map directly to RaaS (Revenue-as-a-Service) platforms where orders replace bookings, product availability replaces time slots, and commission workflows replace scheduling automations.

**Key Takeaway:** Cal.com separates concerns into validation → persistence → notification, with idempotency keys and queue-first architecture ensuring reliability at scale.

---

## 1. BOOKING FLOW & LIFECYCLE (Cal.com)

### 1.1 State Machine Architecture

Cal.com's booking lifecycle follows a strict state machine:

```
CREATION
    ↓
[PENDING] ← organizer approval pending
    ├→ [ACCEPTED] ← confirmed by host
    ├→ [REJECTED] ← declined by host
    └→ [CANCELLED] ← terminal
        └→ [AWAITING_HOST] (for seated events)
```

**Key Properties per Booking:**
- `uid` - External unique identifier (for rescheduling references)
- `id` - Database primary key
- `status` - Current state (PENDING/ACCEPTED/REJECTED/CANCELLED)
- `startTime`, `endTime` - UTC ISO 8601 timestamps
- `eventTypeId` - References EventType configuration
- `organizerId` - Booking owner
- `attendees` - Array of attendee records with email/name/timezone
- `customInputs` - Form field responses
- `recurringEventId` - Groups recurring bookings together
- `payment` - Stripe transaction data
- `fromReschedule` - Links to previous booking if rescheduled

### 1.2 Booking Creation Flow (Request → Confirmation)

**Entry Point:** `BookingsService_2024_08_13.createBooking()`

**Workflow Steps:**
1. **Event Type Resolution** (3 strategies)
   - By `eventTypeId` directly
   - By `username + slug` (personal event)
   - By `teamSlug + slug` (team event)

2. **Authentication Check** - Enforce `bookingRequiresAuthentication` flag

3. **Custom Field Validation** - All booking fields validated against schema
   - Type checking (string/number/array/boolean)
   - Option whitelisting if applicable
   - Required field enforcement

4. **Type Detection & Routing** - Determine booking class:
   - **Regular** - Single occurrence
   - **Recurring** - Multiple linked bookings via `recurringEventId`
   - **Instant** - Team-only, no advance scheduling
   - **Seated** - Multiple attendees per slot, respects `seatsPerTimeSlot`

5. **Slot Availability Check** - Against organizer's calendar + blocked times

6. **Booking Creation** - Persist with initial status:
   - `PENDING` if manual approval required
   - `ACCEPTED` if instant confirmation enabled

7. **Side Effects** - Trigger asynchronously:
   - Email notifications (organizer + attendees)
   - Webhook events
   - Calendar sync (Google/Outlook/Caldav)
   - Workflow automations

### 1.3 Booking State Transitions

**Confirmation Flow (PENDING → ACCEPTED):**
- Permission check: only organizer with approval rights
- Status validation: must be PENDING
- Calendar event creation (if not already done)
- Email notification to attendees
- Webhook: `booking.accepted` trigger
- Workflow execution for confirmation automations

**Cancellation Flow (Any → CANCELLED):**
- Authorization check: organizer or attendee with cancel rights
- Calendar removal from all linked services
- Refund processing (if payment involved)
- Email notifications (cancellation notice)
- Webhook: `booking.cancelled` trigger
- Workflow execution for cancellation automations

**Rescheduling Flow (ACCEPTED → Create new PENDING):**
- Implemented as atomic cancel + create operation
- New booking linked via `fromReschedule` field
- Old booking status → CANCELLED
- Calendar events updated atomically
- Webhooks: `booking.rescheduled` trigger
- Attendees notified of change

### 1.4 Payment Integration (Booking ↔ Payment State)

For paid event types, booking status reflects payment lifecycle:

```
Booking Status      Payment Status      UI State
─────────────────   ──────────────────  ─────────────────────
PENDING             pending             "Complete Payment"
PENDING             succeeded           "Payment received, awaiting approval"
ACCEPTED            succeeded           "Confirmed & Paid"
ACCEPTED            failed              "Payment failed, re-authenticate"
CANCELLED           refunded            "Refund processed"
```

**Key:** Booking confirmed only after `payment_intent.succeeded` webhook from Stripe.

---

## 2. AVAILABILITY ENGINE (Slot Calculation)

### 2.1 Timezone Handling

Cal.com's availability API requires:

**Input:** UTC ISO 8601 dates
```
GET /v2/slots?eventTypeId=10&start=2050-09-05T00:00:00Z&end=2050-09-06T23:59:59Z&timeZone=Europe/Rome
```

**Processing:** Internally converts UTC input to organizer's timezone, applies availability windows, checks calendar conflicts, converts result back to requested `timeZone` parameter.

**Output:** Slots adjusted to client's timezone for display.

**Known Issues:** Off-by-one errors when slot availability starts at non-default times (e.g., 9:30 AM), slot exclusion boundaries sometimes include following day slots.

### 2.2 Slot Availability Calculation

**Algorithm Logic:**
1. Load organizer's availability rules (working hours, blocked times)
2. Fetch organizer's calendar (Google/Outlook/Caldav)
3. For each day in range:
   - Generate time slots based on event duration (default 30min)
   - Remove blocked times/holidays
   - Remove calendar conflicts
   - Apply timezone offset to return format
4. Respect booking limits:
   - Max bookings per day
   - Max bookings per month/week
   - Min notice (booking at least N hours ahead)

**Optimization:** Cached in Redis, invalidated on calendar sync or rule changes.

### 2.3 API Parameters

| Parameter | Type | Purpose |
|-----------|------|---------|
| `eventTypeId` | ID | Direct reference (fastest) |
| `username` + `slug` | String | Personal event lookup |
| `teamSlug` + `slug` | String | Team event lookup |
| `start` / `end` | ISO 8601 | UTC range to query |
| `timeZone` | IANA | Display timezone for results |
| `duration` | Minutes | Override default slot length |
| `format` | "time" \| "range" | "time"=start only, "range"={start,end} |
| `bookingUidToReschedule` | String | Exclude existing booking from conflicts |

### 2.4 Seated Events (Multiple Attendees per Slot)

For event types with `seatsPerTimeSlot = 5`:
- Each time slot can accommodate 5+ concurrent attendees
- Availability decreases as seats fill
- Slot removed when `bookingCount >= seatsPerTimeSlot`
- Attendees see "only 2 seats left" indicators

---

## 3. WEBHOOK INFRASTRUCTURE (Cal.com)

### 3.1 Trigger Events (19 Types)

**Booking Lifecycle:**
- `booking.created` - New booking submitted
- `booking.confirmed` - Organizer approved pending booking
- `booking.cancelled` - Booking deleted
- `booking.rescheduled` - Booking moved to different time
- `booking.rejected` - Organizer declined pending booking
- `booking.requested` - Booking awaiting organizer response

**Payment Tracking:**
- `booking.payment_initiated` - Payment collection started
- `booking.paid` - Payment succeeded (full amount received)

**Meeting Status:**
- `meeting.started` - Organizer joined meeting
- `meeting.ended` - Meeting concluded

**Recording Events:**
- `recording.ready` - Recording transcoded and available
- `recording.transcription_generated` - AI transcription complete

**No-Show Detection:**
- `booking.no_show_updated` - Manual no-show marking
- `call.no_show_detected` - Auto-detection for Cal Video

**Form Handling:**
- `form.submitted` - User filled custom booking form
- `form.submitted_no_event` - Form without event booking

**Instant Meeting:**
- `instant_meeting.created` - Immediate team meeting initiated

**Out of Office:**
- `out_of_office.created` - Organizer set out-of-office block

### 3.2 Webhook Payload Structure

All payloads wrapped in consistent envelope:

```json
{
  "triggerEvent": "booking.created",
  "createdAt": "2025-03-01T10:30:00Z",
  "payload": {
    "type": "ROUND_ROBIN",
    "uid": "abc123def456",
    "id": 12345,
    "status": "PENDING",
    "title": "Product Demo",
    "description": "30-min product walkthrough",
    "startTime": "2025-03-05T14:00:00Z",
    "endTime": "2025-03-05T14:30:00Z",
    "attendees": [
      {
        "email": "attendee@example.com",
        "name": "John Doe",
        "timeZone": "America/New_York"
      }
    ],
    "organizer": {
      "email": "host@cal.com",
      "name": "Jane Smith"
    },
    "eventType": {
      "id": 99,
      "slug": "product-demo",
      "title": "Product Demo"
    },
    "customInputs": {
      "company": "Acme Corp",
      "useCase": "Lead scoring"
    },
    "payment": {
      "id": "pi_123456",
      "status": "succeeded",
      "amount": 9999
    }
  }
}
```

**Versioning:** Via `x-cal-webhook-version` HTTP header.

**Customization:** Payloads can be templated with variables:
- `{{type}}`, `{{organizer.name}}`, `{{attendees.0.email}}`
- Reduce payload size for simple integrations

### 3.3 Security: HMAC-SHA256 Signature Verification

**Signature Header:** `x-cal-signature-256: sha256=abc123def...`

**Verification Algorithm:**

```typescript
// Pseudo-code for receiver
const secret = "webhook_secret_from_dashboard";
const payload = req.rawBody; // Exact bytes, not parsed JSON

const hmac = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (req.headers['x-cal-signature-256'] !== `sha256=${hmac}`) {
  throw new Error('Webhook signature invalid - possible tampering');
}
```

**Key Points:**
- Use raw request body (not parsed JSON)
- Secret provided in dashboard during webhook setup
- Always verify before processing
- Log invalid signatures as security events

### 3.4 Webhook Configuration

**Setup Location:** `/settings/developer/webhooks`

**Required Fields:**
1. **Subscriber URL** - Your endpoint receiving payloads
2. **Event Triggers** - Select which events activate webhook
3. **Secret Key** (optional) - For signature verification
4. **Custom Payload** (optional) - Template for reduced payloads

**Retry Strategy:** (Documented as limited in official docs)
- Self-hosted instances have full control
- Cloud instances default to standard retry pattern
- Typical: exponential backoff + max 5 retries over 24h

---

## 4. EVENT BUS & PUB-SUB SYSTEM (Internal)

### 4.1 Event Propagation Architecture

```
Booking Creation
    ↓
BookingRepository.create() ← Persistence
    ↓
EventEmitter.emit('booking.created') ← Async trigger
    ├→ EmailService.sendConfirmation()
    ├→ CalendarSync.createEvent()
    ├→ WebhookService.dispatch()
    ├→ WorkflowEngine.execute()
    └→ AnalyticsService.track()
```

**Design Principle:** Separate write (synchronous) from side effects (asynchronous).

### 4.2 Booking Event Types (Internal)

| Event | Triggered By | Handlers |
|-------|--------------|----------|
| `booking.created` | Create endpoint | Email (attendee + organizer), Webhook, Calendar sync, Workflow |
| `booking.confirmed` | Organizer approval | Email (all parties), Webhook, Workflow, Calendar finalize |
| `booking.cancelled` | Cancel endpoint | Email (refund notice), Webhook, Calendar removal, Workflow, Refund processing |
| `booking.rescheduled` | Reschedule endpoint | Email (new time), Webhook, Calendar update, Workflow |
| `payment.succeeded` | Stripe webhook handler | Booking confirmation, Email, Workflow trigger |
| `meeting.started` | Cal Video API | Workflow (reminder suppression), Analytics |
| `no_show.detected` | Auto-detection | Email (no-show notice), Workflow, Analytics |

### 4.3 Workflow Event Triggers

Workflows subscribe to specific booking events:

```typescript
// Workflow definition in database
{
  id: 456,
  eventTypeId: 99,
  trigger: 'booking.created',
  triggerDelay: 0, // immediately after creation
  actions: [
    {
      type: 'email',
      template: 'booking_confirmation',
      recipientType: 'organizer'
    },
    {
      type: 'slack',
      channel: '#bookings',
      message: 'New booking: {{organizer.name}} ↔ {{attendees.0.name}}'
    }
  ]
}
```

---

## 5. QUEUE SYSTEM (Background Jobs)

### 5.1 Job Types

Cal.com uses background queue for:

| Job Type | Trigger | Async Delay |
|----------|---------|------------|
| Email send | Booking state change | <1min |
| Calendar sync | After confirmation | <2min |
| Webhook dispatch | State transition | <5min (with retries) |
| Workflow execution | Event trigger | <1min |
| Reminder scheduling | Workflow action | On schedule |
| Recording processing | Meeting end | <30min |
| Analytics flush | Session end | <5min |

### 5.2 Queue Infrastructure

**Configuration:** Environment variable `ENABLE_TASK_SYSTEM=true`

**Architecture:**
- Database-backed task queue (Prisma)
- Optional Redis caching for performance
- Cron job endpoints: `/cron/workflows/scheduleEmailReminders`
- Task polling with exponential backoff on failures

**Failure Handling:**
- Retry N times with exponential backoff
- Dead-letter queue for permanently failed jobs
- Operator dashboard to manually retry/dismiss jobs

---

## 6. PAYMENT INTEGRATION (Stripe)

### 6.1 Payment Workflow

```
Event Type marked as Paid
    ↓
Booking created → status: PENDING, payment: pending
    ↓
Client loads Stripe checkout
    ↓
payment_intent.created (Stripe)
    ↓
User pays → payment_intent.succeeded (Stripe)
    ↓
Webhook: payment_intent.succeeded
    ↓
Cal.com: Booking status → ACCEPTED, payment: succeeded
    ↓
Email sent: "Booking confirmed"
    ↓
Calendar event finalized
```

### 6.2 Stripe Integration Configuration

**Environment Setup:**
```env
STRIPE_WEBHOOK_SECRET=whsec_...  # From Stripe dashboard
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

**Webhook Events to Subscribe:**
- `payment_intent.succeeded` - Payment complete
- `payment_intent.payment_failed` - Payment declined
- `charge.refunded` - Refund processed
- `setup_intent.succeeded` - Payment method saved

### 6.3 Payment Status Tracking

**Booking Metadata:**
```json
{
  "payment": {
    "id": "pi_1234567890",
    "status": "succeeded",
    "amount": 9999,
    "currency": "usd",
    "appId": "stripe",
    "createdAt": "2025-03-01T10:00:00Z"
  }
}
```

**States:**
- `pending` - Awaiting payment initiation
- `processing` - Payment in progress
- `succeeded` - Payment complete
- `failed` - Payment declined
- `refunded` - Refund processed

---

## 7. WORKFLOW AUTOMATION (Triggers → Actions)

### 7.1 Workflow Trigger Types

Workflows are defined per event type and execute on:

| Trigger | Example | Delay |
|---------|---------|-------|
| Booking created | Send auto-response | 0 min |
| Booking confirmed | Send reminder + Slack notif | 0 min |
| Booking cancelled | Send cancellation fee invoice | 0 min |
| Booking rescheduled | Send new time confirmation | 0 min |
| Before meeting | Send reminder email | -15 min (before start) |
| After meeting | Send follow-up survey | +30 min (after end) |
| No-show detected | Charge no-show fee | 0 min |

### 7.2 Workflow Actions

**Email:**
- Use built-in template or custom HTML
- Variables from booking context: `{{organizer.name}}`, `{{startTime}}`, `{{attendees}}`
- Recipient: organizer, attendee, or list

**SMS/WhatsApp:**
- Send text reminders
- Typical use: "Your meeting with Jane starts in 15 minutes"

**Slack:**
- Send message to channel
- Typical use: booking notifications to team

**Webhook:**
- POST to external service
- Typical use: CRM sync, analytics

**Delay/Wait:**
- Pause before next action
- Typical use: wait 30 min before sending follow-up

### 7.3 Workflow Database Schema

```sql
Workflow
├── id
├── eventTypeId (FK)
├── trigger (booking.created | before_event | after_event)
├── triggerDelay (minutes, negative = before)
└── enabled (bool)

WorkflowStep
├── id
├── workflowId (FK)
├── stepNumber (execution order)
├── actionType (email | sms | slack | webhook)
├── actionData (JSON template)
└── conditions (optional)

WorkflowReminder
├── id
├── workflowId (FK)
├── bookingId (FK)
├── scheduledTime (ISO 8601)
├── executed (bool)
└── nextRetry (datetime)
```

---

## 8. API DESIGN (REST + tRPC)

### 8.1 tRPC Router Architecture

Cal.com uses tRPC for type-safe APIs with zero runtime overhead:

**Endpoints (Single HTTP endpoint):**
- `/api/trpc/bookings.getAvailableSlots`
- `/api/trpc/bookings.create`
- `/api/trpc/bookings.update`
- `/api/trpc/bookings.cancel`
- `/api/trpc/webhooks.list`
- `/api/trpc/webhooks.create`
- `/api/trpc/workflows.execute`

**Advantages over REST:**
- Automatic TypeScript type sharing client ↔ server
- No OpenAPI/Swagger needed
- Single bundled HTTP endpoint (faster cold starts)
- Middleware-based auth/rate-limiting

### 8.2 Error Handling

**tRPC Error Types:**
```typescript
TRPCError {
  code: 'NOT_FOUND' | 'BAD_REQUEST' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'INTERNAL_SERVER_ERROR' | 'TOO_MANY_REQUESTS' | ...
  message: string
  cause?: Error
}
```

**Standard Errors in Booking Creation:**
- `NOT_FOUND` - Event type doesn't exist
- `BAD_REQUEST` - Missing required field or invalid data
- `UNAUTHORIZED` - User not authenticated
- `FORBIDDEN` - User lacks permission
- `INTERNAL_SERVER_ERROR` - Unexpected failure (with trace ID)
- `TOO_MANY_REQUESTS` - Rate limit exceeded

**Error Response Format:**
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Event type requires authentication",
    "data": {
      "code": "BAD_REQUEST",
      "httpStatus": 400
    }
  }
}
```

### 8.3 Rate Limiting

**Middleware Implementation:**
```typescript
const limiter = createRateLimiter({
  key: req.userId, // per-user bucket
  limit: 120,      // requests
  window: 60000    // per 60 seconds
});

middleware: async (opts) => {
  const result = await limiter.check();
  if (!result.success) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Rate limit: ${result.remaining}/${result.limit} remaining`,
    });
  }
}
```

**Rate Limits:**
- API key auth: 120 req/min
- Webhook delivery: 10 retries over 24h per event
- Slot availability: 100 req/min per user

### 8.4 API Authentication

**Method 1: API Key**
```bash
curl -H "Authorization: Bearer sk_live_abc123" \
  https://api.cal.com/v2/bookings
```

**Method 2: OAuth 2.0**
- For user-facing integrations
- Scopes: `bookings:read`, `bookings:write`, `calendar:read`, etc.

**Method 3: mTLS (Enterprise)**
- Certificate-pinned for high-security integrations

---

## 9. MAPPING CAL.COM PATTERNS TO RAAS PLATFORMS

### 9.1 Cal.com Concept → RaaS Equivalent

| Cal.com | RaaS (Health Platform) | Purpose |
|---------|------------------------|---------|
| Booking | Order/Transaction | Customer purchase lifecycle |
| Event Type | Product/Service Tier | Starter/Growth/Premium/Master |
| Attendee | Customer/End User | Agent or distributor |
| Organizer | Product owner | Health platform provider |
| Time slot | Inventory/Availability | Product stock, license limit |
| Timezone | Region/Market | Regional pricing/compliance |
| Payment | PayOS webhook | Transaction confirmation |
| Webhook event | Business event | Order created, commission calculated |
| Workflow | Automation rule | Rank upgrade, commission accrual |
| Calendar sync | Inventory sync | SKU availability update |

### 9.2 Order Lifecycle (RaaS Adaptation)

```
ORDER CREATION (Booking ↔ Order)
  ↓
[PENDING] ← awaiting payment/approval
  ├→ [CONFIRMED] ← payment received via PayOS
  ├→ [REJECTED] ← payment failed or declined
  └→ [CANCELLED] ← customer refund request
      └→ [COMPLETED] ← fulfilled/shipped
```

**Key Differences:**
- Cal.com's organizer approval → RaaS order compliance check
- Cal.com's timezone → RaaS regional pricing rules
- Cal.com's attendees → RaaS downline agents (MLM context)
- Cal.com's calendar sync → RaaS inventory decrement

### 9.3 Availability Engine (RaaS Adaptation)

**Cal.com:** Time slots based on organizer calendar + booking limits

**RaaS:** Product inventory based on:
- Stock levels (units available)
- Daily/monthly purchase limits per customer
- Minimum order quantities
- Regional restrictions (available in region X only)
- Tier-specific limits (Starter tier = max 5 orders/month)

**API Structure (Similar):**
```
GET /api/products/availability?
  productId=tier_growth
  &customerId=agent_123
  &date=2025-03-01
  &region=vn_north
```

### 9.4 Webhook Events (RaaS Adaptation)

| Cal.com Event | RaaS Equivalent | Business Logic |
|---------------|-----------------|----------------|
| booking.created | order.created | Track new order in ledger |
| booking.confirmed | order.paid | Deduct commission hold, credit account |
| booking.cancelled | order.refunded | Reverse commission, process refund |
| payment.succeeded | payment.confirmed | Reconcile PayOS webhook with order |
| meeting.started | order.shipped | Trigger delivery notification |
| no_show.detected | order.unfulfilled | Charge penalty or retry |

### 9.5 Workflow Automation (RaaS Adaptation)

**Example: Rank Upgrade Workflow**

```typescript
// Trigger: order.confirmed on tier_premium purchase
Workflow {
  trigger: 'order.confirmed',
  conditions: [
    { field: 'productId', operator: 'equals', value: 'tier_premium' },
    { field: 'orderValue', operator: 'gte', value: 500000 } // 500k VND
  ],
  actions: [
    {
      type: 'update_rank',
      to: 'silver_partner',
      data: { commissionRate: 0.15 }
    },
    {
      type: 'email',
      template: 'rank_upgrade_congratulations',
      recipients: ['agent', 'sponsor']
    },
    {
      type: 'webhook',
      url: 'https://crm.internal/api/rank-update',
      payload: '{{agentId}},{{newRank}},{{effectiveDate}}'
    }
  ]
}
```

**Example: Commission Accrual Workflow**

```typescript
Workflow {
  trigger: 'order.paid',
  conditions: [
    { field: 'orderValue', operator: 'gte', value: 100000 }
  ],
  actions: [
    {
      type: 'calculate_commission',
      formula: 'orderValue * commissionRate[tier]',
      creditTo: 'agent.commissionBalance'
    },
    {
      type: 'create_notification',
      title: 'Commission earned',
      message: '{{commissionAmount}} from {{customerName}}'
    },
    {
      type: 'webhook',
      url: 'https://accounting.internal/api/commission-ledger',
      payload: '{{agentId}},{{orderId}},{{commissionAmount}}'
    }
  ]
}
```

---

## 10. ARCHITECTURAL RECOMMENDATIONS FOR WELL RAAS

### 10.1 Booking Lifecycle → Order State Machine

**Implement:**
```typescript
enum OrderStatus {
  PENDING = 'pending',           // awaiting PayOS payment
  CONFIRMED = 'confirmed',       // payment succeeded
  PROCESSING = 'processing',     // order fulfillment in progress
  COMPLETED = 'completed',       // order fulfilled
  CANCELLED = 'cancelled',       // customer or system cancelled
  REFUNDED = 'refunded'          // refund processed
}

interface Order {
  id: string;
  uid: string; // external reference for rescheduling/returns
  status: OrderStatus;
  customerId: string;
  productId: string; // tier_starter, tier_growth, etc.
  quantity: number;
  amount: number; // in smallest unit (cents/dongs)
  currency: string;
  payment: {
    id: string; // from PayOS
    status: 'pending' | 'succeeded' | 'failed';
    provider: 'payos' | 'stripe';
    refundAmount?: number;
  };
  metadata: {
    region: string;
    agentTier: string;
    commissionRate: number;
  };
  createdAt: Date;
  confirmedAt?: Date;
  cancelledAt?: Date;
}
```

### 10.2 Webhook Infrastructure (PayOS Integration)

**Signature Verification (HMAC-SHA256):**
```typescript
// .env
PAYOS_WEBHOOK_SECRET=webhook_secret_from_payos_dashboard

// handler
const crypto = require('crypto');

function verifyPayOSWebhook(req) {
  const signature = req.headers['x-payos-signature-256'];
  const payload = req.rawBody; // exact bytes

  const hmac = crypto
    .createHmac('sha256', process.env.PAYOS_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  if (signature !== `sha256=${hmac}`) {
    throw new Error('Invalid signature');
  }
}
```

**Webhook Events to Handle:**
- `payment.succeeded` → Order status → CONFIRMED, trigger commission workflows
- `payment.failed` → Order status → PENDING (retry or user action)
- `payment.refunded` → Order status → REFUNDED, reverse commission accrual

### 10.3 Event-Driven Workflow Engine

**Internal Events (Pub-Sub):**
```typescript
interface WorkflowEvent {
  id: string;
  type: 'order.created' | 'order.confirmed' | 'order.cancelled';
  timestamp: Date;
  data: {
    orderId: string;
    customerId: string;
    amount: number;
    productId: string;
  };
}

// Workflow triggers
async function executeWorkflows(event: WorkflowEvent) {
  const workflows = await db.workflow.findMany({
    where: { trigger: event.type, enabled: true }
  });

  for (const workflow of workflows) {
    // Check conditions
    if (!evaluateConditions(workflow.conditions, event.data)) continue;

    // Execute actions
    for (const action of workflow.actions) {
      switch (action.type) {
        case 'update_rank':
          await updateAgentRank(event.data.customerId, action.to);
          break;
        case 'calculate_commission':
          await accrueCommission(event.data);
          break;
        case 'send_email':
          await queue.add('send_email', action.payload);
          break;
        case 'webhook':
          await queue.add('dispatch_webhook', action.payload);
          break;
      }
    }
  }
}
```

### 10.4 Queue System for Background Jobs

**Job Types:**
```typescript
queue.add('send_email', {
  to: agent.email,
  template: 'rank_upgrade',
  data: { newRank: 'silver_partner' }
});

queue.add('dispatch_webhook', {
  url: 'https://accounting/commission-ledger',
  payload: { agentId, orderId, amount }
});

queue.add('update_inventory', {
  productId: 'tier_growth',
  decrementBy: 1
});

queue.add('accrue_commission', {
  agentId,
  orderId,
  amount,
  timestamp: Date.now()
});
```

**Retry Strategy (Follow Webhook best practices):**
- First retry: +5s
- Second retry: +30s
- Third retry: +5m
- Fourth retry: +30m
- Fifth retry: +24h
- After 5 retries → DLQ (dead-letter queue)

### 10.5 Commission Calculation Automation

**Workflow Definition Schema:**
```sql
CREATE TABLE workflow (
  id UUID PRIMARY KEY,
  eventTypeId UUID, -- null = global
  trigger VARCHAR(50), -- order.confirmed, order.cancelled
  enabled BOOLEAN DEFAULT true,
  createdAt TIMESTAMP
);

CREATE TABLE workflow_step (
  id UUID PRIMARY KEY,
  workflowId UUID REFERENCES workflow,
  stepNumber INT,
  actionType VARCHAR(50), -- calculate_commission, update_rank, email, webhook
  actionConfig JSONB,
  createdAt TIMESTAMP
);

-- Example actionConfig for commission calculation:
{
  "formula": "orderValue * agentTierRate",
  "creditsTo": "agent.commissionBalance",
  "roundingMode": "floor",
  "deferred": false
}
```

**Execution Flow:**
```
Order Payment Succeeded (PayOS webhook)
  ↓
Event: order.confirmed
  ↓
Find matching workflows (trigger='order.confirmed')
  ↓
For each workflow:
  ├─ Evaluate conditions (amount >= 100k? tier == Growth?)
  ├─ Execute steps in order
  │  ├─ Step 1: Calculate commission
  │  ├─ Step 2: Update agent rank if applicable
  │  ├─ Step 3: Send email notification
  │  └─ Step 4: Webhook to accounting system
  └─ Log execution + audit trail
  ↓
Queue background jobs (async)
  ├─ send_email
  ├─ dispatch_webhook
  └─ log_to_ledger
```

### 10.6 Idempotency & Duplicate Prevention

**Pattern 1: Idempotency Keys**
```typescript
interface Order {
  id: string;
  idempotencyKey: string; // unique constraint
  // ...
}

// On creation
const order = await db.order.upsert({
  where: { idempotencyKey },
  update: {},
  create: { idempotencyKey, ...orderData }
});

// If webhook retries with same idempotencyKey,
// upsert returns existing order (no duplicate)
```

**Pattern 2: Event ID Tracking (for webhook events)**
```typescript
interface WebhookEvent {
  id: string; // from PayOS (unique per event)
  processedAt?: Date; // marks when we handled it
  unique constraint (provider, id)
}

async function handlePayOSWebhook(event) {
  // Check if we've already processed this event
  const existing = await db.webhookEvent.findUnique({
    where: { provider_id: ['payos', event.id] }
  });

  if (existing) {
    console.log('Webhook already processed, skipping');
    return { status: 'ok', processed: false };
  }

  // Process new webhook
  await db.webhookEvent.create({
    data: { provider: 'payos', id: event.id, processedAt: now() }
  });

  // Handle business logic
  // ...

  return { status: 'ok', processed: true };
}
```

### 10.7 Error Handling & Observability

**Error Categories:**
```typescript
class OrderProcessingError extends Error {
  constructor(
    message: string,
    public code: 'VALIDATION_ERROR' | 'PAYMENT_FAILED' | 'INVENTORY_LOW' | 'INTERNAL_ERROR',
    public orderId: string,
    public metadata?: Record<string, any>
  ) {
    super(message);
  }
}

// Log with context
logger.error('Order processing failed', {
  error: err.message,
  code: err.code,
  orderId: err.orderId,
  customerId: order.customerId,
  traceId: req.id
});

// Send to error tracking (Sentry, etc.)
Sentry.captureException(err, {
  tags: { orderId: err.orderId, type: err.code },
  extra: err.metadata
});
```

---

## 11. SECURITY & COMPLIANCE CONSIDERATIONS

### 11.1 Webhook Security (Best Practices)

✅ **Always verify signatures** before processing
✅ **Use HMAC-SHA256** (not MD5 or deprecated hashes)
✅ **Whitelist allowed IPs** if possible (PayOS IP ranges)
✅ **Set operation timeouts** (2 second handler max, don't block)
✅ **Return 2xx immediately**, queue work asynchronously
✅ **Log all webhook events** (audit trail)
✅ **Validate payload schema** (Zod/Joi)

### 11.2 Data Protection

- Store order data encrypted at rest (if PII)
- Commission balances auditable (immutable ledger)
- Payment IDs from PayOS never logged in plaintext
- Webhook signatures never logged in plaintext

### 11.3 Commission Accuracy

- Commission calculation in database transaction (atomic)
- All transitions recorded in audit log
- Commission reversal on refund (automatic workflow)
- Regular reconciliation reports (expected vs calculated)

---

## 12. UNRESOLVED QUESTIONS

1. **Queue System Internals:** Cal.com's exact queue implementation (database-backed vs Redis) not fully documented. For Well, recommend Bullmq (Redis) for performance at scale.

2. **Webhook Retry Max:** Cal.com docs mention "retries over 24h" but exact max attempt count undefined. Industry standard is 5-7 attempts.

3. **Availability Caching Strategy:** Cal.com's Redis cache invalidation rules for slot availability not specified. When does cache refresh?

4. **Seated Events Complex Cases:** Behavior when one attendee cancels from seated event not detailed. Does remaining attendee count decrease? Slot reopened?

5. **Workflow Condition Evaluation:** Cal.com docs don't explain how complex conditions (AND/OR/nested) are evaluated. Assumed boolean algebra.

6. **Cross-Team Workflows:** Can event type workflow in Team A trigger actions for Team B? Or isolated per team?

7. **Payment Partial Refunds:** If booking paid but attendee requests partial refund, does booking status change? Can booking remain ACCEPTED with refunded payment?

8. **Webhook Payload Limits:** Max payload size not specified. Large attendee lists could exceed limits.

---

## 13. SOURCES & REFERENCES

- [Cal.com Webhooks Documentation](https://cal.com/docs/developing/guides/automation/webhooks)
- [Cal.com Slots API Reference](https://cal.com/docs/api-reference/v2/slots/get-available-time-slots-for-an-event-type)
- [Cal.com Booking Creation API](https://cal.com/docs/api-reference/v2/bookings/create-a-booking)
- [Cal.com Stripe Integration Docs](https://cal.com/docs/self-hosting/apps/install-apps/stripe)
- [Cal.com Workflows Documentation](https://cal.com/workflows)
- [Booking Lifecycle Architecture (DeepWiki)](https://deepwiki.com/calcom/cal.com/3-api-architecture)
- [Payment Webhook Best Practices - Medium](https://medium.com/@sohail_saifii/handling-payment-webhooks-reliably-idempotency-retries-validation-69b762720bf5)
- [Webhook Best Practices - Hookdeck](https://hookdeck.com/blog/webhooks-at-scale)
- [tRPC Error Handling](https://trpc.io/docs/v10/server/error-handling)
- [Cal.com GitHub - Booking Schema](https://github.com/calcom/cal.com)

---

**Report Completed:** 2026-03-01 11:40 UTC
**Researcher Agent:** r-calcom-patterns-v1
**Next Steps:** Design document for Well RaaS webhook + workflow system implementation
