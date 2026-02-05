# Phase 4: Admin Withdrawal Management

## Context
- **Plan**: [Referral Network & Withdrawal UI](../plan.md)
- **Goal**: Enable admins to process withdrawal requests.

## Overview
- **Priority**: P1
- **Status**: Completed
- **Description**: Add withdrawal management module to the **Admin Panel**.

## Requirements
1.  **Route**: `/admin/withdrawals` (in `admin-panel` app)
2.  **Features**:
    - Tabulated list of Pending requests.
    - Tabulated list of History (Approved/Rejected).
    - Filter by status, date, distributor.
    - Action: Approve (Mark as paid).
    - Action: Reject (Refund balance, require reason).

## Architecture
- **App**: `admin-panel`
- **Page**: `src/pages/Withdrawals.tsx`
- **Components**:
  - `src/components/withdrawals/RequestsTable.tsx`
  - `src/components/withdrawals/ActionModal.tsx`

## Implementation Steps

1.  **Setup Admin Route**
    - Add `Withdrawals` to sidebar navigation.
    - Create page component.

2.  **Implement Data Table**
    - Use `@tanstack/react-table`.
    - Columns: ID, User, Amount, Bank Info, Date, Status, Actions.
    - Pagination.

3.  **Implement Action Logic**
    - **Approve**: Call `AdminWithdrawalService.processRequest(id, 'approve')`.
      - Confirm modal.
    - **Reject**: Call `AdminWithdrawalService.processRequest(id, 'reject', notes)`.
      - Modal with "Reason" textarea (Required).

4.  **Integration**
    - Connect to Supabase.
    - Ensure Admin RLS policies allow viewing/updating these records.

## Validation
- Admin can see pending requests.
- Approving updates status to 'approved'.
- Rejecting updates status to 'rejected' AND refunds user balance (verify via RPC logic).
