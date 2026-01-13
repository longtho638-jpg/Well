# 🌍 I18N Error Elimination Prompt - WellNexus Codebase

**Purpose:** Complete audit and elimination of internationalization (i18n) errors across 100% of the codebase

**Status:** Enterprise-Ready | Production-Safe
**Target:** Antigravity /code delivery

---

## 📋 PHASE 1: CRITICAL ISSUES DETECTION

### Issue Categories

#### **1. HARDCODED STRINGS** (Critical Priority)
**Risk Level:** 🔴 CRITICAL

Find and fix all hardcoded UI text outside translation keys:

```bash
# Search patterns to find hardcoded strings:
- toLocaleDateString('vi-VN')  # Instead of i18nService.formatDate()
- toLocaleString('vi-VN')      # Instead of formatNumber()
- toLocaleTimeString('vi-VN')  # Instead of formatDateTime()
- String literals in JSX/TSX
- Error messages not from translations
- Validation messages without i18n keys
- Button labels without t() calls
```

**Files to audit:**
- `/src/pages/**/*.tsx` - All pages
- `/src/components/**/*.tsx` - All components
- `/src/services/**/*.ts` - Service layer
- `/src/utils/**/*.ts` - Utilities

**Current Known Issues:**
```
✗ Dashboard.tsx:56 - toLocaleTimeString('vi-VN')
✗ CopilotPage.tsx:115 - toLocaleDateString('vi-VN')
✗ Wallet.tsx:438 - toLocaleDateString('vi-VN')
✗ Wallet.tsx:441 - toLocaleTimeString('vi-VN')
✗ MarketingTools.tsx:383 - toLocaleDateString('vi-VN')
✗ Admin/AuditLog.tsx - Multiple date formatting issues
✗ AgencyOSDemo.tsx:208 - toLocaleTimeString()
```

---

#### **2. MISSING TRANSLATION KEYS** (High Priority)
**Risk Level:** 🟠 HIGH

Identify all strings used in code but not defined in translation files:

```typescript
// Check for usage patterns:
const { t } = useTranslation();
// ✓ GOOD: t('dashboard.welcome')
// ✗ BAD: "Welcome" (no translation key)
// ✗ BAD: t('missing.key') (key not in locales)
```

**Audit Script:**
```typescript
// Find all t('...') calls and verify keys exist in both vi.ts and en.ts
const translationRegex = /t\(['"]([^'"]+)['"]\)/g;

// For each match, verify:
// 1. Key exists in /src/locales/vi.ts
// 2. Key exists in /src/locales/en.ts
// 3. Translation is complete (no placeholder text)
// 4. No duplicate keys with different values
```

---

#### **3. INCOMPLETE LOCALE FILES** (High Priority)
**Risk Level:** 🟠 HIGH

Ensure both en.ts and vi.ts have:
- ✓ Identical key structure
- ✓ All translation keys for current features
- ✓ No orphaned keys from removed features
- ✓ Complete Phase 2 feature translations

**Comparison Check:**
```typescript
// Keys in vi.ts must exist in en.ts and vice versa
const viKeys = getAllKeys(vi);
const enKeys = getAllKeys(en);
const missingInEn = viKeys.filter(k => !enKeys.includes(k));
const missingInVi = enKeys.filter(k => !viKeys.includes(k));

// Must be empty array
console.assert(missingInEn.length === 0, "Missing English translations");
console.assert(missingInVi.length === 0, "Missing Vietnamese translations");
```

---

#### **4. INCONSISTENT LOCALE DETECTION** (Medium Priority)
**Risk Level:** 🟡 MEDIUM

Current issues:
- Multiple locale detection mechanisms (localStorage, browser, navigator)
- Inconsistent storage key names ('locale' vs 'wellnexus_language')
- No validation of locale values
- Type safety issues with language switching

**Files involved:**
- `/src/utils/i18n.ts` - detectLocale()
- `/src/i18n.ts` - LanguageDetector config
- `/src/hooks/useTranslation.ts` - Language switching logic

---

#### **5. TYPE SAFETY VIOLATIONS** (Medium Priority)
**Risk Level:** 🟡 MEDIUM

```typescript
// Current issues:
// ✗ @ts-ignore in useTranslation.ts (lines 13, 35)
// ✗ any type for translation values
// ✗ No type-safe key verification
// ✗ String keys instead of type-safe constants
```

**Safe approach:**
```typescript
// Create type-safe translation keys
type TranslationKey = 
  | 'common.loading'
  | 'common.error'
  | 'dashboard.welcome'
  | ... (all keys);

const t: (key: TranslationKey) => string;
```

---

#### **6. DATE/TIME FORMATTING INCONSISTENCY** (Medium Priority)
**Risk Level:** 🟡 MEDIUM

**Current implementations conflict:**
- `toLocaleDateString('vi-VN')` - Browser native, not controllable
- `i18nService.formatDate()` - Service layer, memoized
- No consistent place for date formatting
- Timezone issues not handled

**Standard implementation:**
```typescript
// Always use i18nService for dates:
import { formatDate, formatDateTime } from '@/utils/i18n';

// NOT this:
new Date().toLocaleDateString('vi-VN')

// DO this:
formatDate(new Date(), 'vi')
```

---

#### **7. MISSING NUMBER/CURRENCY FORMATTING** (Medium Priority)
**Risk Level:** 🟡 MEDIUM

**Issues:**
```typescript
// ✗ toLocaleString() - Browser native, not translatable
// ✗ .toLocaleString('vi-VN') in Wallet.tsx lines 228, 311, 325, 451
// ✓ formatVND() exists but not used everywhere
// ✓ formatNumber() exists but not used everywhere
```

**Files to fix:**
- `Wallet.tsx` - Multiple `.toLocaleString()` calls
- `AgencyOSDemo.tsx` - Line 131
- Any other component displaying numbers

---

#### **8. PLURALIZATION ERRORS** (Low Priority)
**Risk Level:** 🟢 LOW

**Issue:** Vietnamese doesn't use plurals, English does

```typescript
// WRONG:
{count} products

// RIGHT (Vietnamese has no plural forms):
{count} sản phẩm

// RIGHT (English should pluralize):
{count} product{count === 1 ? '' : 's'}
```

Use `pluralize()` from `/src/utils/i18n.ts` for proper handling.

---

## 🔧 PHASE 2: SYSTEMATIC FIXES

### Fix Template 1: Hardcoded Date String
**Pattern:** `toLocaleDateString('vi-VN')`

```typescript
// BEFORE:
<span>{new Date(tx.date).toLocaleDateString('vi-VN')}</span>

// AFTER:
import { formatDate } from '@/utils/i18n';
import { useStore } from '@/store';

const locale = useStore(state => state.ui.locale);
<span>{formatDate(tx.date, locale)}</span>
```

---

### Fix Template 2: Missing Translation Key
**Pattern:** No `t()` call for user-facing text

```typescript
// BEFORE:
<button>Click me</button>

// AFTER:
const { t } = useTranslation();
<button>{t('common.button.click')}</button>
```

**Steps:**
1. Add key to both `/src/locales/vi.ts` and `/src/locales/en.ts`
2. Use `t()` hook in component
3. Handle interpolation if needed: `t('key', { name: 'value' })`

---

### Fix Template 3: Inconsistent Number Formatting
**Pattern:** `.toLocaleString()` instead of utility

```typescript
// BEFORE:
<span>{balance.toLocaleString()}</span>

// AFTER (Option A - Number):
import { formatNumber } from '@/utils/i18n';
import { useStore } from '@/store';

const locale = useStore(state => state.ui.locale);
<span>{formatNumber(balance, locale)}</span>

// AFTER (Option B - Currency):
import { formatCurrency } from '@/utils/i18n';
<span>{formatCurrency(balance, locale)}</span>
```

---

### Fix Template 4: Type-Safe Locale
**Pattern:** Any language switching without validation

```typescript
// BEFORE:
const setLang = (newLang: string) => {
  i18n.changeLanguage(newLang); // Any string accepted!
};

// AFTER:
type Locale = 'vi' | 'en';

const setLang = (newLang: Locale) => {
  if (!['vi', 'en'].includes(newLang)) {
    console.warn(`Invalid locale: ${newLang}`);
    return;
  }
  i18n.changeLanguage(newLang);
};
```

---

### Fix Template 5: Unified Locale Storage
**Current conflict:**
- `i18n.ts` uses: `wellnexus_language`
- `utils/i18n.ts` uses: `locale`

**Standard:**
```typescript
// Use consistent key everywhere:
const LOCALE_STORAGE_KEY = 'wellnexus_locale';

// In i18n.ts:
lookupLocalStorage: LOCALE_STORAGE_KEY

// In utils/i18n.ts:
localStorage.setItem(LOCALE_STORAGE_KEY, locale);

// In hooks:
localStorage.getItem(LOCALE_STORAGE_KEY);
```

---

## 📊 PHASE 3: COMPREHENSIVE AUDIT CHECKLIST

### Pre-Deploy Verification

- [ ] **No `toLocaleDateString()` calls**
  ```bash
  grep -r "toLocaleDateString" src/ --include="*.tsx" --include="*.ts"
  # Should return: EMPTY
  ```

- [ ] **No `toLocaleString()` without context**
  ```bash
  grep -r "toLocaleString" src/ --include="*.tsx" --include="*.ts"
  # Should return: EMPTY (except where intentional)
  ```

- [ ] **No `toLocaleTimeString()` calls**
  ```bash
  grep -r "toLocaleTimeString" src/ --include="*.tsx" --include="*.ts"
  # Should return: EMPTY
  ```

- [ ] **All `t()` calls use valid keys**
  ```bash
  # Regex: t\('([^']+)'\)
  # Verify each key exists in both vi.ts and en.ts
  ```

- [ ] **Locale files have identical structure**
  ```typescript
  // Run comparison:
  const viKeys = new Set(getAllKeys(vi));
  const enKeys = new Set(getAllKeys(en));
  
  const diff = new Set([
    ...[...viKeys].filter(k => !enKeys.has(k)),
    ...[...enKeys].filter(k => !viKeys.has(k))
  ]);
  
  console.assert(diff.size === 0, `Missing keys: ${[...diff].join(', ')}`);
  ```

- [ ] **No hardcoded error messages**
  ```bash
  grep -rE "(Error|Error:|Failed|Lỗi|Thất bại)" src/ --include="*.tsx"
  # Each must have corresponding t() call
  ```

- [ ] **Validation messages use translations**
  ```bash
  grep -r "required\|invalid\|must be\|phải là\|bắt buộc" src/ --include="*.tsx"
  # Each must come from t() keys
  ```

- [ ] **No `@ts-ignore` for i18n**
  ```bash
  grep -r "@ts-ignore" src/hooks/useTranslation.ts src/services/i18nService.ts
  # Should return: EMPTY (types must be fixed)
  ```

- [ ] **Locale storage key is consistent**
  ```bash
  grep -r "localStorage.*lang\|wellnexus_language\|wellnexus_locale" src/
  # All must use same key: LOCALE_STORAGE_KEY
  ```

---

## 🎯 PHASE 4: IMPLEMENTATION ROADMAP

### Step 1: Fix All Hardcoded Dates (30 min)
**Files:**
- Dashboard.tsx:56
- CopilotPage.tsx:115
- Wallet.tsx:438, 441
- MarketingTools.tsx:383
- Admin/AuditLog.tsx:98, 217, 220, 295
- Admin/CMS.tsx:241
- MarketingTools/GiftCardManager.tsx:198

**Template:**
```typescript
// Import at top
import { formatDate, formatDateTime } from '@/utils/i18n';
import { useStore } from '@/store';

// In component
const locale = useStore(state => state.ui.locale) || 'vi';

// Replace all toLocaleDateString:
// {formatDate(date, locale)}
```

---

### Step 2: Fix All Number Formatting (20 min)
**Files:**
- Wallet.tsx:228, 311, 325, 451
- AgencyOSDemo.tsx:131

**Template:**
```typescript
import { formatNumber } from '@/utils/i18n';
import { useStore } from '@/store';

const locale = useStore(state => state.ui.locale) || 'vi';

// Replace .toLocaleString():
// {formatNumber(value, locale)}
```

---

### Step 3: Unify Locale Storage (15 min)
**Files:**
- src/i18n.ts
- src/utils/i18n.ts
- src/hooks/useTranslation.ts

**Action:**
```typescript
// Define constant once:
export const LOCALE_STORAGE_KEY = 'wellnexus_locale';

// Use everywhere:
localStorage.setItem(LOCALE_STORAGE_KEY, locale);
localStorage.getItem(LOCALE_STORAGE_KEY);
```

---

### Step 4: Verify All Translation Keys (45 min)
**Process:**
1. Extract all `t('...')` calls
2. Check each key exists in vi.ts
3. Check each key exists in en.ts
4. Verify no placeholder text remains
5. Add missing keys

**Missing keys likely:**
- Error messages
- Validation messages
- Admin panel strings
- Health coach strings
- Copilot responses

---

### Step 5: Type-Safe Translation Keys (30 min)
**Files:**
- src/hooks/useTranslation.ts
- src/types.ts

**Action:**
```typescript
// Create type in types.ts
export type TranslationKey = 
  | 'common.loading'
  | 'common.error'
  | 'dashboard.welcome'
  // ... all keys from locales

// Use in hook:
export function useTranslation() {
  const t = (key: TranslationKey) => i18nT(key);
  return { t, ... };
}
```

---

### Step 6: Remove Type Safety Bypasses (10 min)
**Files:**
- src/hooks/useTranslation.ts

**Remove:**
```typescript
// DELETE THESE:
// @ts-ignore - Bypass infinite type instantiation
// const { t: i18nT, i18n } = useI18nTranslation() as any;

// REPLACE WITH:
const { t: i18nT, i18n } = useI18nTranslation();

// DELETE:
// type SimpleT = (key: string, ...args: any[]) => string;
// const t: SimpleT = (key: string, ...args: any[]): string => {

// REPLACE WITH:
const t = (key: TranslationKey, variables?: Record<string, any>) => {
```

---

## ✅ QUALITY GATES

### Before Committing Code:
1. ✓ No `@ts-ignore` for i18n code
2. ✓ All hardcoded dates use `formatDate()`
3. ✓ All numbers use `formatNumber()` or `formatCurrency()`
4. ✓ All UI strings use `t()` calls
5. ✓ All `t()` keys verified in both locales
6. ✓ Types are strict (no `any`, no `string` for locale)

### Before Merge to Main:
1. ✓ Run grep checks (see Phase 3)
2. ✓ Run test suite: `npm test`
3. ✓ Build succeeds: `npm run build`
4. ✓ No TypeScript errors: `npx tsc --noEmit`
5. ✓ Manual test both 'en' and 'vi' languages

### Before Antigravity Delivery:
1. ✓ All audits pass
2. ✓ No warnings in console
3. ✓ Dates display correctly in both locales
4. ✓ Numbers format correctly in both locales
5. ✓ No hardcoded strings visible to users
6. ✓ Language switching works smoothly

---

## 📝 VERIFICATION SCRIPT

```typescript
/**
 * Run this in browser console to validate i18n
 */

const i18nCheck = {
  // Check 1: No hardcoded dates
  checkDates: () => {
    const dateRegex = /toLocaleDateString|toLocaleString|toLocaleTimeString/;
    console.log('Check dates: Look for console.error() messages in source');
    return 'Manual inspection required';
  },

  // Check 2: All translation keys exist
  checkKeys: () => {
    // Requires access to translation files
    const t = window.i18next.t;
    const testKeys = [
      'common.loading',
      'common.error',
      'dashboard.welcome',
      // Add all expected keys
    ];
    
    const missing = testKeys.filter(key => t(key) === key); // Returns key if not found
    return {
      status: missing.length === 0 ? 'PASS' : 'FAIL',
      missingKeys: missing
    };
  },

  // Check 3: Language switching
  checkLangSwitch: async () => {
    await window.i18next.changeLanguage('en');
    const enText = window.i18next.t('dashboard.title');
    
    await window.i18next.changeLanguage('vi');
    const viText = window.i18next.t('dashboard.title');
    
    return {
      status: (enText !== viText && enText !== 'dashboard.title') ? 'PASS' : 'FAIL',
      en: enText,
      vi: viText
    };
  },

  // Check 4: Number formatting
  checkNumbers: () => {
    const { t } = window.i18next;
    // Manual check: Numbers should format with correct locale
    return 'Manual inspection required - check number separators';
  },

  // Check 5: Date formatting
  checkDateFormatting: () => {
    // Manual check: Dates should show correct format for locale
    return 'Manual inspection required - check date format (DD/MM/YYYY vs MM/DD/YYYY)';
  }
};

// Run all checks
Object.entries(i18nCheck).forEach(([name, fn]) => {
  console.log(`\n=== ${name} ===`);
  console.log(fn());
});
```

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] All hardcoded dates/times fixed
- [ ] All number formatting uses utilities
- [ ] All UI strings use `t()` calls
- [ ] Translation keys verified in both files
- [ ] Locale storage unified
- [ ] TypeScript @ts-ignore removed
- [ ] Type safety enforced
- [ ] Tests passing: `npm test`
- [ ] Build succeeding: `npm run build`
- [ ] Manual QA in both languages
- [ ] Console clean: No i18n warnings

---

## 📞 ANTIGRAVITY /code HANDOFF

**Ready for delivery when:**
1. All checks in PHASE 3 pass
2. Deployment checklist complete
3. Manual testing confirms:
   - English language works
   - Vietnamese language works
   - Dates format correctly
   - Numbers format correctly
   - No console errors
   - No hardcoded strings visible

**Files Modified:**
- [ ] `/src/i18n.ts`
- [ ] `/src/utils/i18n.ts`
- [ ] `/src/hooks/useTranslation.ts`
- [ ] `/src/locales/vi.ts`
- [ ] `/src/locales/en.ts`
- [ ] All page/component files with date/number formatting
- [ ] All page/component files with hardcoded strings

**Git Commit Message:**
```
feat: Eliminate 100% of i18n errors across codebase

- Fix all hardcoded date/time formatting
- Replace .toLocaleString() with i18n utilities
- Unify locale storage key usage
- Add missing translation keys
- Enforce type-safe locale parameter
- Remove @ts-ignore from i18n code
- Verify identical key structure in en/vi locales
```

---

**Created:** 2025-01-13
**Status:** Ready for execution
**Audience:** Antigravity /code delivery team
