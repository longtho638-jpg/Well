# Phase 2: Mapping Table — App → Deploy Target

**Created:** 2026-03-12 | **Priority:** High | **Status:** Pending

## Overview

Tạo bảng mapping chi tiết: app → deploy target → config files cần sửa

## Mapping Logic

| App Type | Deploy Target | Config Files |
|----------|---------------|--------------|
| Static/SPA (React/Vite) | Cloudflare Pages | _redirects (SPA rule) |
| API/Edge Functions | Cloudflare Workers | wrangler.toml |
| Fullstack (Next.js) | Cloudflare Pages (functions) | wrangler.toml |
| Database needed | Cloudflare D1 | wrangler.toml + migrations |
| File Storage | Cloudflare R2 | wrangler.toml bindings |

## Todo List

- [ ] Phân loại 30 apps theo type
- [ ] Assign deploy target cho mỗi app
- [ ] Liệt kê config files cần tạo/sửa

## Output

File: `reports/mapping-table.md` — bảng mapping chi tiết
