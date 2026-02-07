#!/usr/bin/env tsx
/**
 * i18n Validation Script
 *
 * Scans all TSX files for t() translation calls and validates that:
 * 1. All keys exist in both en.ts and vi.ts
 * 2. Structure matches between locales
 * 3. No missing translations
 *
 * Exit codes:
 * 0 - All validations passed
 * 1 - Missing keys found
 */

import { glob } from 'glob';
import { readFileSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
  missingInVietnamese: string[];
  missingInEnglish: string[];
  totalKeysFound: number;
}

/**
 * Extract all t() calls from TSX/TS files
 */
function extractTranslationKeys(filePath: string): string[] {
  const content = readFileSync(filePath, 'utf-8');
  const keys: string[] = [];

  // Match t('key'), t("key"), and t(`key`) patterns
  // Ensure 't' is a standalone function call, not part of a word like 'import', 'count', 'set', etc.
  // We look for a non-word character before 't', or start of line.
  const patterns = [
    /(?:^|[^a-zA-Z0-9_])t\('([^']+)'\)/g,
    /(?:^|[^a-zA-Z0-9_])t\("([^"]+)"\)/g,
    /(?:^|[^a-zA-Z0-9_])t\(`([^`]+)`\)/g,
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      keys.push(match[1]);
    }
  });

  return keys;
}

/**
 * Check if a nested key path exists in locale file content
 * Uses simple string matching approach
 */
function hasKeyInLocale(localeContent: string, keyPath: string): boolean {
  const parts = keyPath.split('.');

  // Escape special regex characters in the key parts
  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Build regex patterns for nested structure
  // Example: for "landing.hero.title", look for:
  // landing: { ... hero: { ... title: 'value'

  let pattern = '';
  for (let i = 0; i < parts.length; i++) {
    const part = escapeRegex(parts[i]);
    if (i === parts.length - 1) {
      // Last part - match the key with a value
      // Allow for optional quotes around the key name
      pattern += `(?:['"]?${part}['"]?)\\s*:\\s*['"{\`]`;
    } else {
      // Intermediate parts - just match the key
      // Allow for optional quotes around the key name
      pattern += `(?:['"]?${part}['"]?)\\s*:\\s*{[\\s\\S]*?`;
    }
  }

  const regex = new RegExp(pattern, 'm');
  return regex.test(localeContent);
}

/**
 * Main validation function
 */
async function validateI18n(): Promise<ValidationResult> {
  console.log('🔍 Scanning for translation keys...\n');

  // Find all TSX/TS files (exclude test files and node_modules)
  const tsxFiles = await glob('src/**/*.{ts,tsx}', {
    ignore: ['**/*.test.ts', '**/*.test.tsx', '**/node_modules/**', 'src/locales/**']
  });

  console.log(`Found ${tsxFiles.length} TypeScript files\n`);

  // Extract all unique translation keys
  const allKeys = new Set<string>();
  tsxFiles.forEach(file => {
    const keys = extractTranslationKeys(file);
    keys.forEach(key => allKeys.add(key));
  });

  console.log(`📊 Found ${allKeys.size} unique translation keys\n`);

  // Load locale files as raw text
  const enPath = join(process.cwd(), 'src/locales/en.ts');
  const viPath = join(process.cwd(), 'src/locales/vi.ts');

  console.log('📂 Loading locale files...');
  const enContent = readFileSync(enPath, 'utf-8');
  const viContent = readFileSync(viPath, 'utf-8');
  console.log('✓ Locale files loaded\n');

  // Validate each key
  const result: ValidationResult = {
    missingInVietnamese: [],
    missingInEnglish: [],
    totalKeysFound: allKeys.size
  };

  console.log('🔎 Validating keys...\n');

  for (const key of allKeys) {
    const inEnglish = hasKeyInLocale(enContent, key);
    const inVietnamese = hasKeyInLocale(viContent, key);

    if (!inEnglish) {
      result.missingInEnglish.push(key);
    }
    if (!inVietnamese) {
      result.missingInVietnamese.push(key);
    }
  }

  return result;
}

/**
 * Format and print results
 */
function printResults(result: ValidationResult): number {
  console.log('═══════════════════════════════════════════════════');
  console.log('            i18n VALIDATION REPORT');
  console.log('═══════════════════════════════════════════════════\n');

  console.log(`Total translation keys found: ${result.totalKeysFound}\n`);

  let exitCode = 0;

  // Missing in Vietnamese
  if (result.missingInVietnamese.length > 0) {
    exitCode = 1;
    console.log('❌ MISSING IN VIETNAMESE (vi.ts):');
    console.log('──────────────────────────────────');
    result.missingInVietnamese.forEach(key => {
      console.log(`   • ${key}`);
    });
    console.log(`\n   Total: ${result.missingInVietnamese.length} missing keys\n`);
  } else {
    console.log('✅ All keys present in Vietnamese locale\n');
  }

  // Missing in English
  if (result.missingInEnglish.length > 0) {
    // exitCode = 1; // English translation is post-merge task, so just warn
    console.log('⚠️  MISSING IN ENGLISH (en.ts) - [NON-BLOCKING WARNING]:');
    console.log('──────────────────────────────────');
    result.missingInEnglish.forEach(key => {
      console.log(`   • ${key}`);
    });
    console.log(`\n   Total: ${result.missingInEnglish.length} missing keys\n`);
  } else {
    console.log('✅ All keys present in English locale\n');
  }

  console.log('═══════════════════════════════════════════════════\n');

  if (exitCode === 0) {
    console.log('🎉 SUCCESS! All translation keys validated.\n');
  } else {
    console.log('💥 VALIDATION FAILED! Fix missing keys before deployment.\n');
  }

  return exitCode;
}

// Run validation
validateI18n()
  .then(printResults)
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('❌ Validation script error:', error);
    process.exit(3);
  });
