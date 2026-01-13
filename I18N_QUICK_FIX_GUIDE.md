# 🌍 i18n Quick Fix Guide - Copy/Paste Solutions

**Fast reference for eliminating i18n errors**

---

## ✅ QUICK CHECKLIST (5 mins)

```bash
# 1. Find all hardcoded dates
grep -r "toLocaleDateString\|toLocaleTimeString\|toLocaleString" src/ \
  --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v ".test"

# 2. Find all @ts-ignore
grep -r "@ts-ignore" src/hooks/useTranslation.ts src/services/i18nService.ts

# 3. Check locale storage consistency
grep -r "wellnexus_language\|'locale'\|'wellnexus_locale'" src/ \
  --include="*.tsx" --include="*.ts"

# 4. Find missing currency formatting
grep -r "\.toLocaleString()" src/ --include="*.tsx"
```

---

## 🔧 COPY-PASTE FIX #1: Replace toLocaleDateString

**Search Pattern:**
```typescript
new Date(someDate).toLocaleDateString('vi-VN')
```

**Replace With:**
```typescript
// At top of file:
import { formatDate } from '@/utils/i18n';
import { useStore } from '@/store';

// In component:
const locale = useStore(state => state.ui.locale) || 'vi';

// In JSX:
{formatDate(someDate, locale)}
```

---

## 🔧 COPY-PASTE FIX #2: Replace toLocaleTimeString

**Search Pattern:**
```typescript
new Date(someDate).toLocaleTimeString('vi-VN')
```

**Replace With:**
```typescript
// At top of file:
import { formatDateTime } from '@/utils/i18n';
import { useStore } from '@/store';

// In component:
const locale = useStore(state => state.ui.locale) || 'vi';

// In JSX:
{formatDateTime(someDate, locale)}
```

---

## 🔧 COPY-PASTE FIX #3: Replace .toLocaleString()

**Search Pattern (Numbers):**
```typescript
balance.toLocaleString()
```

**Replace With:**
```typescript
// At top of file:
import { formatNumber } from '@/utils/i18n';
import { useStore } from '@/store';

// In component:
const locale = useStore(state => state.ui.locale) || 'vi';

// In JSX:
{formatNumber(balance, locale)}
```

**Replace With (Currency):**
```typescript
// At top of file:
import { formatCurrency } from '@/utils/i18n';
import { useStore } from '@/store';

// In component:
const locale = useStore(state => state.ui.locale) || 'vi';

// In JSX:
{formatCurrency(balance, locale)}
```

---

## 🔧 COPY-PASTE FIX #4: Add Missing Translation Keys

**In `/src/locales/vi.ts`:**
```typescript
export const vi = {
  common: {
    // ... existing keys ...
    currency: {
      vnd: 'đ',
      grow: 'Token',
      shop: 'SHOP',
    }
  },
  
  // Add new section if needed:
  wallet: {
    balance: 'Số dư',
    transaction: 'Giao dịch',
    withdraw: 'Rút tiền',
  }
};
```

**In `/src/locales/en.ts`:**
```typescript
export const en = {
  common: {
    // ... existing keys ...
    currency: {
      vnd: '₫',
      grow: 'Token',
      shop: 'SHOP',
    }
  },
  
  // Add new section if needed:
  wallet: {
    balance: 'Balance',
    transaction: 'Transaction',
    withdraw: 'Withdraw',
  }
};
```

---

## 🔧 COPY-PASTE FIX #5: Unify Locale Storage Key

**Step 1: Define constant in `/src/utils/i18n.ts`**

Add at the top of the file:
```typescript
export const LOCALE_STORAGE_KEY = 'wellnexus_locale';
```

**Step 2: Update `/src/i18n.ts`**

Replace:
```typescript
detection: {
  order: ['localStorage', 'navigator'],
  caches: ['localStorage'],
  lookupLocalStorage: 'wellnexus_language', // OLD
}
```

With:
```typescript
import { LOCALE_STORAGE_KEY } from './utils/i18n';

detection: {
  order: ['localStorage', 'navigator'],
  caches: ['localStorage'],
  lookupLocalStorage: LOCALE_STORAGE_KEY,
}
```

**Step 3: Update `/src/utils/i18n.ts`**

Replace:
```typescript
export function setLocale(locale: Locale): void {
  localStorage.setItem('locale', locale); // OLD
  document.documentElement.lang = locale;
  document.documentElement.dir = LOCALES[locale].direction;
}
```

With:
```typescript
export function setLocale(locale: Locale): void {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.documentElement.lang = locale;
  document.documentElement.dir = LOCALES[locale].direction;
}

export function getLocale(): Locale {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored === 'vi' || stored === 'en') return stored;
  return 'vi';
}
```

---

## 🔧 COPY-PASTE FIX #6: Remove @ts-ignore from useTranslation

**In `/src/hooks/useTranslation.ts`:**

Replace this block:
```typescript
// DELETE THIS:
export function useTranslation() {
  // @ts-ignore - Bypass infinite type instantiation
  const { t: i18nT, i18n } = useI18nTranslation() as any;

  // ...

  // Explicitly cast t to a simple function signature to bypass strict i18next type checks
  const t: SimpleT = (key: string, ...args: any[]): string => {
    return i18nT(key, ...args) as string;
  };

  return { t, lang, setLang, i18n };
}
```

With this:
```typescript
export function useTranslation() {
  const { t: i18nT, i18n } = useI18nTranslation();

  // Normalize language code
  const lang = (i18n.language === 'en' || i18n.language?.startsWith('en')) ? 'en' : 'vi';

  const setLang = (newLang: 'en' | 'vi') => {
    if (!['en', 'vi'].includes(newLang)) {
      console.warn(`Invalid language: ${newLang}`);
      return;
    }
    i18n.changeLanguage(newLang);
  };

  const t = (key: string, variables?: Record<string, any>): string => {
    return i18nT(key, variables) as string;
  };

  return { t, lang, setLang, i18n };
}
```

---

## 🔧 COPY-PASTE FIX #7: Add Locale Context (Optional but Recommended)

Create `/src/context/LocaleContext.tsx`:
```typescript
import { createContext, useContext } from 'react';
import { Locale } from '@/utils/i18n';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function useLocale(): Locale {
  const context = useContext(LocaleContext);
  if (!context) {
    console.warn('useLocale must be used within LocaleProvider');
    return 'vi';
  }
  return context.locale;
}
```

Then in your App.tsx:
```typescript
import { useStore } from '@/store';
import { LocaleContext } from '@/context/LocaleContext';

export function App() {
  const locale = useStore(state => state.ui.locale) || 'vi';
  const setLocale = useStore(state => state.setLocale);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {/* Your app */}
    </LocaleContext.Provider>
  );
}
```

Then in components, use:
```typescript
import { useLocale } from '@/context/LocaleContext';
import { formatDate } from '@/utils/i18n';

function MyComponent() {
  const locale = useLocale();
  return <span>{formatDate(new Date(), locale)}</span>;
}
```

---

## 📋 FILE-BY-FILE FIXES

### Dashboard.tsx
**Line 56:** Replace hardcoded time

**Before:**
```typescript
const serverTime = useMemo(() => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), []);
```

**After:**
```typescript
import { formatDateTime } from '@/utils/i18n';

const locale = useStore(state => state.ui.locale) || 'vi';
const serverTime = useMemo(() => formatDateTime(new Date(), locale), [locale]);
```

---

### Wallet.tsx
**Lines 228, 311, 325, 451:** Replace .toLocaleString()

**Before:**
```typescript
<span>{hideBalance ? '••••' : user.shopBalance.toLocaleString()}</span>
```

**After:**
```typescript
import { formatNumber } from '@/utils/i18n';

const locale = useStore(state => state.ui.locale) || 'vi';
<span>{hideBalance ? '••••' : formatNumber(user.shopBalance, locale)}</span>
```

**Lines 438, 441:** Replace date formatting

**Before:**
```typescript
{new Date(tx.date).toLocaleDateString('vi-VN')}
{new Date(tx.date).toLocaleTimeString('vi-VN')}
```

**After:**
```typescript
import { formatDate, formatDateTime } from '@/utils/i18n';

const locale = useStore(state => state.ui.locale) || 'vi';

{formatDate(tx.date, locale)}
{formatDateTime(tx.date, locale)}
```

---

### CopilotPage.tsx
**Line 115:** Replace date formatting

**Before:**
```typescript
return date.toLocaleDateString('vi-VN');
```

**After:**
```typescript
import { formatDate } from '@/utils/i18n';

const locale = useStore(state => state.ui.locale) || 'vi';
return formatDate(date, locale);
```

---

### MarketingTools.tsx & GiftCardManager.tsx
**Lines 198, 383:** Replace date formatting

**Before:**
```typescript
{card.createdAt.toLocaleDateString('vi-VN')}
```

**After:**
```typescript
import { formatDate } from '@/utils/i18n';

const locale = useStore(state => state.ui.locale) || 'vi';

{formatDate(card.createdAt, locale)}
```

---

### Admin/AuditLog.tsx
**Multiple lines:** Replace date/time formatting

**Before:**
```typescript
new Date(l.timestamp).toLocaleString('vi-VN')
new Date(log.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
new Date(log.timestamp).toLocaleDateString('vi-VN')
```

**After:**
```typescript
import { formatDateTime, formatDate, formatTime } from '@/utils/i18n';

const locale = useStore(state => state.ui.locale) || 'vi';

{formatDateTime(l.timestamp, locale)}
{formatTime(log.timestamp, locale)}
{formatDate(log.timestamp, locale)}
```

---

### Admin/CMS.tsx
**Line 241:** Replace date formatting

**Before:**
```typescript
<span className="flex items-center gap-1.5"><Clock size={11} /> {new Date(ann.createdAt).toLocaleDateString('vi-VN')}</span>
```

**After:**
```typescript
import { formatDate } from '@/utils/i18n';

const locale = useStore(state => state.ui.locale) || 'vi';

<span className="flex items-center gap-1.5"><Clock size={11} /> {formatDate(ann.createdAt, locale)}</span>
```

---

### AgencyOSDemo.tsx
**Line 131:** Replace number formatting

**Before:**
```typescript
{kpi.current?.toLocaleString() || 0}
```

**After:**
```typescript
import { formatNumber } from '@/utils/i18n';

const locale = useStore(state => state.ui.locale) || 'vi';

{formatNumber(kpi.current || 0, locale)}
```

---

## 🧪 TESTING CHECKLIST

After each fix, verify:

```bash
# 1. Build succeeds
npm run build

# 2. No TypeScript errors
npx tsc --noEmit

# 3. Tests pass
npm test

# 4. In browser console (F12), check for i18n errors
# Expected: No "toLocaleString" errors
# Expected: No "undefined key" errors
```

---

## 🚀 DEPLOYMENT CHECKLIST

Before pushing to main:

- [ ] All hardcoded dates/times fixed
- [ ] All number formatting uses utilities
- [ ] Locale storage key unified
- [ ] @ts-ignore removed from i18n code
- [ ] Build succeeds without errors
- [ ] Tests pass
- [ ] Manual testing in both languages (en/vi)
- [ ] No console errors in browser DevTools

---

## 📞 TROUBLESHOOTING

### "formatDate is not defined"
Add this import: `import { formatDate } from '@/utils/i18n';`

### "useStore is not imported"
Add this import: `import { useStore } from '@/store';`

### "locale is undefined"
Add: `const locale = useStore(state => state.ui.locale) || 'vi';`

### Locale not switching when language changes
Ensure you're using the locale from useStore, not a hardcoded value.

### Dates showing wrong format
Verify locale is correctly passed to formatDate(): `formatDate(date, locale)`

---

**Last Updated:** 2025-01-13
**Status:** Ready for immediate use
**Estimated Time:** 2-3 hours for complete fixes
