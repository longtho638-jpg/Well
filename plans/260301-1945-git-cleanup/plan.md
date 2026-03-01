---
title: "Git cleanup — stage, commit, verify"
description: "Stage all pending changes, commit as chore cleanup, verify .gitignore and clean tree"
status: pending
priority: P3
effort: 5m
branch: main
tags: [git, cleanup, chore]
created: 2026-03-01
---

# Git Cleanup Plan

## Tổng quan

Stage + commit pending changes từ deps update session trước. Verify .gitignore coverage.

## Changes Summary

6 modified files (deps update + test improvements):
- `package.json` — vitest pool forks → vmThreads
- `vitest.config.ts` — thêm env, fileParallelism, excludes
- `src/test/setup.ts` — cleanup comments, thêm act() suppression
- `src/lib/__tests__/analytics.test.ts` — fix window mock
- `src/utils/validate-config.test.ts` — cleanup test assertions
- `public/sitemap.xml` — date update

1 untracked directory:
- `plans/260301-1929-resources-update-deps/` — previous plan

## Phases

### Phase 1: Verify .gitignore ✅
- [x] `node_modules` covered (line 14)
- [x] `.env` covered (line 20)
- [x] `dist` covered (line 15)
- [x] `.env.local`, `.env.*.local` covered (lines 21-22)

### Phase 2: Stage & Commit
- [ ] `git add -A`
- [ ] `git status` — verify staged files
- [ ] `git commit -m 'chore(well): cleanup test config + vitest pool migration'`

### Phase 3: Verify Clean Tree
- [ ] `git status` shows clean working tree
- [ ] No untracked files remain

## Risk Assessment

**Low risk** — all changes are test config + deps, no production code affected.
