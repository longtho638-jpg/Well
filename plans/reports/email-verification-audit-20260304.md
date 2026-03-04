# Email Verification Flow Audit Report

**Date:** 2026-03-04
**Scope:** `confirm-email.tsx`, `use-confirm-email-verification-flow.ts`, `email-service.ts`

---

## 🔍 PHÂN TÍCH CODE

### 1. `use-confirm-email-verification-flow.ts`

**Chiến lược hiện tại:**

| Strategy | Description | Status |
|----------|-------------|--------|
| 1. token_hash + type | Supabase email link format | ✅ Correct |
| 2. hash fragment / code | PKCE implicit flow | ⚠️ Issue |
| 3. Existing session | Check for already confirmed | ✅ Correct |

**VẤN ĐỀ TÌM THẤY:**

#### Issue #1: Timeout quá ngắn (10s)
```typescript
timeoutId = setTimeout(() => {
  subscription.unsubscribe();
  authSubscription = null;
  setState('error');
  setErrorMessage('Confirmation timed out. Please try again.');
}, 10000);  // ❌ 10s quá ngắn cho email verification
```

**Root cause:** Email verification links từ Supabase có thể mất >10s để redirect, đặc biệt với email providers chậm (Gmail, Outlook).

#### Issue #2: Missing PKCE code exchange
```typescript
const code = searchParams.get('code');
if ((hash && hash.includes('access_token')) || code) {
  // ❌ Không exchange code cho session
  // Chỉ chờ onAuthStateChange event
}
```

**Root cause:** Với PKCE flow, khi có `code` param, PHẢI gọi `supabase.auth.exchangeCodeForSession(code)` thay vì chỉ chờ event.

#### Issue #3: Race condition
Listener đăng ký SAU khi check hash/code → có thể miss event.

---

### 2. `email-service.ts`

**Type definitions:** ✅ OK
- `SendEmailRequest`, `SendEmailResponse` defined properly
- All email template types covered
- Proper error handling

**No issues found** - email service chỉ dùng để send transactional emails, không liên quan đến verification flow.

---

## ✅ GIẢI PHÁP

### Fix 1: Increase timeout + exchange PKCE code

```typescript
// Strategy 2: Proper PKCE code exchange
const code = searchParams.get('code');
const hash = window.location.hash;

if (code) {
  // ✅ Exchange PKCE code for session
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    setState('error');
    setErrorMessage(error.message);
  } else {
    setState('success');
    setTimeout(() => navigate('/login'), 2000);
  }
  return;
}

if (hash && hash.includes('access_token')) {
  // ✅ Implicit flow - wait for session
  const { data: { subscription } } = supabase.auth.onAuthStateChange(/*...*/);
  authSubscription = subscription;

  // Increase timeout to 60s
  timeoutId = setTimeout(() => {
    subscription.unsubscribe();
    setState('error');
    setErrorMessage('Confirmation timed out. Please try again.');
  }, 60000);  // ✅ 60s reasonable
}
```

### Fix 2: Register listener BEFORE checking

Move `onAuthStateChange` registration before `getSession()` check to avoid race condition.

---

## 📋 TODO LIST

- [ ] Fix `use-confirm-email-verification-flow.ts`:
  - [ ] Add `exchangeCodeForSession(code)` call when `code` param present
  - [ ] Increase timeout from 10s → 60s
  - [ ] Register listener before checking session
  - [ ] Add error logging for debugging

- [ ] Run tests
- [ ] Verify build
- [ ] Test with real Supabase email verification flow

---

## 🎯 VERIFICATION CRITERIA

```bash
# Build check
npm run build  # ✅ 0 errors

# Type check
npx tsc --noEmit  # ✅ 0 errors

# Test
npm test  # ✅ All pass
```
