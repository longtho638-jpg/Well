# GitHub Secrets Setup for Cloudflare Pages

## Required Secrets

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

### Optional (RaaS License)

| Secret Name | Description | Format |
|-------------|-------------|--------|
| `RAAS_LICENSE_KEY` | RaaS license for production features | `RAAS-{timestamp}-{hash}` |

## Setup Steps

1. **GitHub**: Go to `https://github.com/longtho638-jpg/Well/settings/secrets/actions`
2. **Add each secret**: Click "New repository secret" → Enter name + value
3. **Verify**: After adding all secrets, trigger a manual workflow run

## CI/CD Workflow

```
push to main → CI Pipeline (test-part-1, test-part-2) → CD Pipeline → Deploy to Cloudflare Pages
```

## Troubleshooting

### "The process '/home/runner/setup-pnpm/node_modules/.bin/pnpm' failed with exit code 1"

This error typically means:
- Missing `CLOUDFLARE_API_TOKEN` secret
- Invalid token permissions (needs "Edit Cloudflare Pages" scope)
- wrangler.toml configuration issues

### "Configuration file for Pages projects does not support..."

wrangler.toml for Pages should NOT contain:
- `[build]` section
- `[site]` section
- `[env.staging]` (only `preview` and `production` supported)

## Verification

After configuring secrets, run:

```bash
# Trigger workflow manually
gh workflow run ci.yml

# Or via GitHub UI: Actions → CI Pipeline → Run workflow
```

Check deployment at: https://wellnexus.pages.dev
