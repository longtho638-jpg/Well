# Build Bottleneck & Unused Dependencies Scan
**Date:** 2026-03-05
**Project:** WellNexus Distributor Portal
**Build System:** Vite 7.3.1 + React 19

---

## Build Analysis

### Current Build Time
- **Total Time:** 15.55s (prebuild + build)
- **Prebuild Steps:**
  - Sitemap generation: ~2s
  - i18n validation (1640 keys): ~3s
- **Bundle Size:** N/A (build failed - EPIPE error)

### Build Error Analysis
```
[vite:esbuild-transpile] The service was stopped: write EPIPE
```
**Root Cause:** Process interruption during transpilation. Likely causes:
1. M1 cooling daemon killing resource-heavy processes
2. Memory pressure (4GB heap limit)
3. Antigravity Proxy interference

---

## Unused Dependencies (depcheck)

### Production Dependencies (4)
| Package | Usage | Action |
|---------|-------|--------|
| `clsx` | No imports found | ✅ Remove |
| `i18next-http-backend` | Custom backend used | ✅ Remove |
| `react-scroll` | No imports found | ✅ Remove |
| `tailwind-merge` | No imports found | ✅ Remove |

### Dev Dependencies (10)
| Package | Status | Action |
|---------|--------|--------|
| `@testing-library/user-event` | Using Playwright | ✅ Remove |
| `@vitest/coverage-v8` | Coverage builtin | ✅ Remove |
| `ajv` | No valid use | ✅ Remove |
| `claudekit` | Dev-only | 🟡 Optional |
| `minimatch` | No valid use | ✅ Remove |
| `rollup` | Vite handles bundling | ✅ Remove |
| `sharp-cli` | No valid use | ✅ Remove |
| `tailwindcss` | Vite handles CSS | ✅ Remove |
| `ts-node` | Use `tsx` instead | ✅ Remove |
| `wrangler` | No valid use | ✅ Remove |

---

## Heavy Dependencies Analysis

### Largest Bundles (by package.json exclude patterns)
| Bundle | Packages | Size Estimate |
|--------|----------|---------------|
| `react-vendor` | react, react-dom, router, scheduler | ~180KB gz |
| `animation` | framer-motion | ~50KB gz |
| `supabase` | @supabase/* | ~120KB gz |
| `icons` | lucide-react | ~30KB gz |
| `charts` | recharts, geometry | ~150KB gz |
| `ai-sdk` | @ai-sdk/* (excluded from opts) | Variable |

### Special Notes
- **react-pdf/renderer** excluded from optimizeDeps (heavy, lazy-loaded)
- **@ai-sdk/*** excluded from optimizeDeps (large, API-only)
- **sharp** included (image optimization, 2MB native binary)

---

## Vite Config Analysis

### Current Setup
```typescript
manualChunks(id) {
  if (id.includes('node_modules')) {
    if (react/react-dom/router/scheduler) → 'react-vendor'
    framer-motion → 'animation'
    @supabase → 'supabase'
    lucide-react → 'icons'
    i18next → 'i18n'
    zod/react-hook-form → 'forms'
    zustand → 'state'
    @sentry → 'sentry'
    recharts/geometry/surface → 'charts'
  }
}
```

### Recommendations

| Issue | Current | Suggested |
|-------|---------|-----------|
| **Source Maps** | `false` | `true` for production debug |
| **CSS Code Split** | `true` | ✅ Keep |
| **Optimize Deps Exclude** | AI SDKs, PDF | Add `recharts` (large) |
| **Rollup Asset Names** | Default | Custom hash pattern |

### Missing Optimizations
1. **No CSS extraction config** - add `cssExtract: true`
2. **No asset file naming** - add `assetFileNames: '[name]-[hash][extname]'`
3. **No chunk file naming** - add `chunkFileNames: '[name]-[hash].js'`
4. **No dynamic import polyfill** - add `dynamicImportVarsOptions`

---

## Top 5 High-ROI Recommendations

| # | Action | Estimated Impact | Effort |
|---|--------|------------------|--------|
| 1 | Remove unused deps (`clsx`, `react-scroll`, `tailwind-merge`) | -5KB bundle | 2 min |
| 2 | Fix EPIPE error (M1 cooling? memory?) | Build complete | 30 min |
| 3 | Optimize `@ai-sdk/*` imports (code-split) | -40KB initial | 1 hour |
| 4 | Add sourcemaps for production | 2KB overhead, better debug | 5 min |
| 5 | Add `recharts` to optimizeDeps.exclude | Faster dev rebuilds | 1 min |

---

## Code Quality Checks

| Check | Status | Notes |
|-------|--------|-------|
| Lodash usage | ✅ None found | Pure utils |
| Moment.js | ✅ None found | Use `date-fns` or `dayjs` |
| Console.log | ✅ Clean | Only in `logger.ts` wrapper, tests |
| `: any` types | ✅ Clean | Only in test files |

---

## Unresolved Questions

1. **EPIPE error root cause?** Is it M1 cooling daemon or resource pressure?
2. **Is `@ai-sdk/*` package needed at build time?** Or can it be fully lazy?
3. **Should `@react-pdf/renderer` be lazy-loaded?** Currently in optimizeDeps.exclude.
4. **Is `sharp` worth keeping?** 2MB native binary - consider `cloudinary` or `imgproxy`.

---

**Report generated:** 2026-03-05
**Build Status:** ❌ FAILED (EPIPE)
**Next Action:** Fix EPIPE error before bundle analysis
