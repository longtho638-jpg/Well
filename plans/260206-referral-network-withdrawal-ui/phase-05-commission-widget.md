# Phase 5: Dashboard Integration & Widget

## Context
- **Plan**: [Referral Network & Withdrawal UI](../plan.md)
- **Goal**: Surface network and withdrawal data on the main dashboard.

## Overview
- **Priority**: P2
- **Status**: Completed
- **Description**: Update the `CommissionWidget` to show actionable data and link to new pages.

## Requirements
1.  **Commission Widget**:
    - Show `pending_cashback` (Available Balance).
    - Show `total_commission` (Lifetime).
    - "Withdraw" button -> `/dashboard/withdrawal`.
    - "View Network" button -> `/dashboard/network`.
2.  **Quick Actions**:
    - Add "My Network" to main navigation / sidebar.
    - Add "Withdrawal" to main navigation / sidebar.

## Implementation Steps

1.  **Update `CommissionWidget`**
    - [x] Locate `src/components/dashboard/CommissionWidget.tsx`.
    - [x] Connect to `wallet` store or `useUser` hook to get `pending_cashback`.
    - [x] Add formatted currency display.
    - [x] Add navigation buttons.

2.  **Update Navigation**
    - [x] Update `src/layouts/DashboardLayout.tsx` (or Sidebar component).
    - [x] Add links with icons (`Network`, `CreditCard`).
    - Note: Verified `Sidebar.tsx` already contained these links.

3.  **Real-time Balance**
    - [x] Ensure the balance displayed updates immediately after a withdrawal request is made (optimistic update or re-fetch).

## Validation
- [x] Clicking "Withdraw" goes to Withdrawal page.
- [x] Balance matches database.
- [x] Unit tests passed (`npm test src/components/dashboard/CommissionWidget.test.tsx`)
