# Phase 1: Commission Widget

## Context
- **Parent Plan:** [Commission Widget & Quick Purchase Modal](./plan.md)
- **Docs:** `docs/design-system/components-reference.md`, `src/types.ts`

## Overview
- **Date:** 2026-01-30
- **Description:** Create a high-fidelity earnings dashboard component to motivate distributors by visualizing their income streams.
- **Priority:** P1 (High)
- **Status:** Pending

## Key Insights
- **Motivation:** Real-time feedback on earnings drives sales behavior.
- **Clarity:** Separating "Direct Sales" from "Team Volume" helps users understand their income mix.
- **Performance:** Transaction lists can grow large; aggregation must be efficient.

## Requirements

### Functional
1.  **Total Earnings:** Calculate Daily, Weekly (7-day), and Monthly (30-day) earnings.
2.  **Breakdown:** Split totals into 'Direct Sale' and 'Team Volume Bonus'.
3.  **Trend:** Show % change vs previous period (e.g., this week vs last week).
4.  **Action:** "Withdraw" button linking to `/dashboard/wallet`.
5.  **Visual:** Mini sparkline or trend indicator.

### Non-Functional
- **Performance:** Memoize calculations to prevent re-renders on unrelated state changes.
- **Responsive:** Stack vertically on mobile, side-by-side or grid on desktop.
- **Theme:** Dark mode compatible (Aura Elite).

## Architecture

### Component Structure
`src/components/Dashboard/CommissionWidget.tsx`

### Data Flow
1.  **Source:** `useStore` -> `transactions` array.
2.  **Transformation:** `useMemo` hook filters transactions by date ranges and types.
3.  **Presentation:** Rendered via stateless UI sub-components (MetricCard, TrendBadge).

## Related Code Files
- **Create:** `src/components/Dashboard/CommissionWidget.tsx`
- **Modify:** None (Integration happens in Phase 3)

## Implementation Steps

1.  **Scaffold Component:**
    - Create file structure.
    - Import `useStore`, `useTranslation`, `framer-motion`.

2.  **Implement Logic (useCommissionStats):**
    - Create a local or extracted hook to handle date math.
    - Filter `transactions` for "Today", "Last 7 Days", "Last 30 Days".
    - Sum amounts by type (`Direct Sale` vs `Team Volume Bonus`).
    - Calculate percentage growth.

3.  **Build UI Layout:**
    - Header: Title + "Withdraw" CTA (use `Button` component).
    - Grid: 3 columns (Today, Week, Month).
    - Breakdown: Tooltip or sub-text showing the split.

4.  **Add Styling:**
    - Apply Aura Elite glassmorphism (`backdrop-blur`, `border-white/10`).
    - Use `formatVND` utility for currency.

5.  **Add Animations:**
    - Entry animation (`initial={{ opacity: 0, y: 20 }}`).
    - Number counter effect (optional polish).

## Todo List
- [ ] Create `src/components/Dashboard/CommissionWidget.tsx`
- [ ] Implement `useCommissionStats` logic
- [ ] Build responsive grid layout
- [ ] Style with Aura Elite design tokens
- [ ] Add Withdraw CTA navigation

## Success Criteria
- [ ] Widget renders without errors.
- [ ] Earnings match manual calculation of mock transactions.
- [ ] Switching timeframes (if interactive) or viewing static ranges works instantly.
- [ ] Mobile view is legible.

## Risk Assessment
- **Risk:** Large transaction history slows down calculation.
- **Mitigation:** Ensure `useMemo` dependency array is correct. Limit history processing if >1000 items (future optimization).

## Security Considerations
- Ensure no sensitive transaction data is exposed in DOM attributes.
- Confirm `transactions` in store are already filtered for the current user.
