# Phase 3: UI Implementation

**Context Links**
- [Overview Plan](./plan.md)
- [Phase 1: Foundation](./phase-01-foundation-and-dependencies.md)
- [Phase 2: Data Layer](./phase-02-data-layer-refactoring.md)

## Overview
**Priority**: High
**Status**: Pending
**Description**: Update the Admin Dashboard UI to use the new `VirtualTable` and data fetching hooks, ensuring smooth scrolling and responsive filtering.

## Key Insights
- Rendering thousands of DOM nodes freezes the browser.
- Virtualization renders only what is visible.
- Debouncing search inputs prevents API spam.

## Requirements
- Replace existing `<table>` in Order List with `VirtualTable`.
- Integrate `useOrders` hook.
- Implement debounced search bar.
- Add loading skeletons for better UX.

## Architecture
- **Container Component**: Manages state (page, filters) and calls hooks.
- **Presentational Component**: `VirtualTable` renders the data.

## Related Code Files
- `src/pages/Admin/OrderList.tsx` (or equivalent page component)
- `src/components/ui/VirtualTable.tsx`
- `src/hooks/useDebounce.ts` (New or existing)

## Implementation Steps
1. **Create/Update Order List Page**
   - Replace `useEffect` data fetching with `useOrders`.
   - Handle `isLoading` and `isError` states from the hook.
2. **Integrate VirtualTable**
   - Pass the data from `useOrders` to `VirtualTable`.
   - Define columns configuration (headers, cell rendering).
   - Set fixed height for the container to allow virtualization to work.
3. **Implement Search/Filter**
   - Add search input field.
   - Use `useDebounce` to delay filter updates.
   - Pass debounced filter values to `useOrders`.

## Todo List
- [ ] Create `useDebounce` hook (if missing)
- [ ] Replace Order List table with `VirtualTable`
- [ ] Integrate `useOrders` hook in the page
- [ ] Verify sorting and filtering functionalities works with new UI

## Success Criteria
- List scrolls smoothly at 60fps with 1000+ items.
- Filtering updates list without UI freeze.
- Loading states are visible and transition smoothly.

## Risk Assessment
- **Risk**: Virtualization can break some layout styling (e.g., sticky headers might need specific config).
- **Mitigation**: Use `react-virtuoso` built-in props for headers/footers and stickiness.

## Security Considerations
- Sanitize search inputs before sending to API (handled by Supabase client usually, but good practice).
