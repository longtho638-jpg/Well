# Phase 2: Authentication & Routing

**Context Links:** [Plan Overview](./plan.md) | [Architecture Report](../reports/researcher-260130-1129-admin-dashboard-architecture.md)

## Overview
**Date:** 2026-01-30 | **Priority:** P1 | **Status:** Pending

Implement the security layer. Since this is a standalone app, it must share authentication context with the main Well platform (Supabase Auth) but enforce strict Role-Based Access Control (RBAC) to ensure only 'founder' roles can access it.

## Key Insights
- **Shared Auth:** Users might already be logged in to the main app. Need to ensure session persistence or easy re-login.
- **RBAC:** Strictly check `user.role === 'founder'`.
- **Zustand Store:** Use Zustand to hold the `user` and `session` state globally.

## Requirements
- Integrate Supabase Auth.
- Create `useAuthStore` using Zustand.
- Implement `ProtectedRoute` component.
- Implement `RoleGuard` component.
- Create Login Page (if session not found).
- Configure React Router with protected paths.

## Architecture
- **Auth Flow:**
  1.  App Init -> Check Supabase Session.
  2.  If Session -> Fetch User Profile (Role).
  3.  If Role == 'founder' -> Allow Access.
  4.  Else -> Redirect to Forbidden/Login.
- **Router Structure:**
  ```tsx
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<ProtectedRoute allowedRoles={['founder']} />}>
      <Route element={<AdminLayout />}>
        <Route path="/" element={<Dashboard />} />
        {/* ... other routes */}
      </Route>
    </Route>
  </Routes>
  ```

## Implementation Steps
1.  **Supabase Client:** Initialize Supabase client in `src/lib/supabase.ts`.
2.  **Auth Store:** Create `src/stores/authStore.ts` with methods `setSession`, `setUser`, `logout`.
3.  **Login Page:** Create `src/pages/auth/LoginPage.tsx` with Aura design.
4.  **Protected Route:** Create `src/components/auth/ProtectedRoute.tsx` to check session.
5.  **Role Guard:** Add logic to verify `user_metadata.role` or `profiles.role`.
6.  **Router Setup:** Configure `react-router-dom` in `App.tsx`.

## Todo List
- [x] Setup Supabase client
- [x] Create `authStore`
- [x] Build `LoginPage` UI
- [x] Implement `ProtectedRoute`
- [x] Implement role verification logic
- [x] Configure Application Routes

## Success Criteria
- [x] Non-authenticated users redirected to Login.
- [x] Non-founder users denied access (even if logged in).
- [x] Founders can log in and see the Dashboard.

## Risk Assessment
- **Risk:** Role field location differs in production (metadata vs table).
- **Mitigation:** Check both `auth.users.user_metadata` and `public.profiles` table.

## Next Steps
- Proceed to Phase 3 (Data Services).
