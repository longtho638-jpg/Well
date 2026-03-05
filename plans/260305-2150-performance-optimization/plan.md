---
title: "Performance Optimization Plan"
description: "Build optimization, tree-shaking, image optimization, memoization"
status: pending
priority: P2
effort: 2h
branch: main
tags: [performance, optimization, build]
created: 2026-03-05
---

# Performance Optimization Plan

## Overview
Build time ~15s với EPIPE errors. Target: <10s build, optimize bundle size.

## Phases

| Phase | Status | Effort | Dependencies |
|-------|--------|--------|--------------|
| [01-remove-unused-deps](./phase-01-remove-unused-deps.md) | pending | 15min | None |
| [02-optimize-recharts-imports](./phase-02-optimize-recharts-imports.md) | pending | 30min | 01 |
| [03-convert-png-to-webp](./phase-03-convert-png-to-webp.md) | pending | 20min | None |
| [04-add-usememo-optimization](./phase-04-add-usememo-optimization.md) | pending | 45min | 01, 02 |

## Verification
- Build time < 10s
- No EPIPE errors
- Bundle size reduced
- Lighthouse score ≥95

## Risks
- Tree-shaking regression → test all charts
- Image quality loss → verify visual fidelity
