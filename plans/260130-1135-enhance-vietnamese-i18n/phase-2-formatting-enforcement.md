# Phase 2: Formatting Enforcement

## Overview
**Priority**: Medium
**Goal**: Standardize all number, currency, and date formatting to use the centralized `i18nService`, ensuring consistent Vietnamese formatting.

## Context
- Research identified ad-hoc `new Intl.NumberFormat` calls in components.
- `src/services/i18nService.ts` exists but isn't universally used.

## Implementation Steps

1.  **Audit Codebase**
    - Grep for `new Intl.` usage.
    - Identify direct formatting in components (e.g., `ProductCard.tsx`).

2.  **Refactor to Service**
    - Replace direct `Intl` calls with `i18nService.formatCurrency(amount, 'vi')`.
    - Replace date formatting with `i18nService.getDateFormatter('vi').format(date)`.

3.  **Verify Formats**
    - Ensure Currency uses `₫` suffix and dot separators (e.g., `1.000.000 ₫`).
    - Ensure Dates use `dd/mm/yyyy`.

## Success Criteria
- [ ] No ad-hoc `Intl.NumberFormat` instantiation in UI components.
- [ ] All prices display correctly in Vietnamese format.
- [ ] `i18nService` is the single source of truth for formatters.
