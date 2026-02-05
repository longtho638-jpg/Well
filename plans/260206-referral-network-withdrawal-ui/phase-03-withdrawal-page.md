# Phase 3: Distributor Withdrawal System

## Context
- **Plan**: [Referral Network & Withdrawal UI](../plan.md)
- **Goal**: Enable distributors to request payouts.

## Overview
- **Priority**: P1
- **Status**: Completed
- **Description**: Implement `/dashboard/withdrawal` with a secure form and history tracking.

## Requirements
1.  **Route**: `/dashboard/withdrawal`
2.  **Form**:
    - Fields: Bank Name, Account Number, Account Name, Amount.
    - Validation: Min 2,000,000 VND, Amount <= Pending Balance.
    - Bank List: Dropdown of common VN banks.
3.  **History**:
    - List of past requests with status (Pending, Approved, Rejected).
    - Status badges.

## Architecture
- **Page**: `src/pages/dashboard/WithdrawalPage.tsx`
- **Components**:
  - `src/components/withdrawal/WithdrawalForm.tsx`
  - `src/components/withdrawal/WithdrawalHistory.tsx`
  - `src/components/withdrawal/BankSelect.tsx`

## Implementation Steps

1.  **Create Components**
    - `BankSelect`: Static list of VN banks (Vietcombank, Techcombank, etc.).
    - `WithdrawalForm`: React Hook Form + Zod validation.

2.  **Implement Form Logic**
    - Integration with `WithdrawalService.createRequest`.
    - Real-time balance check (prevent submitting if balance too low).
    - Success feedback: Toast + Refresh list.

3.  **Implement History Table**
    - Fetch `withdrawal_requests` via Service.
    - Columns: Date, Amount, Bank, Status, Notes (if rejected).
    - Real-time subscription (optional but recommended) to update status.

4.  **Page Assembly**
    - Layout: Left/Top = Request Form, Right/Bottom = History.
    - Display current "Available for Withdrawal" balance prominently.

## Security Considerations
- **Input Validation**: Strict Zod schema for bank numbers (digits only).
- **Double Submit Prevention**: Disable button while submitting.
- **CSRF**: Handled by Supabase Auth / RLS.

## Validation
- Form prevents submission < 2M VND.
- Form prevents submission > Balance.
- Successful submission deducts balance immediately (via RPC logic).
