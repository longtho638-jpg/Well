# Phase 05: Admin Panel Refactoring

## Status: Pending
## Priority: High

## Overview
Bring the Admin Panel up to the same UX standards as the Main App.

## Requirements
- Implement Error Boundary.
- Implement Lazy Loading for routes.
- Implement 404 page for admin routes.

## Related Code Files
- `admin-panel/src/App.tsx`
- `admin-panel/src/components/ErrorBoundary.tsx` (New, can be shared or copied)

## Implementation Steps
1. Create or adapt `ErrorBoundary` for the admin panel.
2. Refactor `admin-panel/src/App.tsx` to use `lazy()` and `Suspense`.
3. Add the catch-all route for 404.

## Success Criteria
- Admin panel handles runtime errors gracefully.
- Improved initial load time due to code splitting.
- Proper 404 handling in admin context.
