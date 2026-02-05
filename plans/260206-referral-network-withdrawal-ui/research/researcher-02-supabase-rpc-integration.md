# Supabase RPC & TypeScript Integration Research
**Date:** 2026-02-06
**Version:** 1.0.0
**Status:** COMPLETE

## 1. Supabase RPC Functions Analysis

The system relies on three core Postgres functions (RPCs) defined in `20260205223540_ecommerce_setup.sql`.

### A. Network Tree (`get_downline_tree`)
- **Signature:** `get_downline_tree(root_user_id UUID)`
- **Returns:** Table (recursive CTE result) containing `id, sponsor_id, email, name, level, rank, ...`
- **Usage:** Used in `useReferral.ts` to fetch the F1-F7 network.
- **Client Code:**
  ```typescript
  const { data, error } = await supabase.rpc('get_downline_tree', { root_user_id: user.id });
  ```
- **Fallback:** The client currently implements a fallback to fetch just F1s if the RPC fails.

### B. Withdrawal Request (`create_withdrawal_request`)
- **Signature:** `create_withdrawal_request(p_amount, p_bank_name, p_bank_account_number, p_bank_account_name)`
- **Logic:**
  1. Checks user authentication.
  2. Verifies `pending_cashback` >= requested amount.
  3. Enforces minimum threshold (2,000,000 VND).
  4. Inserts into `withdrawal_requests` table.
  5. **Crucial:** Immediately deducts from `pending_cashback` to lock funds.
- **Security:** `SECURITY DEFINER` (runs with owner privileges to update user balance).

### C. Admin Processing (`process_withdrawal_request`)
- **Signature:** `process_withdrawal_request(p_request_id, p_action, p_notes)`
- **Logic:**
  1. Verifies admin role (Chairman, Ambassador, Manager).
  2. Updates status to `approved` or `rejected`.
  3. **Refund Logic:** If rejected, automatically refunds amount to `pending_cashback`.

## 2. TypeScript Patterns & Type Safety

### Current State (Weak Typing)
Current implementation relies on manual type casting which risks runtime errors if SQL changes.
- **Problem:** `useReferral.ts` uses `as unknown as Referral` to cast RPC results.
- **Problem:** `withdrawal-service.ts` manually defines interfaces instead of inferring from DB schema.

### Recommended Pattern (Database Generated Types)
Leverage Supabase CLI to generate types:
```bash
npx supabase gen types typescript --project-id "$PROJECT_REF" > types/supabase.ts
```

Then use the `Database` interface:
```typescript
import { Database } from '@/types/supabase';
type WithdrawalRequest = Database['public']['Tables']['withdrawal_requests']['Row'];
type DownlineNode = Database['public']['Functions']['get_downline_tree']['Returns'][0];
```

## 3. Error Handling Strategy

The codebase uses a consistent wrapping pattern in services (`withdrawal-service.ts`, `walletService.ts`):

1.  **Service Layer Catch:**
    ```typescript
    try {
        const { data, error } = await supabase.rpc(...);
        if (error) throw error;
        return data;
    } catch (err) {
        uiLogger.error('Context', err); // Centralized logging
        throw err; // Re-throw for UI handling
    }
    ```
2.  **UI Feedback:** Frontend components catch the re-thrown error to display toast notifications.

## 4. RLS Policy Enforcement

Security is enforced at the database level (`20260205223540_ecommerce_setup.sql`):

| Table | Operation | Policy |
|-------|-----------|--------|
| `withdrawal_requests` | SELECT | `auth.uid() = user_id` (View own) |
| `withdrawal_requests` | INSERT | `auth.uid() = user_id` (Create own) |
| `withdrawal_requests` | UPDATE | Role check (Admin only) |
| `users` | ALL | RLS enabled (via `supabase-rls.sql`) |

**Critical Note:** RPC functions `create_withdrawal_request` and `process_withdrawal_request` are `SECURITY DEFINER`. They bypass RLS for their internal logic (updating balances) but are gatekept by internal `auth.uid()` checks.

## 5. Real-time Subscriptions

### Current Implementation
`walletService.ts` subscribes to `users` table to track balance changes:
```typescript
supabase.channel(`wallet-updates-${userId}`)
  .on('postgres_changes', { event: 'UPDATE', table: 'users', filter: `id=eq.${userId}` }, ...)
```

### Recommendation for Withdrawals
To update UI when a withdrawal is approved/rejected, add a subscription to `withdrawal_requests`:

```typescript
// In withdrawal-service.ts or hook
supabase.channel(`withdrawal-updates-${userId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'withdrawal_requests',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      // Trigger toast: "Your withdrawal request was [status]"
      // Refresh list
    }
  )
```

## 6. Unresolved Questions
1.  **Notification System:** Does the backend trigger an email/notification on withdrawal status change? (Not found in SQL).
2.  **Bank Transfer Integration:** Is there an automated payout gateway, or is "Approved" just a manual signal? (Code suggests manual).

## 7. Action Plan
1.  Generate strict TypeScript types from schema.
2.  Refactor `useReferral` and `withdrawalService` to use generated types.
3.  Implement Realtime subscription for withdrawal status updates.
