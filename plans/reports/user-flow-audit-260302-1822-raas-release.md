# User Flow Bug Audit — WellNexus RaaS Release
**Date:** 2026-03-02 | **Auditor:** debugger agent | **Scope:** Auth & profile user flows

---

## Executive Summary

7 bugs found across registration, login, profile, and auth-guard flows. 2 are CRITICAL (data loss / broken UX). No redirect-after-login implemented. Profile page has hardcoded data. Resend-email button is non-functional.

---

## Findings

### CRITICAL

**BUG-01 — Signup: Duplicate registration shows raw Supabase error to user**
- File: `src/hooks/useSignup.ts:66-71`
- Supabase returns `"User already registered"` when email exists. `onSubmit` catch block passes `err.message` directly to `form.setError('root', { message: err.message })` with no mapping.
- Impact: User sees raw English Supabase error string (e.g., `"User already registered"`) instead of a friendly i18n-translated message. Exposes internal details, breaks i18n.
- Fix: Map `err.message.includes('already registered')` → `t('errors.emailAlreadyExists')`.

**BUG-02 — Signup: Duplicate signup path — `useSignup` vs `useAuth.signUp` are disconnected**
- Files: `src/hooks/useSignup.ts:38-49` vs `src/hooks/useAuth.ts:135-172`
- `useSignup.onSubmit` calls `supabase.auth.signUp()` directly (line 38), bypassing `useAuth.signUp`. Meanwhile `useAuth.signUp` is a separate, more complete version that also inserts into the `users` table (line 152).
- Impact: CRITICAL — real users signing up via `SignupForm` do NOT get a row created in the `users` table. `fetchUserFromDB` (authSlice line 112) queries `users` table → returns no data → user object is empty after login. Dashboard will render with blank name, zero balances, empty referral link.
- Fix: `useSignup.onSubmit` must call `useAuth().signUp()` instead of calling `supabase.auth.signUp()` directly.

---

### HIGH

**BUG-03 — Login: No redirect-back to intended page**
- File: `src/hooks/useLogin.ts:38-48`
- After login, `navigateAfterLogin` always goes to `/dashboard` or `/admin`. No `location.state` or `?returnTo` param is read.
- Impact: User navigating to `/dashboard/wallet` while logged out → redirected to `/` → logs in → lands on `/dashboard` not `/dashboard/wallet`. Broken deep-link UX for all protected routes.
- Fix: Read `location.state?.from` or `searchParams.get('returnTo')` in `navigateAfterLogin`.

**BUG-04 — Reset password: Token validation is incorrect**
- File: `src/hooks/useResetPassword.ts:33-41`
- On mount, hook calls `supabase.auth.getSession()` and shows error if no session. But the Supabase reset-password flow sends a link with `token_hash` in URL; the user is NOT yet signed in when they land on `/reset-password`. A valid recovery link will always show "Invalid or expired reset link" immediately.
- Impact: Password reset is effectively broken for real users on first page load. The error string is also hardcoded English (line 37), not i18n.
- Fix: Check for `?token_hash` & `type=recovery` in URL and call `supabase.auth.verifyOtp()` first, like `use-confirm-email-verification-flow.ts` does. Only show error if OTP verification fails.

**BUG-05 — Signup: Resend email button is dead**
- File: `src/components/auth/SignupForm.tsx:44-45`
- Button renders `{t('auth.register.resendEmail')}` with no `onClick` handler. Clicking it does nothing.
- Impact: Users who don't receive confirmation email have no self-service recovery path. Must contact support.
- Fix: Add `onClick` calling `supabase.auth.resend({ type: 'signup', email })`.

---

### MEDIUM

**BUG-06 — Profile page: Joined date is always today's date**
- File: `src/pages/ProfilePage.tsx:43`
- `new Date().toLocaleDateString()` is used instead of `user.joinedAt`.
- Impact: Every user sees today's date as their "joined" date. Wrong data displayed.
- Fix: Replace with `new Date(user.joinedAt).toLocaleDateString()`.

**BUG-07 — Profile page: Phone, DOB, address are hardcoded mock data**
- File: `src/pages/ProfilePage.tsx:93, 101, 110`
- `+84 90 123 4567`, `01/01/1990`, `123 Nguyen Hue Street...` are hardcoded strings in JSX.
- Impact: Every user sees the same fake contact info. Data not loaded from `user` object or DB.
- Fix: Either fetch phone/dob/address from `users` table and map to User type, or hide these fields until data is available.

---

### LOW

**BUG-08 — Auth guard: Protected dashboard redirects to `/` not `/login`**
- File: `src/App.tsx:98-103`
- Unauthenticated user visiting `/dashboard/*` is redirected to `/` (landing page), not `/login`. This is intentional per comment but loses the returnTo context entirely.
- Impact: User can't understand they need to log in; landing page has no auth prompt. Minor UX friction.
- Fix (optional): Redirect to `/login?returnTo=/dashboard` instead of `/`.

**BUG-09 — Login error: `flex-shrink0` CSS typo**
- File: `src/pages/Login.tsx:89`
- `flex-shrink0` should be `flex-shrink-0` (missing hyphen). The icon in the error alert will not be properly constrained in narrow viewports.
- Impact: Minor visual glitch on error state.

---

## Summary Table

| ID | Severity | Flow | File | Description |
|----|----------|------|------|-------------|
| BUG-01 | CRITICAL | Signup | useSignup.ts:66 | Raw Supabase error exposed |
| BUG-02 | CRITICAL | Signup | useSignup.ts:38 | users table row never created |
| BUG-03 | HIGH | Login | useLogin.ts:38 | No redirect-back to intended page |
| BUG-04 | HIGH | Reset PW | useResetPassword.ts:33 | Token check logic breaks reset flow |
| BUG-05 | HIGH | Signup | SignupForm.tsx:44 | Resend email button non-functional |
| BUG-06 | MEDIUM | Profile | ProfilePage.tsx:43 | Joined date always shows today |
| BUG-07 | MEDIUM | Profile | ProfilePage.tsx:93 | Hardcoded mock contact data |
| BUG-08 | LOW | Auth Guard | App.tsx:103 | Redirect to `/` loses returnTo |
| BUG-09 | LOW | Login | Login.tsx:89 | CSS typo `flex-shrink0` |

---

## Unresolved Questions

1. Does `users` table have `phone`, `date_of_birth`, `address` columns? If not, BUG-07 needs schema migration before fix.
2. Is `useAuth.signUp` intentionally separated from `useSignup`? If so, which is canonical for production?
3. `VITE_ADMIN_EMAILS` env var — is it set in production Vercel? If empty, admin route is completely inaccessible.
