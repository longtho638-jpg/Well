---
title: "Phase 1: Admin Access Control"
status: completed
priority: P1
effort: 30m
completed: 2026-03-07T20:00+07:00
---

# Phase 1: Admin Access Control

## Context

**Links:** [[plan.md|Overview Plan]]

Currently `AnalyticsPage.tsx` renders without any authentication guard. The `AdminRoute` component exists at `src/components/AdminRoute.tsx` but is not being used.

## Overview

- **Priority:** P1 (Security - must be first)
- **Status:** pending
- **Description:** Wrap AnalyticsPage with AdminRoute to protect analytics dashboard from unauthorized access

## Requirements

### Functional
- Only authenticated admin users can access `/admin/analytics`
- Non-admin users redirected to `/dashboard`
- Unauthenticated users redirected to login

### Non-functional
- No breaking changes to existing functionality
- Maintain current UI/UX for authorized users

## Implementation Steps

### Step 1: Import AdminRoute

**File:** `src/pages/Admin/AnalyticsPage.tsx`

```tsx
// Add import at top of file
import { AdminRoute } from '@/components/AdminRoute';
```

### Step 2: Wrap Content with AdminRoute

**File:** `src/pages/Admin/AnalyticsPage.tsx`

Modify the component to wrap children with AdminRoute:

```tsx
export default function AnalyticsPage() {
  return (
    <AdminRoute>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">
              Real-time metrics: license usage, revenue, API consumption
            </p>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
          <LicenseAnalyticsDashboard />
        </div>
      </div>
    </AdminRoute>
  );
}
```

### Step 3: Verify Route Configuration

**File:** `src/App.tsx`

Ensure the route is properly configured (should already exist):

```tsx
<Route
  path="/admin/analytics"
  element={
    <AdminRoute>
      <AnalyticsPage />
    </AdminRoute>
  }
/>
```

**Note:** If `AnalyticsPage` already wrapped at route level, wrap inside component instead for double protection.

## Success Criteria

- [x] Unauthenticated user redirected to login when accessing `/admin/analytics`
- [x] Non-admin user redirected to `/dashboard`
- [x] Admin user sees dashboard normally
- [x] TypeScript compiles with 0 errors
- [x] No console errors in browser

## Testing

```bash
# 1. Build verification
npm run build

# 2. Manual testing
# - Logout → Navigate to /admin/analytics → Should redirect to login
# - Login as user (non-admin) → Navigate to /admin/analytics → Should redirect to /dashboard
# - Login as admin → Navigate to /admin/analytics → Should show dashboard
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| AdminRoute not exported | Low | Check export in AdminRoute.tsx |
| Double wrapping causes issues | Low | AdminRoute is idempotent |

## Next Steps

Plan complete. All features verified.

---

_Last Updated: 2026-03-07T20:00+07:00_
_Author: Project Manager_
_Status: COMPLETE - AnalyticsPage.tsx wrapped with AdminRoute component_
