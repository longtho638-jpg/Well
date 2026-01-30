# Phase 3: Dashboard Integration

## Context
- **Parent Plan:** [Commission Widget & Quick Purchase Modal](./plan.md)
- **Phase 1:** [Commission Widget](./phase-01-commission-widget.md)

## Overview
- **Date:** 2026-01-30
- **Description:** Integrate the newly created `CommissionWidget` into the main Dashboard view, optimizing the layout for visibility.
- **Priority:** P1
- **Status:** Completed

## Key Insights
- **Placement:** Should be "above the fold" or high up, as earnings are a primary motivator.
- **Balance:** Needs to coexist with `HeroCard` and `RankProgressBar` without cluttering the UI.

## Requirements

### Functional
1.  **Import:** Import `CommissionWidget` in `Dashboard.tsx`.
2.  **Placement:** Insert after `HeroCard` and before `RankProgressBar` (or alongside in a grid).
3.  **Responsiveness:** Ensure it stacks correctly on mobile.

## Architecture

### Component Hierarchy
```
Dashboard
├── HeroCard
├── CommissionWidget (NEW)
├── RankProgressBar
├── QuickActionsCard
└── ...
```

## Related Code Files
- **Modify:** `src/pages/Dashboard.tsx`

## Implementation Steps

1.  **Update Import:**
    - Add `import { CommissionWidget } from '../components/Dashboard/CommissionWidget';` to `Dashboard.tsx`.

2.  **Modify Grid Layout:**
    - Locate the "Primary Intelligence Layer" section.
    - Insert `<CommissionWidget />` inside the main column (`xl:col-span-8`).
    - Adjust spacing (`gap-8`) if necessary.

3.  **Mobile Optimization:**
    - Verify padding and margins on small screens.
    - Ensure widget doesn't cause horizontal scroll.

## Todo List
- [ ] Import `CommissionWidget` in `Dashboard.tsx`
- [ ] Place component in layout hierarchy
- [ ] Verify responsive behavior

## Success Criteria
- [ ] Dashboard loads without error.
- [ ] Commission Widget is visible immediately below Hero Card.
- [ ] Layout remains stable (no layout shifts).

## Risk Assessment
- **Risk:** Visual crowding.
- **Mitigation:** Use proper spacing (gap-8) and ensure the widget isn't too tall.

## Security Considerations
- N/A (Presentation layer only).
