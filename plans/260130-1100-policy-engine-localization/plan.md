---
title: "Policy Engine Localization & Standardization"
description: "Fix broken localization keys in PolicyEngine and standardize to camelCase."
status: completed
priority: P2
effort: 1h
branch: main
tags: [ui, localization, refactoring]
created: 2026-01-30
---

# Policy Engine Localization & Standardization

## Executive Summary
The `PolicyEngine.tsx` component uses `policyengine.*` translation keys, but these keys appear to be missing from `en.ts` (which has `admin.policy`) or inconsistent in `vi.ts`. This plan focuses on fixing these missing translations and standardizing the key format to `policyEngine` (camelCase) to match the `AgentDashboard` convention.

## Phases

### Phase 1: Analysis & key Mapping
- **Status:** Completed
- **Goal:** Identify all keys used in `PolicyEngine.tsx` and map them to existing or new structure.
- **Details:** [Phase 1 Details](./phase-01-analysis.md)

### Phase 2: Implementation
- **Status:** Completed
- **Goal:** Update component and locale files.
- **Details:** [Phase 2 Details](./phase-02-implementation.md)
