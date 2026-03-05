import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function parseLocaleFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  return parseLocaleFileRegex(content, filePath);
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
    } else if (/[\w$]/.test(inner[i])) {
      while (i < inner.length && /[\w$]/.test(inner[i])) { key += inner[i]; i++; }
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
    const keys = flattenKeys(innerObj).map(k => `${varName}.${k}`);
    allKeys.push(...keys);
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
        return flattenKeys(innerObj).map(k => `${expectedVarName}.${k}`);
      }
    }
  }

  return allKeys;
}

function parseLocaleFileRegex(content, filePath) {
  const importMap = {};
  const importRe = /import\s+\{\s*(\w+)\s*\}\s+from\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = importRe.exec(content)) !== null) {
    importMap[m[1]] = m[2];
  }
  const spreadRe = /\.\.\.(\w+)/g;
  const spreads = [];
  while ((m = spreadRe.exec(content)) !== null) {
    if (importMap[m[1]]) spreads.push(m[1]);
  }
  if (spreads.length > 0) {
    const allKeys = [];
    for (const name of spreads) {
      let subPath = join(dirname(filePath), importMap[name]);
      if (!subPath.endsWith('.ts')) subPath += '.ts';
      try {
        const subContent = readFileSync(subPath, 'utf-8');
        const subKeys = parseSubModuleKeys(subContent, name);
        allKeys.push(...subKeys);
      } catch { /* skip */ }
    }
    return allKeys;
  }
  return [];
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
