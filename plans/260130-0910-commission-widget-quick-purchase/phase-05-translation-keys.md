# Phase 5: Translation Keys

## Context
- **Parent Plan:** [Commission Widget & Quick Purchase Modal](./plan.md)
- **Docs:** `src/locales/` (Assumed structure based on i18n usage)

## Overview
- **Date:** 2026-01-30
- **Description:** Add necessary localization strings for the new components to support Vietnamese (primary) and English.
- **Priority:** P2
- **Status:** Completed

## Requirements

### Keys Needed

**Commission Widget:**
- `dashboard.commission.title`: "Earnings Overview" / "Tổng Quan Thu Nhập"
- `dashboard.commission.daily`: "Today" / "Hôm Nay"
- `dashboard.commission.weekly`: "Last 7 Days" / "7 Ngày Qua"
- `dashboard.commission.monthly`: "Last 30 Days" / "30 Ngày Qua"
- `dashboard.commission.direct`: "Direct Sales" / "Bán Trực Tiếp"
- `dashboard.commission.team`: "Team Bonus" / "Thưởng Đội Nhóm"
- `dashboard.commission.withdraw`: "Withdraw" / "Rút Tiền"

**Quick Purchase:**
- `marketplace.quickBuy.title`: "Quick Purchase" / "Mua Nhanh"
- `marketplace.quickBuy.recent`: "Recent" / "Gần Đây"
- `marketplace.quickBuy.favorites`: "Favorites" / "Yêu Thích"
- `marketplace.quickBuy.addToCart`: "Add" / "Thêm"
- `marketplace.quickBuy.buyNow`: "Buy Now" / "Mua Ngay"

## Related Code Files
- **Modify:** `src/locales/vi.json` (or equivalent)
- **Modify:** `src/locales/en.json` (or equivalent)

## Implementation Steps

1.  **Locate Translation Files:**
    - Check `src/locales` or `src/i18n.ts` to find resource paths.

2.  **Add JSON Entries:**
    - Insert new keys under appropriate namespaces.

3.  **Verify Usage:**
    - Ensure components use `t('key')` hook correctly.

## Todo List
- [ ] Add English keys
- [ ] Add Vietnamese keys

## Success Criteria
- [ ] Text appears correctly in UI (no key fallbacks).
- [ ] Switching language updates text immediately.

## Risk Assessment
- **Risk:** Missing keys cause ugly key-name rendering.
- **Mitigation:** Double-check key paths. Use TypeScript for translation keys if typed.

## Security Considerations
- N/A
