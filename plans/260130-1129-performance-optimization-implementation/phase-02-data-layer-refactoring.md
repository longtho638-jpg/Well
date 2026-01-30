# Phase 2: Data Layer Refactoring

**Context Links**
- [Overview Plan](./plan.md)
- [Research Report](../reports/researcher-260130-1129-performance-optimization.md)
- [Order Service](../../src/services/orderService.ts)

## Overview
**Priority**: Critical
**Status**: Pending
**Description**: Refactor data fetching to eliminate N+1 query patterns and implement efficient caching using React Query.

## Key Insights
- Current `orderService.getPendingOrders` fetches orders then loops to fetch users (N+1).
- Supabase supports joining tables in a single query.
- React Query can handle caching, background updates, and deduplication automatically.

## Requirements
- Refactor `orderService` to use Supabase joins.
- Create custom hooks (e.g., `useOrders`) to encapsulate React Query logic.
- Implement server-side filtering and sorting support in the service layer.

## Architecture
- **Service Layer**: Pure async functions returning typed data (Supabase interactions).
- **Hooks Layer**: Custom React hooks (`useQuery` wrappers) managing state, loading, and errors.

## Related Code Files
- `src/services/orderService.ts` (Modify)
- `src/hooks/useOrders.ts` (New)
- `src/types/index.ts` (Update types if needed)

## Implementation Steps
1. **Refactor Order Service**
   - Modify `getPendingOrders` to use `.select('*, user:users(name, email)')`.
   - Remove the `Promise.all` loop.
   - Ensure type safety for the joined response.
2. **Implement useOrders Hook**
   - Create `useOrders.ts`.
   - Use `useQuery` to call `orderService.getPendingOrders`.
   - Configure stale time (e.g., 1 minute) and cache time.
3. **Add Filtering/Sorting Support**
   - Update service functions to accept filter/sort parameters.
   - Update hook to accept these params and pass them to the query key.

## Todo List
- [ ] Refactor `orderService.getPendingOrders` to use joins
- [ ] Create `useOrders` hook with React Query
- [ ] Update `PendingOrder` type definition to match joined structure
- [ ] Add parameters for pagination/filtering to service methods

## Success Criteria
- Network tab shows a single request for orders (instead of 1 + N).
- Data loads correctly via the new hook.
- Filtering updates the data efficiently.

## Risk Assessment
- **Risk**: Breaking changes to existing components using `orderService`.
- **Mitigation**: Keep the old method temporarily or refactor all consumers immediately (Phase 3 covers UI updates, but this phase might break things if not coordinated). *Strategy*: Create new methods/hooks first, then switch UI.

## Security Considerations
- Ensure RLS policies on Supabase allow the joined query structure.
