# Rừng Chiến Lược — Performance Audit Plan

**Date:** 2026-03-05
**Status:** In Progress
**Priority:** High

---

## Mục Tiêu

Đánh thẳng điểm yếu performance (hiện tại 4/10 → mục tiêu 10/10).

**Focus:** Build time, bundle size, runtime performance.

---

## Ngũ Sự (5 Yếu Tố) — Performance Metrics

| Yếu Tố | Hiện Trạng | Mục Tiêu | Verification |
|--------|------------|----------|--------------|
| **Build Time** | ~11s | < 5s | `time npm run build` |
| **Bundle Size** | 1.6MB (react-pdf) | < 500KB | `du -sh dist/assets` |
| **LCP** | Unknown | < 2.5s | Lighthouse |
| **TTI** | Unknown | < 3.5s | Lighthouse |
| **CLS** | Unknown | < 0.1 | Lighthouse |

---

## Thất Kế (7 Phép So Sánh)

1. **Code Splitting:** Đã lazy load pages → Cần optimize chunks lớn
2. **Bundle Analysis:** react-pdf 1.6MB → Tìm alternative
3. **Image Optimization:** Đã WebP → Cần CDN caching
4. **Tree Shaking:** Đã ES modules → Check dead code
5. **Caching Strategy:** Đã Service Worker → Optimize stale-while-revalidate
6. **API Optimization:** Real-time subscriptions → Batch updates
7. **Render Optimization:** Đã React.memo → Check re-renders

---

## Kế Hoạch Hành Động

### Phase 1: Audit (15 min)
- [ ] Chạy Lighthouse audit
- [ ] Bundle analysis với `npm run build -- --stats`
- [ ] Identify top 3 performance bottlenecks

### Phase 2: Quick Wins (30 min)
- [ ] Replace lazy react-pdf với manual chunk
- [ ] Configure Vite manualChunks tối ưu
- [ ] Add preconnect/preload hints

### Phase 3: Deep Optimization (45 min)
- [ ] Optimize Supabase queries
- [ ] Batch real-time updates
- [ ] Implement virtual scrolling cho lists dài

### Phase 4: Verification (10 min)
- [ ] Re-run Lighthouse
- [ ] Compare before/after metrics
- [ ] Document improvements

---

## Success Criteria

- ✅ Build time: < 5s (từ 11s)
- ✅ Bundle size: < 500KB main chunk (từ 1.6MB)
- ✅ Lighthouse Performance: > 90
- ✅ LCP: < 2.5s
- ✅ Tests: 100% pass

---

## Files To Create

1. `plans/reports/performance-audit-260305-XXXX.md` — Audit report
2. `vite.config.optimized.ts` — Optimized config (if needed)

## Files To Update

1. `vite.config.ts` — manualChunks optimization
2. `src/config/app-lazy-routes-and-suspense-fallbacks.ts` — Split chunks
3. `index.html` — Add preconnect/preload

---

## Ràng Buộc

- KHÔNG refactor toàn bộ codebase
- ONLY changes với ROI cao nhất
- ƯU TIÊN build time và bundle size
- Tests PHẢI pass 100%
