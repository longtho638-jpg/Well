# Phase 02: i18n Sync & Validation

## Context

**CRITICAL ISSUE:** Production deployments have shown raw translation keys (e.g., `landing.roadmap.stages.metropolis.name`) instead of translated text. This occurs when code references translation keys that don't exist in locale files, or when key paths are mismatched.

**Current State:**
- i18n system using `react-i18next`
- Translation files: `src/locales/vi.ts`, `src/locales/en.ts`
- No automated validation between code `t()` calls and locale files
- Manual sync process error-prone

**Target State:**
- 100% translation key coverage verified before build
- Automated CI/CD validation prevents missing keys
- Pre-commit hook catches mismatches early
- Runtime fallback system prevents raw keys in production

## Requirements

### Functional Requirements
- **FR-01:** Extract all `t('key.path')` calls from codebase
- **FR-02:** Validate each key exists in ALL locale files (vi.ts, en.ts)
- **FR-03:** Verify key path structure matches between code and locales
- **FR-04:** Report missing keys with file location and line number
- **FR-05:** Block build if validation fails (CI/CD integration)

### Non-Functional Requirements
- **NFR-01:** Validation script runtime < 5 seconds
- **NFR-02:** Pre-commit hook adds < 1 second to commit time
- **NFR-03:** Zero false positives in key detection
- **NFR-04:** Support nested key paths (e.g., `a.b.c.d.e`)

## Architecture

### Validation Pipeline

```
┌──────────────┐
│ Source Files │
│  (*.tsx)     │
└──────┬───────┘
       │
       │ Extract t() calls
       ▼
┌──────────────────┐
│ Translation Keys │
│ ['auth.login',   │
│  'nav.home']     │
└──────┬───────────┘
       │
       │ Check existence
       ▼
┌──────────────────┐
│ Locale Files     │
│ vi.ts, en.ts     │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Validation Report│
│ Missing: 0       │
│ Status: PASS ✓   │
└──────────────────┘
```

### File Structure

```
scripts/
├── validate-i18n-keys.mjs           # Main validation script
├── extract-translation-keys.mjs     # Extract t() calls from code
└── check-locale-coverage.mjs        # Check key coverage

.husky/
└── pre-commit                       # Git hook runs validation

.github/
└── workflows/
    └── ci.yml                       # CI adds i18n validation step
```

## Implementation Steps

### Step 1: Create Translation Key Extractor

**File:** `scripts/extract-translation-keys.mjs`

```javascript
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Recursively find all .tsx and .ts files in src/
 */
function findSourceFiles(dir, files = []) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (!entry.startsWith('.') && entry !== 'node_modules') {
        findSourceFiles(fullPath, files);
      }
    } else if (/\.(tsx?|jsx?)$/.test(entry)) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Extract all t('key') calls from file content
 */
function extractKeysFromContent(content, filePath) {
  const keys = [];

  // Match: t('key.path') or t("key.path")
  const tFunctionPattern = /\bt\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  let match;
  while ((match = tFunctionPattern.exec(content)) !== null) {
    keys.push({
      key: match[1],
      file: filePath,
      line: content.substring(0, match.index).split('\n').length,
    });
  }

  return keys;
}

/**
 * Main extraction function
 */
export function extractAllTranslationKeys(srcDir = 'src') {
  const files = findSourceFiles(srcDir);
  const allKeys = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const keys = extractKeysFromContent(content, file);
    allKeys.push(...keys);
  }

  // Deduplicate by key name (keep first occurrence)
  const uniqueKeys = [];
  const seen = new Set();

  for (const item of allKeys) {
    if (!seen.has(item.key)) {
      seen.add(item.key);
      uniqueKeys.push(item);
    }
  }

  return uniqueKeys;
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const keys = extractAllTranslationKeys();
  console.log(JSON.stringify(keys, null, 2));
  console.log(`\nTotal unique keys: ${keys.length}`);
}
```

### Step 2: Create Locale Coverage Checker

**File:** `scripts/check-locale-coverage.mjs`

```javascript
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Parse TypeScript locale file and extract all keys
 */
function parseLocaleFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');

  // Extract the exported object (simple regex approach)
  // For complex cases, consider using @babel/parser
  const objMatch = content.match(/export\s+(?:default\s+)?(\{[\s\S]+\});?/);

  if (!objMatch) {
    throw new Error(`Cannot parse locale file: ${filePath}`);
  }

  // Evaluate the object (SAFE: only our locale files)
  const localeData = eval(`(${objMatch[1]})`);

  return flattenKeys(localeData);
}

/**
 * Flatten nested object to dot-notation keys
 * { auth: { login: 'text' } } → ['auth.login']
 */
function flattenKeys(obj, prefix = '') {
  const keys = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

/**
 * Check if all required keys exist in locale
 */
export function checkCoverage(requiredKeys, localeFile) {
  const availableKeys = new Set(parseLocaleFile(localeFile));
  const missing = [];

  for (const item of requiredKeys) {
    if (!availableKeys.has(item.key)) {
      missing.push(item);
    }
  }

  return missing;
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const requiredKeys = JSON.parse(readFileSync(process.argv[2], 'utf-8'));
  const localeFile = process.argv[3];

  const missing = checkCoverage(requiredKeys, localeFile);

  if (missing.length > 0) {
    console.error(`❌ Missing ${missing.length} keys in ${localeFile}:`);
    missing.forEach(item => {
      console.error(`  - ${item.key} (used in ${item.file}:${item.line})`);
    });
    process.exit(1);
  } else {
    console.log(`✅ All keys exist in ${localeFile}`);
  }
}
```

### Step 3: Create Main Validation Script

**File:** `scripts/validate-i18n-keys.mjs`

```javascript
#!/usr/bin/env node

import { extractAllTranslationKeys } from './extract-translation-keys.mjs';
import { checkCoverage } from './check-locale-coverage.mjs';
import { join } from 'path';

const LOCALE_FILES = [
  'src/locales/vi.ts',
  'src/locales/en.ts',
];

console.log('🔍 Extracting translation keys from source files...\n');

const requiredKeys = extractAllTranslationKeys('src');

console.log(`📝 Found ${requiredKeys.length} unique translation keys\n`);

let hasErrors = false;

for (const localeFile of LOCALE_FILES) {
  console.log(`🌍 Validating ${localeFile}...`);

  const missing = checkCoverage(requiredKeys, localeFile);

  if (missing.length > 0) {
    hasErrors = true;
    console.error(`\n❌ Missing ${missing.length} keys in ${localeFile}:\n`);

    missing.forEach(item => {
      console.error(`  ${item.key}`);
      console.error(`    → Used in: ${item.file}:${item.line}`);
    });
    console.error('');
  } else {
    console.log(`✅ All keys present (${requiredKeys.length} keys)\n`);
  }
}

if (hasErrors) {
  console.error('❌ i18n validation FAILED\n');
  console.error('Fix missing keys before committing.\n');
  process.exit(1);
} else {
  console.log('✅ i18n validation PASSED\n');
  process.exit(0);
}
```

### Step 4: Add Pre-commit Hook

**File:** `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run i18n validation before commit
echo "🔍 Validating i18n keys..."
node scripts/validate-i18n-keys.mjs || {
  echo ""
  echo "❌ Commit blocked: i18n validation failed"
  echo "Fix missing translation keys before committing"
  exit 1
}

# Run linting (existing)
npm run lint-staged
```

### Step 5: Update CI/CD Pipeline

**File:** `.github/workflows/ci.yml` (add validation step)

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      # NEW: i18n validation step
      - name: Validate i18n keys
        run: node scripts/validate-i18n-keys.mjs

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build
```

### Step 6: Add Runtime Fallback (Safety Net)

**File:** `src/lib/i18n.ts` (enhance existing)

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import vi from '@/locales/vi';
import en from '@/locales/en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: vi },
      en: { translation: en },
    },
    lng: 'vi',
    fallbackLng: 'en',

    // NEW: Runtime key validation
    saveMissing: true,
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      console.error(`❌ Missing translation key: ${key}`);

      // Log to error tracking (Sentry, etc.)
      if (import.meta.env.PROD) {
        // reportError(new Error(`Missing i18n key: ${key}`));
      }

      // Return fallback instead of raw key
      return fallbackValue || key.split('.').pop() || 'Translation missing';
    },

    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

export default i18n;
```

### Step 7: Create NPM Scripts

**File:** `package.json` (add scripts)

```json
{
  "scripts": {
    "i18n:validate": "node scripts/validate-i18n-keys.mjs",
    "i18n:extract": "node scripts/extract-translation-keys.mjs",
    "i18n:check": "node scripts/check-locale-coverage.mjs",
    "prebuild": "npm run i18n:validate",
    "pretest": "npm run i18n:validate"
  }
}
```

### Step 8: Fix Existing Key Mismatches

**Action:** Run validation and fix reported issues

```bash
# Run validation
npm run i18n:validate

# Example output:
# ❌ Missing keys in src/locales/vi.ts:
#   - landing.roadmap.stages.metropolis.name
#     → Used in: src/pages/Landing.tsx:145

# Fix: Update vi.ts
# Before: landing.roadmap.stages.empire.name
# After: landing.roadmap.stages.metropolis.name
```

### Step 9: Add VSCode Integration (Optional)

**File:** `.vscode/tasks.json`

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Validate i18n Keys",
      "type": "shell",
      "command": "npm run i18n:validate",
      "group": {
        "kind": "build",
        "isDefault": false
      },
      "presentation": {
        "reveal": "always",
        "panel": "new"
      },
      "problemMatcher": []
    }
  ]
}
```

### Step 10: Write Tests

**File:** `scripts/__tests__/validate-i18n-keys.test.mjs`

```javascript
import { describe, it, expect } from 'vitest';
import { extractAllTranslationKeys } from '../extract-translation-keys.mjs';
import { checkCoverage } from '../check-locale-coverage.mjs';

describe('i18n Validation', () => {
  it('should extract t() calls from source files', () => {
    const keys = extractAllTranslationKeys('src');
    expect(keys.length).toBeGreaterThan(0);
    expect(keys[0]).toHaveProperty('key');
    expect(keys[0]).toHaveProperty('file');
    expect(keys[0]).toHaveProperty('line');
  });

  it('should detect missing keys in locale file', () => {
    const requiredKeys = [
      { key: 'existing.key', file: 'test.tsx', line: 1 },
      { key: 'nonexistent.key', file: 'test.tsx', line: 2 },
    ];

    const missing = checkCoverage(requiredKeys, 'src/locales/vi.ts');

    expect(missing).toContainEqual(
      expect.objectContaining({ key: 'nonexistent.key' })
    );
  });

  it('should handle nested key paths', () => {
    const keys = [
      { key: 'auth.login.title', file: 'test.tsx', line: 1 },
      { key: 'a.b.c.d.e', file: 'test.tsx', line: 2 },
    ];

    const missing = checkCoverage(keys, 'src/locales/vi.ts');
    // Should not throw error on deep nesting
    expect(Array.isArray(missing)).toBe(true);
  });
});
```

## Verification & Success Criteria

### Automated Tests

```bash
# Run validation tests
npm test -- scripts/__tests__/validate-i18n-keys.test.mjs

# Expected: All tests pass
```

### Manual Verification

1. **Extract Keys Test:**
   ```bash
   npm run i18n:extract

   # Expected output (JSON array):
   # [
   #   { "key": "auth.login", "file": "src/pages/Login.tsx", "line": 42 },
   #   { "key": "nav.home", "file": "src/components/Nav.tsx", "line": 15 },
   #   ...
   # ]
   ```

2. **Validation Test:**
   ```bash
   npm run i18n:validate

   # Expected (if keys match):
   # ✅ All keys present in src/locales/vi.ts (150 keys)
   # ✅ All keys present in src/locales/en.ts (150 keys)
   # ✅ i18n validation PASSED

   # Expected (if keys missing):
   # ❌ Missing 2 keys in src/locales/vi.ts:
   #   landing.roadmap.stages.metropolis.name
   #     → Used in: src/pages/Landing.tsx:145
   # ❌ i18n validation FAILED
   ```

3. **Pre-commit Hook Test:**
   ```bash
   # Add a file with missing key
   echo "t('test.missing.key')" >> src/test.tsx
   git add src/test.tsx
   git commit -m "test"

   # Expected:
   # 🔍 Validating i18n keys...
   # ❌ Missing keys in src/locales/vi.ts:
   #   test.missing.key
   # ❌ Commit blocked: i18n validation failed
   ```

4. **CI/CD Test:**
   - Create PR with missing translation key
   - Expected: GitHub Actions fails at "Validate i18n keys" step
   - Fix keys and push again
   - Expected: CI passes

5. **Browser Test:**
   ```bash
   npm run build
   npm run preview

   # Open http://localhost:4173
   # Navigate through all pages
   # Expected: NO raw keys visible (no "landing.roadmap.stages.X")
   # Check browser console for "Missing translation key" warnings
   ```

### Success Criteria Checklist

- [ ] Extraction script finds all `t()` calls in src/
- [ ] Coverage checker validates against all locale files
- [ ] Main validation script exits with code 1 on missing keys
- [ ] Pre-commit hook blocks commits with missing keys
- [ ] GitHub Actions includes i18n validation step
- [ ] Runtime fallback prevents raw keys from showing
- [ ] All existing key mismatches fixed
- [ ] NPM scripts added: `i18n:validate`, `i18n:extract`
- [ ] Tests pass (3+ tests for validation utilities)
- [ ] Documentation updated with validation workflow

### Performance Benchmarks

```bash
# Validation speed test
time npm run i18n:validate

# Target: < 5 seconds (typical: 1-2s for 150 keys)
```

### Coverage Report

```bash
# Generate coverage report
npm run i18n:validate > i18n-report.txt

# Example report:
# 📝 Found 150 unique translation keys
# 🌍 Validating src/locales/vi.ts...
# ✅ All keys present (150 keys)
# 🌍 Validating src/locales/en.ts...
# ✅ All keys present (150 keys)
# ✅ i18n validation PASSED
```

## Rollback Plan

If validation causes issues:

1. **Disable pre-commit hook:**
   ```bash
   chmod -x .husky/pre-commit
   ```

2. **Remove CI validation step:**
   ```yaml
   # Comment out in .github/workflows/ci.yml
   # - name: Validate i18n keys
   #   run: node scripts/validate-i18n-keys.mjs
   ```

3. **Bypass validation (emergency):**
   ```bash
   git commit --no-verify -m "message"
   ```

4. **Revert changes:**
   ```bash
   git revert HEAD
   git push origin main
   ```

## Next Steps

After Phase 2 completion:
- Proceed to Phase 3 (PWA Enhancement)
- Monitor for 24h to ensure no false positives
- Update team documentation on i18n workflow
- Consider adding translation key linter for VSCode

---

**Estimated Effort:** 2 hours
**Dependencies:** Node.js, Husky (git hooks), GitHub Actions
**Risk Level:** Low (validation scripts are read-only, safe to run)
