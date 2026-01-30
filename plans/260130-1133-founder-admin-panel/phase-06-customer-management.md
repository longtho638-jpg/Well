# Phase 6: Customer Management Module

**Context Links:** [Plan Overview](./plan.md)

## Overview
**Date:** 2026-01-30 | **Priority:** P2 | **Status:** Pending

Manage end-customers. Focus is on purchase history and LTV (Lifetime Value).

## Key Insights
- **Customer Journey:** Founders want to see what customers are buying and how often.
- **Connection:** Who is the referring distributor?

## Requirements
- List Customers.
- Filter by "Big Spenders", "Recent", "Inactive".
- View Purchase History (Orders list).
- Link to Referring Distributor.

## Architecture
- **Components:**
  - `CustomersPage`.
  - `CustomerHistory`: Sub-table of orders.
- **Data:** `useCustomers`.

## Implementation Steps
1.  **Service:** Implement `customerService`.
2.  **Page UI:** Table with Customer details, Total Spent, Last Order Date.
3.  **Detail View:** `CustomerDetailPage` showing linked Orders.

## Todo List
- [x] Implement `customerService`
- [x] Create `CustomersPage`
- [x] Create `CustomerDetailPage` with Order History

## Success Criteria
- [x] Can see all customers and their LTV.
- [x] Can navigate to customer's order history.

## Risk Assessment
- **Risk:** "Total Spent" calculation might be slow if aggregated on the fly.
- **Mitigation:** Use a Database View or pre-calculated field.

## Next Steps
- Proceed to Phase 7 (Order Management).
