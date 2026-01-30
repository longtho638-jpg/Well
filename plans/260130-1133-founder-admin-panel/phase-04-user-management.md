# Phase 4: User Management Module

**Context Links:** [Plan Overview](./plan.md) | [Performance Report](../reports/researcher-260130-1129-performance-optimization.md)

## Overview
**Date:** 2026-01-30 | **Priority:** P2 | **Status:** Pending

Implement the User Management interface. This is the first module to use the "Data Table" architecture, employing `tanstack-table` for logic and `react-virtuoso` (if needed for large lists) or standard pagination.

## Key Insights
- **TanStack Table:** Headless control is key for Aura design.
- **Glass Table UI:** Needs specific styling (transparent headers, hover effects) as per Aura UI report.
- **Filtering:** Implement server-side filtering via Supabase, not just client-side.

## Requirements
- List all users with pagination/infinite scroll.
- Filter by Role, Status, Email.
- View User Details (Profile).
- Edit User (Change Role, Ban/Activate).
- Create User (Invite - Optional).

## Architecture
- **Components:**
  - `UsersPage`: Main container.
  - `UsersTable`: TanStack table implementation.
  - `UserFilter`: Search and filter inputs.
  - `UserDialog`: Edit/View modal.
- **Data:** `useUsers` query hook, `useUpdateUser` mutation hook.

## Implementation Steps
1.  **Service:** Implement `userService.getAll(params)` and `userService.update(id, data)`.
2.  **Hooks:** Create `useUsers` (with keepPreviousData for pagination) and `useUserMutations`.
3.  **Table Component:** Build a reusable `DataTable` component using TanStack Table and Aura styling (glass headers, row hover).
4.  **Page Construction:** Assemble `UsersPage` with Filtering and Table.
5.  **Edit/Action:** Add Action menu (Edit, Deactivate) to table rows.
6.  **Dialog:** Implement `UserDialog` using Radix UI Dialog + React Hook Form.

## Todo List
- [x] Implement `userService` methods
- [x] Create `useUsers` and mutation hooks
- [x] Build reusable `DataTable` component (Aura styled)
- [x] Implement `UsersPage` with filters
- [x] Implement `UserDialog` for editing

## Success Criteria
- [x] Can list users with pagination.
- [x] Can filter users by name/role.
- [x] Can update a user's status.
- [x] UI matches Aura Elite guidelines.

## Risk Assessment
- **Risk:** Table performance with many columns.
- **Mitigation:** Use `react-virtuoso` if DOM elements exceed 500 rows.

## Next Steps
- Proceed to Phase 5 (Distributor Management).
