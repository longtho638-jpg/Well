# WellNexus Post-Dev Hardening Plan

**Date:** 2026-03-12 | **Status:** Ready | **Priority:** High

---

## Dependency Graph

```
Phase 1 (Fix broken tests) ─┬─> Phase 3 (Run full test suite) ─> Phase 4 (Production build) ─> Phase 5 (Git push)
Phase 2 (Add error path tests) ─┘
```

## Execution Strategy

**Parallel:** Phases 1-2 can run independently (different file ownership)
**Sequential:** Phase 3 depends on 1+2, Phase 4 depends on 3, Phase 5 depends on 4

## File Ownership Matrix

| Phase | Files Modified | Owner |
|-------|---------------|-------|
| 1 | `src/__tests__/e2e/dunning-flow.test.ts`, `src/utils/auth/__tests__/auth-token-utils.test.ts` | fullstack-dev |
| 2 | `src/__tests__/unit/license-crud-errors.test.ts` (new) | fullstack-dev |
| 3 | Test execution only | tester |
| 4 | Build execution only | fullstack-dev |
| 5 | Git operations | git-manager |

## Phases Overview

| Phase | Status | Description |
|-------|--------|-------------|
| [Phase 1](./phase-01-fix-broken-tests.md) | pending | Fix pre-existing test failures in dunning-flow and auth-token-utils |
| [Phase 2](./phase-02-add-error-path-tests.md) | pending | Add error handling tests for License CRUD components |
| [Phase 3](./phase-03-run-test-suite.md) | pending | Run full vitest suite, verify all tests pass |
| [Phase 4](./phase-04-production-build.md) | pending | Run production build, verify 0 TypeScript errors |
| [Phase 5](./phase-05-git-push.md) | pending | Commit and push with hardening summary |

---

**Next Step:** Execute Phase 1 - Fix broken tests (dunning-flow + auth-token-utils)
