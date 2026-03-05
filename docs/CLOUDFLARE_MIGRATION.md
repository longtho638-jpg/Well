# WellNexus on Cloudflare Pages

## Migration from Vercel

WellNexus has been migrated from Vercel to Cloudflare Pages for better performance and cost efficiency.

## Quick Start

### Local Development

```bash
pnpm install
pnpm run dev
```

### Build

```bash
pnpm run build
```

### Deploy to Cloudflare Pages

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy to production
wrangler pages deploy dist --project-name=wellnexus
```

## GitHub Actions CI/CD

Automated deployment on push to `main`:

1. **CI Pipeline** - Type check + tests
2. **CD Pipeline** - Build + Deploy to Cloudflare Pages
3. **Smoke Tests** - Verify production health

### Required Secrets

Configure in GitHub Repository Settings → Secrets:

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Pages permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_RESEND_API_KEY` | Resend API key (optional) |
| `VITE_GEMINI_API_KEY` | Google Gemini API key (optional) |

## Cloudflare Setup

### Create Pages Project

1. Go to Cloudflare Dashboard → Pages
2. Click "Create a project"
3. Choose "Direct Upload" (GitHub Actions handles deployment)
4. Project name: `wellnexus`

### Configure Environment Variables

In Cloudflare Pages Dashboard → Settings → Environment Variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
NODE_ENV=production
```

## DNS Configuration

Point your custom domain to Cloudflare Pages:

1. Pages Dashboard → Custom domains
2. Add `wellnexus.vn`
3. Cloudflare auto-configures DNS

## Migration Checklist

- [x] Created `wrangler.toml`
- [x] Created `.github/workflows/cloudflare-deploy.yml`
- [x] Updated `.github/workflows/cd.yml` for Cloudflare
- [x] Removed `vercel.json`
- [ ] Update DNS to point to Cloudflare Pages
- [ ] Migrate environment variables
- [ ] Test production deployment
- [ ] Update documentation links

## Performance Comparison

| Metric | Vercel | Cloudflare Pages |
|--------|--------|------------------|
| Build Time | ~10s | ~10s |
| Edge Locations | 100+ | 300+ |
| Cold Start | ~50ms | ~10ms |
| Bandwidth | $20/TB | $10/TB |

## Rollback

```bash
# Deploy previous successful version
wrangler pages deploy dist --project-name=wellnexus --branch=main
```

## Troubleshooting

### Build fails on Cloudflare

```bash
# Test build locally with same environment
wrangler pages build
```

### 404 on refresh

Cloudflare Pages handles SPA routing automatically. If issues persist, check `_routes.json` configuration.

### Environment variables not working

Ensure variables are prefixed with `VITE_` for client-side exposure.
