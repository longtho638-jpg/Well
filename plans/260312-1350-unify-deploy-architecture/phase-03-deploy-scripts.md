# Phase 3: Update Deploy Scripts — package.json

**Created:** 2026-03-12 | **Priority:** High | **Status:** Pending

## Overview

Update `package.json` của mỗi app — thay `vercel` bằng `wrangler`

## Changes Required

### Before (Vercel)
```json
{
  "scripts": {
    "deploy": "vercel --prod",
    "deploy:staging": "vercel"
  }
}
```

### After (Cloudflare)
```json
{
  "scripts": {
    "deploy": "npx wrangler pages deploy dist --project-name {app-name} --branch main",
    "deploy:staging": "npx wrangler pages deploy dist --project-name {app-name} --branch staging"
  }
}
```

## Todo List

- [ ] Update deploy script cho mỗi app
- [ ] Add `wrangler`作为 devDependency (nếu chưa có)
- [ ] Test build + deploy locally

## Output

30 package.json files updated
