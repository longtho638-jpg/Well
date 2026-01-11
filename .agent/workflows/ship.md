---
description: Ship phase - Build, deploy, and verify production
---

# /ship Workflow

## Overview
This workflow phase focuses on building for production, deploying, and verifying the live environment.

// turbo-all

## Steps

### 1. Pre-flight Cleanup
```bash
# Clean up dev artifacts
npm run dev:cleanup 2>/dev/null || true
```

### 2. Build Production
```bash
# Build for production
npm run build
```

### 3. Verify Build
```bash
# Check bundle size (target: <500KB)
du -sh dist/assets/*.js | head -5
```

### 4. Run Final Tests
```bash
# Ensure all tests pass
npm run test:run
```

### 5. Git Commit
```bash
# Stage and commit
git add .
git status
```

### 6. Deploy to Vercel
```bash
# Deploy with auto-confirm
vercel --prod --yes
```

### 7. Verify Production
- Check https://wellnexus.vn loads correctly
- Verify demo login flow works
- Test critical user journeys

## Exit Criteria
- [ ] Build successful (<205KB bundle)
- [ ] All 230 tests passing
- [ ] Deployed to production
- [ ] Live verification complete
- [ ] ĐẤT stage maintained

## Related Commands
- `.claude/commands/git/*.md`
- `.claude/commands/dev/cleanup.md`
- `.claude/agents/devops/devops-expert.md`
