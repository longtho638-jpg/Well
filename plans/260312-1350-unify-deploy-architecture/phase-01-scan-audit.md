# Phase 1: Scan & Audit — Deploy Status

**Created:** 2026-03-12 | **Priority:** High | **Status:** In Progress

## Overview

Scan toàn bộ 30 apps trong apps/ để xác định:
- App nào đang deploy lên Vercel?
- App nào đang deploy lên Cloudflare?
- App nào chưa có deploy config?

## Implementation Steps

1. `ls -1 apps/` — liệt kê tất cả apps (HOÀN TẤT: 30 apps)
2. Với mỗi app, kiểm tra:
   - `package.json` — tìm `deploy` script (vercel/wrangler)
   - `vercel.json` — có tồn tại?
   - `wrangler.toml` hoặc `wrangler.json` — có tồn tại?
   - `.env.production` — có biến môi trường deploy?

## Todo List

- [ ] Scan apps/admin
- [ ] Scan apps/agencyos-landing
- [ ] Scan apps/agencyos-web
- [ ] Scan apps/api
- [ ] Scan apps/well
- [ ] Scan apps/raas-gateway
- [ ] Scan apps/openclaw-worker
- [ ] Scan tất cả 30 apps

## Success Criteria

- [ ] Bảng Excel/CSV với columns: `app_name`, `current_deploy`, `has_vercel_json`, `has_wrangler_toml`, `deploy_script`
- [ ] Báo cáo research tại `plans/260312-1350-unify-deploy-architecture/reports/scan-audit-report.md`

## Output

File: `reports/scan-audit-report.md` — liệt kê kết quả scan 30 apps
