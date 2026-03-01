# Inngest Architecture Deep Dive

**Report Date:** 2026-03-01
**Status:** Comprehensive Research
**Focus:** Event-Driven Function Orchestration Platform
**Target:** WellNexus Payment SDK Integration Planning

---

## Executive Summary

Inngest is a zero-infrastructure event-driven function orchestration platform that replaces queues, cron jobs, state management, and scheduling with durable step functions. Built on a Go server core, it provides a TypeScript SDK that enables developers to define reliable workflows without touching infrastructure. The platform combines event streams, multi-tier queues, and durable execution into a single reliability layer.

**Key Value Proposition:** Write ordinary async functions that survive any failure, scale automatically, and integrate seamlessly with serverless platforms.

---

## 1. CORE ARCHITECTURE

### 1.1 High-Level System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer (TypeScript)              │
│  ┌──────────────┐  ┌────────────────────┐  ┌──────────────┐   │
│  │ Event Source │  │ Inngest Functions  │  │ Event Triggers   │
│  │ (Webhooks)   │  │ (createFunction)   │  │ (pattern matching)
│  └──────┬───────┘  └────────────────────┘  └──────────────┘   │
│         │                                                       │
└─────────┼───────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Event API (HTTP Endpoint)                       │
│  • Receives events via inngest.send()                            │
│  • Authenticates via Event Keys                                  │
│  • Validates event payloads                                      │
└─────────┬───────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│               Event Stream (Internal Buffer)                      │
│  • Acts as buffer between Event API and Runner                   │
│  • Enables event replay and historical audit                     │
│  • Persisted to State Store                                      │
└─────────┬───────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Runner (Go Server)                            │
│  ┌─────────────────────────────────────────────────────┐        │
│  │ 1. Event Consumption & Processing                   │        │
│  │    • Matches events to function triggers            │        │
│  │    • Schedules new function "runs" (jobs)          │        │
│  │    • Creates initial run state                      │        │
│  │                                                      │        │
│  │ 2. Flow Control Application                        │        │
│  │    • Applies concurrency limits                     │        │
│  │    • Applies rate limiting/throttling               │        │
│  │    • Applies debouncing logic                       │        │
│  │    • Applies batching rules                         │        │
│  │                                                      │        │
│  │ 3. State Management                                │        │
│  │    • Stores run state in State Store               │        │
│  │    • Tracks step execution                          │        │
│  │    • Manages pause/resume states                    │        │
│  │                                                      │        │
│  │ 4. Special Event Handling                          │        │
│  │    • Resumes paused functions (waitForEvent match) │        │
│  │    • Cancels functions with matching cancelOn      │        │
│  │    • Emits failure events (inngest/function.failed)│        │
│  └─────────────────────────────────────────────────────┘        │
└─────────┬───────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│            Multi-Tier Queue (Fairness + Flow Control)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Priority Q   │  │ Standard Q    │  │ Throttle Q   │          │
│  │ (prioritized)│  │ (FIFO)        │  │ (rate-limited)
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  • Per-account scope across multiple functions                  │
│  • Unique concurrency keys enable virtual queueing              │
│  • Fairness prevents single tenant from starving others         │
└─────────┬───────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│              Function Invocation (Serverless)                    │
│  • Next.js App Router, AWS Lambda, Deno Deploy, etc.            │
│  • SDK polls or receives HTTP POST with step params            │
│  • Function executes step and returns result                    │
└─────────┬───────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│              State Store (PostgreSQL/SQLite)                      │
│  • Persists events, runs, steps, and state                       │
│  • Enables replay, debugging, and audit                          │
│  • Self-hosting: SQLite (default) or PostgreSQL                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Design Principles

**1. Event-Driven:** Everything starts with events. Functions declare triggers as event patterns.

```typescript
// Function only runs when this event matches
{ event: "payment/charge.completed" }
```

**2. Durable Execution:** Steps are atomic units that survive any failure. Inngest tracks which steps completed.

**3. Zero Infrastructure:** No polling, queues, or cron management required. Inngest handles all orchestration.

**4. Type Safety:** Full TypeScript support with compile-time validation of event schemas.

**5. Observability Built-In:** Every step is traced, every failure is logged, every run is inspectable.

---

## 2. INNGEST FUNCTIONS (createFunction)

### 2.1 Basic Structure

```typescript
import { inngest } from "./client";

export default inngest.createFunction(
  // Config object
  {
    id: "unique-function-id",           // Required, immutable identifier
    name: "Friendly Display Name",      // Optional, shown in UI
    concurrency: {
      limit: 10,                        // Max concurrent executions
      key: "event.data.userId"          // Per-user concurrency
    },
    retries: 5,                         // Per-step retry count
    timeout: "5m"                       // Max step duration
  },
  // Trigger configuration
  {
    event: "payment/charge.completed",  // Event pattern to match
    filters: {
      and: [
        { "data.amount": { gt: 100 } }  // Optional filtering
      ]
    }
  },
  // Handler function
  async ({ event, step, runId }) => {
    // event: typed event data
    // step: API for defining atomic steps
    // runId: unique run identifier for debugging

    return "result";
  }
);
```

### 2.2 Configuration Options

| Option | Type | Purpose |
|--------|------|---------|
| `id` | string | Unique, immutable function identifier |
| `name` | string | Display name in UI |
| `concurrency` | object | Limit concurrent executions (per key) |
| `retries` | number | Retry attempts per step (default 3) |
| `timeout` | string | Max duration per step (e.g., "5m") |
| `rateLimit` | object | Hard limit on starts per period |
| `throttle` | object | Buffer queue, match frequency |
| `debounce` | object | Wait for quiet period before executing |
| `batchSize` | number | Batch multiple events per run |
| `priority` | number | Higher priority runs first |
| `cancelOn` | array | Cancel event patterns |

### 2.3 Complete Example: Payment Processing Flow

```typescript
export const processPayment = inngest.createFunction(
  {
    id: "process-payment-webhook",
    name: "Process Payment Webhook",
    concurrency: {
      limit: 5,
      key: "event.data.customerId" // Per-customer limit
    },
    retries: 3,
    timeout: "30s"
  },
  { event: "stripe/payment.success" },
  async ({ event, step, runId }) => {
    console.log(`Processing payment: ${runId}`, event.data);

    // Step 1: Validate payment
    const validationResult = await step.run(
      "validate-payment",
      async () => {
        // This step will retry independently if it fails
        const payment = await stripe.payments.retrieve(
          event.data.paymentId
        );

        if (!payment.valid) {
          throw new Error("Invalid payment");
        }

        return payment;
      }
    );

    // Step 2: Update database
    const updated = await step.run(
      "update-user-account",
      async () => {
        return await db.users.update({
          id: event.data.customerId,
          creditsAdded: event.data.amount / 100,
          lastPaymentAt: new Date()
        });
      }
    );

    // Step 3: Send confirmation email
    await step.run(
      "send-confirmation-email",
      async () => {
        await email.send({
          to: event.data.customerEmail,
          template: "payment-received",
          data: {
            amount: event.data.amount,
            orderId: event.data.orderId
          }
        });
      }
    );

    // Step 4: Fan-out to other functions
    await step.sendEvent("fan-out-events", [
      {
        name: "user/credits.added",
        data: {
          userId: event.data.customerId,
          creditsAdded: event.data.amount / 100
        }
      },
      {
        name: "analytics/payment.completed",
        data: {
          customerId: event.data.customerId,
          amount: event.data.amount
        }
      }
    ]);

    return {
      success: true,
      updated,
      runId
    };
  }
);
```

---

## 3. STEP FUNCTIONS (Step API)

### 3.1 Step Types & Methods

#### **step.run(id, handler)**
Executes arbitrary async code with automatic retry.

```typescript
const result = await step.run("fetch-user", async () => {
  // Returns value or throws error
  // Each retry is independent
  const user = await db.users.findById(event.data.userId);
  return user;
});
```

**Key Features:**
- Independent retry counter per step
- Result cached after successful execution
- Can access previous step results
- Timeout inherited from function config

#### **step.sleep(id, duration)**
Pauses execution for specified duration.

```typescript
// Wait 2 hours before sending follow-up email
await step.sleep("wait-2-hours", "2h");

await step.run("send-followup", async () => {
  await email.send(followupMessage);
});
```

**Use Cases:**
- Delayed notifications
- Rate limit compliance
- Batching with time windows
- Durable delays (survives server restart)

#### **step.waitForEvent(id, config)**
Pauses until matching event arrives (with timeout).

```typescript
const completionEvent = await step.waitForEvent(
  "wait-for-account-setup",
  {
    event: "user/account.setup.completed",
    timeout: "7d",
    match: "event.data.userId === async.event.data.userId"
  }
);

if (!completionEvent) {
  // Timeout reached, handle accordingly
  await step.run("send-reminder", async () => {
    await email.send(reminder);
  });
}
```

**Features:**
- Pause execution indefinitely (survives restarts)
- Conditional matching via expressions
- Timeout with fallback behavior
- Resume automatically when event matches

#### **step.sendEvent(id, events)**
Triggers other functions via events (fan-out).

```typescript
await step.sendEvent("trigger-downstream", [
  {
    name: "user/account.created",
    data: { userId: event.data.userId }
  },
  {
    name: "analytics/signup.completed",
    data: {
      userId: event.data.userId,
      source: event.data.source
    }
  }
]);
```

**Characteristics:**
- Does not wait for triggered functions
- Ensures reliable delivery
- Returns immediately
- Useful for decoupling logic

#### **step.invoke(id, function)**
Calls another function and waits for result.

```typescript
const sendResult = await step.invoke(
  "invoke-send-email",
  {
    function: emailFunction,
    data: {
      userId: event.data.userId,
      template: "welcome"
    }
  }
);
```

**vs step.sendEvent:**
- `invoke`: Waits for result, blocks execution
- `sendEvent`: Fire-and-forget, enables parallelism

#### **step.fetch(id, url, options)**
Makes HTTP requests with retry and timeout.

```typescript
const response = await step.fetch(
  "fetch-github-user",
  "https://api.github.com/users/torvalds",
  {
    headers: { "Authorization": `Bearer ${token}` }
  }
);

const user = await response.json();
```

**Advantages:**
- HTTP errors trigger retries
- Respects function timeout
- Response cached per step

### 3.2 Step Execution Model

```
Function Run Created
         │
         ▼
┌─────────────────────────┐
│ Step 1: validate        │
│ Status: Pending         │
└────────┬────────────────┘
         │
         ▼
  [EXECUTE on Serverless]
         │
         ▼
    ┌────────────┐
    │ Success?   │
    └─┬──────┬──┘
      │ No   │ Yes
      ▼      ▼
   Retry   Continue
      │      │
      ▼      ▼
   [Backoff] ┌──────────────────────┐
      │      │ Step 1: Result Saved │
      │      │ Status: Completed    │
      │      └────────┬─────────────┘
      │               │
      │               ▼
      │      ┌─────────────────────┐
      │      │ Step 2: update-db   │
      │      │ Status: Pending     │
      │      └────────┬─────────────┘
      │               │
      │               ▼
      │        [EXECUTE on Serverless]
      │               │
      ▼               ▼
  [Max Retries?]   [Continue or Fail?]
    Yes: Fail        │
    No: Retry        ▼
                  ┌────────────────────┐
                  │ Function Complete  │
                  │ All steps done     │
                  └────────────────────┘
```

**Key Properties:**
- Each step has independent retry counter
- Completed steps are idempotent (reuse cached result)
- Failed step stops function
- Runner resumes from last successful step

---

## 4. EVENT SYSTEM

### 4.1 Event Structure

```typescript
// Event definition
interface Event {
  name: string;           // Unique event identifier
  data: unknown;          // Event payload (any JSON)
  timestamp?: number;     // Unix timestamp (auto-set)
  id?: string;           // Event ID for deduplication
  user?: {               // Optional user context
    externalId: string;
    email?: string;
  };
}
```

### 4.2 Event Sources

#### **Direct Sending via inngest.send()**

```typescript
// Server-side sending
await inngest.send({
  name: "payment/charge.completed",
  data: {
    customerId: "user_123",
    amount: 9999,
    currency: "USD"
  }
});

// Batch sending
await inngest.send([
  { name: "event.type.1", data: { /* ... */ } },
  { name: "event.type.2", data: { /* ... */ } }
]);
```

#### **Webhook Integration (Next.js Example)**

```typescript
// pages/api/webhooks/stripe.ts
import { inngest } from "@/inngest/client";

export async function POST(req: Request) {
  const event = await req.json();

  // Transform Stripe event to Inngest event
  if (event.type === "charge.succeeded") {
    await inngest.send({
      name: "stripe/charge.succeeded",
      data: {
        chargeId: event.data.object.id,
        customerId: event.data.object.customer,
        amount: event.data.object.amount
      }
    });
  }

  return { ok: true };
}
```

### 4.3 Event Routing & Matching

**Pattern Matching:**

```typescript
// Exact match
{ event: "payment/charge.completed" }

// Event name can be any string with dots as separators
// Functions with matching patterns trigger

// Multiple events trigger same function
inngest.createFunction(
  { id: "handle-all-payments" },
  { event: ["payment/charge.completed", "payment/charge.failed"] },
  async ({ event, step }) => {
    console.log(`Payment event: ${event.name}`);
  }
);
```

**Filtering (Advanced):**

```typescript
inngest.createFunction(
  { id: "high-value-payments" },
  {
    event: "payment/charge.completed",
    filters: {
      and: [
        { "data.amount": { gt: 10000 } },        // > $100
        { "data.currency": { eq: "USD" } }       // USD only
      ]
    }
  },
  async ({ event, step }) => {
    // Only triggered for high-value USD payments
  }
);
```

### 4.4 Type-Safe Event Schemas

**Using Zod:**

```typescript
import { z } from "zod";
import { EventSchemas } from "inngest";

const PaymentSchema = z.object({
  customerId: z.string(),
  amount: z.number().positive(),
  currency: z.enum(["USD", "EUR", "GBP"])
});

export const inngest = new Inngest({
  id: "my-app",
  schemas: new EventSchemas().fromZod({
    "payment/charge.completed": { data: PaymentSchema },
    "payment/charge.failed": {
      data: PaymentSchema.extend({
        reason: z.string()
      })
    }
  })
});
```

**Type Safety:**

```typescript
// ✅ Compile-time error if wrong schema
await inngest.send({
  name: "payment/charge.completed",
  data: {
    customerId: "user_123",
    amount: "invalid"  // ❌ TypeError: should be number
  }
});

// ✅ Event type is inferred in function handler
inngest.createFunction(
  { id: "process-payment" },
  { event: "payment/charge.completed" },
  async ({ event, step }) => {
    // event.data.customerId is string ✓
    // event.data.amount is number ✓
  }
);
```

---

## 5. RETRY & ERROR HANDLING

### 5.1 Automatic Retry Mechanism

**Default Behavior:**

```typescript
inngest.createFunction(
  {
    id: "with-retries",
    retries: 3  // Default: retry up to 3 times
  },
  { event: "test/event" },
  async ({ step }) => {
    await step.run("flaky-api", async () => {
      // If this fails, Inngest retries with exponential backoff
      return await externalApi.call();
    });
  }
);
```

**Retry Sequence:**

```
Attempt 1: Immediate execution
  ↓ Fails
Attempt 2: Wait ~1s, retry
  ↓ Fails
Attempt 3: Wait ~3s, retry
  ↓ Fails
Attempt 4: Wait ~9s, retry
  ↓ Fails (Max retries exceeded)
Final Failure: Emit inngest/function.failed event
```

### 5.2 Controlling Retry Behavior

#### **RetryAfterError**

```typescript
import { RetryAfterError } from "inngest";

await step.run("call-api", async () => {
  try {
    return await api.call();
  } catch (error) {
    // Rate limited, retry after 60 seconds
    if (error.status === 429) {
      throw new RetryAfterError(
        `Rate limited, retry after ${error.retryAfter}s`,
        { retryAfter: error.retryAfter * 1000 }
      );
    }

    throw error; // Regular retry with backoff
  }
});
```

#### **NonRetriableError**

```typescript
import { NonRetriableError } from "inngest";

await step.run("validate-input", async () => {
  if (!event.data.userId) {
    // Don't retry, fail immediately
    throw new NonRetriableError("Missing userId in event");
  }

  return event.data.userId;
});
```

### 5.3 Failure Callbacks

**Listening for Function Failures:**

```typescript
// Any function that fails emits inngest/function.failed event
inngest.createFunction(
  {
    id: "handle-payment-failures",
    name: "Handle Payment Processing Failures"
  },
  { event: "inngest/function.failed" },
  async ({ event, step }) => {
    const { function: failedFunctionId, error, data } = event.data;

    if (failedFunctionId === "process-payment-webhook") {
      // Custom failure handling
      await step.run("notify-support", async () => {
        await slack.send({
          channel: "#payments-alerts",
          text: `Payment processing failed: ${error.message}`
        });
      });

      // Optionally retry with different strategy
      await step.run("retry-with-backoff", async () => {
        // Manual retry logic
      });
    }
  }
);
```

### 5.4 Error Handling Best Practices

**Pattern 1: Explicit Error Handling**

```typescript
await step.run("get-user", async () => {
  const user = await db.users.findById(event.data.userId);

  if (!user) {
    throw new NonRetriableError(`User ${event.data.userId} not found`);
  }

  return user;
});
```

**Pattern 2: Graceful Degradation**

```typescript
const analytics = await step.run(
  "track-analytics",
  async () => {
    try {
      return await analytics.track(event.data);
    } catch (error) {
      console.warn("Analytics tracking failed", error);
      return null; // Don't fail the entire function
    }
  }
);
```

**Pattern 3: Dead Letter Pattern (Now via Events)**

```typescript
// Instead of traditional DLQ, use event-driven recovery
inngest.createFunction(
  { id: "handle-failed-payments" },
  { event: "inngest/function.failed" },
  async ({ event, step }) => {
    if (event.data.function.id === "process-payment") {
      // Send to recovery function
      await step.sendEvent("send-to-recovery", {
        name: "payment/charge.recovery",
        data: {
          originalPaymentId: event.data.data.paymentId,
          error: event.data.error,
          failedAt: new Date()
        }
      });
    }
  }
);
```

---

## 6. CONCURRENCY CONTROL

### 6.1 Concurrency Limits

**Global Concurrency:**

```typescript
inngest.createFunction(
  {
    id: "limited-execution",
    concurrency: {
      limit: 10  // Max 10 concurrent executions globally
    }
  },
  { event: "batch/process" },
  async ({ event, step }) => {
    // Only 10 of these functions run simultaneously
  }
);
```

**Per-Key Concurrency:**

```typescript
inngest.createFunction(
  {
    id: "per-user-processing",
    concurrency: {
      limit: 2,
      key: "event.data.userId"  // 2 concurrent per unique user
    }
  },
  { event: "user/action" },
  async ({ event, step }) => {
    // User A: max 2 concurrent
    // User B: max 2 concurrent
    // Separate queues per user
  }
);
```

### 6.2 Rate Limiting (Hard Limit)

**Function-Level Rate Limiting:**

```typescript
inngest.createFunction(
  {
    id: "rate-limited-api",
    rateLimit: {
      limit: 100,
      period: "1h"  // Max 100 starts per hour
    }
  },
  { event: "api/request" },
  async ({ event, step }) => {
    // At most 100 function runs start per hour
    // Additional events are skipped (dropped)
  }
);
```

**Per-Key Rate Limiting:**

```typescript
inngest.createFunction(
  {
    id: "per-customer-api",
    rateLimit: {
      limit: 10,
      period: "1h",
      key: "event.data.customerId"
    }
  },
  { event: "api/request" },
  async ({ event, step }) => {
    // Customer A: 10 runs/hour
    // Customer B: 10 runs/hour (separate limit)
  }
);
```

### 6.3 Throttling (Buffered)

**Throttle Pattern:**

```typescript
inngest.createFunction(
  {
    id: "throttled-sync",
    throttle: {
      limit: 3,
      period: "1m"  // Max 3 executions per minute (buffered)
    }
  },
  { event: "sync/request" },
  async ({ event, step }) => {
    // Inngest queues events if limit exceeded
    // Executes at rate of 3 per minute
    // vs rate-limit which drops events
  }
);
```

**Throttling vs Rate Limiting:**

| Feature | Throttle | Rate Limit |
|---------|----------|-----------|
| Behavior | Buffer excess | Drop excess |
| Use Case | Pacing API calls | Protecting systems |
| Example | 3 API calls/min to external API | 100 signups/hour max |

---

## 7. FLOW CONTROL PATTERNS

### 7.1 Debounce

**Pattern: Wait for quiet period**

```typescript
inngest.createFunction(
  {
    id: "debounced-search-index",
    debounce: {
      period: "30s",  // Wait 30s of no events
      key: "event.data.documentId"
    }
  },
  { event: "document/updated" },
  async ({ event, step }) => {
    // If document updated 5 times in 10s, waits 30s
    // Then indexes with LAST event data
    // Prevents wasted work

    await step.run("index-document", async () => {
      await search.index(event.data.documentId);
    });
  }
);
```

**Use Cases:**
- Search indexing on document changes
- Cache invalidation after rapid updates
- Batch processing user actions
- Preventing cascading updates

### 7.2 Batching

**Collect Multiple Events:**

```typescript
inngest.createFunction(
  {
    id: "batch-email-notifications",
    batch: {
      maxSize: 100,      // Collect up to 100 events
      timeout: "5m"      // Or wait 5 minutes, whichever first
    }
  },
  { event: "notification/queued" },
  async ({ events, step }) => {
    // events is array of batched events
    console.log(`Processing ${events.length} notifications`);

    await step.run("send-batch", async () => {
      const emailBatch = events.map(e => ({
        to: e.data.email,
        subject: e.data.subject,
        body: e.data.body
      }));

      await email.sendBatch(emailBatch);
    });
  }
);
```

### 7.3 Fan-Out Pattern

**One Event → Multiple Functions:**

```typescript
// Trigger function sends event
inngest.createFunction(
  { id: "user-signup" },
  { event: "user/created" },
  async ({ event, step }) => {
    await step.sendEvent("fan-out-signup", [
      { name: "email/send-welcome", data: event.data },
      { name: "analytics/track-signup", data: event.data },
      { name: "crm/add-contact", data: event.data },
      { name: "slack/notify-team", data: event.data }
    ]);
  }
);

// Multiple independent functions listen
inngest.createFunction(
  { id: "send-welcome-email" },
  { event: "email/send-welcome" },
  async ({ event, step }) => {
    // Runs independently, can fail without affecting others
    await step.run("send", async () => {
      await email.send(welcomeTemplate(event.data));
    });
  }
);

inngest.createFunction(
  { id: "track-signup-analytics" },
  { event: "analytics/track-signup" },
  async ({ event, step }) => {
    // Also runs independently
    await step.run("track", async () => {
      await analytics.track("user.signup", event.data);
    });
  }
);
```

**Benefits:**
- Decoupling: Each function independent
- Parallelism: All functions run simultaneously
- Resilience: One failure doesn't stop others
- Scalability: Easy to add new handlers

---

## 8. MIDDLEWARE SYSTEM

### 8.1 Middleware Architecture

```
Inngest Client
      │
      ▼
┌──────────────────────────┐
│  Middleware Pipeline     │
│  ┌────────────────────┐  │
│  │ beforeFunctionRun  │  │
│  └─────────┬──────────┘  │
│            │             │
│  ┌─────────▼──────────┐  │
│  │ beforeStepRun      │  │
│  └─────────┬──────────┘  │
│            │             │
│  ┌─────────▼──────────┐  │
│  │ afterStepRun       │  │
│  └─────────┬──────────┘  │
│            │             │
│  ┌─────────▼──────────┐  │
│  │ afterFunctionRun   │  │
│  └─────────┬──────────┘  │
│            │             │
│  ┌─────────▼──────────┐  │
│  │ onFunctionFailure  │  │
│  └────────────────────┘  │
└──────────────────────────┘
      │
      ▼
 Function Handler
```

### 8.2 Middleware Examples

**Logging Middleware:**

```typescript
import { InngestMiddleware } from "inngest";

const loggingMiddleware = new InngestMiddleware({
  name: "logging",
  init: ({ client }) => ({
    onFunctionRun: ({ fn, input }) => {
      console.log(`[START] ${fn.id}`, { input });

      return {
        transformOutput: (result) => {
          console.log(`[END] ${fn.id}`, { result });
          return result;
        },
        onFunctionFailure: (error) => {
          console.error(`[FAILED] ${fn.id}`, { error });
        }
      };
    },
    beforeStepRun: ({ step }) => {
      console.log(`[STEP] ${step.id} starting`);
    },
    afterStepRun: ({ step, result }) => {
      console.log(`[STEP] ${step.id} completed`, result);
    }
  })
});

export const inngest = new Inngest({
  id: "my-app",
  middleware: [loggingMiddleware]
});
```

**Authentication Middleware:**

```typescript
const authMiddleware = new InngestMiddleware({
  name: "auth",
  init: ({ client }) => ({
    beforeFunctionRun: ({ fn, input }) => {
      // Validate JWT or API key
      const token = input.event.data?.token;

      if (!validateToken(token)) {
        throw new Error("Unauthorized");
      }

      return {
        transformInput: (input) => ({
          ...input,
          user: decodeToken(token)
        })
      };
    }
  })
});
```

**Tracing/OpenTelemetry Middleware:**

```typescript
import { context, trace } from "@opentelemetry/api";

const tracingMiddleware = new InngestMiddleware({
  name: "tracing",
  init: ({ client }) => ({
    onFunctionRun: ({ fn, input }) => {
      const tracer = trace.getTracer("inngest");
      const span = tracer.startSpan(`function.${fn.id}`);

      return {
        transformOutput: (result) => {
          span.end();
          return result;
        },
        onFunctionFailure: (error) => {
          span.recordException(error);
          span.end();
        }
      };
    }
  })
});
```

**Encryption Middleware:**

```typescript
const encryptionMiddleware = new InngestMiddleware({
  name: "encryption",
  init: ({ client }) => ({
    beforeSendEvent: ({ events }) => {
      return events.map(e => ({
        ...e,
        data: encrypt(e.data)  // End-to-end encryption
      }));
    },
    beforeFunctionRun: ({ input }) => {
      return {
        transformInput: (input) => ({
          ...input,
          event: {
            ...input.event,
            data: decrypt(input.event.data)
          }
        })
      };
    }
  })
});
```

---

## 9. OBSERVABILITY & MONITORING

### 9.1 Trace Levels

**Built-in Traces (Default):**
- Function execution timeline
- Step timing and retries
- Success/failure status
- Logs from function handler

**AI Traces:**
- LLM input/output
- Token usage
- Model inference metadata

**Extended Traces (OpenTelemetry):**
- HTTP requests to external APIs
- Database queries
- Third-party library calls
- Custom spans via OpenTelemetry API

### 9.2 Accessing Traces

**Via Dashboard:**

```
Inngest Cloud → Project → Function → Run Details
  ├── Timeline view (steps + timing)
  ├── Logs (all console output)
  ├── Payload (input event data)
  ├── Result (output/error)
  └── Trace (waterfall for all requests)
```

**Via API:**

```typescript
// Get run details
const run = await inngest.getRunDetails({
  runId: "abc123",
  functionId: "process-payment"
});

console.log(run);
// {
//   status: "completed",
//   output: {...},
//   steps: [
//     { id: "validate", duration: 234, status: "completed" },
//     { id: "update-db", duration: 456, status: "completed" }
//   ],
//   createdAt: "2026-03-01T10:00:00Z"
// }
```

### 9.3 Monitoring Best Practices

**1. Track Execution Metrics:**

```typescript
const metricsMiddleware = new InngestMiddleware({
  name: "metrics",
  init: ({ client }) => ({
    onFunctionRun: ({ fn, input }) => {
      const startTime = Date.now();

      return {
        transformOutput: (result) => {
          const duration = Date.now() - startTime;
          metrics.histogram("function.duration", duration, {
            function_id: fn.id,
            status: "success"
          });
          return result;
        },
        onFunctionFailure: (error) => {
          const duration = Date.now() - startTime;
          metrics.histogram("function.duration", duration, {
            function_id: fn.id,
            status: "failed"
          });
          metrics.counter("function.failure", 1, {
            function_id: fn.id,
            error_type: error.constructor.name
          });
        }
      };
    }
  })
});
```

**2. Alert on High Error Rates:**

```typescript
inngest.createFunction(
  { id: "monitor-function-health" },
  { event: "inngest/function.failed" },
  async ({ event, step }) => {
    await step.run("check-error-rate", async () => {
      const errorCount = await metrics.query({
        function_id: event.data.function.id,
        status: "failed",
        timeWindow: "1h"
      });

      if (errorCount > 10) {
        await slack.send({
          channel: "#alerts",
          text: `⚠️ High error rate on ${event.data.function.id}`
        });
      }
    });
  }
);
```

---

## 10. SDK DESIGN PATTERNS

### 10.1 Client Initialization

**Next.js Setup:**

```typescript
// lib/inngest.ts
import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "wellnexus-app",

  // Event schemas with Zod
  schemas: new EventSchemas().fromZod({
    "payment/charge.completed": {
      data: z.object({
        chargeId: z.string(),
        customerId: z.string(),
        amount: z.number()
      })
    }
  }),

  // Middleware stack
  middleware: [
    loggingMiddleware,
    authMiddleware,
    tracingMiddleware
  ],

  // Optional: custom base URL for self-hosting
  baseUrl: process.env.INNGEST_BASE_URL,

  // Optional: custom signing key
  signingKey: process.env.INNGEST_SIGNING_KEY
});
```

**Environment Variables:**

```bash
# .env.local
INNGEST_BASE_URL=https://api.inngest.com
INNGEST_EVENT_KEY=evt_prod_xxx
INNGEST_SIGNING_KEY=sk_prod_xxx
```

### 10.2 Type-Safe Function Definition

```typescript
// Define event schema
type PaymentChargedEvent = {
  name: "payment/charge.completed";
  data: {
    chargeId: string;
    customerId: string;
    amount: number;
  };
};

// Function is fully typed
export const processPayment = inngest.createFunction<PaymentChargedEvent>(
  { id: "process-payment" },
  { event: "payment/charge.completed" },
  async ({ event, step }) => {
    // event.data.chargeId ← string (autocomplete works)
    // event.data.customerId ← string
    // event.data.amount ← number

    // Type errors caught at compile time
    const bad = event.data.amount.toUpperCase(); // ❌ TS Error
  }
);
```

### 10.3 Exporting Functions for Inngest DevServer

**All functions must be exported:**

```typescript
// inngest/functions/index.ts
export { processPayment } from "./process-payment";
export { sendEmail } from "./send-email";
export { handleWebhook } from "./handle-webhook";
export { monitorHealth } from "./monitor-health";

// TypeScript/JavaScript
// export { functionName } from "./path";
```

**DevServer Discovery:**

```bash
inngest dev

# Output:
# ✓ Found 12 functions
# ✓ Connected to local inngest
# ✓ Listening on http://localhost:3000
```

---

## 11. PRACTICAL EXAMPLES FOR WELL PAYMENT SDK

### 11.1 Payment Processing Workflow

```typescript
// inngest/functions/process-stripe-charge.ts
import { inngest } from "../client";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { email } from "@/lib/email";

export const processStripeCharge = inngest.createFunction(
  {
    id: "stripe-process-charge",
    name: "Process Stripe Charge",
    concurrency: { limit: 5 },
    retries: 2
  },
  { event: "stripe/charge.succeeded" },
  async ({ event, step, runId }) => {
    console.log(`Processing charge: ${event.data.chargeId}`);

    // Step 1: Validate charge
    const charge = await step.run("validate-charge", async () => {
      const chargeData = await stripe.charges.retrieve(event.data.chargeId);

      if (chargeData.status !== "succeeded") {
        throw new NonRetriableError("Charge not succeeded");
      }

      return chargeData;
    });

    // Step 2: Update user account
    const updatedUser = await step.run("update-account", async () => {
      return await db.users.update({
        id: event.data.customerId,
        creditsAdded: charge.amount / 100,
        stripeChargeId: charge.id,
        lastChargeAt: new Date()
      });
    });

    // Step 3: Send receipt email
    await step.run("send-receipt", async () => {
      await email.send({
        to: updatedUser.email,
        template: "charge-receipt",
        data: {
          amount: charge.amount / 100,
          currency: charge.currency.toUpperCase(),
          chargeId: charge.id,
          date: new Date().toLocaleDateString()
        }
      });
    });

    // Step 4: Fan-out to other systems
    await step.sendEvent("trigger-downstream", [
      {
        name: "analytics/charge.processed",
        data: {
          userId: event.data.customerId,
          amount: charge.amount / 100
        }
      },
      {
        name: "crm/update-customer-ltv",
        data: {
          customerId: event.data.customerId,
          chargeAmount: charge.amount / 100
        }
      }
    ]);

    return {
      success: true,
      chargeId: charge.id,
      userId: updatedUser.id
    };
  }
);
```

### 11.2 Refund Workflow with Wait-For-Event

```typescript
export const initiateRefund = inngest.createFunction(
  {
    id: "initiate-refund",
    name: "Initiate and Track Refund"
  },
  { event: "payment/refund.requested" },
  async ({ event, step }) => {
    // Step 1: Create refund
    const refundRecord = await step.run("create-refund-record", async () => {
      return await db.refunds.create({
        chargeId: event.data.chargeId,
        userId: event.data.userId,
        amount: event.data.amount,
        status: "pending"
      });
    });

    // Step 2: Process with Stripe
    await step.run("process-stripe-refund", async () => {
      const refund = await stripe.refunds.create({
        charge: event.data.chargeId
      });

      await db.refunds.update(refundRecord.id, {
        stripeRefundId: refund.id
      });
    });

    // Step 3: Wait for Stripe webhook confirmation (max 5 days)
    const refundCompleted = await step.waitForEvent(
      "wait-refund-completed",
      {
        event: "stripe/refund.updated",
        timeout: "5d",
        match: 'event.data.refundId === async.event.data.stripeRefundId'
      }
    );

    if (!refundCompleted) {
      // Refund timed out, escalate to support
      await step.sendEvent("escalate-refund", {
        name: "support/refund.timeout",
        data: { refundId: refundRecord.id }
      });
      return { status: "timeout" };
    }

    // Step 4: Confirm refund
    await step.run("confirm-refund", async () => {
      await db.refunds.update(refundRecord.id, {
        status: "completed",
        completedAt: new Date()
      });
    });

    return { status: "completed", refund: refundCompleted.data };
  }
);
```

### 11.3 Subscription Renewal with Debounce

```typescript
export const renewSubscription = inngest.createFunction(
  {
    id: "renew-subscription",
    name: "Auto-Renew Subscription",
    debounce: {
      period: "1h",
      key: "event.data.subscriptionId"
    }
  },
  { event: "subscription/renewal.scheduled" },
  async ({ event, step }) => {
    // Even if multiple renewal events trigger,
    // only processes LAST event after 1 hour of silence

    const subscription = await step.run(
      "fetch-subscription",
      async () => {
        return await db.subscriptions.findById(
          event.data.subscriptionId
        );
      }
    );

    const charge = await step.run("charge-user", async () => {
      return await stripe.charges.create({
        amount: subscription.price * 100,
        currency: "usd",
        customer: subscription.stripeCustomerId
      });
    });

    await step.run("update-subscription", async () => {
      await db.subscriptions.update(subscription.id, {
        renewalDate: addMonths(new Date(), 1),
        lastChargeId: charge.id
      });
    });

    return { renewed: true };
  }
);
```

---

## 12. KEY ARCHITECTURAL PATTERNS

### 12.1 Event-Driven Architecture

**Pattern:** Everything starts with events

```
External Event Source
  (Webhook, API, Schedule)
         ↓
    Inngest Event
         ↓
  Pattern Matching
         ↓
  Function Trigger
         ↓
  Step Execution
         ↓
  State Persistence
```

### 12.2 Durable Execution

**Pattern:** Survive any failure

- Each step is atomic
- Completed steps cached
- Failed step stops, resume from last success
- Retries are automatic
- No polling required

### 12.3 Decoupling via Events

**Pattern:** Separate concerns via events

```
Charge Processor          Notification Service
    (Payment)                   (Email)
         ↓                          ↑
    Process Payment        Listen for charge.completed
         │                          │
         └──→ emit charge.completed──┘

Similar for:
- Analytics
- CRM
- Webhooks
- Accounting
```

### 12.4 Fan-Out Pattern

**Pattern:** One event triggers many functions

```
User Signup
    ↓
  ├→ send-welcome-email
  ├→ track-analytics
  ├→ add-to-mailing-list
  ├→ create-crm-contact
  └→ notify-sales-team
```

All run independently, in parallel.

---

## 13. COMPARISON WITH ALTERNATIVES

| Feature | Inngest | BullMQ | Temporal | AWS SQS |
|---------|---------|--------|----------|---------|
| Infrastructure | Zero (hosted) | Self-hosted | Self-hosted | AWS-managed |
| Step Functions | ✅ Native | ❌ Manual | ✅ Native | ❌ No |
| Event-Driven | ✅ Yes | ❌ No | ⚠️ Limited | ✅ Yes |
| Type Safety | ✅ Full TS | ⚠️ Partial | ⚠️ Partial | ❌ No |
| Observability | ✅ Excellent | ⚠️ Manual | ✅ Good | ⚠️ CloudWatch |
| Retry Strategy | ✅ Automatic | ✅ Automatic | ✅ Automatic | ✅ DLQ-based |
| Durable Sleep | ✅ step.sleep | ❌ Polling | ✅ Durable | ❌ No |
| Learning Curve | ⭐ Easy | ⭐⭐ Medium | ⭐⭐⭐ Hard | ⭐⭐ Medium |

---

## 14. IMPLEMENTATION CONSIDERATIONS

### 14.1 For Well Payment SDK

**Recommended Patterns:**

1. **Event-Driven Payment Flow**
   - All payment state changes via events
   - Separate functions for charge, refund, webhook handling
   - Built-in observability for compliance

2. **Durable Failure Recovery**
   - Automatic retry with backoff
   - NonRetriableError for invalid data
   - Failure callbacks for alerts

3. **Type Safety**
   - Zod schemas for payment events
   - Full TypeScript compile-time validation
   - Self-documenting event contracts

4. **Zero Infrastructure**
   - Deploy to Next.js Edge Functions
   - No queue management
   - Inngest handles orchestration

### 14.2 Integration Points

- **Stripe Webhooks** → inngest.send()
- **Payment Form** → inngest.send() on success
- **Email Notifications** → step.sendEvent()
- **Analytics** → Fan-out events
- **Webhooks to Customers** → step.sendEvent()

---

## UNRESOLVED QUESTIONS

1. **Self-Hosting:** How to deploy Inngest Go server on-premise for air-gapped environments?
2. **Cost Scaling:** Pricing model for high-volume payment processing (millions of events/month)?
3. **Data Residency:** Which cloud regions supported? EU/APAC availability?
4. **Compliance:** SOC 2? PCI DSS certification for payment workloads?
5. **Performance Limits:** Max throughput per account? Request rate limiting details?

---

## SOURCES

- [Inngest Documentation](https://www.inngest.com/docs)
- [Create Function - Inngest Documentation](https://www.inngest.com/docs/reference/functions/create)
- [Inngest Steps Guide](https://www.inngest.com/docs/learn/inngest-steps)
- [Middleware - Inngest Documentation](https://www.inngest.com/docs/features/middleware)
- [Flow Control - Inngest Documentation](https://www.inngest.com/docs/guides/flow-control)
- [Errors & Retries - Inngest Documentation](https://www.inngest.com/docs/guides/error-handling)
- [GitHub: inngest/inngest](https://github.com/inngest/inngest)
- [GitHub: inngest/inngest-js](https://github.com/inngest/inngest-js)
- [Inngest TypeScript SDK v3.0 - Inngest Blog](https://www.inngest.com/blog/releasing-ts-sdk-3)
- [Concurrency Management - Inngest Documentation](https://www.inngest.com/docs/guides/concurrency)
- [Rate Limiting - Inngest Documentation](https://www.inngest.com/docs/guides/rate-limiting)
- [Fan-out Pattern - Inngest Documentation](https://www.inngest.com/docs/guides/fan-out-jobs)
- [Extended Observability - Inngest Blog](https://www.inngest.com/blog/enhanced-observability-traces-and-metrics)
