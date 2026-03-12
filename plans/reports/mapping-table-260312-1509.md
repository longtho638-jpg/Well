# Deploy Architecture Mapping Table

**Generated:** 2026-03-12 | **Total Apps:** 31

## Summary

| Category | Count | Percentage |
|----------|-------|------------|
| Has wrangler.toml | 5 | 16% |
| Has vercel.json | 1 | 3% |
| Has package.json + deploy script | 8 | 26% |
| Missing deploy config | 17 | 55% |

## App-by-App Mapping

| App Name | package.json | vercel.json | wrangler.toml | Deploy Script | Target |
|----------|-------------|-------------|---------------|---------------|--------|
| admin | ✅ Created | ❌ | ❌ | `wrangler pages deploy` | Cloudflare Pages |
| agencyos-landing | ✅ Created | ❌ | ❌ | `wrangler pages deploy` | Cloudflare Pages |
| agencyos-web | ❌ | ❌ | ❌ | none | TBD |
| agi-sops | ✅ | ❌ | ❌ | none | TBD |
| algo-trader | ✅ | ❌ | ✅ | `wrangler deploy` | Cloudflare Workers |
| analytics | ❌ | ❌ | ❌ | none | TBD |
| anima119 | ✅ | ❌ | ❌ | `wrangler pages deploy` | Cloudflare Pages |
| antigravity-cli | ❌ | ❌ | ❌ | none | CLI (no deploy) |
| apex-os | ✅ | ❌ | ✅ | `wrangler deploy` | Cloudflare Workers |
| api | ❌ | ❌ | ❌ | none | TBD |
| com-anh-duong-10x | ✅ | ✅ | ❌ | `wrangler pages deploy` | Cloudflare Pages (migrated) |
| dashboard | ✅ Created | ❌ | ❌ | `wrangler pages deploy` | Cloudflare Pages |
| developers | ❌ | ❌ | ❌ | none | TBD |
| docs | ✅ | ❌ | ❌ | none | TBD |
| engine | ✅ | ❌ | ❌ | none | TBD |
| gemini-proxy-clone | ✅ | ❌ | ❌ | none | TBD |
| landing | ✅ Created | ❌ | ❌ | `wrangler pages deploy` | Cloudflare Pages |
| openclaw-worker | ✅ | ❌ | ❌ | `wrangler deploy` | Cloudflare Workers |
| project | ❌ | ❌ | ❌ | none | TBD |
| raas-demo | ❌ | ❌ | ❌ | none | TBD |
| raas-gateway-cli | ✅ | ❌ | ❌ | none | CLI (no deploy) |
| raas-gateway | ✅ | ❌ | ✅ | `wrangler deploy` | Cloudflare Workers |
| sa-dec-flower-hunt | ❌ | ❌ | ❌ | none | TBD |
| saas-dashboard | ✅ | ❌ | ❌ | none | TBD |
| sophia-proposal | ✅ | ❌ | ✅ | `wrangler deploy` | Cloudflare Workers |
| starter-template | ❌ | ❌ | ❌ | none | Template |
| tasks | ❌ | ❌ | ❌ | none | TBD |
| vibe-coding-cafe | ❌ | ❌ | ❌ | none | TBD |
| web | ❌ | ❌ | ❌ | none | TBD |
| well | ✅ | ❌ | ✅ | `wrangler pages deploy` | Cloudflare Pages |
| worker | ❌ | ❌ | ❌ | none | TBD |

## Deploy Targets

### Cloudflare Pages (Static/SPA)
- admin (new)
- agencyos-landing (new)
- anima119
- com-anh-duong-10x (migrated from Vercel)
- dashboard (new)
- landing (new)
- well

### Cloudflare Workers (API/Edge)
- algo-trader
- apex-os
- openclaw-worker
- raas-gateway
- sophia-proposal

## Config Files Created

### package.json (4 apps)
- apps/admin/package.json
- apps/agencyos-landing/package.json
- apps/dashboard/package.json
- apps/landing/package.json

### _redirects (4 apps)
- apps/admin/dist/_redirects
- apps/agencyos-landing/dist/_redirects
- apps/dashboard/dist/_redirects
- apps/landing/dist/_redirects

## Next Steps

1. **Phase 4**: Create wrangler.toml for remaining Workers apps
2. **Phase 5**: Update .claude/commands/deploy.md (done)
3. **Phase 6**: Commit and test deployments
