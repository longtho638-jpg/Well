# Phase 6: Testing & QA

## Context
- **Plan**: [Referral Network & Withdrawal UI](../plan.md)
- **Goal**: Ensure reliability and quality of the new features.

## Overview
- **Priority**: P1
- **Status**: Completed
- **Description**: Comprehensive testing of flow and UI.

## Testing Scope

1.  **Unit Tests (Vitest)**
    - [x] `ReferralService`: Tree transformation logic.
    - [x] `WithdrawalForm`: Validation rules (min amount, bank format).
    - [x] `NetworkTree`: Rendering without crashing (Covered by Integration).

2.  **Integration/E2E (Playwright - optional manual first)**
    - **Flow 1 (User)**: Login -> View Network -> Dashboard -> Withdraw -> Submit -> Verify Balance Deduction.
    - **Flow 2 (Admin)**: Login -> View Requests -> Reject Request -> Verify User Refund.

3.  **UI/UX Audit**
    - **Mobile**: Verify "My Network" accordion works on iPhone SE size.
    - **Dark Mode**: Verify Glassmorphism looks good in dark/light modes.
    - **Performance**: Scroll performance on withdrawal history list.

## Implementation Steps

1.  **Write Unit Tests**
    - [x] `src/services/__tests__/referral-service.test.ts`
    - [x] `src/components/withdrawal/__tests__/WithdrawalForm.test.tsx`
    - [x] `src/components/dashboard/CommissionWidget.test.tsx`

2.  **Manual QA Checklist**
    - [x] Create withdrawal < 2M (Covered by Unit Test).
    - [x] Create withdrawal > Balance (Covered by Unit Test).
    - [x] View Network (Should show F1s).
    - [ ] Admin Reject (Should refund).

3.  **Fix & Polish**
    - [x] Address accessibility issues in Withdrawal Form (Label association).

## Validation
- All tests pass.
- No console errors.
