# Phase 3: Checkout UI Components

## Context
- **Report:** `/Users/macbookprom1/Well/plans/reports/researcher-260130-1538-guest-checkout-patterns.md`

## Overview
**Priority:** Medium
**Status:** Pending
**Description:** Build the visual components for the checkout flow.

## Requirements
1.  **Guest Form:** Form for name, email, phone, address.
2.  **Cart Summary:** Read-only view of cart items + total.
3.  **Routing:** Dedicated `/checkout` route.

## Architecture
- **Page:** `src/pages/Checkout/CheckoutPage.tsx`
- **Components:**
    - `src/components/checkout/GuestForm.tsx`
    - `src/components/checkout/CartSummary.tsx`
    - `src/components/checkout/OrderSuccess.tsx`

## Implementation Steps
1.  Install dependencies: `npm install react-hook-form @hookform/resolvers zod`.
2.  Create `GuestForm.tsx`:
    - Use `useForm` with `zodResolver`.
    - Bind to `guestInfoSchema`.
3.  Create `CheckoutPage.tsx`:
    - Layout with `CartSummary` on right/top and `GuestForm` on left/bottom.
    - Handle form submission -> Call `orderService` (Phase 4).
4.  Update `App.tsx` routes.

## Todo List
- [ ] Install deps
- [ ] Create `GuestForm.tsx`
- [ ] Create `CartSummary.tsx`
- [ ] Create `CheckoutPage.tsx`
- [ ] Add route to `App.tsx`

## Verification
- Navigate to `/checkout`.
- Fill form with invalid data -> See errors.
- Fill with valid data -> Submit triggers log.
