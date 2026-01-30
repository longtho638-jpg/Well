# Phase 1: Architecture & State Sync

## Overview
**Priority**: High
**Goal**: Standardize how the application handles language state, ensuring synchronization between `i18next`, Zustand, and LocalStorage.

## Context
- Current implementation mixes `LanguageContext` and direct `i18n` imports.
- Need to centralize locale management in `UISlice` or a dedicated `I18nSlice` (if complex), but fitting into `UISlice` is KISS.

## Implementation Steps

1.  **Update UISlice**
    - Add `locale: 'vi' | 'en'` to `UIState`.
    - Add `setLocale` action to `UIActions`.
    - In `setLocale`, call `i18next.changeLanguage(lang)` and update state.

2.  **Persist Configuration**
    - Ensure `locale` is whitelisted in Zustand's `persist` middleware configuration (if used) or implement a simple storage listener.

3.  **Bootstrapping**
    - In `src/i18n.ts`, ensure the initial language is grabbed from storage or defaults to 'vi'.
    - Remove `LanguageContext` if it becomes redundant, or make it consume Zustand state.

4.  **Refactor Hooks**
    - Update `useTranslation` hook to potentially check Zustand state if needed, though standard `useTranslation` from library is usually sufficient for components.

## Success Criteria
- [ ] Changing language in UI updates Zustand state.
- [ ] Reloading page persists the selected language.
- [ ] Vietnamese is the default for new users.
