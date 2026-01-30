---
phase: 1
title: "Critical Fixes: CartSummary & Missing Translation Keys"
priority: P0
effort: 2h
status: planned
---

# Phase 01: Critical Fixes - CartSummary & Missing Translation Keys

**Goal**: Fix the most critical i18n issues preventing English language support

**Scope**:
1. Refactor CartSummary.tsx from 100% hardcoded to full i18n
2. Add missing translation keys for Landing page components
3. Fix HealthCheck hardcoded product names

---

## Context Links

- **i18n Audit Report**: `/Users/macbookprom1/Well/plans/reports/explorer-260130-1820-i18n-audit.md`
- **Current Locale Files**:
  - `/Users/macbookprom1/Well/src/locales/vi.ts`
  - `/Users/macbookprom1/Well/src/locales/en.ts`

---

## Key Insights

**From Explorer Audit:**
- **CartSummary.tsx**: 0 i18n usage, 100% Vietnamese hardcoded
- **Landing page**: t() calls reference missing keys (landing.featured.*)
- **HealthCheck**: Product names in mock data, not in locale files
- **Impact**: English users see Vietnamese in critical checkout flow

**Critical Path:**
1. CartSummary first (blocks checkout for international users)
2. Landing page keys second (visible on homepage)
3. HealthCheck third (less critical, admin tool)

---

## Requirements

### Functional Requirements

**FR1-1: CartSummary i18n Implementation**
- Replace all hardcoded Vietnamese strings with t() calls
- Add keys to `cart` namespace in locale files
- Maintain exact same UI/UX (zero visual changes)
- Support language switching without page reload

**FR1-2: Landing Page Missing Keys**
- Add `landing.featured.badge`, `title`, `viewAll` to locale files
- Add `landing.testimonials.*` keys
- Add `landing.cta.*` keys
- Verify all t() calls have corresponding keys

**FR1-3: HealthCheck Product Names**
- Extract product names from mock data to locale files
- Add `healthcheck.products.*` namespace
- Update mock data generation to use t()

### Non-Functional Requirements

**NFR1-1: Compatibility**
- No breaking changes to existing translations
- Backward compatible with current i18n setup
- Language switcher continues to work

**NFR1-2: Quality**
- All 235 tests must pass
- TypeScript: 0 errors
- Build successful

---

## Architecture

### CartSummary Translation Strategy

```tsx
// BEFORE (Hardcoded)
<p>Giỏ hàng trống</p>
<h3>Đơn hàng của bạn</h3>
<span>Tạm tính</span>
<span>Phí vận chuyển</span>
<span>Thuế VAT (10%)</span>
<span>Tổng cộng</span>

// AFTER (i18n)
<p>{t('cart.empty')}</p>
<h3>{t('cart.yourOrder')}</h3>
<span>{t('cart.subtotal')}</span>
<span>{t('cart.shipping')}</span>
<span>{t('cart.vat')}</span>
<span>{t('cart.total')}</span>
```

### Locale File Structure

```typescript
// vi.ts additions
export const vi = {
  // ... existing keys
  cart: {
    empty: 'Giỏ hàng trống',
    yourOrder: 'Đơn hàng của bạn',
    subtotal: 'Tạm tính',
    shipping: 'Phí vận chuyển',
    vat: 'Thuế VAT (10%)',
    total: 'Tổng cộng',
    viewCart: 'Xem giỏ hàng',
    checkout: 'Thanh toán'
  },
  landing: {
    featured: {
      badge: 'Nổi bật',
      title: 'Sản Phẩm Nổi Bật',
      viewAll: 'Xem tất cả'
    }
  },
  healthcheck: {
    products: {
      combo_anima: 'Combo ANIMA Thư Giãn',
      combo_focus: 'Combo FOCUS Tập Trung',
      // ... more products
    }
  }
};

// en.ts additions (exact same structure)
export const en = {
  cart: {
    empty: 'Cart is empty',
    yourOrder: 'Your Order',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    vat: 'VAT (10%)',
    total: 'Total',
    viewCart: 'View Cart',
    checkout: 'Checkout'
  },
  landing: {
    featured: {
      badge: 'Featured',
      title: 'Featured Products',
      viewAll: 'View All'
    }
  },
  healthcheck: {
    products: {
      combo_anima: 'ANIMA Relaxation Combo',
      combo_focus: 'FOCUS Concentration Combo',
      // ... more products
    }
  }
};
```

---

## Related Code Files

### Files to Modify

**CartSummary:**
- `/Users/macbookprom1/Well/src/components/checkout/CartSummary.tsx`

**Landing Page:**
- `/Users/macbookprom1/Well/src/components/landing/FeaturedProducts.tsx`
- `/Users/macbookprom1/Well/src/components/landing/Testimonials.tsx`

**HealthCheck:**
- `/Users/macbookprom1/Well/src/pages/HealthCheck.tsx`

**Locale Files:**
- `/Users/macbookprom1/Well/src/locales/vi.ts`
- `/Users/macbookprom1/Well/src/locales/en.ts`

---

## Implementation Steps

### Step 1: CartSummary i18n Refactor (45 min)

1. **Read current CartSummary.tsx**
   - Identify all hardcoded Vietnamese strings
   - Map to translation keys

2. **Add keys to locale files**
   - Add `cart` namespace to vi.ts
   - Add `cart` namespace to en.ts (English equivalents)

3. **Refactor CartSummary.tsx**
   - Import useTranslation hook
   - Replace all hardcoded strings with t() calls
   - Preserve exact className and styling

4. **Verify visually**
   - Test in Vietnamese mode
   - Test in English mode
   - Verify language switcher works

### Step 2: Landing Page Missing Keys (30 min)

1. **Audit FeaturedProducts.tsx**
   - List all t() calls with missing keys
   - Note fallback strings

2. **Add keys to locale files**
   - Add `landing.featured.*` to vi.ts
   - Add `landing.featured.*` to en.ts

3. **Verify FeaturedProducts**
   - Check UI displays correctly in both languages
   - No visible translation keys

### Step 3: HealthCheck Product Names (30 min)

1. **Extract product names from mock data**
   - Identify all hardcoded product names in HealthCheck.tsx
   - Create `healthcheck.products.*` keys

2. **Update locale files**
   - Add `healthcheck.products.*` to vi.ts
   - Add English translations to en.ts

3. **Refactor HealthCheck.tsx**
   - Update mock data generation to use t()
   - Maintain same functionality

### Step 4: Verification (15 min)

1. **Manual testing**
   - Navigate to all modified pages
   - Switch language Vietnamese → English → Vietnamese
   - Verify no visible translation keys
   - Verify all text translated correctly

2. **Run tests**
   ```bash
   npm run test:run
   npx tsc --noEmit
   npm run build
   ```

---

## Todo List

### CartSummary Refactor
- [ ] Read CartSummary.tsx and map hardcoded strings
- [ ] Add `cart.*` keys to vi.ts
- [ ] Add `cart.*` keys to en.ts
- [ ] Import useTranslation in CartSummary.tsx
- [ ] Replace all hardcoded strings with t() calls
- [ ] Test in Vietnamese mode
- [ ] Test in English mode
- [ ] Verify language switcher works

### Landing Page Keys
- [ ] Audit FeaturedProducts.tsx for missing keys
- [ ] Add `landing.featured.*` to vi.ts
- [ ] Add `landing.featured.*` to en.ts
- [ ] Verify FeaturedProducts displays correctly
- [ ] Check for any other landing components with missing keys

### HealthCheck Products
- [ ] List all hardcoded product names in HealthCheck.tsx
- [ ] Create `healthcheck.products.*` keys in vi.ts
- [ ] Add English translations to en.ts
- [ ] Update mock data generation to use t()
- [ ] Test HealthCheck page in both languages

### Verification
- [ ] Manual test: CartSummary in both languages
- [ ] Manual test: Landing page in both languages
- [ ] Manual test: HealthCheck in both languages
- [ ] Run `npm run test:run` - all pass
- [ ] Run `npx tsc --noEmit` - 0 errors
- [ ] Run `npm run build` - success

---

## Success Criteria

**Definition of Done:**
- ✅ CartSummary 100% i18n (0 hardcoded strings)
- ✅ All landing page t() calls have keys in locale files
- ✅ HealthCheck products use i18n
- ✅ Language switcher works on all modified pages
- ✅ All 235 tests pass
- ✅ TypeScript: 0 errors
- ✅ Build successful
- ✅ No visible translation keys in UI

**Validation Methods:**
1. Visual inspection in both languages
2. Test suite passes
3. Type check passes
4. Manual QA on critical flows

---

## Risk Assessment

**Potential Issues:**

1. **CartSummary Styling Break**
   - Risk: Changing div to span for t() might affect layout
   - Mitigation: Preserve exact className structure, test visually
   - Rollback: Git commit before changes

2. **Missing Key Errors in Console**
   - Risk: Typos in key names cause runtime errors
   - Mitigation: Double-check key names match exactly
   - Detection: Check browser console for i18next warnings

3. **Test Failures**
   - Risk: Tests expect hardcoded Vietnamese strings
   - Mitigation: Update test snapshots if needed
   - Fix: Mock useTranslation in tests

---

## Security Considerations

**i18n Implementation:**
- No XSS risk (t() escapes HTML by default)
- No sensitive data in translation keys
- Locale files are public (no secrets)

**Language Switching:**
- Client-side only (no server requests)
- Language preference stored in localStorage
- No authentication required

---

## Next Steps

After Phase 1 completion:
1. Commit changes with conventional commit message
2. Run full regression test suite
3. Manual QA on modified pages
4. Proceed to Phase 2: Locale Cleanup & Consolidation
