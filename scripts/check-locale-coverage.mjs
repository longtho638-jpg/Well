import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function parseLocaleFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const keys = parseLocaleFileRegex(content, filePath);

  // Also extract flat keys from misc.ts if this is vi.ts or en.ts
  // This handles the fallback pattern where orphan keys are stored as module_key in misc.ts
  if (filePath.endsWith('vi.ts') || filePath.endsWith('en.ts')) {
    const miscPath = filePath.endsWith('vi.ts')
      ? join(dirname(filePath), 'vi/misc.ts')
      : join(dirname(filePath), 'en/misc.ts');
    try {
      const miscContent = readFileSync(miscPath, 'utf-8');
      const miscKeys = parseSubModuleKeys(miscContent, 'misc');
      // Convert misc.key_name format to module.key format for matching
      // e.g., misc.agentgridcard_0x → also matches agentgridcard.0x
      for (const miscKey of miscKeys) {
        if (miscKey.includes('_')) {
          // Convert underscore to dot for alternative matching
          const keyWithoutPrefix = miscKey.replace(/^misc\./, '');
          const dotNotation = keyWithoutPrefix.replace(/_([a-zA-Z0-9])/g, (m, g) => '.' + g);
          keys.push(dotNotation);
        }
      }
    } catch { /* skip if misc.ts doesn't exist */ }
  }

  return keys;
}

function extractBalancedBraces(str, startIdx) {
  let i = startIdx;
  while (i < str.length && str[i] !== '{') i++;
  if (i >= str.length) return null;

  let depth = 1, inStr = false, strCh = '';
  const start = i;
  i++; // Skip opening brace

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

function parseFlatKeys(content, varName) {
  // Parse flat key format: key_name: "value" (used in misc.ts)
  const keys = [];
  // Match patterns like: key_name: "value" or key_name: 'value'
  const flatKeyRe = /^\s*(\w+)\s*:\s*['"`]/gm;
  let match;
  while ((match = flatKeyRe.exec(content)) !== null) {
    const key = match[1];
    // Skip if it looks like a nested object key (has children)
    // Check if this key is followed by a colon and then an opening brace
    const afterMatch = content.slice(match.index + match[0].length);
    if (!/^\s*\{/.test(afterMatch)) {
      keys.push(`${varName}.${key}`);
    }
  }
  return keys;
}

function parseSubModuleKeys(content, expectedVarName) {
  // Find ALL export const statements in the file
  const allKeys = [];
  const exportRe = /export\s+const\s+(\w+)\s*(?::[^=]*)?\s*=\s*/g;
  let match;

  while ((match = exportRe.exec(content)) !== null) {
    const varName = match[1];
    const startIdx = match.index + match[0].length;
    const objStr = extractBalancedBraces(content, startIdx);
    if (!objStr) continue;

    const parsed = parseObjectKeys(objStr);
    const innerObj = parsed[varName] || parsed;

    // Check if this is a flat structure with dot-notation keys (settings.ts style)
    // e.g., { "items.dark_mode": "...", "items.language": "..." }
    const hasDotKeys = Object.keys(innerObj).some(k => k.includes('.'));

    if (hasDotKeys) {
      // Flat keys with dot notation: prepend module name only
      // e.g., "items.dark_mode" -> "settings.items.dark_mode"
      const flatKeys = Object.keys(innerObj).map(k => `${varName}.${k}`);
      allKeys.push(...flatKeys);
    } else {
      // Check if this is a nested structure (traditional style)
      const hasNestedChildren = Object.values(innerObj).some(v => typeof v === 'object' && v !== null);
      if (hasNestedChildren) {
        // Nested structure: use flattenKeys
        const keys = flattenKeys(innerObj).map(k => `${varName}.${k}`);
        allKeys.push(...keys);
      } else {
        // Flat structure (misc.ts): extract flat keys directly
        const flatKeys = Object.keys(innerObj).map(k => `${varName}.${k}`);
        allKeys.push(...flatKeys);
      }
    }
  }

  // Fallback: if no exports found, try the original method
  if (allKeys.length === 0) {
    const exportMatch = new RegExp(`export\\s+const\\s+${expectedVarName}\\s*(?::[^=]*)?\\s*=\\s*`, 's').exec(content);
    if (exportMatch) {
      const startIdx = exportMatch.index + exportMatch[0].length;
      const objStr = extractBalancedBraces(content, startIdx);
      if (objStr) {
        const parsed = parseObjectKeys(objStr);
        const innerObj = parsed[expectedVarName] || parsed;

        // Check for dot-notation keys
        const hasDotKeys = Object.keys(innerObj).some(k => k.includes('.'));
        if (hasDotKeys) {
          return Object.keys(innerObj).map(k => `${expectedVarName}.${k}`);
        }

        const hasNestedChildren = Object.values(innerObj).some(v => typeof v === 'object' && v !== null);
        if (hasNestedChildren) {
          return flattenKeys(innerObj).map(k => `${expectedVarName}.${k}`);
        } else {
          return Object.keys(innerObj).map(k => `${expectedVarName}.${k}`);
        }
      }
    }
  }

  return allKeys;
}

function parseLocaleFileRegex(content, filePath) {
  const importMap = {};
  // Match both single and multiple named imports: import { a } from and import { a, b, c } from
  const importRe = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = importRe.exec(content)) !== null) {
    const names = m[1].split(',').map(n => n.trim());
    const path = m[2];
    for (const name of names) {
      importMap[name] = path;
    }
  }

  const allKeys = [];

  // Process spread imports (...module)
  const spreadRe = /\.\.\.(\w+)/g;
  while ((m = spreadRe.exec(content)) !== null) {
    if (importMap[m[1]]) {
      let subPath = join(dirname(filePath), importMap[m[1]]);
      if (!subPath.endsWith('.ts')) subPath += '.ts';
      try {
        const subContent = readFileSync(subPath, 'utf-8');
        const subKeys = parseSubModuleKeys(subContent, m[1]);
        allKeys.push(...subKeys);
      } catch { /* skip */ }
    }
  }

  // Process named imports (module) - NEW: read keys from imported modules
  for (const [name, path] of Object.entries(importMap)) {
    let subPath = join(dirname(filePath), path);
    if (!subPath.endsWith('.ts')) subPath += '.ts';
    try {
      const subContent = readFileSync(subPath, 'utf-8');
      const subKeys = parseSubModuleKeys(subContent, name);
      // Add keys with module prefix
      for (const key of subKeys) {
        if (!allKeys.includes(key)) {
          allKeys.push(key);
        }
      }
    } catch { /* skip */ }
  }

  return allKeys;
}

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

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.length < 4) {
    console.log('Usage: node check-locale-coverage.mjs <keys_json_file> <locale_ts_file>');
    process.exit(1);
  }
  const requiredKeys = JSON.parse(readFileSync(process.argv[2], 'utf-8'));
  const localeFile = process.argv[3];
  const missing = checkCoverage(requiredKeys, localeFile);
  if (missing.length > 0) {
    console.error(`❌ Missing ${missing.length} keys in ${localeFile}:`);
    missing.forEach(item => console.error(`  - ${item.key}`));
    process.exit(1);
  } else {
    console.log(`✅ All keys exist in ${localeFile}`);
  }
}
