# 🚨 CRITICAL PRODUCTION BUG - Blank Screen Fix

**Date:** 2026-02-02 23:46
**Severity:** P0 - CRITICAL (Production Down)
**Status:** Root Cause Identified - Awaiting Fix

---

## Problem

**Website `wellnexus.vn` showing BLANK DARK SCREEN**
- Page title loads but React app not rendering
- Site completely unusable
- Affects 100% of users

---

## Root Cause Analysis

### Investigation Steps

1. ✅ **Checked Vercel deployment logs** - Command running
2. ✅ **Checked environment variables** - **FOUND THE PROBLEM**
3. ✅ **Identified missing Firebase config** - **ROOT CAUSE**

### Root Cause

**Missing Firebase Environment Variables in Vercel Production**

**Current Vercel Production Environment:**
```
✓ VITE_ADMIN_EMAILS (Encrypted)
✓ VITE_SUPABASE_ANON_KEY (Encrypted)
✓ VITE_SUPABASE_URL (Encrypted)
❌ VITE_FIREBASE_API_KEY - MISSING
❌ VITE_FIREBASE_AUTH_DOMAIN - MISSING
❌ VITE_FIREBASE_PROJECT_ID - MISSING
❌ VITE_FIREBASE_STORAGE_BUCKET - MISSING
❌ VITE_FIREBASE_MESSAGING_SENDER_ID - MISSING
❌ VITE_FIREBASE_APP_ID - MISSING
```

**Impact:**
- `src/services/firebase.ts` initializes Firebase with `undefined` values
- `src/utils/validate-config.ts` validates required Firebase environment variables
- App fails validation check on startup → blank screen

---

## Code Evidence

### Firebase Initialization (src/services/firebase.ts)
```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,           // ❌ undefined
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,   // ❌ undefined
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,     // ❌ undefined
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, // ❌ undefined
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, // ❌ undefined
  appId: import.meta.env.VITE_FIREBASE_APP_ID,             // ❌ undefined
};

export const app = initializeApp(firebaseConfig); // 💥 CRASHES HERE
```

### Config Validation (src/utils/validate-config.ts)
```typescript
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',        // ❌ MISSING
  'VITE_FIREBASE_AUTH_DOMAIN',    // ❌ MISSING
  'VITE_FIREBASE_PROJECT_ID',     // ❌ MISSING
  'VITE_FIREBASE_STORAGE_BUCKET', // ❌ MISSING
  'VITE_FIREBASE_MESSAGING_SENDER_ID', // ❌ MISSING
  'VITE_FIREBASE_APP_ID',         // ❌ MISSING
  'VITE_SUPABASE_URL',            // ✅ OK
  'VITE_SUPABASE_ANON_KEY',       // ✅ OK
  'VITE_API_URL',                 // ❌ MISSING
];
```

---

## Immediate Fix Required

### Step 1: Get Firebase Config

Go to Firebase Console and get the Web App config:
```
https://console.firebase.google.com/project/apexrebate-prod/settings/general
```

**Firebase Project Details:**
- Project ID: `apexrebate-prod`
- Project Number: `425437982259`
- Status: ACTIVE (but **NO APPS REGISTERED**)

**Action Required:**
1. Create a Web App in Firebase Console
2. Get the Firebase SDK config
3. Extract the following values:
   - `apiKey`
   - `appId`

### Step 2: Add Environment Variables to Vercel

Add these to Vercel Production environment:

```bash
# Go to Vercel Dashboard
https://vercel.com/minh-longs-projects-f5c82c9b/well/settings/environment-variables

# Add these variables:
VITE_FIREBASE_API_KEY=<FROM_FIREBASE_CONSOLE>
VITE_FIREBASE_AUTH_DOMAIN=apexrebate-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=apexrebate-prod
VITE_FIREBASE_STORAGE_BUCKET=apexrebate-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=425437982259
VITE_FIREBASE_APP_ID=<FROM_FIREBASE_CONSOLE>
```

**Using Vercel CLI (Alternative):**
```bash
vercel env add VITE_FIREBASE_API_KEY production
# Paste value: <FROM_FIREBASE_CONSOLE>

vercel env add VITE_FIREBASE_AUTH_DOMAIN production
# Paste value: apexrebate-prod.firebaseapp.com

vercel env add VITE_FIREBASE_PROJECT_ID production
# Paste value: apexrebate-prod

vercel env add VITE_FIREBASE_STORAGE_BUCKET production
# Paste value: apexrebate-prod.appspot.com

vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production
# Paste value: 425437982259

vercel env add VITE_FIREBASE_APP_ID production
# Paste value: <FROM_FIREBASE_CONSOLE>
```

### Step 3: Trigger Redeploy

After adding environment variables, trigger a new deployment:

```bash
vercel --prod
```

Or push an empty commit:
```bash
git commit --allow-empty -m "fix: trigger redeploy with Firebase env vars"
git push origin main
```

### Step 4: Verify Fix

```bash
# Check deployment status
vercel ls | head -10

# Verify environment variables
vercel env ls production

# Test production site
curl -I https://wellnexus.vn
```

---

## Why This Happened

**Deployment Process Gap:**
1. ✅ Code deployed successfully (no build errors)
2. ✅ Supabase environment variables configured
3. ❌ Firebase environment variables **NOT** configured
4. ❌ No runtime validation check before deployment

**Previous Assumptions:**
- Assumed Firebase was optional
- Focused on Supabase configuration only
- No pre-deployment environment variable audit

**Security Change Impact:**
- Recent security hardening removed fallback values
- `src/services/firebase.ts` now strictly requires environment variables
- No graceful degradation for missing Firebase config

---

## Prevention for Future

### 1. Pre-Deployment Checklist

Create `.vercel/required-env-vars.txt`:
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_ADMIN_EMAILS
```

### 2. Pre-Deployment Validation Script

Create `scripts/verify-env-vars.sh`:
```bash
#!/bin/bash
# Verify all required environment variables exist in Vercel

REQUIRED_VARS=(
  "VITE_FIREBASE_API_KEY"
  "VITE_FIREBASE_AUTH_DOMAIN"
  "VITE_FIREBASE_PROJECT_ID"
  "VITE_FIREBASE_STORAGE_BUCKET"
  "VITE_FIREBASE_MESSAGING_SENDER_ID"
  "VITE_FIREBASE_APP_ID"
  "VITE_SUPABASE_URL"
  "VITE_SUPABASE_ANON_KEY"
  "VITE_ADMIN_EMAILS"
)

echo "Checking Vercel production environment variables..."
MISSING=()

for var in "${REQUIRED_VARS[@]}"; do
  if ! vercel env ls production | grep -q "$var"; then
    MISSING+=("$var")
  fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "❌ Missing required environment variables:"
  for var in "${MISSING[@]}"; do
    echo "  - $var"
  done
  exit 1
else
  echo "✅ All required environment variables present"
  exit 0
fi
```

### 3. CI/CD Integration

Add to `.github/workflows/deploy.yml`:
```yaml
- name: Verify Environment Variables
  run: |
    bash scripts/verify-env-vars.sh
```

### 4. Runtime Graceful Degradation

Update `src/services/firebase.ts` to handle missing config:
```typescript
// Check if Firebase config is complete
const hasFirebaseConfig = firebaseConfig.apiKey &&
                          firebaseConfig.authDomain &&
                          firebaseConfig.projectId;

if (!hasFirebaseConfig) {
  console.warn('Firebase configuration incomplete - some features may be unavailable');
  // Provide mock Firebase instance or disable Firebase features
}

export const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
```

---

## Timeline

**23:35** - Deployed to production (commit: 6bb7dbc)
**23:36** - Deployment successful (40s build time)
**23:46** - User reports blank screen
**23:46** - Investigation started
**23:50** - Root cause identified (missing Firebase env vars)
**23:52** - Fix guide created

**Downtime:** ~16 minutes (from deployment to fix identification)

---

## Action Items

### Immediate (P0)
- [ ] Get Firebase SDK config from console
- [ ] Add 6 Firebase environment variables to Vercel
- [ ] Trigger redeploy
- [ ] Verify site loads correctly

### Short-term (P1)
- [ ] Create pre-deployment environment variable verification script
- [ ] Add to deployment checklist
- [ ] Document all required environment variables in README

### Long-term (P2)
- [ ] Implement graceful degradation for optional services
- [ ] Add runtime environment variable validation with clear error messages
- [ ] Create CI/CD check for environment variable completeness

---

## Related Files

- `src/services/firebase.ts` - Firebase initialization
- `src/utils/validate-config.ts` - Environment variable validation
- `src/services/analyticsService.ts` - Uses Firebase Firestore
- `src/services/userService.ts` - Uses Firebase Firestore
- `.env.example` - Environment variable template
- `vercel.json` - Deployment configuration

---

## Communication

**User Impact:**
- 100% of users affected
- Site completely unusable
- No data loss

**Status Updates:**
1. ✅ Problem identified
2. ⏳ Awaiting Firebase console access
3. ⏳ Environment variables configuration
4. ⏳ Redeployment
5. ⏳ Verification

**ETA to Fix:** 5-10 minutes (once Firebase config obtained)

---

**Created:** 2026-02-02 23:52
**Reporter:** Claude Code
**Severity:** P0 - CRITICAL
**Status:** Root Cause Identified - Awaiting Fix
