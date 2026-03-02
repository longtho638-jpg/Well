---
title: "Well Architecture Refactor — 96 Files Under 200 LOC"
description: "Parallel refactoring plan: fix build, split 96 oversized files, harden i18n/CI pipeline"
status: pending
priority: P1
effort: 18h
branch: main
tags: [refactor, architecture, build-fix, i18n, enforcement]
created: 2026-03-02
---

## Dependency Graph

```
Phase 01 (P0) ─────────────────────────────────────┐
  Build System Fix                                  │
                                                    ▼
Phase 02 ──┬── Phase 03 ──┬── Phase 04 ──┬── Phase 05 ──┬── Phase 06
Vibe-Agent │  Pages       │  Components  │  Services/   │  i18n +
SDK Split  │  Split       │  Split       │  Utils/Hooks │  Monitoring
(parallel) │  (parallel)  │  (parallel)  │  (parallel)  │  + Enforce
           └──────────────┴──────────────┴──────────────┘     │
                                                              ▼
                                                         Phase 07
                                                         Validation
```

## Parallelization

| Phase | Depends On | Can Parallel With | Files | Est. |
|-------|-----------|-------------------|-------|------|
| 01 | none | none | 3 | 1h |
| 02 | 01 | 03, 04, 05 | 19 | 4h |
| 03 | 01 | 02, 04, 05 | 16 | 4h |
| 04 | 01 | 02, 03, 05 | 15 | 3h |
| 05 | 01 | 02, 03, 04 | 14 | 3h |
| 06 | 01 | 02-05 (partial) | 6 | 2h |
| 07 | 02-06 | none | 0 | 1h |

## File Ownership (exclusive — no file in multiple phases)

- **Phase 01**: `.npmrc`, `package.json` (scripts only), `eslint.config.js`
- **Phase 02**: `src/lib/vibe-agent/**` (10 files >200 LOC)
- **Phase 03**: `src/pages/**` (16 files >200 LOC)
- **Phase 04**: `src/components/**` (15 files >200 LOC)
- **Phase 05**: `src/agents/**`, `src/services/**`, `src/hooks/**`, `src/utils/**`, `src/store/**`, `src/types.ts`, `src/data/**`, `src/lib/vibe-payment/**`
- **Phase 06**: `scripts/`, `.github/workflows/ci.yml`, `.husky/`
- **Phase 07**: No files modified — validation only

## Skip List (acceptable >200 LOC)

- 14 locale files (`src/locales/**`) — data files
- 7 test files (`src/__tests__/**`, `*.test.ts`) — test coverage
- `src/App.tsx` (239 LOC) — route registry, acceptable as single source of truth

## Score Target: 76/100 -> 85/100
