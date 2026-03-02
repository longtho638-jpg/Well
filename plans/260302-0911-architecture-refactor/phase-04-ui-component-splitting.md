---
phase: 4
title: "UI Component Splitting — 15 Components Over 200 LOC"
status: pending
priority: P1
effort: 3h
parallel: [2, 3, 5, 6]
depends_on: [1]
owns: ["src/components/**"]
---

## Context Links
- Research: [researcher-01-component-splitting.md](research/researcher-01-component-splitting.md) (Custom Hooks + Container/Presenter)

## Overview
15 component files exceed 200 LOC. These are shared UI components used across pages. Strategy: extract hooks for stateful logic, split large JSX into sub-components within same directory. Must preserve all existing public exports.

## Key Insights
- Components imported by multiple pages — public API (props/exports) must NOT change
- AdminSecuritySettings (385 LOC) is the largest — mix of form state + UI + validation
- Several modal components (WithdrawalModal, QuickPurchaseModal, QRPaymentModal) have form+UI pattern
- Sidebar (225 LOC) borderline — still split for consistency

## File Inventory (15 files, by LOC descending)

| File | LOC | Split Strategy |
|------|-----|----------------|
| `admin/AdminSecuritySettings.tsx` | 385 | Hook + form + policy sub-components |
| `MarketingTools/ai-landing-page-builder.tsx` | 364 | Hook + preview + form sections |
| `ui/CommandPalette.tsx` | 290 | Hook: `use-command-palette.ts` + result list |
| `auth/SessionManager.tsx` | 282 | Hook: `use-session-manager.ts` + session list |
| `admin/FounderRevenueGoal.tsx` | 279 | Hook + chart + goal form |
| `WithdrawalModal.tsx` | 278 | Hook: `use-withdrawal-form.ts` + modal UI |
| `auth/LoginActivityLog.tsx` | 277 | Hook + activity table |
| `Wallet/wallet-transaction-history-table.tsx` | 273 | Extract table columns + filter bar |
| `CommissionWallet.tsx` | 271 | Hook + wallet cards + transaction list |
| `marketplace/QuickPurchaseModal.tsx` | 259 | Hook: `use-quick-purchase.ts` + modal UI |
| `reports/commission-report-pdf-generator.tsx` | 257 | Extract PDF template + data formatter |
| `Dashboard/CommissionWidget.tsx` | 250 | Hook + widget cards |
| `checkout/qr-payment-modal.tsx` | 246 | Hook: `use-qr-payment.ts` + QR display |
| `admin/NotificationCenter.tsx` | 239 | Hook + notification list |
| `Sidebar.tsx` | 225 | Extract nav items + mobile drawer |

## Architecture — Component Splitting Pattern

**Stateful components (modals, forms):**
```
Before:
  src/components/WithdrawalModal.tsx (278 LOC)

After:
  src/components/WithdrawalModal.tsx (90 LOC) — container, composes hook + UI
  src/components/withdrawal/use-withdrawal-form.ts (100 LOC) — form state, validation, submit
  src/components/withdrawal/withdrawal-form-fields.tsx (80 LOC) — form JSX
```

**Data display components (tables, lists):**
```
Before:
  src/components/Wallet/wallet-transaction-history-table.tsx (273 LOC)

After:
  src/components/Wallet/wallet-transaction-history-table.tsx (130 LOC) — table container
  src/components/Wallet/wallet-transaction-filter-bar.tsx (80 LOC) — filter UI
  src/components/Wallet/wallet-transaction-columns.ts (60 LOC) — column definitions
```

## Implementation Steps

### Step 1: Admin components (3 files)

**AdminSecuritySettings.tsx (385 LOC):**
1. Create `src/components/admin/use-security-settings.ts` — config state, validation, save handlers
2. Create `src/components/admin/security-settings-form.tsx` — form fields JSX
3. Create `src/components/admin/security-policy-card.tsx` — individual policy rendering
4. Slim original to container (~90 LOC)

**FounderRevenueGoal.tsx (279 LOC):**
1. Create `src/components/admin/use-revenue-goal.ts` — goal state, calculations
2. Create `src/components/admin/revenue-goal-chart.tsx` — chart rendering
3. Slim original to container

**NotificationCenter.tsx (239 LOC):**
1. Create `src/components/admin/use-notification-center.ts` — notification state, mark-read
2. Slim original to container + list rendering

### Step 2: Auth components (2 files)

**SessionManager.tsx (282 LOC):**
1. Create `src/components/auth/use-session-manager.ts` — session state, revoke handler
2. Create `src/components/auth/session-list-item.tsx` — individual session row
3. Slim original to container

**LoginActivityLog.tsx (277 LOC):**
1. Create `src/components/auth/use-login-activity.ts` — activity fetching, filtering
2. Slim original to container + table

### Step 3: Modal components (3 files)

**WithdrawalModal.tsx (278 LOC):**
1. Create `src/components/withdrawal/use-withdrawal-form.ts`
2. Create `src/components/withdrawal/withdrawal-form-fields.tsx`

**QuickPurchaseModal.tsx (259 LOC):**
1. Create `src/components/marketplace/use-quick-purchase.ts`
2. Slim original to modal shell + form

**qr-payment-modal.tsx (246 LOC):**
1. Create `src/components/checkout/use-qr-payment.ts`
2. Slim original to modal shell + QR display

### Step 4: Wallet/Dashboard components (3 files)

**wallet-transaction-history-table.tsx (273 LOC):**
1. Create `src/components/Wallet/wallet-transaction-filter-bar.tsx`
2. Create `src/components/Wallet/wallet-transaction-columns.ts`

**CommissionWallet.tsx (271 LOC):**
1. Create `src/components/commission/use-commission-wallet.ts`
2. Create `src/components/commission/commission-wallet-cards.tsx`

**CommissionWidget.tsx (250 LOC):**
1. Create `src/components/Dashboard/use-commission-widget.ts`
2. Slim original to container

### Step 5: Remaining components (4 files)

**ai-landing-page-builder.tsx (364 LOC):**
1. Create `src/components/MarketingTools/use-landing-page-builder.ts`
2. Create `src/components/MarketingTools/landing-page-preview.tsx`
3. Slim original to container

**CommandPalette.tsx (290 LOC):**
1. Create `src/components/ui/use-command-palette.ts`
2. Create `src/components/ui/command-palette-results.tsx`

**commission-report-pdf-generator.tsx (257 LOC):**
1. Create `src/components/reports/commission-report-pdf-template.tsx` — PDF layout
2. Create `src/components/reports/commission-report-data-formatter.ts` — data transform

**Sidebar.tsx (225 LOC):**
1. Create `src/components/sidebar/sidebar-nav-items.tsx` — nav item list
2. Create `src/components/sidebar/sidebar-mobile-drawer.tsx` — mobile variant

### Step 6: Verify
```bash
pnpm build && pnpm test
```

## Todo List
- [ ] Split AdminSecuritySettings.tsx (385 LOC)
- [ ] Split ai-landing-page-builder.tsx (364 LOC)
- [ ] Split CommandPalette.tsx (290 LOC)
- [ ] Split SessionManager.tsx (282 LOC)
- [ ] Split FounderRevenueGoal.tsx (279 LOC)
- [ ] Split WithdrawalModal.tsx (278 LOC)
- [ ] Split LoginActivityLog.tsx (277 LOC)
- [ ] Split wallet-transaction-history-table.tsx (273 LOC)
- [ ] Split CommissionWallet.tsx (271 LOC)
- [ ] Split QuickPurchaseModal.tsx (259 LOC)
- [ ] Split commission-report-pdf-generator.tsx (257 LOC)
- [ ] Split CommissionWidget.tsx (250 LOC)
- [ ] Split qr-payment-modal.tsx (246 LOC)
- [ ] Split NotificationCenter.tsx (239 LOC)
- [ ] Split Sidebar.tsx (225 LOC)
- [ ] Build passes
- [ ] Tests pass

## Success Criteria
- All 15 component files under 200 LOC
- All existing imports from other pages/components resolve unchanged
- No prop API changes on any exported component
- `pnpm build` exits 0

## Conflict Prevention
- **Exclusive ownership**: only this phase touches `src/components/**`
- Phase 03 (pages) does NOT create files in `src/components/`
- New sub-components created in subdirectories of their parent (e.g., `src/components/admin/`)
- Public exports (component name, props) remain identical

## Risk Assessment
- MEDIUM: Components imported across many pages — must preserve public API exactly
  - Mitigation: grep all imports of each component before splitting, verify resolution
- LOW: Hook extraction is mechanical — move state/effects into function, return same API
- LOW: Sub-component extraction — pass props explicitly, no context changes

## Security Considerations
- Payment modals (qr-payment, WithdrawalModal): keep amount validation in hook, not in UI sub-component
- SessionManager: session revocation logic stays in hook, UI only renders
