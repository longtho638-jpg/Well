# Plan: Enhance Vietnamese i18n Support

> **Objective**: Apply research findings to solidify Vietnamese language support, enforce formatting standards, and externalize hardcoded strings.

## Status
- [ ] Phase 1: Architecture & State Sync
- [ ] Phase 2: Formatting Enforcement
- [ ] Phase 3: Externalize Hardcoded Strings

## Dependencies
- `react-i18next`
- `src/services/i18nService.ts`

## Phases

### [Phase 1: Architecture & State Sync](./phase-1-architecture-sync.md)
**Goal**: Ensure `i18next` and Zustand are perfectly synced for locale state.
- Verify `LanguageContext` vs Zustand `UISlice` overlap.
- Implement persistent locale storage via Zustand persist.
- Set Vietnamese as strict default.

### [Phase 2: Formatting Enforcement](./phase-2-formatting-enforcement.md)
**Goal**: Replace ad-hoc `Intl` calls with centralized `i18nService`.
- Audit usage of `new Intl.NumberFormat`.
- Refactor to use `i18nService.formatCurrency` / `getNumberFormatter`.
- Ensure correct `vi-VN` patterns (dots for thousands).

### [Phase 3: Externalize Hardcoded Strings](./phase-3-externalize-strings.md)
**Goal**: Move remaining hardcoded text to `vi.ts`.
- Scan `uiSlice.ts`, `LandingPage.tsx`, and components.
- Extract strings to `src/locales/vi.ts`.
- Use `t()` helper in components/hooks.
