# Security Audit — Well Distributor Portal
**Date:** 2026-03-02 | **Scope:** RaaS Public Release | **Auditor:** debugger agent

---

## Executive Summary

**Overall Risk Level:** MEDIUM — No critical secrets in source code; 3 medium findings require fixes before public release.

| Category | Status | Severity |
|---|---|---|
| Secrets in src/ | PASS — all via `import.meta.env` | — |
| Security headers | PASS — full suite in vercel.json | — |
| XSS | PASS — no dangerouslySetInnerHTML | — |
| CORS | PASS — no open CORS config | — |
| .env gitignore | PASS — .env.local excluded | — |
| npm audit | WARN — 2 HIGH (xlsx, not in well/) | HIGH |
| Token storage | WARN — XOR obfuscation ≠ encryption | MEDIUM |
| VITE_GEMINI_API_KEY client exposure | WARN — key type declared in client bundle | MEDIUM |
| Input validation | PASS — zod across all forms | — |
| RLS | PARTIAL — mentioned in policyService but DB not audited directly | MEDIUM |

---

## Findings

### [HIGH] F1 — xlsx Prototype Pollution + ReDoS (Monorepo Dependency)
- **File:** `apps/com-anh-duong-10x` (sibling app, not well/)
- **Packages:** `xlsx@0.18.5` (CVE: GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9)
- **Vulns:** Prototype Pollution + RegEx Denial of Service
- **Impact:** Not in well/ bundle directly; however monorepo pnpm workspace may hoist if shared
- **Fix:** `pnpm update xlsx` in `apps/com-anh-duong-10x`, or replace with `exceljs` / `papaparse`
- **Note:** Verify with `pnpm why xlsx` from well/ — if not hoisted, severity drops to LOW for this app

### [MEDIUM] F2 — XOR Obfuscation Mistaken for Encryption
- **File:** `src/utils/secure-token-xor-obfuscation-helpers.ts` (lines 9–12)
- **File:** `src/utils/secure-token-storage.ts` (line 112)
- **Description:** Auth tokens (Supabase access + refresh) persisted to localStorage with XOR key=123 + base64. XOR with fixed key is trivially reversible; any JS in the page (XSS, injected extension) recovers plaintext tokens.
- **Fix:** Use `sessionStorage` for short-lived tokens only, drop localStorage fallback, or use `crypto.subtle` (AES-GCM) with a session-derived key. The in-memory primary store is correct — remove the localStorage backup entirely.

### [MEDIUM] F3 — VITE_GEMINI_API_KEY Declared in Client Bundle Type
- **File:** `src/vite-env.d.ts` line 16: `readonly VITE_GEMINI_API_KEY: string`
- **File:** `docs/guides/VERCEL_DEPLOYMENT.md` line 312, 407, 416, 459 — checklist items tell operators to set `VITE_GEMINI_API_KEY` as a Vercel env var (client-exposed via bundle)
- **Description:** Any `VITE_*` variable is baked into the production JS bundle at build time. If `VITE_GEMINI_API_KEY` is set in Vercel, the key ships to every browser visitor.
- **Current status:** `docs/guides/VERCEL_DEPLOYMENT.md:127` correctly notes GEMINI_API_KEY is now server-side only. But stale checklist items (lines 312, 407) still instruct setting `VITE_GEMINI_API_KEY` — a contradiction that confuses operators.
- **Fix:** Remove `VITE_GEMINI_API_KEY` from `vite-env.d.ts`, delete stale checklist references in deployment guides, add a CI lint rule `grep -r VITE_GEMINI_API_KEY src/ | wc -l # must = 0`

### [MEDIUM] F4 — RLS Coverage Unverified
- **File:** `src/services/policyService.ts` line 60: "Requires 'admin' role via RLS"
- **File:** `docs/supabase-ecommerce-setup.sql` line 216: "Enable RLS"
- **Description:** RLS is referenced in code and docs but DB policies were not auditable without live connection. Tables `policy_config`, `agent_logs`, `products`, `teams` — all accessed server-side via anon key. If any table lacks a restrictive policy, anon users could read/write sensitive rows.
- **Fix:** Run `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';` against production DB. All tables must show `rowsecurity = true`. Add E2E test that anon client cannot read `policy_config`.

### [LOW] F5 — HANDOVER.md Committed with Placeholder Credential Patterns
- **File:** `HANDOVER.md` lines 51–62
- **Description:** Contains lines like `RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx` — placeholders only, not real keys. However the file pattern trains operators to see credential files as normal in the repo.
- **Fix:** Move HANDOVER.md to `docs/` and add a CI check: `git diff HEAD -- HANDOVER.md | grep -E '[A-Za-z0-9]{32,}'` should return empty on main branch.

### [LOW] F6 — esbuild Moderate Dev-Only Vuln
- **Package:** `esbuild <=0.24.2` (GHSA-67mh-4wv8-2f99) — dev-dependency via vitest
- **Impact:** Dev-time only; not in production bundle. Upgrade vitest to get patched esbuild.
- **Fix:** `pnpm update vitest` in well/ workspace

---

## Security Headers — PASS

All headers present in `vercel.json`:

| Header | Value | Status |
|---|---|---|
| Content-Security-Policy | Scoped, no unsafe-eval, `unsafe-inline` for scripts (Vercel Live constraint) | PASS |
| Strict-Transport-Security | max-age=31536000; includeSubDomains; preload | PASS |
| X-Content-Type-Options | nosniff | PASS |
| X-Frame-Options | DENY | PASS |
| X-XSS-Protection | 1; mode=block | PASS |
| Referrer-Policy | strict-origin-when-cross-origin | PASS |
| Permissions-Policy | camera/mic/geo restricted | PASS |

**Note:** `unsafe-inline` in `script-src` weakens CSP. Consider a nonce-based approach post-launch.

---

## Authentication — PASS (with caveat)

- Supabase client configured with `autoRefreshToken: true`, `persistSession: true`, `detectSessionInUrl: true`
- Custom `secureTokenStorage` used as Supabase adapter — primary in-memory store is correct
- Password schema (zod) enforces uppercase, lowercase, number, special char — NIST compliant
- Admin email validation moved to env var `VITE_ADMIN_EMAILS` (commit b70cd11) — good

**Caveat:** See F2 — localStorage fallback weakens the otherwise solid in-memory approach.

---

## Input Validation — PASS

Zod schemas found across 64 files. Critical paths verified:
- `src/lib/schemas/auth.ts` — login, signup, forgot/reset password
- `src/schemas/api-validation-schemas.ts` — PayOS webhook, payout, withdrawal with explicit bounds
- `src/utils/validation/checkoutSchema.ts` — checkout flow
- `src/schemas/order.ts` — order creation

---

## Environment Variables — PASS

- `.env.local` and `.env.*.local` in `.gitignore` (lines 20–22, 41)
- `.env.production.local` present locally but excluded from git
- All secrets in `src/` accessed via `import.meta.env.VITE_*` — no hardcoded values
- `GEMINI_API_KEY` + `RESEND_API_KEY` server-side via Supabase Secrets (correct)

---

## Priority Action List

| Priority | Finding | Action | Effort |
|---|---|---|---|
| 1 | F2 — Token localStorage | Remove localStorage fallback from SecureTokenStorage | 30 min |
| 2 | F3 — VITE_GEMINI_API_KEY stale docs | Delete stale checklist lines + remove from vite-env.d.ts | 15 min |
| 3 | F4 — RLS verification | Run pg_tables query on prod + add anon-access E2E test | 1 hr |
| 4 | F1 — xlsx (sibling) | Update xlsx in com-anh-duong-10x or verify not hoisted | 20 min |
| 5 | F6 — esbuild dev | pnpm update vitest | 5 min |
| 6 | F5 — HANDOVER.md | Move to docs/, add CI check | 15 min |

---

## Unresolved Questions

1. Are Supabase RLS policies enforced on ALL public tables? — cannot confirm without DB access.
2. Is `VITE_GEMINI_API_KEY` actually set in Vercel production env vars, or only GEMINI_API_KEY (server-side)? Operator error risk is high given contradictory docs.
3. Does the monorepo pnpm workspace hoist `xlsx` into well/'s node_modules? Run `pnpm why xlsx` from well/ to confirm.
