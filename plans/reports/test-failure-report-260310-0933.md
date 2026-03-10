# Test Failure Report -- Phase 7-8 Split

**Date:** 2026-03-10 09:32
**Session:** lint-fix-phase78
**Status:** 44 failed / 43 passed (87 files) | 109 failed / 899 passed (1008 tests)

---

## Root Cause

Splitting Phase 7-8 service files broke tests that rely on:
1. Private methods now in separate helper files
2. Export changes from modularization
3. Method signature changes

---

## Critical Test Failures

### 1. `raas-event-emitter.test.ts` (Multiple failures)

**Error:** `createEvent is not a function`

```typescript
// Test expects:
const event = raasEventEmitter.createEvent({...})

// But method was moved/renamed in refactor
```

**Fix needed:** Export `createEvent` method or update test to use new API

---

### 2. `usage-forecast-service.test.ts` (6 failures)

**Error:** `calculateLinearRegression is not a function`

```typescript
// Test accesses private method:
const service = forecastService as any
const result = service.calculateLinearRegression(data)

// Method may have been moved to helpers or renamed
```

**Fix needed:**
- Export method from helpers file
- Or update test to use public API

---

## Files Affected

| Test File | Error Count | Root Cause |
|-----------|-------------|------------|
| raas-event-emitter.test.ts | ~20 | Missing createEvent export |
| usage-forecast-service.test.ts | 6 | calculateLinearRegression moved |
| overage-calculator.test.ts | TBD | Functions split to helpers |
| payment-retry-scheduler.test.ts | TBD | Methods refactored |

---

## Recommended Fix Strategy

### Option A: Restore Exports (Quick)
Add re-exports to main service files:
```typescript
// In usage-forecast-service.ts
export { calculateLinearRegression, calculateConfidence } from './usage-forecast-helpers'
```

### Option B: Update Tests (Better)
Update tests to import from correct modules:
```typescript
import { calculateLinearRegression } from '@/services/usage-forecast-helpers'
```

### Option C: Test Wrapper (Pragmatic)
Add test wrapper in service files:
```typescript
// For testing only
if (process.env.NODE_ENV === 'test') {
  export const calculateLinearRegression = internalCalculateLinearRegression
}
```

---

## Next Steps

1. **Identify all missing exports** from split files
2. **Add re-exports** to main service files
3. **Re-run tests** to verify fix
4. **Update test imports** for long-term maintainability

---

## Unresolved Questions

- Which other services have similar export issues?
- Should tests import from helpers directly?
- Is there a test utility file that needs updating?
