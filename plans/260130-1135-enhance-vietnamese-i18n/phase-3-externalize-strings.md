# Phase 3: Externalize Hardcoded Strings

## Overview
**Priority**: Medium
**Goal**: Scan for and extract hardcoded Vietnamese/English strings into the `vi.ts` resource file to ensure full localization coverage.

## Context
- Found hardcoded strings in `src/store/slices/uiSlice.ts` (e.g., AI bio generation).
- Likely others in `src/components`.

## Implementation Steps

1.  **Store extraction**
    - In `uiSlice.ts`, move `Tôi là ${name}...` to `locales/vi.ts` under `defaults.bio`.
    - Use `i18next.t` inside the slice action (requires importing the i18n instance directly).

2.  **Component Scan**
    - Review `LandingPage.tsx` and other key pages.
    - Extract UI labels, error messages, and button text.

3.  **Update Keys**
    - Organize new keys logically (e.g., `generatedContent`, `errors`, `actions`).

## Success Criteria
- [ ] `uiSlice.ts` contains no hardcoded user-facing strings.
- [ ] Error messages are localized.
- [ ] `vi.ts` remains structured and clean.
