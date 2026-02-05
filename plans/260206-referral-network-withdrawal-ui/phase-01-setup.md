# Phase 1: Setup & Infrastructure

## Context
- **Plan**: [Referral Network & Withdrawal UI](../plan.md)
- **Goal**: Prepare the codebase with necessary dependencies, types, and service layer abstractions.

## Overview
- **Priority**: P1 (Blocker)
- **Status**: Completed
- **Description**: Install visualization libraries, generate strict TypeScript types from Supabase, and implement the API service layer.

## Requirements
1.  **Dependencies**: Install `react-d3-tree` for network visualization.
2.  **Type Safety**: Generate `database.types.ts` from Supabase schema.
3.  **Service Layer**:
    - `ReferralService`: Fetch downline tree.
    - `WithdrawalService`: Create requests, fetch history.
    - `AdminWithdrawalService`: Process requests.

## Implementation Steps

1.  **Install Dependencies**
    ```bash
    npm install react-d3-tree
    # Check if @types/react-d3-tree is needed/available
    npm install --save-dev @types/react-d3-tree
    ```

2.  **Generate Supabase Types**
    - Run Supabase CLI type generator.
    - Save to `src/types/supabase.ts`.
    - Create domain-specific types in `src/types/domain.ts` (e.g., `NetworkNode`, `WithdrawalRequest`).

3.  **Implement `ReferralService` (`src/services/referral-service.ts`)**
    - Method: `getDownlineTree(userId: string)`
    - Call RPC: `get_downline_tree`
    - Transform flat RPC response into Hierarchical JSON for `react-d3-tree`.
    - **Transformation Logic**:
      - Root node -> Children recursively.
      - Add attributes for visualization (rank, sales, etc.).

4.  **Implement `WithdrawalService` (`src/services/withdrawal-service.ts`)**
    - Method: `createRequest(amount: number, bankDetails: BankDetails)`
    - Method: `getRequests(userId: string)` (Select from `withdrawal_requests`)
    - Call RPC: `create_withdrawal_request`

5.  **Admin Panel Setup (`admin-panel/src/services/`)**
    - Implement `AdminWithdrawalService`
    - Method: `getPendingRequests()`
    - Method: `processRequest(requestId: string, action: 'approve'|'reject', notes?: string)`

## Validation
- `npm run build` passes with new types.
- Service methods return typed data correctly.
