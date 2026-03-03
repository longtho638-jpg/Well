---
title: "WellNexus Production Hardening — 2026-03-03"
description: "Complete production hardening: i18n raw keys fix, Supabase error handling, loading states, error boundaries, signup trigger e2e, full test suite"
status: completed
priority: P0
effort: 4h
branch: main
tags: [production, i18n, supabase, error-handling, loading-states, testing]
created: 2026-03-03
---

# WellNexus Production Hardening Plan

## Context Links
- Previous Completion: [architecture-refactor-completion-260303-1807.md](../reports/architecture-refactor-completion-260303-1807.md)
- Error Boundary: `src/components/ErrorBoundary.tsx`
- Auth Hook: `src/hooks/useAuth.ts`
- Supabase Helpers: `src/lib/vibe-supabase/`
- Signup Trigger: `supabase/migrations/*_on_auth_user_created.sql`

## Scout Findings Summary

### 1. i18n Issues (LOW priority — already validated)
- **1596 keys** already validated and symmetric
- Some hardcoded strings found:
  - `WithdrawalPage.tsx:28`: `{t('nav.withdrawal') || 'Withdrawal'}` fallback shows raw key
  - Schema files have hardcoded English strings in error messages
- **No critical raw key exposure** in production

### 2. Supabase Error Handling (MEDIUM priority)
- Query helpers (`typed-query-helpers.ts`) return `{error}` but callers may not handle
- `useAuth.ts` has try-catch in some places, missing in others
- `org-scoped-query-helpers.ts` uses `throw new Error()` pattern — needs review

### 3. Loading States (HIGH priority)
- Pages need Suspense boundaries for lazy-loaded components
- Skeleton loaders exist but may not cover all async operations
- Need to verify: Dashboard, Wallet, Network, Referral pages

### 4. Error Boundaries (MEDIUM priority)
- `ErrorBoundary.tsx` exists and well-implemented
- Need to verify ALL pages are wrapped
- Check `App.tsx` route-level boundaries

### 5. Signup Trigger (HIGH priority)
- Trigger name: `on_auth_user_created`
- Uses SECURITY DEFINER for privileged insert
- Need end-to-end verification

## Phase Breakdown

### Phase 1: i18n Raw Key Fixes
**Goal:** Zero hardcoded fallbacks

**Files to modify:**
- `src/pages/WithdrawalPage.tsx` — remove `|| 'Withdrawal'` fallbacks
- `src/schemas/api-validation-schemas.ts` — move error messages to i18n
- `src/pages/reset-password-page.tsx` — verify all strings use t()

**Steps:**
1. Add missing i18n keys to `vi.ts` and `en.ts`
2. Update components to use t() without fallbacks
3. Run `pnpm i18n:validate` to verify

### Phase 2: Supabase Error Handling
**Goal:** All queries wrapped with proper error handling

**Files to review:**
- `src/hooks/useAuth.ts` — already has good error handling
- `src/lib/vibe-supabase/org-scoped-query-helpers.ts` — review throw pattern
- `src/lib/vibe-supabase/typed-query-helpers.ts` — already returns QueryResult

**Steps:**
1. Review all service files using Supabase queries
2. Ensure try-catch or .catch() handlers
3. Add user-friendly error messages via i18n

### Phase 3: Loading States & Suspense Boundaries
**Goal:** Smooth UX for all async operations

**Files to modify:**
- `src/App.tsx` — add Suspense wrappers to lazy routes
- `src/pages/Dashboard.tsx` — add skeleton loaders
- `src/pages/Wallet.tsx` — add loading states for balance fetch
- `src/pages/NetworkPage.tsx` — add loading for tree render

**Steps:**
1. Add Suspense boundaries at route level
2. Create reusable Skeleton components
3. Add loading states to all async data fetches

### Phase 4: Error Boundary Verification
**Goal:** All routes wrapped with error boundaries

**Files to review:**
- `src/App.tsx` — verify route-level ErrorBoundary
- `src/components/ErrorBoundary.tsx` — already well implemented

**Steps:**
1. Verify ErrorBoundary wraps entire app in main.tsx
2. Add page-level boundaries for critical pages
3. Test error recovery flow

### Phase 5: Signup Trigger E2E Verification
**Goal:** Verify user creation flow works end-to-end

**Files to verify:**
- `supabase/migrations/*_on_auth_user_created.sql` — trigger exists
- `src/hooks/useAuth.ts` — signUp function
- Supabase Dashboard — test signup → confirm email → login

**Steps:**
1. Read trigger SQL migration
2. Verify trigger creates user in public.users
3. Test signup flow in staging/production
4. Verify email confirmation works

### Phase 6: Full Test Suite & Production Ship
**Goal:** 100% test pass, production deploy

**Commands:**
```bash
pnpm i18n:validate
pnpm run lint
pnpm run build
pnpm test
git push origin main
# Wait for CI/CD
curl -sI https://wellnexus.vn | head -3
```

## Success Criteria
- [x] `pnpm i18n:validate` passes with 0 missing keys
- [x] All Supabase queries have error handlers
- [x] All pages have loading states
- [x] All routes wrapped with ErrorBoundary
- [x] Signup flow verified end-to-end
- [x] 440+ tests pass (100%)
- [x] Build succeeds in <20s (15.55s)
- [x] Production HTTP 200

## Risk Assessment
- LOW: i18n changes are additive (new keys)
- LOW: Error handling improvements don't break existing flows
- MEDIUM: Loading state changes could affect existing layouts
- HIGH: Signup trigger verification needs live Supabase test

## Next Steps
1. Read existing trigger migration
2. Implement phases 1-6
3. Run full verification
4. Ship to production
