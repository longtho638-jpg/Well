# Phase 5: Update Deploy Documentation

**Created:** 2026-03-12 | **Priority:** High | **Status:** Pending

## Overview

Update `.claude/commands/deploy.md` để phản ánh kiến trúc mới

## Changes Required

### Update Files

1. `/Users/macbookprom1/mekong-cli/.claude/commands/deploy.md`
2. `/Users/macbookprom1/mekong-cli/docs/deployment-guide.md` (nếu tồn tại)
3. Root README.md (nếu có deploy instructions)

### New Content

```markdown
## Deploy Architecture

Cloudflare-first deployment:

| App Type | Platform | Command |
|----------|----------|---------|
| Frontend/SPA | Cloudflare Pages | `npm run deploy` |
| API/Workers | Cloudflare Workers | `npm run deploy:worker` |
| Database | Cloudflare D1 | `wrangler d1 execute` |

### Per-App Deploy

Each app in `apps/` has its own deploy script:
- `cd apps/{app-name} && npm run deploy`
- Deploys to: `https://{app-name}.wellnexus.pages.dev`
```

## Todo List

- [ ] Update deploy.md commands
- [ ] Add Cloudflare setup guide
- [ ] Remove Vercel references

## Output

Updated documentation files
