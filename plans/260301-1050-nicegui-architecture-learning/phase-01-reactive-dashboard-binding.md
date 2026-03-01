# Phase 1: Reactive Dashboard Binding

## Context
- Parent: [plan.md](./plan.md)
- Inspired by: NiceGUI's `ui.bind_value()` — declarative two-way data binding with auto-refresh
- Docs: [code-standards.md](../../docs/code-standards.md)

## Overview
- **Date:** 2026-03-01
- **Priority:** P1 — Foundation for performant dashboard
- **Implementation:** pending
- **Review:** pending

Apply NiceGUI's reactive binding pattern to Zustand store. Create fine-grained selectors that auto-refresh dashboard widgets. Eliminate unnecessary re-renders through surgical state subscriptions.

## Key Insights

NiceGUI binds state to UI declaratively — change state, UI updates automatically. Only changed elements re-render. Granular bindings prevent cascade re-renders.

**Applied to Well:** Dashboard widgets subscribe to specific store slices via selectors. CommissionWidget only re-renders when commission data changes, not when unrelated state updates. Computed values derived from store (total commission = sum of direct + team).

## Requirements
- Each dashboard widget subscribes to minimal store slice
- Computed/derived values via selector composition
- No full-store subscriptions in components
- Supabase Realtime integration for live updates

## Architecture

```typescript
// src/shared/hooks/use-reactive-store.ts
// Fine-grained selectors (NiceGUI bind_value equivalent)
const useCommissionData = () => useStore(s => s.commissions);
const useTotalCommission = () => useStore(s =>
  s.commissions.direct + s.commissions.team
);
const useCommissionTrend = () => useStore(s => s.commissions.trend);

// Realtime binding (NiceGUI WebSocket equivalent)
const useRealtimeBinding = (table: string, filter: string) => {
  useEffect(() => {
    const channel = supabase.channel(table)
      .on('postgres_changes', { event: '*', schema: 'public', table, filter },
        (payload) => useStore.getState().handleRealtimeUpdate(table, payload)
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [table, filter]);
};
```

## Related Code Files
- `src/store.ts` → refactor selectors
- `src/components/CommissionWidget.tsx` → apply fine-grained selectors
- `src/components/StatsGrid.tsx` → apply fine-grained selectors
- `src/components/HeroCard.tsx` → apply fine-grained selectors

## Implementation Steps
1. Audit current store subscriptions — find components using full store
2. Create fine-grained selector hooks per widget domain
3. Create computed selectors for derived values (totals, trends, percentages)
4. Refactor CommissionWidget to use `useCommissionData()` selector
5. Refactor StatsGrid to use `useStatsData()` selector
6. Refactor HeroCard to use `useHeroData()` selector
7. Add Supabase Realtime binding hook for live commission updates
8. Add React.memo to widgets with stable selector references
9. Profile re-renders with React DevTools — verify reduced render count

## Todo
- [ ] Audit current store subscriptions
- [ ] Create domain-specific selector hooks
- [ ] Create computed/derived selectors
- [ ] Refactor dashboard widgets to use selectors
- [ ] Add Supabase Realtime binding
- [ ] Apply React.memo where beneficial
- [ ] Profile and verify render reduction

## Success Criteria
- Dashboard widgets re-render ONLY when their data changes
- React DevTools shows 50%+ reduction in unnecessary renders
- Realtime updates arrive within 1s of database change
- Zero behavior change — same UI, better performance

## Risk Assessment
- **Low:** Selector refactor is non-breaking — additive change
- **Low:** Realtime subscription cost — Supabase free tier handles this

## Security Considerations
- Realtime subscriptions respect RLS — users only see own data
- No security impact — pure performance optimization

## Next Steps
- Phase 2 builds compound widgets on top of these reactive selectors
