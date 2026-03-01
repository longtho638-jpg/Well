# Security Review — Well RaaS Health Platform

**Date:** 2026-03-01
**Scope:** `/Users/macbookprom1/mekong-cli/apps/well/src`
**Stack:** React 19 / TypeScript / Vite / Supabase / Zustand

---

## Code Review Summary

### Scope
- Files reviewed: ~562 source files (targeted review by category)
- Key files: `useAuth.ts`, `admin-check.ts`, `AdminRoute.tsx`, `security.ts`, `secure-token-storage.ts`, `api.ts`, `use-agent-chat.ts`, `supabase-edge-function-ai-provider.ts`, `vercel.json`, env files
- Review focus: Security categories — XSS, API key exposure, input validation, auth, CORS, SQL injection, dependencies

### Overall Assessment
Codebase has solid security foundations (DOMPurify installed, Zod schemas on auth forms, Supabase parameterized queries via SDK, CSP headers in vercel.json, HSTS). However, there are two HIGH-severity issues involving client-side auth bypass and admin role exposure that require immediate attention.

---

## Critical Issues

None with immediate RCE/data-breach risk, but HIGH findings below should be treated as near-critical.

---

## High Priority Findings

### [HIGH-1] Mock Session Bypass NOT Guarded by DEV Flag

**File:** `/Users/macbookprom1/mekong-cli/apps/well/src/hooks/useAuth.ts` L47–59

```ts
// Line 47 — NO import.meta.env.DEV guard here!
const hasMockSession = localStorage.getItem('wellnexus_mock_session') === 'true';
if (hasMockSession) {
  // Restores MOCK_USER with role:'admin', isAdmin:true
  setUser(userToRestore);
  setIsAuthenticated(true);
  setInitialized(true);
  return; // ← Bypasses Supabase entirely
}
```

Any user (or attacker) can open DevTools in **production**, set `localStorage.setItem('wellnexus_mock_session', 'true')` and reload — they get fully authenticated as an admin-role mock user without any password check. The demo-login path (L104) IS guarded by `import.meta.env.DEV`, but the session **restore** path (L47) has no such guard.

**Fix:**
```ts
// Line 47 — add DEV guard:
const hasMockSession = import.meta.env.DEV && localStorage.getItem('wellnexus_mock_session') === 'true';
```

---

### [HIGH-2] Admin Email Whitelist Exposed in JS Bundle

**File:** `/Users/macbookprom1/mekong-cli/apps/well/src/utils/admin-check.ts` L12

```ts
const ADMIN_EMAILS_ENV = import.meta.env.VITE_ADMIN_EMAILS || '';
```

`VITE_*` env vars are baked into the client JS bundle at build time. The list `wellnexusvn@gmail.com,doanhnhancaotuan@gmail.com,billwill.mentor@gmail.com` (from `.env.local`) is visible to anyone who downloads and reads the production bundle. Attackers learn which email addresses are admins.

Additionally, `AdminRoute.tsx` also calls `getAdminEmails()` and logs on admin access (L33–36) — the email list is callable from the console as `getAdminEmails()` if the function is not tree-shaken.

**Risk:** Target phishing, credential stuffing against known admin emails.

**Fix:** Admin determination must move to the backend — use Supabase RLS with a `role` column or a separate `admins` table. `VITE_ADMIN_EMAILS` should be removed from the client entirely. `admin-check.ts` already documents this: *"Client-side admin check only. Backend MUST verify admin status via Supabase RLS."* — but the client-side list still leaks the emails themselves.

---

## Medium Priority Improvements

### [MED-1] `secureStorage` is Base64 Only (False Encryption Label)

**File:** `/Users/macbookprom1/mekong-cli/apps/well/src/utils/security.ts` L140–186
**File:** `/Users/macbookprom1/mekong-cli/apps/well/src/utils/secure-token-storage.ts`

Both files use `btoa()` / XOR-123 and call the result "encrypted" or "secure". This is trivial obfuscation, not encryption. The constant `ENCRYPTION_KEY = 'wellnexus_secure_v1'` is hardcoded. The `secure-token-storage.ts` itself documents the tradeoff clearly in comments.

Issue: any code reading these values (or XSS with localStorage access) instantly decodes them. This is acceptable if it's understood as "obfuscation only", but the naming (`secureStorage`, `encodeSecure`, `ENCRYPTION_KEY`) implies stronger guarantees to future developers.

**Recommendation:** Either rename to `obfuscatedStorage` / remove the `ENCRYPTION_KEY` constant, or add a comment block at the top of `security.ts` stating this is NOT cryptographic encryption. Misleading naming creates maintenance risk.

---

### [MED-2] CSP Uses `'unsafe-inline'` for Scripts

**File:** `/Users/macbookprom1/mekong-cli/apps/well/vercel.json` L15

```
script-src 'self' 'unsafe-inline' https://vercel.live ...
```

`'unsafe-inline'` in `script-src` defeats most of the XSS protection that CSP provides. Vite builds inject inline scripts for module preloading. Proper fix requires nonce-based CSP, which is non-trivial with Vite but achievable with a Vite plugin.

**Short-term:** Accept as known limitation since Vite requires it for dev, but document and track.
**Long-term:** Use `vite-plugin-csp` or serve the app through an edge function that injects per-request nonces.

---

### [MED-3] npm audit: 2 High-Severity Vulnerabilities in `sharp-cli`

```
glob  11.0.0 - 11.0.3
Severity: high
glob CLI: Command injection via -c/--cmd executes matches with shell:true
```

**Package:** `sharp-cli` (devDependency) depends on vulnerable `glob` versions.

This is a **build-time** (dev) dependency, not a runtime production risk. However, the CI step `npm audit --audit-level=high || true` silently ignores it (the `|| true` swallows the exit code).

**Fix:**
```bash
npm audit fix --force  # will downgrade sharp-cli to 4.x
```
Or remove `sharp-cli` if it's unused in production builds. Also remove `|| true` from CI so high-severity audits actually fail the build.

---

### [MED-4] `supabase-edge-function-ai-provider.ts` Falls Back to `VITE_SUPABASE_ANON_KEY`

**File:** `/Users/macbookprom1/mekong-cli/apps/well/src/services/ai-provider/supabase-edge-function-ai-provider.ts` L24, L46

```ts
'Authorization': `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
```

If no active session, the AI Edge Function is called with the anon key as the auth bearer. Supabase anon key is a public key (by design), but calling privileged Edge Functions with it may bypass user-level RLS. Confirm the Edge Function `agent-chat` validates user identity server-side and doesn't rely on the client-provided token alone.

---

## Low Priority Suggestions

### [LOW-1] CSRF Token in sessionStorage Not Sent in Requests

**File:** `/Users/macbookprom1/mekong-cli/apps/well/src/utils/security.ts` L78–92

`csrfToken.get()` exists but grep finds no call sites injecting it into fetch headers. CSRF is largely moot for SPA+Bearer-token auth (since cookies aren't used for auth), but if future cookie-based sessions are added, this needs wiring.

### [LOW-2] `generateId()` in `use-agent-chat.ts` Uses `Math.random`

**File:** `/Users/macbookprom1/mekong-cli/apps/well/src/hooks/use-agent-chat.ts` L33–35

```ts
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
```

Not a security issue for message IDs, but if these IDs are ever used for deduplication or idempotency keys, `crypto.randomUUID()` is safer.

### [LOW-3] CI Security Audit Silenced

**File:** `/Users/macbookprom1/mekong-cli/apps/well/.github/workflows/ci.yml`

```yaml
- name: Security audit
  run: npm audit --audit-level=high || true
```

`|| true` means high-severity vulnerabilities never fail the build. Remove `|| true`.

---

## Positive Observations

- **No `dangerouslySetInnerHTML`** anywhere in the codebase. React's default escaping is the primary XSS defense and it's not bypassed.
- **DOMPurify installed** and used correctly in `security.ts` with `ALLOWED_TAGS: []` for plain text fields.
- **Supabase SDK for all DB queries** — no raw SQL, no parameterization issues. RPC calls use parameter objects.
- **Zod schemas** on all auth forms (login, signup, reset password) with strong password regex.
- **CSP header** is defined in `vercel.json` with `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` — good baseline.
- **HSTS** with `max-age=31536000; includeSubDomains; preload` — correct.
- **X-Frame-Options: DENY**, **X-Content-Type-Options: nosniff** — present.
- **`.env.local` and `.env.*.local` are gitignored** and not tracked in git.
- **Token timeout**: session timeout of 30 minutes implemented in `auth.ts`.
- **AbortController** used in all fetch calls — prevents hanging requests.
- **Admin email check** has a backend-delegation comment acknowledging client-side limitations.

---

## Recommended Actions (Prioritized)

1. **[HIGH-1 — IMMEDIATE]** Add `import.meta.env.DEV &&` guard to mock session restore in `useAuth.ts` L47
2. **[HIGH-2 — SPRINT]** Remove `VITE_ADMIN_EMAILS` from client bundle; move admin determination to Supabase RLS role column
3. **[MED-3 — THIS WEEK]** Fix `sharp-cli` vulnerability: `npm audit fix --force` or remove if unused; remove `|| true` from CI audit step
4. **[MED-4 — VERIFY]** Confirm Edge Function `agent-chat` enforces user-level auth server-side and rejects anon key calls
5. **[MED-1 — DOCS]** Rename `secureStorage`/`encodeSecure` to `obfuscatedStorage`/`obfuscateData` or add explicit non-encryption disclaimer
6. **[MED-2 — TRACK]** Log `'unsafe-inline'` CSP as known technical debt, plan nonce migration

---

## Metrics

- XSS via `dangerouslySetInnerHTML`: 0 instances — CLEAN
- Hardcoded secrets in src: 0 — CLEAN (env vars used correctly)
- SQL injection risk: 0 — Supabase SDK parameterizes all queries
- Input validation (auth forms): PRESENT — Zod schemas
- Auth bypass in production: 1 HIGH (mock session restore)
- Admin email exposure: 1 HIGH (VITE_ADMIN_EMAILS in bundle)
- Dependency vulnerabilities: 2 HIGH (sharp-cli/glob, dev-only)
- CSP: PRESENT but weakened by `'unsafe-inline'` in script-src
- HSTS: PRESENT
- Security headers: PRESENT

---

## Unresolved Questions

1. Does the Supabase Edge Function `agent-chat` validate that the caller has a real user session (not just an anon key)? This needs backend code review to confirm.
2. Is `sharp-cli` (and its `glob` dependency) actually used in the production build pipeline, or only locally? If unused in CI builds, it can be removed entirely.
3. Are there Supabase RLS policies in place that would restrict admin-only tables even if `AdminRoute` client-side check were bypassed? (This would determine the real blast radius of HIGH-1.)
