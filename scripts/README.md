# Admin Setup Scripts

Automation scripts for confirming admin user email and testing admin access.

## Prerequisites

- Node.js installed
- Playwright: `npm install playwright`
- jq (for bash script): `brew install jq`
- Supabase project access

## Scripts

### 1. Confirm Admin Email via API

**File:** `confirm-admin-email-via-supabase-api.sh`

**Purpose:** Automatically confirms admin user email using Supabase Management API

**Requirements:**
- SERVICE_ROLE_KEY (from Supabase Dashboard → Settings → API)
- PROJECT_REF (from Supabase project URL)

**Usage:**
```bash
# 1. Edit script and update:
#    - PROJECT_REF
#    - SERVICE_ROLE_KEY

# 2. Run
./scripts/confirm-admin-email-via-supabase-api.sh
```

**⚠️ SECURITY WARNING:**
- SERVICE_ROLE_KEY grants FULL database access
- DO NOT commit this script with real keys to git
- Delete key from script after use
- Script is gitignored by default

---

### 2. Test Admin Login

**File:** `test-admin-login-and-verify-redirect.js`

**Purpose:** Tests admin login and verifies redirect to `/admin` dashboard

**Requirements:**
- Admin email confirmed
- Password: WellNexus@2026!

**Usage:**
```bash
# 1. Install dependencies (if not done)
npm install playwright

# 2. Run test
node scripts/test-admin-login-and-verify-redirect.js
```

**Expected Output:**
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

🎉 ADMIN LOGIN TEST PASSED!
```

**Failure Scenarios:**

1. **Redirected to /dashboard** (not /admin)
   - Issue: VITE_ADMIN_EMAILS not set in production
   - Fix: Check Vercel env vars

2. **Still on login page**
   - Issue: Email not verified or wrong password
   - Fix: Re-run confirm script or check Supabase

3. **Login error message**
   - Issue: Account doesn't exist or not confirmed
   - Fix: Check Supabase Dashboard → Authentication → Users

---

## Alternative: Manual Dashboard Method

**Fastest and safest option:**

1. Login to https://supabase.com/dashboard
2. Select project (AgencyOS or WellNexus)
3. Authentication → Users
4. Find: doanhnhancaotuan@gmail.com
5. Click "..." → "Confirm Email"
6. Run test script to verify

---

## Troubleshooting

### jq not found
```bash
brew install jq
```

### Playwright not installed
```bash
npm install playwright
```

### User not found in API response
- Wrong PROJECT_REF
- Wrong project selected
- User created in different project

### Unauthorized API error
- Wrong SERVICE_ROLE_KEY
- Key expired
- Check Dashboard → Settings → API

### Login works but wrong redirect
- Check VITE_ADMIN_EMAILS in Vercel
- Should be: `doanhnhancaotuan@gmail.com,billwill.mentor@gmail.com`

---

## Security Checklist

- [ ] SERVICE_ROLE_KEY not committed to git
- [ ] Script run on secure machine
- [ ] Key deleted after use
- [ ] Test passed and screenshot verified
- [ ] Production env vars confirmed

---

## Full Documentation

See comprehensive guide:
`plans/reports/admin-handover-complete-guide-260203-1024-with-automation-scripts.md`
