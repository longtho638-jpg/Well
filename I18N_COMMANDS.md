# ⚡ I18N Commands - Quick Reference for Antigravity IDE

**One-liner commands for common i18n operations**

---

## 🎯 CORE COMMANDS

### Discovery
```bash
# Audit all i18n issues
npx tsx scripts/fix-i18n.ts

# Find hardcoded dates
grep -r "toLocaleDateString\|toLocaleTimeString" src/ --include="*.tsx"

# Find number formatting issues
grep -r "\.toLocaleString()" src/ --include="*.tsx"

# Find type safety issues
grep -r "@ts-ignore" src/hooks/useTranslation.ts src/services/i18nService.ts
```

### Implementation
```bash
# Show all fixes
open I18N_QUICK_FIX_GUIDE.md

# Show strategy
open PROMPT_I18N_ELIMINATION.md

# Show validator
open I18N_VALIDATOR.md
```

### Validation
```bash
# Run all validators
bash scripts/validate-i18n.sh

# Build check
npm run build

# TypeScript check
npx tsc --noEmit

# Test check
npm test -- --run
```

### Deployment
```bash
# Commit changes
git add .
git commit -m "feat: Eliminate 100% of i18n errors across codebase"

# Push to main
git push -u origin main

# Verify
# → Vercel auto-deploys
# → Check Antigravity for receipt
```

---

## 🎯 FILE SHORTCUTS

```bash
# Go to implementation guide
cat I18N_QUICK_FIX_GUIDE.md | grep -A 20 "Fix #"

# View specific file fixes
grep -A 10 "Dashboard.tsx\|Wallet.tsx\|CopilotPage.tsx" I18N_QUICK_FIX_GUIDE.md

# Check validation gates
grep -A 30 "QUALITY GATES" I18N_VALIDATOR.md

# View progress checklist
grep "□" I18N_DELIVERY_PACKAGE.md | head -20
```

---

## 🎯 STATUS CHECKS

```bash
# Get full audit report
cat i18n-audit-report.json | jq '.totalIssues, .byPhase'

# Count issues by type
grep -o "CRITICAL\|HIGH\|MEDIUM\|LOW" i18n-audit-report.json | sort | uniq -c

# Show files needing fixes
grep "file" i18n-audit-report.json | cut -d'"' -f4 | sort | uniq
```

---

## 🎯 IDE INTEGRATION COMMANDS

```bash
# For Command Palette:
# Type: "i18n audit"          → runs npx tsx scripts/fix-i18n.ts
# Type: "i18n validate"       → runs bash scripts/validate-i18n.sh
# Type: "i18n help"           → shows I18N_PACKAGE_README.md
# Type: "i18n fix dashboard"  → shows Dashboard.tsx fixes
# Type: "i18n deploy"         → shows deployment checklist
```

---

## 🎯 ALIAS SETUP (Optional)

```bash
# Add to .zshrc or .bashrc:

alias i18n-audit='npx tsx scripts/fix-i18n.ts'
alias i18n-validate='bash scripts/validate-i18n.sh'
alias i18n-build='npm run build && npx tsc --noEmit'
alias i18n-test='npm test -- --run'
alias i18n-deploy='git add . && git commit -m "feat: i18n fixes" && git push'
alias i18n-help='cat I18N_PACKAGE_README.md'

# Usage:
i18n-audit
i18n-validate
i18n-deploy
```

---

## 🎯 QUICK FIXES BY FILE

```bash
# Dashboard.tsx
open I18N_QUICK_FIX_GUIDE.md +56  # Jump to line with fix

# Wallet.tsx
open I18N_QUICK_FIX_GUIDE.md +215  # Multiple date fixes

# CopilotPage.tsx
open I18N_QUICK_FIX_GUIDE.md +115

# Admin files
open I18N_QUICK_FIX_GUIDE.md +241  # CMS.tsx
open I18N_QUICK_FIX_GUIDE.md +98   # AuditLog.tsx
```

---

## 🎯 VALIDATION MATRIX

```bash
# All must pass:
✓ grep -r "toLocaleDateString" src/ → empty
✓ grep -r "toLocaleTimeString" src/ → empty
✓ grep -r "\.toLocaleString()" src/ → empty
✓ grep -r "@ts-ignore" src/hooks/useTranslation.ts → empty
✓ npm run build → exit code 0
✓ npx tsc --noEmit → exit code 0
✓ npm test -- --run → exit code 0

# If ANY fails → fix using I18N_QUICK_FIX_GUIDE.md
```

---

## 🎯 IMPLEMENTATION PATHS

```bash
# PATH A (Complete - 3.5-4 hours)
cat PROMPT_I18N_ELIMINATION.md
npx tsx scripts/fix-i18n.ts
cat I18N_QUICK_FIX_GUIDE.md      # Apply all fixes
bash scripts/validate-i18n.sh
git commit -m "feat: i18n fixes" && git push

# PATH B (Fast - 1.5-2 hours)
cat I18N_QUICK_FIX_GUIDE.md      # Apply key fixes
bash scripts/validate-i18n.sh
git commit -m "feat: i18n fixes" && git push

# PATH C (Automation - 30 min)
npx tsx scripts/fix-i18n.ts
cat i18n-audit-report.json | jq
git commit -m "feat: i18n fixes" && git push
```

---

## 🎯 COMMON PROBLEMS

```bash
# Problem: "formatDate is not defined"
# Solution: grep I18N_QUICK_FIX_GUIDE.md "import { formatDate"

# Problem: "@ts-ignore still there"
# Solution: grep I18N_QUICK_FIX_GUIDE.md "Remove @ts-ignore"

# Problem: "Build fails"
# Solution: npx tsc --noEmit --pretty  # See specific errors

# Problem: "Tests fail"
# Solution: npm test -- --reporter=verbose

# Problem: "Don't know which file to fix"
# Solution: cat i18n-audit-report.json | jq '.issues[0:5]'
```

---

## 🎯 IDE CONTEXT MENU (Copy-Paste)

```
i18n: Audit Issues
  → npx tsx scripts/fix-i18n.ts

i18n: Apply Fixes
  → open I18N_QUICK_FIX_GUIDE.md

i18n: Validate Code
  → bash scripts/validate-i18n.sh

i18n: View Strategy
  → open PROMPT_I18N_ELIMINATION.md

i18n: Deploy
  → open I18N_DELIVERY_PACKAGE.md (Deployment section)

i18n: Help
  → open I18N_PACKAGE_README.md
```

---

## 🎯 ONE-COMMAND DEPLOYMENT

```bash
# Complete workflow in one shot:
npx tsx scripts/fix-i18n.ts && \
bash scripts/validate-i18n.sh && \
git add . && \
git commit -m "feat: Eliminate 100% of i18n errors across codebase" && \
git push -u origin main

# Or with error handling:
npx tsx scripts/fix-i18n.ts && \
echo "✓ Audit complete. Review i18n-audit-report.json" && \
npm run build && \
echo "✓ Build successful" && \
npx tsc --noEmit && \
echo "✓ TypeScript clean" && \
npm test -- --run && \
echo "✓ Tests pass" && \
echo "Ready for: git push -u origin main"
```

---

## 🎯 MONITORING (During Implementation)

```bash
# Watch progress
watch -n 5 'grep -r "toLocaleDateString\|toLocaleTimeString\|\.toLocaleString()" src/ | wc -l'

# Monitor file changes
ls -lut src/pages/*.tsx src/i18n.ts src/utils/i18n.ts | head -5

# Check git status
git status --short

# See commit queue
git log --oneline -5
```

---

## 🎯 COMPLETION CHECK

```bash
# All must return empty (no matches):
grep -r "toLocaleDateString" src/ --include="*.tsx" | wc -l  # → 0
grep -r "toLocaleTimeString" src/ --include="*.tsx" | wc -l  # → 0
grep -r "\.toLocaleString()" src/ --include="*.tsx" | wc -l  # → 0
grep -r "@ts-ignore" src/hooks/useTranslation.ts | wc -l    # → 0

# All must succeed:
npm run build      # exit 0
npx tsc --noEmit  # exit 0
npm test -- --run # exit 0
```

---

## 🎯 EMERGENCY ROLLBACK

```bash
# If something breaks:
git status          # See what changed
git diff            # Review changes
git checkout -- .   # Revert all changes
git pull            # Get latest

# Restart with audit:
npx tsx scripts/fix-i18n.ts
cat i18n-audit-report.json | jq  # Review findings
```

---

## 🎯 HELP COMMANDS

```bash
# What files need fixing?
cat I18N_PACKAGE_MANIFEST.txt | grep "□"

# How long will this take?
cat I18N_DELIVERY_PACKAGE.md | grep "Total Time"

# What's the strategy?
cat PROMPT_I18N_ELIMINATION.md | head -100

# Show me the fixes!
cat I18N_QUICK_FIX_GUIDE.md | grep -A 20 "COPY-PASTE FIX"

# How do I validate?
cat I18N_VALIDATOR.md | grep -A 10 "QUALITY GATES"
```

---

**Quick Ref:** Save this file in IDE favorites for instant access

**Version:** 1.0.0 | **For:** Antigravity IDE | **Status:** ✅ Ready

