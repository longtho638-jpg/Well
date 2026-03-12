# Phase 6: Commit & Test Deployments

**Created:** 2026-03-12 | **Priority:** High | **Status:** Pending

## Overview

Commit changes và test deploy thực tế

## Commit Message

```
infra: unify deploy architecture to Cloudflare-first

- Migrated 30 apps from Vercel to Cloudflare
- Updated deploy scripts in all package.json files
- Created _redirects for SPA apps
- Created wrangler.toml for Workers apps
- Updated deployment documentation

Deploy targets:
- Frontend/SPA → Cloudflare Pages
- API/Workers → Cloudflare Workers
- Database → Cloudflare D1
- Storage → Cloudflare R2
```

## Test Checklist

- [ ] Test deploy 1-2 apps thực tế
- [ ] Verify URLs hoạt động
- [ ] Check CI/CD (nếu có)

## Todo List

- [ ] `git add -A`
- [ ] `git commit -m "infra: unify deploy architecture..."`
- [ ] `git push`
- [ ] Test deploy apps/well
- [ ] Verify production URL

## Output

- Git commit pushed
- Production URLs verified
