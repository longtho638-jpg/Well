# Phase 2: Compound Widget Components

## Context
- Parent: [plan.md](./plan.md)
- Depends on: [Phase 1](./phase-01-reactive-dashboard-binding.md)
- Inspired by: NiceGUI's context-manager composition + self-contained elements

## Overview
- **Date:** 2026-03-01
- **Priority:** P1
- **Implementation:** pending
- **Review:** pending

Create self-contained compound widgets inspired by NiceGUI's composable elements. Each widget encapsulates data fetching, loading, error, and display states. Compound component pattern for flexible slot-based layouts.

## Key Insights

NiceGUI: every element is self-contained Python class. Composition via nesting (`with ui.card(): ui.label()`). Slots for flexible content injection. Lifecycle managed internally.

**Applied to Well:** Dashboard widgets should be plug-and-play. `<Widget>` handles its own data, loading skeleton, error boundary, empty state. Compound pattern: `<Widget.Header>`, `<Widget.Body>`, `<Widget.Footer>`.

## Requirements
- Compound component API for all dashboard widgets
- Each widget handles own loading/error/empty states
- Slot pattern for content customization
- Consistent skeleton loading animations

## Architecture

```typescript
// src/shared/ui/widget.tsx — Compound widget base
const Widget = ({ children, className }) => (
  <div className={cn('glass-card', className)}>{children}</div>
);
Widget.Header = ({ title, action }) => (...);
Widget.Body = ({ children, loading, error, empty }) => {
  if (loading) return <WidgetSkeleton />;
  if (error) return <WidgetError error={error} />;
  if (empty) return <WidgetEmpty />;
  return children;
};
Widget.Footer = ({ children }) => (...);
Widget.Metric = ({ label, value, trend }) => (...);

// Usage in dashboard:
<Widget>
  <Widget.Header title={t('dashboard.commissions')} action={<PeriodFilter />} />
  <Widget.Body loading={isLoading} error={error}>
    <Widget.Metric label="Direct" value={direct} trend={+12} />
    <Widget.Metric label="Team" value={team} trend={-3} />
  </Widget.Body>
</Widget>
```

## Implementation Steps
1. Create base `Widget` compound component with Header/Body/Footer
2. Create `Widget.Metric` for key-value displays with trend indicators
3. Create `WidgetSkeleton` loading animation (pulse shimmer)
4. Create `WidgetError` with retry button
5. Create `WidgetEmpty` with illustration
6. Refactor CommissionWidget using compound Widget
7. Refactor StatsGrid using compound Widget
8. Refactor marketplace ProductGrid using compound Widget
9. Ensure all widgets follow Aura Elite glassmorphism style

## Todo
- [ ] Create Widget compound component (Header/Body/Footer)
- [ ] Create Widget.Metric sub-component
- [ ] Create loading/error/empty state components
- [ ] Refactor CommissionWidget
- [ ] Refactor StatsGrid
- [ ] Refactor ProductGrid
- [ ] Verify Aura Elite consistency
- [ ] Tests for Widget component

## Success Criteria
- All dashboard widgets use compound Widget pattern
- Every widget has loading skeleton, error state, empty state
- Widget API is declarative and composable
- Aura Elite glassmorphism consistent across all widgets

## Risk Assessment
- **Low:** UI refactor — visual output should match current design
- **Low:** Compound pattern is well-established React pattern

## Security Considerations
- Error states must NOT expose stack traces or internal details
- Widget error boundary catches rendering errors gracefully

## Next Steps
- Phase 4 (Theme System) provides design tokens used by widgets
