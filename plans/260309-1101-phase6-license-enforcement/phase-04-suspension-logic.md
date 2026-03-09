---
phase: 6.4
title: "Suspension Logic & 403 Responses"
description: "Implement 403 denial logic for invalid/expired licenses with proper error responses and bypass options"
status: pending
priority: P1
effort: 2h
---

# Phase 6.4: Suspension Logic & 403 Responses

## Context Links

- Parent Plan: [./plan.md](./plan.md)
- Previous: [./phase-03-stripe-billing-sync.md](./phase-03-stripe-billing-sync.md)
- Next: [./phase-05-analytics-events.md](./phase-05-analytics-events.md)
- Existing: `src/lib/raas-gate-quota.ts` - Response helpers

## Overview

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 - Core enforcement |
| **Effort** | 2 hours |
| **Status** | ⏳ Pending |

## Key Insights

- Multiple suspension reasons: invalid license, expired subscription, dunning
- Need consistent 403 response format
- Admin bypass required for support scenarios
- Audit log for all suspension events

## Requirements

### Functional

1. Return 403 with structured error body
2. Include suspension reason in response
3. Include recovery instructions (upgrade URL)
4. Admin API keys bypass suspension
5. Log all suspension events

### Non-Functional

- Consistent error schema across all endpoints
- Include retry-after header when applicable
- Support i18n for error messages

## Error Response Schema

```typescript
interface SuspensionErrorResponse {
  error: 'license_invalid' | 'license_expired' | 'subscription_canceled' | 'subscription_expired' | 'subscription_past_due' | 'dunning_active'
  message: string
  details: {
    licenseStatus?: string
    subscriptionStatus?: string
    daysPastDue?: number
    amountOwed?: number
    suspendedAt: string
    suspensionReason: string
  }
  recovery: {
    upgrade_url: string
    payment_url?: string
    contact_support?: string
  }
  retry_after?: number // Seconds until suspension lifts (if temporary)
}
```

## Implementation Steps

### Step 1: Create Suspension Types

**Files to Create:**
- `src/types/suspension.ts` - Suspension types

```typescript
export type SuspensionReason =
  | 'license_invalid'
  | 'license_expired'
  | 'license_revoked'
  | 'subscription_canceled'
  | 'subscription_expired'
  | 'subscription_past_due'
  | 'dunning_active'

export interface SuspensionDetails {
  licenseStatus?: string
  subscriptionStatus?: string
  daysPastDue?: number
  amountOwed?: number
  dunningStage?: string
  suspendedAt: string
  suspensionReason: SuspensionReason
  orgId?: string
  userId?: string
}

export interface SuspensionRecovery {
  upgrade_url: string
  payment_url?: string
  contact_support?: string
  retry_after?: number // Seconds
}

export interface SuspensionErrorResponse {
  error: SuspensionReason
  message: string
  details: SuspensionDetails
  recovery: SuspensionRecovery
  i18n?: {
    vi?: string
    en?: string
  }
}
```

### Step 2: Create Suspension Response Builder

**Files to Create:**
- `src/services/suspension-response.ts` - Response builder

```typescript
import type {
  SuspensionErrorResponse,
  SuspensionReason,
  SuspensionDetails,
} from '@/types/suspension'

const SUSPENSION_MESSAGES: Record<SuspensionReason, { vi: string; en: string }> = {
  license_invalid: {
    vi: 'Giấy phép không hợp lệ',
    en: 'Invalid license',
  },
  license_expired: {
    vi: 'Giấy phép đã hết hạn',
    en: 'License expired',
  },
  license_revoked: {
    vi: 'Giấy phép đã bị thu hồi',
    en: 'License revoked',
  },
  subscription_canceled: {
    vi: 'Gói đăng ký đã bị hủy',
    en: 'Subscription canceled',
  },
  subscription_expired: {
    vi: 'Gói đăng ký đã hết hạn',
    en: 'Subscription expired',
  },
  subscription_past_due: {
    vi: 'Thanh toán quá hạn',
    en: 'Payment past due',
  },
  dunning_active: {
    vi: 'Đang trong quá trình nhắc nợ',
    en: 'Dunning process active',
  },
}

export function createSuspensionResponse(
  reason: SuspensionReason,
  details: Omit<SuspensionDetails, 'suspendedAt' | 'suspensionReason'>,
  locale: 'vi' | 'en' = 'en'
): SuspensionErrorResponse {
  const now = new Date().toISOString()

  // Determine retry_after
  let retryAfter: number | undefined
  if (reason === 'subscription_past_due' && !details.dunningStage) {
    retryAfter = 48 * 60 * 60 // 48 hours grace
  }

  // Determine recovery URLs
  const recovery: SuspensionRecovery = {
    upgrade_url: '/dashboard/subscription',
    contact_support: 'support@wellnexus.vn',
  }

  if (reason === 'dunning_active' || reason === 'subscription_past_due') {
    recovery.payment_url = '/dashboard/billing/payment-update'
  }

  return {
    error: reason,
    message: SUSPENSION_MESSAGES[reason][locale],
    details: {
      ...details,
      suspendedAt: now,
      suspensionReason: reason,
    },
    recovery,
    retry_after: retryAfter,
    i18n: {
      vi: SUSPENSION_MESSAGES[reason].vi,
      en: SUSPENSION_MESSAGES[reason].en,
    },
  }
}

export function createSuspensionHttpResponse(
  response: SuspensionErrorResponse,
  extraHeaders?: Record<string, string>
): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Suspension-Reason': response.error,
    'X-Suspended-At': response.details.suspendedAt,
    ...extraHeaders,
  }

  if (response.retry_after) {
    headers['Retry-After'] = String(response.retry_after)
  }

  return new Response(JSON.stringify(response), {
    status: 403,
    headers,
  })
}
```

### Step 3: Create Admin Bypass

**Files to Create:**
- `src/lib/admin-bypass.ts` - Admin bypass logic

```typescript
import { supabase } from '@/lib/supabase'

const ADMIN_API_KEYS = new Set([
  process.env.VITE_ADMIN_API_KEY,
  process.env.VITE_SUPPORT_API_KEY,
].filter(Boolean))

export async function isAdminApiKey(apiKey: string): Promise<boolean> {
  // Check static admin keys
  if (ADMIN_API_KEYS.has(apiKey)) {
    return true
  }

  // Check database for admin users
  if (apiKey.startsWith('mk_')) {
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('api_key', apiKey)
      .single()

    return data?.role === 'admin' || data?.role === 'support'
  }

  return false
}

export async function checkAdminBypass(request: Request): Promise<boolean> {
  const apiKey = request.headers.get('X-API-Key')
  if (!apiKey) return false

  // Check for admin bypass header
  const bypassHeader = request.headers.get('X-Admin-Bypass')
  if (bypassHeader === 'true' && await isAdminApiKey(apiKey)) {
    console.warn('[AdminBypass] Admin bypass used', {
      apiKey: apiKey.substring(0, 8) + '...',
      path: new URL(request.url).pathname,
    })
    return true
  }

  return false
}
```

### Step 4: Create Suspension Audit Log

**Files to Create:**
- `src/services/suspension-audit.ts` - Audit logging

```typescript
import { supabase } from '@/lib/supabase'
import type { SuspensionReason } from '@/types/suspension'

export interface SuspensionAuditEntry {
  orgId: string
  userId?: string
  reason: SuspensionReason
  licenseKey?: string
  subscriptionId?: string
  requestId: string
  requestPath: string
  ipAddress?: string
  userAgent?: string
}

export async function logSuspension(entry: SuspensionAuditEntry): Promise<void> {
  try {
    await supabase
      .from('suspension_audit_log')
      .insert({
        org_id: entry.orgId,
        user_id: entry.userId,
        suspension_reason: entry.reason,
        license_key: entry.licenseKey,
        subscription_id: entry.subscriptionId,
        request_id: entry.requestId,
        request_path: entry.requestPath,
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
        suspended_at: new Date().toISOString(),
      })
  } catch (error) {
    console.error('[SuspensionAudit] Failed to log suspension:', error)
  }
}

// Generate unique request ID
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}
```

### Step 5: Update Middleware Integration

**Files to Modify:**
- `src/lib/raas-gate-quota.ts` - Integrate suspension logic

```typescript
import { createSuspensionResponse, createSuspensionHttpResponse } from '@/services/suspension-response'
import { checkAdminBypass } from '@/lib/admin-bypass'
import { logSuspension, generateRequestId } from '@/services/suspension-audit'

export async function licenseValidationMiddleware(
  request: Request
): Promise<Response | null> {
  const requestId = generateRequestId()
  const apiKey = request.headers.get('X-API-Key')

  // Check admin bypass
  if (await checkAdminBypass(request)) {
    return null // Continue request
  }

  // ... existing validation logic ...

  // When suspension detected
  if (shouldSuspend) {
    const response = createSuspensionResponse(reason, details)

    // Log audit
    await logSuspension({
      orgId: license.orgId,
      userId: license.userId,
      reason,
      licenseKey: apiKey || undefined,
      requestId,
      requestPath: new URL(request.url).pathname,
      ipAddress: request.headers.get('X-Forwarded-For')?.split(',')[0],
      userAgent: request.headers.get('User-Agent') || undefined,
    })

    return createSuspensionHttpResponse(response)
  }

  return null // Continue request
}
```

## Todo List

- [ ] Create suspension types
- [ ] Create suspension response builder
- [ ] Create HTTP response helper
- [ ] Implement i18n messages
- [ ] Create admin bypass logic
- [ ] Create suspension audit logging
- [ ] Create database migration for audit_log table
- [ ] Update middleware to use suspension logic
- [ ] Add unit tests for response builder
- [ ] Test admin bypass with support API key

## Success Criteria

- [ ] 403 responses have consistent schema
- [ ] All suspension reasons covered
- [ ] i18n messages in VI + EN
- [ ] Admin bypass works for support team
- [ ] All suspensions logged to audit table
- [ ] Retry-After header present when applicable

## Database Migration

```sql
-- Create suspension audit log table
CREATE TABLE IF NOT EXISTS suspension_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id),
  user_id UUID REFERENCES users(id),
  suspension_reason TEXT NOT NULL,
  license_key TEXT,
  subscription_id UUID REFERENCES user_subscriptions(id),
  request_id TEXT NOT NULL,
  request_path TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  suspended_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suspension_audit_org ON suspension_audit_log(org_id, suspended_at);
CREATE INDEX idx_suspension_audit_reason ON suspension_audit_log(suspension_reason);
CREATE INDEX idx_suspension_audit_request ON suspension_audit_log(request_id);
```

## Next Steps

After suspension logic is implemented, proceed to [Phase 6.5](./phase-05-analytics-events.md) for analytics integration.

---

_Created: 2026-03-09_
