# WellNexus Vercel Deployment Guide

**Version:** 1.0.0
**Last Updated:** 2025-11-21
**Platform:** Vercel

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Initial Setup](#initial-setup)
4. [Environment Variables](#environment-variables)
5. [Deployment](#deployment)
6. [Navigation Testing](#navigation-testing)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Troubleshooting](#troubleshooting)

---

## Overview

WellNexus MVP is deployed on Vercel with automatic deployments from GitHub. This guide covers:

- Setting up the Vercel project
- Configuring environment variables
- Deploying to production
- Testing navigation paths
- Verifying deployment health

---

## Prerequisites

- GitHub repository access
- Vercel account (free tier works for MVP)
- Node.js 18+ installed locally (for testing)
- Git access to the repository

---

## Initial Setup

### 1. Connect GitHub Repository to Vercel

1. **Login to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Sign Up" or "Login"
   - Choose "Continue with GitHub"

2. **Import Project:**
   - Click "Add New Project"
   - Select "Import Git Repository"
   - Find and select `longtho638-jpg/Well` repository
   - Click "Import"

3. **Configure Project:**
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (leave default)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. **Click "Deploy"**

### 2. Verify `vercel.json` Configuration

The project already has `vercel.json` configured:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Key Configuration:**
- `rewrites`: Ensures all routes redirect to `index.html` for React Router SPA routing
- `framework: "vite"`: Optimizes build for Vite projects

---

## Environment Variables

### Required Environment Variables

Add these in the Vercel dashboard:

1. **Go to Project Settings:**
   - Navigate to your project in Vercel
   - Click "Settings" tab
   - Click "Environment Variables" in sidebar

2. **Add Variables:**

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_SUPABASE_URL` | `your_supabase_url` | All |
| `VITE_SUPABASE_ANON_KEY` | `your_supabase_anon_key` | All |
| `VITE_ENVIRONMENT` | `production` | Production only |
| `VITE_APP_VERSION` | `1.0.0-seed` | All |

### How to Add Environment Variables

**Step-by-Step:**

1. Click "Add New" in Environment Variables section
2. Enter variable name: `VITE_SUPABASE_URL`
3. Select environment(s): Check "Production", "Preview", and "Development"
4. Enter the value
5. Click "Save"
6. Repeat for `VITE_SUPABASE_ANON_KEY`

**Important Notes:**
- ⚠️ Vite requires `VITE_` prefix for environment variables
- Variables are encrypted at rest in Vercel
- Changing variables requires redeployment to take effect
- **GEMINI_API_KEY** is NO LONGER set here. It is managed in Supabase Edge Functions.

### Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Get API Key"
3. Click "Create API key in new project"
4. Copy the generated key
5. Set in Supabase: `supabase secrets set GEMINI_API_KEY=...`

---

## Deployment

### Automatic Deployment

Vercel automatically deploys on every push to GitHub:

- **Production:** Pushes to `main` branch
- **Preview:** Pushes to any other branch or Pull Requests

### Manual Deployment via Vercel CLI

**Install Vercel CLI:**

```bash
npm install -g vercel
```

**Login:**

```bash
vercel login
```

**Deploy to Preview:**

```bash
vercel
```

**Deploy to Production:**

```bash
vercel --prod
```

### Deployment Status

**Check Deployment Status:**
1. Go to Vercel Dashboard
2. Click on your project
3. View "Deployments" tab
4. Look for:
   - ✅ **Ready** - Deployment successful
   - 🔄 **Building** - Deployment in progress
   - ❌ **Error** - Deployment failed

**Deployment URL:**
- Production: `https://wellnexus-mvp.vercel.app` (or custom domain)
- Preview: `https://well-[git-branch]-[username].vercel.app`

---

## Navigation Testing

### Critical Navigation Paths to Test

After deployment, verify these routes work correctly:

#### 1. **Landing Page**
- **URL:** `/`
- **Expected:** Marketing landing page with CTA buttons
- **Test:**
  ```bash
  curl -I https://your-project.vercel.app/
  # Should return: HTTP/2 200
  ```

#### 2. **Dashboard**
- **URL:** `/dashboard`
- **Expected:** Dashboard overview with stats
- **Test:** Click "Get Started" button from landing page

#### 3. **Marketplace**
- **URL:** `/dashboard/marketplace`
- **Expected:** Product catalog with 3 products
- **Test:** Navigate from sidebar or direct URL access

#### 4. **Commission Wallet**
- **URL:** `/dashboard/wallet`
- **Expected:** Transaction history and wallet balance
- **Test:** Navigate from sidebar

#### 5. **Product Detail**
- **URL:** `/dashboard/product/:id`
- **Expected:** Individual product page with details
- **Test:** Click any product card in marketplace

#### 6. **Referral Page**
- **URL:** `/dashboard/referral`
- **Expected:** Referral link and share options
- **Test:** Navigate from sidebar

#### 7. **Leader Dashboard**
- **URL:** `/dashboard/leader`
- **Expected:** Team analytics and leaderboard
- **Test:** Navigate from sidebar

### Automated Navigation Test Script

Create `scripts/test-navigation.sh`:

```bash
#!/bin/bash

# WellNexus Navigation Test Script
# Usage: ./scripts/test-navigation.sh https://your-project.vercel.app

BASE_URL=${1:-"https://wellnexus-mvp.vercel.app"}

echo "Testing navigation paths for: $BASE_URL"
echo "========================================="

# Test routes
ROUTES=(
  "/"
  "/dashboard"
  "/dashboard/marketplace"
  "/dashboard/wallet"
  "/dashboard/referral"
  "/dashboard/leader"
  "/dashboard/product/1"
)

PASSED=0
FAILED=0

for route in "${ROUTES[@]}"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$route")

  if [ "$STATUS" -eq 200 ]; then
    echo "✅ $route - OK ($STATUS)"
    ((PASSED++))
  else
    echo "❌ $route - FAILED ($STATUS)"
    ((FAILED++))
  fi
done

echo "========================================="
echo "Results: $PASSED passed, $FAILED failed"

if [ $FAILED -eq 0 ]; then
  echo "🎉 All navigation tests passed!"
  exit 0
else
  echo "⚠️  Some navigation tests failed"
  exit 1
fi
```

**Run Test:**

```bash
chmod +x scripts/test-navigation.sh
./scripts/test-navigation.sh https://your-project.vercel.app
```

---

## Post-Deployment Verification

### Deployment Checklist

After deployment, verify the following:

- [ ] **Build Success:** Check Vercel dashboard shows "Ready" status
- [ ] **Homepage Loads:** Visit production URL
- [ ] **Navigation Works:** Test all routes from navigation menu
- [ ] **Product Images Load:** Check marketplace product cards
- [ ] **AI Coach Works:** Test AI coaching feature (requires API key)
- [ ] **Responsive Design:** Test on mobile, tablet, desktop
- [ ] **Performance:** Check Lighthouse score (target: 90+)
- [ ] **Console Errors:** Open browser DevTools, check for errors
- [ ] **Environment Variables:** Verify VITE_GEMINI_API_KEY is set

### Performance Verification

**Run Lighthouse Audit:**

1. Open production URL in Chrome
2. Open DevTools (F12)
3. Go to "Lighthouse" tab
4. Click "Analyze page load"
5. Check scores:
   - Performance: 90+
   - Accessibility: 85+
   - Best Practices: 90+
   - SEO: 90+

**Vercel Analytics:**

1. Go to Vercel Dashboard
2. Click "Analytics" tab
3. Monitor:
   - Page views
   - Core Web Vitals (LCP, FID, CLS)
   - Visitor locations

### Health Check Endpoints

**Test API Health (if backend is deployed):**

```bash
# Check API health
curl https://your-api.vercel.app/api/health

# Expected response:
# {"status":"ok","timestamp":"2025-11-21T..."}
```

---

## Troubleshooting

### Issue: Build Fails on Vercel

**Symptoms:** Deployment shows "Error" status

**Solutions:**

1. **Check Build Logs:**
   - Go to Vercel Dashboard → Deployments
   - Click on failed deployment
   - Review build logs for errors

2. **Common Causes:**
   - Missing dependencies: Run `npm install` locally to verify
   - TypeScript errors: Run `npm run build` locally
   - Environment variables missing: Check Vercel settings

3. **Fix and Redeploy:**
   ```bash
   git add .
   git commit -m "fix: Resolve build errors"
   git push origin main
   ```

### Issue: Routes Return 404

**Symptoms:** Direct URL access shows 404 error

**Solutions:**

1. **Verify `vercel.json` exists:**
   ```bash
   cat vercel.json
   ```

2. **Check rewrites configuration:**
   ```json
   "rewrites": [
     {
       "source": "/(.*)",
       "destination": "/index.html"
     }
   ]
   ```

3. **Redeploy if configuration was changed**

### Issue: Environment Variables Not Working

**Symptoms:** AI Coach shows fallback messages, API calls fail

**Solutions:**

1. **Verify Variables in Vercel:**
   - Go to Settings → Environment Variables
   - Ensure `VITE_GEMINI_API_KEY` exists
   - Check it's enabled for Production environment

2. **Redeploy After Adding Variables:**
   - Vercel requires redeployment for variables to take effect
   - Go to Deployments → Latest → Redeploy

3. **Test Variable Access:**
   ```javascript
   console.log('API Key exists:', !!import.meta.env.VITE_GEMINI_API_KEY);
   ```

### Issue: Slow Page Load

**Symptoms:** Pages take >3 seconds to load

**Solutions:**

1. **Enable Compression:** (Vercel enables by default)
2. **Check Bundle Size:**
   ```bash
   npm run build
   # Review dist/ file sizes
   ```

3. **Optimize Images:**
   - Use WebP format
   - Compress images before uploading

4. **Code Splitting:**
   - Implement React lazy loading for large components
   ```javascript
   const Dashboard = lazy(() => import('./pages/Dashboard'));
   ```

### Issue: AI Coach Not Responding

**Symptoms:** AI Coach widget shows "Fallback message"

**Solutions:**

1. **Verify API Key:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Check API key is valid and not expired
   - Verify API quota not exceeded

2. **Check Browser Console:**
   - Look for CORS errors
   - Look for API request failures

3. **Test API Key Locally:**
   ```bash
   VITE_GEMINI_API_KEY=your_key npm run dev
   ```

---

## Vercel-Specific Features

### Preview Deployments

Every pull request gets a unique preview URL:

- **URL Format:** `https://well-pr-123-username.vercel.app`
- **Benefits:**
  - Test changes before merging
  - Share with stakeholders
  - QA testing on live environment

### Deployment Protection

**Enable Deployment Protection (Recommended for Production):**

1. Go to Settings → Deployment Protection
2. Enable "Vercel Authentication"
3. Only authenticated users can access preview deployments

### Custom Domains

**Add Custom Domain:**

1. Go to Settings → Domains
2. Enter domain: `wellnexus.vn`
3. Follow DNS configuration:
   - Type: `A`
   - Name: `@`
   - Value: `76.76.21.21` (Vercel IP)
4. Or use CNAME:
   - Type: `CNAME`
   - Name: `www`
   - Value: `cname.vercel-dns.com`

**SSL Certificate:**
- Automatically provisioned by Vercel
- Renews automatically

### Edge Functions

For future backend features, Vercel supports Edge Functions:

```javascript
// api/hello.js
export default function handler(req, res) {
  res.status(200).json({ message: 'Hello from Edge!' });
}
```

---

## Rollback Procedures

### Instant Rollback

1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "⋯" menu
4. Click "Promote to Production"
5. Confirm rollback

**No downtime** - rollback is instant!

### Git-Based Rollback

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force origin main
```

---

## Performance Optimization

### Vercel Analytics

**Enable Analytics:**

1. Go to Analytics tab
2. Click "Enable Analytics"
3. Monitor:
   - Real User Monitoring (RUM)
   - Core Web Vitals
   - Page views

### Speed Insights

**Enable Speed Insights:**

1. Go to Speed Insights tab
2. Collect real-world performance data
3. Identify slow pages and bottlenecks

---

## Security Best Practices

### Environment Variables Security

- ✅ Never commit `.env` files to Git
- ✅ Use Vercel encrypted environment variables
- ✅ Rotate API keys regularly (90 days)
- ✅ Use separate keys for production/preview

### Content Security Policy (CSP)

Add CSP headers in `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
        }
      ]
    }
  ]
}
```

---

## Monitoring & Alerts

### Vercel Monitoring

**Set Up Alerts:**

1. Go to Settings → Notifications
2. Configure alerts for:
   - Deployment failures
   - High error rates
   - Performance degradation

**Email Notifications:**
- Enable email notifications for deployment status
- Add team members to notification list

---

## Cost Management

### Vercel Pricing Tiers

- **Hobby (Free):**
  - 100 GB bandwidth/month
  - 6,000 build minutes/month
  - Automatic HTTPS
  - Perfect for MVP

- **Pro ($20/month):**
  - 1 TB bandwidth/month
  - 24,000 build minutes/month
  - Team collaboration
  - Advanced analytics

**Cost Optimization Tips:**

1. Use image optimization
2. Enable caching headers
3. Monitor bandwidth usage
4. Remove unused dependencies

---

## Support & Resources

### Vercel Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Vite on Vercel](https://vercel.com/docs/frameworks/vite)
- [Environment Variables](https://vercel.com/docs/environment-variables)

### Community Support
- [Vercel Discord](https://vercel.com/discord)
- [Vercel GitHub Discussions](https://github.com/vercel/vercel/discussions)

### Project-Specific Resources
- **GitHub Repository:** `longtho638-jpg/Well`
- **Project Documentation:** `README.md`, `CLAUDE.md`
- **Design System:** `DESIGN_SYSTEM.md`

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-21
**Maintained By:** WellNexus Team

For questions or issues, refer to project README or contact the development team.
