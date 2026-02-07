#!/usr/bin/env node

import { extractAllTranslationKeys } from './extract-translation-keys.mjs';
import { checkCoverage } from './check-locale-coverage.mjs';

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

  try {
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
        console.log(`✅ All keys present (${requiredKeys.length} keys checked)\n`);
      }
  } catch (err) {
      console.error(`❌ Error processing ${localeFile}:`, err.message);
      hasErrors = true;
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
