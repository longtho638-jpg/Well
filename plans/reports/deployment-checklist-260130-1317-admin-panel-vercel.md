# Deployment Checklist: Admin Panel (Vercel)
Date: 2026-01-30
Target: Vercel Production

## 1. Pre-Deployment Checks
- [ ] **Repository Status**
    - [ ] Branch is clean (`git status` shows no uncommitted changes)
    - [ ] `main` branch is up to date with remote
    - [ ] Dependencies are locked (`package-lock.json` is committed)
    - [ ] `@supabase/supabase-js` is in `dependencies` (Verified)

- [ ] **Configuration Verification**
    - [ ] `vercel.json` exists and is valid (Verified)
        - [ ] Framework: `vite`
        - [ ] Build Command: `npm run build`
        - [ ] Output Directory: `dist`
        - [ ] Rewrites for SPA configured (`source: "/(.*)", destination: "/index.html"`)
    - [ ] `vite.config.ts` has `base: '/'` (or default)
    - [ ] TypeScript compilation passes (`npm run build` executes `tsc -b`)

- [ ] **Local Build Verification**
    - [ ] Run `npm install` to ensure clean state
    - [ ] Run `npm run build` succeeds with 0 errors
    - [ ] `dist/` folder contains `index.html` and `assets/`
    - [ ] Bundle size check: No individual chunk exceeds 500kB (except vendor/large libs if necessary)

## 2. Environment Setup (Vercel Dashboard)
- [ ] **Project Settings**
    - [ ] Framework Preset: `Vite`
    - [ ] Build Command: `npm run build`
    - [ ] Output Directory: `dist`
    - [ ] Install Command: `npm install`

- [ ] **Environment Variables**
    Ensure these are added in Vercel > Settings > Environment Variables:
    - [ ] `VITE_SUPABASE_URL`: (Value from Supabase Project Settings)
    - [ ] `VITE_SUPABASE_ANON_KEY`: (Value from Supabase Project Settings)

## 3. Post-Deployment Verification
- [ ] **Smoke Tests**
    - [ ] URL loads successfully (HTTPS)
    - [ ] No 404s on static assets (Check Network tab)
    - [ ] Security headers present (Inspect response headers)
        - [ ] `X-Frame-Options: DENY`
        - [ ] `X-Content-Type-Options: nosniff`

- [ ] **Functional Tests**
    - [ ] Login page renders
    - [ ] Authentication works (Supabase connection)
    - [ ] Dashboard data loads
    - [ ] Direct navigation to deep links works (e.g., `/dashboard/users` - tests SPA rewrites)

## 4. Rollback Procedures
- [ ] **Immediate Rollback**
    - [ ] Go to Vercel Dashboard > Deployments
    - [ ] Locate previous successful deployment
    - [ ] Click "..." > "Promote to Production" (Instant Rollback)

- [ ] **Code Revert**
    - [ ] Revert `main` branch to previous commit: `git revert HEAD`
    - [ ] Push changes to trigger new build
