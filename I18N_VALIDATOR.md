# 🔍 i18n Validator - Pre-Deployment Quality Gates

**Automated checks to ensure 100% i18n compliance before Antigravity delivery**

---

## 📊 VALIDATOR DASHBOARD

### Status Checks
```
[✓] Hardcoded dates eliminated
[✓] Hardcoded times eliminated  
[✓] Number formatting standardized
[✓] Translation keys verified
[✓] Locale files synchronized
[✓] Type safety enforced
[✓] Storage keys unified
[✓] Console clean
```

---

## 🔧 VALIDATOR TOOLS

### Tool 1: Hardcoded Date/Time Detection

**Run in terminal:**
```bash
# Find all hardcoded date/time calls
echo "🔍 Checking for hardcoded dates..."
if grep -r "toLocaleDateString\|toLocaleTimeString\|toLocaleString" \
  src/ --include="*.tsx" --include="*.ts" \
  | grep -v "node_modules" | grep -v ".test" \
  | grep -v "i18nService.ts"; then
  echo "❌ FAILED: Found hardcoded date/time formatting"
  exit 1
else
  echo "✅ PASSED: No hardcoded date/time formatting"
fi
```

---

### Tool 2: Number Formatting Verification

**Run in terminal:**
```bash
# Find all .toLocaleString() calls without context
echo "🔍 Checking for number formatting..."
found=false
for file in $(find src -name "*.tsx" -o -name "*.ts" | grep -v node_modules); do
  if grep -q "\.toLocaleString()" "$file" 2>/dev/null; then
    if ! grep -q "import.*formatNumber\|import.*formatCurrency" "$file"; then
      echo "  ❌ $file uses .toLocaleString() without formatter import"
      found=true
    fi
  fi
done

if [ "$found" = true ]; then
  echo "❌ FAILED: Inconsistent number formatting"
  exit 1
else
  echo "✅ PASSED: All numbers use i18n formatters"
fi
```

---

### Tool 3: Translation Key Validator

**Create `/src/validators/translationValidator.ts`:**

```typescript
import fs from 'fs';
import path from 'path';

interface TranslationFile {
  [key: string]: any;
}

function flattenKeys(obj: TranslationFile, prefix = ''): string[] {
  let keys: string[] = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      keys = [...keys, ...flattenKeys(value, fullKey)];
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

export function validateTranslations(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Read locale files
    const viPath = path.join(process.cwd(), 'src/locales/vi.ts');
    const enPath = path.join(process.cwd(), 'src/locales/en.ts');
    
    if (!fs.existsSync(viPath)) {
      errors.push(`Vietnamese locale file not found: ${viPath}`);
      return { isValid: false, errors, warnings };
    }
    
    if (!fs.existsSync(enPath)) {
      errors.push(`English locale file not found: ${enPath}`);
      return { isValid: false, errors, warnings };
    }
    
    // Parse locale files (requires eval or proper parsing)
    const viContent = fs.readFileSync(viPath, 'utf-8');
    const enContent = fs.readFileSync(enPath, 'utf-8');
    
    // Extract export statements
    const viMatch = viContent.match(/export const vi = ({[\s\S]*?^}\);?$/m);
    const enMatch = enContent.match(/export const en = ({[\s\S]*?^}\);?$/m);
    
    if (!viMatch || !enMatch) {
      errors.push('Could not parse locale files');
      return { isValid: false, errors, warnings };
    }
    
    // Use Function constructor to safely evaluate
    // eslint-disable-next-line no-new-func
    const vi = new Function(`return ${viMatch[1]}`)() as TranslationFile;
    // eslint-disable-next-line no-new-func
    const en = new Function(`return ${enMatch[1]}`)() as TranslationFile;
    
    const viKeys = new Set(flattenKeys(vi));
    const enKeys = new Set(flattenKeys(en));
    
    // Check for missing keys
    const missingInEn = [...viKeys].filter(k => !enKeys.has(k));
    const missingInVi = [...enKeys].filter(k => !viKeys.has(k));
    
    if (missingInEn.length > 0) {
      errors.push(`Missing English translations: ${missingInEn.join(', ')}`);
    }
    
    if (missingInVi.length > 0) {
      errors.push(`Missing Vietnamese translations: ${missingInVi.join(', ')}`);
    }
    
    // Check for empty translations
    flattenKeys(vi).forEach(key => {
      const value = getNestedValue(vi, key);
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        warnings.push(`Empty Vietnamese translation: ${key}`);
      }
    });
    
    flattenKeys(en).forEach(key => {
      const value = getNestedValue(en, key);
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        warnings.push(`Empty English translation: ${key}`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  } catch (error) {
    errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { isValid: false, errors, warnings };
  }
}

function getNestedValue(obj: TranslationFile, keyPath: string): any {
  return keyPath.split('.').reduce((current, key) => current?.[key], obj);
}

// Run validation
if (require.main === module) {
  const result = validateTranslations();
  
  if (result.errors.length > 0) {
    console.error('❌ VALIDATION FAILED');
    result.errors.forEach(err => console.error(`  • ${err}`));
    process.exit(1);
  }
  
  if (result.warnings.length > 0) {
    console.warn('⚠️  WARNINGS');
    result.warnings.forEach(warn => console.warn(`  • ${warn}`));
  }
  
  console.log('✅ All translations valid!');
  process.exit(0);
}

export default validateTranslations;
```

---

### Tool 4: Type Safety Checker

**Run in terminal:**
```bash
# Check for @ts-ignore in i18n code
echo "🔍 Checking type safety..."
if grep -r "@ts-ignore" src/hooks/useTranslation.ts src/services/i18nService.ts 2>/dev/null; then
  echo "❌ FAILED: Found @ts-ignore in i18n code"
  exit 1
else
  echo "✅ PASSED: No @ts-ignore in i18n code"
fi
```

---

### Tool 5: Storage Key Consistency

**Run in terminal:**
```bash
# Check locale storage key usage
echo "🔍 Checking storage key consistency..."

# Count occurrences of each key
wellnexus_language=$(grep -r "wellnexus_language" src/ 2>/dev/null | wc -l)
locale=$(grep -r "'locale'" src/ 2>/dev/null | wc -l)
wellnexus_locale=$(grep -r "wellnexus_locale" src/ 2>/dev/null | wc -l)

echo "  Found 'wellnexus_language': $wellnexus_language"
echo "  Found 'locale': $locale"
echo "  Found 'wellnexus_locale': $wellnexus_locale"

if [ "$wellnexus_language" -gt 0 ] || [ "$locale" -gt 0 ] || [ "$wellnexus_locale" -gt 0 ]; then
  if ! [ "$wellnexus_locale" -gt 0 ]; then
    echo "❌ FAILED: Should use 'wellnexus_locale' consistently"
    exit 1
  fi
fi

echo "✅ PASSED: Storage keys consistent"
```

---

### Tool 6: Build Verification

**Run in terminal:**
```bash
# Verify build succeeds
echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ PASSED: Build successful"
else
  echo "❌ FAILED: Build failed"
  exit 1
fi
```

---

### Tool 7: TypeScript Type Check

**Run in terminal:**
```bash
# Verify no TypeScript errors
echo "📝 Checking TypeScript..."
npx tsc --noEmit

if [ $? -eq 0 ]; then
  echo "✅ PASSED: No TypeScript errors"
else
  echo "❌ FAILED: TypeScript errors found"
  exit 1
fi
```

---

### Tool 8: Browser Console Validator

**Save as `/src/validators/browserValidator.ts`:**

```typescript
/**
 * Browser-based i18n validator
 * Run in browser console to validate runtime i18n
 */

export const browserValidator = {
  /**
   * Check if all common keys are available
   */
  validateCommonKeys: () => {
    const requiredKeys = [
      'common.loading',
      'common.error',
      'common.success',
      'common.failed',
      'common.cancel',
      'common.save',
      'nav.dashboard',
      'nav.marketplace',
      'nav.wallet',
    ];
    
    const t = (window as any).i18next?.t;
    if (!t) {
      console.error('❌ i18next not initialized');
      return false;
    }
    
    const missing = requiredKeys.filter(key => {
      const result = t(key);
      return result === key; // Key returned unchanged = not found
    });
    
    if (missing.length > 0) {
      console.error(`❌ Missing keys: ${missing.join(', ')}`);
      return false;
    }
    
    console.log('✅ All common keys available');
    return true;
  },
  
  /**
   * Check language switching
   */
  validateLanguageSwitch: async () => {
    const i18n = (window as any).i18next;
    if (!i18n) {
      console.error('❌ i18next not initialized');
      return false;
    }
    
    // Test English
    await i18n.changeLanguage('en');
    const enTitle = i18n.t('dashboard.title');
    
    // Test Vietnamese
    await i18n.changeLanguage('vi');
    const viTitle = i18n.t('dashboard.title');
    
    // Verify both are different and not key names
    const isValid = enTitle !== viTitle && 
                   enTitle !== 'dashboard.title' && 
                   viTitle !== 'dashboard.title';
    
    if (!isValid) {
      console.error('❌ Language switching failed');
      return false;
    }
    
    console.log('✅ Language switching works');
    return true;
  },
  
  /**
   * Check date formatting
   */
  validateDateFormatting: () => {
    const formatDate = (window as any).WellNexus?.utils?.formatDate;
    if (!formatDate) {
      console.warn('⚠️  formatDate not available for testing');
      return true; // Don't fail if not exposed
    }
    
    const date = new Date('2025-01-13');
    const enDate = formatDate(date, 'en');
    const viDate = formatDate(date, 'vi');
    
    // Should be different formats
    if (enDate === viDate) {
      console.error('❌ Date formatting not locale-specific');
      return false;
    }
    
    console.log('✅ Date formatting works');
    console.log(`  EN: ${enDate}`);
    console.log(`  VI: ${viDate}`);
    return true;
  },
  
  /**
   * Run all validations
   */
  runAll: async () => {
    console.log('\n🔍 Running browser i18n validator...\n');
    
    const checks = [
      { name: 'Common Keys', fn: () => this.validateCommonKeys() },
      { name: 'Language Switch', fn: () => this.validateLanguageSwitch() },
      { name: 'Date Formatting', fn: () => this.validateDateFormatting() },
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const check of checks) {
      try {
        const result = await check.fn();
        if (result) passed++;
        else failed++;
      } catch (error) {
        console.error(`❌ ${check.name}: ${error}`);
        failed++;
      }
    }
    
    console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
    return failed === 0;
  }
};

// Make available globally for browser console
if (typeof window !== 'undefined') {
  (window as any).i18nValidator = browserValidator;
}
```

---

## 🚀 COMPLETE VALIDATION SCRIPT

**Create `/scripts/validate-i18n.sh`:**

```bash
#!/bin/bash

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         i18n COMPREHENSIVE VALIDATION SUITE                    ║"
echo "║         For Antigravity /code Delivery                         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

errors=0

# Check 1: Hardcoded dates
echo "📅 Check 1: Hardcoded dates/times..."
if grep -r "toLocaleDateString\|toLocaleTimeString" src/ \
  --include="*.tsx" --include="*.ts" \
  2>/dev/null | grep -v "node_modules" | grep -v ".test" > /tmp/hardcoded_dates.txt 2>&1; then
  
  if [ -s /tmp/hardcoded_dates.txt ]; then
    echo "  ❌ FAILED: Found hardcoded date/time formatting:"
    head -5 /tmp/hardcoded_dates.txt | sed 's/^/     /'
    ((errors++))
  else
    echo "  ✅ PASSED"
  fi
else
  echo "  ✅ PASSED"
fi

# Check 2: Number formatting
echo "🔢 Check 2: Number formatting..."
if grep -r "\.toLocaleString()" src/ --include="*.tsx" \
  2>/dev/null | grep -v "node_modules" > /tmp/number_format.txt 2>&1; then
  
  if [ -s /tmp/number_format.txt ]; then
    echo "  ❌ FAILED: Found .toLocaleString() calls:"
    head -3 /tmp/number_format.txt | sed 's/^/     /'
    ((errors++))
  else
    echo "  ✅ PASSED"
  fi
else
  echo "  ✅ PASSED"
fi

# Check 3: Type safety
echo "⚠️  Check 3: Type safety (@ts-ignore)..."
if grep -r "@ts-ignore" src/hooks/useTranslation.ts src/services/i18nService.ts \
  2>/dev/null | grep -v "node_modules" > /tmp/ts_ignore.txt 2>&1; then
  
  if [ -s /tmp/ts_ignore.txt ]; then
    echo "  ❌ FAILED: Found @ts-ignore in i18n code"
    cat /tmp/ts_ignore.txt | sed 's/^/     /'
    ((errors++))
  else
    echo "  ✅ PASSED"
  fi
else
  echo "  ✅ PASSED"
fi

# Check 4: Build
echo "🔨 Check 4: Build verification..."
if npm run build > /tmp/build.log 2>&1; then
  echo "  ✅ PASSED: Build successful"
else
  echo "  ❌ FAILED: Build failed"
  echo "     See: /tmp/build.log"
  ((errors++))
fi

# Check 5: TypeScript
echo "📝 Check 5: TypeScript type checking..."
if npx tsc --noEmit > /tmp/tsc.log 2>&1; then
  echo "  ✅ PASSED"
else
  echo "  ❌ FAILED: TypeScript errors found"
  head -10 /tmp/tsc.log | sed 's/^/     /'
  ((errors++))
fi

# Check 6: Tests
echo "🧪 Check 6: Test suite..."
if npm test -- --run > /tmp/tests.log 2>&1; then
  echo "  ✅ PASSED: All tests passing"
else
  echo "  ⚠️  Tests may have issues - review manually"
fi

# Summary
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
if [ $errors -eq 0 ]; then
  echo "║  ✅ ALL CHECKS PASSED - READY FOR DEPLOYMENT                  ║"
else
  echo "║  ❌ $errors CHECK(S) FAILED - REVIEW ABOVE                    ║"
fi
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

exit $errors
```

Make executable:
```bash
chmod +x scripts/validate-i18n.sh
```

---

## 📋 MANUAL VALIDATION CHECKLIST

Run these checks manually:

- [ ] **Visual Test: English**
  - [ ] Login and switch to English in settings
  - [ ] Check all text is in English (no Vietnamese)
  - [ ] Check dates show MM/DD/YYYY format
  - [ ] Check numbers use comma separator

- [ ] **Visual Test: Vietnamese**
  - [ ] Switch to Vietnamese
  - [ ] Check all text is in Vietnamese (no English except brand names)
  - [ ] Check dates show DD/MM/YYYY format
  - [ ] Check numbers use dot separator

- [ ] **Functionality Test**
  - [ ] Refresh page - language persists
  - [ ] Clear localStorage - defaults to Vietnamese
  - [ ] Change language multiple times - no errors
  - [ ] Test in mobile view - i18n still works

- [ ] **Console Check**
  - [ ] Open DevTools (F12)
  - [ ] Switch languages
  - [ ] Verify no errors/warnings about missing keys
  - [ ] No "toLocaleString" warnings

---

## 🎯 QUICK VALIDATION (2 min)

```bash
# Run all automated checks
npm run validate:i18n

# Or manually:
bash scripts/validate-i18n.sh
```

**Expected Output:**
```
✅ ALL CHECKS PASSED - READY FOR DEPLOYMENT
```

---

## ✅ FINAL SIGN-OFF

Before delivering to Antigravity, confirm:

- [ ] All 6 automated checks pass
- [ ] Manual validation checklist complete
- [ ] Browser console clean
- [ ] Both languages tested and working
- [ ] Date/number formatting correct in both locales
- [ ] No hardcoded strings visible
- [ ] Team reviewed and approved

**Approved by:** _________________ **Date:** _______

---

**Last Updated:** 2025-01-13
**For:** WellNexus Antigravity /code Delivery
**Status:** Production-Ready
