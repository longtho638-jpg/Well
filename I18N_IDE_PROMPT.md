# 🚀 I18N Package - Antigravity IDE Quick Action Prompt

**For:** Antigravity IDE Agent
**Purpose:** Understand & execute i18n error elimination workflow
**Format:** NLP-optimized for AI parsing

---

## 📋 PACKAGE IDENTITY

**Name:** WellNexus i18n Error Elimination Package v1.0.0
**Status:** Production-Ready
**Target:** 100% i18n error elimination
**Delivery:** Antigravity /code System
**Files:** 6 documents + 1 automation script

---

## 🗂️ FILE REGISTRY (AI-Parseable Format)

```
File: PROMPT_I18N_ELIMINATION.md
├─ Type: Strategy Document
├─ Purpose: Audit framework with 6 phases
├─ Use When: Need to understand all i18n issues
├─ Read Time: 30 min
├─ Contains: 8 issue categories, fix templates, quality gates
└─ User Action: Read first for complete understanding

File: I18N_QUICK_FIX_GUIDE.md
├─ Type: Implementation Guide
├─ Purpose: Copy-paste solutions for all issues
├─ Use When: Ready to fix files
├─ Read Time: 1-2 hours (implementation)
├─ Contains: 7 fix templates, 50+ examples, file-by-file breakdown
└─ User Action: Use during coding to apply fixes

File: I18N_VALIDATOR.md
├─ Type: Quality Assurance
├─ Purpose: Pre-deployment validation framework
├─ Use When: Ready to validate before deployment
├─ Read Time: 20 min
├─ Contains: 8 validator tools, manual checklist, sign-off requirements
└─ User Action: Run validators before merging to main

File: I18N_DELIVERY_PACKAGE.md
├─ Type: Quick Start Guide
├─ Purpose: Package summary and navigation
├─ Use When: Need quick orientation
├─ Read Time: 5 min
├─ Contains: 3 implementation paths, checklists, deployment steps
└─ User Action: Start here for initial orientation

File: I18N_PACKAGE_README.md
├─ Type: Overview Document
├─ Purpose: Package summary and quick reference
├─ Use When: New user or quick lookup
├─ Read Time: 10 min
├─ Contains: Success criteria, implementation checklist, troubleshooting
└─ User Action: Reference for common questions

File: I18N_PACKAGE_MANIFEST.txt
├─ Type: Reference Document
├─ Purpose: Detailed file listing and validation gates
├─ Use When: Need complete checklist
├─ Read Time: 10 min
├─ Contains: Issues breakdown, effort estimation, QA gates
└─ User Action: Use for comprehensive validation tracking

File: scripts/fix-i18n.ts
├─ Type: Automation Script
├─ Purpose: Automated issue detection and reporting
├─ Use When: Need to discover all problems
├─ Run Command: npx tsx scripts/fix-i18n.ts
├─ Output: i18n-audit-report.json
└─ User Action: Execute for initial audit
```

---

## 🎯 QUICK ACTION MAP

**User Says → IDE Action → Reference File**

| User Intent | IDE Action | File |
|---|---|---|
| "I don't know where to start" | Show 3 paths (A/B/C) | I18N_DELIVERY_PACKAGE.md |
| "What issues exist?" | Run audit script | scripts/fix-i18n.ts |
| "Fix hardcoded dates" | Show template #1 | I18N_QUICK_FIX_GUIDE.md |
| "Fix number formatting" | Show template #3 | I18N_QUICK_FIX_GUIDE.md |
| "Validate my fixes" | Run validators | I18N_VALIDATOR.md |
| "I'm lost" | Show quick summary | I18N_PACKAGE_README.md |
| "Full strategy?" | Show audit framework | PROMPT_I18N_ELIMINATION.md |
| "Deploy to Antigravity" | Run deployment checklist | I18N_DELIVERY_PACKAGE.md |

---

## 🔧 WORKFLOW AUTOMATION

### **Execution Path A: Complete Fix** (3.5-4 hours)
```
STEP 1: IDE → Show PROMPT_I18N_ELIMINATION.md (user reads 30 min)
STEP 2: IDE → Execute: npx tsx scripts/fix-i18n.ts (5 min)
STEP 3: IDE → Show I18N_QUICK_FIX_GUIDE.md (user applies fixes 2.5 hours)
STEP 4: IDE → Show I18N_VALIDATOR.md (user validates 20 min)
STEP 5: IDE → Prompt user for git commit (10 min)
STEP 6: IDE → Display deployment checklist
```

### **Execution Path B: Fast Track** (1.5-2 hours)
```
STEP 1: IDE → Show I18N_QUICK_FIX_GUIDE.md (user applies fixes 1.5 hours)
STEP 2: IDE → Execute validators (10 min)
STEP 3: IDE → Prompt deployment
```

### **Execution Path C: Automation** (30-40 min)
```
STEP 1: IDE → Execute: npx tsx scripts/fix-i18n.ts (5 min)
STEP 2: IDE → Parse i18n-audit-report.json & display findings (10 min)
STEP 3: IDE → Show suggested fixes from I18N_QUICK_FIX_GUIDE.md (20 min)
STEP 4: IDE → Prompt user to apply suggestions
```

---

## 🎯 NLP COMMAND PATTERNS

**IDE should recognize & respond to:**

```
// Discovery commands
"audit i18n" → Run scripts/fix-i18n.ts
"find i18n errors" → Run scripts/fix-i18n.ts
"what's broken" → Show PROMPT_I18N_ELIMINATION.md (Phase 1-2)
"how many issues" → Run audit script & summarize

// Implementation commands
"fix dates" → Show I18N_QUICK_FIX_GUIDE.md → Template #1
"fix numbers" → Show I18N_QUICK_FIX_GUIDE.md → Template #3
"fix locale keys" → Show I18N_QUICK_FIX_GUIDE.md → Template #4
"remove ts-ignore" → Show I18N_QUICK_FIX_GUIDE.md → Template #6
"apply fixes" → Show file-by-file breakdown

// Validation commands
"validate" → Run I18N_VALIDATOR.md checks
"before deploy" → Show deployment checklist
"test languages" → Show manual testing checklist

// Navigation commands
"i18n help" → Show I18N_PACKAGE_README.md
"where to start" → Show I18N_DELIVERY_PACKAGE.md (Path selection)
"show all files" → Show I18N_PACKAGE_MANIFEST.txt
"next step" → Show current step in workflow
```

---

## 📊 ISSUE CATEGORY MAPPING

**IDE should categorize issues as:**

```
CRITICAL (🔴) → Blocks deployment
├─ Hardcoded dates: toLocaleDateString('vi-VN')
├─ Hardcoded times: toLocaleTimeString('vi-VN')
└─ Number formatting: .toLocaleString() inconsistent
  → Action: Use I18N_QUICK_FIX_GUIDE.md Templates #1-3

HIGH (🟠) → Important
├─ Missing translation keys
├─ Incomplete locale files
└─ Type safety violations (@ts-ignore)
  → Action: Use I18N_QUICK_FIX_GUIDE.md Templates #4-6

MEDIUM (🟡) → Maintenance
├─ Storage key inconsistency
├─ Locale detection conflicts
└─ Currency formatting gaps
  → Action: Use I18N_QUICK_FIX_GUIDE.md Template #5

LOW (🟢) → Polish
├─ Pluralization errors
└─ Component refactoring
  → Action: Use I18N_QUICK_FIX_GUIDE.md (optional)
```

---

## ✅ VALIDATOR CHECKLIST (IDE-Parseable)

**IDE should enforce ALL checks before allowing deployment:**

```json
{
  "automated_checks": [
    {
      "name": "No hardcoded dates",
      "command": "grep -r \"toLocaleDateString\" src/ --include=\"*.tsx\"",
      "must_pass": true,
      "file": "I18N_VALIDATOR.md"
    },
    {
      "name": "No hardcoded times",
      "command": "grep -r \"toLocaleTimeString\" src/ --include=\"*.tsx\"",
      "must_pass": true,
      "file": "I18N_VALIDATOR.md"
    },
    {
      "name": "No @ts-ignore",
      "command": "grep -r \"@ts-ignore\" src/hooks/useTranslation.ts",
      "must_pass": true,
      "file": "I18N_VALIDATOR.md"
    },
    {
      "name": "Build succeeds",
      "command": "npm run build",
      "must_pass": true,
      "file": "I18N_VALIDATOR.md"
    },
    {
      "name": "TypeScript clean",
      "command": "npx tsc --noEmit",
      "must_pass": true,
      "file": "I18N_VALIDATOR.md"
    },
    {
      "name": "Tests pass",
      "command": "npm test -- --run",
      "must_pass": true,
      "file": "I18N_VALIDATOR.md"
    }
  ],
  "manual_checks": [
    {
      "name": "English language test",
      "instruction": "Switch to English, verify no Vietnamese visible",
      "file": "I18N_VALIDATOR.md"
    },
    {
      "name": "Vietnamese language test",
      "instruction": "Switch to Vietnamese, verify no English visible",
      "file": "I18N_VALIDATOR.md"
    },
    {
      "name": "Date formatting verification",
      "instruction": "Check dates display correct format per locale",
      "file": "I18N_VALIDATOR.md"
    },
    {
      "name": "Number formatting verification",
      "instruction": "Check numbers use correct separators per locale",
      "file": "I18N_VALIDATOR.md"
    }
  ]
}
```

---

## 🚀 DEPLOYMENT GATE (IDE-Enforced)

**IDE must prompt ONLY when:**

```
✓ All automated checks pass
✓ All manual checks confirmed
✓ Code review approved
✓ Deployment checklist signed off

IDE Action: Show deployment confirmation
  ├─ Git commit message suggestion
  ├─ Push to main (triggers Vercel)
  └─ Verify Antigravity deployment
```

---

## 📂 FILES TO MODIFY

**IDE should track these files as "NEEDS FIX":**

```
Components (8 files):
├─ src/pages/Dashboard.tsx [Line 56]
├─ src/pages/CopilotPage.tsx [Line 115]
├─ src/pages/Wallet.tsx [Lines 215, 228, 311, 325, 438, 441, 451]
├─ src/pages/MarketingTools.tsx [Line 383]
├─ src/pages/MarketingTools/GiftCardManager.tsx [Line 198]
├─ src/pages/Admin/AuditLog.tsx [Lines 98, 217, 220, 295]
├─ src/pages/Admin/CMS.tsx [Line 241]
└─ src/pages/AgencyOSDemo.tsx [Lines 131, 208]

Core i18n Files (5 files):
├─ src/i18n.ts
├─ src/utils/i18n.ts
├─ src/hooks/useTranslation.ts
├─ src/locales/vi.ts
└─ src/locales/en.ts
```

---

## 🎓 IDE HELP TEXT (Context-Aware)

**IDE should display these on demand:**

### "I need help with i18n"
```
WellNexus i18n Error Elimination Package v1.0.0

Choose your approach:
  A) Complete Fix (3.5-4 hours) → Full understanding + all fixes
  B) Fast Track (1.5-2 hours) → Direct implementation
  C) Automation (30 min) → Tool-guided discovery

Type: "start with path A" or "start with path B" or "audit"
```

### "How do I fix [issue type]?"
```
Showing solution for: [issue type]

File: I18N_QUICK_FIX_GUIDE.md
Template: #[number]

[Show exact code with before/after]

Ready to apply? Type: "apply fix"
```

### "Is my code ready to deploy?"
```
Running pre-deployment validation...

[Show each check result]

Status: READY / NOT READY
Issues: [List any failures]

Next: Type "deploy" when all checks pass
```

---

## 🔗 CROSS-REFERENCE MAP

**For IDE intelligent linking:**

```
I18N_DELIVERY_PACKAGE.md
  └─ "Choose Path A" → PROMPT_I18N_ELIMINATION.md
  └─ "Choose Path B" → I18N_QUICK_FIX_GUIDE.md
  └─ "Validate" → I18N_VALIDATOR.md
  └─ "Deploy" → Deployment checklist

PROMPT_I18N_ELIMINATION.md
  └─ "Phase 2: Fix Template" → I18N_QUICK_FIX_GUIDE.md
  └─ "Phase 3: Audit Checklist" → I18N_VALIDATOR.md

I18N_QUICK_FIX_GUIDE.md
  └─ "[File Name]" → Link to actual source file
  └─ "Run validators" → I18N_VALIDATOR.md
  └─ "Deploy" → I18N_DELIVERY_PACKAGE.md

I18N_VALIDATOR.md
  └─ "Validation passed" → Show deployment steps
  └─ "Validation failed" → Link to relevant fix guide
```

---

## 💾 EXPECTED OUTPUTS

**IDE should generate/track:**

```
On Audit:
  Output: i18n-audit-report.json
  Content: List of all issues by category & file
  Action: Display categorized findings

On Implementation:
  Track: Files modified counter
  Display: Progress (X/15 files fixed)
  Prompt: "Next file to fix?"

On Validation:
  Output: Validation report
  Format: [✓] Check name | [✗] Check name
  Result: PASS/FAIL

On Deployment:
  Log: Git commit hash
  Verify: Vercel deployment URL
  Confirm: Antigravity receipt
```

---

## 🎯 SUCCESS METRICS (IDE-Tracked)

**IDE should verify:**

```
Issues Fixed: All ~60-70 problems eliminated
Files Modified: 13 total (8 components + 5 core)
Tests Passing: npm test passes without errors
Build Status: npm run build succeeds
TypeScript: npx tsc --noEmit returns 0 errors
Validators: All 6+ checks passing
Languages: Both EN and VI functional
Console: Zero i18n warnings/errors
Code Review: Approved
Deployment: Successful to Antigravity
```

---

## 📞 QUICK REFERENCE (IDE Context Menu)

```
Right-click on i18n file → Show Options:
├─ "Run audit" → scripts/fix-i18n.ts
├─ "View fixes for this file" → I18N_QUICK_FIX_GUIDE.md (relevant section)
├─ "Validate this file" → Check against validation rules
├─ "See example" → Show before/after code
└─ "Help" → Show I18N_PACKAGE_README.md

Command Palette → Type "i18n":
├─ "i18n: Audit issues"
├─ "i18n: Apply fixes"
├─ "i18n: Validate"
├─ "i18n: Run tests"
└─ "i18n: Deploy"
```

---

## 🎬 EXAMPLE IDE INTERACTION

```
USER: "audit i18n"
IDE: Executing: npx tsx scripts/fix-i18n.ts
IDE: Found 67 i18n errors in 13 files
IDE: 🔴 15 hardcoded dates (CRITICAL)
IDE: 🔴 8 hardcoded times (CRITICAL)
IDE: 🟠 20 missing keys (HIGH)
IDE: See full report in i18n-audit-report.json

USER: "show fixes"
IDE: Displaying I18N_QUICK_FIX_GUIDE.md
IDE: Templates 1-7 available
IDE: Files affected:
     - Dashboard.tsx [Line 56] → Template #2
     - Wallet.tsx [Lines 438,441] → Template #1
     - ...

USER: "fix Dashboard.tsx line 56"
IDE: [Show before/after code]
IDE: Apply this change? (Y/N)

USER: "y"
IDE: ✓ File modified
IDE: Progress: 1/13 files
IDE: Next file: CopilotPage.tsx?

...after all fixes...

USER: "validate"
IDE: Running pre-deployment checks...
IDE: ✓ No hardcoded dates
IDE: ✓ No hardcoded times
IDE: ✓ Build successful
IDE: ✓ Tests passing
IDE: ✓ TypeScript clean
IDE: Ready to deploy!

USER: "deploy"
IDE: Preparing deployment...
IDE: [Show git commit message]
IDE: Ready to push to main?
```

---

## 📋 IDE CONFIGURATION (For Setup)

**Add to .claudekit/config or IDE settings:**

```json
{
  "i18n_package": {
    "version": "1.0.0",
    "status": "active",
    "files": [
      "PROMPT_I18N_ELIMINATION.md",
      "I18N_QUICK_FIX_GUIDE.md",
      "I18N_VALIDATOR.md",
      "I18N_DELIVERY_PACKAGE.md",
      "I18N_PACKAGE_README.md",
      "I18N_PACKAGE_MANIFEST.txt",
      "scripts/fix-i18n.ts"
    ],
    "target_files": [
      "src/pages/Dashboard.tsx",
      "src/pages/CopilotPage.tsx",
      "src/pages/Wallet.tsx",
      "src/pages/MarketingTools.tsx",
      "src/pages/MarketingTools/GiftCardManager.tsx",
      "src/pages/Admin/AuditLog.tsx",
      "src/pages/Admin/CMS.tsx",
      "src/pages/AgencyOSDemo.tsx",
      "src/i18n.ts",
      "src/utils/i18n.ts",
      "src/hooks/useTranslation.ts",
      "src/locales/vi.ts",
      "src/locales/en.ts"
    ],
    "validation_gates": ["no_hardcoded_dates", "no_ts_ignore", "build_succeeds", "tests_pass"],
    "deployment_target": "antigravity_code",
    "quality_level": "enterprise_grade"
  }
}
```

---

## ✅ CHECKLIST FOR IDE

**IDE Ready When:**
- [ ] All 7 files loaded in package registry
- [ ] Audit script executable (scripts/fix-i18n.ts)
- [ ] NLP patterns recognized (see COMMAND PATTERNS)
- [ ] Validators configured (see VALIDATOR CHECKLIST)
- [ ] Help text available (see IDE HELP TEXT)
- [ ] Cross-references configured (see CROSS-REFERENCE MAP)
- [ ] Context menu items available (see QUICK REFERENCE)
- [ ] Command palette commands available

---

**Version:** 1.0.0
**For:** Antigravity IDE Agent
**Status:** ✅ Ready for Integration
**Last Updated:** 2025-01-13

---

## 🎨 DESIGN SYSTEM UPDATE (2025-01-13)

**UI/UX Design System Unified - All pages consistent now**

**What was fixed:**
- ✅ Brand primary: `#00575A` (Deep Teal)
- ✅ Dark backgrounds: `#0F172A` consistent everywhere
- ✅ Text colors: Slate palette aligned
- ✅ CSS variables: Synchronized with Tailwind

**Reference:**
- `DESIGN_MIGRATION_GUIDE.md` - For developers
- `DESIGN_UNIFIED.md` - Technical documentation
- `DESIGN_FIX_SUMMARY.md` - Executive summary

