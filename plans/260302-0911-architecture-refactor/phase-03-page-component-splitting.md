---
phase: 3
title: "Page Component Splitting — 16 Pages Over 200 LOC"
status: pending
priority: P1
effort: 4h
parallel: [2, 4, 5, 6]
depends_on: [1]
owns: ["src/pages/**"]
---

## Context Links
- Research: [researcher-01-component-splitting.md](research/researcher-01-component-splitting.md) (Section 1: Splitting Patterns)
- App Router: `src/App.tsx` — all page lazy imports

## Overview
16 page files exceed 200 LOC. Strategy: extract custom hooks (state/effects) and sub-components (JSX sections). Pages are React components with mixed concerns — data fetching, state management, and rendering in single files.

## Key Insights
- All pages already lazy-loaded in App.tsx — splitting won't affect code-splitting
- Zustand store handles global state — page hooks should handle local state + side effects
- Pattern: `usePageName()` hook + sub-components in same directory
- Admin pages (6 files) share similar patterns — can batch-split

## File Inventory (16 files, by LOC descending)

| File | LOC | Split Strategy |
|------|-----|----------------|
| `CopilotPage.tsx` | 358 | Hook: `use-copilot-page.ts` + 2 sub-components |
| `Admin/AuditLog.tsx` | 330 | Hook: `use-audit-log.ts` + table/filter sub-components |
| `LeaderDashboard.tsx` | 326 | Hook: `use-leader-dashboard.ts` + stat cards |
| `LandingPage.tsx` | 315 | Extract hero/features/CTA sections |
| `Admin.tsx` | 306 | Extract nav/layout sub-components |
| `Admin/CMS.tsx` | 289 | Hook: `use-cms-page.ts` + editor sub-component |
| `Checkout/CheckoutPage.tsx` | 275 | Hook: `use-checkout.ts` + form/summary |
| `Admin/Overview.tsx` | 273 | Extract dashboard cards/charts |
| `SubscriptionPage.tsx` | 271 | Hook: `use-subscription.ts` + plan cards |
| `Admin/Products.tsx` | 265 | Hook: `use-products-admin.ts` + product table |
| `SystemStatus.tsx` | 257 | Extract status cards + health indicators |
| `AgencyOSDemo.tsx` | 244 | Extract demo sections |
| `confirm-email.tsx` | 240 | Hook: `use-confirm-email.ts` |
| `SettingsPage.tsx` | 234 | Extract settings sections |
| `Marketplace.tsx` | 233 | Extract filter bar + product grid |
| `NetworkPage.tsx` | 221 | Hook: `use-network-page.ts` + tree viz |

## Architecture — Page Splitting Pattern

```
Before:
  src/pages/CopilotPage.tsx (358 LOC)

After:
  src/pages/CopilotPage.tsx (80 LOC) — container, composes hook + sub-components
  src/pages/copilot/use-copilot-page.ts (100 LOC) — state, effects, handlers
  src/pages/copilot/copilot-chat-panel.tsx (90 LOC) — chat UI
  src/pages/copilot/copilot-suggestion-list.tsx (80 LOC) — suggestion rendering
```

For simpler pages (220-250 LOC), extract just a hook:
```
Before:
  src/pages/NetworkPage.tsx (221 LOC)

After:
  src/pages/NetworkPage.tsx (120 LOC) — rendering
  src/pages/network/use-network-page.ts (100 LOC) — state + effects
```

## Implementation Steps

### Step 1: Admin pages batch (6 files — most similar patterns)

**AuditLog.tsx (330 LOC):**
1. Create `src/pages/admin/use-audit-log.ts` — extract filter state, log fetching, pagination
2. Create `src/pages/admin/audit-log-table.tsx` — extract table rendering
3. Slim `AuditLog.tsx` to container

**CMS.tsx (289 LOC):**
1. Create `src/pages/admin/use-cms-page.ts` — extract content state, CRUD handlers
2. Slim `CMS.tsx` to container

**Overview.tsx (273 LOC):**
1. Create `src/pages/admin/overview-stat-cards.tsx` — extract dashboard cards
2. Slim `Overview.tsx` to container

**Products.tsx (265 LOC):**
1. Create `src/pages/admin/use-products-admin.ts` — extract product state, handlers
2. Slim `Products.tsx` to container

**Admin.tsx (306 LOC):**
1. Create `src/pages/admin/admin-sidebar-nav.tsx` — extract nav rendering
2. Slim `Admin.tsx` to layout container

### Step 2: Dashboard pages (4 files)

**CopilotPage.tsx (358 LOC):**
1. Create `src/pages/copilot/use-copilot-page.ts`
2. Create `src/pages/copilot/copilot-chat-panel.tsx`
3. Create `src/pages/copilot/copilot-suggestion-list.tsx`

**LeaderDashboard.tsx (326 LOC):**
1. Create `src/pages/leader/use-leader-dashboard.ts`
2. Create `src/pages/leader/leader-stat-cards.tsx`

**SubscriptionPage.tsx (271 LOC):**
1. Create `src/pages/subscription/use-subscription-page.ts`
2. Slim page to container

**SystemStatus.tsx (257 LOC):**
1. Create `src/pages/system-status/system-status-cards.tsx`
2. Slim page to container

### Step 3: Standalone pages (6 files)

**LandingPage.tsx (315 LOC):**
1. Create `src/pages/landing/landing-hero-section.tsx`
2. Create `src/pages/landing/landing-features-section.tsx`
3. Slim page to composition

**CheckoutPage.tsx (275 LOC):**
1. Create `src/pages/checkout/use-checkout-page.ts`
2. Slim page to container

**AgencyOSDemo.tsx (244 LOC):**
1. Create `src/pages/agency-os-demo/demo-feature-sections.tsx`

**confirm-email.tsx (240 LOC):**
1. Create `src/pages/confirm-email/use-confirm-email.ts`

**SettingsPage.tsx (234 LOC):**
1. Create `src/pages/settings/settings-section-list.tsx`

**Marketplace.tsx (233 LOC):**
1. Create `src/pages/marketplace/marketplace-filter-bar.tsx`

**NetworkPage.tsx (221 LOC):**
1. Create `src/pages/network/use-network-page.ts`

### Step 4: Verify
```bash
pnpm build && pnpm test
```

## Todo List
- [ ] Split Admin/AuditLog.tsx (330 LOC)
- [ ] Split Admin/CMS.tsx (289 LOC)
- [ ] Split Admin/Overview.tsx (273 LOC)
- [ ] Split Admin/Products.tsx (265 LOC)
- [ ] Split Admin.tsx (306 LOC)
- [ ] Split CopilotPage.tsx (358 LOC)
- [ ] Split LeaderDashboard.tsx (326 LOC)
- [ ] Split SubscriptionPage.tsx (271 LOC)
- [ ] Split SystemStatus.tsx (257 LOC)
- [ ] Split LandingPage.tsx (315 LOC)
- [ ] Split CheckoutPage.tsx (275 LOC)
- [ ] Split AgencyOSDemo.tsx (244 LOC)
- [ ] Split confirm-email.tsx (240 LOC)
- [ ] Split SettingsPage.tsx (234 LOC)
- [ ] Split Marketplace.tsx (233 LOC)
- [ ] Split NetworkPage.tsx (221 LOC)
- [ ] Build passes
- [ ] Tests pass

## Success Criteria
- All 16 page files under 200 LOC
- Lazy imports in `App.tsx` unchanged (default exports preserved)
- No visual regressions — pure structural refactor
- `pnpm build` exits 0

## Conflict Prevention
- **Exclusive ownership**: only this phase touches `src/pages/**`
- Sub-components created in page-specific subdirectories (e.g., `src/pages/copilot/`)
- `App.tsx` NOT modified — lazy imports stay the same
- Phase 04 (components) does NOT touch anything in `src/pages/`

## Risk Assessment
- MEDIUM: Page components may import from `src/components/` — imports must not break
  - Mitigation: only extract internal logic, never move shared component imports
- LOW: Lazy loading still works because default exports preserved in parent files
- LOW: Zustand hooks remain in components, not extracted to page hooks (avoid duplication)

## Security Considerations
- CheckoutPage split must keep payment logic in hook, not expose to sub-components
- Admin pages: auth guard (`AdminRoute`) stays in `App.tsx`, not affected by splitting
