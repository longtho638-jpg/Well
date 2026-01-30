# Research Report: Vietnamese i18n Best Practices for React Admin Dashboards

**Date:** 260130
**Context:** React + TypeScript + Zustand + i18next
**Focus:** Vietnamese (Primary), Formatting, Architecture

## 1. i18n Library Strategy
**Verdict:** Continue using **`react-i18next`** (already installed).
*   **Why:** Industry standard, excellent TypeScript support, maturity, and existing integration in codebase (`src/i18n.ts`).
*   **Alternatives:** `react-intl` (verbose), custom (reinventing wheel).
*   **Action:** Leverage the existing `src/hooks/useTranslation.ts` wrapper to enforce type safety and centralization.

## 2. Vietnamese Formatting Standards
Vietnamese (`vi-VN`) has specific formatting rules distinct from US/UK English.

### Currency (VND)
*   **Symbol:** `₫` (placed after amount).
*   **Separator:** dot (`.`) for thousands, comma (`,`) for decimals (though VND rarely uses decimals).
*   **Format:** `1.000.000 ₫` (not `1,000,000 ₫` or `$100`).
*   **Implementation:** Use existing `i18nService.formatCurrency` or `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`.

### Dates & Numbers
*   **Date:** `dd/mm/yyyy` (Day/Month/Year). 24-hour clock preferred in formal contexts.
*   **Numbers:** `1.234,56` (Dot for thousands, comma for decimal).
*   **Relative Time:** "3 ngày trước" (3 days ago).
*   **Implementation:** Use `i18nService.getDateTimeFormatter('vi')`.

## 3. RTL Considerations
**Status:** **Not Applicable**.
*   Vietnamese uses the Latin script (Quốc ngữ) and is strictly **Left-to-Right (LTR)**.
*   **Layout:** Standard CSS Flexbox/Grid layouts work without modification.

## 4. Translation Management
Organize keys by **Domain/Feature** rather than strictly by page to maximize reuse.

```typescript
// src/locales/vi.ts structure recommendation
export const vi = {
  common: { ... },      // Reuse: save, cancel, loading
  domain: {             // Admin specific business logic
    commission: 'Hoa hồng',
    revenue: 'Doanh thu',
  },
  admin: {              // Admin module specific
    users: { ... },
    settings: { ... }
  },
  components: {         // Complex widget specific text
    dataTable: { ... }
  }
}
```

## 5. Zustand Integration
Sync `i18next` state with Zustand to drive reactivity if needed, but rely on `i18next` as the source of truth.

**Pattern:**
1.  **Store:** Add `locale` to `UISlice` for persistent user preference.
2.  **Sync:** Update `i18next.language` when Zustand action `setLocale` is called.
3.  **Persist:** Use `persist` middleware in Zustand to save to `localStorage`.

```typescript
// Example Slice Update
setLocale: (lang: 'vi' | 'en') => {
  i18next.changeLanguage(lang); // Driver
  set({ locale: lang });        // Sync State
}
```

## Unresolved Questions
*   None.

## References
*   [React-i18next Documentation](https://react.i18next.com/)
*   [MDN Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
*   [Vietnamese Currency Formatting](https://www.w3.org/TR/i18n-drafts/articles/currency/index.en)
