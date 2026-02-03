# Phase 01: Preparation - Routes and i18n

**Status:** IN_PROGRESS
**Priority:** HIGH

## Context Links

- Plan: `./plan.md`
- Login page: `src/pages/Login.tsx`
- Router: `src/App.tsx`
- i18n vi: `src/locales/vi.ts`
- i18n en: `src/locales/en.ts`

## Overview

Set up routing infrastructure and i18n keys for forgot password and reset password pages.

## Requirements

### Functional
- Add `/forgot-password` route
- Add `/reset-password` route
- i18n keys for both pages (vi + en)

### Non-functional
- No breaking changes to existing routes
- Maintain type safety

## Implementation Steps

1. **Add i18n keys to vi.ts:**
   - `auth.forgotPassword.title`
   - `auth.forgotPassword.subtitle`
   - `auth.forgotPassword.emailPlaceholder`
   - `auth.forgotPassword.submitButton`
   - `auth.forgotPassword.backToLogin`
   - `auth.forgotPassword.successMessage`
   - `auth.forgotPassword.errorMessage`
   - `auth.resetPassword.title`
   - `auth.resetPassword.subtitle`
   - `auth.resetPassword.newPasswordPlaceholder`
   - `auth.resetPassword.confirmPasswordPlaceholder`
   - `auth.resetPassword.submitButton`
   - `auth.resetPassword.successMessage`
   - `auth.resetPassword.errorMessage`
   - `auth.resetPassword.passwordMismatch`
   - `auth.resetPassword.weakPassword`

2. **Add matching i18n keys to en.ts**

3. **Create placeholder component files:**
   - `src/pages/auth/forgot-password-page.tsx`
   - `src/pages/auth/reset-password-page.tsx`

4. **Add routes to App.tsx:**
   - `/forgot-password` → ForgotPasswordPage
   - `/reset-password` → ResetPasswordPage

5. **Verify compilation:** `npm run build`

## Todo List

- [ ] Add i18n keys to vi.ts
- [ ] Add i18n keys to en.ts
- [ ] Create ForgotPasswordPage component
- [ ] Create ResetPasswordPage component
- [ ] Add routes to App.tsx
- [ ] Run type check and build

## Success Criteria

- Routes accessible at `/forgot-password` and `/reset-password`
- All i18n keys defined in both vi.ts and en.ts
- No TypeScript errors
- Build passes

## Risk Assessment

- **Low risk:** Route additions are isolated
- **Mitigation:** Test routing after changes

## Security Considerations

- Routes are public (no auth required)
- Token validation handled by Supabase

## Next Steps

After completion: Phase 02 - Forgot Password Page Implementation
