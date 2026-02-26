# Unhandled Exceptions & Missing Error Handling Report

**Date:** 2026-02-26
**Project:** WellNexus

## Overview
This report identifies areas in the codebase where Promises are used without `.catch()` blocks or `async` functions lack `try/catch` blocks, potentially leading to unhandled rejections or silent failures.

## 1. Promises Missing `.catch()`

The following files contain `.then()` chains without a corresponding `.catch()`:

| File Path | Line | Context |
|-----------|------|---------|
| `src/main.tsx` | 53 | `navigator.serviceWorker.getRegistrations().then(...)` |
| `src/main.tsx` | 57 | `caches.keys().then(...)` |
| `src/hooks/useAuth.ts` | 70 | `supabase.auth.getSession().then(...)` |
| `src/hooks/useWallet.ts` | 75 | `walletService.getWallet(userId).then(...)` |
| `src/hooks/useProductDetail.ts` | 46 | `navigator.clipboard.writeText(shareUrl).then(...)` |
| `src/hooks/useAutoLogout.ts` | 28 | `signOut().then(...)` |
| `src/utils/cache.ts` | 128 | `fn(...args).then(...)` in cache helper |
| `src/utils/cache.ts` | 170 | `fetcher().then(...)` in stale-while-revalidate |
| `src/store/index.ts` | 140 | Multiple promise resolution in store |

*Note: Numerous lazy-loaded components in `App.tsx` and `Dashboard.tsx` also use `.then()` without `.catch()`. While these are often handled by `Suspense` and `ErrorBoundary`, adding a basic catch or ensuring a global error boundary is present is recommended.*

## 2. Async Functions Missing `try/catch`

The following services and hooks define `async` functions that throw errors but do not internally wrap operations in `try/catch` blocks. These rely entirely on the caller for error handling:

| File Path | Function/Context |
|-----------|------------------|
| `src/services/orderService.ts` | `createOrder`, `getPendingOrders`, `updateOrderStatus` (All throw after logging) |
| `src/services/productService.ts` | Backend product fetchers |
| `src/hooks/useAuth.ts` | Auth state management |
| `src/hooks/useMarketplace.ts` | Cart and product interactions |
| `src/services/payment/payos-client.ts` | External payment API calls |

## Recommendations

1.  **Standardize Hook Errors:** Hooks like `useWallet` and `useAuth` should include an `error` state returned to the component, populated via `.catch()` or `try/catch`.
2.  **Global Promise Rejection Handling:** Ensure a global `unhandledrejection` listener is active in `main.tsx` for production monitoring.
3.  **Service Layer Resilience:** Ensure all service calls (Order, Product, Wallet) have consistent error wrapping to avoid breaking the UI during network failures.

## Unresolved Questions
- Are there specific UI components already implementing `ErrorBoundary` that cover the lazy-loading rejections?
- Should the `adminLogger` in services be the final handler, or should we strictly enforce component-level catch blocks?
