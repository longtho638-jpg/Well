# 🔧 Fix CI/CD Failure - Missing CLOUDFLARE_API_TOKEN

## Problem
```
❌ ERROR: In a non-interactive environment, it's necessary to set
a CLOUDFLARE_API_TOKEN environment variable for wrangler to work.
```

**Failed Run:** 22738026440
**Workflow:** CD Pipeline → Cloudflare Pages Deploy

---

## Solution (5 Minutes)

### Step 1: Create Cloudflare API Token

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click **"Create Token"**
3. Select template: **"Edit Cloudflare Pages"**
4. Configure:
   - **Permissions:** `Pages - Edit`
   - **Account:** Select your account
   - **Project:** `wellnexus` (optional, or all projects)
5. Click **"Continue to summary"**
6. Copy the token (starts with `...`)

### Step 2: Add to GitHub Secrets

1. Go to: https://github.com/longtho638-jpg/Well/settings/secrets/actions
2. Click **"New repository secret"**
3. Add:
   ```
   Name:  CLOUDFLARE_API_TOKEN
   Value: <paste-your-token-here>
   ```
4. Click **"Add secret"**

### Step 3: Re-run Deployment

Option A - Manual trigger:
```bash
# GitHub Actions → CD Pipeline → Run workflow
```

Option B - Git push:
```bash
git commit --allow-empty -m "ci: trigger deployment"
git push origin main
```

---

## Verify Success

### Check GitHub Actions
```
✅ CI Pipeline - success
✅ CD Pipeline - success
✅ Cloudflare Pages Deploy - success
✅ Smoke Test - HTTP 200
```

### Check Production
```bash
curl -I https://wellnexus.pages.dev
# Expected: HTTP/2 200
```

---

## Troubleshooting

### "Invalid API token"
- Regenerate token at Cloudflare dashboard
- Ensure `Pages - Edit` permission selected

### "Project not found"
- Verify project name: `wellnexus`
- Check account ID matches Cloudflare account

### Still failing after fix
- Check `VITE_SUPABASE_URL` secret exists
- Check `VITE_GEMINI_API_KEY` secret exists
- Review full log at GitHub Actions

---

## Required Secrets Checklist

| Secret | Status | Purpose |
|--------|--------|---------|
| `CLOUDFLARE_API_TOKEN` | ❌ MISSING | Deploy to Cloudflare |
| `CLOUDFLARE_ACCOUNT_ID` | ? | Account identifier |
| `VITE_SUPABASE_URL` | ? | Backend API |
| `VITE_SUPABASE_ANON_KEY` | ? | Supabase auth |
| `VITE_GEMINI_API_KEY` | ? | AI features |
| `VITE_RESEND_API_KEY` | ? | Email service |

---

**Created:** 2026-03-06
**Priority:** HIGH
**ETA:** 5 minutes to fix
