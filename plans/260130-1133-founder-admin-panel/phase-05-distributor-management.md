# Phase 5: Distributor Management Module

**Context Links:** [Plan Overview](./plan.md)

## Overview
**Date:** 2026-01-30 | **Priority:** P2 | **Status:** Pending

Implement specialized management for Distributors. This extends User Management but focuses on distributor-specific fields like Commission Rates, Revenue, and Downline metrics.

## Key Insights
- **Commission Data:** Critical sensitivity. Needs clear visibility.
- **Performance Metrics:** Founders need to see how a distributor is performing (Revenue, Sales).

## Requirements
- List Distributors (Filter by Performance, Tier).
- View Distributor Profile (Custom fields).
- Edit Commission Rates.
- View Downline/Tree (Visual hierarchy is a plus, but list view first).

## Architecture
- **Components:**
  - `DistributorsPage`.
  - `CommissionCard`: Widget to show/edit current rates.
  - `PerformanceChart`: Small sparkline or chart for distributor revenue.
- **Data:** `useDistributors`, `useDistributorMetrics`.

## Implementation Steps
1.  **Service:** Implement `distributorService` (fetching profiles joined with commission data).
2.  **Page UI:** Similar to UsersPage but with specific columns (Tier, Commission %, Total Sales).
3.  **Detail View:** Create `DistributorDetailPage` for deep dive.
4.  **Commission Logic:** Implement mutation to update commission settings securely.

## Todo List
- [x] Implement `distributorService`
- [x] Create `DistributorsPage`
- [x] Create `DistributorDetailPage`
- [x] Implement Commission edit functionality

## Success Criteria
- [x] Can view distributor specific data.
- [x] Can update commission rates.

## Risk Assessment
- **Risk:** Complex relational data (performance metrics calculation).
- **Mitigation:** Calculate heavy metrics in Supabase (Postgres View) rather than frontend.

## Next Steps
- Proceed to Phase 6 (Customer Management).
