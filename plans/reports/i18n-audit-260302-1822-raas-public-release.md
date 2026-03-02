# i18n Audit Report — Well Project
**Date:** 2026-03-02 | **Slug:** raas-public-release

---

## Executive Summary

i18n validation **PASSED** via `pnpm i18n:validate`. All 1547 extracted keys are present in both `vi.ts` and `en.ts`, and all 13 sub-module pairs (en/ vs vi/) are symmetric. However, 18 hardcoded UI strings bypass the translation system entirely.

---

## Results

### 1. Script Output

| Script | Status | Notes |
|--------|--------|-------|
| `pnpm i18n:validate` | PASSED | 1547 keys, all present in both locales |
| `pnpm i18n:check` | ERROR | Requires CLI args (`keys_json_file locale_ts_file`) — not standalone |

### 2. t() Call Stats

| Metric | Count |
|--------|-------|
| Total t() call occurrences (src, excl. tests) | 2068 |
| Unique translation keys extracted by validate script | 1547 |
| Dynamic template-literal t(\`...\`) calls (not validated) | 4 |

### 3. Missing Keys

**vi.ts:** 0 missing keys
**en.ts:** 0 missing keys
**Sub-module symmetry (en/ vs vi/):** 13/13 match

### 4. Hardcoded Strings Found (18 total)

| File | Line | Text | Severity |
|------|------|------|----------|
| `src/App.tsx` | 48 | "Initializing application..." | MEDIUM |
| `src/pages/LeaderDashboard.tsx` | 162 | "Đang tải sơ đồ..." (Vietnamese) | MEDIUM |
| `src/pages/SystemStatus.tsx` | 99 | "System Status" | LOW |
| `src/pages/SystemStatus.tsx` | 119 | "Overall Health" | LOW |
| `src/pages/SettingsPage.tsx` | 59 | "English" (option label) | LOW |
| `src/components/network/network-tree-desktop.tsx` | 52 | "Ranks" | LOW |
| `src/components/network/network-tree-desktop.tsx` | 56 | "Diamond" | LOW |
| `src/components/network/network-tree-desktop.tsx` | 64 | "Silver" | LOW |
| `src/components/network/network-tree-desktop.tsx` | 68 | "Member" | LOW |
| `src/components/Agent/AgentChat.tsx` | 72 | "Active" | LOW |
| `src/components/Agent/AgentChat.tsx` | 122 | "Thinking..." | MEDIUM |
| `src/components/agent-chat/structured-response-card-coach-copilot.tsx` | 17 | "Confidence" | LOW |
| `src/components/reports/commission-report-pdf-generator.tsx` | 37–90 | 6 strings (PDF labels) | LOW |

**PDF generator note:** `commission-report-pdf-generator.tsx` contains 6 hardcoded English strings used in PDF output (react-pdf `<Text>` nodes). These likely need bilingual support but are lower priority than UI strings.

### 5. Dynamic t() Calls (Template Literals)

4 calls use template literals (e.g. `t(\`copilot.tips.${tip}\`)`). These are skipped by the validate script — runtime key resolution means missing keys would only surface at runtime, not at build time.

| File | Pattern |
|------|---------|
| `src/pages/CopilotPage.tsx:166` | `t(\`copilot.tips.${tip}\`)` |
| `src/hooks/useSocialShare.ts` | 3 URL-encoding patterns (not translation keys) |

---

## Severity Summary

| Severity | Count | Description |
|----------|-------|-------------|
| HIGH | 0 | No missing keys |
| MEDIUM | 3 | App init string, VI hardcode in LeaderDashboard, Agent thinking state |
| LOW | 15 | Network rank labels, PDF report labels, SystemStatus, SettingsPage |

---

## Recommendations

1. **MEDIUM — App.tsx:48**: Move `"Initializing application..."` to a t() call (key: `common.initializing`)
2. **MEDIUM — LeaderDashboard.tsx:162**: Replace `"Đang tải sơ đồ..."` with `{t('common.loading')}` (key already exists)
3. **MEDIUM — AgentChat.tsx:122**: Replace `"Thinking..."` with a t() key
4. **LOW — commission-report-pdf-generator.tsx**: Add bilingual PDF support for public release
5. **LOW — network-tree-desktop.tsx**: Rank names (Diamond/Silver/Member) should use t() — already exist as data values
6. **LOW — `pnpm i18n:check`**: Fix script to accept no-arg mode or document correct usage

---

## Unresolved Questions

- Are `copilot.tips.*` keys fully covered at runtime? The validate script skips dynamic keys — a spot-check is recommended.
- Should PDF report labels (`commission-report-pdf-generator.tsx`) support Vietnamese for the public release?
