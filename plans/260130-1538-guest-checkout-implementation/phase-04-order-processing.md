# Phase 4: Order Processing & Integration

## Context
- **Report:** `/Users/macbookprom1/Well/plans/reports/researcher-260130-1538-guest-checkout-patterns.md`

## Overview
**Priority:** High
**Status:** Pending
**Description:** Integrate with Supabase to save guest orders.

## Requirements
1.  **Backend:** Handle "anonymous" orders (ensure RLS allows it or use a service role function if needed, but client-side RLS for `insert` with `auth.uid() = null` might be tricky without specific policies. *Strategy: Use a public RPC or specific RLS policy for 'anon' role on a new 'guest_orders' table if 'transactions' is strict.*)
    - *Simpler approach for MVP:* Allow inserts to `transactions` where `user_id` is nullable OR use a placeholder "Guest" user ID if we don't want to change schema too much.
    - *Better approach:* Create `guest_orders` table.
    - *Decision:* Let's use a `guest_info` JSONB column in `transactions` and allow nullable `user_id` for now, or create a `orders` table. Given the current `transactions` table is strict, let's create a new `orders` table or just mock it for now if we can't change DB schema.
    - *Assuming we can use `transactions`:* We will try to adapt `orderService`.

2.  **Service:** Update `orderService.ts` to support `createGuestOrder`.

## Implementation Steps
1.  Update `src/services/orderService.ts`:
    - Add `createGuestOrder(payload: OrderPayload)`.
    - Map payload to Supabase table structure.
2.  Integrate in `CheckoutPage`:
    - Call `createGuestOrder` on submit.
    - On success: Clear cart (`useCartStore.getState().clearCart()`), redirect to Success page.

## Todo List
- [ ] Update `orderService.ts`
- [ ] Integrate service call in `CheckoutPage`
- [ ] Implement success/error handling

## Verification
- Complete full checkout flow.
- Verify order appears in Admin Order Table (might need adjustment to show guest orders).
