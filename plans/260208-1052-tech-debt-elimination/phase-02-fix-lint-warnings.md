# Phase 2: Fix 40 Lint Warnings

**Priority:** Medium | **Status:** Pending

## Overview

40 warnings across 3 categories. All mechanical fixes.

## Category A: Unused Vars/Imports (16 warnings)

Remove the unused import or prefix with `_` for intentionally unused params.

| File | Variable | Fix |
|------|----------|-----|
| `src/components/LeaderDashboard/at-risk-members-list-with-actions.tsx:11` | `TeamMember` | Remove import |
| `src/components/MarketingTools/marketing-tools-page-header.tsx:2` | `motion` | Remove import |
| `src/components/MarketingTools/marketing-tools-page-header.tsx:5` | `GiftCard`, `ContentTemplate` | Remove imports |
| `src/components/PremiumNavigation/premium-navigation-header.tsx:19` | `User` | Remove import |
| `src/components/network/network-list-mobile.tsx:2` | `NetworkNode` | Remove import |
| `src/components/network/node-card.tsx:3,6` | `Users`, `Font` | Remove imports |
| `src/pages/LandingPage.tsx:3,9,10,11` | `motion`, `Target`, `Globe`, `ChevronRight` | Remove imports |
| `src/pages/AgencyOSDemo.tsx:4` | `AgencyOSCommand` | Remove import |
| `src/pages/Leaderboard.tsx:6` | `theme` | Remove variable |
| `src/pages/Checkout/CheckoutPage.tsx:1` | `useEffect` | Remove import |
| `src/pages/NetworkPage.tsx:4` | `useTranslation` | Remove import |
| `src/pages/Wallet.tsx:47` | `amount` | Prefix `_amount` or remove |
| `src/services/withdrawal-service.ts:8` | `getErrorMessage` | Remove import |
| `src/components/withdrawal/withdrawal-form.tsx:9` | `t` | Remove or use |
| `src/utils/agent-reward-commission.test.ts:236` | `orderTotal` | Prefix `_orderTotal` |

## Category B: Non-null Assertions (12 warnings)

Replace `!` with optional chaining `?.` or proper null checks.

| File | Lines |
|------|-------|
| `src/components/reports/commission-report-pdf-generator.tsx` | 78, 95, 120, 137, 186, 206 |
| `src/components/checkout/qr-payment-modal.tsx` | 109, 111, 112 |
| `src/hooks/use-pwa-update.ts` | 79 |

## Category C: Misc (3 warnings)

| File | Issue | Fix |
|------|-------|-----|
| `src/utils/agent-reward-commission.test.ts:51` | `no-explicit-any` | Replace `Record<string, any>` with proper type |
| `src/components/checkout/__tests__/qr-payment-modal.test.tsx:136` | unused `error` | Prefix `_error` |
| `src/services/web-push-notification-service.ts:43` | unused `err` | Prefix `_err` |
| `src/services/web-push-notification-service.ts:62,75` | unused `_error` | Already prefixed but lint still flags — check pattern |
| `src/components/CommissionWallet.tsx:34` | unused `error` | Prefix `_error` |
| `src/services/hub-sdk.ts:42,52` | unused `message`, `callback` | Prefix with `_` |

## Success Criteria

- `npm run lint 2>&1 | grep "warning " | wc -l` = 0
