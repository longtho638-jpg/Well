# Research Report: React + TypeScript Guest Checkout Implementation

## 1. Overview
This report outlines the architectural patterns for implementing Guest Checkout in the WellNexus Distributor Portal. The goal is to allow non-authenticated users to browse products, add them to a cart, and complete a purchase without creating an account first.

## 2. Cart Management (React Hooks & Storage)

### Current State
Currently, `useMarketplace` manages the cart in local `useState`. This is volatile and is lost on refresh.

### Recommendation: Persisted Zustand Slice
Move cart logic to a dedicated `cartSlice` in the global store, using Zustand's `persist` middleware. This ensures the cart is saved to `localStorage` automatically.

**Pattern:**
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface CartState {
  items: CartItem[];
  addItem: (product: Product, qty: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product, qty) => set((state) => {
         // Logic to merge duplicates
         const existing = state.items.find(i => i.product.id === product.id);
         if (existing) {
             return {
                 items: state.items.map(i =>
                     i.product.id === product.id
                         ? { ...i, quantity: i.quantity + qty }
                         : i
                 )
             };
         }
         return { items: [...state.items, { product, quantity: qty }] };
      }),
      removeItem: (id) => set((state) => ({
        items: state.items.filter((i) => i.product.id !== id),
      })),
      updateQuantity: (id, qty) => set((state) => ({
        items: state.items.map(i => i.product.id === id ? { ...i, quantity: qty } : i)
      })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'well-cart-storage', // unique name in localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

## 3. TypeScript Types

We need specific types for the Guest Checkout flow to ensure type safety without requiring a full `User` object.

```typescript
// types/checkout.ts

export interface GuestProfile {
  fullName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    ward: string;
    district: string;
    city: string;
  };
  note?: string;
}

export interface OrderPayload {
  items: {
    productId: string;
    quantity: number;
    price: number;
  }[];
  customer: {
    userId?: string; // Optional: if logged in
    guestProfile?: GuestProfile; // Optional: if guest
  };
  paymentMethod: 'cod' | 'banking';
  totalAmount: number;
}
```

## 4. Form Validation Patterns

**Recommendation:** **React Hook Form** + **Zod**.
- **Performance:** RHF minimizes re-renders compared to Formik.
- **Type Safety:** Zod infers TypeScript types directly from the validation schema.

**Example:**
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const guestSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, "Invalid VN phone number"),
  address: z.object({
    street: z.string().min(5),
    city: z.string().min(2),
    // ...
  })
});

type GuestFormValues = z.infer<typeof guestSchema>;

export const GuestCheckoutForm = ({ onSubmit }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<GuestFormValues>({
    resolver: zodResolver(guestSchema)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("fullName")} />
      {errors.fullName && <span>{errors.fullName.message}</span>}
      {/* ... */}
    </form>
  );
};
```

## 5. Zustand Store for Guest State

The `cartSlice` should handle the *items*, but a temporary `checkoutSlice` can manage the *checkout wizard state* if it's a multi-step process.

```typescript
interface CheckoutState {
  step: 'cart' | 'info' | 'payment' | 'confirmation';
  guestProfile: GuestProfile | null;
  setStep: (step: CheckoutState['step']) => void;
  setGuestProfile: (profile: GuestProfile) => void;
}
```

## 6. React Router Patterns

The checkout flow should be a distinct route, accessible to public.

```tsx
// App.tsx
<Routes>
  {/* Public Routes */}
  <Route path="/marketplace" element={<Marketplace />} />
  <Route path="/checkout" element={<CheckoutLayout />}>
    <Route index element={<CartSummary />} />
    <Route path="guest" element={<GuestInfoForm />} />
    <Route path="payment" element={<PaymentSelection />} />
    <Route path="success" element={<OrderSuccess />} />
  </Route>

  {/* Protected Routes */}
  <Route element={<ProtectedRoute />}>
     <Route path="/dashboard" element={<Dashboard />} />
  </Route>
</Routes>
```

## 7. Error Handling

For failed orders, especially with Supabase:
1.  **Optimistic UI:** Don't clear the cart until the order is *confirmed* successful.
2.  **Transactions:** If using a payment gateway, ensure the database order is created with status `pending` *before* redirecting to payment.
3.  **Supabase RLS:** Ensure RLS policies allow `INSERT` to `orders` table for anonymous users (or use a server-side Edge Function if strict security is needed).

## 8. Unresolved Questions
1.  **Supabase Security**: Does the current `transactions` table allow public inserts? We likely need a separate `guest_orders` table or a secure Edge Function to prevent spam/abuse.
2.  **Inventory Locking**: Do we reserve stock when added to cart or only upon payment? (Standard e-commerce: usually only check stock at checkout).

