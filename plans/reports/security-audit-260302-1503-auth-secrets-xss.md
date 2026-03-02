# Security Audit: Auth, Secrets & XSS
**Date:** 2026-03-02 | **Scope:** `src/hooks/useAuth.ts`, `src/utils/secure-token-storage.ts`, `src/utils/secure-token-xor-obfuscation-helpers.ts`, `src/utils/security-*.ts`, `src/components/AdminRoute.tsx`, `src/utils/admin-check.ts`

---

## CRITICAL

### [C1] Mock Session Bypass Works in Production
**File:** `src/hooks/useAuth.ts:47–59`
**Issue:** `wellnexus_mock_session=true` in localStorage bypasses all Supabase auth — no DEV gate. Any user can set this flag in browser DevTools on production and gain full authenticated access as an admin (`MOCK_USER.isAdmin: true`, `role: 'admin'`).
```ts
// Line 47-59 — no DEV guard
const hasMockSession = localStorage.getItem('wellnexus_mock_session') === 'true';
if (hasMockSession) {
  setUser({ ...MOCK_USER, ... }); // MOCK_USER has role:'admin', isAdmin:true
  setIsAuthenticated(true);
  return; // Skips Supabase entirely
}
```
**Fix:**
```ts
const hasMockSession = import.meta.env.DEV && localStorage.getItem('wellnexus_mock_session') === 'true';
```

### [C2] DEV-Only Login Branch Missing DEV Gate on `isSupabaseConfigured()` Path
**File:** `src/hooks/useAuth.ts:120–131`
**Issue:** When Supabase is not configured (`isSupabaseConfigured()` returns false), ANY email/password logs in as mock admin with no credential check. In a misconfigured production deploy (missing env vars), this is a full auth bypass.
**Fix:** Add `import.meta.env.DEV &&` guard at line 120 matching the pattern on line 106.

---

## HIGH

### [H1] Tokens Persisted in localStorage via Weak XOR Obfuscation
**File:** `src/utils/secure-token-xor-obfuscation-helpers.ts`, `src/utils/secure-token-storage.ts`
**Issue:** Access/refresh tokens are persisted to `localStorage` with XOR key `123` + base64. This is trivially reversible: `atob(stored).split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ 123))`. Any XSS attack or browser extension reads tokens in plaintext. Comments acknowledge "not true encryption" but the dual-storage design persists tokens indefinitely.
**Fix:** Use `sessionStorage` only (no persistence across tabs), or rely on Supabase's own secure cookie storage (`cookieOptions` with `httpOnly`). Remove localStorage fallback for tokens.

### [H2] `getAdminEmails()` Exposes Admin Whitelist to Client Runtime
**File:** `src/utils/admin-check.ts:42`, `src/components/AdminRoute.tsx:36`
**Issue:** `VITE_ADMIN_EMAILS` is a build-time env var baked into the bundle. `getAdminEmails()` returns the full list in runtime JS, readable by anyone with DevTools. While `VITE_*` vars are expected to be public, exposing admin email addresses reveals internal org targets for phishing/social engineering.
**Fix:** Remove `getAdminEmails()` export. Drive admin check server-side via Supabase RLS claim (custom JWT role), not email whitelist in client JS.

### [H3] CSRF Tokens Generated but Never Consumed
**File:** `src/utils/security-csrf-token-generator-and-session-store.ts`, entire `src/`
**Issue:** `csrfToken.get()` and `generateCsrfToken()` are implemented but grep finds zero usage in fetch/API calls or form submissions. The CSRF module is dead code — no protection is actually applied.
**Fix:** Either attach token as `X-CSRF-Token` header in the API client layer, or remove the dead module (YAGNI). For Supabase-only apps, CSRF is less critical since Supabase uses JWT bearer tokens (not cookies), but the false sense of security is the risk.

### [H4] `checkoutUrl` Redirect Without Validation
**File:** `src/pages/subscription/use-subscription-page-billing-and-plans.ts:84`
**Issue:** `window.location.href = checkoutUrl` — `checkoutUrl` comes from `subscribeToPlan()` store action with no URL validation. If the backend/store returns a malicious or unexpected URL (e.g., from a compromised API response), the user is silently redirected.
**Fix:** Validate via `sanitizeUrl(checkoutUrl)` (already exists in `security-xss-sanitization-helpers.ts`) before redirect.
```ts
const safe = sanitizeUrl(checkoutUrl);
if (safe) window.location.href = safe;
```

---

## MEDIUM

### [M1] Dual Obfuscation Systems — DRY Violation + Confusion Risk
**Files:** `src/utils/secure-token-xor-obfuscation-helpers.ts`, `src/utils/security-obfuscated-localstorage-wrapper.ts`
**Issue:** Two separate "obfuscation" utilities with different approaches (XOR+base64 vs base64+encodeURIComponent). Both claim security but neither provides it. Developers may mistakenly believe `secureStorage` or `secureTokenStorage` is cryptographically secure.
**Fix:** Consolidate into one utility with a clear naming convention (e.g., `obfuscateForStorage`) and a prominent comment that this is obfuscation only, not encryption.

### [M2] Rate Limiter is In-Memory Only — No Persistence Across Reloads
**File:** `src/utils/security-rate-limiter-with-sliding-window.ts`
**Issue:** `rateLimits = new Map()` — resets on page refresh. A brute-force attack that refreshes between attempts bypasses the limiter entirely. Login rate limiting is ineffective client-side regardless; this should be server-side (Supabase Auth has built-in rate limiting).
**Note:** Client-side rate limiting is acceptable as UX friction only — document this limitation.

### [M3] `sanitizeInput`/`sanitizeHtml` Not Used at Input Sites
**Issue:** Zero usages of `sanitizeInput` or `sanitizeHtml` in component files — only defined. React's JSX auto-escapes text content, so XSS via JSX interpolation is blocked by default, but any server-rendered HTML or `innerHTML` usage would be unprotected. Currently safe because no `dangerouslySetInnerHTML` exists.
**Action:** Document that sanitization helpers are available for future `dangerouslySetInnerHTML` usage and audit any new additions.

---

## LOW

### [L1] `ENCRYPTION_KEY = 'wellnexus_secure_v1'` Hardcoded in Source
**File:** `src/utils/security-obfuscated-localstorage-wrapper.ts:5`
**Issue:** Constant named `ENCRYPTION_KEY` is hardcoded as a string literal. Misleading name for an obfuscation prefix — if any future dev treats it as a real encryption key, it becomes a security bug.
**Fix:** Rename to `STORAGE_NAMESPACE` or `STORAGE_PREFIX` to reflect intent.

### [L2] Mock User Data with Real-Looking Financial Values
**File:** `src/hooks/useAuth.ts:12–40`
**Issue:** `MOCK_USER` contains large financial values (`totalSales: 150000000`, `businessValuation: 1800000000`). If mock data leaks to production UI (via C1/C2 above), users see misleading financial data.
**Fix:** After fixing C1/C2, mock data exposure is blocked. No standalone fix needed.

---

## Positive Observations
- No hardcoded API keys or real secrets found in `src/` — all via `VITE_*` env vars
- `dangerouslySetInnerHTML` has zero usages — React XSS surface is minimal
- `sanitizeUrl` correctly rejects non-http(s) protocols
- CSRF token uses `crypto.getRandomValues()` with proper fallback
- Admin routes use double-layer guard (`evaluateRouteGuard` + `checkAdminAccess`)
- `.gitignore` correctly excludes `.env`, `.env.local`, `.env.*.local`
- Sentry scrubs `apikey` from URLs (line 65 of `sentry.ts`)
- `eval()` not used anywhere in source

---

## Priority Action List
1. **[C1] IMMEDIATE** — Add `import.meta.env.DEV &&` guard to mock session restore (1-line fix)
2. **[C2] IMMEDIATE** — Add `import.meta.env.DEV &&` guard to unconfigured-Supabase login path
3. **[H4] Before next release** — Validate `checkoutUrl` via `sanitizeUrl()` before redirect
4. **[H1] Sprint backlog** — Remove localStorage token persistence; rely on sessionStorage or Supabase cookie adapter
5. **[H2] Sprint backlog** — Remove `getAdminEmails()` export; move admin check to server-side JWT claim
6. **[H3] Sprint backlog** — Either wire `csrfToken` into API calls or remove dead module
7. **[M1]** — Consolidate/rename obfuscation utilities
8. **[L1]** — Rename `ENCRYPTION_KEY` to `STORAGE_NAMESPACE`

---

## Unresolved Questions
- Is Supabase RLS enforcing admin-only data access server-side? Client-side `AdminRoute` guard is UI-only — if RLS is absent, direct API calls bypass it entirely.
- Does `subscribeToPlan()` validate that `checkoutUrl` is an expected Polar.sh domain server-side before returning?
- Is `VITE_ADMIN_EMAILS` intentionally public (Vite bakes all `VITE_*` into bundle)? If admin identity is sensitive, this needs rearchitecting.
