import { extractAllTranslationKeys } from './extract-translation-keys.mjs';
import { checkCoverage } from './check-locale-coverage.mjs';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, basename } from 'path';

const LOCALE_FILES = ['src/locales/vi.ts', 'src/locales/en.ts'];
const EN_DIR = 'src/locales/en';
const VI_DIR = 'src/locales/vi';

function extractFlatKeysFromFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const varName = basename(filePath, '.ts');
  return extractKeysFromModule(content, varName);
}

function extractKeysFromModule(content, varName) {
  const exportRe = new RegExp(`export\\s+const\\s+${varName}\\s*(?::[^=]*)?\\s*=\\s*`, 's');
  const exportMatch = exportRe.exec(content);
  if (!exportMatch) return [];
  const startIdx = exportMatch.index + exportMatch[0].length;
  const objStr = extractBalancedBraces(content, startIdx);
  if (!objStr) return [];
  const innerObj = parseObjectKeys(objStr);
  const result = innerObj[varName] || innerObj;

  // Check if this is a flat structure with dot-notation keys (settings.ts style)
  const hasDotKeys = Object.keys(result).some(k => k.includes('.'));

  if (hasDotKeys) {
    // Flat keys with dot notation: prepend module name only
    return Object.keys(result).map(k => `${varName}.${k}`);
  } else if (hasNestedChildren(result)) {
    // Nested structure: use flattenKeys
    return flattenKeys(result).map(k => `${varName}.${k}`);
  } else {
    // Flat structure (misc.ts): return keys directly
    return Object.keys(result).map(k => `${varName}.${k}`);
  }
}

function hasNestedChildren(obj) {
  return Object.values(obj).some(v => typeof v === 'object' && v !== null);
}

function extractBalancedBraces(str, startIdx) {
  let i = startIdx;
  while (i < str.length && str[i] !== '{') i++;
  if (i >= str.length) return null;
  let depth = 1, inStr = false, strCh = '';
  const start = i;
  i++;
  for (; i < str.length; i++) {
    const ch = str[i];
    if (inStr) { if (ch === strCh && str[i-1] !== '\\') inStr = false; continue; }
    if (ch === "'" || ch === '"' || ch === '`') { inStr = true; strCh = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) return str.substring(start, i+1); }
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
    if (inner[i] === '/' && inner[i+1] === '/') { while (i < inner.length && inner[i] !== '\n') i++; continue; }
    if (inner[i] === '/' && inner[i+1] === '*') {
      i += 2;
      while (i < inner.length - 1 && !(inner[i] === '*' && inner[i+1] === '/')) i++;
      i += 2;
      continue;
    }
    if (inner[i] === '.' && inner[i+1] === '.' && inner[i+2] === '.') {
      i += 3;
      while (i < inner.length && /\w/.test(inner[i])) i++;
      continue;
    }
    let key = '';
    if (inner[i] === '"' || inner[i] === "'") {
      const q = inner[i]; i++;
      while (i < inner.length && inner[i] !== q) { if (inner[i] === '\\') i++; key += inner[i]; i++; }
      i++;
    } else if (/[\w$.]/.test(inner[i])) {
      // Support dot-notation keys like "items.dark_mode"
      while (i < inner.length && /[\w$.]/.test(inner[i])) { key += inner[i]; i++; }
    } else { i++; continue; }
    if (!key) continue;
    while (i < inner.length && /\s/.test(inner[i])) i++;
    if (i >= inner.length || inner[i] !== ':') continue;
    i++;
    while (i < inner.length && /\s/.test(inner[i])) i++;
    if (inner[i] === '{') {
      const braceStr = extractBalancedBraces(inner, i);
      if (braceStr) { result[key] = parseObjectKeys(braceStr); i += braceStr.length; }
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
    } else { keys.push(fullKey); }
  }
  return keys;
}

// Phase 1: Coverage check
console.log('Extracting translation keys from source files...\n');
const requiredKeys = extractAllTranslationKeys('src');
console.log(`Found ${requiredKeys.length} unique translation keys\n`);

let hasErrors = false;
const allMissingKeys = [];

for (const localeFile of LOCALE_FILES) {
  console.log(`Validating ${localeFile}...`);
  const missing = checkCoverage(requiredKeys, localeFile);
  if (missing.length > 0) {
    hasErrors = true;
    allMissingKeys.push(...missing.map(m => ({ file: localeFile, ...m })));
    console.error(`\nMissing ${missing.length} keys in ${localeFile}:\n`);
    // Show ALL keys (not just first 20)
    missing.forEach(item => {
      console.error(`  ${item.key}`);
      console.error(`    -> Used in: ${item.file}:${item.line}`);
    });
    console.error('');
  } else {
    console.log(`OK — all keys present (${requiredKeys.length} keys checked)\n`);
  }
}

// Write all missing keys to file for programmatic access
if (allMissingKeys.length > 0) {
  writeFileSync('/tmp/validation-missing-keys.json', JSON.stringify(allMissingKeys, null, 2));
  console.log(`\n💾 Written ${allMissingKeys.length} missing keys to /tmp/validation-missing-keys.json\n`);
}

// Phase 2: Symmetry check
if (existsSync(EN_DIR) && existsSync(VI_DIR)) {
  console.log('Checking key symmetry between en/ and vi/ sub-modules...\n');
  const enFiles = readdirSync(EN_DIR).filter(f => f.endsWith('.ts')).sort();
  const viFiles = readdirSync(VI_DIR).filter(f => f.endsWith('.ts')).sort();
  const commonFiles = enFiles.filter(f => viFiles.includes(f));
  
  for (const file of commonFiles) {
    const enKeys = new Set(extractFlatKeysFromFile(join(EN_DIR, file)));
    const viKeys = new Set(extractFlatKeysFromFile(join(VI_DIR, file)));
    const missingInVi = [...enKeys].filter(k => !viKeys.has(k));
    const missingInEn = [...viKeys].filter(k => !enKeys.has(k));
    if (missingInVi.length > 0 || missingInEn.length > 0) {
      hasErrors = true;
      if (missingInVi.length > 0) console.error(`Symmetry error in ${file}: ${missingInVi.length} key(s) in en/ missing from vi/:`);
      if (missingInEn.length > 0) console.error(`Symmetry error in ${file}: ${missingInEn.length} key(s) in vi/ missing from en/:`);
    } else {
      console.log(`OK — ${file} (${enKeys.size} keys match)`);
    }
  }
  console.log('');
}

if (hasErrors) {
  console.error('i18n validation FAILED\n');
  console.error('Fix missing/mismatched keys before committing.\n');
  process.exit(1);
} else {
  console.log('i18n validation PASSED\n');
  process.exit(0);
}

import { readdirSync } from 'fs';
