# Phase 2: Types & Validation

## Context
- **Report:** `/Users/macbookprom1/Well/plans/reports/researcher-260130-1538-guest-checkout-patterns.md`

## Overview
**Priority:** High
**Status:** Pending
**Description:** Define TypeScript interfaces and Zod validation schemas for the guest checkout process.

## Requirements
1.  **Type Safety:** Strict types for guest profiles and order payloads.
2.  **Validation:** Robust form validation for guest details (email, phone, address).

## Architecture
- **Types:** `src/types/checkout.ts` (New file)
- **Schemas:** `src/utils/validation.ts` (Update or new `checkoutValidation.ts`)

## Implementation Steps
1.  Create `src/types/checkout.ts`:
    - Export `GuestProfile`, `OrderPayload`, `PaymentMethod`.
2.  Create `src/utils/validation/checkoutSchema.ts`:
    - Import `zod`.
    - Define `guestInfoSchema` with validation rules (VN phone regex, required fields).

## Todo List
- [ ] Create `src/types/checkout.ts`
- [ ] Create `src/utils/validation/checkoutSchema.ts`

## Verification
- N/A (Code only, verified in Phase 3)
