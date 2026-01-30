# Phase 2: Quick Purchase Modal

## Context
- **Parent Plan:** [Commission Widget & Quick Purchase Modal](./plan.md)
- **Docs:** `src/types.ts`, `docs/design-system/components-reference.md`

## Overview
- **Date:** 2026-01-30
- **Description:** Implement a streamlined modal for rapid re-ordering and purchasing favorite items, bypassing the full browsing experience.
- **Priority:** P1
- **Status:** Completed

## Key Insights
- **Speed:** Distributors often buy the same core products (samples, bestsellers).
- **Friction:** Reducing clicks to checkout increases conversion for self-consumption and direct sales.

## Requirements

### Functional
1.  **Tabs:** "Recent Purchases" (from transaction history) and "Favorites" (user saved).
2.  **Product Card (Mini):** Image, Name, Price, Quick Add button.
3.  **Express Checkout:** "Buy Now" button that adds to cart and proceeds immediately.
4.  **Commission Preview:** Show potential earning for the selection.
5.  **Persistence:** Save "Favorites" to `localStorage`.

### Non-Functional
- **UX:** Modal must open/close instantly with `AnimatePresence`.
- **State:** Sync with global `cart` state.

## Architecture

### Component Structure
`src/components/marketplace/QuickPurchaseModal.tsx`

### Data Flow
1.  **Input:** `isOpen` prop, `onClose` handler.
2.  **Data:** Access `products` and `transactions` from `useStore`.
3.  **Derivation:**
    - *Recent:* Filter unique product IDs from recent transactions.
    - *Favorites:* Read from `localStorage` (list of IDs).
4.  **Action:** `addToCart` store action.

## Related Code Files
- **Create:** `src/components/marketplace/QuickPurchaseModal.tsx`
- **Modify:** `src/types.ts` (if new props/types needed, likely existing ones suffice)

## Implementation Steps

1.  **Define Props & State:**
    - `isOpen`, `onClose`.
    - Local state for active tab ('recent' | 'favorites').
    - Local state for favorites list.

2.  **Implement Logic:**
    - `getRecentProducts()`: Map `transactions` -> find matching `product` objects.
    - `toggleFavorite(id)`: Update state and `localStorage`.

3.  **Build UI:**
    - Modal Overlay (Glassmorphism).
    - Tab Switcher (Pill style).
    - Grid Layout (2 columns mobile, 3 desktop).
    - Footer with Total & Checkout button.

4.  **Integrate Cart Logic:**
    - "Add" button calls `addToCart(product, 1)`.
    - "Buy Now" calls `addToCart` then redirects to checkout/wallet.

5.  **Animation:**
    - Slide-up or Scale-in effect using Framer Motion.

## Todo List
- [ ] Create `QuickPurchaseModal.tsx` structure
- [ ] Implement "Recent Purchases" derivation logic
- [ ] Implement "Favorites" persistence (localStorage)
- [ ] Build Mini Product Card UI
- [ ] Implement "Express Checkout" handler

## Success Criteria
- [ ] Modal opens/closes smoothly.
- [ ] Recent purchases populate correctly based on history.
- [ ] Favorites persist after refresh.
- [ ] "Buy Now" correctly updates cart and navigation.

## Risk Assessment
- **Risk:** Product ID mismatch if products are removed from catalog but remain in history.
- **Mitigation:** Filter `getRecentProducts` against current `products` catalog to ensure validity.

## Security Considerations
- Validate product prices server-side (or store-side) before checkout to prevent tampering (standard practice, though frontend-focused here).
