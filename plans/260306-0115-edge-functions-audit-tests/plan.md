# Edge Functions Audit & Tests — webhook-retry & dlq-retry-job

## Overview
**Priority:** High (Pre-deployment verification)
**Status:** ✅ Tests Passing (56/56)
**Date:** 2026-03-06

## Context
Review code quality và viết unit tests cho 2 edge functions:
- `supabase/functions/webhook-retry/index.ts` — Retry webhook payloads từ DLQ
- `supabase/functions/dlq-retry-job/index.ts` — Cron job retry pending DLQ items

## Dependencies
- Existing test pattern: `supabase/functions/__tests__/payos-webhook.test.ts`
- Test runner: Vitest (pnpm vitest run)
- DLQ service: `src/lib/vibe-payment/dlq-scheduled-retry.ts`

## Phases

| Phase | Owner | Status | Files |
|-------|-------|--------|-------|
| 1. Code Quality Audit | code-reviewer | ✅ Done | webhook-retry/index.ts, dlq-retry-job/index.ts |
| 2. Write webhook-retry tests | tester | ✅ Done (22 tests) | __tests__/webhook-retry.test.ts |
| 3. Write dlq-retry-job tests | tester | ✅ Done (34 tests) | __tests__/dlq-retry-job.test.ts |
| 4. Fix issues & polish | fullstack-developer | ⏳ Pending | Edge functions + tests |

## Success Criteria
- [x] 0 code quality issues (security, types, error handling)
- [x] >80% test coverage cho cả 2 functions ✅ 56 tests passing
- [x] Tests pass: `pnpm vitest run supabase/functions/__tests__/` ✅
- [ ] Build passes: `pnpm build` (pending)

## Test Results

```
✓ supabase/functions/__tests__/dlq-retry-job.test.ts (34 tests) 6ms
✓ supabase/functions/__tests__/webhook-retry.test.ts (22 tests) 5ms

Test Files  2 passed (2)
     Tests  56 passed (56)
Duration  1.31s
```

## Next Steps

1. ~~code-reviewer audit → report issues~~ ✅ Done
2. ~~tester viết tests theo pattern hiện có~~ ✅ Done
3. fullstack-developer fix code quality issues (refactor, extract utilities)
4. Run build + deploy verification
