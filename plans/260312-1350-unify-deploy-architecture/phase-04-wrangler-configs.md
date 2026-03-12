# Phase 4: Create Wrangler Configs — _redirects & wrangler.toml

**Created:** 2026-03-12 | **Priority:** High | **Status:** Pending

## Overview

Tạo/update config files cho mỗi app

## Config Types

### 1. Cloudflare Pages (Static/SPA)
File: `dist/_redirects`
```
/* /index.html 200
```

### 2. Cloudflare Workers (API)
File: `wrangler.toml`
```toml
name = "{app-name}"
main = "src/worker.ts"
compatibility_date = "2024-01-01"
```

### 3. Workers + D1
File: `wrangler.toml`
```toml
[[d1_databases]]
binding = "DB"
database_name = "{app-name}-db"
database_id = "{uuid}"
```

## Todo List

- [ ] Tạo _redirects cho SPA apps
- [ ] Tạo wrangler.toml cho Workers apps
- [ ] Tạo D1 migrations (nếu cần)

## Output

- 30 _redirects files (cho Pages apps)
- wrangler.toml files (cho Workers apps)
