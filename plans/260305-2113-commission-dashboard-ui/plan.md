# Commission Dashboard UI — Implementation Plan

**Date:** 2026-03-05 | **Status:** In Progress | **Priority:** High

---

## Overview

Implement Commission Dashboard UI với real-time PayOS data integration, wallet balance sync, và commission breakdown visualization.

---

## Phases

| Phase | Component | Status | Owner |
|-------|-----------|--------|-------|
| 1 | `useCommissionDashboard` hook | ⏳ Pending | fullstack-developer |
| 2 | `CommissionDashboard` page component | ⏳ Pending | fullstack-developer |
| 3 | Route integration (`/dashboard/commission`) | ⏳ Pending | fullstack-developer |
| 4 | i18n keys (VI/EN) | ⏳ Pending | fullstack-developer |
| 5 | Tests | ⏳ Pending | tester |

---

## Dependencies

- Existing: `useWallet.ts`, `walletService.ts`, `CommissionWidget.tsx`
- PayOS: Integration via existing `payos-client.ts`
- Design: Aura Elite (glassmorphism, dark gradients)

---

## Files to Create

1. `src/hooks/use-commission-dashboard.ts`
2. `src/pages/CommissionDashboard.tsx`
3. `src/components/commission/CommissionBreakdownCard.tsx`
4. `src/components/commission/CommissionStatsGrid.tsx`

## Files to Update

1. `src/App.tsx` - Add route
2. `src/locales/vi/dashboard.ts` - i18n keys
3. `src/locales/en/dashboard.ts` - i18n keys

---

## Success Criteria

- [ ] Dashboard loads with real-time wallet data
- [ ] Commission breakdown by period (day/week/month)
- [ ] Direct sales vs team volume visualization
- [ ] Export CSV/PDF functionality
- [ ] Responsive design (mobile/desktop)
- [ ] 0 TypeScript errors
- [ ] All tests pass
