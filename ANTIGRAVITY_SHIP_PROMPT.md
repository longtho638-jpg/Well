# 🚀 Antigravity IDE /ship Prompt
**For:** Antigravity IDE Agent  
**Command:** `/ship`  
**Purpose:** Prepare code for deployment  
**Duration:** < 5 minutes  

---

## 📋 NLP COMMAND PATTERN
```
USER: "ship it" / "prepare for deploy" / "/ship"
IDE:  Execute the 8-step Ship Protocol below
```

---

## ⚡ 8-STEP SHIP PROTOCOL

### STEP 1: Pre-flight Check (30 sec)
```bash
✓ Verify all uncommitted changes shown
✓ Check file count matches scope
✓ Confirm no secrets/API keys in code
✓ Display: "Ready to Ship? [Y/N]"
```

### STEP 2: Build Verification (60 sec)
```bash
npm run build
✓ Must succeed with 0 errors
✓ Show build time & output size
✗ If fails: Show error, abort ship
```

### STEP 3: Type Check (30 sec)
```bash
npx tsc --noEmit
✓ Must return 0 errors
✗ If fails: List errors, abort ship
```

### STEP 4: Compose Commit Message (60 sec)
**Format:** `<type>: <description>`

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `perf:` - Performance
- `chore:` - Maintenance

**Template:**
```
<type>: <50 char description>

<detailed explanation - 72 char wrap>
- Bullet point 1
- Bullet point 2

FIXES: #issue-number (if applicable)
VERCEL: Auto-deploys from main
```

**Example:**
```
fix: unify UI/UX design system across all pages

Synchronized brand colors, backgrounds, and CSS variables
with tailwind.config.js (source of truth).

- Brand primary: #00575A (Deep Teal)
- Backgrounds: #0F172A (consistent)
- CSS variables: Aligned with Tailwind
- Zero breaking changes

VERIFIED:
✓ npm run build (4.15s)
✓ TypeScript clean (0 errors)
✓ All colors verified
```

### STEP 5: Stage & Commit (60 sec)
```bash
git add .
git commit -m "<message>"
✓ Show commit hash
✓ Show files changed
✓ Show lines added/removed
```

### STEP 6: Push to Main (30 sec)
```bash
git checkout main
git pull origin main
git push origin main
✓ Show remote branch status
✓ Confirm push successful
```

### STEP 7: Vercel Deploy Trigger (instant)
```
✓ Vercel auto-deploys on main push
✓ Show deployment URL
✓ Status: "Building on Vercel..."
✓ Check every 10 sec for completion
```

### STEP 8: Deployment Confirmation (120 sec)
```
Wait for Vercel:
  ✓ Build succeeds
  ✓ Deployment live
  ✓ Preview URL active
  ✓ Show: Commit hash + Live URL

Result: "🎉 Shipped to Production"
```

---

## ✅ VALIDATION CHECKLIST

**Before Shipping:**
- [ ] All changes tested locally
- [ ] Build passes (npm run build)
- [ ] TypeScript clean (npx tsc --noEmit)
- [ ] No console errors
- [ ] No API keys/secrets in code
- [ ] Meaningful commit message

**After Shipping:**
- [ ] Commit visible on GitHub
- [ ] Vercel build status: Success
- [ ] Live URL accessible
- [ ] No 404 errors
- [ ] Features work as expected

---

## 🚨 ABORT CONDITIONS

Ship is **ABORTED** if any of these fail:
```
✗ Build fails → Show error, fix, retry
✗ TypeScript errors → Show errors, fix, retry
✗ Git push fails → Show error, resolve conflict, retry
✗ Vercel build fails → Check logs, fix, repush
✗ Contains secrets → Remove, amend commit, repush
```

---

## 📊 SHIP STATUS INDICATORS

```
🔴 PRE-SHIP     → Checking prerequisites
🟡 BUILDING     → npm run build running
🟡 TYPECHECKING → tsc validating
🟡 COMMITTING   → git commit in progress
🟡 PUSHING      → git push to main
🟠 VERCEL       → Waiting for Vercel build
🟢 SHIPPED      → Live in production
🔵 DEPLOYED     → Ready for users
```

---

## 💡 SMART DEFAULTS

**If user doesn't specify:**
- Commit type → Auto-detect from changed files
- Message → Generate from git diff summary
- Branch → Always push to `main`
- Deploy → Auto on main push (Vercel)

**Example Auto-Detection:**
```
Changed: src/pages/Dashboard.tsx, src/styles/
Auto Type: fix (multiple file changes)
Auto Msg: "fix: update dashboard components"
```

---

## 🎯 SUCCESS RESPONSE

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 SHIPPED TO PRODUCTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Commit: 9e223ef
✓ Message: fix: unify UI/UX design system...
✓ Files: 7 changed, 804 insertions(+)
✓ Build: 4.15s (212.17 kB)
✓ Vercel: https://well.vercel.app
✓ Status: 🟢 LIVE

Next: Monitor deployment, check live site
```

---

## ⏱️ TIMING BREAKDOWN

| Step | Time | Status |
|------|------|--------|
| Pre-flight | 30s | Quick |
| Build | 60s | ~4.15s actual |
| Type Check | 30s | Quick |
| Commit Msg | 60s | Manual |
| Staging | 60s | Quick |
| Push | 30s | Quick |
| Vercel | Instant | Auto-trigger |
| Confirm | 120s | ~2 min actual |
| **TOTAL** | **~5-7 min** | **Typical** |

---

## 🔗 RELATED COMMANDS

```
/ship               → Full deployment pipeline
/build              → Just run npm run build
/test               → Run tests first
/validate           → Check types & build only
/git-status         → Show changes without shipping
/commit "<msg>"     → Just commit, no push
/push               → Just push, no deploy
/deploy-status      → Check Vercel status
```

---

## 📞 TROUBLESHOOTING

**Q: Build fails**  
A: Show error → User fixes → Run /build again → /ship

**Q: Git conflict**  
A: Show conflict → User resolves → git add . → /ship

**Q: Vercel build fails**  
A: Check Vercel logs → User fixes → Amend → /ship --force-push

**Q: Want to cancel**  
A: Stop at any point → `/abort` → No changes pushed

---

## 🚀 QUICK SHIP

```
USER: "ship"
IDE:  [Auto-run all 8 steps]
IDE:  [Show final success message]
TIME: ~5 minutes total
```

---

**Status:** ✅ Ready for Integration  
**Last Updated:** 2025-01-13  
**For:** Antigravity IDE Agent
