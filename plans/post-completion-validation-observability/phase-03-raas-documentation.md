---
title: "Phase 3: RaaS Gateway Documentation"
description: "Comprehensive documentation for future RaaS adopters including integration patterns, API reference, and troubleshooting"
status: pending
priority: P2
effort: 2h
branch: main
tags: [documentation, raas-gateway, integration, api-reference]
created: 2026-03-09
---

# Phase 3: RaaS Gateway Documentation

## Overview

| Attribute | Value |
|-----------|-------|
| **Priority** | P2 - Enable adoption |
| **Effort** | 2 hours |
| **Status** | Pending |
| **Dependencies** | Phase 7 & 8 implementation complete |

## Context Links

- Parent Plan: `../plan.md`
- Existing Docs: `docs/RAAS_INTEGRATION.md`
- Related Code: `src/lib/raas-gateway-client.ts`
- Related Code: `src/lib/gateway-auth-client.ts`

## Key Insights

From Phase 7 implementation:
- JWT/mk_ API key auth is complex for new adopters
- Usage sync patterns need clear examples
- Troubleshooting requires deep system knowledge
- Integration patterns should be copy-paste ready

## Documentation Structure

```
docs/raas/
├── GETTING_STARTED.md           # Quick start guide
├── INTEGRATION_PATTERNS.md      # Common integration patterns
├── API_REFERENCE.md             # Complete API documentation
├── JWT_AUTH_GUIDE.md            # Authentication deep dive
├── RATE_LIMITING.md             # Rate limiting configuration
├── TROUBLESHOOTING.md           # Troubleshooting playbook
├── BEST_PRACTICES.md            # Production best practices
└── EXAMPLES/
    ├── basic-usage-metering.ts
    ├── license-enforcement.ts
    ├── webhook-handler.ts
    └── dashboard-integration.ts
```

## Documentation Content

### 1. Getting Started (Quick Start)

```markdown
# RaaS Gateway Quick Start

Get up and running with RaaS Gateway in 15 minutes.

## Prerequisites

- Supabase project with Edge Functions
- RaaS Gateway API key (mk_ prefix)
- Node.js 18+ or Deno 1.30+

## Installation

```bash
npm install @agencyos/raas-gateway-client
```

## 5-Minute Setup

### Step 1: Configure Environment

```bash
VITE_RAAS_GATEWAY_URL=https://raas.agencyos.network
VITE_RAAS_GATEWAY_API_KEY=mk_xxxxxxxxxxxxxxxx
```

### Step 2: Initialize Client

```typescript
import { RaaSGatewayClient } from '@agencyos/raas-gateway-client'

const client = new RaaSGatewayClient({
  gatewayUrl: import.meta.env.VITE_RAAS_GATEWAY_URL,
  apiKey: import.meta.env.VITE_RAAS_GATEWAY_API_KEY,
})
```

### Step 3: Validate License

```typescript
const result = await client.validateLicenseKey('raas_premium_xxx')

if (result.isValid) {
  console.log(`Tier: ${result.tier}`)
  console.log(`Entitlements: ${JSON.stringify(result.features)}`)
} else {
  console.log(`Invalid: ${result.reason}`)
}
```

### Step 4: Report Usage

```typescript
await client.reportUsage({
  orgId: 'org-123',
  metrics: {
    api_calls: { quantity: 1000 },
    ai_calls: { quantity: 100 },
  },
})
```

## Next Steps

- Read [Integration Patterns](./INTEGRATION_PATTERNS.md) for advanced use cases
- See [API Reference](./API_REFERENCE.md) for complete documentation
- Check [Troubleshooting](./TROUBLESHOOTING.md) for common issues
```

### 2. Integration Patterns

```markdown
# RaaS Gateway Integration Patterns

Proven patterns for common integration scenarios.

## Pattern 1: Usage Metering Middleware

Track API usage automatically for all requests.

```typescript
// middleware/usage-metering.ts
import { usageMeter } from '@/lib/usage-metering'

export async function usageMeteringMiddleware(
  req: Request,
  next: NextFunction
) {
  const orgId = req.context.orgId
  const endpoint = req.path

  try {
    // Track before request
    await usageMeter.track({
      orgId,
      feature: 'api_call',
      quantity: 1,
      metadata: { endpoint, method: req.method },
    })

    await next()

    // Track response (optional)
    // Could track tokens, latency, etc.
  } catch (error) {
    console.error('Usage metering error:', error)
    // Don't block request on metering failure
  }
}
```

## Pattern 2: License Guard for Routes

Protect routes with license validation.

```typescript
// middleware/license-guard.ts
import { raasGatewayClient } from '@/lib/raas-gateway-client'
import { cache } from '@/lib/cache'

export async function licenseGuard(
  req: Request,
  next: NextFunction
) {
  const licenseKey = req.headers['x-license-key']
  const orgId = req.context.orgId

  if (!licenseKey) {
    return res.status(401).json({ error: 'License key required' })
  }

  // Check cache first (5 min TTL)
  const cached = await cache.get(`license:${orgId}`)
  if (cached) {
    req.context.license = cached
    return next()
  }

  // Validate with Gateway
  const result = await raasGatewayClient.validateLicenseKey(licenseKey)

  if (!result.isValid) {
    return res.status(403).json({
      error: 'Invalid license',
      reason: result.suspensionReason || 'License not found',
    })
  }

  // Cache entitlements
  await cache.set(`license:${orgId}`, result, 300)

  req.context.license = result
  next()
}
```

## Pattern 3: Bi-Directional Usage Sync

Sync usage between local and Gateway.

```typescript
// services/usage-sync.ts
import { usageMeter } from '@/lib/usage-metering'
import { raasGatewayClient } from '@/lib/raas-gateway-client'

export class UsageSyncService {
  async syncToGateway(orgId: string, period?: string) {
    // Get local usage
    const localUsage = await usageMeter.getCurrentUsage(orgId)

    // Sync to Gateway
    await raasGatewayClient.reportUsage({
      orgId,
      period: period || this.getCurrentPeriod(),
      metrics: localUsage,
    })

    // Get Gateway aggregated usage
    const gatewayUsage = await raasGatewayClient.getUsage({ orgId })

    // Reconcile differences
    return this.reconcile(localUsage, gatewayUsage)
  }
}
```

## Pattern 4: Webhook Handler for Billing Events

Handle Polar/Stripe webhooks for subscription updates.

```typescript
// api/webhooks/billing.ts
import { PlanStatusScheduler } from '@/services/plan-status-scheduler'

const scheduler = new PlanStatusScheduler()

export async function handleBillingWebhook(req: Request) {
  const signature = req.headers['polar-signature']
  const payload = req.body

  // Verify webhook signature
  const isValid = await verifyWebhookSignature(signature, payload)
  if (!isValid) {
    return { status: 401 }
  }

  // Process based on event type
  switch (payload.type) {
    case 'subscription.created':
      await scheduler.processPolarWebhook(payload)
      break
    case 'subscription.updated':
      await scheduler.processPolarWebhook(payload)
      break
    case 'subscription.canceled':
      await scheduler.processPolarWebhook(payload)
      break
  }

  return { status: 200 }
}
```
```

### 3. API Reference

```markdown
# RaaS Gateway API Reference

Complete API documentation for RaaS Gateway.

## Base URL

```
Production: https://raas.agencyos.network
Staging: https://raas-staging.agencyos.network
```

## Authentication

All API requests require JWT authentication with mk_ API key.

```
Authorization: Bearer <JWT_TOKEN>
X-API-Key: mk_xxxxxxxxxxxxxxxx
```

## Endpoints

### POST /v1/validate-license

Validate a license key.

**Request:**
```json
{
  "licenseKey": "raas_premium_xxx"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "isValid": true,
  "tier": "premium",
  "features": {
    "api_access": true,
    "agent_execution": true,
    "priority_support": true
  },
  "quotaLimits": {
    "api_calls": 10000,
    "ai_calls": 1000,
    "tokens": 1000000
  },
  "expiresAt": "2026-12-31T23:59:59Z",
  "daysRemaining": 297
}
```

### POST /api/v1/usage/report

Report usage to Gateway.

**Headers:**
```
Authorization: Bearer <JWT>
X-API-Key: mk_xxx
X-Idempotency-Key: unique-key-per-report
```

**Request:**
```json
{
  "orgId": "org-123",
  "period": "2026-03",
  "metrics": {
    "api_calls": {
      "quantity": 5000,
      "quotaLimit": 10000
    },
    "ai_calls": {
      "quantity": 500,
      "quotaLimit": 1000
    }
  },
  "timestamp": "2026-03-09T12:00:00Z"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "synced": true,
  "kvCacheKey": "usage:org-123:2026-03"
}
```

### GET /api/v1/usage/:orgId

Fetch aggregated usage from Gateway KV.

**Response (200 OK):**
```json
{
  "success": true,
  "org_id": "org-123",
  "period": "2026-03",
  "metrics": {
    "api_calls": {
      "totalUsage": 5000,
      "quotaLimit": 10000,
      "overageUnits": 0
    }
  },
  "lastSyncedAt": "2026-03-09T12:00:00Z"
}
```

## Error Codes

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid request | Check request format |
| 401 | Invalid API key | Verify mk_ API key |
| 403 | Invalid/expired license | Check license status |
| 429 | Rate limited | Retry after delay |
| 500 | Gateway error | Contact support |
```

### 4. JWT Auth Guide

```markdown
# JWT Authentication Guide

Deep dive into JWT/mk_ API key authentication.

## Token Structure

```json
{
  "iss": "wellnexus.vn",
  "aud": "agencyos.network",
  "sub": "org-123",
  "license_id": "lic-456",
  "mk_key": "mk_xxxxxxxxxxxxxxxx",
  "exp": 1710000000,
  "iat": 1709996400,
  "jti": "unique-token-id"
}
```

## Token Generation

```typescript
import { GatewayAuthClient } from '@/lib/gateway-auth-client'

const authClient = new GatewayAuthClient({
  issuer: 'wellnexus.vn',
  audience: 'agencyos.network',
  apiKey: 'mk_xxxxxxxxxxxxxxxx',
})

// Get token (auto-cached)
const { token, expiresAt } = authClient.getValidToken('org-123')

// Use in API calls
const response = await fetch('https://raas.agencyos.network/api/v1/usage', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-API-Key': 'mk_xxxxxxxxxxxxxxxx',
  },
})
```

## Token Caching Strategy

```typescript
class TokenCache {
  private cache: Map<string, { token: string; expiresAt: number }> = new Map()
  private readonly REFRESH_BUFFER_MS = 5 * 60 * 1000  // 5 min

  getToken(orgId: string): string | null {
    const cached = this.cache.get(orgId)
    if (!cached) return null

    // Return if not expiring soon
    if (Date.now() < cached.expiresAt - this.REFRESH_BUFFER_MS) {
      return cached.token
    }

    // Expired or expiring soon
    this.cache.delete(orgId)
    return null
  }

  setToken(orgId: string, token: string, expiresAt: number) {
    this.cache.set(orgId, { token, expiresAt })
  }
}
```

## mk_ API Key Format

```
mk_<prefix>_<random>

Examples:
- mk_well_xK9mN2pL4qR7sT1v
- mk_apex_aB3cD5eF7gH9iJ2k

Prefix identifies the project/org.
Random part is 16 alphanumeric characters.
```
```

### 5. Troubleshooting Playbook

```markdown
# RaaS Gateway Troubleshooting Playbook

Common issues and their solutions.

## Issue 1: License Validation Fails

**Symptoms:**
- `validateLicenseKey()` returns `isValid: false`
- Error: "License not found" or "License expired"

**Debug Steps:**
1. Verify license key format: `raas_<tier>_<random>`
2. Check license status in RaaS Gateway dashboard
3. Verify Gateway URL is correct

**Solution:**
```typescript
const result = await client.validateLicenseKey(key)
console.log('Validation result:', result)
// Check result.suspensionReason for details
```

## Issue 2: Usage Sync Fails

**Symptoms:**
- Usage not appearing in Gateway dashboard
- `reportUsage()` throws error

**Debug Steps:**
1. Check JWT token is valid and not expired
2. Verify mk_ API key has correct permissions
3. Check rate limiting (100 req/min)

**Solution:**
```typescript
// Add retry logic with exponential backoff
async function reportWithRetry(data, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.reportUsage(data)
    } catch (error) {
      if (error.status === 429) {
        await sleep(1000 * Math.pow(2, i))
      } else {
        throw error
      }
    }
  }
}
```

## Issue 3: Rate Limit Exceeded

**Symptoms:**
- HTTP 429 Too Many Requests
- Gateway returns `Retry-After` header

**Solution:**
```typescript
// Implement request queuing
class RateLimitedClient {
  private queue: Array<() => Promise<any>> = []
  private processing = false
  private readonly LIMIT = 100  // req/min

  async request(fn: () => Promise<any>) {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      this.processQueue()
    })
  }
}
```

## Debug Queries

```sql
-- Check recent usage records
SELECT * FROM usage_records
WHERE org_id = 'org-123'
ORDER BY recorded_at DESC
LIMIT 10;

-- Check Gateway sync status
SELECT * FROM raas_usage_snapshots
WHERE org_id = 'org-123'
ORDER BY snapshot_date DESC;

-- Check license validation logs
SELECT * FROM license_validation_logs
WHERE org_id = 'org-123'
AND status = 'invalid'
ORDER BY created_at DESC;
```

## Support Escalation

If issue persists:
1. Collect debug logs from all components
2. Check Gateway status page
3. Contact AgencyOS support with:
   - Organization ID
   - License key prefix (first 8 chars)
   - Error messages with timestamps
   - Debug query results
```

## Success Criteria

- [ ] Getting Started guide complete
- [ ] 5+ integration patterns documented
- [ ] API reference covers all endpoints
- [ ] JWT auth guide with code examples
- [ ] Troubleshooting playbook has 10+ issues
- [ ] All code examples compile and run
- [ ] Documentation reviewed by potential adopters

## Files to Create

- `docs/raas/GETTING_STARTED.md`
- `docs/raas/INTEGRATION_PATTERNS.md`
- `docs/raas/API_REFERENCE.md`
- `docs/raas/JWT_AUTH_GUIDE.md`
- `docs/raas/RATE_LIMITING.md`
- `docs/raas/TROUBLESHOOTING.md`
- `docs/raas/BEST_PRACTICES.md`
- `docs/raas/EXAMPLES/basic-usage-metering.ts`
- `docs/raas/EXAMPLES/license-enforcement.ts`
- `docs/raas/EXAMPLES/webhook-handler.ts`

---

_Created: 2026-03-09 | Status: Pending | Priority: P2_
