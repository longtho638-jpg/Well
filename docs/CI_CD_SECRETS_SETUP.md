# CI/CD Secrets Setup Guide

**Purpose:** Configure GitHub repository secrets to enable automatic deployment for WellNexus project.

**Last Updated:** 2026-03-08
**Status:** Required for auto-deploy

---

## Required Secrets

### Cloudflare Deployment (CRITICAL)

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `CLOUDFLARE_API_TOKEN` | API token for Cloudflare Pages deployment | See instructions below |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | Dashboard → Account details |

### Supabase (Required for Build)

| Secret Name | Description | Value |
|-------------|-------------|-------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key | Dashboard → Settings → API |

### Email Service (Optional)

| Secret Name | Description | Value |
|-------------|-------------|-------|
| `VITE_RESEND_API_KEY` | Resend.com API key | Resend dashboard |

### AI Services (Optional)

| Secret Name | Description | Value |
|-------------|-------------|-------|
| `VITE_GEMINI_API_KEY` | Google Gemini API key | Google AI Studio |

---

## Step-by-Step Setup

### 1. Create Cloudflare API Token

**Steps:**

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click **Create Token**
3. Select **Custom token** (or use "Cloudflare Pages" template)
4. Configure permissions:
   ```
   Account → Cloudflare Pages → Edit
   Account → Account Settings → Read
   ```
5. Click **Continue to summary**
6. Review and click **Create Token**
7. **Copy the token immediately** (won't show again)
8. Store in GitHub secret as `CLOUDFLARE_API_TOKEN`

**Note:** Token value starts with `eyJ...` (JWT format)

### 2. Get Cloudflare Account ID

**Steps:**

1. Go to https://dash.cloudflare.com
2. Look at right sidebar → Account ID
3. Or go to https://dash.cloudflare.com/profile
4. Copy Account ID (32-character string)
5. Store in GitHub secret as `CLOUDFLARE_ACCOUNT_ID`

### 3. Add Secrets to GitHub

**Steps:**

1. Go to https://github.com/longtho638-jpg/Well
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions** (left sidebar)
4. Click **New repository secret** button
5. Add each secret:

```
Name: CLOUDFLARE_API_TOKEN
Value: <paste token from step 1>
Click: Add secret

Name: CLOUDFLARE_ACCOUNT_ID
Value: <paste account ID from step 2>
Click: Add secret

Name: VITE_SUPABASE_URL
Value: https://<your-project-ref>.supabase.co
Click: Add secret

Name: VITE_SUPABASE_ANON_KEY
Value: <paste anon key>
Click: Add secret

Name: VITE_RESEND_API_KEY
Value: <paste Resend key>
Click: Add secret

Name: VITE_GEMINI_API_KEY
Value: <paste Gemini key>
Click: Add secret
```

### 4. Configure Deployment Environment (Optional but Recommended)

**Steps:**

1. Go to https://github.com/longtho638-jpg/Well/settings/environments
2. Click **New environment**
3. Name: `production`
4. Add deployment URL: `https://wellnexus.pages.dev`
5. (Optional) Add required reviewers for production deploys
6. Click **Save protection rules**

---

## Verification

After adding secrets, verify deployment:

```bash
# Trigger a test deployment
git commit --allow-empty -m "chore: trigger CD pipeline test"
git push origin main

# Monitor workflow
gh run watch
```

**Expected Result:**
- ✅ CI Pipeline: PASSED
- ✅ CD Pipeline: PASSED
- ✅ Smoke Test: PASSED
- 🌐 Production: https://wellnexus.pages.dev

---

## Troubleshooting

### Error: "CLOUDFLARE_API_TOKEN environment variable not set"

**Cause:** Secret not configured or typo in name

**Fix:**
1. Verify secret name is exactly `CLOUDFLARE_API_TOKEN` (case-sensitive)
2. Verify token is valid (not expired/revoked)
3. Re-run failed workflow from GitHub Actions tab

### Error: "Invalid API token"

**Cause:** Token doesn't have correct permissions

**Fix:**
1. Go to Cloudflare API token page
2. Verify token has **Cloudflare Pages → Edit** permission
3. Create new token if needed

### Error: "Account ID not found"

**Cause:** Wrong account ID or token from different account

**Fix:**
1. Verify Account ID matches the account that owns the token
2. Check for typos (should be 32-character hex string)

---

## Security Best Practices

1. **Never commit secrets** to codebase (already in .gitignore)
2. **Use least-privilege tokens** - only grant Pages deployment permission
3. **Rotate tokens regularly** - every 90 days recommended
4. **Enable deployment protection** - require approval for production
5. **Monitor deployment logs** - check for unauthorized deploys

---

## RaaS Gateway Integration

The deployed application integrates with:

- **RaaS Gateway:** `https://raas.agencyos.network`
- **AgencyOS Dashboard:** `https://agencyos.network`
- **Cloudflare Worker:** v2.0.0+

Ensure these URLs are accessible from Cloudflare Pages:
- Add to CORS allowlist if needed
- Configure Cloudflare Rules for API routing

---

## Contact

For access or permission issues:
- GitHub: longtho638-jpg
- Platform: AgencyOS Network
