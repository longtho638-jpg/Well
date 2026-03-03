# CI/CD Troubleshooting — GitHub Actions Billing Issue

**Date Created**: 2026-03-04
**Status**: ⚠️ CI/CD BLOCKED — Billing Required

---

## 🚨 Problem Summary

CI/CD pipeline bị block không phải do code hay config, mà do **GitHub Actions billing**:

```
The job was not started because recent account payments have failed
or your spending limit needs to be increased.
```

---

## ✅ Current Status

| Component | Status | Details |
|-----------|--------|---------|
| **Production** | ✅ LIVE | https://wellnexus.vn — HTTP 200 |
| **Tests (local)** | ✅ PASSING | 440/440 tests |
| **Build** | ✅ SUCCESS | Local build successful |
| **i18n** | ✅ VALIDATED | 1598 keys validated |
| **CI/CD** | ⚠️ BLOCKED | GitHub Actions billing issue |

---

## 🔧 Resolution Steps

### Step 1: Check GitHub Billing Settings

1. Truy cập: https://github.com/settings/billing
2. Kiểm tra **Billing & Plans** section
3. Xem có thông báo lỗi thanh toán nào không

### Step 2: Update Payment Method

Nếu payment failed:

1. Click **Update payment method**
2. Thêm credit/debit card mới hoặc cập nhật thông tin card hiện tại
3. Verify billing address chính xác

### Step 3: Check Spending Limit

Nếu dùng Free tier với GitHub Actions:

1. Vào **Billing & Plans** → **Actions**
2. Kiểm tra **Spending limit**
3. Nếu đạt limit, click **Set spending limit** và tăng lên (ví dụ: $5-10/month)

### Step 4: Pay Outstanding Balance

Nếu có balance chưa thanh toán:

1. Vào **Billing & Plans** → **Overview**
2. Click **Pay now** hoặc **Make a payment**
3. Hoàn tất thanh toán

### Step 5: Re-run Workflows

Sau khi billing được giải quyết:

```bash
# Re-run failed workflow
gh workflow run "CI Pipeline" --ref main

# Hoặc vào GitHub Actions UI → Click "Re-run jobs"
```

---

## 📊 GitHub Actions Usage

### Free Tier Limits (GitHub Free)

| Resource | Limit |
|----------|-------|
| Minutes/month | 2,000 minutes |
| Storage | 500 MB |
| Concurrent jobs | 1 |

### Estimated Usage for WellNexus

Dựa trên CI/CD config hiện tại:

| Job | Estimated Time | Frequency |
|-----|----------------|-----------|
| test-part-1 | ~8-10 min | Per push/PR |
| test-part-2 | ~8-10 min | Per push/PR |
| e2e | ~5-7 min | Per push/PR |
| smoke-test | ~2 min | Main branch only |

**Total per push**: ~23-29 minutes
**Monthly capacity**: ~68-86 pushes/month (với 2000 minutes)

---

## 🛡️ Prevention

### 1. Enable Spending Notification

- Vào **Billing & Plans** → **Email notifications**
- Bật notifications khi đạt 50%, 75%, 90% limit

### 2. Monitor Usage

```bash
# Check Actions usage via API
gh api repos/{owner}/{repo}/actions/usage
```

### 3. Optimize Workflow

Để giảm minutes usage:

- Skip unnecessary jobs với `[skip ci]` trong commit message
- Dùng caching cho dependencies
- Parallelize jobs (đã implement: test-part-1 + test-part-2)

---

## 📞 Support Resources

- GitHub Billing Docs: https://docs.github.com/en/billing
- Actions Billing: https://docs.github.com/en/billing/managing-billing-for-github-actions/about-billing-for-github-actions
- GitHub Support: https://support.github.com

---

## 🔗 Related Files

- CI/CD Config: `.github/workflows/ci.yml`
- Production Status: `docs/project-overview-pdr.md`
- Deployment Guide: `docs/deployment-guide.md`

---

_Last Updated: 2026-03-04_
_Status: ⚠️ ACTION REQUIRED — Update billing to restore CI/CD_
