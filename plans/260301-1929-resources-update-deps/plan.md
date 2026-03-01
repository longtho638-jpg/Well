---
title: "RESOURCES: Update deps & fix audit"
description: "Update critical dependencies, fix npm audit vulnerabilities, verify clean tree"
status: pending
priority: P2
effort: 1h
branch: main
tags: [deps, security, maintenance]
created: 2026-03-01
---

# RESOURCES: Update Dependencies & Fix Audit

## Context

- Project: Well (pnpm workspace in mekong-cli monorepo)
- Lockfile: `pnpm-lock.yaml` at monorepo root
- Package manager: pnpm

## Current State

### Outdated Packages (ALL major version jumps)

| Package | Current | Latest | Risk |
|---------|---------|--------|------|
| @ai-sdk/google | 1.2.22 | 3.0.34 | HIGH — API changes |
| @ai-sdk/openai | 1.3.24 | 3.0.37 | HIGH — API changes |
| ai | 4.3.19 | 6.0.105 | HIGH — major rewrite |
| framer-motion | 11.18.2 | 12.34.3 | MEDIUM — API stable |
| react-router-dom | 6.30.3 | 7.13.1 | HIGH — loader/action pattern |
| recharts | 2.15.4 | 3.7.0 | MEDIUM — component API |
| tailwind-merge | 2.6.1 | 3.5.0 | LOW — utility lib |
| zod | 3.25.76 | 4.3.6 | HIGH — schema API changes |
| zustand | 4.5.7 | 5.0.11 | MEDIUM — store API |
| lucide-react | 0.563.0 | 0.575.0 | LOW — minor bump |

### Vulnerabilities (pnpm audit)

| Severity | Package | Affects Well? | Fix |
|----------|---------|---------------|-----|
| low | ai <5.0.52 | YES | Update ai to ^5.0.52+ |
| high | xlsx <0.19.3 | NO (com-anh-duong-10x) | N/A |
| high | xlsx <0.20.2 | NO (com-anh-duong-10x) | N/A |

## Phases

| # | Phase | Status | Risk |
|---|-------|--------|------|
| 1 | [Safe updates (patch/minor + lucide)](phase-01-safe-updates.md) | pending | LOW |
| 2 | [Fix ai SDK vulnerability](phase-02-fix-ai-vulnerability.md) | pending | MEDIUM |
| 3 | [Verification & commit](phase-03-verification.md) | pending | LOW |

## Decision: Major Version Updates

All 9 major bumps require separate migration plans — **NOT in scope** for this task.
Only `lucide-react` (0.563→0.575) is a safe minor bump.

## Unresolved Questions

- Should we create follow-up plans for major version migrations (react-router v7, zod v4, etc)?
