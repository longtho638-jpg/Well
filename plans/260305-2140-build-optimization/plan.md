# Build Optimization Plan — 13s → 5s

**Date:** 2026-03-05
**Target:** Build time < 5s (current: 13.72s)

---

## Current State

| Metric | Value | Target |
|--------|-------|--------|
| Build Time | 13.72s | < 5s |
| Total Bundle | 2.3MB | < 500KB |
| Largest Chunk | react-pdf 1.6MB | Lazy only |
| Chunks | 50+ | < 30 |

---

## Optimization Strategies

### 1. Vite Config Optimizations (5 min)
- [ ] Enable `build.target: 'esnext'` (less transpilation)
- [ ] Set `build.minify: false` in dev
- [ ] Configure `ssr: true` for better splitting
- [ ] Add `build.rollupOptions.output: { inlineDynamicImports: false }`

### 2. Bundle Size Reduction (15 min)
- [ ] Tree-shake recharts (import only used charts)
- [ ] Lazy load @sentry (only on error)
- [ ] Lazy load framer-motion (homepage only)
- [ ] Remove unused lucide-react icons

### 3. Code Splitting (10 min)
- [ ] Split admin routes separately
- [ ] Split health routes separately
- [ ] Dynamic import for heavy components

### 4. Caching (5 min)
- [ ] Enable `build.watch` for dev
- [ ] Add `.vite` to gitignore
- [ ] Configure long-term caching headers

---

## Quick Wins (ROI Highest)

1. **Recharts tree-shaking** — Save ~300KB, faster parse
2. **ESBuild target esnext** — Save 2-3s transpilation
3. **Sentry lazy load** — Save ~100KB initial load

---

## Verification

```bash
# Clean build
rm -rf .vite dist
time npm run build

# Expected: < 8s (50% improvement)
# Target: < 5s (63% improvement)
```
