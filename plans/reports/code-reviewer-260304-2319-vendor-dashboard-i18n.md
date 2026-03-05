# Code Review: VendorDashboard i18n Refactor

**Date:** 2026-03-04
**File:** `/Users/macbookprom1/mekong-cli/apps/well/src/components/marketplace/VendorDashboard.tsx`
**LOC:** 557 lines
**Focus:** i18n implementation review

---

## Overall Assessment

i18n refactor **mostly complete** with good coverage. All major UI strings use `t()` keys. TypeScript passes with 0 errors. **4 hardcoded English strings remain** in error toasts that need translation.

---

## ✅ Passed Checks

### 1. i18n Keys Coverage (38/38 keys verified)

All `t('vendor.*')` calls match translation files:

| Key Path | Used In | vi.ts | en.ts |
|----------|---------|-------|-------|
| `vendor.dashboard.title` | Line 126 | ✅ | ✅ |
| `vendor.dashboard.subtitle` | Line 127 | ✅ | ✅ |
| `vendor.dashboard.stats.*` | Lines 138-181 | ✅ | ✅ |
| `vendor.dashboard.tabs.*` | Lines 204-230 | ✅ | ✅ |
| `vendor.dashboard.products.*` | Lines 245-310 | ✅ | ✅ |
| `vendor.analytics.title` | Line 334 | ✅ | ✅ |
| `vendor.settings.*` | Lines 347-375 | ✅ | ✅ |
| `vendor.addProduct.*` | Lines 408-550 | ✅ | ✅ |
| `vendor.actions.save` | Line 96 | ✅ | ✅ |

### 2. TypeScript Strict Mode

```bash
npx tsc --noEmit
# Result: 0 errors ✅
```

### 3. Validation Logic

`validateForm()` function (lines 404-425) correctly uses i18n:
- ✅ `t('vendor.addProduct.validation.nameRequired')`
- ✅ `t('vendor.addProduct.validation.pricePositive')`
- ✅ `t('vendor.addProduct.validation.commissionRange')`
- ✅ `t('vendor.addProduct.validation.invalidUrl')`

**Note:** `priceRequired` exists in translations but not used (validation uses `required` HTML attribute instead).

### 4. Responsive Design

✅ Tailwind responsive classes present:
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (product grid)
- `grid-cols-1 md:grid-cols-4` (stats cards)
- `p-4` on modal for mobile padding

### 5. Accessibility

✅ Present:
- `aria-label` implicit via labels
- `title` attributes on buttons (lines 299, 307)
- Form labels associated with inputs
- Focus states: `focus:ring-2 focus:ring-blue-500`

⚠️ Missing:
- No keyboard navigation for modal close (Escape key)
- No `role="dialog"` on AddProductModal

---

## ❌ Issues Found

### HIGH: Hardcoded English Toast Messages (4 instances)

**Lines 53, 80, 99, 114** - Error toasts with hardcoded English:

```tsx
// Line 53
showToast('Failed to load vendor products', 'error');

// Line 80
showToast('Failed to add product', 'error');

// Line 99
showToast('Failed to update product', 'error');

// Line 114
showToast('Failed to delete product', 'error');
```

**Impact:** Non-English users see English error messages.

**Fix:** Add to `vi.ts` / `en.ts`:
```typescript
vendor: {
  toasts: {
    loadError: "Không thể tải sản phẩm",
    addError: "Không thể thêm sản phẩm",
    updateError: "Không thể cập nhật sản phẩm",
    deleteError: "Không thể xóa sản phẩm",
    saveSuccess: "Đã lưu thành công!"
  }
}
```

### MEDIUM: Hardcoded Default Store Description

**Line 371:**
```tsx
defaultValue="Welcome to my store! Quality health and wellness products for your wellbeing."
```

**Impact:** English default text in settings form.

**Fix:** Add `vendor.settings.defaultDescription` to translations.

### MEDIUM: Currency Symbol Hardcoded

**Lines 140, 168:**
```tsx
{totalSales.toLocaleString()}₫
{totalCommissions.toLocaleString()}₫
```

**Recommendation:** Use currency formatter hook or i18n currency key.

### LOW: Missing Price Required Validation

**Line 411-413:**
```tsx
if (!formData.price || formData.price <= 0) {
  newErrors.price = t('vendor.addProduct.validation.pricePositive');
}
```

Translation has `priceRequired` but code doesn't use it (minor - HTML `required` attribute handles this).

---

## Edge Cases Found

1. **Modal Escape Key:** No keyboard handler to close modal on Escape
2. **Image Loading:** No onError handler if `product.imageUrl` fails to load
3. **Empty State:** No empty state UI when `vendorProducts.length === 0` (translation exists: `vendor.dashboard.empty.noProducts`)
4. **Loading Error Recovery:** No retry button when product load fails

---

## Positive Observations

✅ Comprehensive i18n key structure (`vendor.dashboard.*`, `vendor.addProduct.*`)
✅ Consistent naming convention between vi.ts and en.ts
✅ Proper error boundaries with try-catch in all async handlers
✅ Loading state with spinner (line 258)
✅ Confirm dialog for delete uses i18n (line 104)
✅ Dark mode support throughout
✅ Framer Motion animations for tab transitions

---

## Recommended Actions

1. **[CRITICAL]** Replace 4 hardcoded error toasts with i18n keys
2. **[HIGH]** Add i18n key for default store description
3. **[MEDIUM]** Implement empty state using existing translations
4. **[LOW]** Add Escape key handler to modal
5. **[LOW]** Add image onError fallback
6. **[NICE-TO-HAVE]** Extract currency formatting to utility function

---

## Metrics

| Metric | Status |
|--------|--------|
| i18n Coverage | 90% (38/44 strings) |
| TypeScript Errors | 0 ✅ |
| Hardcoded Strings | 6 (4 toasts + 1 default + 1 currency) |
| Accessibility Issues | 2 (missing role, no Escape handler) |
| Responsive Classes | ✅ Complete |

---

## Unresolved Questions

1. Should currency formatting be centralized in a utility function?
2. Is there a global error toast handler that could auto-translate?
3. Should the empty state (`vendor.dashboard.empty.*`) be implemented now or in a separate task?
