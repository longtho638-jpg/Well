# Performance Optimization Implementation Plan

**Status**: Draft
**Goal**: Optimize admin dashboard performance for large datasets (10k+ records) using virtualization, efficient data fetching, and caching strategies.

## Phases

- [ ] **Phase 1: Foundation & Dependencies**
    - Install `react-virtuoso` for virtualization.
    - Install `@tanstack/react-query` (Recommended) or set up advanced Zustand caching utilities.
    - Create reusable `VirtualTable` component.
- [ ] **Phase 2: Data Layer Refactoring**
    - Refactor `orderService` to use Supabase joins instead of client-side loops (fix N+1).
    - Implement `useOrders` hook with caching and stale-while-revalidate logic.
    - Implement server-side filtering/sorting support in API calls.
- [ ] **Phase 3: UI Implementation**
    - Replace standard tables with `VirtualTable` in Order/Distributor lists.
    - Implement `OrderList` component with virtualization.
    - Add debounced search inputs.
- [ ] **Phase 4: Export & Heavy Operations**
    - Implement Web Worker for CSV generation to prevent UI freezing.
    - (Optional) Create Supabase Edge Function for streaming large exports.
- [ ] **Phase 5: Performance Verification**
    - Measure FPS during scrolling.
    - Verify network request reduction.
    - Test with 10k mock records.

## Key Technical Decisions
1. **Data Fetching**: Moving from waterfall requests to single joined queries.
2. **Caching**: Introducing React Query for robust server-state management (replacing manual Zustand fetch calls).
3. **Rendering**: Adopting Windowing/Virtualization for lists > 100 items.

## Dependencies
- `react-virtuoso`
- `@tanstack/react-query` (Proposed)
