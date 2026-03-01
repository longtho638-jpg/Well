---
title: "Google/zx Patterns → Well RaaS AGI"
description: "Learn & apply zx's TypeScript-first scripting, pipeline composition, and error handling patterns to Well ecosystem"
status: pending
priority: P3
effort: 8h
branch: main
tags: [architecture, zx, scripting, typescript, pipeline, binh-phap, ch4]
created: 2026-03-01
---

# Binh Phap Ch.4 軍形: Google/zx → Well RaaS AGI

> *"Tiên vi bất khả thắng"* — First make yourself invincible through robust tooling.

## Objective

Learn TypeScript-first scripting, pipeline composition, and fail-fast error handling from Google/zx. Apply to Well's build scripts, service composition, and developer tooling.

## Research

- [Core: Template Execution, Utilities, Error Handling, Pipelines, TypeScript](./research/researcher-01-google-zx.md)

## Implementation Phases

| # | Phase | Effort | Status |
|---|-------|--------|--------|
| 1 | [Fail-Fast Service Error Handling](./phase-01-fail-fast-error-handling.md) | 3h | pending |
| 2 | [Pipeline Service Composition](./phase-02-pipeline-service-composition.md) | 3h | pending |
| 3 | [TypeScript Build & Seed Scripts](./phase-03-typescript-build-scripts.md) | 2h | pending |

## Key zx Patterns Applied

1. **Fail-fast** → Services throw on error by default, explicit opt-in to ignore
2. **Pipeline composition** → Chain service calls like Unix pipes
3. **TypeScript scripting** → Type-safe build/deploy/seed utilities
4. **Retry pattern** → Configurable retry for flaky external APIs
5. **Scoped contexts** → within() pattern for transaction-like scoping
