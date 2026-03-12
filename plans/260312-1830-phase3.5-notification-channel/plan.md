# Phase 3.5: Tier-based Notification Channel Service

**Plan ID:** 260312-1830-phase3.5-notification-channel
**Priority:** High
**Status:** ✅ Completed
**Created:** 2026-03-12
**Completed:** 2026-03-12

---

## Context

Part of ROIaaS Phase 3 - Webhook Integration. This phase creates a unified notification channel service that routes notifications through appropriate channels based on user's license tier.

---

## Overview

Build a tier-based notification delivery system that:
- Supports multiple notification channels (email, webhook, SMS, custom_endpoint)
- Routes notifications based on license tier
- Tracks delivery status with retry logic
- Integrates with user preferences

---

## Requirements

### Functional
1. Support 4 notification channels: email, webhook, sms, custom_endpoint
2. Tier-based channel availability:
   - Free/Basic: email only
   - Premium: email + webhook
   - Enterprise: email + webhook + sms
   - Master: all channels + priority routing
3. Store delivery logs to `notification_logs` table
4. Implement retry logic (3 retries, exponential backoff)
5. Respect user "quiet hours" user preferences

### Non-Functional
- Type-safe implementation (TypeScript strict mode)
- File size < 200 lines per module
- Comprehensive error handling
- No console.log in production code

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  NotificationChannelService                             │
├─────────────────────────────────────────────────────────┤
│  - getAvailableChannels(tier)                           │
│  - sendNotification(channel, payload)                   │
│  - sendTierBasedNotification(userId, event)             │
│  - logNotification(log)                                 │
│  - retryWithBackoff(fn, maxRetries)                     │
└─────────────────────────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
  ┌──────────┐   ┌──────────────┐   ┌──────────┐
  │  Email   │   │   Webhook    │   │   SMS    │
  │ Channel  │   │    Channel   │   │ Channel  │
  └──────────┘   └──────────────┘   └──────────┘
                          │
                          ▼
                ┌─────────────────┐
                │ notification_logs│
                │    (Supabase)   │
                └─────────────────┘
```

---

## File Ownership

**This phase owns:**
- `src/services/notification-channel-service.ts` (CREATE)
- `src/services/notification-channel-types.ts` (CREATE)
- `src/services/__tests__/notification-channel-service.test.ts` (CREATE)

**Dependencies (read-only):**
- `src/types/raas-license.ts` (LicenseTier, TIER_CONFIGS)
- `src/lib/supabase.ts`
- `src/services/email-service.ts`

---

## Implementation Steps

### Step 1: Create Type Definitions
**File:** `src/services/notification-channel-types.ts`

Define:
- `NotificationChannel` type (email, webhook, sms, custom_endpoint)
- `LicenseTier` mapping to available channels
- `NotificationPayload` interface
- `NotificationLog` interface
- `NotificationPreferences` interface
- `SendNotificationResult` interface

### Step 2: Create Main Service
**File:** `src/services/notification-channel-service.ts`

Implement:
- `NotificationChannelService` class
- `getAvailableChannels(tier): NotificationChannel[]`
- `sendNotification(channel, payload): Promise<void>`
- `sendTierBasedNotification(userId, event): Promise<void>`
- `logNotification(log): Promise<void>`
- `retryWithBackoff(fn, maxRetries, delayMs): Promise<T>`
- `getUserPreferences(userId): Promise<NotificationPreferences>`

### Step 3: Create Database Migration
**File:** `supabase/migrations/260312_notification_logs.sql`

Create `notification_logs` table with:
- id, user_id, org_id, channel, event_type
- payload, status, error_message, retry_count
- created_at, delivered_at, metadata

### Step 4: Write Unit Tests
**File:** `src/services/__tests__/notification-channel-service.test.ts`

Test:
- Tier-based channel availability
- Notification delivery (mocked)
- Retry logic with exponential backoff
- Error handling
- Database logging

---

## Todo List

- [x] Create notification-channel-types.ts
- [x] Create notification-channel-service.ts
- [x] Create database migration
- [x] Write unit tests
- [x] Run tests and fix failures
- [x] Type check pass

---

## Success Criteria

1. Service exports `NotificationChannelService` class
2. All methods implemented and type-safe
3. Tier-based routing works correctly
4. Retry logic with exponential backoff (3 retries)
5. Notification logs stored to database
6. Unit tests pass (80%+ coverage)
7. TypeScript compilation passes (0 errors)

---

## Dependencies

**Blocked by:**
- Phase 3.2: webhook-event-processor.ts (for WebhookEvent type)
- Phase 3.3: Polar webhook route (for event types)

**Blocks:**
- Phase 3.6: Notification preferences UI
- Phase 4.1: Alert rules engine

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| SMS provider integration | Medium | Use placeholder, implement later |
| Webhook security | High | Implement signature verification |
| Rate limiting | Medium | Add rate limiter integration |

---

## Security Considerations

1. Webhook endpoints must verify signatures
2. User preferences must be validated (RLS policies)
3. API keys for SMS/webhook stored server-side only
4. No PII in notification logs

---

## Next Steps

After completion:
1. Update docs/system-architecture.md
2. Add to docs/code-standards.md
3. Create Phase 3.6 for notification preferences UI
