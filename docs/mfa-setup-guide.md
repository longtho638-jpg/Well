# MFA/2FA Setup Guide for Admin Accounts

**Date:** 2026-03-05
**Status:** ✅ Ready to Enable

---

## 🔐 Overview

Supabase Auth supports TOTP (Time-based One-Time Password) MFA out of the box.
This guide enables MFA for admin accounts.

---

## 📋 Prerequisites

- Supabase project (production)
- Admin access to Supabase Dashboard
- Admin emails configured in `.env.production.local`

---

## 🚀 Enable MFA (Production Dashboard)

### Step 1: Navigate to Auth Settings

1. Go to Supabase Dashboard → Authentication → Settings
2. Scroll to "Multi-Factor Authentication" section

### Step 2: Enable TOTP

1. Toggle "Enable TOTP" → ON
2. Set Issuer Name: `WellNexus`
3. Click "Save"

### Step 3: Enforce MFA for Admins

**Option A: Via RLS Policy (Recommended)**

```sql
-- Create policy that requires MFA for admin actions
CREATE POLICY "Admins must have MFA enabled"
ON auth.users
FOR UPDATE
USING (
    -- Allow if MFA is enabled OR user is not admin
    (
        EXISTS (
            SELECT 1 FROM auth.mfa_factors
            WHERE auth.mfa_factors.user_id = auth.users.id
            AND auth.mfa_factors.status = 'verified'
        )
        OR
        NOT EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.users.id
            AND users.email IN (
                'wellnexusvn@gmail.com',
                'doanhnhancaotuan@gmail.com',
                'billwill.mentor@gmail.com'
            )
        )
    )
);
```

**Option B: Via Supabase Dashboard**

1. Authentication → Users
2. Find admin user → Click "..." → "Manage MFA"
3. Send MFA enrollment email

---

## 📱 User Enrollment Flow

### For Admin Users:

1. **Login** with email/password
2. **Prompt**: "Enable Two-Factor Authentication"
3. **Scan QR Code** with authenticator app:
   - Google Authenticator
   - Authy
   - Microsoft Authenticator
   - 1Password
4. **Enter 6-digit code** to verify
5. **Save backup codes** (download/store securely)

### Sample Code: MFA Enrollment Component

```tsx
import { supabase } from '@/lib/supabase';

export async function enrollInMFA() {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    issuer: 'WellNexus',
  });

  if (error) throw error;

  // Show QR code to user
  return {
    qrCode: data.TOTP.qr_code,
    secret: data.TOTP.secret,
    uri: data.TOTP.uri,
  };
}

export async function verifyMFA(code: string) {
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    code,
    factorId: /* from enroll response */,
  });

  return !error;
}
```

---

## 🔧 Configuration (config.toml)

See `config.security.toml` for settings:

```toml
[auth.mfa]
totp_enabled = true
totp_issuer = "WellNexus"

[auth.mfa.admin_policy]
required_for_emails = [
  "wellnexusvn@gmail.com",
  "doanhnhancaotuan@gmail.com",
  "billwill.mentor@gmail.com"
]
```

---

## ✅ Verification Checklist

- [ ] MFA enabled in Supabase Dashboard
- [ ] TOTP issuer set to "WellNexus"
- [ ] Admin users enrolled in MFA
- [ ] Backup codes stored securely
- [ ] RLS policy enforcing MFA for admins
- [ ] Login flow updated with MFA prompt

---

## 🚨 Recovery Procedures

### Lost Device / Can't Access MFA

1. **Use Backup Codes** (provided during enrollment)
2. **Contact Super Admin** for manual reset
3. **Supabase Dashboard** → Users → Manage MFA → Reset

### MFA Bypass (Emergency Only)

```sql
-- Disable MFA requirement temporarily (SUPER ADMIN only)
ALTER SYSTEM SET app.require_mfa = off;
```

---

## 📊 Monitoring

Track MFA adoption:

```sql
-- Check MFA enrollment status
SELECT
    u.email,
    COUNT(f.id) AS mfa_factors,
    MAX(f.status) AS status
FROM auth.users u
LEFT JOIN auth.mfa_factors f ON f.user_id = u.id
WHERE u.email IN (
    'wellnexusvn@gmail.com',
    'doanhnhancaotuan@gmail.com',
    'billwill.mentor@gmail.com'
)
GROUP BY u.email;
```

---

## 🔗 References

- [Supabase MFA Docs](https://supabase.com/docs/guides/auth/auth-mfa)
- [TOTP RFC 6238](https://datatracker.ietf.org/doc/html/rfc6238)
- [OWASP MFA Guide](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html)

---

**Status:** Ready to deploy. Requires manual setup in Supabase Dashboard.
