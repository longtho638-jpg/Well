# GitHub Secrets Setup for Cloudflare Pages

> **Mục đích:** Cấu hình GitHub Secrets để enable CI/CD pipeline deploy lên Cloudflare Pages.
>
> **Status:** ✅ Ready to configure | **Last Updated:** 2026-03-06

---

## 🔐 Required Secrets

Configure these in GitHub → Settings → Secrets and variables → Actions → New repository secret:

### Cloudflare (Required for CD Pipeline)

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `CLOUDFLARE_API_TOKEN` | API token for Cloudflare Pages deployment | 1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)<br>2. Create API Token → "Edit Cloudflare Pages"<br>3. Copy token value |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare Account ID | 1. Go to Cloudflare Dashboard<br>2. Right sidebar → Account ID<br>3. Copy the 32-character ID |

### Supabase (Required for Build)

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `VITE_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key | Supabase Dashboard → Settings → API → anon public key |

### Optional (Email & AI)

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `VITE_RESEND_API_KEY` | Resend email API key | [Resend Dashboard](https://resend.com/api-keys) |
| `VITE_GEMINI_API_KEY` | Google Gemini API key | [Google AI Studio](https://aistudio.google.com/apikey) |

### RaaS License (Optional)

| Secret Name | Description | Format |
|-------------|-------------|--------|
| `RAAS_LICENSE_KEY` | RaaS license for production features | `RAAS-{timestamp}-{hash}` |

---

## 📋 Step-by-Step Instructions

### Step 1: Tạo Cloudflare API Token

1. **Truy cập:** https://dash.cloudflare.com/profile/api-tokens
2. **Create Token:** Click "Create Token"
3. **Template:** Chọn "Edit Cloudflare Pages"
4. **Account:** Chọn account của WellNexus
5. **TTL:** No expiration (hoặc 90 days)
6. **Generate:** Click "Continue to summary" → "Create Token"
7. **Copy:** Lưu token ngay (sẽ không hiển thị lại)

### Step 2: Lấy Cloudflare Account ID

1. **Dashboard:** https://dash.cloudflare.com
2. **Sidebar phải:** Account ID (36 ký tự)
3. **Copy:** Click icon copy

### Step 3: Lấy Supabase Credentials

1. **Dashboard:** https://supabase.com/dashboard
2. **Chọn project** → Settings (⚙️) → API
3. **Copy:**
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon/public` key → `VITE_SUPABASE_ANON_KEY`

### Step 4: Configure GitHub Secrets

**URL:** https://github.com/longtho638-jpg/Well/settings/secrets/actions

Click **"New repository secret"** cho mỗi secret:

```
Name:  CLOUDFLARE_API_TOKEN
Value: <paste token từ Step 1>
---
Name:  CLOUDFLARE_ACCOUNT_ID
Value: <paste từ Step 2>
---
Name:  VITE_SUPABASE_URL
Value: https://your-project.supabase.co
---
Name:  VITE_SUPABASE_ANON_KEY
Value: <paste từ Step 3>
---
Name:  VITE_RESEND_API_KEY
Value: re_xxxxxxxxxxxxx (optional)
---
Name:  VITE_GEMINI_API_KEY
Value: AIza... (optional)
```

---

## 🔄 CI/CD Workflow Flow

```
push to main
  ↓
CI Pipeline (ci.yml)
├── Tests Part 1 (utils/lib/services)
├── Tests Part 2 (agents/components)
├── E2E Tests (Playwright)
├── Build project
└── Upload artifacts
  ↓
CD Pipeline (cloudflare-deploy.yml)
├── Deploy to Cloudflare Pages
└── Smoke test production
  ↓
✅ Live: https://wellnexus.pages.dev
```

---

## ✅ Verification

After configuring secrets, trigger deployment:

```bash
# Option 1: Empty commit để trigger
git commit --allow-empty -m "chore: trigger CI/CD verification"
git push origin main

# Option 2: Manual workflow via GitHub UI
# Actions → CI Pipeline → Run workflow → main branch
```

### Check Status

```bash
# List recent runs
gh run list --repo longtho638-jpg/Well -L 5

# Watch running workflow
gh run watch <RUN_ID> --repo longtho638-jpg/Well

# View logs
gh run view <RUN_ID> --repo longtho638-jpg/Well --log
```

### Expected Result

```
✅ CI Pipeline: All tests pass
✅ CD Pipeline: Deploy to Cloudflare Pages
✅ Smoke Test: HTTP 200 from https://wellnexus.pages.dev
```

---

## 🐛 Troubleshooting

### "Missing CLOUDFLARE_API_TOKEN"

**Fix:**
1. Verify secret name: `CLOUDFLARE_API_TOKEN` (exact match)
2. Re-enter token value
3. Check token has "Edit Cloudflare Pages" permission

### "Invalid API Token"

**Fix:**
1. Regenerate token with "Edit Cloudflare Pages" template
2. Update secret với token mới
3. Retry workflow

### "Missing VITE_SUPABASE_URL" (Build Failure)

**Fix:**
1. Add secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
2. Verify `.github/workflows/cd.yml` has:
   ```yaml
   env:
     VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
     VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
   ```

### wrangler.toml Configuration Error

**Problem:** `[build]` or `[site]` section not supported for Pages

**Fix:** Remove these sections from `wrangler.toml`:
```toml
# ❌ REMOVE for Pages:
[build]
command = "npm run build"

[site]
bucket = "./dist"
```

---

## 📊 Workflow Files Reference

| File | Purpose | Secrets Used |
|------|---------|--------------|
| `.github/workflows/ci.yml` | CI: Tests + Build | None |
| `.github/workflows/cd.yml` | CD: Cloudflare Pages | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` |
| `.github/workflows/cloudflare-deploy.yml` | CD: Deploy + Smoke | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, Supabase vars |

---

## 🔗 Quick Links

- [GitHub Secrets Guide](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Supabase API Settings](https://supabase.com/dashboard/project/_/settings/api)

---

**Next Steps:** After secrets configured, push to main để verify CI/CD pipeline.
