# Code Review: Production Stability Issues

## Scope
- **Files Reviewed**: vite.config.ts, tsconfig.json, 1176 production source files
- **Build Test**: Failed (EPIPE error after 4115 modules)
- **Focus**: Memory optimization, circular dependencies, console statements, performance

---

## CRITICAL ISSUES (Must Fix Before Production)

### 1. Circular Chunk Dependencies - BUILD BREAKING

**Severity**: CRITICAL - Build Failure

**Error**:
```
Circular chunk: animation -> ai-sdk -> animation
Circular chunk: ai-sdk -> charts -> ai-sdk
[vite:esbuild-transpile] The service was stopped: write EPIPE
```

**Root Cause**: `vite.config.ts` manualChunks creates circular dependencies:
- `animation` chunk (framer-motion) depends on components using `@ai-sdk`
- `ai-sdk` chunk depends on components using `recharts` (charts)
- `charts` chunk depends on components using `@ai-sdk`

**Affected Files**:
- 238 files import `framer-motion`
- 21 files import `recharts`
- 3 files import `@ai-sdk`

**Fix**:
```typescript
// Option 1: Merge conflicting chunks
manualChunks(id) {
  if (id.includes('node_modules')) {
    // Merge animation + ai-sdk + charts into single heavy chunk
    if (
      id.includes('framer-motion') ||
      id.includes('@ai-sdk') ||
      id.includes('recharts') ||
      id.includes('react-js-geometry')
    ) {
      return 'vendor-heavy';
    }
    // ... rest of chunks
  }
}

// Option 2: Remove manualChunks entirely (simpler)
manualChunks: undefined // Let Vite auto-optimize
```

---

### 2. Ebuild Memory Exhaustion

**Severity**: HIGH - Build Fails

**Current Config**:
```bash
NODE_OPTIONS=--max-old-space-size=4096  # 4GB
```

**Issue**: 4115 modules transformed before crash - insufficient memory

**Fix**:
```bash
# package.json build script
"build": "NODE_OPTIONS=--max-old-space-size=8192 vite build"
```

**Alternative** (for CI/CD):
```yaml
# .github/workflows/build.yml
env:
  NODE_OPTIONS: --max-old-space-size=8192
```

---

### 3. Console Statements in Production Code

**Severity**: MEDIUM - Tech Debt / Performance

**Count**: 100+ console.log/warn/error statements

**Top Offenders**:

| File | Console Count | Type |
|------|---------------|------|
| `lib/usage-aggregator.ts` | 20+ | log/warn/error |
| `lib/overage-calculator.ts` | 10+ | log/error |
| `lib/grace-period-engine.ts` | 10+ | error |
| `services/agencyos-usage-sync.ts` | 10+ | error |
| `lib/rate-limiter-cloudflare.ts` | 5+ | error/log |
| `lib/raas-license-provision.ts` | 5+ | error |

**Issue**: `vite.config.ts` line 11 only removes `console.log`:
```typescript
pure: ['console.log']  // Doesn't catch warn/error
```

**Fix Options**:

1. **Use structured logger** (recommended):
```typescript
import { createLogger } from '@/utils/logger';
const logger = createLogger('UsageAggregator');

// Replace:
console.error('[UsageAggregator] Error:', error)
// With:
logger.error('Error processing event', { error })
```

2. **Remove all debug logs** (aggressive):
```bash
# Find all console statements
grep -rn "console\." src --include="*.ts" --include="*.tsx" \
  | grep -v "node_modules" | grep -v "__tests__" | grep -v "test/"
```

3. **Extend esbuild pure config**:
```typescript
esbuild: {
  pure: ['console.log', 'console.warn', 'console.debug'],
  keepNames: true,
}
```

---

## HIGH PRIORITY

### 4. Potential Memory Leaks - Realtime Subscriptions

**File**: `src/lib/usage-aggregator.ts` (lines 206-217)

**Pattern**:
```typescript
subscribe(): void {
  this.channel = this.supabase.channel(...)
    .subscribe()
  console.warn(`Realtime subscription started for org ${this.orgId}`)
}

unsubscribe(): void {
  if (this.channel) {
    this.supabase.removeChannel(this.channel)
    this.channel = null
  }
}
```

**Risk**: Components may forget to call `unsubscribe()` on unmount

**Fix**: Ensure cleanup in all components using UsageAggregator:
```typescript
useEffect(() => {
  aggregator.subscribe();
  return () => {
    aggregator.unsubscribe();  // MUST call this
  };
}, []);
```

**Verification**:
```bash
grep -rn "UsageAggregator" src --include="*.tsx" -A 10 \
  | grep -B 5 "useEffect" | grep -c "unsubscribe"
```

---

### 5. Large Files Risk

**Files >500 lines** (excluding tests/locales):

| File | Lines | Risk |
|------|-------|------|
| `lib/usage-aggregator.ts` | 747 | HIGH - Complex aggregation logic |
| `lib/overage-calculator.ts` | 612 | HIGH - Billing calculations |
| `lib/quota-enforcer.ts` | 503 | MEDIUM - Enforcement logic |
| `lib/rate-limiter-cloudflare.ts` | 472 | MEDIUM - Rate limiting |
| `lib/audit-log-service.ts` | 545 | MEDIUM - Audit trails |
| `components/raas/LicenseManagementDashboard.tsx` | 471 | MEDIUM - UI complexity |

**Recommendation**: Split files >500 lines into focused modules:
- `usage-aggregator.ts` → `aggregator/`, `realtime/`, `stripe-sync/`
- `overage-calculator.ts` → `calculator/`, `transactions/`, `polar-sync/`

---

## MEDIUM PRIORITY

### 6. Missing Error Boundaries

**Issue**: No global error boundary detected for React components

**Risk**: Single component error crashes entire app

**Fix**: Add error boundary wrapper:
```typescript
// src/components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to Sentry
    Sentry.captureException(error, { contexts: { react: info } });
  }
  // ...
}
```

---

### 7. Image Optimization Not Configured

**Current**: `vite-plugin-image-optimizer` installed (vite.config.ts lines 23-52)

**Issue**: Plugin configured but may not be active in all builds

**Verification**:
```bash
npm run build 2>&1 | grep -i "image\|optimize"
```

---

## LOW PRIORITY

### 8. Build Target Mismatch

**Config**:
```typescript
target: 'es2020'  // vite.config.ts line 8
```

**Recommendation**: Consider `es2022` for better tree-shaking:
```typescript
target: 'es2022',  // Better support for optional chaining, nullish coalescing
```

---

## Edge Cases Found

1. **Realtime subscription without cleanup**: Components may leak memory if unmount before disconnection
2. **Cached data staleness**: `UsageAggregator` cache has 60s TTL but no invalidation on mutation
3. **Console in test setup**: `src/test/setup.ts` and `src/__tests__/setup.ts` override console.warn/error - may hide test failures
4. **Backup files in codebase**: `.bak` files found (`use-polar-analytics.ts.bak`, `use-top-endpoints.ts.bak`, `CohortAnalysisChart.tsx.bak`, `RevenueByTierChart.tsx.bak`) - should be removed

---

## Positive Observations

1. **Structured logger exists**: `src/utils/logger.ts` provides excellent foundation
2. **Chunk splitting configured**: Good vendor separation strategy
3. **Image optimization plugin**: Configured for WebP/AVIF conversion
4. **Test pool configuration**: `forks` instead of `threads` avoids esbuild crashes (vitest.config.ts)
5. **Strict TypeScript**: `strict: true` with proper lib config

---

## Recommended Actions

### Immediate (Before Next Deploy):

1. **Fix circular dependencies** - Remove or merge conflicting manualChunks
2. **Increase build memory** - 8GB for esbuild
3. **Remove backup files** - Delete `*.bak` files

### Short-term (This Sprint):

4. **Console cleanup pass** - Replace with logger or remove
5. **Verify realtime cleanup** - Audit all UsageAggregator consumers
6. **Split large files** - Start with `usage-aggregator.ts`

### Medium-term (Next Sprint):

7. **Add error boundaries** - Global + route-level
8. **File size enforcement** - Add ESLint rule for max-lines
9. **Memory profiling** - Run Chrome DevTools Memory profile

---

## Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Build Status | FAILING | SUCCESS |
| Console Statements | 100+ | 0 (prod) |
| Files >500 lines | 6 | 0 |
| Circular Dependencies | 2 | 0 |
| Type Coverage | 100% | 100% |

---

## Unresolved Questions

1. Is `UsageAggregator` used in any components without proper cleanup?
2. Are the `.bak` files needed or can they be deleted?
3. Should we enable sourcemaps for production debugging (`sourcemap: true`)?
4. Is the `visualizer` plugin needed in production builds or dev only?

---

**Report Generated**: 2026-03-09
**Reviewer**: code-reviewer agent
**Next Review**: After fixes applied
