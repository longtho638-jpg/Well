# Phase 1: Persistent Cart Store

## Context
- **Report:** `/Users/macbookprom1/Well/plans/reports/researcher-260130-1538-guest-checkout-patterns.md`
- **Current File:** `/Users/macbookprom1/Well/src/hooks/useMarketplace.ts` (contains current volatile cart logic)

## Overview
**Priority:** High
**Status:** Pending
**Description:** Create a robust, persistent cart store using Zustand to replace the temporary state in `useMarketplace`.

## Requirements
1.  **Persistence:** Cart items must survive page reloads (`localStorage`).
2.  **State Management:** Add, remove, update quantity, clear cart.
3.  **Migration:** Update `useMarketplace` to use this new store instead of local state.

## Architecture
- **Store:** `src/store/slices/cartSlice.ts` (New file)
- **Middleware:** Zustand `persist`

## Implementation Steps
1.  Create `src/store/slices/cartSlice.ts`:
    - Define `CartItem` interface (reuse or import from types).
    - Implement `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`.
    - Use `persist` middleware.
2.  Update `src/store/index.ts`:
    - Add `cartSlice` to the main store or keep it separate (separate is often cleaner for persistence to avoid persisting auth state accidentally, but main store is fine if configured correctly. *Decision: Keep it separate as `useCartStore` for cleaner separation of concerns and specific persistence settings*).
3.  Refactor `useMarketplace.ts`:
    - Remove local `cart` state.
    - Import and expose methods from `useCartStore`.

## Todo List
- [ ] Create `src/store/slices/cartSlice.ts`
- [ ] Export `useCartStore`
- [ ] Refactor `useMarketplace.ts` to use `useCartStore`
- [ ] Verify persistence works on reload

## Verification
- Add item to cart -> Reload page -> Item should still be there.
