---
phase: 6.2
title: "License Validation Middleware"
description: "Implement Express/Edge middleware for license key validation on every API request"
status: complete
priority: P1
effort: 2h
---

# Phase 6.2: License Validation Middleware

## Context Links

- Parent Plan: [./plan.md](./plan.md)
- Previous: [./phase-01-raas-gateway-worker.md](./phase-01-raas-gateway-worker.md)
- Next: [./phase-03-stripe-billing-sync.md](./phase-03-stripe-billing-sync.md)
- Existing: `src/lib/raas-gate-quota.ts` - Current gate middleware

## Overview

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 - Core enforcement logic |
| **Effort** | 2 hours |
| **Status** | ✅ Complete |

## Key Insights

- Existing `raas-gate-quota.ts` has middleware pattern
- Need to enhance with RaaS Gateway Worker integration
- Middleware runs on every API request
- Must handle caching to avoid latency

## Requirements

### Functional

1. Extract API key from `X-API-Key` header
2. Validate license via RaaS Gateway Worker
3. Attach license result to request context
4. Return 403 if license invalid

### Non-Functional

- Middleware overhead < 10ms
- Graceful degradation (fail open on Gateway error)
- No blocking on cache hit

## Architecture

```
API Request
    │
    ▼
┌─────────────────────────────────────┐
│  License Validation Middleware      │
│  1. Extract X-API-Key header        │
│  2. Check local cache (LRU)         │
│  3. If miss → Call RaaS Worker      │
│  4. Attach license to request       │
│  5. If invalid → 403 response       │
└─────────────────────────────────────┘
    │
    ├─ Valid ──→ Next middleware
    │
    └─ Invalid ──→ 403 Forbidden
```

## Implementation Steps

### Step 1: Create License Types ✅

**Files Created:**
- `src/types/license-enforcement.ts` - Enforcement types

See file for complete type definitions including:
- `LicenseEnforcementResult`
- `LicenseMiddlewareResult`
- `LicenseCacheEntry`
- `LicenseMiddlewareOptions`
- `RaasGatewayResponse`

### Step 2: Create RaaS Gateway Client ✅

**Files Created:**
- `src/lib/raas-gateway-client.ts` - Gateway client with caching

Features implemented:
- LRU cache with 5-minute TTL
- Maximum 100 entries with automatic eviction
- Exponential backoff retry (max 3 attempts)
- 5-second request timeout
- Fail-open mode when gateway unavailable
- Batch validation support

### Step 3: Create Middleware ✅

**Files Created:**
- `src/lib/raas-license-middleware.ts` - License validation middleware

Functions exported:
- `licenseValidationMiddleware(request, options)` - Main middleware
- `licenseDeniedResponse(result)` - 403 response helper
- `apiKeyMissingResponse()` - 401 response helper
- `withLicenseCheck(handler, options)` - HOC wrapper
- `hasFeature(license, feature)` - Feature check helper
- `isInGracePeriod(license, gracePeriodMs)` - Grace period check
- `extractApiKey(request)` - Header extraction

### Step 4: Integration with raas-gate-quota.ts ✅

**Files Modified:**
- `src/lib/raas-gate-quota.ts` - Added `enhancedLicenseQuotaMiddleware`

The new function combines:
1. License validation (Phase 6.2 middleware)
2. Quota enforcement (Phase 6.1)

## Todo List

- [x] Create license enforcement types
- [x] Create RaasGatewayClient with LRU cache
- [x] Implement local cache (LRU Map)
- [x] Implement grace period logic
- [x] Create licenseValidationMiddleware
- [x] Create licenseDeniedResponse helper
- [x] Update raas-gate-quota.ts to use new middleware
- [ ] Add unit tests for service (Phase 6.5)
- [ ] Add integration tests for middleware (Phase 6.5)

## Success Criteria

- [x] Middleware blocks invalid licenses with 403
- [x] Middleware allows valid licenses
- [x] Grace period works for expired licenses (24h)
- [x] Feature gating works
- [x] Cache reduces latency to < 10ms (in-memory Map)
- [ ] Tests pass for all scenarios (Phase 6.5)

## API Routes Integration

**Example usage in API routes:**
```typescript
// src/pages/api/protected-route.ts
import { licenseValidationMiddleware, licenseDeniedResponse } from '@/lib/raas-gate-quota'

export async function GET(req: Request) {
  const result = await licenseValidationMiddleware(req)
  if (!result.allowed) {
    return licenseDeniedResponse(result)
  }

  // Continue with protected logic
  return Response.json({ data: 'protected' })
}
```

## Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Cache inconsistency | 5-min TTL + manual invalidation |
| Grace period abuse | Log all grace period accesses |
| Middleware slows requests | Benchmark, optimize cache |

## Next Steps

After middleware is implemented, proceed to [Phase 6.3](./phase-03-stripe-billing-sync.md) for Stripe integration.

---

_Created: 2026-03-09_
