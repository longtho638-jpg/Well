# Phase 3: Core Data Services & API Integration

**Context Links:** [Plan Overview](./plan.md) | [Performance Report](../reports/researcher-260130-1129-performance-optimization.md)

## Overview
**Date:** 2026-01-30 | **Priority:** P1 | **Status:** Pending

Establish the data layer using TanStack Query and a dedicated Service abstraction. This solves the N+1 problem identified in research and ensures efficient caching and data fetching for the rest of the application.

## Key Insights
- **No N+1:** Use Supabase Joins (`.select('*, related(*)')`) to fetch related data in one go.
- **React Query:** Mandatory for caching server state and handling loading/error states automatically.
- **Service Layer:** Decouple Supabase-specific code from UI components.

## Requirements
- Set up `QueryClient` with global defaults (staleTime, retry).
- Create generic Service types/interfaces.
- Implement base services for generic CRUD (optional, or specific services).
- Configure error handling (Toast notifications on query failure).

## Architecture
- **React Query:** Global provider in `App.tsx`.
- **Folder Structure:**
  ```
  src/services/
    api.ts            # Base axios/supabase wrapper (if needed)
    userService.ts    # User related fetching
    orderService.ts   # Order related fetching
  src/hooks/queries/  # Custom hooks using useQuery
    useUsers.ts
    useOrders.ts
  ```

## Implementation Steps
1.  **Query Client:** Initialize `QueryClient` in `src/lib/react-query.ts` with `staleTime: 60000` (1 min).
2.  **Wrap App:** Add `QueryClientProvider` to `main.tsx`.
3.  **Base Types:** Define TypeScript interfaces for `User`, `Distributor`, `Order`, `Customer`.
4.  **Service Skeleton:** Create initial files for `userService`, `productService`, `orderService`.
5.  **Error Handling:** Create a global query error handler that triggers a Toast notification.

## Todo List
- [x] Configure `QueryClient` and Provider
- [x] Define core TypeScript Interfaces
- [x] Create `services` directory structure
- [x] Implement global error handling for queries

## Success Criteria
- [x] Application has access to `useQuery` context.
- [x] Basic fetch tests (console log) work with Supabase.

## Risk Assessment
- **Risk:** Type mismatch between frontend interfaces and database schema.
- **Mitigation:** Use `supabase gen types` if possible, or manually verify against DB schema.

## Next Steps
- Proceed to Phase 4 (User Management).
