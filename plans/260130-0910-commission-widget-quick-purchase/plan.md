---
title: "Commission Widget & Quick Purchase Modal"
description: "Week 1 distributor portal optimizations for earnings visibility and streamlined checkout"
status: completed
priority: P1
effort: 8h
branch: main
tags: [dashboard, marketplace, ux-optimization, commission-tracking]
created: 2026-01-30
---

# Commission Widget & Quick Purchase Modal Plan

## Overview
This plan implements high-impact UX optimizations for the WellNexus Distributor Portal.
1.  **Commission Widget:** A motivation-focused dashboard component showing real-time earnings breakdown and trends.
2.  **Quick Purchase Modal:** A streamlined "express checkout" flow for repeat orders and favorites.

## Phases

- **[Phase 1: Commission Widget](./phase-01-commission-widget.md)**
    - Implement `CommissionWidget.tsx` with memoized calculations.
    - Visualize Direct Sales vs Team Volume.
- **[Phase 2: Quick Purchase Modal](./phase-02-quick-purchase-modal.md)**
    - Build `QuickPurchaseModal.tsx` with Recent/Favorites tabs.
    - Implement express checkout logic.
- **[Phase 3: Dashboard Integration](./phase-03-dashboard-integration.md)**
    - Integrate widget into `Dashboard.tsx` grid.
    - Ensure mobile responsiveness.
- **[Phase 4: Marketplace Integration](./phase-04-marketplace-integration.md)**
    - Add Floating Action Button (FAB) for Quick Buy.
    - Wire up modal state and props.
- **[Phase 5: Translation Keys](./phase-05-translation-keys.md)**
    - Add i18n support for new components.
- **[Phase 6: Testing & Verification](./phase-06-testing-verification.md)**
    - Unit testing, build verification, and responsive QA.

## Key Technical Decisions
- **State:** Leverage existing `useStore` selectors for transaction and product data.
- **Performance:** Use `useMemo` for heavy aggregation logic (earnings calculations).
- **Styling:** Adhere strictly to Aura Elite design system (Tailwind + Framer Motion).
- **Architecture:** Keep components self-contained; avoid prop drilling where store access is possible.

## Unresolved Questions
- Should the Quick Purchase modal bypass the standard checkout flow entirely, or just pre-fill the cart and redirect? (Assumption: Pre-fill and open simplified checkout view or direct API call if balance sufficient).
- Does "Favorites" persist to backend or local storage? (Assumption: `localStorage` for MVP).

