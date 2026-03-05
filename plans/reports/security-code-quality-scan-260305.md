# Security & Code Quality Scan Report

**Date:** 2026-03-05
**Project:** WellNexus Distributor Portal
**Scope:** `src/` directory (85,726 LOC)
**Report:** `plans/reports/security-code-quality-scan-260305.md`

---

## Executive Summary

| Gate | Status | Count | Target |
|------|--------|-------|--------|
| 🔴 Security (Secrets) | ✅ PASS | 0 | 0 |
| 🔴 Tech Debt (TODO/FIXME) | ⚠️ FAIL | 1 | 0 |
| 🟡 Type Safety (`any`) | ⚠️ FAIL | 1 | 0 |
| 🟡 TS Ignore Directives | ✅ PASS | 0 | 0 |
| 🟢 npm audit | ⚠️ SKIPPED | N/A | 0 |

**Overall:** ⚠️ **NEEDS FIX** — 2 quality gate violations

---

## Findings

### 1. Security Scan — ✅ PASS

```bash
grep -r "API_KEY\|SECRET\|PASSWORD" src
```

**Result:** No hardcoded secrets detected.

Notes:
- `VITE_FIREBASE_API_KEY` references are env var declarations (safe)
- `PASSWORD_RECOVERY` is Supabase auth event type (safe)
- `PASSWORD_REGEX` is validation pattern name (safe)

---

### 2. Tech Debt Scan — ⚠️ FAIL (1 TODO)

**File:** `src/hooks/useAuth.ts:157`
```typescript
// TODO: Handle sponsor_id assignment via separate RPC or edge function
```

**Action:** Create task to implement sponsor_id assignment via RPC.

**Excluded (expected):**
- `src/test/setup.ts` — test configuration (console override)
- `src/utils/logger.ts` — logging utility (intentional)
- `src/lib/vibe-agent/types.ts` — type definition comment

---

### 3. Type Safety Scan — ⚠️ FAIL (1 `any`)

**File:** `src/hooks/__tests__/useVendorDashboard.test.ts:12`
```typescript
let products: any;
```

**Action:** Replace with proper type `Product[] | undefined` or interface.

---

### 4. Console Statements in Production — ⚠️ WARNING (10 occurrences)

**File:** `src/utils/auth.ts` (7 occurrences)
```typescript
console.error('Error checking product authorization:', error);
console.error('Unexpected error in checkProductAuthorization:', error);
console.error('Error checking user role:', error);
console.error('Unexpected error in isUserVendor:', error);
console.error('Error getting product vendor ID:', error);
console.error('Unexpected error in getProductVendorId:', error);
console.error('Failed to log audit event:', error);
```

**File:** `src/hooks/useVendorDashboard.ts` (4 occurrences)
```typescript
console.error('Error loading vendor products:', error);
console.error('Error adding product:', error);
console.error('Error updating product:', error);
console.error('Error deleting product:', error);
```

**Recommendation:** Replace with `logger.error()` from `src/utils/logger.ts` for centralized logging.

---

### 5. npm Audit — ⚠️ SKIPPED

Lockfile missing. Run `npm install` to generate `package-lock.json` first.

---

## Priority Fixes

| Priority | File | Issue | Fix |
|----------|------|-------|-----|
| High | `src/hooks/useAuth.ts` | TODO comment | Implement sponsor_id RPC |
| Medium | `src/hooks/__tests__/useVendorDashboard.test.ts` | `any` type | Add proper Product type |
| Low | `src/utils/auth.ts`, `useVendorDashboard.ts` | console.error | Replace with logger |

---

## Unresolved Questions

- Should `console.error` in production code be replaced with structured logging?
- Is there a test coverage report available?
- When will `package-lock.json` be committed for audit support?
