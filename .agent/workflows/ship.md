---
description: Ship phase - Deployment, documentation, and final polish
---

# /ship Workflow

## Overview
The final phase before production. Ensures code is secure, performant, and documented.

## Steps

### 1. Context Refresh
// turbo
```bash
# Update AI mental model
npx claudekit-hooks run codebase-map
```

### 2. Production Build
// turbo
```bash
# Build for production
npm run build
```

### 3. Security Audit
- Invoke `@security-expert` to scan for secrets and vulnerabilities.
- Check Supabase RLS policies.

### 4. Performance Check (Lighthouse)
- Verify bundle size < 500KB (initial chunk).
- Check Core Web Vitals readiness.

### 5. Deployment
// turbo
```bash
# Deploy to hosting
firebase deploy --only hosting
```

## Exit Criteria
- [ ] Build successful (Exit Code 0)
- [ ] No high-severity security issues
- [ ] Codebase map updated
- [ ] Deployed to Production URL

## Related Commands
- `.claude/commands/validate-and-fix.md`
