# Research Report: Modern Admin Dashboard Architecture (2026)

**Date:** 2026-01-30
**Subject:** Admin Dashboard Architecture for "Well" Distributor Portal
**Focus:** React/Zustand/Aura Elite Integration

## 1. Modern Admin Frameworks: The "Headless" Shift

For 2026, the trend has shifted decisively towards **headless** architecture, separating logic (data fetching, auth, state) from UI. This is critical for the "Aura Elite" design system, as traditional "all-in-one" frameworks (like older React Admin with MUI) are too rigid to style effectively.

| Framework | Type | Pros | Cons | Verdict for "Well" |
| :--- | :--- | :--- | :--- | :--- |
| **Refine** | Headless | Agnostic UI (perfect for Aura), extensive hooks for CRUD/Auth, excellent devtooling. | Learning curve for its "resource" concept. | **Recommended**. Best fit for custom UI + complex logic. |
| **React Admin** | UI-First | Rapid prototyping, huge plugin ecosystem. | Hard to strip out MUI/Ra dependencies for custom glassmorphism. | Too opinionated for Aura Elite. |
| **AdminJS** | Backend-First | Auto-generates from DB, very fast setup. | Harder to embed deeply into a custom React frontend flow. | Better for internal-only tools, not client-facing portals. |

**Recommendation:** Use **Refine (Headless Core)** or a **Custom "DIY" Architecture** using `TanStack Query` + `Zustand`. Given the existing codebase structure (`src/pages/Admin`), a **Custom DIY** approach likely integrates faster without rewriting existing logic, while borrowing "Refine-like" patterns for hooks.

## 2. Data Grid Solutions

| Library | Key Features | Suitability |
| :--- | :--- | :--- |
| **TanStack Table (v8)** | 100% Headless, lightweight, framework agnostic. | **Perfect**. Allows full control over `<tr>`/`<td>` rendering for glass/gradient effects. |
| **AG Grid** | Enterprise features (pivoting, Excel export), virtualization. | **Overkill**. Default styles are hard to override for "Aura". |
| **Mantine / Chakra** | Component-library based. | Good, but locks you into their design system. |

**Recommendation:** **TanStack Table**. It provides the *logic* (sorting, filtering, pagination) but leaves the *rendering* to us, ensuring the table looks exactly like the rest of the Aura Elite design.

## 3. Visualization & Analytics

| Library | Rendering | Aura Elite Fit |
| :--- | :--- | :--- |
| **Recharts** | SVG | **High**. easy to apply SVG gradients/filters for "glowing" lines. |
| **Victory** | SVG | High. Very flexible but slightly steeper learning curve. |
| **Chart.js** | Canvas | Medium. Canvas is harder to style with CSS effects (blur/glass). |

**Recommendation:** **Recharts**. It uses React components directly, making it trivial to add custom tooltips, glowing gradients, and responsive behavior that matches the dark theme.

## 4. CRUD & Architecture Patterns

### Service Layer (The "Bridge")
Decouple API calls from UI.
```typescript
// services/productService.ts
export const ProductService = {
  list: (params: QueryParams) => api.get('/products', params),
  create: (data: CreateProductDto) => api.post('/products', data),
  // ...
};
```

### State Management (Zustand)
Use Zustand for **Global Admin State** (Sidebar state, current user permissions, toast notifications), but use **TanStack Query** (React Query) for **Server State** (Data lists, caching).

### CRUD Hook Pattern
Create reusable hooks to standardize UI states (loading, error, success):
```typescript
const { data, isLoading } = useResourceList('products', filters);
const { mutate: save } = useResourceCreate('products');
```

## 5. Permission & Security (RBAC)

**Pattern:** `Casl` or simple `Role-Based` logic with Zustand.

1.  **Store**: `useAuthStore` holds `user.role` (e.g., 'founder', 'admin', 'support').
2.  **Route Guard**: `<AdminRoute allowedRoles={['founder']} />`.
3.  **Component Guard**:
    ```tsx
    <Can I="delete" a="Product">
      <DeleteButton />
    </Can>
    ```

## 6. Unresolved Questions
1.  Does the current backend support granular permissions (e.g., "can_edit_commission") or just roles?
2.  Are there specific performance requirements for the "Live Activities" ticker?

## 7. Sources
- [Refine Documentation](https://refine.dev/)
- [TanStack Table](https://tanstack.com/table/v8)
- [Recharts](https://recharts.org/)
- [React Admin vs Refine](https://refine.dev/blog/react-admin-vs-refine/)
