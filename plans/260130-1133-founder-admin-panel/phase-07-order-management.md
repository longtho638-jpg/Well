# Phase 7: Order Management Module

**Context Links:** [Plan Overview](./plan.md)

## Overview
**Date:** 2026-01-30 | **Priority:** P2 | **Status:** Pending

The operational heart of the admin panel. Manage orders, payments, and fulfillment status.

## Key Insights
- **Status Workflow:** Pending -> Paid -> Shipped -> Completed.
- **Real-time:** While "Static", orders should be fresh. React Query refetch interval or Subscription.

## Requirements
- List Orders (Filter by Status, Date Range).
- Order Detail View (Items, Pricing, Customer, Distributor).
- Update Status (e.g., Mark as Shipped).
- Payment verification (manual toggle if needed).

## Architecture
- **Components:**
  - `OrdersPage`.
  - `KanbanBoard` (Optional future) or `OrdersTable` (Priority).
  - `OrderDetailDrawer`: Slide-over for quick details.
- **Data:** `useOrders`, `useUpdateOrderStatus`.

## Implementation Steps
1.  **Service:** `orderService` with join on Items/Products.
2.  **UI:** Table with Status Badges (Colored: Yellow/Green/Blue).
3.  **Filtering:** Date Range Picker (Aura styled).
4.  **Actions:** "Mark Paid", "Mark Shipped" buttons/dropdowns.
5.  **Detail:** Drawer or Modal showing receipt style details.

## Todo List
- [x] Implement `orderService`
- [x] Create `OrdersPage`
- [x] Implement Status Badge components
- [x] Implement Order Action mutations
- [x] Build `OrderDetail` view

## Success Criteria
- [x] Can process an order from Pending to Completed.
- [x] Can view all details of an order accurately.

## Risk Assessment
- **Risk:** Concurrent updates (two admins updating same order).
- **Mitigation:** Optimistic updates with rollback, or simple "last write wins" for MVP.

## Next Steps
- Proceed to Phase 8 (Analytics Dashboard).
