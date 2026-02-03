# Step 1: Deploy & Verify Production

**Status:** 🔴 READY TO EXECUTE
**ETA:** 10 minutes

## Context

- Forgot Password feature đã implement xong
- Code review: 9/10
- Tests: 100% passed
- Build: ✅ Passed

## Tasks

### 1.1 Push to Production

```bash
cd ~/Well && git push origin main
```

**Expected:** Vercel auto-deploys within 2-3 minutes

### 1.2 Verify Forgot Password Flow

**URL:** https://wellnexus.vn/forgot-password
**Checklist:**

- [ ] Page loads correctly
- [ ] Form displays properly
- [ ] Email field validates
- [ ] Submit button works
- [ ] Success message shows

### 1.3 Verify Reset Password Flow

**URL:** https://wellnexus.vn/reset-password
**Checklist:**

- [ ] Page handles token from URL
- [ ] Password validation works
- [ ] Confirm password matches
- [ ] Success state displays
- [ ] Redirect to login works

### 1.4 Verify Login Page Link

**URL:** https://wellnexus.vn/login
**Checklist:**

- [ ] "Quên mật khẩu?" link visible
- [ ] No tooltip (previously "Coming soon")
- [ ] Click navigates to /forgot-password

## Success Criteria

- ✅ All 3 URLs load correctly
- ✅ Forgot password form submits
- ✅ UI matches Aura Elite design
- ✅ i18n works (vi/en toggle)

## Files Changed

1. `src/pages/forgot-password-page.tsx` (NEW)
2. `src/pages/reset-password-page.tsx` (NEW)
3. `src/App.tsx` (routes added)
4. `src/pages/Login.tsx` (tooltip removed)
5. `src/locales/vi.ts` (translations)
6. `src/locales/en.ts` (translations)

## Next Step

→ After verification, proceed to Step 2: Supabase Email Configuration
