# Phase 1: Fix Pre-existing Test Failures

## Context Links
- Parent Plan: [[260312-1948-hardening/plan.md]]
- Dependencies: None (can run in parallel with Phase 2)
- Related: `src/__tests__/e2e/dunning-flow.test.ts`, `src/utils/auth/__tests__/auth-token-utils.test.ts`

## Parallelization Info
- **Can run concurrently with:** Phase 2 (different file ownership)
- **Must complete before:** Phase 3 (test suite execution)

## Overview
- **Date:** 2026-03-12
- **Description:** Fix 38 failing tests in dunning-flow E2E and auth-token-utils unit tests
- **Priority:** High
- **Implementation Status:** Pending
- **Review Status:** Pending

## Key Insights
- Previous session: 1289/1327 tests passing (38 failures)
- Dunning flow tests: Timing issues with mock Stripe events
- Auth token tests: JWT expiration timing mismatches

## Requirements
- Fix all 38 failing tests without mocking actual behavior
- Maintain test realism (no fake data for CI/CD)
- Preserve test coverage while fixing timing issues

## Architecture
Tests follow Vitest patterns with vi.mock() for external dependencies. Fix must maintain mock isolation while correcting timing logic.

## Related Code Files
- `src/__tests__/e2e/dunning-flow.test.ts` (modify)
- `src/utils/auth/__tests__/auth-token-utils.test.ts` (modify)
- `src/utils/auth/auth-token-utils.ts` (read only - understand source)

## File Ownership
**This phase owns:** Both test files listed above - exclusive modification rights

## Implementation Steps
1. Read dunning-flow.test.ts to identify failing tests
2. Read auth-token-utils.test.ts to identify timing issues
3. Fix mock data timing to use vi.useFakeTimers() properly
4. Ensure Stripe event timestamps use relative time (Date.now())
5. Run vitest on fixed files to verify

## Todo List
- [ ] Identify exact failing test names in dunning-flow.test.ts
- [ ] Identify exact failing test names in auth-token-utils.test.ts
- [ ] Fix dunning flow mock Stripe invoice timing
- [ ] Fix auth token JWT expiration checks
- [ ] Verify tests pass locally

## Success Criteria
- Both test files pass 100% when run individually
- No tests disabled or skipped
- No fake data - all mocks remain realistic

## Conflict Prevention
- No overlap with Phase 2 (which creates NEW test files)
- No changes to source files (only test files modified)

## Risk Assessment
- **Risk:** Tests may have legitimate failures requiring source fixes
- **Mitigation:** If test reveals actual bug, fix source file and update test

## Security Considerations
- Test fixes must not weaken security validation
- JWT tests must continue to validate expiration properly

## Next Steps
After Phase 1 completes: Merge with Phase 2 results, proceed to Phase 3 (full test suite)
