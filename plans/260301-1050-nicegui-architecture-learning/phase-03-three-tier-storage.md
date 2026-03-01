# Phase 3: Three-Tier Storage Architecture

## Context
- Parent: [plan.md](./plan.md)
- Inspired by: NiceGUI's `app.storage.user` / `app.storage.client` / `app.storage.general`

## Overview
- **Date:** 2026-03-01
- **Priority:** P2
- **Implementation:** pending
- **Review:** pending

Formalize three storage tiers inspired by NiceGUI: Supabase (persistent), Zustand (session), localStorage (UI preferences). Clear data ownership rules prevent confusion about where state lives.

## Key Insights

NiceGUI separates storage: user-scoped (persists across sessions, server-side), client-scoped (browser, survives refresh), general (app-wide config). Each tier has clear purpose.

**Applied to Well:** Currently state scattered. Formalize: Supabase = source of truth (user data, orders, commissions). Zustand = session state (UI state, cached responses, navigation). localStorage = UI preferences (theme, language, sidebar, dismissed banners).

## Requirements
- Clear documentation of what goes where
- Migration of misplaced state to correct tier
- Storage utility hooks per tier
- Hydration strategy (load persistent → merge session → apply preferences)

## Architecture

```
Tier 1: SUPABASE (Persistent, server-authoritative)
├── User profile, auth tokens
├── Orders, commissions, withdrawals
├── Team hierarchy, network data
├── Agent configs, workflow definitions
└── AI usage logs, activity history

Tier 2: ZUSTAND (Session, in-memory)
├── Current page/route state
├── Cached API responses (stale-while-revalidate)
├── Form draft data (before submit)
├── UI interaction state (selected filters, expanded rows)
└── Real-time subscription data

Tier 3: LOCALSTORAGE (Preferences, survives sessions)
├── Theme preference (dark/light)
├── Language preference (vi/en)
├── Sidebar collapsed state
├── Dismissed notification IDs
└── Last visited page
```

## Implementation Steps
1. Document storage tier rules in code-standards.md
2. Create `usePreferences()` hook for localStorage tier
3. Create `usePersistentData()` hook for Supabase tier
4. Audit current state — find misplaced data
5. Migrate UI preferences from Zustand to localStorage
6. Migrate cached data patterns to Zustand with TTL
7. Add hydration sequence: Supabase → Zustand → localStorage
8. Create storage tier documentation for developers

## Todo
- [ ] Document storage tier rules
- [ ] Create usePreferences() hook
- [ ] Audit current state placement
- [ ] Migrate misplaced state
- [ ] Implement hydration sequence
- [ ] Update code-standards.md
- [ ] Tests for storage hooks

## Success Criteria
- Every piece of state documented in correct tier
- UI preferences survive browser restart (localStorage)
- Session state clears on logout (Zustand reset)
- Persistent data always from Supabase (source of truth)

## Risk Assessment
- **Low:** State migration is behavioral-preserving
- **Low:** localStorage has 5MB limit — UI prefs are tiny

## Security Considerations
- NEVER store auth tokens in localStorage (keep in Zustand/memory)
- localStorage data visible in DevTools — no sensitive data
- Supabase RLS ensures data isolation per user

## Next Steps
- Phase 4 uses localStorage tier for theme preference persistence
