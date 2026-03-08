---
title: "Phase 7.4: Phase 6 Integration"
description: "Integrate with tenant quota overrides, grace periods, and effective quota calculation"
status: pending
priority: P1
effort: 1.5h
---

# Phase 7.4: Phase 6 Integration

## Context Links

- Related: `src/lib/grace-period-engine.ts` - Grace period logic
- Related: `src/lib/tenant-license-client.ts` - Tenant license client
- Related: `src/middleware/tenant-context.ts` - Tenant context

## Overview

Integrate Phase 7 overage billing with Phase 6 multi-tenant license enforcement, including quota overrides and grace periods.

## Key Formula

```
Effective Quota = Base (Stripe) + Overrides + Grace Period Boost

Where:
- Base: Default quota from Stripe subscription tier
- Overrides: Custom quota adjustments per tenant
- Grace: Temporary boost during grace period (50% reduction in limits)
```

## Requirements

### Functional
1. Calculate effective quota from all sources
2. Apply tenant-specific overrides to overage calculation
3. Activate grace period 7 days before expiry
4. Reduce rate limits by 50% during grace period
5. Track grace period start/end dates

### Non-Functional
- Quota calculation < 20ms
- Cache effective quota with TTL
- Invalidate cache on override changes

## Integration Points

| Phase 6 Component | Phase 7 Integration |
|-------------------|---------------------|
| `tenant_quota_overrides` table | Modify overage base quota |
| `grace_period_engine.ts` | Apply temporary quota boost |
| `tenant-license-client.ts` | Fetch effective quota |
| `rate-limiter-cloudflare.ts` | Apply per-tenant limits |

## Implementation Steps

1. Update `getTenantQuotaOverride()` to include in effective quota
2. Enhance grace period engine with quota adjustments
3. Create `calculateEffectiveQuota()` unified function
4. Add caching layer with invalidation
5. Update tenant context to include effective quota

## Todo List

- [ ] Create calculateEffectiveQuota() function
- [ ] Integrate grace period adjustments
- [ ] Add quota caching
- [ ] Update tenant context middleware
- [ ] Write integration tests

## Success Criteria

1. Effective quota = Base + Overrides + Grace
2. Grace period reduces limits by 50%
3. Tenant overrides correctly applied
