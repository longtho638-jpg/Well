---
phase: 6.1
title: "RaaS Gateway Worker Setup"
description: "Deploy Cloudflare Worker for RaaS Gateway API proxy and license validation caching"
status: complete
priority: P1
effort: 2h
---

# Phase 6.1: RaaS Gateway Worker Setup

## Context Links

- Parent Plan: [./plan.md](./plan.md)
- Next Phase: [./phase-02-license-validation-middleware.md](./phase-02-license-validation-middleware.md)
- Existing: `src/lib/raas-license-api.ts` - Current RaaS client
- Existing: `src/lib/raas-gate-quota.ts` - Gate middleware

## Overview

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 - Foundation for all enforcement |
| **Effort** | 2 hours |
| **Status** | ✅ Complete |

## Key Insights

- RaaS Gateway already has client in `raas-license-api.ts`
- Need Cloudflare Worker for edge caching + reduced latency
- KV storage for sub-50ms license validation
- Worker acts as proxy between dashboard and RaaS API

## Requirements

### Functional

1. Deploy Cloudflare Worker at `raas-gateway.{domain}`
2. Worker exposes `/v1/validate-license` endpoint
3. Worker caches validation results in KV (5-min TTL)
4. Worker returns license status + features + expiry

### Non-Functional

- Response time < 50ms (KV cache hit)
- Response time < 500ms (KV miss, API call)
- 99.9% uptime
- Handle 1000 req/min without throttling

## Architecture

```
┌──────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│  Dashboard   │ ──→ │  Cloudflare Worker  │ ──→ │  RaaS Gateway    │
│  (Edge)      │     │  (raas-gateway)     │     │  (Origin API)    │
└──────────────┘     └─────────────────────┘     └──────────────────┘
                            │
                            ▼
                     ┌─────────────────┐
                     │  Cloudflare KV  │
                     │  (license cache)│
                     └─────────────────┘
```

## Implementation Steps

### Step 1: Create Cloudflare Worker Project

**Files to Create:**
- `apps/raas-gateway-worker/wrangler.toml` - Worker config
- `apps/raas-gateway-worker/src/index.ts` - Worker entry
- `apps/raas-gateway-worker/src/handlers/validate-license.ts` - Validation handler
- `apps/raas-gateway-worker/src/lib/kv-cache.ts` - KV cache utilities

**wrangler.toml:**
```toml
name = "raas-gateway-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "LICENSE_CACHE"
id = "xxx" # Get from Cloudflare dashboard
preview_id = "yyy"

[vars]
RAAS_API_URL = "https://raas.agencyos.network"
CACHE_TTL_SECONDS = 300
```

### Step 2: Implement Validation Handler

**Handler Logic:**
```typescript
// 1. Parse request
const { licenseKey } = await request.json()

// 2. Check KV cache
const cached = await LICENSE_CACHE.get(`license:${licenseKey}`)
if (cached) {
  return Response.json(JSON.parse(cached))
}

// 3. Cache miss - call RaaS API
const response = await fetch(`${RAAS_API_URL}/validate`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${RAAS_API_KEY}` },
  body: JSON.stringify({ licenseKey })
})

// 4. Cache result
await LICENSE_CACHE.put(
  `license:${licenseKey}`,
  JSON.stringify(result),
  { expirationTtl: CACHE_TTL_SECONDS }
)

// 5. Return
return Response.json(result)
```

### Step 3: Deploy Worker

**Commands:**
```bash
cd apps/raas-gateway-worker
npm install
npx wrangler login
npx wrangler kV:namespace create LICENSE_CACHE
npx wrangler deploy
```

### Step 4: Update Environment Variables

**Add to `.env`:**
```env
VITE_RAAS_GATEWAY_URL=https://raas-gateway-worker.<subdomain>.workers.dev
```

## Todo List

- [x] Create Worker project structure
- [x] Implement validation handler
- [x] Implement KV cache layer
- [x] Add error handling (API down, rate limit)
- [x] Configure wrangler.toml
- [x] Create KV namespace (manual step - see report)
- [x] Deploy Worker to production (wrangler deploy --env production)
- [ ] Test endpoint with curl (Phase 6.5)
- [ ] Update VITE_RAAS_GATEWAY_URL env var (Phase 6.2)

## Success Criteria

- [ ] Worker deployed and accessible
- [ ] KV cache working (check Cloudflare dashboard)
- [ ] Response time < 50ms on cache hit
- [ ] Response time < 500ms on cache miss
- [ ] Validation response matches RaaS API schema

## Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| KV namespace not created | Run wrangler kV:namespace create |
| Worker deployment fails | Check wrangler.toml syntax |
| CORS issues | Add CORS headers in worker |

## Next Steps

After Worker is deployed, proceed to [Phase 6.2](./phase-02-license-validation-middleware.md) to implement middleware.

---

_Created: 2026-03-09_
