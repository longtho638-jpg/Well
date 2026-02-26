# i18n Coverage & Architecture Debt Report
**Date:** 2026-02-26

## 1. i18n Violations (Hardcoded Strings)
- **Critical**: `commission-report-pdf-generator.tsx` (100% hardcoded English).
- **UI Components**: `WithdrawalModal.tsx`, `SignupForm.tsx`, `CommissionWallet.tsx` chứa nhiều chuỗi Tiếng Việt/Tiếng Anh chưa qua `t()`.
- **Pages**: `Admin/Overview.tsx`, `SettingsPage.tsx`, `NetworkPage.tsx`.

## 2. Architecture Debt (Hooks & Stores)
- **God Hooks**: `useAdvanced.ts` (>200 lines, 6 hooks mixed).
- **God Store**: `src/store/index.ts` chứa quá nhiều logic fetch thay vì để ở Slices.
- **Logic Leak**: `walletSlice.ts` chứa công thức tính hoa hồng (nên ở backend hoặc utils).
- **Complexity**: `useDashboard.ts` và `useReferral.ts` quá cồng kềnh, cần tách nhỏ.

## 3. General Debt
- Nhiều file vẫn còn `any` types và `console.log`.
- Thiếu `error` state cho UI trong các luồng fetch dữ liệu quan trọng.
