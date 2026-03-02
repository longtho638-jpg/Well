# Tech Debt Audit — Well RaaS Public Release
**Date:** 2026-03-02 | **Scope:** `src/` (non-test, non-locale files)

---

## Executive Summary

**Overall health: GOOD.** No `console.*` leaks, no `: any` types, no `@ts-ignore`, no TODO/FIXME in production code. Main issues are mock data in production services, duplicate GiftCard components, and 25 files exceeding the 200-line guideline.

---

## 1. console.log/warn/error — CLEAN

**Result:** 0 violations in production code.

- `src/test/setup.ts` — console overrides for test suppression only (correct)
- `src/utils/logger.ts:47` — `console[level]` inside the logger utility itself (correct)
- `src/lib/vibe-agent/types.ts:91` — comment only

**Severity:** NONE

---

## 2. `any` Types — CLEAN

**Result:** 0 `: any` or `as any` in non-test TypeScript files.

Files containing the word "any" in comments/strings only (not type annotations):
- `src/agents/core/BaseAgent.ts:30` — comment: "Check if an action violates **any** policies"
- `src/lib/vibe-payment/autonomous-webhook-handler.ts:7` — comment only

**Severity:** NONE

---

## 3. @ts-ignore / @ts-nocheck — CLEAN

**Result:** 0 occurrences anywhere in `src/`.

---

## 4. TODO / FIXME — CLEAN

**Result:** 0 occurrences in production code.

---

## 5. Dead / Problematic Code

### 5.1 Mock Data in Production Service (HIGH)

**File:** `src/services/financeService.ts:31–71`
```ts
const mockTransactions: FinanceTransaction[] = [
    { id: 'R001', partnerName: 'Lan Nguyen', amount: 15900000, ... },
    ...
];
// Used at line 76:
if (!isSupabaseConfigured()) { return mockTransactions; }
```
**Issue:** Real Vietnamese partner names + hardcoded amounts in production bundle. Falls back to mock when Supabase is unconfigured — acceptable for dev but leaks internal test data in the shipped JS.
**Severity:** HIGH
**Fix:** Move mock array to `src/data/` or a DEV-only module; gate with `import.meta.env.DEV` not just `!isSupabaseConfigured()`.

---

### 5.2 docsEngine Mock Endpoints in Production (MEDIUM)

**File:** `src/services/docsEngine.ts:75–97`
```ts
getMockEndpoints() {
    return [
        { path: '/api/users', ... example: 'curl ... api.example.com ...' },
    ];
}
```
**Issue:** Hardcoded placeholder API docs (`api.example.com`) shipped in production bundle. No DEV guard.
**Severity:** MEDIUM
**Fix:** Remove or replace with real endpoint definitions; or gate behind feature flag.

---

### 5.3 Duplicate GiftCard Implementation (MEDIUM)

Two separate GiftCard components with overlapping interface:
- `src/components/MarketingTools/GiftCardSection.tsx` (209 lines) — used by `src/pages/MarketingTools.tsx:148`
- `src/pages/MarketingTools/components/GiftCardManager.tsx` (208 lines) — exported via index.ts but **never consumed** outside its own index

**Severity:** MEDIUM
**Fix:** Delete `GiftCardManager.tsx` and `src/pages/MarketingTools/components/index.ts`, or merge into `GiftCardSection`.

---

### 5.4 Custom Agents Not Wired to UI (LOW)

**Files:**
- `src/agents/custom/CodeReviewerAgent.ts` (204 lines)
- `src/agents/custom/DocsManagerAgent.ts` (202 lines)

Exported via `src/agents/registry.ts` → `src/agents/index.ts`, consumed by `agentRegistry` in UI components. Registry registration is correct; agents are reachable via the agent dashboard. Not dead — just potentially dormant runtime agents.
**Severity:** LOW (informational — verify they surface in AgentDashboard as expected)

---

## 6. Files Exceeding 200-Line Guideline

25 production files exceed 200 lines. Top offenders requiring attention (split candidates):

| File | Lines | Note |
|------|-------|------|
| `src/lib/vibe-agent/agent-memory-store-mem0-pattern.ts` | 277 | already has extracted types files |
| `src/lib/vibe-agent/agent-metrics-collector-netdata-pattern.ts` | 257 | already split into types + charts |
| `src/lib/vibe-agent/agent-status-page.ts` | 236 | standalone pattern module |
| `src/lib/vibe-agent/notification-dispatcher.ts` | 235 | standalone pattern module |
| `src/lib/vibe-agent/agent-heartbeat-monitor.ts` | 222 | standalone pattern module |
| `src/lib/vibe-agent/agi-commerce-orchestrator.ts` | 217 | already has types extracted |
| `src/data/mock-team-members-referrals-and-risk-insights.ts` | 215 | pure data, low risk |
| `src/components/MarketingTools/GiftCardSection.tsx` | 209 | see §5.3 |
| `src/pages/MarketingTools/components/GiftCardManager.tsx` | 208 | see §5.3 (deletable) |
| `src/pages/AgentDashboard.tsx` | 207 | page component, consider splitting |
| `src/agents/custom/CodeReviewerAgent.ts` | 204 | see §5.4 |
| `src/components/marketing/ExitIntentPopup.tsx` | 204 | single-concern, borderline |
| `src/components/HealthCheck/health-check-quiz-interface.tsx` | 204 | quiz UI, extract steps |

**Severity:** LOW (code quality / maintainability)
**Note:** vibe-agent pattern files are reference implementations; their size is acceptable if intentional. Prioritize splitting page components and agent files first.

---

## Summary Table

| Category | Count | Severity | Action |
|----------|-------|----------|--------|
| console.* in production | 0 | — | None |
| `: any` / `as any` types | 0 | — | None |
| @ts-ignore/@ts-nocheck | 0 | — | None |
| TODO/FIXME | 0 | — | None |
| Mock data in prod service | 1 | HIGH | Move behind DEV guard |
| Placeholder mock API docs | 1 | MEDIUM | Remove/replace |
| Duplicate component | 1 | MEDIUM | Delete GiftCardManager |
| Dormant agent registrations | 2 | LOW | Verify runtime wiring |
| Files >200 lines | 25 | LOW | Split over time |

---

## Unresolved Questions

1. Is `financeService.ts` mock fallback intentional for demo deployments where Supabase is absent? If yes, must add explicit `import.meta.env.DEV` guard before RaaS public release.
2. `GiftCardManager` in `src/pages/MarketingTools/components/` — is this a planned replacement for `GiftCardSection` or truly orphaned?
3. Are `CodeReviewerAgent` / `DocsManagerAgent` expected to appear as selectable agents in the production AgentDashboard, or are they internal dev tooling only?
