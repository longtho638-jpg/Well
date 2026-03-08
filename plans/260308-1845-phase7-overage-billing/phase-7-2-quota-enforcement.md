---
title: "Phase 7.2: Hard Quota Enforcement"
description: "Block requests when quotas exceeded with configurable enforcement modes"
status: pending
priority: P1
effort: 2h
---

# Phase 7.2: Hard Quota Enforcement

## Context Links

- Related: `./phase-7-1-overage-tracking.md` - Overage tracking
- Related: `src/lib/rate-limiter-cloudflare.ts` - Rate limiter
- Related: `src/middleware/tenant-context.ts` - Tenant context

## Overview

Implement hard quota enforcement that blocks requests when quotas are exceeded, with configurable enforcement modes (soft vs hard limits).

## Key Insights

- Soft limits: Allow with warnings and overage billing
- Hard limits: Block with 429 Too Many Requests
- Enforcement mode should be configurable per tenant/metric

## Requirements

### Functional
1. Return 429 when hard limit exceeded
2. Include overage info in 429 response body
3. Support soft limit mode (allow with overage billing)
4. Support hard limit mode (block immediately)
5. Configurable per tenant and per metric type

### Non-Functional
- Enforcement check < 50ms
- Graceful degradation if enforcement service unavailable
- Clear error messages with upgrade paths

## Enforcement Modes

```typescript
type EnforcementMode = 'soft' | 'hard' | 'hybrid'

// Soft: Always allow, bill overages
// Hard: Block at quota, no overages
// Hybrid: Allow grace period, then block
```

## Response Format (429)

```json
{
  "error": "Quota exceeded",
  "message": "Monthly API call quota exceeded",
  "quota": {
    "metric": "api_calls",
    "limit": 10000,
    "used": 10543,
    "overage": 543,
    "overage_rate": 0.001,
    "overage_cost": 0.54
  },
  "enforcement_mode": "hard",
  "reset_at": "2026-04-01T00:00:00Z",
  "upgrade_url": "https://wellnexus.vn/dashboard/subscription"
}
```

## Implementation Steps

1. Add `enforcement_mode` to tenant_license_policies
2. Update rate-limiter-cloudflare.ts with quota checks
3. Create 429 response handler with overage info
4. Add client-side quota exhaustion detection

## Todo List

- [ ] Add enforcement_mode to schema
- [ ] Update rate limiter with quota enforcement
- [ ] Create standardized 429 response
- [ ] Add client-side quota hooks
- [ ] Write integration tests

## Success Criteria

1. Requests blocked at hard limit
2. 429 response includes actionable info
3. Soft mode allows overages with billing

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| False positives blocking legitimate traffic | Critical | Add bypass for admin keys, monitoring alerts |
| Race conditions at exact limit | High | Use atomic DB operations |
