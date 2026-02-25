# Authentication Recovery Guide

**Version:** 1.0.0
**Last Updated:** 2026-02-03

## Overview

The Authentication Recovery system provides a secure way for users to regain access to their accounts if they forget their password. This flow utilizes Firebase Authentication's email link capability combined with client-side validation to ensure account security.

## User Flow

1. **Request Reset Link**
   - User clicks "Forgot Password?" on the Login page.
   - User enters their registered email address on the `/forgot-password` page.
   - System validates the email format.
   - Upon submission, Firebase sends a password reset email to the user.
   - User receives immediate feedback on the UI.

2. **Reset Password**
   - User clicks the link in their email.
   - User is redirected to `/reset-password` with a unique `oobCode` (out-of-band code) in the URL query parameters.
   - User enters a new password.
   - **Password Strength Enforcement:** The new password is evaluated in real-time:
     - Must meet minimum length requirements.
     - Must achieve a minimum strength score.
     - `PasswordStrengthMeter` provides visual feedback.
   - Upon successful validation, the password is updated in Firebase.
   - User is redirected to Login page with a success message.

## Technical Implementation

### Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/forgot-password` | `ForgotPage` | Email submission form |
| `/reset-password` | `ResetPasswordPage` | New password entry and validation |

### Key Components

- **ForgotPage (`src/pages/auth/ForgotPage.tsx`)**
  - Handles email input state.
  - Integration with `useAuth` hook for `sendPasswordResetEmail`.
  - localized text using `t('auth.forgotPassword.*')`.

- **ResetPasswordPage (`src/pages/auth/ResetPasswordPage.tsx`)**
  - Extracts `oobCode` from URL search params.
  - Validates `oobCode` existence (redirects to login if missing).
  - Uses `PasswordStrengthMeter` for enforcing strong passwords.
  - Integration with `useAuth` hook for `confirmPasswordReset`.

### Security Measures

1. **Token Validation:** The `oobCode` provided by Firebase is a one-time use token with an expiration time.
2. **Strength Enforcement:** Users cannot submit the reset form unless the password meets specific complexity requirements.
3. **Feedback:** Detailed feedback prevents user frustration while maintaining security standards.
4. **Navigation Guards:**
   - Authenticated users attempting to access these pages are redirected to the Dashboard.
   - Users accessing `/reset-password` without a code are redirected to Login.

## Internationalization (i18n)

All user-facing text is fully localized in `vi` and `en` locales under the `auth` namespace:

- `auth.forgotPassword.title`
- `auth.forgotPassword.description`
- `auth.resetPassword.title`
- `auth.resetPassword.newPassword`
- `auth.resetPassword.strength`

## Troubleshooting

- **Email not received:** Check spam folder. Firebase quota limits may apply in development environment.
- **Invalid Code:** If the link is expired or already used, Firebase will return an error code (e.g., `auth/invalid-action-code`). The UI displays a user-friendly error message.
