# Security Audit — Injection, Rate Limiting & Data Protection
**Date:** 2026-03-02 | **Scope:** WellNexus Distributor Portal (React/TS/Vite/Supabase)

---

## CRITICAL

### C1 — Mock Auth Bypass Persisted to localStorage (Auth Bypass Risk)
**File:** `src/hooks/useAuth.ts` lines 46-58, 113-128
**Issue:** `wellnexus_mock_session=true` in localStorage bypasses Supabase auth entirely — including in production. Check at line 47 happens BEFORE `isSupabaseConfigured()` check. Any user who sets this key in DevTools gets admin-level `MOCK_USER` (role: 'admin', isAdmin: true) with no server verification.
**Fix:** Remove mock session persistence entirely from localStorage. Restrict demo mode to `import.meta.env.DEV` guard AND never persist to localStorage. Use in-memory state only.

```ts
// REMOVE these from production code path:
localStorage.setItem('wellnexus_mock_session', 'true');
localStorage.setItem('wellnexus_mock_email', email.toLowerCase());
```

---

### C2 — walletService.requestPayout() Has No Server-Side Amount Validation
**File:** `src/services/walletService.ts` lines 160-178
**Issue:** `requestPayout()` directly inserts into `transactions` table with caller-supplied `amount`. Client-side check (`amount > wallet.balance`) in `useWallet.ts:113` is trivially bypassed via DevTools/curl. No RPC with server-enforced balance check — unlike `createWithdrawalRequest` which correctly uses `supabase.rpc()`.
**Fix:** Replace direct insert with an RPC that atomically validates and deducts balance server-side.

---

## HIGH

### H1 — Rate Limiter Implemented but Never Called
**Files:** `src/utils/security-rate-limiter-with-sliding-window.ts`, `src/hooks/useLogin.ts`, `src/hooks/useForgotPassword.ts`
**Issue:** `isRateLimited()` exists and is exported but grep shows 0 call sites in any auth flow. Login (`useLogin.ts`), forgot-password (`useForgotPassword.ts`), and withdrawal submission all have no rate-limiting. Brute-force on login and email-enumeration on password reset are unmitigated client-side.
**Note:** Supabase Auth has server-side rate limiting, but client-side guard provides defense-in-depth and prevents wasted API calls.
**Fix:** Add to `useLogin.onSubmit` and `useForgotPassword.onSubmit`:
```ts
if (isRateLimited(`login:${data.email}`, 5, 60000)) {
  setServerError(t('errors.tooManyAttempts'));
  return;
}
```

### H2 — "Encryption" is XOR+base64 — Trivially Reversible
**Files:** `src/utils/secure-token-xor-obfuscation-helpers.ts`, `src/utils/security-obfuscated-localstorage-wrapper.ts`
**Issue:** Auth tokens persisted to localStorage via `encryptSimple()` use XOR with hardcoded key `123` — identical to no encryption. `ENCRYPTION_KEY = 'wellnexus_secure_v1'` in obfuscated-localstorage is a hardcoded constant. Any XSS attack recovers tokens in one line. Comments acknowledge this ("basic obfuscation — not true encryption") but callers treat it as secure storage.
**Fix:** For auth tokens, rely on Supabase's built-in session management (httpOnly cookies or its own localStorage). Do not store access/refresh tokens in additional custom localStorage keys. Remove `SecureTokenStorage` localStorage fallback.

### H3 — Sentry Session Replay at 100% — PII Leakage Risk
**File:** `src/utils/sentry.ts` lines 52-53
**Issue:** `replaysSessionSampleRate: 1.0` captures full session video for every user. Financial dashboards, bank account numbers, and withdrawal forms are recorded. `maskAllText: true` is set but Sentry replay masking has known bypasses with dynamic content.
**Fix:** Reduce to `replaysSessionSampleRate: 0.1` (10%). Add explicit component-level `data-sentry-mask` attributes on financial fields.

### H4 — financeService Falls Back to Mock Data on Error
**File:** `src/services/financeService.ts` lines 137-140
**Issue:** On any Supabase error, admin finance view silently returns `mockTransactions` (hardcoded data with real-looking partner names/amounts). Admin may make approval decisions on fake data without knowing the query failed.
**Fix:** Throw the error instead of returning mock data in production:
```ts
} catch (error) {
  adminLogger.error('Failed to fetch transactions', error);
  throw error; // Let UI handle the error state
}
```

---

## MEDIUM

### M1 — Withdrawal Schema Missing Integer/Precision Validation
**File:** `src/components/withdrawal/withdrawal-form-zod-schema-and-min-amount.ts`
**Issue:** `amount: z.number()` accepts floats (e.g., 2000000.99). VND is always integer. No `.int()` constraint. Also no `.positive()` guard — `max(pendingCashback)` with `pendingCashback=0` creates `max(0)` which rejects all values but error UX is confusing.
**Fix:** `z.number().int().positive().min(MIN_WITHDRAWAL).max(pendingCashback || MIN_WITHDRAWAL)`

### M2 — accountNumber Validation Too Weak
**File:** `src/components/withdrawal/withdrawal-form-zod-schema-and-min-amount.ts` line 23
**Issue:** `z.string().min(5)` accepts "12345" as valid bank account. Vietnamese bank accounts are 9-19 digits. No digit-only check.
**Fix:** `z.string().regex(/^\d{9,19}$/, 'Invalid account number format')`

### M3 — cancelWithdrawal Has Insecure Fallback Path
**File:** `src/services/withdrawal/client.ts` lines 130-145
**Issue:** When `cancel_withdrawal_request` RPC fails, code falls back to a direct table UPDATE without RLS check at application level. The fallback calls `increment_pending_balance` as separate operation — not atomic. Race condition: cancel succeeds but balance increment fails, leaving user without refund.
**Fix:** Remove the fallback. If RPC fails, surface the error. Atomicity must be server-side.

### M4 — CSRF Token Not Validated on Any Request
**File:** `src/utils/security-csrf-token-generator-and-session-store.ts`
**Issue:** `csrfToken` is generated and stored but `grep` shows no usage in API calls or form submissions. Generated but never sent or verified — security theater.
**Fix:** Either attach to withdrawal/financial mutation requests as a custom header, or remove (Supabase JWT auth makes CSRF less critical for API calls, but remove if unused to reduce confusion).

---

## LOW

### L1 — Sentry Sets User Email in Context
**File:** `src/utils/sentry.ts` line 101
**Issue:** `email: user.email` sent to Sentry. For GDPR/data minimization, prefer hashing: `Sentry.setUser({ id: user.id })` only.

### L2 — xlsx Dependency (High Severity) in Sibling App
**Scope:** `apps/com-anh-duong-10x > xlsx@0.18.5` — Prototype Pollution + ReDoS
**Note:** Not in `apps/well` directly but in monorepo. Audit confirms 2 HIGH vulnerabilities. No patched version available from vendor — consider `exceljs` as alternative.

### L3 — DebuggerPage Leaks Raw localStorage to UI
**File:** `src/pages/DebuggerPage.tsx` line 55
**Issue:** Renders all localStorage keys and values (truncated at 50 chars) in UI. If page is accessible in production, exposes obfuscated tokens visually.
**Fix:** Route-guard this page to admin-only or remove from production build.

---

## Positive Observations
- All Supabase queries use parameterized methods (`.eq()`, `.rpc()` with named params) — no string concatenation in queries. SQL injection risk is low.
- Withdrawal RPC `create_withdrawal_request` correctly delegates amount validation to DB stored proc.
- `sanitizeHtml` / `sanitizeInput` use DOMPurify properly.
- `sanitizeUrl` blocks non-http(s) protocols.
- Sentry `beforeSend` strips Authorization headers and API keys from URLs.
- XSS risk is low — React auto-escapes, no `dangerouslySetInnerHTML` found.

---

## Priority Actions
1. **[C1]** Remove localStorage mock session persistence — auth bypass in production
2. **[C2]** Replace `walletService.requestPayout` direct insert with server-side RPC
3. **[H1]** Wire `isRateLimited()` into login and forgot-password flows
4. **[H3]** Reduce Sentry replay to 10%, mask financial fields
5. **[H4]** Remove mock data fallback in `financeService.getTransactions`
6. **[M1/M2]** Harden withdrawal zod schema with `.int()` and account number regex
7. **[M3]** Remove non-atomic cancel fallback in withdrawal client
8. **[L3]** Gate DebuggerPage to admin-only or strip from prod bundle

---

## Unresolved Questions
1. Does `create_withdrawal_request` stored proc enforce balance >= amount atomically with lock? (Cannot verify without DB access)
2. Is `walletService.requestPayout` still a live code path or superseded by `createWithdrawalRequest`? Both exist — dead code risk.
3. What RLS policies protect `withdrawal_requests` table? Direct UPDATE in fallback path (M3) depends entirely on RLS.
