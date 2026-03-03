# 🚨 Quick Fix: CI/CD Billing Issue

**Created:** 2026-03-04
**Severity:** ⚠️ HIGH — CI/CD blocked
**Impact:** Cannot run automated tests/deployment via GitHub Actions

---

## 🎯 Quick Summary

| Component | Status |
|-----------|--------|
| Production | ✅ LIVE (https://wellnexus.vn) |
| Local Tests | ✅ 440/440 passing |
| Local Build | ✅ Success |
| CI/CD | ⚠️ BLOCKED (Billing) |

---

## ⚡ 3-Minute Fix

### Step 1: Open GitHub Billing
```
https://github.com/settings/billing
```

### Step 2: Check Error Message
Look for one of these:
- ❌ "Recent payment failed"
- ❌ "Spending limit reached"
- ❌ "Payment method expired"

### Step 3: Fix Based on Error

**If payment failed:**
1. Click "Update payment method"
2. Add new card or update existing card
3. Verify billing address

**If spending limit reached:**
1. Go to "Actions" section
2. Click "Set spending limit"
3. Enter amount (recommend: $5-10/month)
4. Save changes

**If no error visible:**
1. Check "Overview" tab for outstanding balance
2. Click "Make a payment"
3. Complete payment

### Step 4: Re-run CI/CD
```bash
# Option A: Via CLI
gh workflow run "CI Pipeline" --ref main

# Option B: Via GitHub UI
# Go to: https://github.com/longtho638-jpg/Well/actions
# Click "CI Pipeline" → "Run workflow" → Select "main" → Click "Run workflow"
```

---

## 📊 GitHub Actions Usage

### Free Tier (GitHub Free)
- **2,000 minutes/month** — Enough for ~70-80 pushes
- **Current workflow:** ~23-29 minutes per push
  - test-part-1: 8-10 min
  - test-part-2: 8-10 min
  - e2e: 5-7 min
  - smoke-test: 2 min

### Estimate
Với 2000 minutes, bạn có thể push **68-86 lần/tháng** (approx 2-3 pushes/day)

---

## 🔍 Verify Fix

After updating billing:

```bash
# Check workflow status
gh run list --limit 3

# Should see:
# CI Pipeline  completed  success  (not failure/blocked)
```

Production should auto-deploy via Vercel within 2-5 minutes after CI/CD passes.

---

## 🛡️ Prevention

### Enable Notifications
1. Go to https://github.com/settings/notifications
2. Enable "Billing & plans" emails
3. Get notified at 50%, 75%, 90% of limit

### Monitor Usage
```bash
# Check Actions usage
gh api repos/longtho638-jpg/Well/actions/usage
```

### Optimize Workflow
- Use `[skip ci]` in commit message to skip CI/CD for docs-only changes
- Example: `docs: update README [skip ci]`

---

## 📞 Need Help?

- **GitHub Billing Docs:** https://docs.github.com/en/billing
- **Actions Billing:** https://docs.github.com/en/billing/managing-billing-for-github-actions/about-billing-for-github-actions
- **GitHub Support:** https://support.github.com

---

## 📝 Related Docs

- [Full Troubleshooting Guide](./cicd-billing-troubleshooting.md)
- [CI/CD Config](../.github/workflows/ci.yml)
- [Project Roadmap](./project-roadmap.md)

---

**Last Updated:** 2026-03-04
**Status:** ⚠️ ACTION REQUIRED
