# Phase 04: Main App Implementation

## Status: Pending
## Priority: High

## Overview
Integrate the 404 page and refined loading states into the Main App's routing system.

## Requirements
- Replace `Navigate to="/"` with `<NotFoundPage />` for the catch-all route.
- Ensure all lazy routes are wrapped in `SafePage`.

## Related Code Files
- `src/App.tsx`

## Implementation Steps
1. Import `NotFoundPage` (lazy loaded).
2. Update the `*` route in `App.tsx`.
3. Verify that manual entry of a non-existent URL triggers the 404 page.

## Success Criteria
- Entering `/invalid-path` shows the 404 page instead of redirecting to `/`.
- No broken layouts during navigation.
