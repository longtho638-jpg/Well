#!/usr/bin/env node

/**
 * i18n Validation Script
 *
 * Two-phase validation:
 * 1. Coverage check — ensures all t('key') calls in source have matching entries in en.ts and vi.ts
 * 2. Symmetry check — ensures en/ and vi/ sub-module files define the same keys
 *
 * Exit code 1 on any failure, 0 on success.
 */

import { extractAllTranslationKeys } from './extract-translation-keys.mjs';
import { checkCoverage } from './check-locale-coverage.mjs';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, basename } from 'path';

const LOCALE_FILES = [
  'src/locales/vi.ts',
  'src/locales/en.ts',
];

const EN_DIR = 'src/locales/en';
const VI_DIR = 'src/locales/vi';

// ─── Phase 1: Coverage check ──────────────────────────────────────────────────

console.log('Extracting translation keys from source files...\n');

const requiredKeys = extractAllTranslationKeys('src');

console.log(`Found ${requiredKeys.length} unique translation keys\n`);

let hasErrors = false;

for (const localeFile of LOCALE_FILES) {
  console.log(`Validating ${localeFile}...`);

  try {
    const missing = checkCoverage(requiredKeys, localeFile);

    if (missing.length > 0) {
      hasErrors = true;
      console.error(`\nMissing ${missing.length} keys in ${localeFile}:\n`);

      missing.forEach(item => {
        console.error(`  ${item.key}`);
        console.error(`    -> Used in: ${item.file}:${item.line}`);
      });
      console.error('');
    } else {
      console.log(`OK — all keys present (${requiredKeys.length} keys checked)\n`);
    }
  } catch (err) {
    console.error(`Error processing ${localeFile}:`, err.message);
    hasErrors = true;
  }
}

// ─── Phase 2: Symmetry check between en/ and vi/ sub-modules ─────────────────

if (existsSync(EN_DIR) && existsSync(VI_DIR)) {
  console.log('Checking key symmetry between en/ and vi/ sub-modules...\n');

  const enFiles = readdirSync(EN_DIR).filter(f => f.endsWith('.ts')).sort();
  const viFiles = readdirSync(VI_DIR).filter(f => f.endsWith('.ts')).sort();

  // Check for files missing in either directory
  const enSet = new Set(enFiles);
  const viSet = new Set(viFiles);

  for (const f of enFiles) {
    if (!viSet.has(f)) {
      console.error(`Symmetry error: ${EN_DIR}/${f} exists but ${VI_DIR}/${f} is missing`);
      hasErrors = true;
    }
  }
  for (const f of viFiles) {
    if (!enSet.has(f)) {
      console.error(`Symmetry error: ${VI_DIR}/${f} exists but ${EN_DIR}/${f} is missing`);
      hasErrors = true;
    }
  }

  // Compare keys file by file
  const commonFiles = enFiles.filter(f => viSet.has(f));
  for (const file of commonFiles) {
    const enPath = join(EN_DIR, file);
    const viPath = join(VI_DIR, file);

    try {
      const enKeys = new Set(extractFlatKeysFromFile(enPath));
      const viKeys = new Set(extractFlatKeysFromFile(viPath));

      const missingInVi = [...enKeys].filter(k => !viKeys.has(k));
      const missingInEn = [...viKeys].filter(k => !enKeys.has(k));

      if (missingInVi.length > 0) {
        hasErrors = true;
        console.error(`Symmetry error in ${file}: ${missingInVi.length} key(s) in en/ missing from vi/:`);
        missingInVi.forEach(k => console.error(`  - ${k}`));
        console.error('');
      }
      if (missingInEn.length > 0) {
        hasErrors = true;
        console.error(`Symmetry error in ${file}: ${missingInEn.length} key(s) in vi/ missing from en/:`);
        missingInEn.forEach(k => console.error(`  - ${k}`));
        console.error('');
      }
      if (missingInVi.length === 0 && missingInEn.length === 0) {
        console.log(`OK — ${file} (${enKeys.size} keys match)`);
      }
    } catch (err) {
      console.error(`Error comparing ${file}: ${err.message}`);
      hasErrors = true;
    }
  }

  console.log('');
}

// ─── Final result ─────────────────────────────────────────────────────────────

if (hasErrors) {
  console.error('i18n validation FAILED\n');
  console.error('Fix missing/mismatched keys before committing.\n');
  process.exit(1);
} else {
  console.log('i18n validation PASSED\n');
  process.exit(0);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract flat dot-notation keys from a TypeScript locale sub-module file.
 * Reuses the same regex-based parser logic as check-locale-coverage.mjs
 * but without the full dependency chain (avoids circular import issues).
 */
function extractFlatKeysFromFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const varName = basename(filePath, '.ts'); // e.g. admin, common, network
  return extractKeysFromModule(content, varName);
}

function extractKeysFromModule(content, varName) {
  // Match: export const <varName> [: SomeType] = {
  const exportRe = new RegExp(
    `export\\s+const\\s+${varName}\\s*(?::[^=]*)?\\s*=\\s*`,
    's'
  );
  const exportMatch = exportRe.exec(content);
  if (!exportMatch) return [];

  const startIdx = exportMatch.index + exportMatch[0].length;
  const objStr = extractBalancedBraces(content, startIdx);
  if (!objStr) return [];

  return flattenKeys(parseObjectKeys(objStr));
}

function extractBalancedBraces(str, startIdx) {
  let i = startIdx;
  while (i < str.length && str[i] !== '{') i++;
  if (i >= str.length) return null;

  let depth = 0;
  let inStr = false;
  let strCh = '';
  const start = i;

  for (; i < str.length; i++) {
    const ch = str[i];
    if (inStr) {
      if (ch === strCh && str[i - 1] !== '\\') inStr = false;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      inStr = true;
      strCh = ch;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return str.substring(start, i + 1);
    }
  }
  return null;
}

function parseObjectKeys(objStr) {
  const result = {};
  const inner = objStr.slice(1, -1);
  let i = 0;

  while (i < inner.length) {
    while (i < inner.length && /[\s,]/.test(inner[i])) i++;
    if (i >= inner.length) break;

    // Skip single-line comments
    if (inner[i] === '/' && inner[i + 1] === '/') {
      while (i < inner.length && inner[i] !== '\n') i++;
      continue;
    }
    // Skip block comments
    if (inner[i] === '/' && inner[i + 1] === '*') {
      i += 2;
      while (i < inner.length - 1 && !(inner[i] === '*' && inner[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    // Skip spread operators
    if (inner[i] === '.' && inner[i + 1] === '.' && inner[i + 2] === '.') {
      i += 3;
      while (i < inner.length && /\w/.test(inner[i])) i++;
      continue;
    }

    // Parse key
    let key = '';
    if (inner[i] === '"' || inner[i] === "'") {
      const q = inner[i]; i++;
      while (i < inner.length && inner[i] !== q) {
        if (inner[i] === '\\') i++;
        key += inner[i]; i++;
      }
      i++;
    } else if (/[\w$]/.test(inner[i])) {
      while (i < inner.length && /[\w$]/.test(inner[i])) { key += inner[i]; i++; }
    } else {
      i++; continue;
    }

    if (!key) continue;

    while (i < inner.length && /\s/.test(inner[i])) i++;
    if (i >= inner.length || inner[i] !== ':') continue;
    i++;
    while (i < inner.length && /\s/.test(inner[i])) i++;

    if (inner[i] === '{') {
      const braceStr = extractBalancedBraces(inner, i);
      if (braceStr) {
        result[key] = parseObjectKeys(braceStr);
        i += braceStr.length;
      }
    } else {
      result[key] = 'VALUE';
      if (inner[i] === "'" || inner[i] === '"' || inner[i] === '`') {
        const q = inner[i]; i++;
        while (i < inner.length && inner[i] !== q) { if (inner[i] === '\\') i++; i++; }
        i++;
      } else {
        while (i < inner.length && inner[i] !== ',' && inner[i] !== '}') i++;
      }
    }
  }

  return result;
}

function flattenKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}
