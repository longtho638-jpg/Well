# 🚀 ADMIN ACCOUNT - COMPLETE HANDOVER GUIDE & AUTOMATION SCRIPTS
**Date:** 2026-02-03 10:24
**Project:** WellNexus Distributor Portal
**Purpose:** Production admin account setup with automation options
**Status:** ✅ READY FOR CLIENT HANDOVER

---

## EXECUTIVE SUMMARY

Complete guide for confirming admin user email with 3 automation scripts:
1. **Dashboard method** (Manual, safest, 2 minutes)
2. **Service Role API script** (Automated if SERVICE_ROLE_KEY available)
3. **Post-confirmation test** (Verify admin access works)

**Current Account Status:**
```yaml
email: doanhnhancaotuan@gmail.com
password: WellNexus@2026!
status: CREATED but UNVERIFIED
blocker: Email verification required
```

---

## QUICK START (FASTEST PATH)

### Option 1: Dashboard UI (RECOMMENDED ⭐)

**Time:** 2-3 minutes | **Risk:** None | **Prerequisites:** Supabase Dashboard access

```
1. https://supabase.com/dashboard
2. Select project (AgencyOS or WellNexus production)
3. Authentication → Users
4. Find: doanhnhancaotuan@gmail.com
5. Actions (...) → "Confirm Email"
6. ✅ Test login immediately
```

### Option 2: Service Role API Script (AUTOMATED)

**Time:** 30 seconds | **Risk:** HIGH (exposes SERVICE_ROLE_KEY) | **Prerequisites:** SERVICE_ROLE_KEY

```bash
# Use script below - Section 2
bash scripts/confirm-admin-email.sh
```

---

## 1. DASHBOARD METHOD (STEP-BY-STEP)

### Access Supabase Dashboard

**URL:** https://supabase.com/dashboard

**Login Methods:**
1. GitHub OAuth (if connected)
2. Email/Password (Supabase account)
3. Google OAuth (if connected)

### Navigate to Project

```
Dashboard Home
  ↓
Select Organization: "minh-longs-projects" (or your org)
  ↓
Select Project: Look for:
  - "WellNexus" (production)
  - OR project matching Vercel env VITE_SUPABASE_URL
  - OR "AgencyOS" (if that's production)
```

**How to identify correct project:**
- Check domain: Should show `wellnexus.vn` or production domain
- Check region: Match with expected deployment region
- Check created date: Most recent if multiple exist

### Confirm Email

```
Left Sidebar → Authentication
  ↓
Top Tabs → Users
  ↓
Search bar: Type "doanhnhancaotuan"
  ↓
Find row: doanhnhancaotuan@gmail.com
  ↓
Click "..." (three dots) on right side of row
  ↓
Select: "Confirm Email"
  ↓
Modal appears → Click "Confirm"
  ↓
✅ Success message: "Email confirmed"
```

### Verify Confirmation

```sql
-- In SQL Editor (optional verification)
SELECT
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'doanhnhancaotuan@gmail.com';
```

**Expected result:**
```
email                        | email_confirmed_at          | created_at
-----------------------------|-----------------------------|--------------------------
doanhnhancaotuan@gmail.com   | 2026-02-03 10:25:00.000000  | 2026-02-03 10:05:00.000000
```

**Key:** `email_confirmed_at` should have timestamp (not NULL)

---

## 2. SERVICE ROLE API SCRIPT (AUTOMATION)

### Script: `scripts/confirm-admin-email.sh`

Save this script if you have SERVICE_ROLE_KEY:

```bash
#!/bin/bash
# confirm-admin-email.sh
# Confirms admin user email via Supabase Management API

set -e

# ============================================================================
# CONFIGURATION
# ============================================================================

ADMIN_EMAIL="doanhnhancaotuan@gmail.com"

# CRITICAL: Get these from Supabase Dashboard
# Dashboard → Settings → API → Project URL
PROJECT_REF="your-project-ref"  # e.g., "jcbahdioqoepvoliplqy"

# Dashboard → Settings → API → Project API keys → service_role (secret!)
SERVICE_ROLE_KEY="your-service-role-key-here"

# ============================================================================
# SCRIPT START
# ============================================================================

echo "🔐 Admin Email Confirmation Script"
echo "=================================="
echo ""
echo "Target: $ADMIN_EMAIL"
echo "Project: $PROJECT_REF"
echo ""

# Step 1: Get user ID
echo "📋 Step 1: Fetching user ID..."

USER_DATA=$(curl -s "https://$PROJECT_REF.supabase.co/auth/v1/admin/users" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "apikey: $SERVICE_ROLE_KEY")

USER_ID=$(echo "$USER_DATA" | jq -r ".users[] | select(.email == \"$ADMIN_EMAIL\") | .id")

if [ -z "$USER_ID" ] || [ "$USER_ID" = "null" ]; then
  echo "❌ ERROR: User not found with email $ADMIN_EMAIL"
  echo ""
  echo "Available users:"
  echo "$USER_DATA" | jq -r '.users[] | "\(.email) - \(.id)"'
  exit 1
fi

echo "✅ User found: $USER_ID"
echo ""

# Step 2: Confirm email
echo "📧 Step 2: Confirming email..."

CONFIRM_RESPONSE=$(curl -s -X PUT \
  "https://$PROJECT_REF.supabase.co/auth/v1/admin/users/$USER_ID" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email_confirm\": true}")

CONFIRMED_AT=$(echo "$CONFIRM_RESPONSE" | jq -r '.email_confirmed_at')

if [ -z "$CONFIRMED_AT" ] || [ "$CONFIRMED_AT" = "null" ]; then
  echo "❌ ERROR: Failed to confirm email"
  echo "Response: $CONFIRM_RESPONSE"
  exit 1
fi

echo "✅ Email confirmed at: $CONFIRMED_AT"
echo ""

# Step 3: Verify
echo "🔍 Step 3: Verifying confirmation..."

VERIFY_RESPONSE=$(curl -s \
  "https://$PROJECT_REF.supabase.co/auth/v1/admin/users/$USER_ID" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "apikey: $SERVICE_ROLE_KEY")

VERIFY_EMAIL=$(echo "$VERIFY_RESPONSE" | jq -r '.email')
VERIFY_CONFIRMED=$(echo "$VERIFY_RESPONSE" | jq -r '.email_confirmed_at')

echo "Email: $VERIFY_EMAIL"
echo "Confirmed at: $VERIFY_CONFIRMED"
echo ""

if [ "$VERIFY_CONFIRMED" != "null" ]; then
  echo "✅ SUCCESS: Admin email confirmed!"
  echo ""
  echo "Next steps:"
  echo "  1. Test login at: https://wellnexus.vn/login"
  echo "  2. Email: $ADMIN_EMAIL"
  echo "  3. Password: WellNexus@2026!"
  echo "  4. Should redirect to: /admin"
else
  echo "❌ VERIFICATION FAILED"
  exit 1
fi
```

### Usage

```bash
# 1. Create script
mkdir -p scripts
nano scripts/confirm-admin-email.sh
# Paste script above

# 2. Edit configuration (CRITICAL!)
# Update PROJECT_REF and SERVICE_ROLE_KEY

# 3. Make executable
chmod +x scripts/confirm-admin-email.sh

# 4. Run
./scripts/confirm-admin-email.sh
```

### Security Warning

**⚠️ CRITICAL SECURITY NOTES:**

1. **NEVER commit SERVICE_ROLE_KEY to git**
   ```bash
   # Add to .gitignore
   echo "scripts/confirm-admin-email.sh" >> .gitignore
   ```

2. **Store key securely:**
   - Use environment variable: `export SUPABASE_SERVICE_ROLE_KEY="..."`
   - Read from secure vault
   - Delete script after use

3. **SERVICE_ROLE_KEY grants FULL DATABASE ACCESS:**
   - Can bypass RLS policies
   - Can read/write ALL data
   - Can delete databases
   - Treat like root password

---

## 3. POST-CONFIRMATION TEST SCRIPT

### Script: `scripts/test-admin-login.js`

```javascript
#!/usr/bin/env node
/**
 * Admin Login Test Script
 * Tests admin account access after email confirmation
 *
 * Prerequisites:
 * - npm install playwright
 * - Admin email confirmed
 */

const { chromium } = require('playwright');

const ADMIN_EMAIL = 'doanhnhancaotuan@gmail.com';
const ADMIN_PASSWORD = 'WellNexus@2026!';
const LOGIN_URL = 'https://wellnexus.vn/login';
const ADMIN_DASHBOARD_URL = 'https://wellnexus.vn/admin';

(async () => {
  console.log('🔐 Admin Login Test');
  console.log('===================\n');

  const browser = await chromium.launch({
    headless: false,  // Show browser for debugging
    slowMo: 500       // Slow down for visibility
  });

  const page = await browser.newPage();

  try {
    // Step 1: Navigate to login
    console.log('📍 Step 1: Navigate to login page...');
    await page.goto(LOGIN_URL);
    console.log(`✅ Loaded: ${page.url()}\n`);

    // Step 2: Fill credentials
    console.log('📝 Step 2: Fill credentials...');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    console.log('✅ Credentials filled\n');

    // Step 3: Click login
    console.log('🖱️  Step 3: Click login button...');
    await page.click('button:has-text("Đăng nhập")');
    console.log('✅ Login button clicked\n');

    // Step 4: Wait for navigation
    console.log('⏳ Step 4: Waiting for redirect...');

    try {
      await page.waitForURL('**/admin', { timeout: 10000 });
      console.log('✅ Redirected to admin dashboard!\n');

      // Step 5: Verify admin page
      console.log('🔍 Step 5: Verify admin page...');
      const currentURL = page.url();
      const pageTitle = await page.title();

      console.log(`Current URL: ${currentURL}`);
      console.log(`Page Title: ${pageTitle}\n`);

      if (currentURL.includes('/admin')) {
        console.log('✅ SUCCESS: Admin access verified!\n');

        // Step 6: Screenshot
        console.log('📸 Step 6: Taking screenshot...');
        await page.screenshot({
          path: 'admin-dashboard-verified.png',
          fullPage: true
        });
        console.log('✅ Screenshot saved: admin-dashboard-verified.png\n');

        // Step 7: Check admin features
        console.log('🔍 Step 7: Checking admin features...');
        const bodyText = await page.textContent('body');

        const features = {
          'Partner Management': bodyText.includes('Partner') || bodyText.includes('Đối tác'),
          'Order Approval': bodyText.includes('Order') || bodyText.includes('Đơn hàng'),
          'Dashboard': bodyText.includes('Dashboard') || bodyText.includes('Bảng điều khiển')
        };

        console.log('Admin Features Found:');
        for (const [feature, found] of Object.entries(features)) {
          console.log(`  ${found ? '✅' : '❌'} ${feature}`);
        }

        console.log('\n🎉 ADMIN LOGIN TEST PASSED!\n');
        process.exit(0);

      } else {
        throw new Error('Not redirected to /admin');
      }

    } catch (timeoutError) {
      // Check if redirected to dashboard instead (wrong redirect)
      const currentURL = page.url();

      if (currentURL.includes('/dashboard')) {
        console.log('❌ FAILED: Redirected to /dashboard instead of /admin\n');
        console.log('Issue: User logged in but NOT detected as admin');
        console.log('Check: VITE_ADMIN_EMAILS env var in production\n');

        await page.screenshot({
          path: 'failed-dashboard-redirect.png',
          fullPage: true
        });
        console.log('Screenshot saved: failed-dashboard-redirect.png\n');
        process.exit(1);

      } else if (currentURL.includes('/login')) {
        // Still on login page - check for errors
        console.log('❌ FAILED: Still on login page\n');

        const errorText = await page.textContent('body').catch(() => '');
        if (errorText.includes('Email hoặc mật khẩu không đúng')) {
          console.log('Issue: Email still not verified OR wrong password');
          console.log('Action: Re-check email confirmation status\n');
        }

        await page.screenshot({
          path: 'failed-login-error.png',
          fullPage: true
        });
        console.log('Screenshot saved: failed-login-error.png\n');
        process.exit(1);

      } else {
        console.log(`❌ FAILED: Unexpected redirect to ${currentURL}\n`);
        process.exit(1);
      }
    }

  } catch (error) {
    console.log('❌ ERROR:', error.message);

    await page.screenshot({
      path: 'test-error.png',
      fullPage: true
    });
    console.log('Screenshot saved: test-error.png\n');

    await browser.close();
    process.exit(1);
  }

  await browser.close();
})();
```

### Usage

```bash
# 1. Install dependencies
npm install playwright

# 2. Create test script
mkdir -p scripts
nano scripts/test-admin-login.js
# Paste script above

# 3. Make executable
chmod +x scripts/test-admin-login.js

# 4. Run test (after email confirmed)
node scripts/test-admin-login.js
```

### Expected Output (Success)

```
🔐 Admin Login Test
===================

📍 Step 1: Navigate to login page...
✅ Loaded: https://wellnexus.vn/login

📝 Step 2: Fill credentials...
✅ Credentials filled

🖱️  Step 3: Click login button...
✅ Login button clicked

⏳ Step 4: Waiting for redirect...
✅ Redirected to admin dashboard!

🔍 Step 5: Verify admin page...
Current URL: https://wellnexus.vn/admin
Page Title: WellNexus 2.0 - Admin Dashboard

✅ SUCCESS: Admin access verified!

📸 Step 6: Taking screenshot...
✅ Screenshot saved: admin-dashboard-verified.png

🔍 Step 7: Checking admin features...
Admin Features Found:
  ✅ Partner Management
  ✅ Order Approval
  ✅ Dashboard

🎉 ADMIN LOGIN TEST PASSED!
```

---

## 4. ALTERNATIVE: SQL DIRECT (Dashboard SQL Editor)

If you have Supabase Dashboard access, run this SQL:

```sql
-- Confirm email
UPDATE auth.users
SET
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'doanhnhancaotuan@gmail.com'
  AND email_confirmed_at IS NULL;

-- Verify (should return 1 row with timestamp)
SELECT
  id,
  email,
  email_confirmed_at,
  created_at,
  CASE
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmed'
    ELSE '❌ Not Confirmed'
  END as status
FROM auth.users
WHERE email = 'doanhnhancaotuan@gmail.com';
```

**Navigation:**
```
Dashboard → SQL Editor → New Query → Paste SQL → Run
```

---

## 5. TROUBLESHOOTING

### Issue 1: "User not found"

**Symptoms:** Script can't find doanhnhancaotuan@gmail.com

**Causes:**
1. Wrong project selected
2. User created in different project
3. Typo in email

**Fix:**
```bash
# List all users
curl "https://$PROJECT_REF.supabase.co/auth/v1/admin/users" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  | jq '.users[] | {email, id, confirmed: .email_confirmed_at}'
```

### Issue 2: "Unauthorized" API error

**Symptoms:** 401 Unauthorized from API

**Causes:**
1. Wrong SERVICE_ROLE_KEY
2. Expired key
3. Wrong PROJECT_REF

**Fix:**
1. Re-copy SERVICE_ROLE_KEY from Dashboard → Settings → API
2. Verify PROJECT_REF matches project URL
3. Check key has no extra spaces/newlines

### Issue 3: Login still fails after confirmation

**Symptoms:** Email confirmed but login shows "Email hoặc mật khẩu không đúng"

**Causes:**
1. Wrong password
2. Password was never set (account created via Dashboard without password)

**Fix:**
```bash
# Reset password via API
curl -X PUT \
  "https://$PROJECT_REF.supabase.co/auth/v1/admin/users/$USER_ID" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"password": "WellNexus@2026!"}'
```

### Issue 4: Redirected to /dashboard instead of /admin

**Symptoms:** Login works but goes to /dashboard

**Causes:**
1. VITE_ADMIN_EMAILS not set in production
2. Email not in whitelist
3. Case mismatch in email

**Fix:**
```bash
# Check Vercel env vars
vercel env ls

# Should show:
# VITE_ADMIN_EMAILS = "doanhnhancaotuan@gmail.com,billwill.mentor@gmail.com"

# If missing, add:
vercel env add VITE_ADMIN_EMAILS
# Enter value: doanhnhancaotuan@gmail.com,billwill.mentor@gmail.com
# Select: Production
```

---

## 6. SECURITY CHECKLIST

### Before Running Scripts

- [ ] SERVICE_ROLE_KEY stored securely (not in git)
- [ ] Scripts run on secure machine (not shared/public)
- [ ] SERVICE_ROLE_KEY will be deleted after use
- [ ] Backup created before running SQL

### After Confirming Email

- [ ] Test login successful
- [ ] Redirect to /admin verified
- [ ] Admin features accessible
- [ ] Service role key deleted from local machine
- [ ] Scripts removed or .gitignored

### Production Security

- [ ] VITE_ADMIN_EMAILS configured in Vercel
- [ ] Admin emails verified (only trusted users)
- [ ] RLS policies applied to all tables
- [ ] Service role key rotated periodically
- [ ] Admin actions logged (audit trail)

---

## 7. HANDOVER CHECKLIST

### For Client

- [ ] Supabase Dashboard access confirmed
- [ ] Project identified (AgencyOS or WellNexus)
- [ ] Admin email confirmed (via Dashboard or SQL)
- [ ] Test login successful
- [ ] Admin panel accessible
- [ ] Screenshots taken for verification
- [ ] Password securely stored (password manager)

### For Development Team

- [ ] All reports delivered:
  - [ ] Signup attempt report
  - [ ] Login test report
  - [ ] CLI investigation report
  - [ ] This handover guide

- [ ] Scripts provided:
  - [ ] confirm-admin-email.sh (if SERVICE_ROLE_KEY available)
  - [ ] test-admin-login.js (post-confirmation)

- [ ] Documentation updated:
  - [ ] Admin setup process documented
  - [ ] Troubleshooting guide included

---

## 8. RELATED DOCUMENTATION

### Previous Reports

1. **Signup Attempt:**
   `admin-account-creation-260203-1005-signup-verification-required.md`

2. **Login Test:**
   `admin-login-260203-0948-production-verification-test.md`

3. **CLI Investigation:**
   `supabase-cli-admin-confirmation-260203-1013-alternative-methods-required.md`

4. **Database Audit:**
   `data-audit-260203-0942-production-handover-database-cleanup.md`

### Code Files

```
Authentication:
- src/hooks/useAuth.ts - Supabase authentication
- src/hooks/useLogin.ts - Login logic with admin redirect
- src/utils/admin-check.ts - Admin email whitelist

Pages:
- src/pages/Login.tsx - Login UI
- src/pages/Signup.tsx - Signup form
- src/pages/admin/Admin.tsx - Admin dashboard

Configuration:
- .env.example - Environment template
- VITE_ADMIN_EMAILS - Admin whitelist
```

---

## 9. QUICK REFERENCE

### API Endpoints

```bash
# List users
GET https://{project-ref}.supabase.co/auth/v1/admin/users

# Get user by ID
GET https://{project-ref}.supabase.co/auth/v1/admin/users/{user-id}

# Update user (confirm email)
PUT https://{project-ref}.supabase.co/auth/v1/admin/users/{user-id}
Body: {"email_confirm": true}

# Update password
PUT https://{project-ref}.supabase.co/auth/v1/admin/users/{user-id}
Body: {"password": "new-password"}
```

### Dashboard Paths

```
Project Selection: dashboard.supabase.com → Select Org → Select Project
Authentication: Left Sidebar → Authentication → Users
SQL Editor: Left Sidebar → SQL Editor → New Query
Settings: Left Sidebar → Settings → API
```

### Environment Variables

```bash
# Vercel (Production)
VITE_SUPABASE_URL=https://{project-ref}.supabase.co
VITE_SUPABASE_ANON_KEY={anon-key}
VITE_ADMIN_EMAILS=doanhnhancaotuan@gmail.com,billwill.mentor@gmail.com

# Supabase (Dashboard → Settings → API)
PROJECT_REF={project-ref}
ANON_KEY={public-safe}
SERVICE_ROLE_KEY={admin-full-access - NEVER expose!}
```

---

## 10. CONCLUSION

**Summary:**

✅ **3 Methods Provided:**
1. Dashboard UI (Manual, safest)
2. Service Role API (Automated with key)
3. SQL Direct (Dashboard SQL Editor)

✅ **2 Scripts Created:**
1. `confirm-admin-email.sh` - Automation script
2. `test-admin-login.js` - Verification test

✅ **Complete Documentation:**
- Step-by-step Dashboard guide
- API script with security warnings
- Test script with detailed logging
- Troubleshooting for common issues
- Security checklist

**Recommended Path:**
1. Use **Dashboard Method** (Section 1) - Safest, fastest
2. Run **Test Script** (Section 3) - Verify access works
3. Archive **reports/** - Handover complete

**Next Action:**
Client confirms email via Dashboard → Runs test script → Reports success with screenshot → Handover complete! 🎉

---

**Report Generated:** 2026-02-03 10:24
**Type:** Comprehensive Handover Guide with Automation
**Status:** ✅ READY FOR CLIENT
**Contains:** Dashboard guide + 2 automation scripts + Troubleshooting + Security checklist

---

**END OF GUIDE**
