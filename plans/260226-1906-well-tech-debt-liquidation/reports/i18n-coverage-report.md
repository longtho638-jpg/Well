# i18n Coverage Report - Well Project
**Date:** 2026-02-26

## 1. High Priority (Pages & Forms)
- `src/pages/Admin/Overview.tsx`: Hardcoded "Global GMV", "Active Bee Force".
- `src/pages/WithdrawalPage.tsx`: Hardcoded "Minimum withdrawal".
- `src/components/WithdrawalModal.tsx`: All form labels are hardcoded English.

## 2. PDF Reports
- `src/components/reports/commission-report-pdf-generator.tsx`: 100% hardcoded English. Needs dynamic translation injection.

## 3. Mixed Language Issues
- `src/components/CommissionWallet.tsx`: Contains "Xuất PDF" (VN) and "Export CSV" (EN) hardcoded.
