# WellNexus Architecture Audit Report
Date: 260212
Author: Antigravity Researcher

## 1. Dependency Health (✅ Actioned)
- **Status**: Cleaned up.
- **Actions Taken**:
  - Removed `@payos/node` (Unused artifact).
  - Moved `dotenv` to `devDependencies`.
- **Verification**: Build and tests passed successfully.

## 2. Directory Structure Analysis

### Current Structure
```
src/
├── components/     # Mixed: Feature components (Marketplace/) & UI atoms (Input.tsx)
├── services/       # Good: Supabase logic isolated here
├── hooks/          # Mixed: Business logic (useProducts) & UI logic (useTheme)
├── store/          # Zustand slices (Auth, Wallet, etc.) - Well structured
├── pages/          # Route views - Clean
```

### ⚠️ Structural Issues
1.  **Flat Component Hierarchy**: `src/components` contains both reusable UI atoms (e.g., `Input.tsx`, `Toast.tsx`) and complex feature domains (`Marketplace/`, `Dashboard/`).
    -   *Recommendation*: Move reusable UI to `src/components/ui/` (shadcn-like) and features to `src/features/` or keep in `src/components/[Feature]`.
2.  **Hook Pollution**: `src/hooks` is a dumping ground for everything from data fetching (`useProducts`) to form handling (`useForm`).
    -   *Recommendation*: Split into `src/hooks/api/` (data fetching) and `src/hooks/ui/` (interaction).

## 3. Architecture & Code Patterns

### 🔴 Critical Findings

#### 1. Data Fetching Strategy (Legacy Pattern)
-   **Pattern**: `useEffect` + `useState` + Service Layer.
-   **Evidence**: `src/hooks/useProducts.ts` manually manages `loading` and `error` states.
-   **Problem**:
    -   No caching (re-fetches on every mount).
    -   No request deduplication.
    -   No "stale-while-revalidate".
    -   Manual race condition handling (mostly missing).
-   **Recommendation**: **Migrate to TanStack Query (React Query)**. This is the single biggest upgrade for code quality and user experience.

#### 2. Service Layer
-   **Status**: Healthy.
-   **Pattern**: `productService` wraps Supabase calls.
-   **Verdict**: Good abstraction. Keep this, but call it from React Query query functions instead of `useEffect`.

#### 3. State Management (Zustand)
-   **Status**: Healthy.
-   **Pattern**: Slices (`authSlice`, `walletSlice`) combined in `store/index.ts`.
-   **Verdict**: Excellent choice. Much simpler than Redux, more capable than Context.

#### 4. I18n
-   **Status**: Strong.
-   **Pattern**: `react-i18next` with strict validation scripts (`scripts/validate-i18n-keys.mjs`).
-   **Verdict**: Keep enforcing Rule #1 (I18n Sync).

## 4. Strategic Recommendations

### Phase 1: Hygiene (Completed)
- [x] Clean `package.json`.

### Phase 2: Refactoring (High Impact)
1.  **Adopt TanStack Query**: Replace `useProducts`, `useOrders`, etc.
    -   *Why*: Eliminates 30-50% of boilerplate code in hooks. Fixes caching/loading issues instantly.
2.  **Strict Component Organization**:
    -   Move atoms to `src/components/ui`.
    -   Group feature components strictly.

### Phase 3: Performance
-   **Code Splitting**: `React.lazy` is already used in `App.tsx`. Good.
-   **Bundle Size**: Monitor `dist/` output. `pdf-ZB7Zqdx2.js` is huge (1.5MB).
    -   *Action*: Ensure PDF generation libraries are lazy-loaded only when needed (e.g., generating a receipt).

## 5. Summary
The codebase is in decent shape ("Solid MVP"). It uses modern tools (Zustand, Vite, Supabase). The main technical debt is the **data fetching strategy**. Upgrading to React Query will transition this from "MVP" to "Production Grade".

