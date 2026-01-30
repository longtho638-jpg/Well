# Guest Checkout Implementation Best Practices

**Date:** 2026-01-30
**Status:** Complete
**Context:** Transforming WellNexus into an open e-commerce platform with guest checkout capabilities.

## 1. Executive Summary
Guest checkout is a critical feature for conversion optimization. Studies consistently show that forcing account creation causes 30-45% of cart abandonment. The goal is to minimize friction while preserving the ability to capture user data for future engagement (account conversion).

## 2. UX & Flow Best Practices
**Principle:** "Checkout first, register later."

### Optimal Flow
1.  **Cart Review**: Clear total, editable quantities.
2.  **Identity Step**: Ask for Email *only* first.
    *   *Check*: If email exists → Prompt password (optional, "Continue as Guest" must remain visible).
    *   *New*: Continue to shipping.
3.  **Shipping**:
    *   Use address autocomplete (Google Places/Mapbox).
    *   "Billing same as shipping" checked by default.
4.  **Payment**:
    *   Offer digital wallets (Apple Pay/Google Pay) for 1-click experience.
5.  **Confirmation**:
    *   **The "Magic Moment"**: "Save my information for next time" (Password field) to create account *after* payment success.

## 3. Technical Implementation

### A. Cart Persistence Strategy
**Recommendation: `localStorage` with ID generation.**

*   **Guest ID**: Generate a UUID (`guest_cart_id`) on first cart action. Store in `localStorage`.
*   **Storage**: Store cart items in `localStorage`.
*   **Merge Strategy**: If user logs in, merge `localStorage` cart with server-side DB cart.
*   **Why**: `sessionStorage` dies on tab close. Cookies are size-limited. `localStorage` persists across sessions.

### B. Data Structure
Current `Transaction` table relies on `userId`. We must adapt it for guests.

**Proposed Schema Updates (Supabase):**
1.  **Modify `transactions` table**:
    *   Make `user_id` nullable.
    *   Add `guest_email` (string).
    *   Add `shipping_info` (JSONB) - stores address, name, phone.
    *   Add `billing_info` (JSONB).

**TypeScript Interface Pattern:**

```typescript
// src/types/checkout.ts

export interface GuestInfo {
  email: string;
  firstName: string;
  lastName: string;
  phone: string; // Crucial for delivery in VN
}

export interface ShippingAddress {
  addressLine1: string;
  ward: string;
  district: string;
  city: string; // Tỉnh/Thành phố
  note?: string;
}

export interface CheckoutPayload {
  items: CartItem[];
  guest?: GuestInfo; // Present if !isAuthenticated
  shipping: ShippingAddress;
  paymentMethod: 'cod' | 'banking' | 'vnpay';
}
```

### C. Zustand Store Pattern (Cart)

```typescript
interface CartState {
  items: CartItem[];
  guestId: string | null;
  addItem: (product: Product, qty: number) => void;
  syncToStorage: () => void;
}

// Middleware to persist to localStorage
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      guestId: null,
      addItem: (product, qty) => {
        // Logic...
      },
      syncToStorage: () => {
        // Debounced sync to server if needed, or just rely on persist
      }
    }),
    {
      name: 'well-cart-storage', // unique name
      storage: createJSONStorage(() => localStorage),
    }
  )
)
```

## 4. Payment Flow UI Patterns
*   **Accordion Style**: Sections (Info, Shipping, Payment) collapse as completed. Keeps context without scrolling.
*   **Sticky Summary**: Order summary (items + total) sticky on the right (desktop) or bottom sheet (mobile).
*   **Trust Signals**: Badges (SSL, Visa/Mastercard logos) near the "Pay" button.

## 5. Post-Checkout Strategy (Conversion)
The confirmation page is the highest conversion opportunity for account creation.

*   **Action**: "Create an account to track your order."
*   **Mechanism**: Since we have Name + Email + Address, we only need a **Password**.
*   **Incentive**: "Get 50 SHOP points for your next purchase."

## 6. Unresolved Questions / Risks
1.  **Rate Limiting**: Guest checkout APIs are prone to card testing attacks. Need robust CAPTCHA or rate limiting (Cloudflare) on the payment endpoint.
2.  **Order Tracking**: How do guests check status?
    *   *Solution*: Send a unique, hashed link in email (`/track-order?token=xyz`).
3.  **Inventory Reservation**: When to reserve stock?
    *   *Best Practice*: Reserve on payment success, not on "add to cart" (prevents denial of service).

## 7. Action Items
1.  Update Supabase `transactions` schema (allow null `user_id`, add `guest_info` JSONB).
2.  Implement `useCartStore` with persistence.
3.  Build `GuestCheckoutForm` component with React Hook Form + Zod validation.
4.  Create "Order Tracking" public page for guests.
