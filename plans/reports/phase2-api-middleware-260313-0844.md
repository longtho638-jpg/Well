# Phase 2 - API Middleware for Subscription Gating

**Date:** 2026-03-13  
**Status:** Completed  
**Plan:** `/apps/well/plans/260313-0814-security-audit/`

---

## Summary

Implemented API middleware for subscription-based endpoint protection. The middleware integrates with existing RaaS license validation and adds subscription tier checking.

---

## Files Created

### 1. `src/lib/subscription-gate.ts` (277 lines)

Core feature access control library:

- `meetsTierRequirement()` - Check if tier meets minimum requirement
- `checkFeatureAccess()` - Validate user has access to feature
- `getRequiredPlan()` - Get minimum plan for a feature
- `getLockedFeatures()` - List features locked for a tier
- `getAvailableFeatures()` - List features available for a tier
- `getFeaturesUnlockedByUpgrade()` - Features unlocked by upgrade
- `formatSubscriptionDeniedResponse()` - API error response format
- `useFeatureGate()` - React hook for component-level gating

### 2. `src/api/middleware/subscription-middleware.ts` (133 lines)

API endpoint protection middleware:

- `subscriptionMiddleware()` - Main middleware function
- `withSubscription()` - Higher-order function wrapper
- `subscriptionDeniedResponse()` - Manual 403 response helper

---

## Implementation Details

### Middleware Flow

```
Request → RaaS License Check → Subscription Tier Check → Access Granted/Denied
                                  ↓
                    403 Response if denied:
                    {
                      error: "subscription_required",
                      message: "This feature requires a premium subscription",
                      required_plan: "analyticsDashboard",
                      current_plan: "free",
                      upgrade_url: "/subscription"
                    }
```

### Integration with Existing Code

- Reuses `raasLicenseMiddleware.licenseValidationMiddleware()` for license check
- Uses `checkFeatureAccess()` from `subscription-gate.ts` for tier validation
- Returns standard 403 response with `subscription_required` error code
- Includes `upgrade_url` in all denial responses

---

## API Routes Identified for Protection

Based on codebase analysis, the following route categories should be protected:

| Route Category | Features to Protect | Required Plan |
|----------------|---------------------|---------------|
| Analytics Data | `analyticsDashboard`, `advancedReports` | pro |
| Bulk Exports | `bulkExport`, CSV downloads | pro |
| Report Generation | Custom reports, PDF generation | pro |
| Priority Features | `priorityBooking`, `dedicatedSupport` | enterprise |
| Advanced Features | `customIntegrations`, `whiteLabel` | enterprise |

### Current API Routes

- `src/api/routes/webhooks/polar-webhook.ts` - Webhook (no gating needed)
- Future analytics/export endpoints - **Apply middleware when created**

---

## Usage Examples

### Manual Middleware Call

```typescript
import { subscriptionMiddleware } from '@/api/middleware/subscription-middleware'

export async function GET(req: Request) {
  const blocked = await subscriptionMiddleware(req, 'analyticsDashboard')
  if (blocked) return blocked

  // Protected handler logic...
  return Response.json({ data: 'analytics' })
}
```

### Higher-Order Function Wrapper

```typescript
import { withSubscription } from '@/api/middleware/subscription-middleware'

export const GET = withSubscription(
  async (req: Request) => {
    // Protected handler logic...
    return Response.json({ data: 'export' })
  },
  'bulkExport'
)
```

---

## Build Verification

```
Build Status: ✅ PASSED
- 4157 modules transformed
- 0 TypeScript errors
- All chunks generated successfully
```

---

## Feature Configuration (from subscription-config.ts)

```typescript
WELLNEXUS_FEATURE_GATE = {
  planHierarchy: ['free', 'pro', 'enterprise'],
  featureMinPlan: {
    // Analytics & Reporting
    analyticsDashboard: 'pro',
    advancedReports: 'pro',
    bulkExport: 'pro',

    // Support & Priority
    priorityBooking: 'enterprise',
    dedicatedSupport: 'enterprise',

    // Advanced Features
    customIntegrations: 'enterprise',
    whiteLabel: 'enterprise',
  },
}
```

---

## Next Steps

1. Apply middleware to new API routes as they are created
2. Create UI components for upgrade prompts (FeatureLockOverlay, FreeTierUpgradeCTA)
3. Add i18n keys for subscription-related messages
4. Consider adding route-level decorators for automatic protection

---

## Unresolved Questions

None - Phase 2 implementation complete.

