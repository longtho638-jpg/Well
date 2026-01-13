/**
 * i18n Gap Analysis Script - 100x Deep Clean
 * Finds ALL keys used in codebase but missing from locale file
 */

import * as fs from 'fs';

// Read all keys used in codebase
const codebaseKeys = fs.readFileSync('/tmp/all_keys.txt', 'utf-8')
    .split('\n')
    .filter(Boolean)
    .filter(k => k.includes('.') && !k.startsWith('.'));

// Read locale file content
const localeContent = fs.readFileSync('src/locales/vi.ts', 'utf-8');

// Check each key
const missingKeys: { section: string; key: string }[] = [];
const existingKeys: string[] = [];

for (const fullKey of codebaseKeys) {
    const [section, key] = fullKey.split('.');
    if (!section || !key) continue;

    // Check if key exists in locale file
    // Look for patterns like "key:" or "'key':"
    const keyPattern1 = new RegExp(`['"]?${key}['"]?\\s*:`);
    const sectionPattern = new RegExp(`${section}:\\s*\\{`);

    // Find section in file
    const sectionMatch = localeContent.match(sectionPattern);
    if (!sectionMatch) {
        missingKeys.push({ section, key });
        continue;
    }

    // Try to find the key within that section context
    const sectionStart = localeContent.indexOf(sectionMatch[0]);
    const nextSection = localeContent.indexOf('\n  // ', sectionStart + 1);
    const sectionEnd = nextSection > 0 ? nextSection : localeContent.length;
    const sectionContent = localeContent.slice(sectionStart, sectionEnd);

    if (!keyPattern1.test(sectionContent)) {
        missingKeys.push({ section, key });
    } else {
        existingKeys.push(fullKey);
    }
}

// Group missing keys by section
const missingSections: Record<string, string[]> = {};
for (const { section, key } of missingKeys) {
    if (!missingSections[section]) missingSections[section] = [];
    if (!missingSections[section].includes(key)) {
        missingSections[section].push(key);
    }
}

// Output report
console.log('='.repeat(60));
console.log('i18n GAP ANALYSIS REPORT - 100x Deep Clean');
console.log('='.repeat(60));
console.log(`\nTotal keys in codebase: ${codebaseKeys.length}`);
console.log(`Keys found in locale: ${existingKeys.length}`);
console.log(`MISSING keys: ${missingKeys.length}`);
console.log(`Missing sections: ${Object.keys(missingSections).length}`);
console.log('\n' + '='.repeat(60));
console.log('MISSING KEYS BY SECTION:');
console.log('='.repeat(60));

for (const [section, keys] of Object.entries(missingSections).sort()) {
    console.log(`\n// ${section} - ${keys.length} missing`);
    for (const key of keys.sort()) {
        console.log(`  ${key}: '',`);
    }
}

// Generate TypeScript additions
console.log('\n\n' + '='.repeat(60));
console.log('TYPESCRIPT ADDITIONS TO MERGE:');
console.log('='.repeat(60));

for (const [section, keys] of Object.entries(missingSections).sort()) {
    console.log(`\n  // Add to ${section} section:`);
    for (const key of keys.sort()) {
        // Convert key to readable text
        let text = key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .trim();
        console.log(`    ${key}: '${text}',`);
    }
}
