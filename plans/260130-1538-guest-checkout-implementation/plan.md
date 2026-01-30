# Guest Checkout Implementation Plan

## Overview
This plan outlines the implementation of a Guest Checkout system for the WellNexus Distributor Portal. This allows non-logged-in users to browse products, add them to a cart, and complete purchases.

## Phases

### Phase 1: Persistent Cart Store
**Status:** Pending
- Implement `useCartStore` with Zustand
- Persist cart to `localStorage`
- migrate existing `useMarketplace` cart logic

### Phase 2: Types & Validation
**Status:** Pending
- Define `GuestProfile`, `OrderPayload` types
- Create Zod schemas for guest checkout form

### Phase 3: Checkout UI Components
**Status:** Pending
- Create `CartSummary` component
- Create `GuestCheckoutForm` with React Hook Form
- Create `OrderSuccess` page
- Update `App.tsx` with checkout routes

### Phase 4: Order Processing & Integration
**Status:** Pending
- Update `orderService` to handle guest orders
- Implement Supabase integration for anonymous orders
- Add error handling and loading states

## Dependencies
- `zustand` (already installed)
- `react-hook-form`
- `@hookform/resolvers`
- `zod`
